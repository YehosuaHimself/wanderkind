"""
Benelux Pilgrim Associations Importer
======================================
Belgium: Les Amis de Saint-Jacques en Belgique (saintjacques.be)
         Vlaams Genootschap van Santiago (vlaamse-jakobienen.be)
Netherlands: Genootschap van Sint Jacob (jacobijnederland.nl)
             Pieterpad / LAW routes network
Luxembourg: Luxembourg pilgrim routes

Data source ID: "benelux_assoc"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://www.saintjacques.be/hebergements/", "BE", "csj_be"),
    ("https://www.vlaamse-jakobienen.be/overnachten/", "BE", "vlaams_jakob"),
    ("https://www.jacobijnederland.nl/pelgrimsverblijven/", "NL", "jacob_nl"),
    ("https://www.pieterpad.nl/overnachten/", "NL", "pieterpad"),
    ("https://www.camino.be/logement/", "BE", "camino_be"),
    ("https://www.stichting-sint-jacob.nl/adressen/", "NL", "stichting_jacob"),
]

TYPE_MAP = {
    "donativo": "donativo", "vrij": "free", "gratuit": "free",
    "kerk": "church", "église": "church", "kloster": "monastery",
    "abdij": "monastery", "abbaye": "monastery",
    "herberg": "budget", "hostel": "budget", "auberge": "budget",
    "pension": "pension", "camping": "camping",
    "privé": "private_host", "prive": "private_host",
    "jakobs": "albergue_asociacion",
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
    m = re.search(r"lat[itude]*['\"]?\s*[=:]\s*(-?\d+\.\d+)", text)
    n = re.search(r"l[no]n[g]*['\"]?\s*[=:]\s*(-?\d+\.\d+)", text)
    if m and n: return float(m.group(1)), float(n.group(1))
    return None, None

class BeneluxAssociationsImporter(BaseImporter):
    SOURCE_ID = "benelux_assoc"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, li.item, .verblijf, .logement, .hebergement, .accommodation"):
                    a = card.find("a", href=True)
                    name_el = card.find(["h2","h3","h4","strong"])
                    name = (name_el or a or card).get_text(strip=True)[:80]
                    if not name: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"type|categ|soort", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="benelux_assoc",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
