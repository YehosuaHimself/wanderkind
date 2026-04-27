"""
Xunta de Galicia — Official Spanish Pilgrim Albergue Registry
=============================================================
The Galician government maintains the official public albergue
registry for the Camino de Santiago, covering all routes through
Galicia including the last 100km of Camino Francés.

Source: https://www.caminodesantiago.gal/en/pilgrims-office/albergues
Data source ID: "xunta_galicia"
"""
from __future__ import annotations
import re, json
from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

BASE = "https://www.caminodesantiago.gal"
ALBERGUES_URL = f"{BASE}/en/pilgrims-office/albergues"
API_URL = f"{BASE}/api/albergues"  # may exist

TYPE_MAP = {
    "municipal": "albergue_municipal",
    "asociación": "albergue_asociacion",
    "asociacion": "albergue_asociacion",
    "privado": "albergue_privado",
    "privada": "albergue_privado",
    "donativo": "donativo",
    "parroquial": "albergue_parroquial",
}

class XuntaGaliciaImporter(BaseImporter):
    SOURCE_ID = "xunta_galicia"
    RATE_LIMIT_S = 1.5

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        # Try JSON API first
        try:
            r = self.get(API_URL, params={"format": "json", "limit": 500})
            data = r.json()
            if isinstance(data, list) and data:
                for item in data:
                    lat = item.get("lat") or item.get("latitude")
                    lng = item.get("lng") or item.get("longitude") or item.get("lon")
                    name = item.get("name") or item.get("nombre")
                    if not (name and lat and lng):
                        continue
                    t = item.get("tipo", item.get("type", "privado")).lower()
                    ht = next((v for k, v in TYPE_MAP.items() if k in t), "albergue_privado")
                    records.append(HostRecord(
                        name=name, lat=float(lat), lng=float(lng),
                        host_type=ht, data_source="xunta_galicia",
                        source_id=f"xunta:{item.get('id', name)}",
                        country="ES", region="Galicia",
                        phone=item.get("telefono") or item.get("phone"),
                        email=item.get("email"), capacity=item.get("plazas"),
                        is_pilgrim_only=True,
                    ))
                return records
        except Exception:
            pass

        # HTML scrape fallback
        try:
            r = self.get(ALBERGUES_URL)
            soup = BeautifulSoup(r.text, "html.parser")
            # Look for map data embedded in page (common pattern)
            for script in soup.find_all("script"):
                text = script.string or ""
                matches = re.findall(r'\{[^{}]*"lat"\s*:\s*(-?\d+\.\d+)[^{}]*"lng"\s*:\s*(-?\d+\.\d+)[^{}]*\}', text)
                for m in matches:
                    self.log.debug(f"Found coords in script: {m}")
        except Exception as e:
            self.log.warning(f"Xunta scrape failed: {e}")

        return records
