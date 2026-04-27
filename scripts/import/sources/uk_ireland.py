"""
UK & Ireland Pilgrim Routes Importer
======================================
UK:      British Pilgrimage Trust (britishpilgrimage.org)
         Camino Society UK
         North Downs Way pilgrim accommodation
         St Cuthbert's Way
         Walsingham pilgrim network
Ireland: Camino Society Ireland (caminosociety.ie)
         St Declan's Way
         Croagh Patrick pilgrim route
         Tochar Phádraig

Data source ID: "uk_ireland"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://britishpilgrimage.org/accommodation/", "GB", "bpt"),
    ("https://www.caminosociety.ie/accommodation/", "IE", "camino_ie"),
    ("https://www.northdownsway.co.uk/accommodation/", "GB", "ndw"),
    ("https://www.stcuthbertsway.info/accommodation/", "GB", "cuthbert"),
    ("https://www.walsingham.org.uk/accommodation/", "GB", "walsingham"),
    ("https://www.irishpilgrimageways.ie/accommodation/", "IE", "ie_pilgrim"),
    ("https://www.camino.ie/accommodation/", "IE", "camino_ie2"),
]

TYPE_MAP = {
    "church": "church", "abbey": "monastery", "monastery": "monastery",
    "convent": "monastery", "priory": "monastery",
    "hostel": "budget", "b&b": "pension", "bed and breakfast": "pension",
    "hotel": "hotel_budget", "camping": "camping",
    "bunkhouse": "budget", "barn": "private_host",
    "donativo": "donativo", "free": "free",
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

class UKIrelandImporter(BaseImporter):
    SOURCE_ID = "uk_ireland"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, .accommodation, .listing, .place, li.item"):
                    a = card.find("a", href=True)
                    name_el = card.find(["h2","h3","h4","strong"])
                    name = (name_el or a or card).get_text(strip=True)[:80]
                    if not name or len(name) < 3: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"type|category|kind", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="uk_ireland",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
