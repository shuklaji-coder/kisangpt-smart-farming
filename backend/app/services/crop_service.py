"""
Crop recommendation service for Kisan GPT
Uses ML models to recommend crops based on soil, weather, and historical data
"""

import os
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, mean_absolute_error
import joblib
from loguru import logger

from app.core.config import settings, CROP_SEASONS, DISTRICT_SOIL_MAPPING


class CropRecommendationService:
    """Service for ML-based crop recommendations"""
    
    def __init__(self):
        self.model_path = settings.MODEL_PATH
        self.crop_classifier = None
        self.yield_predictor = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Ensure model directory exists
        os.makedirs(self.model_path, exist_ok=True)
        
        # Try to load pre-trained models
        self._load_models()
        
        # If no models exist, train on sample data
        if not self.is_trained:
            self._train_models()
    
    def _load_models(self):
        """Load pre-trained models from disk"""
        try:
            classifier_path = os.path.join(self.model_path, 'crop_classifier.joblib')
            predictor_path = os.path.join(self.model_path, 'yield_predictor.joblib')
            encoders_path = os.path.join(self.model_path, 'label_encoders.joblib')
            scaler_path = os.path.join(self.model_path, 'feature_scaler.joblib')
            
            if all(os.path.exists(p) for p in [classifier_path, predictor_path, encoders_path, scaler_path]):
                self.crop_classifier = joblib.load(classifier_path)
                self.yield_predictor = joblib.load(predictor_path)
                self.label_encoders = joblib.load(encoders_path)
                self.scaler = joblib.load(scaler_path)
                self.is_trained = True
                logger.info("Pre-trained crop recommendation models loaded successfully")
            else:
                logger.info("No pre-trained models found, will train new models")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self.is_trained = False
    
    def _save_models(self):
        """Save trained models to disk"""
        try:
            joblib.dump(self.crop_classifier, os.path.join(self.model_path, 'crop_classifier.joblib'))
            joblib.dump(self.yield_predictor, os.path.join(self.model_path, 'yield_predictor.joblib'))
            joblib.dump(self.label_encoders, os.path.join(self.model_path, 'label_encoders.joblib'))
            joblib.dump(self.scaler, os.path.join(self.model_path, 'feature_scaler.joblib'))
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def _train_models(self):
        """Train crop recommendation models on historical data"""
        try:
            logger.info("Training crop recommendation models...")
            
            # Load historical yield data
            data_path = os.path.join(os.path.dirname(settings.MODEL_PATH), 'data', 'raw', 'historical_yields.csv')
            
            if not os.path.exists(data_path):
                logger.warning(f"Historical data not found at {data_path}, creating synthetic data")
                df = self._create_synthetic_data()
            else:
                df = pd.read_csv(data_path)
                logger.info(f"Loaded {len(df)} historical records")
            
            # Prepare features and targets
            X, y_crop, y_yield = self._prepare_features(df)
            
            # Train crop classification model
            self.crop_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
            self.crop_classifier.fit(X, y_crop)
            
            # Train yield prediction model
            self.yield_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
            self.yield_predictor.fit(X, y_yield)
            
            # Evaluate models
            crop_accuracy = cross_val_score(self.crop_classifier, X, y_crop, cv=5).mean()
            yield_mae = cross_val_score(self.yield_predictor, X, y_yield, cv=5, scoring='neg_mean_absolute_error').mean()
            
            logger.info(f"Crop classification accuracy: {crop_accuracy:.3f}")
            logger.info(f"Yield prediction MAE: {abs(yield_mae):.3f}")
            
            self.is_trained = True
            self._save_models()
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            self.is_trained = False
    
    def _create_synthetic_data(self) -> pd.DataFrame:
        """Create synthetic training data when historical data is not available"""
        logger.info("Creating synthetic training data")
        
        np.random.seed(42)
        n_samples = 1000
        
        districts = list(DISTRICT_SOIL_MAPPING.keys())
        crops = ['rice', 'wheat', 'cotton', 'sugarcane', 'onion', 'soybean', 'maize', 'groundnut']
        seasons = ['kharif', 'rabi', 'zaid']
        
        data = []
        for _ in range(n_samples):
            district = np.random.choice(districts)
            crop = np.random.choice(crops)
            season = np.random.choice(seasons)
            
            # Generate realistic weather and yield data
            if season == 'kharif':
                rainfall = np.random.normal(900, 200)
                temp_avg = np.random.normal(26, 2)
            elif season == 'rabi':
                rainfall = np.random.normal(300, 100)
                temp_avg = np.random.normal(22, 2)
            else:  # zaid
                rainfall = np.random.normal(400, 150)
                temp_avg = np.random.normal(28, 2)
            
            # Generate yield based on crop type and conditions
            base_yields = {'rice': 3.5, 'wheat': 3.0, 'cotton': 1.5, 'sugarcane': 70.0, 
                          'onion': 20.0, 'soybean': 1.8, 'maize': 5.0, 'groundnut': 2.0}
            base_yield = base_yields.get(crop, 2.0)
            yield_per_hectare = max(0.1, np.random.normal(base_yield, base_yield * 0.3))
            
            data.append({
                'district': district,
                'crop': crop,
                'year': np.random.randint(2020, 2024),
                'yield_per_hectare': yield_per_hectare,
                'area_hectares': np.random.randint(1000, 50000),
                'soil_type': DISTRICT_SOIL_MAPPING[district]['soil_type'],
                'rainfall_mm': max(50, rainfall),
                'temp_avg_celsius': temp_avg,
                'season': season
            })
        
        return pd.DataFrame(data)
    
    def _prepare_features(self, df: pd.DataFrame) -> tuple:
        """Prepare features for ML models"""
        # Create label encoders for categorical features
        categorical_features = ['district', 'soil_type', 'season']
        
        for feature in categorical_features:
            if feature not in self.label_encoders:
                self.label_encoders[feature] = LabelEncoder()
                self.label_encoders[feature].fit(df[feature].astype(str))
        
        # Prepare features
        features = []
        for _, row in df.iterrows():
            feature_vector = [
                self.label_encoders['district'].transform([str(row['district'])])[0],
                self.label_encoders['soil_type'].transform([str(row['soil_type'])])[0],
                self.label_encoders['season'].transform([str(row['season'])])[0],
                row['rainfall_mm'],
                row['temp_avg_celsius'],
                row['year'] - 2020,  # Normalize year
                self._get_month_from_season(row['season'])
            ]
            features.append(feature_vector)
        
        X = np.array(features)
        
        # Scale numerical features
        X = self.scaler.fit_transform(X)
        
        # Prepare targets
        y_crop = df['crop'].values
        y_yield = df['yield_per_hectare'].values
        
        return X, y_crop, y_yield
    
    def _get_month_from_season(self, season: str) -> int:
        """Get representative month from season"""
        season_months = {
            'kharif': 7,   # July
            'rabi': 12,    # December
            'zaid': 4      # April
        }
        return season_months.get(season, 7)
    
    def _determine_season(self, month: int = None) -> str:
        """Determine season from month or use current month"""
        if month is None:
            month = datetime.now().month
        
        if month in [6, 7, 8, 9, 10]:
            return 'kharif'
        elif month in [11, 12, 1, 2, 3]:
            return 'rabi'
        else:
            return 'zaid'
    
    async def recommend_crops(
        self,
        district: str,
        soil_type: str,
        season: Optional[str] = None,
        weather_data: Optional[Dict] = None,
        year: int = None
    ) -> List[Dict[str, Any]]:
        """
        Recommend top crops for given conditions
        
        Args:
            district: District name
            soil_type: Soil type
            season: Growing season (optional, will be determined from current month)
            weather_data: Weather information (optional)
            year: Year for prediction (optional, uses current year)
            
        Returns:
            List of crop recommendations with probabilities
        """
        try:
            if not self.is_trained:
                logger.error("Models not trained")
                return self._get_fallback_recommendations(district, soil_type, season)
            
            # Prepare input features
            if season is None:
                season = self._determine_season()
            
            if year is None:
                year = datetime.now().year
            
            # Extract weather features
            rainfall = 800  # Default
            temp_avg = 25   # Default
            
            if weather_data:
                rainfall = weather_data.get('rainfall', rainfall)
                temp_avg = weather_data.get('temperature', temp_avg)
                
                # If forecast available, use average
                if 'forecast' in weather_data:
                    forecast = weather_data['forecast']
                    if forecast:
                        avg_temp = np.mean([day.get('temp_avg', 25) for day in forecast])
                        total_rainfall = sum([day.get('rainfall', 0) for day in forecast])
                        temp_avg = avg_temp
                        rainfall += total_rainfall  # Add to seasonal rainfall
            
            # Prepare feature vector
            try:
                district_encoded = self.label_encoders['district'].transform([district])[0]
            except (KeyError, ValueError):
                logger.warning(f"Unknown district: {district}, using default")
                district_encoded = 0
            
            try:
                soil_encoded = self.label_encoders['soil_type'].transform([soil_type])[0]
            except (KeyError, ValueError):
                logger.warning(f"Unknown soil type: {soil_type}, using default")
                soil_encoded = 0
            
            try:
                season_encoded = self.label_encoders['season'].transform([season])[0]
            except (KeyError, ValueError):
                logger.warning(f"Unknown season: {season}, using kharif")
                season_encoded = self.label_encoders['season'].transform(['kharif'])[0]
            
            feature_vector = np.array([[
                district_encoded,
                soil_encoded,
                season_encoded,
                rainfall,
                temp_avg,
                year - 2020,
                self._get_month_from_season(season)
            ]])
            
            # Scale features
            feature_vector = self.scaler.transform(feature_vector)
            
            # Get crop probabilities
            crop_probs = self.crop_classifier.predict_proba(feature_vector)[0]
            crop_classes = self.crop_classifier.classes_
            
            # Get top 3 recommendations
            top_indices = np.argsort(crop_probs)[-3:][::-1]
            
            recommendations = []
            for idx in top_indices:
                crop = crop_classes[idx]
                probability = crop_probs[idx]
                
                # Predict yield for this crop
                predicted_yield = self.yield_predictor.predict(feature_vector)[0]
                
                # Generate reasoning
                reason = self._generate_crop_reasoning(
                    crop, district, soil_type, season, 
                    weather_data, probability
                )
                
                # Get recommended practices
                practices = self._get_recommended_practices(crop, season, soil_type)
                
                recommendations.append({
                    'crop': crop,
                    'success_probability': float(probability),
                    'predicted_yield': float(max(0.1, predicted_yield)),
                    'reason': reason,
                    'recommended_practices': practices
                })
            
            logger.info(f"Generated {len(recommendations)} crop recommendations for {district}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in crop recommendation: {e}")
            return self._get_fallback_recommendations(district, soil_type, season)
    
    def _generate_crop_reasoning(
        self, 
        crop: str, 
        district: str, 
        soil_type: str, 
        season: str,
        weather_data: Optional[Dict],
        probability: float
    ) -> str:
        """Generate human-readable reasoning for crop recommendation"""
        
        # Base reasoning templates
        soil_suitability = {
            'red_soil': {
                'rice': 'Red soil with good drainage suits rice cultivation',
                'cotton': 'Red soil is excellent for cotton with proper irrigation',
                'groundnut': 'Red soil provides ideal conditions for groundnut',
                'maize': 'Red soil with organic matter supports good maize yield'
            },
            'black_soil': {
                'cotton': 'Black cotton soil is perfect for high cotton yields',
                'wheat': 'Black soil retains moisture well for wheat cultivation',
                'gram': 'Black soil provides excellent nutrition for gram crops',
                'sorghum': 'Black soil suits drought-resistant crops like sorghum'
            },
            'alluvial': {
                'rice': 'Alluvial soil with high fertility is ideal for rice',
                'wheat': 'Alluvial soil provides excellent nutrition for wheat',
                'sugarcane': 'Rich alluvial soil supports high sugarcane yields'
            }
        }
        
        season_suitability = {
            'kharif': 'monsoon season with adequate rainfall',
            'rabi': 'post-monsoon season with residual moisture',
            'zaid': 'summer season requiring irrigation'
        }
        
        # Build reasoning
        reasoning_parts = []
        
        # Soil suitability
        if soil_type in soil_suitability and crop in soil_suitability[soil_type]:
            reasoning_parts.append(soil_suitability[soil_type][crop])
        
        # Season suitability
        if season in season_suitability:
            reasoning_parts.append(f"Suitable for {season_suitability[season]}")
        
        # Weather conditions
        if weather_data:
            temp = weather_data.get('temperature', 25)
            if 20 <= temp <= 30:
                reasoning_parts.append("optimal temperature range")
            
            if weather_data.get('rainfall', 0) > 0:
                reasoning_parts.append("good rainfall expected")
        
        # Probability-based confidence
        if probability > 0.7:
            confidence = "High success probability"
        elif probability > 0.5:
            confidence = "Good success probability"
        else:
            confidence = "Moderate success probability"
        
        # Combine reasoning
        if reasoning_parts:
            main_reason = ", ".join(reasoning_parts[:2])  # Take first 2 reasons
            return f"{confidence} - {main_reason} in {district} district"
        else:
            return f"{confidence} based on historical data for {district} district"
    
    def _get_recommended_practices(self, crop: str, season: str, soil_type: str) -> List[str]:
        """Get recommended agricultural practices for crop"""
        
        practices = {
            'rice': [
                'Use certified seeds for better yield',
                'Maintain 2-3 cm water level in fields',
                'Apply organic manure before sowing',
                'Monitor for blast disease'
            ],
            'wheat': [
                'Sow at optimal time for your zone',
                'Use balanced NPK fertilizer',
                'Ensure proper drainage to avoid waterlogging',
                'Monitor for rust diseases'
            ],
            'cotton': [
                'Use BT cotton varieties',
                'Maintain proper plant spacing',
                'Regular monitoring for bollworm',
                'Adequate irrigation during flowering'
            ],
            'sugarcane': [
                'Select disease-free seed cane',
                'Apply organic matter for soil health',
                'Ensure adequate water supply',
                'Monitor for red rot disease'
            ],
            'onion': [
                'Use well-drained raised beds',
                'Apply balanced fertilization',
                'Proper curing after harvest',
                'Monitor for purple blotch disease'
            ],
            'maize': [
                'Use hybrid seeds for better yield',
                'Maintain optimal plant population',
                'Apply nitrogen in split doses',
                'Monitor for fall armyworm'
            ]
        }
        
        # Get specific practices for the crop
        crop_practices = practices.get(crop, [
            'Use quality seeds from certified sources',
            'Follow recommended fertilization schedule',
            'Ensure proper irrigation management',
            'Regular pest and disease monitoring'
        ])
        
        return crop_practices[:4]  # Return top 4 practices
    
    def _get_fallback_recommendations(self, district: str, soil_type: str, season: str) -> List[Dict[str, Any]]:
        """Provide fallback recommendations when ML models fail"""
        
        # Season-based fallback crops
        season_crops = {
            'kharif': ['rice', 'cotton', 'maize'],
            'rabi': ['wheat', 'gram', 'onion'],
            'zaid': ['maize', 'groundnut', 'vegetables']
        }
        
        # Soil-based preferences
        soil_preferences = {
            'red_soil': ['cotton', 'groundnut', 'maize'],
            'black_soil': ['cotton', 'wheat', 'gram'],
            'alluvial': ['rice', 'wheat', 'sugarcane'],
            'laterite': ['coconut', 'cashew', 'spices'],
            'coastal_alluvium': ['rice', 'coconut', 'vegetables']
        }
        
        # Get preferred crops
        preferred_crops = season_crops.get(season, ['rice', 'wheat', 'cotton'])
        soil_crops = soil_preferences.get(soil_type, preferred_crops)
        
        # Combine and get top 3
        recommended_crops = list(set(preferred_crops + soil_crops))[:3]
        
        fallback_recommendations = []
        for i, crop in enumerate(recommended_crops):
            fallback_recommendations.append({
                'crop': crop,
                'success_probability': 0.7 - (i * 0.1),  # Decreasing probability
                'predicted_yield': 2.5,  # Default yield
                'reason': f"Recommended based on {season} season and {soil_type} soil in {district}",
                'recommended_practices': self._get_recommended_practices(crop, season, soil_type)
            })
        
        logger.info(f"Using fallback recommendations for {district}")
        return fallback_recommendations
    
    async def retrain_model(self, new_data_path: str) -> Dict[str, Any]:
        """Retrain models with new data"""
        try:
            logger.info(f"Retraining models with data from {new_data_path}")
            
            if not os.path.exists(new_data_path):
                raise FileNotFoundError(f"Data file not found: {new_data_path}")
            
            df = pd.read_csv(new_data_path)
            X, y_crop, y_yield = self._prepare_features(df)
            
            # Retrain models
            self.crop_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
            self.crop_classifier.fit(X, y_crop)
            
            self.yield_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
            self.yield_predictor.fit(X, y_yield)
            
            # Evaluate
            crop_accuracy = cross_val_score(self.crop_classifier, X, y_crop, cv=5).mean()
            yield_mae = cross_val_score(self.yield_predictor, X, y_yield, cv=5, scoring='neg_mean_absolute_error').mean()
            
            self.is_trained = True
            self._save_models()
            
            return {
                'status': 'success',
                'crop_accuracy': float(crop_accuracy),
                'yield_mae': float(abs(yield_mae)),
                'training_samples': len(df),
                'model_version': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error retraining models: {e}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if crop recommendation service is healthy"""
        try:
            status = "healthy" if self.is_trained else "warning"
            
            # Test prediction with sample data
            test_result = None
            if self.is_trained:
                try:
                    test_crops = await self.recommend_crops(
                        district='pune',
                        soil_type='red_soil',
                        season='kharif'
                    )
                    test_result = len(test_crops) > 0
                except Exception:
                    test_result = False
                    status = "unhealthy"
            
            return {
                "status": status,
                "service": "CropRecommendationService",
                "models_trained": self.is_trained,
                "available_encoders": list(self.label_encoders.keys()),
                "test_prediction": test_result
            }
            
        except Exception as e:
            logger.error(f"Crop service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "CropRecommendationService"
            }