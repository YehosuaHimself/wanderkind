"""DACHAssociationsImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class DACHAssociationsImporter(RegionalOverpassImporter):
    SOURCE_ID = "dach"
    COUNTRY = None
    REGION = "DACH"
    BBOX = "45.5,5.5,55.0,17.2"
    LANGUAGES = ["de","en"]
    EXTRA_QUERY = """  node["tourism"="wilderness_hut"]({bbox});
  node["amenity"="place_of_worship"]["name"~"[Kk]loster|[Ss]tift"]({bbox});"""
