"""NorthAmericaImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class NorthAmericaImporter(RegionalOverpassImporter):
    SOURCE_ID = "north_america"
    COUNTRY = None
    REGION = "North America"
    BBOX = "23.0,-170.0,72.0,-50.0"
    BBOXES = ["23.0,-170.0,72.0,-110.0", "23.0,-110.0,72.0,-90.0", "23.0,-90.0,72.0,-70.0", "23.0,-70.0,72.0,-50.0"]
    LANGUAGES = ["en","es","fr"]
    EXTRA_QUERY = """  node["tourism"="wilderness_hut"]({bbox});
  node["leisure"="bothy"]({bbox});"""
