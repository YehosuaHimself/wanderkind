"""
WK Host Import Framework
========================
Base classes and shared utilities for all host data importers.

Usage:
  from framework import BaseImporter, HostRecord, upsert_hosts

Each source importer subclasses BaseImporter and implements fetch().
"""

from __future__ import annotations
import os, re, math, time, logging, unicodedata
from dataclasses import dataclass, field, asdict
from typing import Optional
from datetime import datetime, timezone

import requests
from supabase import create_client, Client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)


# ── Data model ─────────────────────────────────────────────────────────────────

HOST_TYPES = {
    "free", "donativo", "budget", "paid",
    "albergue_municipal", "albergue_privado", "albergue_parroquial", "albergue_asociacion",
    "monastery", "church", "gite_etape", "refuge",
    "camping", "pension", "hotel_budget", "private_host",
    "tourist_info", "community",
}

@dataclass
class HostRecord:
    # Required
    name: str
    lat: float
    lng: float
    host_type: str          # must be in HOST_TYPES
    data_source: str        # e.g. "gronze", "osm", "confraternity_uk"
    source_id: str          # stable external ID — used for idempotent upsert

    # Strongly recommended
    country: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    source_url: Optional[str] = None
    capacity: Optional[int] = None
    price_range: Optional[str] = None
    amenities: list[str] = field(default_factory=list)
    opening_months: list[str] = field(default_factory=list)
    languages: list[str] = field(default_factory=list)
    is_pilgrim_only: bool = False
    route_km: Optional[float] = None

    def validate(self) -> list[str]:
        errors = []
        if not self.name or len(self.name.strip()) < 2:
            errors.append("name too short")
        if not (-90 <= self.lat <= 90):
            errors.append(f"invalid lat {self.lat}")
        if not (-180 <= self.lng <= 180):
            errors.append(f"invalid lng {self.lng}")
        if self.host_type not in HOST_TYPES:
            errors.append(f"unknown host_type '{self.host_type}'")
        if not self.source_id:
            errors.append("source_id required")
        return errors


# ── Deduplication ───────────────────────────────────────────────────────────────

