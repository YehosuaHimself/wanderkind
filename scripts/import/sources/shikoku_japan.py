"""
Shikoku 88 Pilgrimage (Japan) Importer
=======================================
The Shikoku 88-temple pilgrimage circles the island of Shikoku and is
one of the world's oldest organised pilgrim routes. Each of the 88
temples (and many of the 20 bangai 'extra' temples) hosts pilgrims;
shukubo (temple lodging) is the most common accommodation.

Data: we query OSM Overpass for `religion=buddhist` + `pilgrimage=*`
across Shikoku, plus tourism=hostel/guest_house in henro towns.

Data source ID: "shikoku_japan"
"""

from __future__ import annotations
from framework import BaseImporter, HostRecord

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Shikoku island bbox (S,W,N,E)
SHIKOKU_BBOX = "32.7,132.0,34.5,134.8"

QUERY = f"""
[out:json][timeout:90];
(
  // Buddhist temples on the Shikoku pilgrimage
  node["amenity"="place_of_worship"]["religion"="buddhist"]({SHIKOKU_BBOX});
  way["amenity"="place_of_worship"]["religion"="buddhist"]({SHIKOKU_BBOX});
  // Hostels and minshuku across the island
  node["tourism"~"hostel|guest_house|chalet"]({SHIKOKU_BBOX});
);
out center tags;
"""

# 88 official Shikoku temple names (romaji) — used to mark "is_pilgrim_only".
SHIKOKU_88_KEYWORDS = (
    "ryōzenji", "gokurakuji", "konsenji", "dainichiji", "jizōji", "anrakuji",
    "jūrakuji", "kumadaniji", "hōrinji", "kirihataji", "fujiidera", "shōsanji",
    "dainichiji", "jōrakuji", "kokubunji", "kannonji", "idoji", "onzanji",
    "tatsueji", "kakurinji", "tairyūji", "byōdōji", "yakuōji", "hotsumisakiji",
    "shinshōji", "kongōchōji", "konomineji", "kōnomineji", "dainichiji", "tosakokubunji",
    "zenrakuji", "chikurinji", "zenjibuji", "sekkeiji", "tanemaji", "iwamotoji",
    "kongōfukuji", "enkōji", "kanjizaiji", "ryūkōji", "butsumokuji",
    "myōjinji", "ryūkōji", "kokubunji", "iyakaichi", "iwayaji", "jōruriji", "yasakaji",
    "saihōji", "hantaji", "yasakaji", "ishi-teji", "taisanji",
    "ennmyōji", "nankōbō", "taisanji", "eifukuji", "senyūji", "dōryūji",
    "kongōji", "kōonji", "hōjuji", "kichijōji", "maegamiji", "sankakuji",
    "unpenji", "daikōji", "kannonji", "jinnein", "kōyamaji", "zentsūji",
    "manaichi", "shusshakaji", "dōryūji", "kōzōji", "tenneiji", "iwayaji",
    "ōkuboji",
)

def _is_88(name: str) -> bool:
    n = name.lower()
    return any(k in n for k in SHIKOKU_88_KEYWORDS)


class ShikokuJapanImporter(BaseImporter):
    SOURCE_ID = "shikoku_japan"
    RATE_LIMIT_S = 1.5

    def fetch(self) -> list[HostRecord]:
        self.log.info("Querying Overpass for Shikoku 88 accommodations…")
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
            name = tags.get("name:en") or tags.get("name")
            if not name: continue
            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lng = el.get("lon") or (el.get("center") or {}).get("lon")
            if lat is None or lng is None: continue

            is_temple = tags.get("amenity") == "place_of_worship" and tags.get("religion") == "buddhist"
            host_type = "monastery" if is_temple else (
                "pension" if tags.get("tourism") == "guest_house" else "budget"
            )
            sid = f"shikoku_japan:osm/{el.get('type','node')}/{el.get('id')}"
            out.append(HostRecord(
                name=str(name)[:120],
                lat=float(lat),
                lng=float(lng),
                host_type=host_type,
                data_source="shikoku_japan",
                source_id=sid,
                country="Japan",
                region="Shikoku",
                description=(
                    f"Shikoku 88 pilgrimage temple — shukubo lodging may be available. {tags.get('description','')}"
                    if is_temple and _is_88(str(name)) else (tags.get("description") or None)
                ),
                phone=tags.get("phone") or tags.get("contact:phone"),
                website=tags.get("website") or tags.get("contact:website"),
                source_url=f"https://www.openstreetmap.org/{el.get('type','node')}/{el.get('id')}",
                languages=["ja", "en"] if tags.get("name:en") else ["ja"],
                is_pilgrim_only=is_temple and _is_88(str(name)),
            ))
        self.log.info(f"  {len(out)} candidate records from Overpass")
        return out
