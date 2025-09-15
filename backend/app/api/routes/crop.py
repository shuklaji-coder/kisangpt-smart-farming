"""
Crop recommendation API routes
Handles ML-based crop recommendations using soil, weather, and historical data
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models.schemas import (
    CropRecommendationRequest, 
    CropRecommendationResponse, 
    CropRecommendation,
    SoilType,
    CropSeason
)
from app.services.crop_service import CropRecommendationService

router = APIRouter()

# Initialize service
crop_service = CropRecommendationService()


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