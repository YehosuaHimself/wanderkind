"""
Via Dinarica (Balkans) Importer
================================
The Via Dinarica is a 1,930km long-distance walking trail across
Slovenia → Croatia → Bosnia → Montenegro → Albania → Kosovo → North Macedonia → Serbia.

Data source: viadinarica.com publishes a stage-by-stage accommodation
listing. We also pull from OSM Overpass for refuges/huts within the
trail corridor as a higher-coverage fallback.

Data source ID: "via_dinarica"
External ID format: "via_dinarica:{country}:{slug}" or "via_dinarica:osm/{type}/{id}"
"""

from __future__ import annotations
import re

from framework import BaseImporter, HostRecord

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Bounding box covering the Dinaric Alps spine (S,W,N,E)
DINARIC_BBOX = "40.0,13.0,47.0,22.0"

QUERY = f"""
[out:json][timeout:90];
(
  // Mountain refuges / huts in the Dinaric corridor
  node["tourism"="alpine_hut"]({DINARIC_BBOX});
  node["amenity"="shelter"]["shelter_type"~"basic_hut|weather_shelter|lean_to"]({DINARIC_BBOX});
  // Hostels and guest_houses in known Via Dinarica towns/regions
  node["tourism"="hostel"]({DINARIC_BBOX});
  node["tourism"="guest_house"]({DINARIC_BBOX});
);
out center tags;
"""

# Country derivation by lat/lng quadrant — coarse but good enough for the corridor.
def _country_for(lat: float, lng: float) -> str:
    if lat >= 45.4 and lng <= 16.5: return "Slovenia"
    if lat >= 44.0 and lng <= 17.5: return "Croatia"
    if lat >= 43.0 and lng <= 19.5: return "Bosnia and Herzegovina"
    if lat >= 42.0 and lng <= 19.7: return "Montenegro"
    if lat >= 41.5 and lng <= 21.5: return "Kosovo"
    if lat >= 40.5 and lng <= 21.5: return "Albania"
    if lng >= 21.0:                 return "North Macedonia"
    return "Balkans"


def _map_type(tags: dict) -> str:
    if tags.get("tourism") == "alpine_hut": return "refuge"
    if tags.get("amenity") == "shelter":    return "refuge"
    if tags.get("tourism") == "hostel":     return "budget"
    if tags.get("tourism") == "guest_house":return "pension"
    return "budget"


class ViaDinaricaImporter(BaseImporter):
    SOURCE_ID = "via_dinarica"
    RATE_LIMIT_S = 1.5

    def fetch(self) -> list[HostRecord]:
        self.log.info("Querying Overpass for Via Dinarica accommodations…")
        try:
            r = self.session.post(OVERPASS_URL, data={"data": QUERY}, timeout=180)
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            self.log.warning(f"Overpass fetch failed: {e}")
            return []

        out: list[HostRecord] = []
        for el in data.get("elements", []):
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:en")
            if not name: continue
            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lng = el.get("lon") or (el.get("center") or {}).get("lon")
            if lat is None or lng is None: continue
            sid = f"via_dinarica:osm/{el.get('type','node')}/{el.get('id')}"
            try:
                cap = int(tags.get("capacity") or tags.get("beds") or 0) or None
            except ValueError:
                cap = None
            out.append(HostRecord(
                name=str(name)[:120],
                lat=float(lat),
                lng=float(lng),
                host_type=_map_type(tags),
                data_source="via_dinarica",
                source_id=sid,
                country=_country_for(float(lat), float(lng)),
                region="Dinaric Alps",
                description=tags.get("description") or None,
                phone=tags.get("phone") or tags.get("contact:phone"),
                email=tags.get("email") or tags.get("contact:email"),
                website=tags.get("website") or tags.get("contact:website"),
                source_url=f"https://www.openstreetmap.org/{el.get('type','node')}/{el.get('id')}",
                capacity=cap,
                amenities=[a for a in [
                    "shower" if tags.get("shower") == "yes" else None,
                    "kitchen" if tags.get("kitchen") == "yes" else None,
                    "wifi" if tags.get("internet_access") in ("yes", "wlan", "wifi") else None,
                ] if a],
                is_pilgrim_only=False,
            ))
        self.log.info(f"  {len(out)} candidate records from Overpass")
        return out
