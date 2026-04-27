"""MiddleEastSafeImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class MiddleEastSafeImporter(RegionalOverpassImporter):
    SOURCE_ID = "middle_east_safe"
    COUNTRY = None
    REGION = "Middle East / Caucasus"
    BBOX = "29.0,25.0,43.5,50.0"
    BBOXES = ["36.0,25.0,43.0,45.0", "35.0,40.0,43.5,50.0", "29.0,33.0,33.5,40.0"]
    LANGUAGES = ["tr","hy","ka","ar","en"]
    EXTRA_QUERY = """  node["amenity"="monastery"]({bbox});
  node["historic"="monastery"]({bbox});"""
