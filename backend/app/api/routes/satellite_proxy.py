"""
Satellite NDVI tile proxy
Requires SATELLITE_NDVI_TILE_TEMPLATE env var like:
  https://sentinel-tiles.example/ndvi/{z}/{x}/{y}.png?date={date}
"""

import os
from fastapi import APIRouter, HTTPException, Response
import httpx
from datetime import datetime

router = APIRouter(tags=["satellite-proxy"])

TEMPLATE = os.getenv("SATELLITE_NDVI_TILE_TEMPLATE", "")
TIMEOUT = int(os.getenv("SATELLITE_PROXY_TIMEOUT", "15"))

@router.get("/ndvi-tiles/{z}/{x}/{y}.png")
async def ndvi_tile(z: int, x: int, y: int, date: str = None):
    if not TEMPLATE:
        raise HTTPException(status_code=503, detail="NDVI tile template not configured")

    # sanitize/validate date
    if date is None:
        date = datetime.utcnow().date().isoformat()

    url = (
        TEMPLATE
        .replace("{z}", str(z))
        .replace("{x}", str(x))
        .replace("{y}", str(y))
        .replace("{date}", date)
    )

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.get(url)
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail=f"Upstream error: {r.text[:200]}")
            return Response(content=r.content, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Proxy error: {str(e)}")
