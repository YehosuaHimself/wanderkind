"""
AEVF Via Francigena Importer
=============================
The AEVF (Associazione Europea delle Vie Francigene) publishes
stage-by-stage accommodation lists for the Via Francigena
Canterbury → Rome and its variants.

We fetch their public accommodation search API / listing pages.

Data source ID: "aevf_francigena"
"""

from __future__ import annotations
import json, re

from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

BASE_URL = "https://www.viefrancigene.org"

# AEVF has a REST-ish endpoint for accommodations
ACCOMMODATIONS_API = f"{BASE_URL}/en/resource/accomodations/"

# Country coverage along the Via Francigena
COUNTRIES = ["GB", "FR", "CH", "IT"]

AEVF_TYPE_MAP = {
    "hostel": "budget",
    "pilgrim hostel": "albergue_privado",
    "monastery": "monastery",
    "convent": "monastery",
    "gîte": "gite_etape",
    "gite": "gite_etape",
    "rifugio": "refuge",
    "refuge": "refuge",
    "camping": "camping",
    "bed and breakfast": "pension",
    "hotel": "hotel_budget",
    "parish": "albergue_parroquial",
    "church": "church",
    "donativo": "donativo",
}

def _map_type(label: str) -> str:
    l = label.lower().strip()
    for k, v in AEVF_TYPE_MAP.items():
        if k in l:
            return v
    return "budget"


class AEVFFrancigeanaImporter(BaseImporter):
    SOURCE_ID = "aevf_francigena"
    RATE_LIMIT_S = 1.0

    def _fetch_page(self, page: int, page_size: int = 100) -> list[dict]:
        """Fetch one page of AEVF accommodations via their JSON API."""
        url = f"{ACCOMMODATIONS_API}?format=json&limit={page_size}&offset={page * page_size}"
        try:
            r = self.get(url)
            data = r.json()
            if isinstance(data, dict):
                return data.get("results", data.get("features", [data]))
            if isinstance(data, list):
                return data
            return []
        except Exception:
            pass

        # Fallback: scrape HTML listing
        url_html = f"{ACCOMMODATIONS_API}?page={page + 1}"
        try:
            r = self.get(url_html)
            soup = BeautifulSoup(r.text, "html.parser")
            results = []
            for card in soup.select(".accommodation-card, .resource-item, article"):
                item: dict = {}
                name_el = card.find(["h2", "h3", "h4"])
                if name_el:
                    item["name"] = name_el.get_text(strip=True)
                for a in card.find_all("a", href=True):
                    if "accommodation" in a["href"] or "lodging" in a["href"]:
                        item["url"] = a["href"] if a["href"].startswith("http") else BASE_URL + a["href"]
                # Coords from data attributes
                lat = card.get("data-lat") or card.get("data-latitude")
                lng = card.get("data-lng") or card.get("data-longitude")
                if lat and lng:
                    item["lat"], item["lng"] = float(lat), float(lng)
                if item.get("name"):
                    results.append(item)
            return results
        except Exception as e:
            self.log.warning(f"AEVF page {page} failed: {e}")
            return []

    def fetch(self) -> list[HostRecord]:
        records: list[HostRecord] = []
        page = 0

        while True:
            batch = self._fetch_page(page)
            if not batch:
                break

            for item in batch:
                # Handle both GeoJSON features and flat dicts
                if item.get("type") == "Feature":
                    props = item.get("properties", {})
                    geom = item.get("geometry", {})
                    coords = geom.get("coordinates", [])
                    lat = coords[1] if len(coords) >= 2 else None
                    lng = coords[0] if len(coords) >= 2 else None
                else:
                    props = item
                    lat = item.get("lat") or item.get("latitude")
                    lng = item.get("lng") or item.get("longitude") or item.get("lon")

                name = props.get("name") or props.get("title") or props.get("denomination")
                if not name or lat is None or lng is None:
                    continue

                try:
                    lat, lng = float(lat), float(lng)
                except (TypeError, ValueError):
                    continue

                type_label = props.get("type") or props.get("category") or props.get("accommodation_type") or ""
                host_type = _map_type(type_label)

                ext_id = str(props.get("id") or props.get("pk") or props.get("slug") or name)
                source_url = props.get("url") or props.get("website") or f"{BASE_URL}/en/resource/accomodations/{ext_id}/"

                country_code = props.get("country") or props.get("country_code") or ""

                records.append(HostRecord(
                    name=name,
                    lat=lat,
                    lng=lng,
                    host_type=host_type,
                    data_source="aevf_francigena",
                    source_id=f"aevf:{ext_id}",
                    source_url=source_url,
                    country=country_code[:2].upper() if country_code else None,
                    region=props.get("region") or props.get("province"),
                    address=props.get("address") or props.get("street"),
                    phone=props.get("phone") or props.get("telephone"),
                    email=props.get("email"),
                    website=props.get("website"),
                    capacity=int(props["capacity"]) if props.get("capacity") else None,
                    description=props.get("description") or props.get("notes"),
                    is_pilgrim_only=True,
                ))

            if len(batch) < 100:
                break
            page += 1

        self.log.info(f"  AEVF: {len(records)} accommodations parsed")
        return records
