#!/usr/bin/env python3
"""
WK-170 · Nightly enrichment job
==================================
Iterates rows missing contact info AND with a non-OSM source_url, fetches
each page, extracts phone / email / website via regex, and updates the row.

Skips OSM-derived rows (where source_url is openstreetmap.org/*) — the data
is already extracted from OSM tags at import time, fetching the OSM display
page adds nothing.

Designed to run after the nightly import workflow (02:00 UTC) at 03:00 UTC
so newly-imported rows can also benefit from the same pass.

Caps per run at MAX_ROWS to fit GH Actions time budget. Re-running is safe;
it skips rows already enriched.

Env vars:
  SUPABASE_URL          — required
  SUPABASE_SERVICE_KEY  — required (service role for writes)
  WK_ENRICH_MAX_ROWS    — optional cap, default 2500
  WK_ENRICH_TIMEOUT_S   — optional per-fetch timeout, default 8
"""

from __future__ import annotations
import os, re, sys, time, json, logging
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("enrich")

# ── Config ────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]
MAX_ROWS     = int(os.environ.get("WK_ENRICH_MAX_ROWS", 2500))
TIMEOUT_S    = int(os.environ.get("WK_ENRICH_TIMEOUT_S", 8))
WORKERS      = int(os.environ.get("WK_ENRICH_WORKERS", 12))

UA = "WanderkindBot/1.0 (+https://wanderkind.love; data@wanderkind.love)"

# ── Regex extractors (copied from framework.py for self-containment) ─────
RE_PHONE   = re.compile(r"(?:tel:)?\s*(\+?\d[\d\s().\-]{6,}\d)", re.IGNORECASE)
RE_EMAIL   = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
RE_WEBSITE = re.compile(r"https?://[A-Za-z0-9./:_\-?=&%]+", re.IGNORECASE)
BAD_DOMAINS = (
    "schema.org", "w3.org", "facebook.com/sharer", "twitter.com/intent",
    "instagram.com/explore", "google.com/maps", "google-analytics", "googletagmanager",
    "openstreetmap.org",
)


# ── Supabase REST client ──────────────────────────────────────────────────
def sb_get(table: str, params: str) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def sb_patch(table: str, where: str, payload: dict) -> None:
    url = f"{SUPABASE_URL}/rest/v1/{table}?{where}"
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, method="PATCH", headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        r.read()  # discard


# ── Page fetch + extract ──────────────────────────────────────────────────
def fetch_and_extract(row: dict) -> dict:
    """Returns dict of fields to update (or {} if nothing new)."""
    src = row.get("source_url")
    if not src or "openstreetmap.org" in src:
        return {}
    try:
        req = urllib.request.Request(src, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            text = r.read(800_000).decode("utf-8", errors="ignore")
    except Exception:
        return {}

    update = {}
    if not row.get("phone"):
        m = RE_PHONE.search(text)
        if m:
            cand = re.sub(r"\s+", " ", m.group(1)).strip()
            digits = re.sub(r"\D", "", cand)
            if 7 <= len(digits) <= 16:
                update["phone"] = cand
    if not row.get("email"):
        m = RE_EMAIL.search(text)
        if m and not m.group(0).lower().endswith((".png", ".jpg", ".gif")):
            update["email"] = m.group(0)
    if not row.get("website"):
        for m in RE_WEBSITE.finditer(text):
            url2 = m.group(0).rstrip(".,;)\"'")
            if any(b in url2 for b in BAD_DOMAINS):
                continue
            if url2 == src:
                continue
            update["website"] = url2
            break
    return update


# ── Quality score recompute helper ───────────────────────────────────────
def quality_score(row: dict, after: dict) -> int:
    phone   = after.get("phone")   or row.get("phone")
    email   = after.get("email")   or row.get("email")
    website = after.get("website") or row.get("website")
    desc    = row.get("description") or ""
    s = 0
    if phone or email:                   s += 20
    if website or row.get("source_url"): s += 20
    if len(desc) >= 50:                  s += 15
    if (row.get("capacity") or 0) > 0:   s += 15
    if row.get("opening_months"):        s += 15
    if row.get("last_confirmed"):        s += 5
    return min(100, s)


# ── Main ──────────────────────────────────────────────────────────────────
def main() -> int:
    log.info(f"Pulling up to {MAX_ROWS} candidate rows…")
    select = "id,source_url,phone,email,website,description,capacity,opening_months,last_confirmed"
    # PostgREST: rows with non-OSM source_url, missing at least one contact field
    params = (
        f"select={select}"
        f"&source_url=not.is.null"
        f"&source_url=not.like.*openstreetmap.org*"
        f"&or=(phone.is.null,email.is.null,website.is.null)"
        f"&order=quality_score.asc.nullsfirst,last_imported_at.desc"
        f"&limit={MAX_ROWS}"
    )
    rows = sb_get("hosts", params)
    log.info(f"Got {len(rows)} candidates")
    if not rows:
        log.info("Nothing to enrich — done")
        return 0

    enriched = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(fetch_and_extract, r): r for r in rows}
        for fut in as_completed(futures):
            r = futures[fut]
            try:
                update = fut.result()
            except Exception as e:
                log.warning(f"  fetch fail {r['id']}: {e}")
                continue
            if not update:
                continue
            update["quality_score"] = quality_score(r, update)
            try:
                sb_patch("hosts", f"id=eq.{r['id']}", update)
                enriched += 1
                if enriched % 50 == 0:
                    log.info(f"  enriched {enriched} so far…")
            except Exception as e:
                log.warning(f"  patch fail {r['id']}: {e}")

    elapsed = time.time() - t0
    log.info(f"DONE: enriched {enriched}/{len(rows)} rows in {elapsed:.0f}s "
             f"(rate {enriched/max(1,elapsed):.1f}/s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
