"""
Enhanced API Routes for KisanGPT
Integrates all new enhanced services with the existing system
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import base64
from loguru import logger

from app.services.enhanced.soil_analysis_service import SoilAnalysisService
from app.services.enhanced.crop_rotation_service import CropRotationService
from app.services.enhanced.market_linkage_service import MarketLinkageService
from app.services.enhanced.computer_vision_service import ComputerVisionService
from app.services.enhanced.satellite_data_service import SatelliteDataService

# Initialize enhanced services
soil_service = SoilAnalysisService()
rotation_service = CropRotationService()
market_service = MarketLinkageService()
vision_service = ComputerVisionService()
satellite_service = SatelliteDataService()

# Create router
router = APIRouter(prefix="/api/v1/enhanced", tags=["enhanced"])


# Pydantic models for requests
class SoilAnalysisRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="GPS latitude")
    longitude: float = Field(..., ge=-180, le=180, description="GPS longitude")
    depth_interval: str = Field(default="0-5cm", description="Soil depth interval")
    include_iot_data: bool = Field(default=False, description="Include IoT sensor data")
    farm_id: Optional[str] = Field(None, description="Farm identifier for IoT data")


class CropRotationAnalysisRequest(BaseModel):
    farm_id: str = Field(..., description="Farm identifier")
    field_coordinates: Dict[str, float] = Field(..., description="Field GPS coordinates")
    years: int = Field(default=5, ge=1, le=10, description="Years of history to analyze")


class RotationRecommendationRequest(BaseModel):
    farm_id: str = Field(..., description="Farm identifier")
    current_crop: Optional[str] = Field(None, description="Currently grown crop")
    field_size_hectares: float = Field(default=1.0, ge=0.1, le=1000, description="Field size in hectares")
    soil_type: str = Field(default="mixed_soil", description="Soil type classification")
    climate_zone: str = Field(default="semi_arid", description="Climate classification")
    planning_years: int = Field(default=3, ge=1, le=10, description="Years to plan ahead")


class MarketPriceRequest(BaseModel):
    crop: str = Field(..., description="Crop name")
    state: str = Field(default="Maharashtra", description="State name")
    district: str = Field(default="Pune", description="District name")
    market: Optional[str] = Field(None, description="Specific market name")


class MarketDemandRequest(BaseModel):
    crop: str = Field(..., description="Crop name")
    region: str = Field(default="Maharashtra", description="Region for analysis")
    analysis_period: str = Field(default="monthly", description="Analysis period (weekly, monthly, yearly)")


class PriceAlertsRequest(BaseModel):
    farm_id: str = Field(..., description="Farm identifier")
    crops: List[str] = Field(..., description="List of crops to monitor")
    price_thresholds: Dict[str, Dict[str, float]] = Field(..., description="Price thresholds for alerts")


class ImageAnalysisRequest(BaseModel):
    image_data: str = Field(..., description="Base64 encoded image data")
    crop_type: str = Field(default="unknown", description="Type of crop")
    analysis_type: str = Field(default="comprehensive", description="Analysis type (disease, pest, comprehensive)")


class SatelliteAnalysisRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="GPS latitude")
    longitude: float = Field(..., ge=-180, le=180, description="GPS longitude")
    analysis_type: str = Field(default="ndvi", description="Analysis type (ndvi, boundaries, growth, stress)")
    date_range_days: int = Field(default=30, ge=1, le=365, description="Date range for analysis")
    resolution: str = Field(default="10m", description="Satellite imagery resolution")


class CropGrowthMonitoringRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="GPS latitude")
    longitude: float = Field(..., ge=-180, le=180, description="GPS longitude")
    crop_type: str = Field(..., description="Type of crop being monitored")
    planting_date: str = Field(..., description="Planting date (ISO format)")
    monitoring_period_days: int = Field(default=90, ge=30, le=365, description="Monitoring period in days")


# Soil Analysis Endpoints
@router.post("/soil/analyze")
async def analyze_soil_comprehensive(request: SoilAnalysisRequest):
    """Comprehensive soil analysis using satellite data and IoT sensors"""
    try:
        logger.info(f"Soil analysis request for coordinates: {request.latitude}, {request.longitude}")
        
        result = await soil_service.analyze_soil_comprehensive(
            latitude=request.latitude,
            longitude=request.longitude,
            depth_interval=request.depth_interval,
            include_iot_data=request.include_iot_data,
            farm_id=request.farm_id
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in soil analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Soil analysis failed: {str(e)}")


@router.get("/soil/trends")
async def get_soil_trends(
    latitude: float,
    longitude: float,
    months: int = 12
):
    """Get historical soil health trends for a location"""
    try:
        result = await soil_service.get_historical_soil_trends(latitude, longitude, months)
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting soil trends: {e}")
        raise HTTPException(status_code=500, detail=f"Could not fetch soil trends: {str(e)}")


# Crop Rotation Endpoints
@router.post("/rotation/analyze")
async def analyze_crop_history(request: CropRotationAnalysisRequest):
    """Analyze crop history for rotation patterns and sustainability"""
    try:
        logger.info(f"Crop rotation analysis for farm {request.farm_id}")
        
        result = await rotation_service.analyze_crop_history(
            farm_id=request.farm_id,
            field_coordinates=request.field_coordinates,
            years=request.years
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in crop history analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Crop history analysis failed: {str(e)}")


@router.post("/rotation/recommend")
async def recommend_rotation_schedule(request: RotationRecommendationRequest):
    """Get crop rotation recommendations for optimal sustainability"""
    try:
        logger.info(f"Rotation recommendations for farm {request.farm_id}")
        
        result = await rotation_service.recommend_rotation_schedule(
            farm_id=request.farm_id,
            current_crop=request.current_crop,
            field_size_hectares=request.field_size_hectares,
            soil_type=request.soil_type,
            climate_zone=request.climate_zone,
            planning_years=request.planning_years
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in rotation recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Rotation recommendations failed: {str(e)}")


# Market Analysis Endpoints
@router.post("/market/prices")
async def get_real_time_prices(request: MarketPriceRequest):
    """Get real-time market prices from multiple sources"""
    try:
        logger.info(f"Market price request for {request.crop} in {request.district}")
        
        result = await market_service.get_real_time_market_prices(
            crop=request.crop,
            state=request.state,
            district=request.district,
            market=request.market
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching market prices: {e}")
        raise HTTPException(status_code=500, detail=f"Market price fetch failed: {str(e)}")


@router.post("/market/demand")
async def analyze_market_demand(request: MarketDemandRequest):
    """Analyze market demand patterns and trends"""
    try:
        logger.info(f"Market demand analysis for {request.crop} in {request.region}")
        
        result = await market_service.get_market_demand_analysis(
            crop=request.crop,
            region=request.region,
            analysis_period=request.analysis_period
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in market demand analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Market demand analysis failed: {str(e)}")


@router.post("/market/alerts")
async def setup_price_alerts(request: PriceAlertsRequest):
    """Set up price alerts and notifications for farmers"""
    try:
        logger.info(f"Setting up price alerts for farm {request.farm_id}")
        
        result = await market_service.get_price_alerts_and_notifications(
            farm_id=request.farm_id,
            crops=request.crops,
            price_thresholds=request.price_thresholds
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error setting up price alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Price alerts setup failed: {str(e)}")


# Computer Vision Endpoints
@router.post("/vision/analyze-image")
async def analyze_crop_image(request: ImageAnalysisRequest):
    """Comprehensive crop image analysis for diseases and pests"""
    try:
        logger.info(f"Image analysis request for {request.crop_type}")
        
        result = await vision_service.analyze_crop_image(
            image_data=request.image_data,
            crop_type=request.crop_type,
            analysis_type=request.analysis_type
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in image analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


@router.post("/vision/upload-image")
async def upload_and_analyze_image(
    file: UploadFile = File(...),
    crop_type: str = Form(default="unknown"),
    analysis_type: str = Form(default="comprehensive")
):
    """Upload and analyze crop image file"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and encode image
        image_content = await file.read()
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        
        logger.info(f"Processing uploaded image: {file.filename}")
        
        # Analyze image
        result = await vision_service.analyze_crop_image(
            image_data=image_base64,
            crop_type=crop_type,
            analysis_type=analysis_type
        )
        
        # Add upload metadata
        if "data" not in result:
            result["data"] = {}
        
        result["data"]["upload_info"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size_bytes": len(image_content),
            "upload_timestamp": datetime.now().isoformat()
        }
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing uploaded image: {e}")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")


