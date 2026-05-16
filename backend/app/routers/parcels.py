from typing import Annotated

from fastapi import APIRouter, Query

from ..db import get_connection

router = APIRouter()


@router.get("")
def list_parcels(
    bbox: Annotated[
        str | None,
        Query(description="Bounding box as west,south,east,north in WGS84"),
    ] = None,
    commune_code: str | None = None,
    limit: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> dict:
    where = []
    params: dict[str, object] = {"limit": limit}

    if commune_code:
        where.append("commune_code = %(commune_code)s")
        params["commune_code"] = commune_code

    if bbox:
        west, south, east, north = [float(part) for part in bbox.split(",")]
        where.append(
            """
            geom && ST_Transform(
              ST_MakeEnvelope(%(west)s, %(south)s, %(east)s, %(north)s, 4326),
              2154
            )
            """
        )
        params.update({"west": west, "south": south, "east": east, "north": north})

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    sql = f"""
        SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', COALESCE(json_agg(feature), '[]'::json)
        )
        FROM (
          SELECT json_build_object(
            'type', 'Feature',
            'id', id,
            'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::json,
            'properties', json_build_object(
              'id', id,
              'commune_code', commune_code,
              'section', section,
              'numero', numero,
              'surface_m2', surface_m2
            )
          ) AS feature
          FROM cadastre_parcels
          {where_sql}
          ORDER BY id
          LIMIT %(limit)s
        ) features;
    """

    with get_connection() as conn:
        row = conn.execute(sql, params).fetchone()
    return row["json_build_object"]


@router.get("/{parcel_id}")
def get_parcel(parcel_id: str) -> dict:
    sql = """
        SELECT json_build_object(
          'type', 'Feature',
          'id', id,
          'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::json,
          'properties', json_build_object(
            'id', id,
            'commune_code', commune_code,
            'section', section,
            'numero', numero,
            'surface_m2', surface_m2
          )
        ) AS feature
        FROM cadastre_parcels
        WHERE id = %(parcel_id)s;
    """
    with get_connection() as conn:
        row = conn.execute(sql, {"parcel_id": parcel_id}).fetchone()
    return row["feature"] if row else {"type": "FeatureCollection", "features": []}

