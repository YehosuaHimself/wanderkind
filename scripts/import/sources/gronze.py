"""
Gronze.com Importer
===================
Gronze is the largest open Camino accommodation database.
It lists albergues stage-by-stage for all major Camino routes.

Routes covered:
  camino-frances, camino-portugues, camino-del-norte, camino-primitivo,
  camino-ingles, via-de-la-plata, camino-aragones, camino-del-sureste

Data source ID: "gronze"
External ID format: "gronze:{slug}" (e.g. "gronze:albergue-de-peregrinos-orisson")
"""

from __future__ import annotations
import re, time
from typing import Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

BASE_URL = "https://www.gronze.com"

ROUTES = [
    "camino-frances",
    "camino-portugues",
    "camino-norte",
    "camino-primitivo",
    "camino-ingles",
    "via-de-la-plata",
    "camino-aragones",
    "camino-del-sureste",
    "camino-sanabres",
    "camino-bazan",
]

# Gronze type labels → WK host_type
TYPE_MAP = {
    "municipal": "albergue_municipal",
    "parroquial": "albergue_parroquial",
    "asociación": "albergue_asociacion",
    "asociacion": "albergue_asociacion",
    "privado": "albergue_privado",
    "privada": "albergue_privado",
    "donativo": "donativo",
    "monasterio": "monastery",
    "convento": "monastery",
    "refugio": "refuge",
    "camping": "camping",
    "pensión": "pension",
    "pension": "pension",
    "hostal": "budget",
    "hotel": "hotel_budget",
}

def _gronze_type(label: str) -> str:
    l = label.lower().strip()
    for k, v in TYPE_MAP.items():
        if k in l:
            return v
    return "albergue_privado"


def _parse_lat_lng(text: str) -> tuple[Optional[float], Optional[float]]:
    """Extract lat/lng from Google Maps link or meta tags."""
    m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", text)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"lat[=:](-?\d+\.\d+).*?l[no]n[g=:](-?\d+\.\d+)", text, re.I)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None


class GronzeImporter(BaseImporter):
    SOURCE_ID = "gronze"
    RATE_LIMIT_S = 1.5

    def _get_albergue_detail(self, url: str) -> dict:
        """Fetch a single albergue detail page and extract structured data."""
        try:
            r = self.get(url)
            soup = BeautifulSoup(r.text, "html.parser")

            data: dict = {}

            # Coordinates — from Google Maps link
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if "google.com/maps" in href or "maps.google" in href:
                    lat, lng = _parse_lat_lng(href)
                    if lat:
                        data["lat"], data["lng"] = lat, lng
                        break

            # Also check meta og:description or JSON-LD
            for script in soup.find_all("script", type="application/ld+json"):
                try:
                    import json
                    ld = json.loads(script.string)
                    geo = ld.get("geo") or (ld.get("@graph", [{}])[0].get("geo") if isinstance(ld, dict) else None)
                    if geo:
                        data["lat"] = float(geo.get("latitude", 0)) or data.get("lat")
                        data["lng"] = float(geo.get("longitude", 0)) or data.get("lng")
                except Exception:
                    pass

            # Phone / email
            for a in soup.find_all("a", href=True):
                if a["href"].startswith("tel:") and "phone" not in data:
                    data["phone"] = a["href"][4:]
                if a["href"].startswith("mailto:") and "email" not in data:
                    data["email"] = a["href"][7:]

            # Capacity
            cap_el = soup.find(string=re.compile(r"\d+\s*(plazas?|camas?|beds?)", re.I))
            if cap_el:
                m = re.search(r"(\d+)", cap_el)
                if m:
                    data["capacity"] = int(m.group(1))

            # Description
            desc = soup.find("div", class_=re.compile(r"description|body|content", re.I))
            if desc:
                data["description"] = desc.get_text(" ", strip=True)[:500]

            # Address
            addr = soup.find(itemprop="address") or soup.find("span", class_=re.compile(r"addr|location", re.I))
            if addr:
                data["address"] = addr.get_text(" ", strip=True)

            return data
        except Exception as e:
            self.log.warning(f"  Detail fetch failed for {url}: {e}")
            return {}

    def _get_route_albergues(self, route: str) -> list[HostRecord]:
        """Crawl the listing page for one route, then fetch each detail page."""
        records = []
        page = 1
        while True:
            url = f"{BASE_URL}/{route}/albergues" + (f"?page={page}" if page > 1 else "")
            self.log.info(f"  {route} page {page}: {url}")
            try:
                r = self.get(url)
            except Exception as e:
                self.log.warning(f"  Failed: {e}")
                break

            soup = BeautifulSoup(r.text, "html.parser")

            # Each albergue is in an article / list-item with a link
            items = soup.select("article.albergue, li.albergue, div.views-row")
            if not items:
                # Try generic card links
                items = soup.select(".view-content .views-row, .albergues-list li")
            if not items:
                break

            for item in items:
                link = item.find("a", href=True)
                if not link:
                    continue

                href = link["href"]
                if not href.startswith("http"):
                    href = urljoin(BASE_URL, href)

                name = link.get_text(strip=True) or item.find("h2", "h3").get_text(strip=True) if item.find("h2") else link.get_text(strip=True)
                if not name:
                    continue

                # Type from badge/label
                type_el = item.find(class_=re.compile(r"tipo|type|badge", re.I))
                host_type = _gronze_type(type_el.get_text() if type_el else "privado")

                # Slug as source_id
                slug = re.sub(r"https?://[^/]+", "", href).strip("/").split("/")[-1]
                source_id = f"gronze:{slug}"

                detail = self._get_albergue_detail(href)

                if "lat" not in detail or "lng" not in detail:
                    self.log.debug(f"  No coords for {name}, skip")
                    continue

                records.append(HostRecord(
                    name=name,
                    lat=detail["lat"],
                    lng=detail["lng"],
                    host_type=host_type,
                    data_source="gronze",
                    source_id=source_id,
                    source_url=href,
                    phone=detail.get("phone"),
                    email=detail.get("email"),
                    capacity=detail.get("capacity"),
                    description=detail.get("description"),
                    address=detail.get("address"),
                    country="ES",
                    is_pilgrim_only=True,
                ))

            # Next page?
            next_link = soup.find("a", rel="next") or soup.find("li", class_="pager-next")
            if not next_link:
                break
            page += 1

        return records

    def fetch(self) -> list[HostRecord]:
        all_records: list[HostRecord] = []
        for route in ROUTES:
            self.log.info(f"Processing route: {route}")
            records = self._get_route_albergues(route)
            self.log.info(f"  → {len(records)} albergues")
            all_records.extend(records)
        return all_records
