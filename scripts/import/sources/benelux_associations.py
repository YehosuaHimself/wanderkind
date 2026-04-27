"""BeneluxAssociationsImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class BeneluxAssociationsImporter(RegionalOverpassImporter):
    SOURCE_ID = "benelux"
    COUNTRY = None
    REGION = "Benelux"
    BBOX = "49.4,2.5,53.6,7.3"
    LANGUAGES = ["nl","fr","en","de"]
    EXTRA_QUERY = """"""
