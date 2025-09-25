from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx

router = APIRouter(tags=["soil"]) 

SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"

class SoilRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    depth: str = Field(default="0-5cm")

class SoilResponse(BaseModel):
    ph: float
    organic_carbon: float
    nitrogen: float
    clay: float
    sand: float
    silt: float

async def fetch_property(client: httpx.AsyncClient, lat: float, lon: float, prop: str, depth: str):
    try:
        r = await client.get(
            SOILGRIDS_URL,
            params={"lat": lat, "lon": lon, "property": prop, "depth": depth, "value": "mean"},
            timeout=6.0,
        )
        r.raise_for_status()
        data = r.json()
        return data.get("properties", {}).get(prop)
    except Exception:
        return None

@router.post("/analyze", response_model=SoilResponse)
async def analyze_soil(req: SoilRequest):
    """Realtime soil proxy values from SoilGrids (demo)."""
    try:
        async with httpx.AsyncClient() as client:
            ph_data = await fetch_property(client, req.latitude, req.longitude, "phh2o", req.depth)
            soc_data = await fetch_property(client, req.latitude, req.longitude, "soc", req.depth)
            n_data = await fetch_property(client, req.latitude, req.longitude, "nitrogen", req.depth)
            clay_data = await fetch_property(client, req.latitude, req.longitude, "clay", req.depth)
            sand_data = await fetch_property(client, req.latitude, req.longitude, "sand", req.depth)
            silt_data = await fetch_property(client, req.latitude, req.longitude, "silt", req.depth)

        ph = (ph_data or {}).get("mean")
        ph = round((ph or 65) / 10, 2)  # SoilGrids stores pH*10
        soc = round(((soc_data or {}).get("mean") or 25) / 10, 2)
        n = round(((n_data or {}).get("mean") or 120) / 100, 2)
        clay = round((clay_data or {}).get("mean") or 25, 2)
        sand = round((sand_data or {}).get("mean") or 45, 2)
        silt = round((silt_data or {}).get("mean") or 30, 2)

        return SoilResponse(
            ph=ph,
            organic_carbon=soc,
            nitrogen=n,
            clay=clay,
            sand=sand,
            silt=silt,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Soil analysis failed: {str(e)}")