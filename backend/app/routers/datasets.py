from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()


@router.get("")
def list_datasets() -> list[dict]:
    return []


@router.post("")
async def upload_dataset(file: UploadFile = File(...)) -> dict:
    filename = file.filename or "dataset"
    if not filename.lower().endswith((".geojson", ".json", ".zip", ".shp")):
        raise HTTPException(status_code=400, detail="Unsupported dataset format")

    raise HTTPException(
        status_code=501,
        detail="Dataset persistence is scaffolded. Wire this endpoint to object storage/PostGIS import next.",
    )

