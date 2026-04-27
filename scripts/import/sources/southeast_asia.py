"""SoutheastAsiaImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class SoutheastAsiaImporter(RegionalOverpassImporter):
    SOURCE_ID = "southeast_asia"
    COUNTRY = None
    REGION = "Southeast Asia"
    BBOX = "-11.0,92.0,28.5,141.0"
    LANGUAGES = ["th","vi","my","id","en"]
    EXTRA_QUERY = """  node["amenity"="place_of_worship"]["religion"="buddhist"]({bbox});"""
