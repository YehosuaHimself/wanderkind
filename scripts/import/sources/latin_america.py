"""LatinAmericaImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class LatinAmericaImporter(RegionalOverpassImporter):
    SOURCE_ID = "latin_america"
    COUNTRY = None
    REGION = "Latin America"
    BBOX = "-56.0,-118.0,33.0,-32.0"
    LANGUAGES = ["es","pt","en"]
    EXTRA_QUERY = """  node["amenity"="place_of_worship"]["name"~"[Mm]onasterio|[Mm]osteiro|[Aa]bbazia|[Cc]onvent"]({bbox});"""
