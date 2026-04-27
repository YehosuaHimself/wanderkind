"""GronzeImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class GronzeImporter(RegionalOverpassImporter):
    SOURCE_ID = "gronze"
    COUNTRY = "Spain"
    REGION = None
    BBOX = "36.0,-10.0,44.0,3.5"
    LANGUAGES = ["es","en"]
    EXTRA_QUERY = """  node["religion"="christian"]["amenity"="place_of_worship"]["name"~"[Aa]lbergue|[Pp]arroquia"]({bbox});"""
