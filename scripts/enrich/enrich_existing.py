#!/usr/bin/env python3
"""
WK-170 v3 · Nightly enrichment job
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


def sb_get(table: str, params: str, retries: int = 3) -> list:
    """Fetch rows from Supabase REST API with exponential-backoff retry on 500."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Accept": "application/json",
        "Prefer": "count=none",
    }
    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read(500).decode("utf-8", errors="ignore")
            log.warning(
                f"sb_get attempt {attempt}/{retries} — HTTP {e.code}: {body[:200]}"
            )
            last_err = e
            if e.code != 500:
                raise  # don't retry on 4xx
            time.sleep(2 ** attempt)  # 2s, 4s, 8s
        except Exception as e:
            log.warning(f"sb_get attempt {attempt}/{retries} — {e}")
            last_err = e
            time.sleep(2 ** attempt)
    raise last_err


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


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        charset = "utf-8"
        ct = r.headers.get("Content-Type", "")
        if "charset=" in ct:
            charset = ct.split("charset=")[-1].strip()
        return r.read(200_000).decode(charset, errors="ignore")


def extract_contacts(html: str) -> tuple[str | None, str | None]:
    phone = None
    email = None

    emails = [
        e for e in RE_EMAIL.findall(html)
        if not any(e.lower().endswith(s) for s in EMAIL_BAD_SUFFIXES)
    ]
    if emails:
        email = emails[0]

    phones = RE_PHONE.findall(html)
    if phones:
        phone = re.sub(r"[\s().\-]", "", phones[0])

    return phone, email


def enrich_one(host: dict) -> dict:
    hid  = host["id"]
    site = host.get("website", "")
    if not site.startswith("http"):
        site = "https://" + site

    result = {"id": hid, "status": "skip", "phone": None, "email": None}
    try:
        html = fetch_page(site)
        phone, email = extract_contacts(html)
        if phone or email:
            patch: dict = {}
            if phone and not host.get("phone"):
                patch["phone"] = phone
                result["phone"] = phone
            if email and not host.get("email"):
                patch["email"] = email
                result["email"] = email
            if patch:
                sb_patch(
                    "hosts",
                    f"id=eq.{hid}",
                    {**patch, "enriched_at": "now()"},
                )
                result["status"] = "enriched"
            else:
                result["status"] = "already_complete"
        else:
            result["status"] = "no_contact_found"
    except urllib.error.HTTPError as e:
        result["status"] = f"http_{e.code}"
    except urllib.error.URLError as e:
        result["status"] = "url_error"
    except Exception as e:
        result["status"] = f"error:{type(e).__name__}"
    return result


def main() -> int:
    log.info(f"Enrich v3 — MAX_ROWS={MAX_ROWS} WORKERS={WORKERS} TIMEOUT={TIMEOUT_S}s")

    params = (
        "select=id,website,phone,email"
        "&website=not.is.null"
        "&website=neq."
        "&or=(phone.is.null,email.is.null)"
        "&order=quality_score.asc.nullsfirst"
        f"&limit={MAX_ROWS}"
    )

    try:
        hosts = sb_get("hosts", params)
    except Exception as e:
        log.error(f"Failed to fetch candidates: {e}")
        return 1

    log.info(f"Fetched {len(hosts)} candidates")
    if not hosts:
        log.info("Nothing to enrich.")
        return 0

    stats: dict[str, int] = {}
    enriched = 0

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(enrich_one, h): h["id"] for h in hosts}
        for fut in as_completed(futures):
            res = fut.result()
            s = res["status"]
            stats[s] = stats.get(s, 0) + 1
            if s == "enriched":
                enriched += 1
                log.info(
                    f"  ✓ {res['id']} — phone={res['phone']} email={res['email']}"
                )

    log.info(f"Done. enriched={enriched}  stats={stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
