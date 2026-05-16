import argparse
import os
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine


COLUMN_MAP = {
    "Date mutation": "mutation_date",
    "Valeur fonciere": "sale_price",
    "Surface reelle bati": "built_surface_m2",
    "Surface terrain": "land_surface_m2",
    "Nombre pieces principales": "rooms",
    "Type local": "property_type",
    "Code commune": "commune_code",
    "Commune": "commune_name",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Import DVF Etalab sales into PostGIS.")
    parser.add_argument("path", type=Path, help="Path to DVF pipe-delimited CSV")
    parser.add_argument("--chunksize", type=int, default=100_000)
    parser.add_argument("--replace", action="store_true", help="Truncate dvf_sales before importing")
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required")

    engine = create_engine(database_url)

    if args.replace:
        with engine.begin() as conn:
            conn.exec_driver_sql("TRUNCATE TABLE dvf_sales RESTART IDENTITY")

    for chunk in pd.read_csv(args.path, sep="|", chunksize=args.chunksize, low_memory=False):
        normalized = normalize_dvf(chunk)
        normalized.to_sql(
            "dvf_sales",
            engine,
            if_exists="append",
            index=False,
        )
        print(f"Imported {len(normalized)} rows")


def normalize_dvf(df: pd.DataFrame) -> pd.DataFrame:
    output = df.rename(columns=COLUMN_MAP)
    keep_columns = list(COLUMN_MAP.values())
    output = output[[column for column in keep_columns if column in output.columns]].copy()

    if "sale_price" in output:
        output["sale_price"] = (
            output["sale_price"]
            .astype(str)
            .str.replace(",", ".", regex=False)
            .pipe(pd.to_numeric, errors="coerce")
        )
    if "mutation_date" in output:
        output["mutation_date"] = pd.to_datetime(output["mutation_date"], dayfirst=True, errors="coerce")
    if "commune_code" in output:
        output["commune_code"] = output["commune_code"].astype(str).str.zfill(5)

    return output


if __name__ == "__main__":
    main()
