"""
Wikidata Importer
==================
Queries Wikidata's SPARQL endpoint for pilgrim hostels,
monasteries offering accommodation, and religious buildings
along known European pilgrimage routes.

Wikidata is fully open (CC0) and has coordinates + links for
thousands of relevant sites.

Data source ID: "wikidata"
"""
from __future__ import annotations
import re
from framework import BaseImporter, HostRecord

SPARQL_URL = "https://query.wikidata.org/sparql"

# Query: pilgrim hostels and monasteries with coordinates in Europe
SPARQL_QUERY = """
SELECT DISTINCT ?item ?name ?lat ?lng ?type ?country ?website WHERE {
  {
    ?item wdt:P31/wdt:P279* wd:Q2643863 .  # pilgrim hostel
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q44613 .    # monastery
    ?item wdt:P2143|wdt:P6375 ?addr .       # has address / accommodation
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q1370598 .  # gite d'etape
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q3010369 .  # albergue
  }

  ?item wdt:P625 ?coord .
  ?item rdfs:label ?name . FILTER(LANG(?name) IN ("en","de","fr","es","it","pt","nl"))

  # Bounding box for Europe
  BIND(geof:latitude(?coord) AS ?lat)
  BIND(geof:longitude(?coord) AS ?lng)
  FILTER(?lat > 35 && ?lat < 72 && ?lng > -11 && ?lng < 40)

  OPTIONAL { ?item wdt:P17 ?countryItem .
             ?countryItem wdt:P297 ?country . }
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item wdt:P31 ?typeItem . ?typeItem rdfs:label ?type .
             FILTER(LANG(?type) = "en") }
}
LIMIT 5000
"""

TYPE_MAP = {
    "pilgrim hostel": "albergue_privado",
    "albergue": "albergue_privado",
    "monastery": "monastery",
    "convent": "monastery",
    "abbey": "monastery",
    "gîte d'étape": "gite_etape",
    "gite": "gite_etape",
    "hostel": "budget",
    "refuge": "refuge",
}

def _map_type(label: str) -> str:
    l = (label or "").lower()
    for k, v in TYPE_MAP.items():
        if k in l: return v
    return "budget"

class WikidataImporter(BaseImporter):
    SOURCE_ID = "wikidata"
    RATE_LIMIT_S = 1.0

    def fetch(self) -> list[HostRecord]:
        self.log.info("Querying Wikidata SPARQL (may take 30–60s)…")
        r = self.session.get(
            SPARQL_URL,
            params={"query": SPARQL_QUERY, "format": "json"},
            headers={"Accept": "application/sparql-results+json",
                     "User-Agent": "WanderkindBot/1.0 (+https://wanderkind.love)"},
            timeout=90,
        )
        r.raise_for_status()
        data = r.json()
        bindings = data.get("results", {}).get("bindings", [])
        self.log.info(f"  Wikidata returned {len(bindings)} results")

        records: list[HostRecord] = []
        seen: set[str] = set()

        for b in bindings:
            item_uri = b.get("item", {}).get("value", "")
            qid = item_uri.split("/")[-1]
            if qid in seen: continue
            seen.add(qid)

            name = b.get("name", {}).get("value", "")
            if not name: continue

            try:
                lat = float(b.get("lat", {}).get("value", ""))
                lng = float(b.get("lng", {}).get("value", ""))
            except (ValueError, TypeError):
                continue

            type_label = b.get("type", {}).get("value", "")
            country = b.get("country", {}).get("value", "")
            website = b.get("website", {}).get("value")

            records.append(HostRecord(
                name=name, lat=lat, lng=lng,
                host_type=_map_type(type_label),
                data_source="wikidata",
                source_id=f"wd:{qid}",
                source_url=item_uri,
                website=website,
                country=country or None,
            ))

        return records
