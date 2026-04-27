#!/usr/bin/env python3
"""
WK-170 v2 · Nightly enrichment job
====================================
Smarter targeting: rows that ALREADY have a website (typically from OSM
contact:website / website tags) but are missing phone or email. We fetch
the host's actual website (not the OSM page) and regex-extract the
contact details that OSM didn't carry.

This is the long-tail of meaningful enrichment: ~54k candidates today.

Env vars:
  SUPABASE_URL          — required
  SUPABASE_SERVICE_KEY  — required (service role for writes)
  WK_ENRICH_MAX_ROWS    — optional cap, default 2500
  WK_ENRICH_TIMEOUT_S   — optional per-fetch timeout, default 8
  WK_ENRICH_WORKERS     — optional concurrency, default 12
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

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]
MAX_ROWS     = int(os.environ.get("WK_ENRICH_MAX_ROWS", 2500))
TIMEOUT_S    = int(os.environ.get("WK_ENRICH_TIMEOUT_S", 8))
WORKERS      = int(os.environ.get("WK_ENRICH_WORKERS", 12))

UA = "WanderkindBot/1.0 (+https://wanderkind.love; data@wanderkind.love)"

RE_PHONE = re.compile(r"(?:tel:)?\s*(\+?\d[\d\s().\-]{6,}\d)", re.IGNORECASE)
RE_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
EMAIL_BAD_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".css", ".js")


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
        r.read()


def fetch_and_extract(row: dict) -> dict:
    """Fetch the host's website (NOT the OSM page) and extract phone/email."""
    site = row.get("website")
    if not site:
        return {}
    try:
        req = urllib.request.Request(site, headers={"User-Agent": UA})
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
        if m:
            email = m.group(0).lower()
            if not email.endswith(EMAIL_BAD_SUFFIXES):
                update["email"] = m.group(0)
    return update


def quality_score(row: dict, after: dict) -> int:
    phone   = after.get("phone")   or row.get("phone")
    email   = after.get("email")   or row.get("email")
    website = row.get("website")
    desc    = row.get("description") or ""
    s = 0
    if phone or email:                 s += 20
    if website or row.get("source_url"): s += 20
    if len(desc) >= 50:                s += 15
    if (row.get("capacity") or 0) > 0: s += 15
    if row.get("opening_months"):      s += 15
    if row.get("last_confirmed"):      s += 5
    return min(100, s)


def main() -> int:
    log.info(f"Pulling up to {MAX_ROWS} candidate rows (have website, missing phone/email)…")
    select = "id,source_url,phone,email,website,description,capacity,opening_months,last_confirmed,quality_score"
    params = (
        f"select={select}"
        f"&website=not.is.null"
        f"&or=(phone.is.null,email.is.null)"
        f"&order=quality_score.asc.nullsfirst"
        f"&limit={MAX_ROWS}"
    )
    rows = sb_get("hosts", params)
    log.info(f"Got {len(rows)} candidates")
    if not rows:
        log.info("Nothing to enrich — done")
        return 0

    enriched = 0
    fetched_ok = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(fetch_and_extract, r): r for r in rows}
        for fut in as_completed(futures):
            r = futures[fut]
            try:
                update = fut.result()
            except Exception as e:
                continue
            fetched_ok += 1 if update is not None else 0
            if not update:
                continue
            update["quality_score"] = quality_score(r, update)
            try:
                sb_patch("hosts", f"id=eq.{r['id']}", update)
                enriched += 1
                if enriched % 100 == 0:
                    log.info(f"  enriched {enriched} so far…")
            except Exception:
                pass

    elapsed = time.time() - t0
    log.info(f"DONE: enriched {enriched}/{len(rows)} rows in {elapsed:.0f}s "
             f"(rate {enriched/max(1,elapsed):.1f}/s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
