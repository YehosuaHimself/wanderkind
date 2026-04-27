"""
Central & Eastern Europe Pilgrim Routes Importer
==================================================
Poland:    Camino Polaco / Via Regia (caminopolaco.pl)
           Droga Królewska (polish pilgrim routes)
Czech Rep: Via Sancti Martini, Czech Jakobsweg
Slovakia:  Slovak pilgrim routes (camino.sk)
Hungary:   Hungarian pilgrim ways (zarándokút.hu)
Croatia:   Via Adriatica, Croatian pilgrim ways
Slovenia:  Pot miru / St James Way Slovenia
Romania:   Via Transilvanica (viiatransilvanica.ro)
Greece:    Egnatia Way

Data source ID: "central_eastern_eu"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://www.caminopolaco.pl/noclegi/", "PL", "pl_camino"),
    ("https://www.jakobsweg.cz/ubytovani/", "CZ", "cz_jakob"),
    ("https://www.camino.sk/ubytovanie/", "SK", "sk_camino"),
    ("https://www.zarandokut.hu/szallasok/", "HU", "hu_zarand"),
    ("https://www.viaadriatiaca.hr/smjestaj/", "HR", "hr_adriatica"),
    ("https://www.potmiru.si/prenoci/", "SI", "si_potmiru"),
    ("https://www.viiatransilvanica.ro/cazare/", "RO", "ro_transil"),
    ("https://www.evia-egnatia.eu/accommodation/", "GR", "gr_egnatia"),
    ("https://www.jakobusweg.at/herbergen/", "AT", "at_jakob2"),
    ("https://www.caminobaltico.pl/noclegi/", "PL", "pl_baltico"),
]

TYPE_MAP = {
    "klasztor": "monastery", "kloster": "monastery", "monastère": "monastery",
    "kościół": "church", "kirche": "church", "crkva": "church",
    "schronisko": "budget", "hostel": "budget", "szállás": "budget",
    "kemping": "camping", "camping": "camping",
    "pensjonat": "pension", "penzion": "pension",
    "donativo": "donativo", "gratis": "free",
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

class CentralEasternEuropeImporter(BaseImporter):
    SOURCE_ID = "central_eastern_eu"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, .nocleg, .szallas, .smjestaj, .ubytovani, li.item, .accommodation"):
                    a = card.find("a", href=True)
                    name_el = card.find(["h2","h3","h4","strong"])
                    name = (name_el or a or card).get_text(strip=True)[:80]
                    if not name or len(name) < 3: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"typ|type|categ|rodzaj", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="central_eastern_eu",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