def _haversine_m(lat1, lng1, lat2, lng2) -> float:
    """Distance in metres between two lat/lng points."""
    R = 6_371_000
    p = math.pi / 180
    a = (math.sin((lat2 - lat1) * p / 2) ** 2 +
         math.cos(lat1 * p) * math.cos(lat2 * p) *
         math.sin((lng2 - lng1) * p / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _normalize_name(s: str) -> str:
    """Lowercase, strip accents, collapse whitespace for fuzzy comparison."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()


def _name_similar(a: str, b: str, threshold: float = 0.6) -> bool:
    """Simple token-overlap similarity — avoids heavyweight dependencies."""
    ta, tb = set(_normalize_name(a).split()), set(_normalize_name(b).split())
    if not ta or not tb:
        return False
    return len(ta & tb) / max(len(ta), len(tb)) >= threshold


def find_duplicate(record: HostRecord, existing: list[dict], radius_m: float = 150) -> Optional[str]:
    """
    Return the existing host UUID if record is a likely duplicate,
    matching on (within radius_m metres) AND (name similarity ≥ 0.6).
    Returns None if no duplicate found.
    """
    for ex in existing:
        if ex.get("lat") is None or ex.get("lng") is None:
            continue
        dist = _haversine_m(record.lat, record.lng, ex["lat"], ex["lng"])
        if dist <= radius_m and _name_similar(record.name, ex.get("name", "")):
            return ex["id"]
    return None


# ── Supabase client ────────────────────────────────────────────────────────────

def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ["SUPABASE_ANON_KEY"]
    return create_client(url, key)


def _fetch_existing_hosts(sb: Client) -> list[dict]:
    """Load all existing hosts (id, lat, lng, name, data_source, source_id) for dedup."""
    log = logging.getLogger("framework")
    log.info("Loading existing hosts for dedup…")
    rows, page, page_size = [], 0, 1000
    while True:
        result = sb.table("hosts").select("id,lat,lng,name,data_source,source_id").range(page * page_size, (page + 1) * page_size - 1).execute()
        batch = result.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    log.info(f"  Loaded {len(rows)} existing hosts")
    return rows


def upsert_hosts(records: list[HostRecord], dry_run: bool = False) -> dict:
    """
    Upsert a list of HostRecords into Supabase.

    Strategy:
      1. If (data_source, source_id) already exists → UPDATE
      2. Else if near-duplicate found (coords + name) → SKIP (log warning)
      3. Else → INSERT

    Returns stats dict: inserted, updated, skipped, errors.
    """
    log = logging.getLogger("framework")
    sb = get_supabase()
    existing = _fetch_existing_hosts(sb)

    # Build lookup by (data_source, source_id) for fast O(1) update detection
    source_lookup: dict[tuple, str] = {}
    for ex in existing:
        if ex.get("data_source") and ex.get("source_id"):
            source_lookup[(ex["data_source"], ex["source_id"])] = ex["id"]

    stats = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}
    now = datetime.now(timezone.utc).isoformat()

    for rec in records:
        errs = rec.validate()
        if errs:
            log.warning(f"  SKIP invalid [{rec.source_id}] {rec.name}: {errs}")
            stats["errors"] += 1
            continue

        payload = {
            "name": rec.name.strip(),
            "lat": rec.lat,
            "lng": rec.lng,
            "host_type": rec.host_type,
            "data_source": rec.data_source,
            "source_id": rec.source_id,
            "source_url": rec.source_url,
            "country": rec.country,
            "region": rec.region,
            "description": rec.description,
            "address": rec.address,
            "phone": rec.phone,
            "email": rec.email,
            "website": rec.website,
            "capacity": rec.capacity,
            "price_range": rec.price_range,
            "amenities": rec.amenities or [],
            "opening_months": rec.opening_months or [],
            "languages": rec.languages or [],
            "is_pilgrim_only": rec.is_pilgrim_only,
            "route_km": rec.route_km,
            "last_imported_at": now,
            # Required non-null fields with defaults
            "is_available": True,
            "is_bicycle_friendly": False,
            "is_family_friendly": False,
            "is_women_verified": False,
            "is_wheelchair_accessible": False,
            "total_hosted": 0,
            "verification_level": "unverified",
            "house_rules": [],
            "gallery": [],
        }

        key = (rec.data_source, rec.source_id)

        if key in source_lookup:
            # Known record from this source → update
            existing_id = source_lookup[key]
            if not dry_run:
                sb.table("hosts").update(payload).eq("id", existing_id).execute()
            log.debug(f"  UPDATE {rec.name}")
            stats["updated"] += 1

        else:
            # Check for near-duplicate from a DIFFERENT source
            dup_id = find_duplicate(rec, existing)
            if dup_id:
                log.info(f"  SKIP near-dup [{rec.source_id}] {rec.name} (matches {dup_id})")
                stats["skipped"] += 1
                continue

            # New host — insert
            if not dry_run:
                sb.table("hosts").insert(payload).execute()
            log.info(f"  INSERT {rec.name} ({rec.host_type}) [{rec.country}]")
            stats["inserted"] += 1

            # Add to in-memory existing list to catch further dupes in this batch
            existing.append({"id": f"_new_{rec.source_id}", "lat": rec.lat, "lng": rec.lng,
                              "name": rec.name, "data_source": rec.data_source, "source_id": rec.source_id})

    return stats


# ── Base importer ──────────────────────────────────────────────────────────────

class BaseImporter:
    """
    Subclass this for each data source.
    Override fetch() to return a list[HostRecord].
    """
    SOURCE_ID = "base"      # override in subclass
    RATE_LIMIT_S = 1.0      # seconds between requests — be polite

    def __init__(self):
        self.log = logging.getLogger(self.__class__.__name__)
        self.session = requests.Session()
        self.session.headers["User-Agent"] = (
            "WanderkindBot/1.0 (+https://wanderkind.love; data@wanderkind.love)"
        )

    def get(self, url: str, **kwargs) -> requests.Response:
        """Rate-limited GET with retries."""
        for attempt in range(3):
            try:
                r = self.session.get(url, timeout=30, **kwargs)
                r.raise_for_status()
                time.sleep(self.RATE_LIMIT_S)
                return r
            except requests.RequestException as e:
                if attempt == 2:
                    raise
                self.log.warning(f"Retry {attempt+1} for {url}: {e}")
                time.sleep(2 ** attempt)

    def fetch(self) -> list[HostRecord]:
        """Override in subclass. Return all host records from this source."""
        raise NotImplementedError

    def run(self, dry_run: bool = False) -> dict:
        self.log.info(f"=== {self.__class__.__name__} — fetching…")
        records = self.fetch()
        self.log.info(f"  Fetched {len(records)} records")
        stats = upsert_hosts(records, dry_run=dry_run)
        self.log.info(f"  Done: {stats}")
        return stats
