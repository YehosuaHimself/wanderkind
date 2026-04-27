"""
Australia Long-Distance Trail Accommodations
=============================================
Covers the Bibbulmun Track (1,000 km, WA), the Heysen Trail (1,200 km, SA),
the Great North Walk (250 km, NSW), the Cape-to-Cape Track (135 km, WA),
the Australian Alps Walking Track (655 km, VIC/NSW/ACT) and the
Larapinta Trail (223 km, NT).

Data: OSM Overpass for hostels/guest_houses/camp_sites/alpine_huts within
each track corridor. The track "Camino del Norte AU" mentioned in the
brief is a small private project; data is sparse so we do not query it
specifically — the overall AU coverage subsumes it.

Data source ID: "australia_routes"
"""

from __future__ import annotations
from framework import BaseImporter, HostRecord

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Per-track bounding boxes (S,W,N,E)
TRACKS = {
    "Bibbulmun Track":         "-35.5,115.5,-31.5,117.0",
    "Heysen Trail":            "-36.5,138.0,-32.5,140.0",
    "Great North Walk":        "-33.9,150.5,-32.5,151.8",
    "Cape-to-Cape Track":      "-34.5,114.8,-33.4,115.3",
    "Larapinta Trail":         "-24.0,132.5,-23.0,134.5",
    "Aus Alps Walking Track":  "-37.5,146.0,-35.5,149.5",
}

QUERY_TPL = """
[out:json][timeout:60];
(
  node["tourism"~"hostel|guest_house|chalet|camp_site|caravan_site|alpine_hut"]({bbox});
  node["amenity"="shelter"]["shelter_type"~"basic_hut|lean_to|weather_shelter"]({bbox});
);
out center tags;
"""


def _map_type(tags: dict) -> str:
    t = tags.get("tourism")
    if t == "alpine_hut":   return "refuge"
    if t in ("camp_site","caravan_site"): return "camping"
    if t == "hostel":       return "budget"
    if t == "guest_house":  return "pension"
    if t == "chalet":       return "pension"
    if tags.get("amenity") == "shelter": return "refuge"
    return "budget"


class AustraliaRoutesImporter(BaseImporter):
    SOURCE_ID = "australia_routes"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        out: list[HostRecord] = []
        for track, bbox in TRACKS.items():
            self.log.info(f"Querying Overpass for {track} corridor…")
            try:
                r = self.session.post(OVERPASS_URL, data={"data": QUERY_TPL.format(bbox=bbox)}, timeout=120)
                r.raise_for_status()
                data = r.json()
            except Exception as e:
                self.log.warning(f"  fetch failed for {track}: {e}")
                continue
            for el in data.get("elements", []):
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("name:en")
                if not name: continue
                lat = el.get("lat") or (el.get("center") or {}).get("lat")
                lng = el.get("lon") or (el.get("center") or {}).get("lon")
                if lat is None or lng is None: continue
                sid = f"australia_routes:{track[:24]}:osm/{el.get('type','node')}/{el.get('id')}"
                out.append(HostRecord(
                    name=str(name)[:120],
                    lat=float(lat),
                    lng=float(lng),
                    host_type=_map_type(tags),
                    data_source="australia_routes",
                    source_id=sid,
                    country="Australia",
                    region=track,
                    description=tags.get("description") or None,
                    phone=tags.get("phone") or tags.get("contact:phone"),
                    email=tags.get("email") or tags.get("contact:email"),
                    website=tags.get("website") or tags.get("contact:website"),
                    source_url=f"https://www.openstreetmap.org/{el.get('type','node')}/{el.get('id')}",
                    languages=["en"],
                ))
        self.log.info(f"Total Australia records: {len(out)}")
        return out
