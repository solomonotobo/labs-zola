from typing import Annotated

from fastapi import APIRouter, Query

from ..db import get_connection

router = APIRouter()


@router.get("")
def list_sales(
    commune_code: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    limit: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> list[dict]:
    where = []
    params: dict[str, object] = {"limit": limit}

    if commune_code:
        where.append("commune_code = %(commune_code)s")
        params["commune_code"] = commune_code
    if min_price is not None:
        where.append("sale_price >= %(min_price)s")
        params["min_price"] = min_price
    if max_price is not None:
        where.append("sale_price <= %(max_price)s")
        params["max_price"] = max_price

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    sql = f"""
        SELECT
          id,
          mutation_date,
          sale_price,
          built_surface_m2,
          land_surface_m2,
          rooms,
          property_type,
          commune_code,
          commune_name,
          parcel_id
        FROM dvf_sales
        {where_sql}
        ORDER BY mutation_date DESC NULLS LAST
        LIMIT %(limit)s;
    """

    with get_connection() as conn:
        return list(conn.execute(sql, params).fetchall())

