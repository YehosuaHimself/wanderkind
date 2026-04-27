"""
Nordic Pilgrim Routes Importer
================================
Norway:  Pilegrimsleden (Oslo → Trondheim/Nidaros) - pilegrimsleden.no
Denmark: Camino Danes / Hærvejen - Hærvejen.dk, caminodanes.dk
Sweden:  Pilgrimsvägen - pilgrimsvagen.se, pilgrimscentrum.se
Finland: Via Finlandia - Turku pilgrim route
Iceland: (limited but growing)

Data source ID: "nordic_routes"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://www.pilegrimsleden.no/overnatting/", "NO", "no_pilegrim"),
    ("https://www.pilegrimscenter.dk/overnatning/", "DK", "dk_pilegrim"),
    ("https://www.haervejen.dk/overnatning/", "DK", "dk_haervej"),
    ("https://www.pilgrimsvagen.se/boende/", "SE", "se_pilgrim"),
    ("https://www.pilgrimscentrum.se/pilgrimsleder/boende/", "SE", "se_centrum"),
    ("https://www.olavsruta.no/overnattingssteder/", "NO", "no_olav"),
    ("https://www.caminodanes.dk/accommodation/", "DK", "dk_camino"),
]

TYPE_MAP = {
    "kirke": "church", "kirka": "church", "kyrka": "church",
    "kloster": "monastery", "klosteret": "monastery",
    "vandrehjem": "budget", "hostel": "budget", "herberge": "budget",
    "camping": "camping", "telt": "camping",
    "pensjonat": "pension", "pensionat": "pension",
    "donasjon": "donativo", "donativo": "donativo",
    "gratis": "free", "fri": "free",
}

def _map_type(label: str) -> str:
    l = label.lower()
    for k, v in TYPE_MAP.items():
        if k in l: return v
    return "budget"

def _extract_coords(soup, text=""):
    for el in soup.find_all(attrs={"data-lat": True}):
        return float(el["data-lat"]), float(el.get("data-lng", el.get("data-lon", 0)))
    for a in soup.find_all("a", href=True):
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", a["href"])
        if m: return float(m.group(1)), float(m.group(2))
    return None, None

class NordicRoutesImporter(BaseImporter):
    SOURCE_ID = "nordic_routes"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, .overnatting, .accommodation, .sted, li.item"):
                    a = card.find("a", href=True)
                    name_el = card.find(["h2","h3","h4","strong"])
                    name = (name_el or a or card).get_text(strip=True)[:80]
                    if not name or len(name) < 3: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"type|type|kategori|art", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="nordic_routes",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
