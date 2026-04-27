"""IndiaHimalayaImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class IndiaHimalayaImporter(RegionalOverpassImporter):
    SOURCE_ID = "india_himalaya"
    COUNTRY = None
    REGION = "India & Himalaya"
    BBOX = "5.0,68.0,37.0,98.0"
    BBOXES = ["5.0,68.0,21.0,98.0", "21.0,68.0,30.0,90.0", "30.0,68.0,37.0,98.0"]
    LANGUAGES = ["hi","en","ne","bo"]
    EXTRA_QUERY = """  node["tourism"="dharmshala"]({bbox});
  node["amenity"="place_of_worship"]["religion"~"hindu|sikh|buddhist|jain"]({bbox});
  way ["amenity"="place_of_worship"]["religion"~"hindu|sikh|buddhist|jain"]({bbox});"""
