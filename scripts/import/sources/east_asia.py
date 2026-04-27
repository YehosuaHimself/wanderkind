"""EastAsiaImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class EastAsiaImporter(RegionalOverpassImporter):
    SOURCE_ID = "east_asia"
    COUNTRY = None
    REGION = "East Asia"
    BBOX = "20.0,73.0,55.0,150.0"
    LANGUAGES = ["ko","zh","mn","en"]
    EXTRA_QUERY = """  node["amenity"="place_of_worship"]["religion"="buddhist"]({bbox});
  way ["amenity"="place_of_worship"]["religion"="buddhist"]({bbox});"""
