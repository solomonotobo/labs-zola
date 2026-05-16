from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import close_pool, open_pool
from .routers import datasets, health, parcels, sales


settings = get_settings()

app = FastAPI(
    title="ZoLa France GIS API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    open_pool()


@app.on_event("shutdown")
def shutdown() -> None:
    close_pool()


app.include_router(health.router)
app.include_router(parcels.router, prefix="/parcels", tags=["parcels"])
app.include_router(sales.router, prefix="/sales", tags=["sales"])
app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])

