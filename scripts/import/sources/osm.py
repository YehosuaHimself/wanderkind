"""
OSM Overpass Importer
=====================
Queries OpenStreetMap via the Overpass API for pilgrim-relevant
accommodation across all of Europe.

Covers:
  - tourism=hostel / hotel / guest_house / chalet / camp_site / caravan_site
  - amenity=monastery / convent / shelter with pilgrim tags
  - historic=monastery with accommodation tags
  - social_facility=shelter
  - Any node/way tagged pilgrim_accommodation=yes
  - tourism=alpine_hut along major routes

Data source ID: "osm"
External ID format: "osm:{node|way|relation}/{id}"
"""

from __future__ import annotations
import json, re
from typing import Optional

from framework import BaseImporter, HostRecord

# Overpass API endpoint (uses multiple mirrors for reliability)
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Bounding box for Europe (lon_min, lat_min, lon_max, lat_max → Overpass: S,W,N,E)
EUROPE_BBOX = "35.0,-10.0,72.0,40.0"

# Overpass QL query — fetches all pilgrim-relevant accommodation in Europe
QUERY = f"""
[out:json][timeout:120];
(
  // Pilgrim-specific tag — highest quality signal
  node["pilgrim_accommodation"="yes"]({EUROPE_BBOX});
  way["pilgrim_accommodation"="yes"]({EUROPE_BBOX});

  // Albergues (Spanish pilgrim hostels)
  node["tourism"="hostel"]["name"~"[Aa]lbergue|[Pp]ilgrim|[Pp]èlerin|[Pp]ilger|[Pp]ellegrin",i]({EUROPE_BBOX});
  way["tourism"="hostel"]["name"~"[Aa]lbergue|[Pp]ilgrim|[Pp]èlerin|[Pp]ilger|[Pp]ellegrin",i]({EUROPE_BBOX});

  // Monasteries and convents with accommodation
  node["amenity"="monastery"]["tourism"~"hostel|guest_house|hotel"]({EUROPE_BBOX});
  node["historic"="monastery"]["tourism"]({EUROPE_BBOX});
  way["historic"="monastery"]["tourism"]({EUROPE_BBOX});
  node["amenity"="monastery"]["accommodation"="yes"]({EUROPE_BBOX});

  // Gîtes d'étape (France/Belgium)
  node["tourism"="hostel"]["gite"~"étape|etape",i]({EUROPE_BBOX});
  node["leisure"="hostel"]({EUROPE_BBOX});

  // Refuges / shelters on walking routes
  node["tourism"="alpine_hut"]["access"!="private"]({EUROPE_BBOX});
  node["amenity"="shelter"]["shelter_type"~"lean_to|basic_hut|weather_shelter"]({EUROPE_BBOX});

  // Churches offering pilgrim rest
  node["amenity"="place_of_worship"]["pilgrim_accommodation"="yes"]({EUROPE_BBOX});
  way["amenity"="place_of_worship"]["pilgrim_accommodation"="yes"]({EUROPE_BBOX});
);
out center tags;
"""


# ── Tag → HostRecord mapping ────────────────────────────────────────────────────

def _map_host_type(tags: dict) -> str:
    name = tags.get("name", "").lower()
    tourism = tags.get("tourism", "")
    amenity = tags.get("amenity", "")
    historic = tags.get("historic", "")

    if "albergue" in name:
        op = tags.get("operator:type", tags.get("ownership", ""))
        if "municipal" in op or "municipal" in name:
            return "albergue_municipal"
        if "parroq" in op or "parroq" in name or "parish" in name:
            return "albergue_parroquial"
        if "asociac" in op or "confratern" in name or "association" in name:
            return "albergue_asociacion"
        return "albergue_privado"

    if historic in ("monastery", "convent") or amenity == "monastery":
        return "monastery"

    if amenity == "place_of_worship":
        return "church"

    if tourism == "alpine_hut":
        return "refuge"

    if tourism in ("camp_site", "caravan_site"):
        return "camping"

    if tourism == "guest_house":
        return "pension"

    if tourism == "hostel":
        if any(k in name for k in ("pilgrim", "pèlerin", "pellegrin", "pilger", "peregrino")):
            return "albergue_privado"
        return "budget"

    if amenity == "shelter":
        return "refuge"

    return "budget"


def _map_host_type_price(tags: dict) -> str:
    charge = tags.get("charge", tags.get("fee", ""))
    donation = tags.get("donation", "")
    if donation == "yes" or "donativo" in charge.lower() if charge else False:
        return "donativo"
    if charge in ("no", "0", "free") or tags.get("access") == "yes":
        return "free"
    return _map_host_type(tags)


def _extract_coords(element: dict) -> tuple[float, float] | None:
    """Extract lat/lng from node or way (way uses 'center')."""
    if element["type"] == "node":
        return element.get("lat"), element.get("lon")
    center = element.get("center", {})
    if center:
        return center.get("lat"), center.get("lon")
    return None, None


def _parse_capacity(tags: dict) -> Optional[int]:
    for k in ("capacity", "beds", "rooms"):
        v = tags.get(k)
        if v:
            m = re.search(r"\d+", str(v))
            if m:
                return int(m.group())
    return None


def _parse_opening_months(tags: dict) -> list[str]:
    oh = tags.get("opening_hours", tags.get("seasonal", ""))
    if not oh:
        return []
    # Very rough parse — just flag common pilgrim seasons
    if "Apr" in oh or "May" in oh or any(m in oh.lower() for m in ["apr", "may", "jun", "jul", "aug", "sep", "oct"]):
        return ["apr", "may", "jun", "jul", "aug", "sep", "oct"]
    return []


class OSMImporter(BaseImporter):
    SOURCE_ID = "osm"
    RATE_LIMIT_S = 2.0  # be gentle with Overpass

    def fetch(self) -> list[HostRecord]:
        self.log.info("Querying Overpass API (Europe, may take 60–120s)…")
        r = self.session.post(OVERPASS_URL, data={"data": QUERY}, timeout=180)
        r.raise_for_status()
        data = r.json()
        elements = data.get("elements", [])
        self.log.info(f"  Overpass returned {len(elements)} elements")

        records: list[HostRecord] = []
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:en") or tags.get("name:de") or tags.get("name:fr")
            if not name:
                continue  # skip unnamed

            lat, lng = _extract_coords(el)
            if lat is None or lng is None:
                continue

            osm_type = el["type"]  # node / way / relation
            osm_id = el["id"]
            source_id = f"{osm_type}/{osm_id}"
            source_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}"

            host_type = _map_host_type_price(tags)

            records.append(HostRecord(
                name=name,
                lat=lat,
                lng=lng,
                host_type=host_type,
                data_source="osm",
                source_id=source_id,
                source_url=source_url,
                country=tags.get("addr:country"),
                region=tags.get("addr:state") or tags.get("addr:province") or tags.get("addr:region"),
                address=tags.get("addr:full") or (
                    " ".join(filter(None, [
                        tags.get("addr:housenumber"),
                        tags.get("addr:street"),
                        tags.get("addr:city"),
                    ])) or None
                ),
                phone=tags.get("phone") or tags.get("contact:phone"),
                email=tags.get("email") or tags.get("contact:email"),
                website=tags.get("website") or tags.get("contact:website"),
                capacity=_parse_capacity(tags),
                description=tags.get("description") or tags.get("note"),
                opening_months=_parse_opening_months(tags),
                is_pilgrim_only="pilgrim" in tags.get("name", "").lower()
                                or tags.get("pilgrim_accommodation") == "yes",
            ))

        self.log.info(f"  Parsed {len(records)} valid records from OSM")
        return records
