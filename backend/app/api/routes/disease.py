"""
Disease prediction API endpoints for Kisan GPT
Handles image-based disease detection, weather-based predictions, and disease information
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import base64
from loguru import logger

from app.services.disease_service import DiseasePredictionService
from app.services.disease_ml_service import DiseaseMLService
from app.services.disease_database import DiseaseDatabase

router = APIRouter(tags=["disease"])

# Initialize services
disease_service = DiseasePredictionService()
disease_ml_service = DiseaseMLService()
disease_db = DiseaseDatabase()

# Request/Response Models
class WeatherBasedPredictionRequest(BaseModel):
    crop: str = Field(..., description="Crop name")
    district: str = Field(..., description="District name")
    current_weather: Dict[str, Any] = Field(..., description="Current weather conditions")
    forecast_horizon_days: int = Field(default=14, description="Forecast horizon in days")

class ImageAnalysisRequest(BaseModel):
    image_data: str = Field(..., description="Base64 encoded image data")
    crop_type: str = Field(default="unknown", description="Type of crop")
    analysis_type: str = Field(default="disease", description="Type of analysis to perform")

class DiseaseInfoRequest(BaseModel):
    disease_id: str = Field(..., description="Disease identifier")

class TreatmentRequest(BaseModel):
    disease_id: str = Field(..., description="Disease identifier")
    severity: str = Field(default="medium", description="Disease severity level")
    organic_preference: bool = Field(default=False, description="Prefer organic treatments")

class SymptomSearchRequest(BaseModel):
    symptoms: List[str] = Field(..., description="List of observed symptoms")
    crop: Optional[str] = Field(None, description="Crop name for filtering")

class MLWeatherPredictionRequest(BaseModel):
    weather_data: Dict[str, float] = Field(..., description="Weather parameters")
    crop_type: str = Field(default="general", description="Crop type")

# API Endpoints

@router.post("/predict/weather", response_model=Dict[str, Any])
async def predict_disease_by_weather(request: WeatherBasedPredictionRequest):
    """
    Predict disease risks based on weather conditions using rule-based models
    """
    try:
        logger.info(f"Weather-based disease prediction for {request.crop} in {request.district}")
        
        result = await disease_service.predict_disease_risk(
            crop=request.crop,
            district=request.district,
            current_weather=request.current_weather,
            forecast_horizon_days=request.forecast_horizon_days
        )
        
        return {
            "status": "success",
            "prediction_type": "weather_based_rules",
            "crop": request.crop,
            "district": request.district,
            "forecast_days": request.forecast_horizon_days,
            "disease_risks": result,
            "total_risks_identified": len(result),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in weather-based disease prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/predict/weather-ml", response_model=Dict[str, Any])
async def predict_disease_by_weather_ml(request: MLWeatherPredictionRequest):
    """
    Predict disease risks using ML models based on weather conditions
    """
    try:
        logger.info(f"ML weather-based disease prediction for {request.crop_type}")
        
        result = await disease_ml_service.predict_weather_disease_risk(
            weather_data=request.weather_data,
            crop_type=request.crop_type
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in ML weather prediction: {e}")
        raise HTTPException(status_code=500, detail=f"ML prediction failed: {str(e)}")

@router.post("/analyze/image", response_model=Dict[str, Any])
async def analyze_disease_image(request: ImageAnalysisRequest):
    """
    Analyze crop/leaf images for disease detection using ML and computer vision
    """
    try:
        logger.info(f"Image analysis for crop: {request.crop_type}")
        
        result = await disease_ml_service.analyze_disease_image(
            image_data=request.image_data,
            crop_type=request.crop_type
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in image analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@router.post("/upload/image")
async def upload_disease_image(
    file: UploadFile = File(...),
    crop_type: str = Form(default="unknown"),
    analysis_type: str = Form(default="disease")
):
    """
    Upload image file for disease analysis
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        image_content = await file.read()
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        
        logger.info(f"Processing uploaded image: {file.filename}, size: {len(image_content)} bytes")
        
        # Analyze image
        result = await disease_ml_service.analyze_disease_image(
            image_data=image_base64,
            crop_type=crop_type
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Add upload metadata
        result["upload_info"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size_bytes": len(image_content),
            "upload_timestamp": datetime.now().isoformat()
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing uploaded image: {e}")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@router.get("/info/{disease_id}", response_model=Dict[str, Any])
async def get_disease_information(disease_id: str):
    """
    Get comprehensive information about a specific disease
    """
    try:
        logger.info(f"Getting disease information for: {disease_id}")
        
        disease_info = disease_db.get_disease_info(disease_id)
        
        if not disease_info:
            raise HTTPException(status_code=404, detail=f"Disease '{disease_id}' not found")
        
        return {
            "status": "success",
            "disease_id": disease_id,
            "disease_info": disease_info,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting disease info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve disease information: {str(e)}")

@router.get("/crop/{crop_name}/diseases", response_model=Dict[str, Any])
async def get_diseases_by_crop(crop_name: str):
    """
    Get all diseases affecting a specific crop
    """
    try:
        logger.info(f"Getting diseases for crop: {crop_name}")
        
        diseases = disease_db.search_diseases_by_crop(crop_name)
        
        if not diseases:
            raise HTTPException(status_code=404, detail=f"No diseases found for crop '{crop_name}'")
        
        return {
            "status": "success",
            "crop": crop_name,
            "total_diseases": len(diseases),
            "diseases": diseases,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting crop diseases: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve crop diseases: {str(e)}")

@router.post("/search/symptoms", response_model=Dict[str, Any])
async def search_diseases_by_symptoms(request: SymptomSearchRequest):
    """
    Search diseases based on observed symptoms
    """
    try:
        logger.info(f"Searching diseases by symptoms: {request.symptoms}")
        
        diseases = disease_db.search_diseases_by_symptoms(request.symptoms)
        
        # Filter by crop if specified
        if request.crop:
            diseases = [d for d in diseases if d['crop'].lower() == request.crop.lower()]
        
        if not diseases:
            return {
                "status": "success",
                "message": "No matching diseases found for the given symptoms",
                "symptoms_searched": request.symptoms,
                "crop_filter": request.crop,
                "diseases": [],
                "recommendations": [
                    "Try using more specific symptom descriptions",
                    "Consider consulting with local agricultural experts",
                    "Check if symptoms match common nutrient deficiencies"
                ]
            }
        
        return {
            "status": "success",
            "symptoms_searched": request.symptoms,
            "crop_filter": request.crop,
            "total_matches": len(diseases),
            "diseases": diseases,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error searching diseases by symptoms: {e}")
        raise HTTPException(status_code=500, detail=f"Symptom search failed: {str(e)}")

@router.post("/treatment", response_model=Dict[str, Any])
async def get_treatment_recommendations(request: TreatmentRequest):
    """
    Get treatment recommendations for a specific disease
    """
    try:
        logger.info(f"Getting treatment recommendations for: {request.disease_id}")
        
        recommendations = disease_db.get_treatment_recommendations(
            disease_id=request.disease_id,
            severity=request.severity,
            organic_preference=request.organic_preference
        )
        
        if "error" in recommendations:
            raise HTTPException(status_code=404, detail=recommendations["error"])
        
        return {
            "status": "success",
            "disease_id": request.disease_id,
            "severity": request.severity,
            "organic_preference": request.organic_preference,
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting treatment recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get treatment recommendations: {str(e)}")

@router.get("/prevention/{crop_name}", response_model=Dict[str, Any])
async def get_prevention_guide(crop_name: str):
    """
    Get comprehensive disease prevention guide for a crop
    """
    try:
        logger.info(f"Getting prevention guide for: {crop_name}")
        
        guide = disease_db.get_prevention_guide(crop_name)
        
        if "error" in guide:
            raise HTTPException(status_code=404, detail=guide["error"])
        
        return {
            "status": "success",
            "prevention_guide": guide,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prevention guide: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get prevention guide: {str(e)}")

@router.get("/calendar/{crop_name}", response_model=Dict[str, Any])
async def get_disease_calendar(crop_name: str, region: str = "general"):
    """
    Get seasonal disease calendar for a crop
    """
    try:
        logger.info(f"Getting disease calendar for: {crop_name} in {region}")
        
        calendar = disease_db.get_disease_calendar(crop_name, region)
        
        if "error" in calendar:
            raise HTTPException(status_code=404, detail=calendar["error"])
        
        return {
            "status": "success",
            "disease_calendar": calendar,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting disease calendar: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get disease calendar: {str(e)}")

@router.post("/economic-impact", response_model=Dict[str, Any])
async def analyze_economic_impact(disease_ids: List[str]):
    """
    Analyze economic impact of specified diseases
    """
    try:
        logger.info(f"Analyzing economic impact for diseases: {disease_ids}")
        
        analysis = disease_db.get_economic_impact_analysis(disease_ids)
        
        if "error" in analysis:
            raise HTTPException(status_code=400, detail=analysis["error"])
        
        return {
            "status": "success",
            "economic_impact_analysis": analysis,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing economic impact: {e}")
        raise HTTPException(status_code=500, detail=f"Economic impact analysis failed: {str(e)}")

@router.get("/supported-crops", response_model=Dict[str, Any])
async def get_supported_crops():
    """
    Get list of crops supported by the disease prediction system
    """
    try:
        # Get unique crops from disease database
        all_diseases = disease_db.disease_info.values()
        crops = list(set(disease['crop'] for disease in all_diseases))
        crops.sort()
        
        # Get crop statistics
        crop_stats = {}
        for crop in crops:
            crop_diseases = disease_db.search_diseases_by_crop(crop)
            crop_stats[crop] = {
                "total_diseases": len(crop_diseases),
                "high_severity": len([d for d in crop_diseases if d['severity'] == 'high']),
                "medium_severity": len([d for d in crop_diseases if d['severity'] == 'medium']),
                "low_severity": len([d for d in crop_diseases if d['severity'] == 'low'])
            }
        
        return {
            "status": "success",
            "total_crops": len(crops),
            "supported_crops": crops,
            "crop_statistics": crop_stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting supported crops: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get supported crops: {str(e)}")

@router.get("/health", response_model=Dict[str, Any])
async def disease_health_check():
    """
    Health check for disease prediction services
    """
    try:
        # Check all services
        rule_based_health = await disease_service.health_check()
        ml_health = await disease_ml_service.health_check()
        db_health = await disease_db.health_check()
        
        overall_status = "healthy"
        if any(h.get("status") != "healthy" for h in [rule_based_health, ml_health, db_health]):
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "services": {
                "rule_based_prediction": rule_based_health,
                "ml_prediction": ml_health,
                "disease_database": db_health
            },
            "capabilities": {
                "weather_based_prediction": rule_based_health.get("status") == "healthy",
                "ml_weather_prediction": ml_health.get("weather_classifier") == "healthy",
                "image_analysis": ml_health.get("image_classifier") == "healthy",
                "disease_information": db_health.get("status") == "healthy"
            }
        }
        
    except Exception as e:
        logger.error(f"Error in disease health check: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }