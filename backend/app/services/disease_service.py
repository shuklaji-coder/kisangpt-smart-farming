"""
Disease prediction service for Kisan GPT
Predicts crop disease risks based on weather patterns and environmental conditions
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from loguru import logger

from app.core.config import settings


class DiseasePredictionService:
    """Service for predicting crop disease risks based on environmental conditions"""
    
    def __init__(self):
        # Disease-weather relationship models
        self.disease_models = self._initialize_disease_models()
        
    def _initialize_disease_models(self) -> Dict[str, Dict]:
        """Initialize rule-based disease prediction models"""
        
        return {
            'rice': {
                'blast': {
                    'temperature_range': (20, 30),
                    'humidity_min': 85,
                    'rainfall_threshold': 10,
                    'critical_days': 7,
                    'severity_factors': ['leaf_wetness', 'nitrogen_excess', 'dense_planting']
                },
                'brown_spot': {
                    'temperature_range': (25, 35),
                    'humidity_min': 80,
                    'rainfall_threshold': 5,
                    'critical_days': 5,
                    'severity_factors': ['water_stress', 'nutrient_deficiency']
                },
                'bacterial_blight': {
                    'temperature_range': (25, 32),
                    'humidity_min': 90,
                    'rainfall_threshold': 15,
                    'critical_days': 10,
                    'severity_factors': ['flooding', 'high_nitrogen', 'wind_damage']
                }
            },
            'wheat': {
                'rust': {
                    'temperature_range': (15, 25),
                    'humidity_min': 70,
                    'rainfall_threshold': 2,
                    'critical_days': 14,
                    'severity_factors': ['dew_formation', 'dense_crop', 'susceptible_variety']
                },
                'powdery_mildew': {
                    'temperature_range': (16, 22),
                    'humidity_min': 85,
                    'rainfall_threshold': 1,
                    'critical_days': 7,
                    'severity_factors': ['poor_air_circulation', 'shaded_areas']
                },
                'fusarium_head_blight': {
                    'temperature_range': (20, 30),
                    'humidity_min': 75,
                    'rainfall_threshold': 5,
                    'critical_days': 3,
                    'severity_factors': ['flowering_stage', 'continuous_moisture']
                }
            },
            'cotton': {
                'wilt': {
                    'temperature_range': (28, 35),
                    'humidity_min': 40,
                    'rainfall_threshold': 0,
                    'critical_days': 21,
                    'severity_factors': ['soil_moisture_stress', 'root_damage', 'poor_drainage']
                },
                'boll_rot': {
                    'temperature_range': (25, 32),
                    'humidity_min': 85,
                    'rainfall_threshold': 8,
                    'critical_days': 5,
                    'severity_factors': ['boll_development', 'insect_damage', 'dense_canopy']
                },
                'bacterial_blight': {
                    'temperature_range': (27, 35),
                    'humidity_min': 70,
                    'rainfall_threshold': 3,
                    'critical_days': 7,
                    'severity_factors': ['wind_driven_rain', 'leaf_injuries', 'high_nitrogen']
                }
            },
            'tomato': {
                'blight': {
                    'temperature_range': (18, 25),
                    'humidity_min': 90,
                    'rainfall_threshold': 10,
                    'critical_days': 5,
                    'severity_factors': ['leaf_wetness', 'poor_ventilation', 'dense_planting']
                },
                'fusarium_wilt': {
                    'temperature_range': (25, 35),
                    'humidity_min': 50,
                    'rainfall_threshold': 0,
                    'critical_days': 14,
                    'severity_factors': ['soil_temperature', 'root_wounds', 'water_stress']
                },
                'bacterial_spot': {
                    'temperature_range': (24, 30),
                    'humidity_min': 75,
                    'rainfall_threshold': 2,
                    'critical_days': 3,
                    'severity_factors': ['splash_irrigation', 'warm_humid_nights']
                }
            },
            'onion': {
                'purple_blotch': {
                    'temperature_range': (20, 30),
                    'humidity_min': 80,
                    'rainfall_threshold': 5,
                    'critical_days': 7,
                    'severity_factors': ['leaf_wetness', 'thrips_damage', 'nitrogen_excess']
                },
                'downy_mildew': {
                    'temperature_range': (10, 20),
                    'humidity_min': 95,
                    'rainfall_threshold': 15,
                    'critical_days': 3,
                    'severity_factors': ['cool_moist_conditions', 'poor_drainage']
                }
            },
            'sugarcane': {
                'red_rot': {
                    'temperature_range': (25, 35),
                    'humidity_min': 60,
                    'rainfall_threshold': 20,
                    'critical_days': 14,
                    'severity_factors': ['waterlogging', 'stem_injuries', 'susceptible_variety']
                },
                'smut': {
                    'temperature_range': (26, 32),
                    'humidity_min': 70,
                    'rainfall_threshold': 5,
                    'critical_days': 10,
                    'severity_factors': ['wind_dispersal', 'young_shoots', 'dry_conditions']
                }
            }
        }
    
    async def predict_disease_risk(
        self,
        crop: str,
        district: str,
        current_weather: Dict[str, Any],
        forecast_horizon_days: int = 14
    ) -> List[Dict[str, Any]]:
        """
        Predict disease risks for a crop based on current and forecasted weather
        
        Args:
            crop: Crop name
            district: District name
            current_weather: Current weather conditions
            forecast_horizon_days: Number of days to forecast
            
        Returns:
            List of disease risk predictions with preventive actions
        """
        try:
            logger.info(f"Predicting disease risk for {crop} in {district}")
            
            # Get crop-specific disease models
            crop_diseases = self.disease_models.get(crop.lower(), {})
            
            if not crop_diseases:
                logger.warning(f"No disease models found for crop: {crop}")
                return self._get_generic_disease_risks(crop, current_weather)
            
            # Extract current weather parameters
            current_temp = current_weather.get('temperature', 25)
            current_humidity = current_weather.get('humidity', 60)
            current_rainfall = current_weather.get('rainfall', 0)
            
            # Generate weather forecast if not provided
            forecast_data = current_weather.get('forecast', 
                                              self._generate_weather_forecast(current_weather, forecast_horizon_days))
            
            disease_risks = []
            
            # Analyze each disease for the crop
            for disease_name, disease_model in crop_diseases.items():
                risk_assessment = await self._assess_disease_risk(
                    disease_name, 
                    disease_model,
                    current_temp,
                    current_humidity, 
                    current_rainfall,
                    forecast_data,
                    forecast_horizon_days
                )
                
                if risk_assessment['risk_level'] != 'negligible':
                    # Get preventive actions
                    preventive_actions = self._get_preventive_actions(crop, disease_name, risk_assessment)
                    
                    disease_risks.append({
                        'disease': f"{crop}_{disease_name}",
                        'risk_level': risk_assessment['risk_level'],
                        'days_until_expected': risk_assessment['days_until_risk'],
                        'preventive_action': preventive_actions,
                        'confidence': risk_assessment['confidence'],
                        'environmental_triggers': risk_assessment['triggers']
                    })
            
            # Sort by risk level and urgency
            disease_risks.sort(key=lambda x: (
                ['low', 'medium', 'high'].index(x['risk_level']),
                -x['days_until_expected']
            ), reverse=True)
            
            logger.info(f"Identified {len(disease_risks)} disease risks for {crop}")
            return disease_risks
            
        except Exception as e:
            logger.error(f"Error in disease prediction: {e}")
            return self._get_generic_disease_risks(crop, current_weather)
    
    async def _assess_disease_risk(
        self,
        disease_name: str,
        disease_model: Dict,
        current_temp: float,
        current_humidity: float,
        current_rainfall: float,
        forecast_data: List[Dict],
        horizon_days: int
    ) -> Dict[str, Any]:
        """Assess risk for a specific disease based on weather conditions"""
        
        try:
            temp_range = disease_model['temperature_range']
            humidity_threshold = disease_model['humidity_min']
            rainfall_threshold = disease_model['rainfall_threshold']
            critical_days = disease_model['critical_days']
            
            # Check current conditions
            current_risk = 0.0
            triggers = []
            
            # Temperature factor
            if temp_range[0] <= current_temp <= temp_range[1]:
                current_risk += 0.3
                triggers.append(f"Temperature in optimal range ({temp_range[0]}-{temp_range[1]}°C)")
            
            # Humidity factor
            if current_humidity >= humidity_threshold:
                current_risk += 0.3
                triggers.append(f"High humidity (≥{humidity_threshold}%)")
            
            # Rainfall factor
            if current_rainfall >= rainfall_threshold:
                current_risk += 0.2
                triggers.append(f"Sufficient rainfall (≥{rainfall_threshold}mm)")
            
            # Forecast analysis
            favorable_days = 0
            days_until_risk = horizon_days + 1  # Default: beyond forecast period
            
            for i, day_forecast in enumerate(forecast_data[:horizon_days]):
                day_temp = day_forecast.get('temp_avg', current_temp)
                day_humidity = day_forecast.get('humidity_avg', current_humidity)
                day_rainfall = day_forecast.get('rainfall', 0)
                
                day_favorable = 0
                
                if temp_range[0] <= day_temp <= temp_range[1]:
                    day_favorable += 1
                
                if day_humidity >= humidity_threshold:
                    day_favorable += 1
                    
                if day_rainfall >= rainfall_threshold:
                    day_favorable += 1
                
                # If 2 out of 3 conditions are met, consider it favorable for disease
                if day_favorable >= 2:
                    favorable_days += 1
                    if days_until_risk > horizon_days and i < critical_days:
                        days_until_risk = i + 1
            
            # Calculate overall risk
            forecast_risk = min(1.0, favorable_days / critical_days)
            overall_risk = (current_risk + forecast_risk) / 2
            
            # Determine risk level
            if overall_risk >= 0.7:
                risk_level = 'high'
            elif overall_risk >= 0.4:
                risk_level = 'medium' 
            elif overall_risk >= 0.2:
                risk_level = 'low'
            else:
                risk_level = 'negligible'
            
            return {
                'risk_level': risk_level,
                'days_until_risk': min(days_until_risk, horizon_days),
                'confidence': min(1.0, overall_risk + 0.1),
                'triggers': triggers,
                'favorable_days': favorable_days
            }
            
        except Exception as e:
            logger.error(f"Error assessing disease risk for {disease_name}: {e}")
            return {
                'risk_level': 'low',
                'days_until_risk': 7,
                'confidence': 0.3,
                'triggers': ['Assessment error'],
                'favorable_days': 0
            }
    
    def _generate_weather_forecast(self, current_weather: Dict, days: int) -> List[Dict]:
        """Generate synthetic weather forecast when not provided"""
        
        base_temp = current_weather.get('temperature', 25)
        base_humidity = current_weather.get('humidity', 60)
        
        forecast = []
        for i in range(days):
            # Add some variation to weather
            temp_variation = np.random.normal(0, 2)
            humidity_variation = np.random.normal(0, 5)
            rainfall = np.random.exponential(1) if np.random.random() > 0.7 else 0
            
            forecast.append({
                'date': (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d'),
                'temp_avg': base_temp + temp_variation,
                'humidity_avg': max(30, min(95, base_humidity + humidity_variation)),
                'rainfall': rainfall
            })
        
        return forecast
    
    def _get_preventive_actions(
        self, 
        crop: str, 
        disease: str, 
        risk_assessment: Dict
    ) -> str:
        """Get specific preventive actions for disease-crop combination"""
        
        preventive_actions = {
            'rice': {
                'blast': 'Apply Tricyclazole fungicide spray. Remove excess water from fields. Avoid excessive nitrogen fertilization.',
                'brown_spot': 'Ensure balanced nutrition. Apply Propiconazole spray. Maintain proper water management.',
                'bacterial_blight': 'Use copper-based bactericide. Drain flooded fields. Avoid mechanical injury to plants.'
            },
            'wheat': {
                'rust': 'Apply Propiconazole or Tebuconazole spray immediately. Remove alternate hosts. Use resistant varieties.',
                'powdery_mildew': 'Spray Sulfur or Triadimefon. Improve air circulation. Avoid excessive nitrogen.',
                'fusarium_head_blight': 'Apply Carbendazim during flowering. Avoid overhead irrigation during grain filling.'
            },
            'cotton': {
                'wilt': 'Improve drainage. Use bio-agents like Trichoderma. Avoid water stress. Deep summer plowing.',
                'boll_rot': 'Apply Carbendazim spray. Remove infected bolls. Improve plant spacing for air circulation.',
                'bacterial_blight': 'Use copper-based bactericide. Avoid overhead irrigation. Remove plant debris.'
            },
            'tomato': {
                'blight': 'Apply copper-based fungicide immediately. Improve ventilation. Remove infected plant parts.',
                'fusarium_wilt': 'Use bio-fungicides. Improve soil drainage. Avoid root injuries during cultivation.',
                'bacterial_spot': 'Apply copper bactericide. Use drip irrigation. Remove infected leaves immediately.'
            },
            'onion': {
                'purple_blotch': 'Apply Mancozeb spray. Control thrips population. Avoid excessive nitrogen fertilization.',
                'downy_mildew': 'Apply Metalaxyl spray. Improve drainage. Avoid overcrowding of plants.'
            },
            'sugarcane': {
                'red_rot': 'Remove infected canes immediately. Improve drainage. Use resistant varieties. Apply Carbendazim.',
                'smut': 'Remove infected shoots. Apply systemic fungicide. Use disease-free seed material.'
            }
        }
        
        # Get specific action or generic one
        crop_actions = preventive_actions.get(crop.lower(), {})
        specific_action = crop_actions.get(disease.lower())
        
        if specific_action:
            return specific_action
        else:
            # Generic preventive action based on risk level
            risk_level = risk_assessment['risk_level']
            if risk_level == 'high':
                return 'Apply appropriate fungicide/bactericide spray immediately. Monitor crop closely for symptoms.'
            elif risk_level == 'medium':
                return 'Prepare preventive spray solution. Monitor weather conditions. Ensure proper sanitation.'
            else:
                return 'Continue regular monitoring. Maintain good agricultural practices. Be prepared for preventive measures.'
    
    def _get_generic_disease_risks(self, crop: str, current_weather: Dict) -> List[Dict[str, Any]]:
        """Provide generic disease risk assessment when specific models aren't available"""
        
        humidity = current_weather.get('humidity', 60)
        temperature = current_weather.get('temperature', 25)
        rainfall = current_weather.get('rainfall', 0)
        
        # Generic risk assessment based on environmental conditions
        risk_factors = []
        
        if humidity > 85:
            risk_factors.append('Very high humidity favors fungal diseases')
        elif humidity > 70:
            risk_factors.append('High humidity increases disease risk')
        
        if rainfall > 10:
            risk_factors.append('Heavy rainfall creates disease-favorable conditions')
        elif rainfall > 2:
            risk_factors.append('Rainfall may increase disease pressure')
        
        if 20 <= temperature <= 30:
            risk_factors.append('Temperature suitable for most plant diseases')
        
        # Determine generic risk level
        if len(risk_factors) >= 3:
            risk_level = 'high'
            days_until = 3
        elif len(risk_factors) >= 2:
            risk_level = 'medium'
            days_until = 7
        elif len(risk_factors) >= 1:
            risk_level = 'low'
            days_until = 10
        else:
            return []  # No significant risk
        
        generic_actions = {
            'high': f'Monitor {crop} closely for disease symptoms. Apply preventive fungicide spray. Ensure good drainage.',
            'medium': f'Regular monitoring of {crop} recommended. Maintain proper sanitation. Be ready with protective measures.',
            'low': f'Continue routine monitoring of {crop}. Follow standard disease prevention practices.'
        }
        
        return [{
            'disease': f'{crop}_general_disease_risk',
            'risk_level': risk_level,
            'days_until_expected': days_until,
            'preventive_action': generic_actions[risk_level],
            'confidence': 0.6,
            'environmental_triggers': risk_factors
        }]
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if disease prediction service is healthy"""
        try:
            # Test with sample data
            test_weather = {
                'temperature': 28,
                'humidity': 85,
                'rainfall': 5
            }
            
            test_prediction = await self.predict_disease_risk(
                crop='rice',
                district='pune', 
                current_weather=test_weather,
                forecast_horizon_days=7
            )
            
            return {
                "status": "healthy",
                "service": "DiseasePredictionService",
                "supported_crops": list(self.disease_models.keys()),
                "total_disease_models": sum(len(diseases) for diseases in self.disease_models.values()),
                "test_prediction": len(test_prediction) > 0
            }
            
        except Exception as e:
            logger.error(f"Disease service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "DiseasePredictionService"
            }