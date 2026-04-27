"""ItalyRoutesImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class ItalyRoutesImporter(RegionalOverpassImporter):
    SOURCE_ID = "italy"
    COUNTRY = "Italy"
    REGION = None
    BBOX = "35.0,6.5,47.5,19.0"
    BBOXES = ["42.5,6.5,47.5,14.0", "35.0,8.0,42.5,19.0"]
    LANGUAGES = ["it","en"]
    EXTRA_QUERY = """  node["tourism"="wilderness_hut"]({bbox});
  node["amenity"="place_of_worship"]["name"~"[Aa]bbazia|[Mm]onastero|[Cc]onvento"]({bbox});"""
