"""NordicRoutesImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class NordicRoutesImporter(RegionalOverpassImporter):
    SOURCE_ID = "nordic"
    COUNTRY = None
    REGION = "Nordic"
    BBOX = "54.0,-25.0,72.0,32.0"
    LANGUAGES = ["no","sv","fi","da","is","en"]
    EXTRA_QUERY = """  node["tourism"="wilderness_hut"]({bbox});
  node["leisure"="bothy"]({bbox});"""
