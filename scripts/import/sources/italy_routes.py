"""
Italian Pilgrimage Routes Importer
====================================
Italy has the richest network of pilgrim routes in Europe.
Sources:
  - AEVF Via Francigena (already in aevf_francigena.py — we add regional ones)
  - Cammino di Francesco (franciscoways.com)
  - Cammino di San Benedetto (camminodibenedetto.it)
  - Via Romea Germanica (viaromea.it)
  - Cammino Materano (camminomaterano.it)
  - Cammino di Assisi (camminidiassisi.it)
  - Via Micaelica / Cammino Micaelico
  - Cammino dei Borghi Silenti
  - Confraternita di San Jacopo di Compostella (Italy)
  - Reteat houses (case per ferie) networkS

Data source ID: "italy_routes"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://www.franciscoways.com/accommodation/", "IT", "cammino_francesco"),
    ("https://www.camminodibenedetto.it/tappe/", "IT", "cammino_benedetto"),
    ("https://www.viaromea.it/accoglienza/", "IT", "via_romea"),
    ("https://www.camminomaterano.it/ospitalita/", "IT", "cammino_materano"),
    ("https://www.camminidiassisi.it/tappe/", "IT", "cammino_assisi"),
    ("https://www.cammino5terre.it/ospitalita/", "IT", "cammino_5terre"),
    ("https://www.camminodirome.it/accoglienza/", "IT", "cammino_roma"),
    ("https://www.viafrancigena.info/tappe/", "IT", "via_francigena_info"),
    ("https://www.camminoviadellesale.it/ospitalita/", "IT", "via_sale"),
    ("https://www.pellegrini.net/ospitalita/", "IT", "pellegrini_net"),
]

TYPE_MAP = {
    "monastero": "monastery", "convento": "monastery", "abbazia": "monastery",
    "chiesa": "church", "parrocchia": "albergue_parroquial",
    "ostello": "budget", "albergo": "hotel_budget",
    "rifugio": "refuge", "bivacco": "refuge",
    "camping": "camping", "agriturismo": "pension",
    "b&b": "pension", "affittacamere": "pension",
    "donativo": "donativo", "gratuito": "free",
    "casa per ferie": "budget", "ostello del pellegrino": "albergue_privado",
    "accoglienza": "private_host",
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

class ItalyRoutesImporter(BaseImporter):
    SOURCE_ID = "italy_routes"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, .tappa, .ospitalita, .accommodation, .struttura, li.item"):
                    a = card.find("a", href=True)
                    name_el = card.find(["h2","h3","h4","strong"])
                    name = (name_el or a or card).get_text(strip=True)[:80]
                    if not name or len(name) < 3: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"tipo|type|struttura|categ", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="italy_routes",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
