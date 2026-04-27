"""FranceAssociationsImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class FranceAssociationsImporter(RegionalOverpassImporter):
    SOURCE_ID = "france"
    COUNTRY = "France"
    REGION = None
    BBOX = "41.3,-5.5,51.5,9.5"
    LANGUAGES = ["fr","en"]
    EXTRA_QUERY = """  node["amenity"="place_of_worship"]["name"~"[Pp]rieuré|[Aa]bbaye"]({bbox});"""
