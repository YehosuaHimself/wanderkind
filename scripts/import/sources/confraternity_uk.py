"""
Confraternity of Saint James (UK) Importer
===========================================
The Confraternity of Saint James publishes the most comprehensive
English-language guide to pilgrim accommodation, covering Spain,
France, Portugal and beyond.

Their public accommodation search at:
  https://www.csj.org.uk/pilgrim-services/pilgrim-accommodation/

Data source ID: "confraternity_uk"
"""

from __future__ import annotations
import re, json
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from framework import BaseImporter, HostRecord

BASE_URL = "https://www.csj.org.uk"
LIST_URL = f"{BASE_URL}/pilgrim-services/pilgrim-accommodation/"

# CSJ type labels
TYPE_MAP = {
    "albergue": "albergue_privado",
    "municipal": "albergue_municipal",
    "parish": "albergue_parroquial",
    "parroquial": "albergue_parroquial",
    "monastery": "monastery",
    "convent": "monastery",
    "gîte": "gite_etape",
    "gite": "gite_etape",
    "donativo": "donativo",
    "private": "private_host",
    "hostel": "budget",
    "refuge": "refuge",
    "camping": "camping",
    "pension": "pension",
    "hotel": "hotel_budget",
    "church": "church",
}

def _map_type(label: str) -> str:
    l = label.lower()
    for k, v in TYPE_MAP.items():
        if k in l:
            return v
    return "budget"


def _extract_coords_from_page(soup: BeautifulSoup) -> tuple[float | None, float | None]:
    """Look for Google Maps embeds or JSON-LD geo data."""
    for a in soup.find_all("a", href=True):
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", a["href"])
        if m:
            return float(m.group(1)), float(m.group(2))
        m = re.search(r"[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)", a["href"])
        if m:
            return float(m.group(1)), float(m.group(2))
    for iframe in soup.find_all("iframe", src=True):
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", iframe["src"])
        if m:
            return float(m.group(1)), float(m.group(2))
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            ld = json.loads(script.string or "")
            geo = ld.get("geo") if isinstance(ld, dict) else None
            if geo:
                return float(geo.get("latitude", 0)), float(geo.get("longitude", 0))
        except Exception:
            pass
    return None, None


class ConfraternityUKImporter(BaseImporter):
    SOURCE_ID = "confraternity_uk"
    RATE_LIMIT_S = 2.0  # respectful crawl

    def _get_listing_links(self) -> list[tuple[str, str]]:
        """Return list of (name, url) for each accommodation entry."""
        links = []
        page = 1
        while True:
            url = LIST_URL + (f"?page={page}" if page > 1 else "")
            try:
                r = self.get(url)
            except Exception as e:
                self.log.warning(f"CSJ listing page {page} failed: {e}")
                break

            soup = BeautifulSoup(r.text, "html.parser")

            # Try to find accommodation cards / list items
            items = soup.select("article, .accommodation-item, .views-row, .field-item")
            found = 0
            for item in items:
                a = item.find("a", href=True)
                if not a:
                    continue
                href = a["href"]
                if not href.startswith("http"):
                    href = urljoin(BASE_URL, href)
                # Only follow accommodation detail links
                if "accommodation" not in href and "pilgrim" not in href and "albergue" not in href:
                    continue
                name = a.get_text(strip=True)
                if name and href not in [l[1] for l in links]:
                    links.append((name, href))
                    found += 1

            if not found:
                break
            next_el = soup.find("a", rel="next") or soup.find("li", class_="pager-next")
            if not next_el:
                break
            page += 1

        return links

    def fetch(self) -> list[HostRecord]:
        self.log.info(f"Fetching CSJ accommodation listing from {LIST_URL}")
        links = self._get_listing_links()
        self.log.info(f"  Found {len(links)} listing links")

        records: list[HostRecord] = []
        for name, url in links:
            try:
                r = self.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
            except Exception as e:
                self.log.warning(f"  Detail fetch failed {url}: {e}")
                continue

            lat, lng = _extract_coords_from_page(soup)
            if lat is None:
                self.log.debug(f"  No coords: {name}")
                continue

            # Type from page content
            type_label = ""
            for el in soup.find_all(class_=re.compile(r"type|category|badge", re.I)):
                type_label = el.get_text(strip=True)
                if type_label:
                    break
            host_type = _map_type(type_label)

            # Contact info
            phone, email, website = None, None, None
            for a in soup.find_all("a", href=True):
                if a["href"].startswith("tel:") and not phone:
                    phone = a["href"][4:].strip()
                if a["href"].startswith("mailto:") and not email:
                    email = a["href"][7:].strip()
                if a["href"].startswith("http") and "csj" not in a["href"] and not website:
                    website = a["href"]

            # Description
            desc_el = soup.find("div", class_=re.compile(r"body|description|content|field-body", re.I))
            description = desc_el.get_text(" ", strip=True)[:500] if desc_el else None

            # Country from URL or page
            country = None
            if "/spain/" in url or "/camino" in url or "/es/" in url:
                country = "ES"
            elif "/france/" in url or "/fr/" in url:
                country = "FR"
            elif "/portugal/" in url or "/pt/" in url:
                country = "PT"
            elif "/italy/" in url or "/it/" in url:
                country = "IT"
            elif "/germany/" in url or "/de/" in url:
                country = "DE"

            slug = url.rstrip("/").split("/")[-1]
            source_id = f"csj:{slug}"

            records.append(HostRecord(
                name=name,
                lat=lat,
                lng=lng,
                host_type=host_type,
                data_source="confraternity_uk",
                source_id=source_id,
                source_url=url,
                country=country,
                phone=phone,
                email=email,
                website=website,
                description=description,
                is_pilgrim_only=True,
            ))

        return records
