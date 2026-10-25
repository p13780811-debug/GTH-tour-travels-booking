"""Retired demo seeder. Never use generated city templates as supplier inventory."""
import sys

def main():
    print("Demo importer retired. Use scripts/tours/catalog_engine.py for source-backed supplier products; existing database rows are unchanged.",file=sys.stderr)
    return 2

if __name__ == "__main__":
    sys.exit(main())
