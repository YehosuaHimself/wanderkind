#!/usr/bin/env python3
"""
WK Host Import Orchestrator
============================
Runs all source importers in sequence and reports stats.

Usage:
  python scripts/import/run_import.py [--dry-run] [--source osm] [--source gronze] …

Environment:
  SUPABASE_URL          — required
  SUPABASE_SERVICE_KEY  — required (service role for writes)
  WK_DRY_RUN=1          — skip actual DB writes (for testing)
"""
import sys, os, argparse, time, logging
from pathlib import Path

# Make sure scripts/import is on the path
sys.path.insert(0, str(Path(__file__).parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)-22s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("run_import")

# ── All importers registered here ─────────────────────────────────────────────
def load_all_importers():
    from sources.osm                   import OSMImporter
    from sources.gronze                import GronzeImporter
    from sources.aevf_francigena       import AEVFFrancigeanaImporter
    from sources.confraternity_uk      import ConfraternityUKImporter
    from sources.xunta_galicia         import XuntaGaliciaImporter
    from sources.france_associations   import FranceAssociationsImporter
    from sources.benelux_associations  import BeneluxAssociationsImporter
    from sources.dach_associations     import DACHAssociationsImporter
    from sources.iberian_associations  import IberianAssociationsImporter
    from sources.nordic_routes         import NordicRoutesImporter
    from sources.italy_routes          import ItalyRoutesImporter
    from sources.uk_ireland            import UKIrelandImporter
    from sources.central_eastern_europe import CentralEasternEuropeImporter
    from sources.wikidata              import WikidataImporter
    from sources.north_america         import NorthAmericaImporter
    from sources.via_dinarica          import ViaDinaricaImporter
    from sources.shikoku_japan         import ShikokuJapanImporter
    from sources.australia_routes      import AustraliaRoutesImporter

    return {
        "osm":               OSMImporter,
        "gronze":            GronzeImporter,
        "aevf":              AEVFFrancigeanaImporter,
        "confraternity_uk":  ConfraternityUKImporter,
        "xunta":             XuntaGaliciaImporter,
        "france":            FranceAssociationsImporter,
        "benelux":           BeneluxAssociationsImporter,
        "dach":              DACHAssociationsImporter,
        "iberian":           IberianAssociationsImporter,
        "nordic":            NordicRoutesImporter,
        "italy":             ItalyRoutesImporter,
        "uk_ireland":        UKIrelandImporter,
        "central_east":      CentralEasternEuropeImporter,
        "wikidata":          WikidataImporter,
        "north_america":     NorthAmericaImporter,
        "via_dinarica":      ViaDinaricaImporter,
        "shikoku_japan":     ShikokuJapanImporter,
        "australia_routes": AustraliaRoutesImporter,
    }

# Run order — OSM and Wikidata first (largest coverage, open data)
# then route-specific associations (higher quality, fills gaps)
DEFAULT_ORDER = [
    "wikidata",       # CC0 open data, thousands of coords
    "osm",            # largest volume, all of Europe
    "gronze",         # Camino albergues — very high quality
    "xunta",          # Official Galician government registry
    "aevf",           # Via Francigena — authoritative
    "confraternity_uk", # UK association — high quality
    "france",         # French associations
    "benelux",        # Belgium + Netherlands
    "dach",           # Germany + Austria + Switzerland
    "iberian",        # Portugal + more Spain routes
    "nordic",         # Scandinavia
    "italy",          # Italian cammini
    "uk_ireland",     # Britain + Ireland
    "central_east",   # Poland, Czech, etc.
    "north_america",  # USA + Canada pilgrim routes
    "via_dinarica",   # Balkans — Slovenia → North Macedonia
    "shikoku_japan",  # Shikoku 88 temple pilgrimage
    "australia_routes", # Bibbulmun, Heysen, GNW, C2C, Larapinta, AAWT
    "latin_america",    # Mexico through Patagonia
    "east_asia",        # Korea + China + Mongolia
    "southeast_asia",   # Thailand → Indonesia (Buddhist temples + hostels)
    "india_himalaya",   # India + Nepal + Bhutan (dharamshalas, gurudwara)
    "africa_pilgrim",   # Morocco + Egypt + Ethiopia + sub-Saharan
    "middle_east_safe", # Turkey + Armenia + Georgia + Jordan
]


def main():
    parser = argparse.ArgumentParser(description="WK host data importer")
    parser.add_argument("--dry-run", action="store_true",
                        help="Fetch and parse but skip DB writes")
    parser.add_argument("--source", action="append", metavar="NAME",
                        help="Only run specific source(s). Repeatable.")
    parser.add_argument("--list", action="store_true",
                        help="List available sources and exit")
    args = parser.parse_args()

    dry_run = args.dry_run or os.environ.get("WK_DRY_RUN") == "1"
    if dry_run:
        log.info("DRY RUN — no DB writes will be made")

    importers = load_all_importers()

    if args.list:
        print("Available sources:")
        for k in DEFAULT_ORDER:
            print(f"  {k}")
        return

    # Validate env
    if not dry_run:
        for var in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY"):
            if not os.environ.get(var):
                log.error(f"Missing required env var: {var}")
                sys.exit(1)

    # Which sources to run
    sources_to_run = args.source if args.source else DEFAULT_ORDER
    unknown = [s for s in sources_to_run if s not in importers]
    if unknown:
        log.error(f"Unknown sources: {unknown}. Use --list to see available.")
        sys.exit(1)

    # Run
    total_stats = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}
    wall_start = time.time()

    for key in sources_to_run:
        cls = importers[key]
        importer = cls()
        t0 = time.time()
        try:
            stats = importer.run(dry_run=dry_run)
            for k in total_stats:
                total_stats[k] += stats.get(k, 0)
            elapsed = time.time() - t0
            log.info(f"  ✓ {key}: +{stats.get('inserted',0)} new, "
                     f"~{stats.get('updated',0)} updated, "
                     f"{stats.get('skipped',0)} skipped "
                     f"[{elapsed:.0f}s]")
        except Exception as e:
            log.error(f"  ✗ {key} FAILED: {e}", exc_info=True)
            total_stats["errors"] += 1

    wall = time.time() - wall_start
    log.info("")
    log.info(f"═══ Import complete in {wall:.0f}s ═══")
    log.info(f"  Inserted : {total_stats['inserted']}")
    log.info(f"  Updated  : {total_stats['updated']}")
    log.info(f"  Skipped  : {total_stats['skipped']} (near-duplicates)")
    log.info(f"  Errors   : {total_stats['errors']}")

    # Only fail CI if errors dominate the run. A handful of bad rows out of
    # thousands is normal — sources occasionally yield malformed records.
    total_processed = total_stats["inserted"] + total_stats["updated"] + total_stats["skipped"] + total_stats["errors"]
    error_rate = total_stats["errors"] / max(1, total_processed)
    if total_stats["inserted"] == 0 and total_stats["updated"] == 0 and total_stats["errors"] > 0:
        log.error("No rows ingested and errors present — failing run")
        sys.exit(1)
    if error_rate > 0.05:
        log.error(f"Error rate {error_rate*100:.1f}% exceeds 5% threshold — failing run")
        sys.exit(1)


if __name__ == "__main__":
    main()
