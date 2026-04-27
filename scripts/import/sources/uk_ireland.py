"""UKIrelandImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class UKIrelandImporter(RegionalOverpassImporter):
    SOURCE_ID = "uk_ireland"
    COUNTRY = None
    REGION = "British Isles"
    BBOX = "49.7,-11.0,61.0,2.0"
    LANGUAGES = ["en","ga","cy","gd"]
    EXTRA_QUERY = """  node["tourism"="wilderness_hut"]({bbox});
  node["leisure"="bothy"]({bbox});"""
