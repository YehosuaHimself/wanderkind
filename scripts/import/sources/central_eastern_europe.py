"""CentralEasternEuropeImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class CentralEasternEuropeImporter(RegionalOverpassImporter):
    SOURCE_ID = "central_east"
    COUNTRY = None
    REGION = "Central & Eastern Europe"
    BBOX = "34.0,12.0,55.5,30.0"
    LANGUAGES = ["pl","cs","sk","hu","ro","bg","el","en"]
    EXTRA_QUERY = """  node["amenity"="monastery"]({bbox});
  way ["amenity"="monastery"]({bbox});
  node["religion"="orthodox"]["amenity"="place_of_worship"]({bbox});"""
