from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(tags=["rotation"]) 

class RotationRequest(BaseModel):
    previous_crops: List[str]
    soil_type: str
    water_availability: str  # low/medium/high
    season: str  # kharif/rabi/zaid

class RotationPlan(BaseModel):
    year: int
    kharif: str
    rabi: str

class RotationResponse(BaseModel):
    schedule: List[RotationPlan]
    sustainability_score: float
    notes: List[str]

@router.post("/recommend", response_model=RotationResponse)
async def recommend_rotation(req: RotationRequest):
    # Simple heuristic
    prev = set([c.lower() for c in req.previous_crops])
    kharif = "soybean" if req.soil_type.lower() in ["black", "black_soil"] else "rice"
    if "rice" in prev:
        kharif = "maize"
    rabi = "wheat" if req.water_availability != "low" else "mustard"
    if "wheat" in prev:
        rabi = "chickpea"

    schedule = [
        RotationPlan(year=1, kharif=kharif, rabi=rabi),
        RotationPlan(year=2, kharif="cotton" if kharif != "cotton" else "sorghum", rabi="lentil"),
    ]
    score = 0.78
    notes = [
        "Legume cycle improves soil nitrogen.",
        "Avoid repeating same cereal back-to-back to reduce pest load.",
    ]
    return RotationResponse(schedule=schedule, sustainability_score=score, notes=notes)