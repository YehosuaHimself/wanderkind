"""XuntaGaliciaImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class XuntaGaliciaImporter(RegionalOverpassImporter):
    SOURCE_ID = "xunta"
    COUNTRY = "Spain"
    REGION = "Galicia"
    BBOX = "41.8,-9.3,43.8,-6.7"
    LANGUAGES = ["gl","es","en"]
    EXTRA_QUERY = """"""
