# ZoLa France GIS Backend

FastAPI + PostGIS service for the French real-estate fork. It is intentionally separate from the React/Vite frontend so ZoLa can keep its original layer registry while the French fork grows a real GIS data platform.

## Local Setup

1. Install PostgreSQL with PostGIS enabled, or run a PostGIS container.
2. Create the database:

```sql
CREATE DATABASE zola_france;
\c zola_france
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

3. Apply the schema:

```powershell
psql $env:DATABASE_URL -f backend/sql/001_init.sql
```

4. Install Python dependencies:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

5. Run the API:

```powershell
uvicorn app.main:app --reload
```

## Imports

Cadastre parcels:

```powershell
python scripts/import_cadastre.py path\to\cadastre.geojson
```

DVF sales:

```powershell
python scripts/import_dvf.py path\to\dvf.csv
```

For large national datasets, import by department/commune first, then move to tiled endpoints. The first API returns GeoJSON because it is simple for MapLibre to consume; vector tiles can be added after the schema and filters settle.

