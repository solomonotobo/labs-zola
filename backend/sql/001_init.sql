CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cadastre_parcels (
  id TEXT PRIMARY KEY,
  commune_code TEXT,
  section TEXT,
  numero TEXT,
  surface_m2 NUMERIC,
  source_file TEXT,
  geom geometry(MultiPolygon, 2154)
);

CREATE INDEX IF NOT EXISTS cadastre_parcels_geom_idx
  ON cadastre_parcels
  USING GIST (geom);

CREATE INDEX IF NOT EXISTS cadastre_parcels_commune_code_idx
  ON cadastre_parcels (commune_code);

CREATE TABLE IF NOT EXISTS dvf_sales (
  id BIGSERIAL PRIMARY KEY,
  mutation_date DATE,
  sale_price NUMERIC,
  built_surface_m2 NUMERIC,
  land_surface_m2 NUMERIC,
  rooms INTEGER,
  property_type TEXT,
  commune_code TEXT,
  commune_name TEXT,
  parcel_id TEXT,
  raw JSONB
);

CREATE INDEX IF NOT EXISTS dvf_sales_commune_code_idx
  ON dvf_sales (commune_code);

CREATE INDEX IF NOT EXISTS dvf_sales_parcel_id_idx
  ON dvf_sales (parcel_id);

CREATE INDEX IF NOT EXISTS dvf_sales_mutation_date_idx
  ON dvf_sales (mutation_date);

CREATE TABLE IF NOT EXISTS user_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  geom_type TEXT,
  feature_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
