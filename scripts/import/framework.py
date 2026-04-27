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

    insert_payloads: list[dict] = []
    update_payloads: list[tuple[str, dict]] = []

    for rec in records:
        errs = rec.validate()
        if errs:
            log.warning(f"  SKIP invalid [{rec.source_id}] {rec.name}: {errs}")
            stats["errors"] += 1
            continue

        # last_confirmed kept null on import — community sets it via the UI.
        payload = {
            "quality_score": compute_quality_score(rec),
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
            "capacity": rec.capacity if rec.capacity is not None else 0,
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
            existing_id = source_lookup[key]
            update_payloads.append((existing_id, payload))
            stats["updated"] += 1
        else:
            dup_id = find_duplicate(rec, existing)
            if dup_id:
                stats["skipped"] += 1
                continue
            insert_payloads.append(payload)
            stats["inserted"] += 1
            existing.append({"id": f"_new_{rec.source_id}", "lat": rec.lat, "lng": rec.lng,
                              "name": rec.name, "data_source": rec.data_source, "source_id": rec.source_id})

    log.info(f"  Prepared {len(insert_payloads)} insert + {len(update_payloads)} update payloads")

    if not dry_run:
        BATCH = 200
        for i in range(0, len(insert_payloads), BATCH):
            chunk = insert_payloads[i:i+BATCH]
            try:
                sb.table("hosts").insert(chunk).execute()
                log.info(f"    inserted batch {i//BATCH + 1} ({len(chunk)} rows)")
            except Exception as e:
                log.warning(f"    bulk insert batch {i//BATCH + 1} failed ({e}); falling back per-row")
                for row in chunk:
                    try: sb.table("hosts").insert(row).execute()
                    except Exception as e2:
                        log.warning(f"      row failed: {e2}")
                        stats["errors"] += 1
                        stats["inserted"] -= 1
        for existing_id, payload in update_payloads:
            try: sb.table("hosts").update(payload).eq("id", existing_id).execute()
            except Exception as e:
                log.warning(f"    update {existing_id} failed: {e}")
                stats["errors"] += 1

    return stats




# ── Quality scoring ────────────────────────────────────────────────────────────

def compute_quality_score(rec: HostRecord, last_confirmed: Optional[str] = None) -> int:
    """
    0-100 trust score per Wanderkind handover §2.4 / §5:
      +20  contact info (phone OR email)
      +20  website OR source_url
      +15  description (>= 50 chars)
      +15  capacity present
      +15  opening_months present
      +10  at least one photo (gallery or hero)
      +5   human confirmed (last_confirmed not null)
    """
    score = 0
    if rec.phone or rec.email:
        score += 20
    if rec.website or rec.source_url:
        score += 20
    if rec.description and len(rec.description.strip()) >= 50:
        score += 15
    if rec.capacity is not None and rec.capacity > 0:
        score += 15
    if rec.opening_months:
        score += 15
    # Photo bonus is reserved for hosts with curated images (not auto-imported).
    # Importers don't yet attach photos, but the field stays for future enrichment.
    # For now we treat presence of source_url as a signal toward photo availability.
    if last_confirmed:
        score += 5
    return min(100, score)


# ── Phase-1 enrichment: extract phone/email/website from a source page ─────────

_RE_PHONE = re.compile(r'(?:tel:)?\s*(\+?\d[\d\s().-]{6,}\d)', re.IGNORECASE)
_RE_EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
_RE_WEBSITE = re.compile(r'https?://[A-Za-z0-9./:_\-?=&%]+', re.IGNORECASE)
_BAD_DOMAINS = ("schema.org", "w3.org", "facebook.com/sharer", "twitter.com/intent",
                "instagram.com/explore", "google.com/maps", "google-analytics", "googletagmanager")


def enrich_from_url(rec: HostRecord, session: "requests.Session", timeout: int = 12) -> HostRecord:
    """
    Best-effort: fetch source_url, extract phone/email/website if missing.
    Never overwrites curated data. Returns the (mutated) record.
    """
    if not rec.source_url:
        return rec
    if rec.phone and rec.email and rec.website:
        return rec
    try:
        r = session.get(rec.source_url, timeout=timeout)
        r.raise_for_status()
        text = r.text
    except Exception:
        return rec

    if not rec.phone:
        m = _RE_PHONE.search(text)
        if m:
            cand = re.sub(r"\s+", " ", m.group(1)).strip()
            if 7 <= len(re.sub(r"\D", "", cand)) <= 16:
                rec.phone = cand
    if not rec.email:
        m = _RE_EMAIL.search(text)
        if m and not m.group(0).lower().endswith((".png", ".jpg", ".gif")):
            rec.email = m.group(0)
    if not rec.website:
        for m in _RE_WEBSITE.finditer(text):
            url = m.group(0).rstrip(".,;)\"\'")
            if any(b in url for b in _BAD_DOMAINS):
                continue
            if rec.source_url and url == rec.source_url:
                continue
            rec.website = url
            break
    return rec


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

    def run(self, dry_run: bool = False, enrich: bool = False) -> dict:
        self.log.info(f"=== {self.__class__.__name__} — fetching…")
        records = self.fetch()
        self.log.info(f"  Fetched {len(records)} records")
        if enrich:
            self.log.info(f"  Phase-1 enriching from source pages (best-effort)…")
            enriched_count = 0
            for rec in records:
                if not rec.source_url: continue
                if rec.phone and rec.email and rec.website: continue
                before = (rec.phone, rec.email, rec.website)
                enrich_from_url(rec, self.session)
                if (rec.phone, rec.email, rec.website) != before:
                    enriched_count += 1
            self.log.info(f"    enriched {enriched_count} record(s) with new contact info")
        stats = upsert_hosts(records, dry_run=dry_run)
        self.log.info(f"  Done: {stats}")
        return stats

# ── Regional Overpass importer ────────────────────────────────────────────────
# Generic base for scraping pilgrim-relevant accommodation from OpenStreetMap
# Overpass within a country / corridor / route bbox. Complements the global
# OSMImporter by:
#   * fetching guest_house, chalet, motel, camp_site (which the global
#     query intentionally skips to keep volume reasonable)
#   * targeting religious-pilgrim sites by region (Buddhist temples in Asia,
#     dharamshalas in India, monasteries in Orthodox Balkans, etc.)
# Each subclass only declares: SOURCE_ID, COUNTRY, BBOX (S,W,N,E).
# Optional: REGION, EXTRA_QUERY (raw Overpass QL appended inside the union),
# TYPE_OVERRIDES (dict of (tag_name -> wk host_type)).

class RegionalOverpassImporter(BaseImporter):
    SOURCE_ID = "regional_overpass"     # override
    COUNTRY: Optional[str] = None        # override (None to skip writing it)
    REGION: Optional[str] = None
    BBOX = "35.0,-10.0,72.0,40.0"        # default = Europe; override per-region
    EXTRA_QUERY = ""                     # extra Overpass union members
    LANGUAGES: list[str] = []            # default languages array

    def _query(self) -> str:
        bbox = self.BBOX
        # EXTRA_QUERY may contain the literal {bbox} placeholder — substitute it now.
        extra = self.EXTRA_QUERY.replace("{bbox}", bbox) if self.EXTRA_QUERY else ""
        return f"""
[out:json][timeout:90];
(
  node["tourism"~"hostel|guest_house|chalet|alpine_hut|camp_site|caravan_site|motel"]({bbox});
  way ["tourism"~"hostel|guest_house|chalet|alpine_hut"]({bbox});
  node["amenity"="monastery"]({bbox});
  way ["amenity"="monastery"]({bbox});
  node["historic"="monastery"]({bbox});
  way ["historic"="monastery"]({bbox});
  node["amenity"="shelter"]["shelter_type"~"basic_hut|lean_to|weather_shelter"]({bbox});
  node["pilgrim_accommodation"="yes"]({bbox});
  way ["pilgrim_accommodation"="yes"]({bbox});
{extra}
);
out center tags;
"""

    def _map_type(self, tags: dict) -> str:
        if tags.get("pilgrim_accommodation") == "yes": return "albergue_privado"
        t = tags.get("tourism")
        if t == "alpine_hut":      return "refuge"
        if t == "camp_site":       return "camping"
        if t == "caravan_site":    return "camping"
        if t == "hostel":          return "budget"
        if t == "guest_house":     return "pension"
        if t == "chalet":          return "pension"
        if t == "motel":           return "hotel_budget"
        if tags.get("amenity") == "monastery": return "monastery"
        if tags.get("historic") == "monastery": return "monastery"
        if tags.get("amenity") == "shelter":   return "refuge"
        return "budget"

    def fetch(self) -> list[HostRecord]:
        bboxes = getattr(self, "BBOXES", None) or [self.BBOX]
        all_recs: list[HostRecord] = []
        for idx, bbox in enumerate(bboxes):
            self.BBOX = bbox  # _query reads this
            self.log.info(f"Overpass [{self.SOURCE_ID}] chunk {idx+1}/{len(bboxes)} bbox={bbox}…")
            recs = self._fetch_chunk()
            all_recs.extend(recs)
        self.log.info(f"  {len(all_recs)} records total across {len(bboxes)} chunk(s)")
        return all_recs

    def _fetch_chunk(self) -> list[HostRecord]:
        q = self._query()
        # Try multiple Overpass mirrors — the main one frequently 504s on large bboxes.
        endpoints = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass.private.coffee/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
        ]
        data = None
        last_err = None
        for ep in endpoints:
            try:
                r = self.session.post(ep, data={"data": q}, timeout=180)
                r.raise_for_status()
                data = r.json()
                self.log.info(f"  Overpass via {ep.split('/')[2]} → {len(data.get('elements', []))} elements")
                break
            except Exception as e:
                last_err = e
                self.log.warning(f"  endpoint {ep.split('/')[2]} failed: {e}")
                continue
        if data is None:
            self.log.warning(f"Overpass fetch failed for {self.SOURCE_ID} — all mirrors exhausted: {last_err}")
            self.log.warning(f"  query (first 200): {q.replace(chr(10), ' ')[:200]}")
            return []

        out: list[HostRecord] = []
        for el in data.get("elements", []):
            tags = el.get("tags", {})
            name = tags.get("name:en") or tags.get("name")
            if not name: continue
            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lng = el.get("lon") or (el.get("center") or {}).get("lon")
            if lat is None or lng is None: continue
            try:
                cap = int(tags.get("capacity") or tags.get("beds") or 0) or None
            except (ValueError, TypeError):
                cap = None
            sid = f"{self.SOURCE_ID}:osm/{el.get('type','node')}/{el.get('id')}"
            out.append(HostRecord(
                name=str(name)[:200],
                lat=float(lat),
                lng=float(lng),
                host_type=self._map_type(tags),
                data_source=self.SOURCE_ID,
                source_id=sid,
                country=self.COUNTRY,
                region=self.REGION,
                description=tags.get("description") or None,
                phone=tags.get("phone") or tags.get("contact:phone"),
                email=tags.get("email") or tags.get("contact:email"),
                website=tags.get("website") or tags.get("contact:website"),
                source_url=f"https://www.openstreetmap.org/{el.get('type','node')}/{el.get('id')}",
                capacity=cap,
                amenities=[a for a in [
                    "shower" if tags.get("shower") == "yes" else None,
                    "kitchen" if tags.get("kitchen") == "yes" else None,
                    "wifi" if tags.get("internet_access") in ("yes","wlan","wifi") else None,
                    "laundry" if tags.get("laundry_service") == "yes" else None,
                ] if a],
                languages=list(self.LANGUAGES),
                is_pilgrim_only=tags.get("pilgrim_accommodation") == "yes",
            ))
        return out



