"""IberianAssociationsImporter — generated regional Overpass importer for Wanderkind."""
from __future__ import annotations
from framework import RegionalOverpassImporter

class IberianAssociationsImporter(RegionalOverpassImporter):
    SOURCE_ID = "iberian"
    COUNTRY = None
    REGION = "Iberian Peninsula"
    BBOX = "36.0,-10.5,44.0,4.5"
    LANGUAGES = ["pt","es","en"]
    EXTRA_QUERY = """"""
