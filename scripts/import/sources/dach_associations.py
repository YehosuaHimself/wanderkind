"""
DACH (Germany / Austria / Switzerland) Associations Importer
=============================================================
Germany:    Deutsche St. Jakobus-Gesellschaft (jakobusgesellschaft.de)
            Ökumenische St. Jakobus-Pilgergemeinschaft (oekumenische-pilgergemeinschaft.de)
            Netzwerk Pilgern (netzwerk-pilgern.de)
            Fernwege.de (long-distance routes)
Austria:    Österreichische St. Jakobs-Gesellschaft (jacobsweg.at)
            Viasacra pilgrim routes
Switzerland: Jakobsweg.ch / SchweizMobil
             Via Jacobi accommodation listings

Data source ID: "dach_assoc"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://www.jakobusgesellschaft.de/pilgern/herbergen/", "DE", "de_jakobus"),
    ("https://www.oekumenische-pilgergemeinschaft.de/herbergen/", "DE", "de_oek"),
    ("https://www.netzwerk-pilgern.de/pilgerwege/herbergen/", "DE", "de_netzwerk"),
    ("https://www.fernwege.de/herbergen/", "DE", "de_fernwege"),
    ("https://www.jacobsweg.at/unterkunft/", "AT", "at_jakob"),
    ("https://www.jakobsweg.ch/de/unterkunft/", "CH", "ch_jakob"),
    ("https://www.pilgerwege-schweiz.ch/unterkuenfte/", "CH", "ch_pilgerwege"),
    ("https://www.viasacra.at/unterkunft/", "AT", "at_viasacra"),
]

TYPE_MAP = {
    "kloster": "monastery", "abtei": "monastery", "stift": "monastery",
    "kirche": "church", "pfarr": "albergue_parroquial",
    "herberge": "budget", "pilgerherberge": "albergue_asociacion",
    "jakobusherberge": "albergue_asociacion",
    "jugendherberge": "budget", "hostel": "budget",
    "camping": "camping", "zeltplatz": "camping",
    "pension": "pension", "gasthof": "pension",
    "hotel": "hotel_budget",
    "donativo": "donativo", "frei": "free",
    "hütte": "refuge", "huette": "refuge", "hutte": "refuge",
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
    m = re.search(r'"lat"\s*:\s*(-?\d+\.\d+)', text)
    n = re.search(r'"l[no]n[g]?"\s*:\s*(-?\d+\.\d+)', text)
    if m and n: return float(m.group(1)), float(n.group(1))
    return None, None

class DACHAssociationsImporter(BaseImporter):
    SOURCE_ID = "dach_assoc"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, li.herberge, .unterkunft, .accommodation, .views-row"):
                    a = card.find("a", href=True)
                    name_el = card.find(["h2","h3","h4","strong"])
                    name = (name_el or a or card).get_text(strip=True)[:80]
                    if not name or len(name) < 3: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"typ|type|art|kategorie", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="dach_assoc",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
