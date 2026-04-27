"""
North America & Canada Pilgrim Routes Importer
===============================================
USA:
  - American Pilgrims on the Camino (americanpilgrims.org)
  - Camino Society America
  - El Camino Real de los Tejas (TX historic mission trail)
  - Old Mission Trail / California Missions
  - North Cascades / Pacific Crest pilgrim rest spots
  - Via Francigena USA (growing)
  - Pilgrimage routes to various shrines (Chimayó, Guadalupe, etc.)

Canada:
  - Canadian Company of Pilgrims (canadianpilgrims.ca)
  - Camino de Santiago Quebec (caminoquebec.org)
  - Mi'kmaq Trail / Nova Scotia pilgrim route
  - Ontario Camino
  - BC Camino (West Coast Camino)

Data source ID: "north_america"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    # USA
    ("https://www.americanpilgrims.org/resources/accommodation/", "US", "ampi_us"),
    ("https://www.caminosocietyamerica.org/accommodation/", "US", "camino_soc_us"),
    ("https://www.elcaminorealtx.com/accommodation/", "US", "camino_tx"),
    ("https://www.californiacamino.org/stays/", "US", "camino_ca"),
    ("https://www.shrineofchimayo.com/pilgrimage/", "US", "chimayo"),
    ("https://www.usacamino.org/hosts/", "US", "usa_camino"),
    # Canada
    ("https://www.canadianpilgrims.ca/accommodation/", "CA", "cdn_pilgrims"),
    ("https://www.caminoquebec.org/hebergements/", "CA", "camino_qc"),
    ("https://www.ontariocamino.ca/stays/", "CA", "camino_on"),
    ("https://www.bccamino.ca/accommodation/", "CA", "camino_bc"),
    ("https://www.novascotiacamino.ca/accommodation/", "CA", "camino_ns"),
]

TYPE_MAP = {
    "monastery": "monastery", "abbey": "monastery", "convent": "monastery",
    "church": "church", "mission": "church", "shrine": "church",
    "hostel": "budget", "pilgrim hostel": "albergue_privado",
    "b&b": "pension", "bed and breakfast": "pension",
    "hotel": "hotel_budget", "motel": "hotel_budget",
    "camping": "camping", "campground": "camping",
    "private": "private_host", "home": "private_host",
    "donativo": "donativo", "free": "free",
    "refuge": "refuge", "hut": "refuge",
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
    m = re.search(r'"lat(?:itude)?"\s*:\s*(-?\d+\.\d+)', text)
    n = re.search(r'"l(?:ng|on|ong(?:itude)?)"?\s*:\s*(-?\d+\.\d+)', text)
    if m and n: return float(m.group(1)), float(n.group(1))
    return None, None

class NorthAmericaImporter(BaseImporter):
    SOURCE_ID = "north_america"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, .accommodation, .host, .listing, .place, li.item, .stay"):
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
                        data_source="north_america",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
