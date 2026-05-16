import argparse
import os
import subprocess
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Cadastre parcels into PostGIS.")
    parser.add_argument("path", type=Path, help="Path to Cadastre GeoJSON/Shapefile")
    parser.add_argument("--table", default="cadastre_parcels_raw", help="Temporary raw import table")
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required")

    command = [
        "ogr2ogr",
        "-f",
        "PostgreSQL",
        f"PG:{database_url}",
        str(args.path),
        "-nln",
        args.table,
        "-lco",
        "GEOMETRY_NAME=geom",
        "-lco",
        "FID=id",
        "-t_srs",
        "EPSG:2154",
        "-overwrite",
    ]
    subprocess.run(command, check=True)

    print(f"Imported {args.path} into {args.table}.")
    print("Next: normalize source columns into cadastre_parcels for the downloaded Cadastre schema variant.")


if __name__ == "__main__":
    main()

