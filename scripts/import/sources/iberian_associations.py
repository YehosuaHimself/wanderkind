"""
Iberian Peninsula Associations Importer
========================================
Portugal: Associação dos Amigos do Caminho Português de Santiago
          Centro Português de Peregrinos
          Turismo de Portugal pilgrim accommodation
Spain (beyond Gronze):
          Camino del Norte associations
          Via de la Plata (Vía de la Plata associations)
          Camino del Sureste / Levante
          Red de Albergues de Peregrinos (RAP)
          Eroski consumer albergue guide

Data source ID: "iberian_assoc"
"""
from __future__ import annotations
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

SOURCES = [
    ("https://www.caminoportugues.pt/albergues/", "PT", "pt_caminho"),
    ("https://www.apostoloportugal.pt/albergues/", "PT", "pt_apostolo"),
    ("https://www.caminodesantiago.consumer.es/albergues/", "ES", "es_consumer"),
    ("https://www.caminonorte.info/albergues/", "ES", "es_norte"),
    ("https://www.viaplatensis.com/albergues/", "ES", "es_plata"),
    ("https://www.caminolevante.com/alojamiento/", "ES", "es_levante"),
    ("https://www.caminodesantiago.me/book/albergues/", "ES", "es_pilgrim_me"),
    ("https://www.gronze.com/camino-portugues/albergues", "PT", "gronze_pt"),
    ("https://www.gronze.com/camino-norte/albergues", "ES", "gronze_norte"),
    ("https://www.gronze.com/via-de-la-plata/albergues", "ES", "gronze_plata"),
]

TYPE_MAP = {
    "municipal": "albergue_municipal", "municipal": "albergue_municipal",
    "parroquial": "albergue_parroquial", "parish": "albergue_parroquial",
    "asociación": "albergue_asociacion", "associação": "albergue_asociacion",
    "privado": "albergue_privado", "privada": "albergue_privado",
    "donativo": "donativo",
    "mosteiro": "monastery", "monasterio": "monastery", "convento": "monastery",
    "igreja": "church", "iglesia": "church",
    "camping": "camping", "refúgio": "refuge", "refugio": "refuge",
    "pensão": "pension", "pensión": "pension",
}

def _map_type(label: str) -> str:
    l = label.lower()
    for k, v in TYPE_MAP.items():
        if k in l: return v
    return "albergue_privado"

def _extract_coords(soup, text=""):
    for el in soup.find_all(attrs={"data-lat": True}):
        return float(el["data-lat"]), float(el.get("data-lng", el.get("data-lon", 0)))
    for a in soup.find_all("a", href=True):
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", a["href"])
        if m: return float(m.group(1)), float(m.group(2))
    return None, None

class IberianAssociationsImporter(BaseImporter):
    SOURCE_ID = "iberian_assoc"
    RATE_LIMIT_S = 1.5

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        for url, country, sid_prefix in SOURCES:
            self.log.info(f"  {sid_prefix}: {url}")
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                for card in soup.select("article, .albergue, .accommodation, .views-row, li.item"):
                    a = card.find("a", href=True)
                    name_el = card.find(["h2","h3","h4","strong"])
                    name = (name_el or a or card).get_text(strip=True)[:80]
                    if not name or len(name) < 3: continue
                    lat, lng = _extract_coords(card, card.decode())
                    if not lat: continue
                    type_el = card.find(class_=re.compile(r"tipo|type|categ", re.I))
                    ht = _map_type(type_el.get_text() if type_el else "")
                    slug = re.sub(r"[^a-z0-9]", "-", name.lower())[:40]
                    records.append(HostRecord(
                        name=name, lat=lat, lng=lng, host_type=ht,
                        data_source="iberian_assoc",
                        source_id=f"{sid_prefix}:{slug}",
                        source_url=urljoin(url, a["href"]) if a else url,
                        country=country, is_pilgrim_only=True,
                    ))
            except Exception as e:
                self.log.warning(f"  {sid_prefix} failed: {e}")
        return records