# Satellite Data Analysis Endpoints
@router.post("/satellite/ndvi-analysis")
async def analyze_ndvi_satellite(request: SatelliteAnalysisRequest):
    """NDVI and vegetation health analysis using satellite data"""
    try:
        logger.info(f"NDVI satellite analysis for {request.latitude}, {request.longitude}")
        
        result = await satellite_service.calculate_ndvi_analysis(
            latitude=request.latitude,
            longitude=request.longitude,
            historical_months=6
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in NDVI satellite analysis: {e}")
        raise HTTPException(status_code=500, detail=f"NDVI analysis failed: {str(e)}")


@router.post("/satellite/field-boundaries")
async def detect_field_boundaries(request: SatelliteAnalysisRequest):
    """Detect field boundaries using satellite imagery"""
    try:
        logger.info(f"Field boundary detection for {request.latitude}, {request.longitude}")
        
        result = await satellite_service.detect_field_boundaries(
            latitude=request.latitude,
            longitude=request.longitude,
            buffer_radius=500.0
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in field boundary detection: {e}")
        raise HTTPException(status_code=500, detail=f"Boundary detection failed: {str(e)}")


@router.post("/satellite/crop-growth-monitoring")
async def monitor_crop_growth_satellite(request: CropGrowthMonitoringRequest):
    """Monitor crop growth using time-series satellite data"""
    try:
        logger.info(f"Crop growth monitoring for {request.crop_type} at {request.latitude}, {request.longitude}")
        
        # Parse planting date
        planting_date = datetime.fromisoformat(request.planting_date)
        
        result = await satellite_service.monitor_crop_growth(
            latitude=request.latitude,
            longitude=request.longitude,
            crop_type=request.crop_type,
            planting_date=planting_date,
            monitoring_period=request.monitoring_period_days
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in crop growth monitoring: {e}")
        raise HTTPException(status_code=500, detail=f"Crop growth monitoring failed: {str(e)}")


@router.post("/satellite/environmental-stress")
async def assess_environmental_stress(request: SatelliteAnalysisRequest):
    """Assess environmental stress factors using satellite data"""
    try:
        logger.info(f"Environmental stress assessment for {request.latitude}, {request.longitude}")
        
        stress_factors = ["drought", "waterlogging", "heat", "cold", "wind"]
        
        result = await satellite_service.assess_environmental_stress(
            latitude=request.latitude,
            longitude=request.longitude,
            stress_factors=stress_factors
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in environmental stress assessment: {e}")
        raise HTTPException(status_code=500, detail=f"Environmental stress assessment failed: {str(e)}")


@router.get("/satellite/imagery")
async def get_satellite_imagery(
    latitude: float,
    longitude: float,
    date_range: int = 30,
    resolution: str = "10m",
    satellite_source: str = "sentinel-2"
):
    """Get satellite imagery for specified coordinates"""
    try:
        logger.info(f"Fetching satellite imagery for {latitude}, {longitude}")
        
        result = await satellite_service.get_satellite_imagery(
            latitude=latitude,
            longitude=longitude,
            date_range=date_range,
            resolution=resolution,
            satellite_source=satellite_source
        )
        
        return {
            "status": "success",
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching satellite imagery: {e}")
        raise HTTPException(status_code=500, detail=f"Satellite imagery fetch failed: {str(e)}")


# Combined Analysis Endpoints
@router.post("/comprehensive-analysis")
async def comprehensive_farm_analysis(
    farm_id: str,
    field_coordinates: Dict[str, float],
    crops: List[str],
    soil_analysis: bool = True,
    rotation_analysis: bool = True,
    market_analysis: bool = True,
    satellite_analysis: bool = True
):
    """Comprehensive farm analysis combining multiple services"""
    try:
        logger.info(f"Comprehensive analysis for farm {farm_id}")
        
        results = {
            "farm_id": farm_id,
            "field_coordinates": field_coordinates,
            "analysis_timestamp": datetime.now().isoformat(),
            "analyses_performed": []
        }
        
        # Perform soil analysis if requested
        if soil_analysis:
            try:
                soil_result = await soil_service.analyze_soil_comprehensive(
                    latitude=field_coordinates["latitude"],
                    longitude=field_coordinates["longitude"],
                    farm_id=farm_id
                )
                results["soil_analysis"] = soil_result
                results["analyses_performed"].append("soil_analysis")
            except Exception as e:
                logger.warning(f"Soil analysis failed in comprehensive analysis: {e}")
                results["soil_analysis_error"] = str(e)
        
        # Perform rotation analysis if requested
        if rotation_analysis:
            try:
                rotation_result = await rotation_service.analyze_crop_history(
                    farm_id=farm_id,
                    field_coordinates=field_coordinates
                )
                results["rotation_analysis"] = rotation_result
                results["analyses_performed"].append("rotation_analysis")
            except Exception as e:
                logger.warning(f"Rotation analysis failed in comprehensive analysis: {e}")
                results["rotation_analysis_error"] = str(e)
        
        # Perform market analysis if requested
        if market_analysis and crops:
            try:
                market_results = []
                for crop in crops[:3]:  # Limit to first 3 crops to avoid timeout
                    market_result = await market_service.get_real_time_market_prices(
                        crop=crop,
                        district="Pune"  # Default district, can be made configurable
                    )
                    market_results.append(market_result)
                
                results["market_analysis"] = market_results
                results["analyses_performed"].append("market_analysis")
            except Exception as e:
                logger.warning(f"Market analysis failed in comprehensive analysis: {e}")
                results["market_analysis_error"] = str(e)
        
        # Perform satellite analysis if requested
        if satellite_analysis:
            try:
                satellite_result = await satellite_service.calculate_ndvi_analysis(
                    latitude=field_coordinates["latitude"],
                    longitude=field_coordinates["longitude"]
                )
                results["satellite_analysis"] = satellite_result
                results["analyses_performed"].append("satellite_analysis")
            except Exception as e:
                logger.warning(f"Satellite analysis failed in comprehensive analysis: {e}")
                results["satellite_analysis_error"] = str(e)
        
        # Generate integrated insights
        results["integrated_insights"] = _generate_integrated_insights(results)
        
        return {
            "status": "success",
            "data": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in comprehensive farm analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Comprehensive analysis failed: {str(e)}")


# Health Check Endpoints
@router.get("/health")
async def health_check_all_services():
    """Check health of all enhanced services"""
    try:
        health_checks = {}
        
        # Check each service
        services = {
            "soil_service": soil_service,
            "rotation_service": rotation_service,
            "market_service": market_service,
            "vision_service": vision_service,
            "satellite_service": satellite_service
        }
        
        for service_name, service in services.items():
            try:
                health_result = await service.health_check()
                health_checks[service_name] = health_result
            except Exception as e:
                health_checks[service_name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "service": service_name
                }
        
        # Overall status
        all_healthy = all(
            check.get("status") == "healthy" 
            for check in health_checks.values()
        )
        
        return {
            "overall_status": "healthy" if all_healthy else "degraded",
            "services": health_checks,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return {
            "overall_status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@router.get("/capabilities")
async def get_enhanced_capabilities():
    """Get information about enhanced capabilities"""
    return {
        "capabilities": {
            "soil_analysis": {
                "satellite_data_integration": True,
                "iot_sensor_support": True,
                "soil_grids_api": True,
                "bhuvan_api": True,
                "comprehensive_recommendations": True
            },
            "crop_rotation": {
                "historical_analysis": True,
                "sustainability_scoring": True,
                "rotation_recommendations": True,
                "nutrient_impact_analysis": True,
                "multi_year_planning": True
            },
            "market_analysis": {
                "real_time_prices": True,
                "multiple_data_sources": True,
                "price_forecasting": True,
                "market_demand_analysis": True,
                "price_alerts": True,
                "apmc_integration": True
            },
            "computer_vision": {
                "disease_detection": True,
                "pest_detection": True,
                "plant_health_analysis": True,
                "comprehensive_image_analysis": True,
                "treatment_recommendations": True,
                "multiple_crop_support": True
            },
            "satellite_data": {
                "ndvi_analysis": True,
                "field_boundary_detection": True,
                "crop_growth_monitoring": True,
                "environmental_stress_assessment": True,
                "multi_spectral_analysis": True,
                "historical_trend_analysis": True,
                "yield_prediction": True,
                "vegetation_health_assessment": True
            }
        },
        "supported_formats": {
            "image_formats": ["jpg", "jpeg", "png", "bmp", "tiff"],
            "soil_depths": ["0-5cm", "5-15cm", "15-30cm", "30-60cm", "60-100cm", "100-200cm"],
            "analysis_types": ["disease", "pest", "health", "comprehensive"]
        },
        "api_version": "1.0.0",
        "last_updated": datetime.now().isoformat()
    }


# Helper Functions
def _generate_integrated_insights(analysis_results: Dict[str, Any]) -> List[str]:
    """Generate integrated insights from multiple analysis results"""
    insights = []
    
    try:
        # Soil-based insights
        if "soil_analysis" in analysis_results:
            soil_data = analysis_results["soil_analysis"]
            recommendations = soil_data.get("recommendations", {})
            if recommendations.get("priority_level") == "high":
                insights.append("🚨 Urgent soil health issues detected - immediate attention required")
            
            soil_props = soil_data.get("soil_properties", {})
            basic_props = soil_props.get("basic_properties", {})
            fertility_index = basic_props.get("fertility_index", 50)
            
            if fertility_index > 75:
                insights.append("🌱 Excellent soil fertility supports diverse crop options")
            elif fertility_index < 40:
                insights.append("⚠️ Low soil fertility may limit crop choices")
        
        # Market-based insights
        if "market_analysis" in analysis_results:
            market_data = analysis_results["market_analysis"]
            if isinstance(market_data, list) and market_data:
                for market_result in market_data:
                    analysis = market_result.get("market_analysis", {})
                    if analysis.get("price_trend") == "rising":
                        crop = market_result.get("crop", "crops")
                        insights.append(f"📈 {crop.title()} prices are rising - good selling opportunity")
        
        # Rotation-based insights
        if "rotation_analysis" in analysis_results:
            rotation_data = analysis_results["rotation_analysis"]
            sustainability_metrics = rotation_data.get("sustainability_metrics", {})
            score = sustainability_metrics.get("overall_sustainability_score", 50)
            
            if score > 70:
                insights.append("♻️ Current rotation practices are highly sustainable")
            elif score < 50:
                insights.append("🔄 Rotation improvements needed for better sustainability")
        
        # Satellite-based insights
        if "satellite_analysis" in analysis_results:
            satellite_data = analysis_results["satellite_analysis"]
            current_indices = satellite_data.get("current_indices", {})
            ndvi_data = current_indices.get("ndvi", {})
            ndvi_value = ndvi_data.get("value", 0.5)
            health_status = ndvi_data.get("health_status", "unknown")
            
            if ndvi_value >= 0.7:
                insights.append("🛰️ Satellite data shows excellent crop health - dense vegetation detected")
            elif ndvi_value < 0.3:
                insights.append("🚨 Satellite imagery indicates crop stress - immediate attention needed")
            elif health_status == "good":
                insights.append("📡 Satellite monitoring confirms healthy crop development")
        
        # Combined insights
        if len(analysis_results.get("analyses_performed", [])) >= 2:
            insights.append("🔗 Multiple analysis factors considered for comprehensive recommendations")
        
        # Default insight if none generated
        if not insights:
            insights.append("📊 Analysis completed - review detailed results for specific recommendations")
    
    except Exception as e:
        logger.error(f"Error generating integrated insights: {e}")
        insights = ["📊 Analysis completed successfully"]
    
    return insights[:5]  # Limit to top 5 insights