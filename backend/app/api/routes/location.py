"""
Location API routes
Handles location detection, weather data, and district information
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from app.models.schemas import LocationInfoResponse, SoilType
from app.services.location_service import LocationService, WeatherService

router = APIRouter()

# Initialize services
location_service = LocationService()
weather_service = WeatherService()


@router.get("/location/info", response_model=LocationInfoResponse)
async def get_location_info(
    lat: Optional[float] = Query(None, description="GPS latitude"),
    lng: Optional[float] = Query(None, description="GPS longitude"), 
    ip: Optional[str] = Query(None, description="IP address for location detection")
):
    """
    Get comprehensive location information including weather
    
    Args:
        lat: Optional GPS latitude
        lng: Optional GPS longitude
        ip: Optional IP address for fallback location
        
    Returns:
        LocationInfoResponse with location, soil, weather data
    """
    try:
        location_data = None
        
        # Method 1: GPS coordinates provided
        if lat is not None and lng is not None:
            logger.info(f"Using GPS coordinates: {lat}, {lng}")
            location_data = await location_service.reverse_geocode(lat, lng)
        
        # Method 2: IP-based location detection
        elif ip:
            logger.info(f"Using IP-based location detection: {ip}")
            location_data = await location_service.detect_location_from_ip(ip)
        
        # Method 3: Auto-detect current IP
        else:
            logger.info("Auto-detecting location from current IP")
            location_data = await location_service.detect_location_from_ip()
        
        if not location_data:
            raise HTTPException(status_code=422, detail="Could not determine location")
        
        # Extract coordinates for weather
        latitude = location_data.get('latitude', 18.5204)
        longitude = location_data.get('longitude', 73.8567)
        
        # Get district information
        district_name = location_data.get('district') or location_data.get('city', 'pune')
        district_info = location_service.get_district_info(district_name)
        
        # Fetch weather data
        current_weather = await weather_service.get_current_weather(latitude, longitude)
        weather_forecast = await weather_service.get_weather_forecast(latitude, longitude, days=5)
        
        logger.info(f"Location info retrieved for district: {district_info['district']}")
        
        return LocationInfoResponse(
            district=district_info['district'].lower(),
            soil_type=SoilType(district_info['soil_type']),
            agro_zone=district_info['agro_zone'],
            weather_current=current_weather,
            weather_forecast=weather_forecast,
            message=f"Location info retrieved successfully for {district_info['district']}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in location info retrieval: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during location detection: {str(e)}"
        )


@router.get("/location/districts")
async def get_supported_districts():
    """Get list of supported districts with soil and agro-zone information"""
    try:
        from app.core.config import DISTRICT_SOIL_MAPPING
        
        districts = []
        for district, info in DISTRICT_SOIL_MAPPING.items():
            districts.append({
                "district": district.title(),
                "soil_type": info["soil_type"],
                "agro_zone": info["agro_zone"],
                "state": "Maharashtra" if district in ["pune", "mumbai", "nashik", "nagpur", "aurangabad", "kolhapur"] else "Other"
            })
        
        return {
            "supported_districts": districts,
            "total_count": len(districts),
            "states_covered": ["Maharashtra", "Karnataka", "Gujarat"]
        }
        
    except Exception as e:
        logger.error(f"Error fetching districts: {e}")
        raise HTTPException(status_code=500, detail="Error fetching district information")


@router.get("/location/weather")
async def get_weather_only(
    lat: float = Query(..., description="GPS latitude"),
    lng: float = Query(..., description="GPS longitude"),
    days: int = Query(5, ge=1, le=14, description="Number of forecast days")
):
    """
    Get weather information only for given coordinates
    
    Args:
        lat: GPS latitude
        lng: GPS longitude
        days: Number of forecast days (1-14)
        
    Returns:
        Current weather and forecast data
    """
    try:
        logger.info(f"Fetching weather for coordinates: {lat}, {lng}")
        
        # Get current weather and forecast
        current_weather = await weather_service.get_current_weather(lat, lng)
        weather_forecast = await weather_service.get_weather_forecast(lat, lng, days)
        
        return {
            "coordinates": {"latitude": lat, "longitude": lng},
            "current_weather": current_weather,
            "forecast": weather_forecast,
            "forecast_days": len(weather_forecast)
        }
        
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        raise HTTPException(status_code=500, detail="Error fetching weather data")


@router.get("/location/soil-types")
async def get_soil_types():
    """Get list of supported soil types and their characteristics"""
    return {
        "soil_types": [
            {
                "code": "red_soil",
                "name": "Red Soil",
                "characteristics": "Good for cotton, groundnut, millets",
                "ph_range": "6.0-7.5",
                "drainage": "Well-drained"
            },
            {
                "code": "black_soil",
                "name": "Black Soil (Regur)",
                "characteristics": "Excellent for cotton, wheat, gram",
                "ph_range": "7.2-8.5",
                "drainage": "Moderate drainage"
            },
            {
                "code": "alluvial",
                "name": "Alluvial Soil",
                "characteristics": "Best for rice, wheat, sugarcane",
                "ph_range": "6.0-7.0",
                "drainage": "Variable drainage"
            },
            {
                "code": "laterite",
                "name": "Laterite Soil",
                "characteristics": "Suitable for cashew, coconut, spices",
                "ph_range": "5.0-6.5",
                "drainage": "Well-drained"
            },
            {
                "code": "coastal_alluvium",
                "name": "Coastal Alluvial Soil",
                "characteristics": "Good for rice, coconut, vegetables",
                "ph_range": "6.5-7.5",
                "drainage": "Variable drainage"
            }
        ]
    }


@router.post("/location/test-services")
async def test_location_services():
    """Test location and weather services connectivity"""
    try:
        # Test weather service
        weather_status = await weather_service.health_check()
        
        # Test location detection with default coordinates
        test_location = await location_service.reverse_geocode(18.5204, 73.8567)
        location_status = {
            "status": "healthy" if test_location else "unhealthy",
            "test_result": test_location.get('district') if test_location else None
        }
        
        # Test district info lookup
        district_test = location_service.get_district_info("pune")
        district_status = {
            "status": "healthy" if district_test['found'] else "warning",
            "districts_loaded": len(location_service.get_district_info.__globals__.get('DISTRICT_SOIL_MAPPING', {}))
        }
        
        overall_status = "healthy"
        if (weather_status.get("status") in ["unhealthy", "error"] or 
            location_status["status"] == "unhealthy" or
            district_status["status"] == "unhealthy"):
            overall_status = "unhealthy"
        elif (weather_status.get("status") == "warning" or 
              district_status["status"] == "warning"):
            overall_status = "warning"
        
        return {
            "weather_service": weather_status,
            "location_service": location_status,
            "district_service": district_status,
            "overall_status": overall_status
        }
        
    except Exception as e:
        logger.error(f"Location services health check failed: {e}")
        return {
            "weather_service": {"status": "error", "message": str(e)},
            "location_service": {"status": "error", "message": str(e)},
            "district_service": {"status": "error", "message": str(e)},
            "overall_status": "unhealthy"
        }


@router.get("/location/agro-zones")
async def get_agro_zones():
    """Get information about agricultural zones"""
    return {
        "agro_zones": [
            {
                "code": "western_maharashtra",
                "name": "Western Maharashtra",
                "climate": "Semi-arid",
                "major_crops": ["sugarcane", "grapes", "onion", "cotton"],
                "seasons": ["kharif", "rabi"],
                "rainfall_mm": "600-1200"
            },
            {
                "code": "konkan",
                "name": "Konkan Coast",
                "climate": "Tropical humid",
                "major_crops": ["rice", "coconut", "cashew", "mango"],
                "seasons": ["kharif"],
                "rainfall_mm": "2000-4000"
            },
            {
                "code": "vidarbha",
                "name": "Vidarbha",
                "climate": "Semi-arid to sub-humid",
                "major_crops": ["cotton", "soybean", "rice", "orange"],
                "seasons": ["kharif", "rabi"],
                "rainfall_mm": "800-1200"
            },
            {
                "code": "marathwada",
                "name": "Marathwada",
                "climate": "Semi-arid",
                "major_crops": ["cotton", "sorghum", "pearl_millet", "gram"],
                "seasons": ["kharif", "rabi"],
                "rainfall_mm": "600-900"
            },
            {
                "code": "southern_plateau",
                "name": "Southern Plateau (Karnataka)",
                "climate": "Semi-arid",
                "major_crops": ["ragi", "maize", "cotton", "groundnut"],
                "seasons": ["kharif", "rabi"],
                "rainfall_mm": "600-1000"
            },
            {
                "code": "northern_karnataka",
                "name": "Northern Karnataka",
                "climate": "Semi-arid",
                "major_crops": ["cotton", "sorghum", "groundnut", "sunflower"],
                "seasons": ["kharif", "rabi"],
                "rainfall_mm": "500-800"
            }
        ]
    }