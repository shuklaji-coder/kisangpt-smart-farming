"""
Crop recommendation API routes
Handles ML-based crop recommendations using soil, weather, and historical data
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from loguru import logger
import httpx
from app.core.config import settings

from app.models.schemas import (
    CropRecommendationRequest, 
    CropRecommendationResponse, 
    CropRecommendation,
    SoilType,
    CropSeason
)
from app.services.crop_service import CropRecommendationService
from app.services.enhanced.satellite_data_service import SatelliteDataService

router = APIRouter()

# Initialize service
crop_service = CropRecommendationService()
ndvi_service = SatelliteDataService()


@router.post("/crop/recommend", response_model=CropRecommendationResponse)
async def recommend_crops(request: CropRecommendationRequest):
    """
    Get crop recommendations based on district, soil, season, and weather
    
    Args:
        request: CropRecommendationRequest with location and environmental data
        
    Returns:
        CropRecommendationResponse with top 3 crop recommendations
    """
    try:
        logger.info(f"Processing crop recommendation for {request.district}, {request.soil_type}")
        
        # Extract weather data if provided
        weather_info = None
        if request.weather_data:
            weather_info = request.weather_data
        
        # Get recommendations from ML service
        recommendations = await crop_service.recommend_crops(
            district=request.district.lower(),
            soil_type=request.soil_type.value,
            season=request.season.value if request.season else None,
            weather_data=weather_info,
            year=2024  # Current year
        )
        
        # Convert to response format
        crop_recommendations = []
        for rec in recommendations:
            crop_recommendations.append(CropRecommendation(
                crop=rec['crop'],
                success_probability=rec['success_probability'],
                reason=rec['reason'],
                recommended_practices=rec['recommended_practices']
            ))
        
        logger.info(f"Generated {len(crop_recommendations)} crop recommendations")
        
        return CropRecommendationResponse(
            recommendations=crop_recommendations,
            message=f"Crop recommendations generated for {request.district} district"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in crop recommendation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during crop recommendation: {str(e)}"
        )


@router.get("/crop/seasons")
async def get_crop_seasons():
    """Get information about crop seasons and suitable crops"""
    try:
        from app.core.config import CROP_SEASONS
        
        season_info = []
        for season, details in CROP_SEASONS.items():
            season_info.append({
                "season": season,
                "months": details["months"],
                "month_names": [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ][month-1] if len(details["months"]) == 1 else 
                [["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m-1] for m in details["months"]],
                "suitable_crops": details["crops"],
                "description": _get_season_description(season)
            })
        
        return {
            "crop_seasons": season_info,
            "current_season": crop_service._determine_season(),
            "season_determination": "Based on current month"
        }
        
    except Exception as e:
        logger.error(f"Error fetching crop seasons: {e}")
        raise HTTPException(status_code=500, detail="Error fetching season information")


@router.get("/crop/suitable")
async def get_suitable_crops(
    district: str,
    soil_type: SoilType,
    season: Optional[CropSeason] = None
):
    """
    Get list of suitable crops for given conditions without ML ranking
    
    Args:
        district: District name
        soil_type: Soil type
        season: Optional season (current season if not provided)
        
    Returns:
        List of suitable crops with basic suitability information
    """
    try:
        logger.info(f"Fetching suitable crops for {district}, {soil_type}")
        
        if season is None:
            current_season = crop_service._determine_season()
        else:
            current_season = season.value
        
        # Get crop-soil-season compatibility matrix
        suitable_crops = _get_crop_suitability_matrix(district, soil_type.value, current_season)
        
        return {
            "district": district,
            "soil_type": soil_type.value,
            "season": current_season,
            "suitable_crops": suitable_crops,
            "total_crops": len(suitable_crops)
        }
        
    except Exception as e:
        logger.error(f"Error fetching suitable crops: {e}")
        raise HTTPException(status_code=500, detail="Error fetching suitable crops")


from typing import Dict, Any

@router.get("/crop/recommend-advanced", response_model=Dict[str, Any])
async def recommend_crops_advanced(lat: float, lng: float):
    """
    Advanced recommendation using satellite soil proxies + live weather on user location.
    """
    try:
        # 1) Soil proxies via SoilGrids (reuse our soil route logic inline)
        async with httpx.AsyncClient() as client:
            soil_resp = await client.post(
                f"{settings.HOST if False else ''}",
            )
        # Direct SoilGrids call
        SOIL_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
        async with httpx.AsyncClient() as client:
            params = {"lat": lat, "lon": lng, "depth": "0-5cm", "value": "mean"}
            props = {}
            for p in ["phh2o", "soc", "nitrogen", "clay", "sand", "silt"]:
                r = await client.get(SOIL_URL, params={**params, "property": p}, timeout=6.0)
                if r.status_code == 200:
                    props[p] = (r.json().get("properties", {}).get(p) or {}).get("mean")
            ph = round((props.get("phh2o") or 65) / 10, 2)
            clay = (props.get("clay") or 25)
            sand = (props.get("sand") or 45)
            silt = (props.get("silt") or 30)
        
        # 2) Simple soil-type classification
        def classify_soil(clay_v: float, sand_v: float, silt_v: float) -> str:
            if clay_v >= 35:  # heavy clay/black soils
                return SoilType.BLACK_SOIL.value
            if sand_v >= 60:
                return SoilType.ALLUVIAL.value
            # heuristic default to red or laterite based on sand/silt balance
            return SoilType.RED_SOIL.value
        soil_type = classify_soil(clay, sand, silt)

        # 3) Reverse geocode district via Nominatim (best-effort)
        district_name = "pune"
        try:
            async with httpx.AsyncClient(headers={"User-Agent": "KisanGPT/1.0"}) as client:
                gr = await client.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={"format": "jsonv2", "lat": lat, "lon": lng, "zoom": 10, "addressdetails": 1},
                    timeout=6.0,
                )
                if gr.status_code == 200:
                    addr = gr.json().get("address", {})
                    district_name = addr.get("district") or addr.get("county") or addr.get("state_district") or district_name
                    district_name = str(district_name).lower()
        except Exception:
            pass

        # 4) Weather from OpenWeatherMap (current)
        weather_data = None
        if settings.OPENWEATHER_API_KEY:
            try:
                async with httpx.AsyncClient() as client:
                    wr = await client.get(
                        "https://api.openweathermap.org/data/2.5/weather",
                        params={"lat": lat, "lon": lng, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"},
                        timeout=6.0,
                    )
                    if wr.status_code == 200:
                        wd = wr.json()
                        weather_data = {
                            "temperature": wd.get("main", {}).get("temp"),
                            "humidity": wd.get("main", {}).get("humidity"),
                            "rainfall": (wd.get("rain", {}) or {}).get("1h", 0) or (wd.get("rain", {}) or {}).get("3h", 0) or 0,
                            "windSpeed": wd.get("wind", {}).get("speed", 0)
                        }
            except Exception:
                weather_data = None
        
        # 4) NDVI using satellite service (simulated/real)
        ndvi_value = 0.5
        try:
            ndvi_data = await ndvi_service.calculate_ndvi_analysis(lat, lng)
            ndvi_value = float(ndvi_data.get("current_indices", {}).get("ndvi", {}).get("value", 0.5))
        except Exception:
            ndvi_value = 0.5

        # 5) Determine season automatically
        season = crop_service._determine_season()

        # 6) Call ML recommender (district best-effort)
        recs = await crop_service.recommend_crops(
            district=district_name,
            soil_type=soil_type,
            season=season,
            weather_data=weather_data
        )

        # 7) Lightweight fusion + enrichment
        def boost(prob: float, ndvi: float, ph_val: float) -> float:
            ndvi_factor = 0.9 + 0.2 * max(0, min(1, ndvi))  # 0.9..1.1
            ph_factor = 1.05 if 6.0 <= ph_val <= 7.5 else 0.93
            return min(0.97, max(0.05, prob * ndvi_factor * ph_factor))

        # Baseline yields (quintal/ha) and water needs
        baseline_yield = {
            "wheat": 42, "rice": 65, "maize": 50, "mustard": 18, "cotton": 20, "sugarcane": 800,
        }
        water_req = {
            "wheat": "medium", "rice": "high", "maize": "medium", "mustard": "low", "cotton": "medium", "sugarcane": "high",
        }
        # Heuristic market demand by staple status
        def demand_for(crop: str) -> str:
            ck = crop.lower()
            if ck in ("wheat", "rice"): return "high"
            if ck in ("maize", "sugarcane"): return "medium"
            return "medium"

        # Sustainability from pH closeness + soil type match
        def sustainability_score_for(crop: str) -> int:
            score = 75
            # pH closeness bonus
            if 6.0 <= ph <= 7.5:
                score += 8
            elif 5.5 <= ph <= 8.0:
                score += 3
            # soil type simple boost for compatible soils
            ck = crop.lower()
            if (soil_type == "BLACK_SOIL" and ck in ("cotton", "sugarcane")) or \
               (soil_type in ("ALLUVIAL", "RED_SOIL") and ck in ("wheat", "rice", "maize", "mustard")):
                score += 6
            # NDVI vigor boost
            score += int(max(0, min(1, ndvi_value)) * 5)
            return int(max(40, min(95, score)))

        enriched = []
        for r in recs:
            crop_name = r.get("crop", "").strip()
            p = boost(r.get("success_probability", 0.6), ndvi_value, ph)
            pred_yield = baseline_yield.get(crop_name.lower(), 35)
            pred_yield = int(round(pred_yield * (0.8 + 0.4 * p)))  # scale by success prob
            sust = sustainability_score_for(crop_name)
            dem = demand_for(crop_name)
            r["success_probability"] = p
            r["predicted_yield_quintal_per_hectare"] = pred_yield
            r["water_requirement"] = water_req.get(crop_name.lower(), "medium")
            r["sustainability_score"] = sust
            r["market_demand"] = dem
            r["reason"] = (
                f"District {district_name.title()}, season {season}, soil {soil_type}, pH {ph}; NDVI {ndvi_value:.2f}. "
                + r.get("reason", "")
            )
            enriched.append(r)
        
        # Sort by boosted probability
        enriched.sort(key=lambda x: x.get("success_probability", 0), reverse=True)

        # 8) Build response payload (top 3)
        response_items = [
            {
                "crop": r.get("crop"),
                "success_probability": float(r.get("success_probability", 0.6)),
                "reason": r.get("reason", f"Soil pH {ph}, soil type {soil_type}, season {season}, NDVI {ndvi_value:.2f}"),
                "recommended_practices": r.get("recommended_practices", ["Balanced NPK", "Timely irrigation"]),
                "predicted_yield_quintal_per_hectare": int(r.get("predicted_yield_quintal_per_hectare", 35)),
                "water_requirement": r.get("water_requirement", "medium"),
                "sustainability_score": int(r.get("sustainability_score", 75)),
                "market_demand": r.get("market_demand", "medium"),
            } for r in enriched[:3]
        ]
        
        context = {
            "ndvi": ndvi_value,
            "ph": ph,
            "soil_type": soil_type,
            "season": season,
            "district": district_name,
            "weather": weather_data or {}
        }
        return {"status": "success", "recommendations": response_items, "context": context}
    except Exception as e:
        logger.error(f"Advanced recommendation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate advanced recommendations")


@router.post("/crop/yield-prediction")
async def predict_yield(
    district: str,
    crop: str,
    soil_type: SoilType,
    season: CropSeason,
    weather_data: Optional[dict] = None
):
    """
    Predict yield for a specific crop in given conditions
    
    Args:
        district: District name
        crop: Crop name
        soil_type: Soil type
        season: Growing season
        weather_data: Optional weather information
        
    Returns:
        Yield prediction with confidence interval
    """
    try:
        logger.info(f"Predicting yield for {crop} in {district}")
        
        # Get recommendations which include yield prediction
        recommendations = await crop_service.recommend_crops(
            district=district.lower(),
            soil_type=soil_type.value,
            season=season.value,
            weather_data=weather_data
        )
        
        # Find the specific crop in recommendations
        target_crop = None
        for rec in recommendations:
            if rec['crop'].lower() == crop.lower():
                target_crop = rec
                break
        
        if not target_crop:
            # If not in top recommendations, make a direct prediction
            target_crop = {
                'crop': crop,
                'predicted_yield': 2.0,  # Default yield
                'success_probability': 0.4,  # Lower probability
                'reason': f"Limited historical data for {crop} in {district}"
            }
        
        # Calculate confidence based on historical data availability
        confidence_level = "medium" if target_crop['success_probability'] > 0.6 else "low"
        
        return {
            "district": district,
            "crop": crop,
            "predicted_yield_per_hectare": target_crop.get('predicted_yield', 2.0),
            "success_probability": target_crop['success_probability'],
            "confidence_level": confidence_level,
            "factors_considered": [
                "Historical yield data",
                "Soil type compatibility", 
                "Season suitability",
                "Weather patterns" if weather_data else "Average weather"
            ],
            "recommendation": target_crop['reason']
        }
        
    except Exception as e:
        logger.error(f"Error predicting yield: {e}")
        raise HTTPException(status_code=500, detail="Error predicting crop yield")


@router.get("/crop/practices")
async def get_crop_practices(crop: str, season: Optional[CropSeason] = None):
    """
    Get recommended agricultural practices for a specific crop
    
    Args:
        crop: Crop name
        season: Optional growing season
        
    Returns:
        Detailed agricultural practices and guidelines
    """
    try:
        if season is None:
            current_season = crop_service._determine_season()
        else:
            current_season = season.value
        
        practices = crop_service._get_recommended_practices(crop, current_season, "mixed_soil")
        
        # Get extended practices
        extended_practices = _get_extended_practices(crop, current_season)
        
        return {
            "crop": crop,
            "season": current_season,
            "basic_practices": practices,
            "detailed_practices": extended_practices,
            "estimated_duration_days": _get_crop_duration(crop),
            "water_requirement": _get_water_requirement(crop)
        }
        
    except Exception as e:
        logger.error(f"Error fetching crop practices: {e}")
        raise HTTPException(status_code=500, detail="Error fetching crop practices")


@router.post("/crop/retrain")
async def retrain_models(data_file_path: str):
    """
    Retrain crop recommendation models with new data
    
    Args:
        data_file_path: Path to new training data CSV
        
    Returns:
        Training results and model performance metrics
    """
    try:
        logger.info(f"Retraining crop models with {data_file_path}")
        
        result = await crop_service.retrain_model(data_file_path)
        
        if result['status'] == 'success':
            return {
                "status": "success",
                "message": "Models retrained successfully",
                "training_results": result,
                "model_performance": {
                    "crop_classification_accuracy": result['crop_accuracy'],
                    "yield_prediction_mae": result['yield_mae'],
                    "training_samples": result['training_samples']
                }
            }
        else:
            raise HTTPException(status_code=400, detail=f"Training failed: {result['error']}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retraining models: {e}")
        raise HTTPException(status_code=500, detail="Error retraining models")


@router.post("/crop/test-service")
async def test_crop_service():
    """Test crop recommendation service functionality"""
    try:
        # Test service health
        health_status = await crop_service.health_check()
        
        # Test basic recommendation
        test_recommendation = None
        if health_status.get("status") == "healthy":
            try:
                test_crops = await crop_service.recommend_crops(
                    district='pune',
                    soil_type='red_soil',
                    season='kharif'
                )
                test_recommendation = {
                    "crops_returned": len(test_crops),
                    "top_crop": test_crops[0]['crop'] if test_crops else None,
                    "success_probability": test_crops[0]['success_probability'] if test_crops else None
                }
            except Exception as e:
                test_recommendation = {"error": str(e)}
        
        return {
            "service_health": health_status,
            "test_recommendation": test_recommendation,
            "model_info": {
                "models_trained": health_status.get("models_trained", False),
                "available_features": health_status.get("available_encoders", [])
            }
        }
        
    except Exception as e:
        logger.error(f"Crop service test failed: {e}")
        return {
            "service_health": {"status": "error", "message": str(e)},
            "test_recommendation": None,
            "model_info": {"models_trained": False}
        }


# Helper functions
def _get_season_description(season: str) -> str:
    """Get description for crop season"""
    descriptions = {
        "kharif": "Monsoon season crops grown during June-October with rainfall dependency",
        "rabi": "Post-monsoon winter crops grown during November-March using residual moisture",
        "zaid": "Summer crops grown during April-June requiring intensive irrigation"
    }
    return descriptions.get(season, "Unknown season")


def _get_crop_suitability_matrix(district: str, soil_type: str, season: str) -> list:
    """Get crop suitability matrix for given conditions"""
    
    # Soil-crop compatibility matrix
    soil_crops = {
        'red_soil': {
            'high': ['cotton', 'groundnut', 'maize', 'millets'],
            'medium': ['rice', 'wheat', 'sorghum'],
            'low': ['sugarcane', 'banana']
        },
        'black_soil': {
            'high': ['cotton', 'wheat', 'gram', 'sorghum'],
            'medium': ['rice', 'maize', 'groundnut'],
            'low': ['sugarcane', 'vegetables']
        },
        'alluvial': {
            'high': ['rice', 'wheat', 'sugarcane', 'maize'],
            'medium': ['cotton', 'vegetables', 'pulses'],
            'low': ['millets', 'oilseeds']
        },
        'laterite': {
            'high': ['cashew', 'coconut', 'spices'],
            'medium': ['rice', 'tapioca'],
            'low': ['wheat', 'cotton']
        },
        'coastal_alluvium': {
            'high': ['rice', 'coconut', 'vegetables'],
            'medium': ['betel_nut', 'spices'],
            'low': ['wheat', 'cotton']
        }
    }
    
    # Season-crop compatibility
    season_crops = {
        'kharif': ['rice', 'cotton', 'sugarcane', 'maize', 'sorghum', 'groundnut', 'soybean'],
        'rabi': ['wheat', 'gram', 'pea', 'mustard', 'barley', 'onion', 'garlic'],
        'zaid': ['maize', 'groundnut', 'vegetables', 'fodder_crops']
    }
    
    # Get suitable crops for soil
    soil_suitable = soil_crops.get(soil_type, soil_crops['red_soil'])  # Default to red soil
    
    # Get season-appropriate crops
    season_suitable = season_crops.get(season, season_crops['kharif'])
    
    # Combine and rank
    suitable_crops = []
    
    for suitability, crops in soil_suitable.items():
        for crop in crops:
            if crop in season_suitable:
                suitable_crops.append({
                    "crop": crop,
                    "soil_suitability": suitability,
                    "season_appropriate": True,
                    "overall_score": {"high": 0.9, "medium": 0.7, "low": 0.4}[suitability]
                })
    
    # Add season-appropriate crops not in soil matrix
    for crop in season_suitable:
        if not any(c['crop'] == crop for c in suitable_crops):
            suitable_crops.append({
                "crop": crop,
                "soil_suitability": "medium",
                "season_appropriate": True,
                "overall_score": 0.6
            })
    
    # Sort by overall score
    suitable_crops.sort(key=lambda x: x['overall_score'], reverse=True)
    
    return suitable_crops[:10]  # Return top 10


def _get_extended_practices(crop: str, season: str) -> dict:
    """Get extended agricultural practices for crop"""
    
    extended_practices = {
        'rice': {
            'land_preparation': ['Puddling for water retention', 'Level fields properly'],
            'sowing': ['Direct seeding or transplanting', 'Maintain plant spacing 20x15 cm'],
            'irrigation': ['Continuous submergence 2-5 cm', 'Drain before harvest'],
            'fertilization': ['Basal: NPK 40:20:20', 'Top dressing: Urea at tillering'],
            'pest_management': ['Monitor for stem borer', 'Use pheromone traps'],
            'disease_management': ['Treat seeds with fungicide', 'Avoid excess nitrogen']
        },
        'wheat': {
            'land_preparation': ['Deep plowing', 'Fine tilth preparation'],
            'sowing': ['Timely sowing in November', 'Seed rate 100 kg/ha'],
            'irrigation': ['Crown root irrigation', '4-5 irrigations needed'],
            'fertilization': ['NPK 120:60:40 recommended', 'Split application'],
            'pest_management': ['Monitor for aphids', 'Treat for termites'],
            'disease_management': ['Rust resistant varieties', 'Proper drainage']
        },
        'cotton': {
            'land_preparation': ['Summer plowing', 'Ridge and furrow system'],
            'sowing': ['Plant after monsoon onset', 'Spacing 45x30 cm'],
            'irrigation': ['Critical at flowering', 'Avoid waterlogging'],
            'fertilization': ['High potash requirement', 'Boron supplementation'],
            'pest_management': ['Bollworm monitoring', 'IPM practices'],
            'disease_management': ['Wilt resistant varieties', 'Crop rotation']
        }
    }
    
    return extended_practices.get(crop, {
        'general': ['Follow local agricultural guidelines', 'Consult extension officer']
    })


def _get_crop_duration(crop: str) -> int:
    """Get typical crop duration in days"""
    durations = {
        'rice': 120, 'wheat': 110, 'cotton': 180, 'sugarcane': 365,
        'maize': 90, 'sorghum': 105, 'groundnut': 100, 'soybean': 95,
        'gram': 90, 'onion': 120, 'vegetables': 60
    }
    return durations.get(crop, 100)


def _get_water_requirement(crop: str) -> str:
    """Get water requirement category for crop"""
    water_needs = {
        'rice': 'Very High (1500-2000 mm)',
        'sugarcane': 'Very High (1500-2500 mm)', 
        'cotton': 'High (700-1300 mm)',
        'wheat': 'Medium (450-650 mm)',
        'maize': 'Medium (500-800 mm)',
        'sorghum': 'Low (400-600 mm)',
        'groundnut': 'Low (400-600 mm)',
        'millets': 'Very Low (200-400 mm)'
    }
    return water_needs.get(crop, 'Medium (500-800 mm)')