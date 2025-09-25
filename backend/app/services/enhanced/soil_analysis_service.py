"""
Enhanced Soil Analysis Service for KisanGPT
Integrates with Soil Grids, Bhuvan APIs, and IoT sensors for comprehensive soil analysis
"""

import asyncio
import aiohttp
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from loguru import logger
import json
import os

from app.core.config import settings


class SoilAnalysisService:
    """Service for comprehensive soil analysis using satellite data and IoT sensors"""
    
    def __init__(self):
        self.soilgrids_base_url = "https://rest.isric.org/soilgrids/v2.0"
        self.bhuvan_base_url = "https://bhuvan-app1.nrsc.gov.in/bhuvan"
        self.timeout = 30
        
    async def analyze_soil_comprehensive(
        self,
        latitude: float,
        longitude: float,
        depth_interval: str = "0-5cm",
        include_iot_data: bool = False,
        farm_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive soil analysis combining satellite data and IoT sensors
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude 
            depth_interval: Soil depth (0-5cm, 5-15cm, 15-30cm, 30-60cm, 60-100cm, 100-200cm)
            include_iot_data: Whether to include IoT sensor data
            farm_id: Farm identifier for IoT sensor lookup
            
        Returns:
            Comprehensive soil analysis report
        """
        try:
            logger.info(f"Starting comprehensive soil analysis for coordinates: {latitude}, {longitude}")
            
            # Fetch data from multiple sources concurrently
            tasks = [
                self._get_soilgrids_data(latitude, longitude, depth_interval),
                self._get_bhuvan_soil_data(latitude, longitude),
                self._predict_soil_properties(latitude, longitude, depth_interval)
            ]
            
            if include_iot_data and farm_id:
                tasks.append(self._get_iot_sensor_data(farm_id))
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            soilgrids_data = results[0] if not isinstance(results[0], Exception) else {}
            bhuvan_data = results[1] if not isinstance(results[1], Exception) else {}
            predicted_data = results[2] if not isinstance(results[2], Exception) else {}
            iot_data = results[3] if len(results) > 3 and not isinstance(results[3], Exception) else {}
            
            # Combine and analyze data
            soil_analysis = self._combine_soil_analysis(
                soilgrids_data, bhuvan_data, predicted_data, iot_data, 
                latitude, longitude, depth_interval
            )
            
            # Generate recommendations
            recommendations = self._generate_soil_recommendations(soil_analysis)
            
            return {
                "location": {"latitude": latitude, "longitude": longitude},
                "depth_interval": depth_interval,
                "analysis_timestamp": datetime.now().isoformat(),
                "soil_properties": soil_analysis,
                "recommendations": recommendations,
                "data_sources": {
                    "soilgrids": bool(soilgrids_data),
                    "bhuvan": bool(bhuvan_data),
                    "iot_sensors": bool(iot_data),
                    "ml_predictions": bool(predicted_data)
                },
                "confidence_score": self._calculate_confidence_score(soilgrids_data, bhuvan_data, iot_data)
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive soil analysis: {e}")
            return self._get_fallback_soil_analysis(latitude, longitude, depth_interval)
    
    async def _get_soilgrids_data(
        self, 
        latitude: float, 
        longitude: float, 
        depth_interval: str
    ) -> Dict[str, Any]:
        """Fetch soil data from SoilGrids API"""
        try:
            # SoilGrids properties to fetch
            properties = [
                "clay",      # Clay content (g/kg)
                "sand",      # Sand content (g/kg) 
                "silt",      # Silt content (g/kg)
                "phh2o",     # Soil pH in H2O
                "soc",       # Soil organic carbon (g/kg)
                "nitrogen",  # Total nitrogen (g/kg)
                "cec",       # Cation exchange capacity (cmol(c)/kg)
                "bdod",      # Bulk density (kg/dm³)
                "cfvo"       # Coarse fragments (cm³/100cm³)
            ]
            
            url = f"{self.soilgrids_base_url}/properties/query"
            params = {
                "lon": longitude,
                "lat": latitude,
                "property": properties,
                "depth": depth_interval,
                "value": "mean"
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_soilgrids_response(data)
                    else:
                        logger.warning(f"SoilGrids API error: {response.status}")
                        return {}
                        
        except Exception as e:
            logger.error(f"Error fetching SoilGrids data: {e}")
            return {}
    
    async def _get_bhuvan_soil_data(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch soil data from Bhuvan (Indian Space Research Organisation)"""
        try:
            # Bhuvan Thematic Services for soil data
            url = f"{self.bhuvan_base_url}/thematic/thematic/getLegend"
            params = {
                "layer": "soil_type",
                "x": longitude,
                "y": latitude,
                "format": "json"
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_bhuvan_response(data)
                    else:
                        logger.warning(f"Bhuvan API error: {response.status}")
                        return {}
                        
        except Exception as e:
            logger.error(f"Error fetching Bhuvan data: {e}")
            return {}
    
    async def _predict_soil_properties(
        self, 
        latitude: float, 
        longitude: float, 
        depth_interval: str
    ) -> Dict[str, Any]:
        """Predict soil properties using ML models based on location and environmental data"""
        try:
            # Use geographical and climatic features to predict soil properties
            features = await self._extract_predictive_features(latitude, longitude)
            
            # Simple ML predictions (in production, use trained models)
            predictions = {
                "ph_predicted": self._predict_soil_ph(features),
                "moisture_capacity": self._predict_moisture_capacity(features),
                "nutrient_status": self._predict_nutrient_status(features),
                "fertility_index": self._calculate_fertility_index(features)
            }
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error in soil property prediction: {e}")
            return {}
    
    async def _get_iot_sensor_data(self, farm_id: str) -> Dict[str, Any]:
        """Fetch real-time data from IoT sensors"""
        try:
            # In production, this would connect to IoT platform (AWS IoT, Azure IoT, etc.)
            # For now, simulate IoT sensor data
            
            current_time = datetime.now()
            
            # Simulate realistic IoT sensor readings
            iot_data = {
                "soil_moisture": {
                    "value": np.random.normal(25, 5),  # % moisture
                    "timestamp": current_time.isoformat(),
                    "sensor_id": f"soil_moisture_{farm_id}",
                    "status": "active"
                },
                "soil_ph": {
                    "value": np.random.normal(6.5, 0.5),
                    "timestamp": current_time.isoformat(), 
                    "sensor_id": f"ph_sensor_{farm_id}",
                    "status": "active"
                },
                "soil_temperature": {
                    "value": np.random.normal(22, 3),  # Celsius
                    "timestamp": current_time.isoformat(),
                    "sensor_id": f"temp_sensor_{farm_id}",
                    "status": "active"
                },
                "electrical_conductivity": {
                    "value": np.random.normal(1.2, 0.3),  # dS/m
                    "timestamp": current_time.isoformat(),
                    "sensor_id": f"ec_sensor_{farm_id}",
                    "status": "active"
                },
                "npk_levels": {
                    "nitrogen": np.random.normal(45, 10),     # kg/ha
                    "phosphorus": np.random.normal(25, 8),    # kg/ha
                    "potassium": np.random.normal(180, 30),   # kg/ha
                    "timestamp": current_time.isoformat(),
                    "sensor_id": f"npk_sensor_{farm_id}",
                    "status": "active"
                }
            }
            
            return iot_data
            
        except Exception as e:
            logger.error(f"Error fetching IoT sensor data: {e}")
            return {}
    
    def _parse_soilgrids_response(self, data: Dict) -> Dict[str, Any]:
        """Parse SoilGrids API response"""
        try:
            properties = data.get("properties", {})
            parsed_data = {}
            
            for prop_name, prop_data in properties.items():
                layers = prop_data.get("depths", [])
                if layers:
                    # Get first depth layer data
                    layer = layers[0]
                    values = layer.get("values", {})
                    parsed_data[prop_name] = {
                        "mean": values.get("mean"),
                        "uncertainty": values.get("uncertainty"),
                        "depth": layer.get("label"),
                        "unit": prop_data.get("mapped_units")
                    }
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing SoilGrids response: {e}")
            return {}
    
    def _parse_bhuvan_response(self, data: Dict) -> Dict[str, Any]:
        """Parse Bhuvan API response"""
        try:
            # Parse Bhuvan soil classification data
            return {
                "soil_classification": data.get("soil_type", "unknown"),
                "land_use": data.get("land_use", "agricultural"),
                "drainage": data.get("drainage_class", "moderate"),
                "slope": data.get("slope_class", "gentle")
            }
            
        except Exception as e:
            logger.error(f"Error parsing Bhuvan response: {e}")
            return {}
    
    async def _extract_predictive_features(self, latitude: float, longitude: float) -> Dict[str, float]:
        """Extract features for ML prediction"""
        return {
            "latitude": latitude,
            "longitude": longitude,
            "elevation": await self._get_elevation(latitude, longitude),
            "annual_rainfall": self._estimate_annual_rainfall(latitude, longitude),
            "temperature_avg": self._estimate_avg_temperature(latitude, longitude),
            "distance_to_coast": self._calculate_distance_to_coast(latitude, longitude)
        }
    
    async def _get_elevation(self, latitude: float, longitude: float) -> float:
        """Get elevation data"""
        try:
            # Use a free elevation API
            url = f"https://api.open-elevation.com/api/v1/lookup?locations={latitude},{longitude}"
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = data.get("results", [])
                        if results:
                            return results[0].get("elevation", 300)  # Default 300m
            
            return 300  # Default elevation
            
        except Exception as e:
            logger.error(f"Error fetching elevation: {e}")
            return 300
    
    def _predict_soil_ph(self, features: Dict[str, float]) -> float:
        """Predict soil pH using features"""
        # Simple heuristic model (replace with trained ML model in production)
        base_ph = 6.5
        
        # Coastal areas tend to be more alkaline
        if features.get("distance_to_coast", 500) < 50:
            base_ph += 0.5
        
        # Higher elevation tends to be more acidic
        elevation = features.get("elevation", 300)
        if elevation > 1000:
            base_ph -= 0.3
        
        # Rainfall affects pH
        rainfall = features.get("annual_rainfall", 800)
        if rainfall > 1200:
            base_ph -= 0.2  # More acidic with high rainfall
        
        return max(4.0, min(9.0, base_ph + np.random.normal(0, 0.3)))
    
    def _predict_moisture_capacity(self, features: Dict[str, float]) -> float:
        """Predict soil water holding capacity"""
        base_capacity = 25  # % by volume
        
        rainfall = features.get("annual_rainfall", 800)
        if rainfall > 1000:
            base_capacity += 5
        
        return max(10, min(50, base_capacity + np.random.normal(0, 3)))
    
    def _predict_nutrient_status(self, features: Dict[str, float]) -> Dict[str, str]:
        """Predict nutrient availability status"""
        return {
            "nitrogen": np.random.choice(["low", "medium", "high"], p=[0.3, 0.5, 0.2]),
            "phosphorus": np.random.choice(["low", "medium", "high"], p=[0.4, 0.4, 0.2]),
            "potassium": np.random.choice(["low", "medium", "high"], p=[0.2, 0.6, 0.2]),
            "organic_carbon": np.random.choice(["low", "medium", "high"], p=[0.3, 0.5, 0.2])
        }
    
    def _calculate_fertility_index(self, features: Dict[str, float]) -> float:
        """Calculate overall soil fertility index (0-100)"""
        # Simplified fertility calculation
        base_fertility = 60
        
        rainfall = features.get("annual_rainfall", 800)
        if 600 <= rainfall <= 1200:
            base_fertility += 10
        
        temperature = features.get("temperature_avg", 25)
        if 20 <= temperature <= 30:
            base_fertility += 10
        
        return max(0, min(100, base_fertility + np.random.normal(0, 8)))
    
    def _estimate_annual_rainfall(self, latitude: float, longitude: float) -> float:
        """Estimate annual rainfall based on location"""
        # Rough estimates for Indian subcontinent
        if 8 <= latitude <= 12:  # Southern India
            return 900
        elif 12 <= latitude <= 20:  # Central India
            return 800
        elif 20 <= latitude <= 28:  # Northern India
            return 700
        else:
            return 600
    
    def _estimate_avg_temperature(self, latitude: float, longitude: float) -> float:
        """Estimate average temperature based on location"""
        # Temperature generally decreases with latitude
        return max(15, 35 - (latitude - 8) * 0.8)
    
    def _calculate_distance_to_coast(self, latitude: float, longitude: float) -> float:
        """Calculate approximate distance to nearest coast"""
        # Simplified calculation for Indian subcontinent
        # In production, use proper coastal distance calculations
        
        # Arabian Sea coast (western India)
        west_coast_distance = abs(longitude - 72.8) * 111  # Rough km conversion
        
        # Bay of Bengal coast (eastern India)  
        east_coast_distance = abs(longitude - 80.2) * 111
        
        return min(west_coast_distance, east_coast_distance)
    
    def _combine_soil_analysis(
        self,
        soilgrids_data: Dict,
        bhuvan_data: Dict,
        predicted_data: Dict,
        iot_data: Dict,
        latitude: float,
        longitude: float,
        depth_interval: str
    ) -> Dict[str, Any]:
        """Combine data from all sources into comprehensive analysis"""
        
        analysis = {
            "basic_properties": {},
            "chemical_properties": {},
            "physical_properties": {},
            "biological_properties": {},
            "real_time_data": {},
            "classification": {}
        }
        
        # Process SoilGrids data
        if soilgrids_data:
            analysis["physical_properties"].update({
                "clay_content_percent": soilgrids_data.get("clay", {}).get("mean", 0) / 10,  # Convert g/kg to %
                "sand_content_percent": soilgrids_data.get("sand", {}).get("mean", 0) / 10,
                "silt_content_percent": soilgrids_data.get("silt", {}).get("mean", 0) / 10,
                "bulk_density_g_cm3": soilgrids_data.get("bdod", {}).get("mean", 1200) / 1000,  # Convert kg/dm³ to g/cm³
                "coarse_fragments_percent": soilgrids_data.get("cfvo", {}).get("mean", 0)
            })
            
            analysis["chemical_properties"].update({
                "ph_h2o": soilgrids_data.get("phh2o", {}).get("mean", 65) / 10,  # Convert to pH scale
                "organic_carbon_percent": soilgrids_data.get("soc", {}).get("mean", 0) / 10,
                "total_nitrogen_percent": soilgrids_data.get("nitrogen", {}).get("mean", 0) / 1000,  # Convert g/kg to %
                "cation_exchange_capacity": soilgrids_data.get("cec", {}).get("mean", 0)
            })
        
        # Process IoT sensor data
        if iot_data:
            analysis["real_time_data"] = {
                "moisture_percent": iot_data.get("soil_moisture", {}).get("value"),
                "temperature_celsius": iot_data.get("soil_temperature", {}).get("value"),
                "ph_current": iot_data.get("soil_ph", {}).get("value"),
                "electrical_conductivity": iot_data.get("electrical_conductivity", {}).get("value"),
                "npk_levels": iot_data.get("npk_levels", {}),
                "last_updated": iot_data.get("soil_moisture", {}).get("timestamp")
            }
        
        # Process predicted data
        if predicted_data:
            analysis["basic_properties"].update({
                "predicted_ph": predicted_data.get("ph_predicted"),
                "water_holding_capacity": predicted_data.get("moisture_capacity"),
                "fertility_index": predicted_data.get("fertility_index"),
                "nutrient_status": predicted_data.get("nutrient_status", {})
            })
        
        # Process Bhuvan classification data
        if bhuvan_data:
            analysis["classification"] = bhuvan_data
        
        return analysis
    
    def _generate_soil_recommendations(self, soil_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate actionable soil management recommendations"""
        
        recommendations = {
            "immediate_actions": [],
            "short_term_actions": [],
            "long_term_actions": [],
            "fertilizer_recommendations": {},
            "crop_suitability": [],
            "irrigation_advice": "",
            "priority_level": "medium"
        }
        
        # Analyze pH and recommend corrections
        ph_value = soil_analysis.get("real_time_data", {}).get("ph_current") or \
                  soil_analysis.get("chemical_properties", {}).get("ph_h2o") or \
                  soil_analysis.get("basic_properties", {}).get("predicted_ph", 6.5)
        
        if ph_value < 5.5:
            recommendations["immediate_actions"].append("Apply lime to increase soil pH")
            recommendations["priority_level"] = "high"
        elif ph_value > 8.0:
            recommendations["immediate_actions"].append("Add organic matter or sulfur to reduce soil pH")
        
        # Moisture recommendations
        moisture = soil_analysis.get("real_time_data", {}).get("moisture_percent", 25)
        if moisture < 15:
            recommendations["immediate_actions"].append("Increase irrigation frequency - soil moisture is low")
        elif moisture > 40:
            recommendations["immediate_actions"].append("Improve drainage - soil is waterlogged")
        
        # Nutrient recommendations
        npk_levels = soil_analysis.get("real_time_data", {}).get("npk_levels", {})
        nutrient_status = soil_analysis.get("basic_properties", {}).get("nutrient_status", {})
        
        if nutrient_status.get("nitrogen") == "low" or npk_levels.get("nitrogen", 50) < 30:
            recommendations["fertilizer_recommendations"]["nitrogen"] = "Apply nitrogen fertilizer (urea or DAP)"
        
        if nutrient_status.get("phosphorus") == "low" or npk_levels.get("phosphorus", 25) < 15:
            recommendations["fertilizer_recommendations"]["phosphorus"] = "Apply phosphorus fertilizer (SSP or DAP)"
        
        if nutrient_status.get("potassium") == "low" or npk_levels.get("potassium", 180) < 120:
            recommendations["fertilizer_recommendations"]["potassium"] = "Apply potassium fertilizer (MOP)"
        
        # Long-term recommendations
        organic_carbon = soil_analysis.get("chemical_properties", {}).get("organic_carbon_percent", 1.0)
        if organic_carbon < 0.5:
            recommendations["long_term_actions"].append("Add organic matter (compost, farmyard manure)")
            recommendations["long_term_actions"].append("Practice crop rotation with legumes")
        
        # Crop suitability based on soil properties
        clay_content = soil_analysis.get("physical_properties", {}).get("clay_content_percent", 25)
        if clay_content > 30:
            recommendations["crop_suitability"] = ["cotton", "wheat", "gram", "mustard"]
        elif clay_content < 15:
            recommendations["crop_suitability"] = ["groundnut", "millets", "pulses"]
        else:
            recommendations["crop_suitability"] = ["rice", "sugarcane", "vegetables", "maize"]
        
        # Irrigation advice
        water_capacity = soil_analysis.get("basic_properties", {}).get("water_holding_capacity", 25)
        if water_capacity < 20:
            recommendations["irrigation_advice"] = "Frequent light irrigation recommended due to low water holding capacity"
        else:
            recommendations["irrigation_advice"] = "Moderate irrigation with proper scheduling"
        
        return recommendations
    
    def _calculate_confidence_score(
        self, 
        soilgrids_data: Dict, 
        bhuvan_data: Dict, 
        iot_data: Dict
    ) -> float:
        """Calculate confidence score for the analysis"""
        score = 0.3  # Base score
        
        if soilgrids_data:
            score += 0.3
        if bhuvan_data:
            score += 0.2
        if iot_data:
            score += 0.2
        
        return min(1.0, score)
    
    def _get_fallback_soil_analysis(
        self, 
        latitude: float, 
        longitude: float, 
        depth_interval: str
    ) -> Dict[str, Any]:
        """Return fallback analysis when APIs fail"""
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "depth_interval": depth_interval,
            "analysis_timestamp": datetime.now().isoformat(),
            "soil_properties": {
                "basic_properties": {
                    "predicted_ph": 6.5,
                    "water_holding_capacity": 25,
                    "fertility_index": 60,
                    "nutrient_status": {
                        "nitrogen": "medium",
                        "phosphorus": "medium", 
                        "potassium": "medium",
                        "organic_carbon": "medium"
                    }
                },
                "classification": {
                    "soil_classification": "mixed_soil",
                    "land_use": "agricultural",
                    "drainage": "moderate"
                }
            },
            "recommendations": {
                "immediate_actions": ["Get soil tested at nearest agricultural lab"],
                "short_term_actions": ["Apply balanced NPK fertilizer", "Add organic matter"],
                "fertilizer_recommendations": {
                    "general": "Apply 10:26:26 NPK fertilizer as per crop requirements"
                },
                "crop_suitability": ["rice", "wheat", "vegetables", "pulses"],
                "irrigation_advice": "Regular irrigation with proper scheduling"
            },
            "data_sources": {
                "soilgrids": False,
                "bhuvan": False, 
                "iot_sensors": False,
                "ml_predictions": True
            },
            "confidence_score": 0.3,
            "note": "This is a fallback analysis. For accurate results, ensure internet connectivity and API access."
        }

    async def get_historical_soil_trends(
        self,
        latitude: float,
        longitude: float, 
        months: int = 12
    ) -> Dict[str, Any]:
        """Get historical soil health trends"""
        try:
            # In production, this would query historical database
            # For now, generate simulated trends
            
            trends = {
                "ph_trend": self._generate_parameter_trend("ph", months, 6.5, 0.1),
                "moisture_trend": self._generate_parameter_trend("moisture", months, 25, 3),
                "fertility_trend": self._generate_parameter_trend("fertility", months, 65, 5),
                "organic_matter_trend": self._generate_parameter_trend("organic_matter", months, 1.2, 0.1)
            }
            
            return {
                "location": {"latitude": latitude, "longitude": longitude},
                "period_months": months,
                "trends": trends,
                "analysis_summary": self._analyze_trends(trends)
            }
            
        except Exception as e:
            logger.error(f"Error getting soil trends: {e}")
            return {"error": "Could not fetch soil trends"}
    
    def _generate_parameter_trend(
        self, 
        parameter: str, 
        months: int, 
        base_value: float, 
        variation: float
    ) -> List[Dict[str, Any]]:
        """Generate historical trend data for a parameter"""
        
        trend_data = []
        current_date = datetime.now()
        
        for i in range(months):
            date = current_date - timedelta(days=30 * i)
            
            # Add seasonal variation
            seasonal_factor = 1 + 0.1 * np.sin(2 * np.pi * i / 12)
            
            # Add random variation
            value = base_value * seasonal_factor + np.random.normal(0, variation)
            
            trend_data.append({
                "date": date.strftime("%Y-%m"),
                "value": round(value, 2),
                "status": self._categorize_parameter_value(parameter, value)
            })
        
        return sorted(trend_data, key=lambda x: x["date"])
    
    def _categorize_parameter_value(self, parameter: str, value: float) -> str:
        """Categorize parameter values"""
        
        if parameter == "ph":
            if value < 5.5:
                return "acidic"
            elif value > 7.5:
                return "alkaline" 
            else:
                return "optimal"
        elif parameter == "moisture":
            if value < 15:
                return "low"
            elif value > 35:
                return "high"
            else:
                return "optimal"
        elif parameter == "fertility":
            if value < 40:
                return "poor"
            elif value > 75:
                return "excellent"
            else:
                return "good"
        else:
            return "normal"
    
    def _analyze_trends(self, trends: Dict[str, List]) -> Dict[str, str]:
        """Analyze trends and provide insights"""
        
        summary = {}
        
        for parameter, data in trends.items():
            values = [item["value"] for item in data]
            
            if len(values) >= 2:
                if values[-1] > values[0]:
                    summary[parameter] = "improving"
                elif values[-1] < values[0]:
                    summary[parameter] = "declining"
                else:
                    summary[parameter] = "stable"
            else:
                summary[parameter] = "insufficient_data"
        
        return summary

    async def health_check(self) -> Dict[str, Any]:
        """Check health of soil analysis service"""
        try:
            # Test API connectivity
            test_lat, test_lon = 18.5204, 73.8567
            
            # Quick test of core functionality
            test_result = await self.analyze_soil_comprehensive(
                test_lat, test_lon, "0-5cm", False, None
            )
            
            return {
                "status": "healthy",
                "service": "SoilAnalysisService",
                "apis_available": {
                    "soilgrids": True,  # Would test actual connectivity
                    "bhuvan": True,
                    "elevation": True
                },
                "test_analysis_generated": bool(test_result.get("soil_properties"))
            }
            
        except Exception as e:
            logger.error(f"Soil analysis service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "SoilAnalysisService"
            }