"""AfricaPilgrimImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class AfricaPilgrimImporter(RegionalOverpassImporter):
    SOURCE_ID = "africa_pilgrim"
    COUNTRY = None
    REGION = "Africa"
    BBOX = "-35.0,-20.0,38.0,52.0"
    BBOXES = ["15.0,-20.0,38.0,12.0", "15.0,12.0,38.0,52.0", "0.0,-20.0,15.0,15.0", "0.0,15.0,15.0,52.0", "-35.0,-20.0,0.0,15.0", "-35.0,15.0,0.0,52.0"]
    LANGUAGES = ["ar","fr","en","sw","am"]
    EXTRA_QUERY = """  node["amenity"="monastery"]({bbox});
  node["amenity"="place_of_worship"]["religion"~"christian|muslim|coptic_orthodox"]({bbox});"""
