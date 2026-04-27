"""
French Camino Associations Importer
=====================================
Covers the major French pilgrim associations and route guides:
- ACOSJ (Amis Compostelle) federation
- Miam Miam Dodo (Le Puy → SJPP guide website)
- Les Amis du Chemin de Saint-Jacques (multiple regional branches)
- Chemins du Mont-Saint-Michel

Data source ID: "france_assoc"
"""
from __future__ import annotations
import re, json
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://www.chemins-compostelle.com/les-chemins/hebergements", "ACOSJ"),
    ("https://www.miam-miam-dodo.com/les-etapes/", "MiamMiamDodo"),
    ("https://www.chemin-compostelle.info/hebergement/", "CheminInfo"),
    ("https://www.pilgrimpath.eu/accommodation/france/", "PilgrimPathFR"),
    ("https://www.lesamisduchemin.com/hebergements/", "AmisCheminFR"),
]

TYPE_MAP = {
    "gîte": "gite_etape", "gite": "gite_etape",
    "albergue": "albergue_privado", "auberge": "budget",
    "chambre": "pension", "hôtel": "hotel_budget", "hotel": "hotel_budget",
    "camping": "camping", "monastère": "monastery", "monastere": "monastery",
    "église": "church", "eglise": "church",
    "donativo": "donativo", "gratuit": "free",
}

def _map_type(label: str) -> str:
    l = label.lower()
    for k, v in TYPE_MAP.items():
        if k in l: return v
    return "gite_etape"

def _extract_coords(soup: BeautifulSoup, text: str = "") -> tuple:
    for a in soup.find_all("a", href=True):
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", a["href"])
        if m: return float(m.group(1)), float(m.group(2))
    for el in soup.find_all(attrs={"data-lat": True}):
        return float(el["data-lat"]), float(el.get("data-lng", el.get("data-lon", 0)))
    m = re.search(r'"lat"\s*:\s*(-?\d+\.\d+).*?"l[no]n"\s*:\s*(-?\d+\.\d+)', text)
    if m: return float(m.group(1)), float(m.group(2))
    return None, None

class FranceAssociationsImporter(BaseImporter):
    SOURCE_ID = "france_assoc"
    RATE_LIMIT_S = 2.0

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, label in SOURCES:
            self.log.info(f"  Fetching {label}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                cards = soup.select("article, .accommodation, .hebergement, .etape, .gite, li.item")
                for card in cards:
                    a = card.find("a", href=True)
                    name = (card.find(["h2","h3","h4"]) or a or card).get_text(strip=True)[:80]
                    if not name: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat:
                        if a:
                            try:
                                dr = self.get(urljoin(url, a["href"]))
                                ds = BeautifulSoup(dr.text, "html.parser")
                                lat, lng = _extract_coords(ds, dr.text)
                            except Exception:
                                pass
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"type|categ|badge", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "gite")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="france_assoc",
                        source_id=f"{label.lower()}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country="FR", is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {label} failed: {e}")
        return records
