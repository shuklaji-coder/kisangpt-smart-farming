"""
Machine Learning-based disease prediction service for Kisan GPT
Includes image processing for disease detection from crop/leaf images
"""

import numpy as np
import cv2
from PIL import Image
import io
import base64
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from loguru import logger
import joblib
import os

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

try:
    from app.core.config import settings
except ImportError:
    from app.core.config_local import settings


class DiseaseMLService:
    """ML-based disease prediction and image analysis service"""
    
    def __init__(self):
        self.model_path = settings.MODEL_PATH
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.image_classifier = None
        self.weather_classifier = None
        
        # Disease symptom patterns for image analysis
        self.disease_patterns = self._initialize_disease_patterns()
        
        # Load or create ML models
        self._initialize_ml_models()
        
    def _initialize_disease_patterns(self) -> Dict[str, Dict]:
        """Initialize disease symptom patterns for image analysis"""
        return {
            'blast': {
                'color_ranges': {
                    'brown_spots': [(10, 50, 20), (20, 255, 200)],  # HSV ranges
                    'white_centers': [(0, 0, 180), (180, 30, 255)]
                },
                'shape_features': ['circular', 'elliptical'],
                'texture_features': ['rough_edges', 'concentric_rings']
            },
            'rust': {
                'color_ranges': {
                    'orange_rust': [(5, 100, 100), (25, 255, 255)],
                    'reddish_brown': [(0, 100, 100), (10, 255, 200)]
                },
                'shape_features': ['pustular', 'scattered'],
                'texture_features': ['raised_bumps', 'powder_like']
            },
            'blight': {
                'color_ranges': {
                    'dark_spots': [(0, 0, 0), (180, 255, 100)],
                    'yellowing': [(20, 100, 100), (30, 255, 255)]
                },
                'shape_features': ['irregular', 'large_patches'],
                'texture_features': ['water_soaked', 'necrotic']
            },
            'wilt': {
                'color_ranges': {
                    'yellowing': [(20, 50, 50), (30, 255, 200)],
                    'browning': [(10, 100, 50), (20, 255, 150)]
                },
                'shape_features': ['leaf_drooping', 'stem_discoloration'],
                'texture_features': ['wilted', 'dry_appearance']
            },
            'powdery_mildew': {
                'color_ranges': {
                    'white_powder': [(0, 0, 200), (180, 30, 255)],
                    'gray_patches': [(0, 0, 100), (180, 50, 180)]
                },
                'shape_features': ['powdery_coating', 'circular_patches'],
                'texture_features': ['fuzzy', 'powder_like']
            },
            'bacterial_spot': {
                'color_ranges': {
                    'dark_spots': [(0, 100, 0), (10, 255, 100)],
                    'yellow_halos': [(25, 100, 100), (35, 255, 255)]
                },
                'shape_features': ['small_circular', 'angular'],
                'texture_features': ['water_soaked', 'greasy_appearance']
            }
        }
    
    def _initialize_ml_models(self):
        """Initialize or load ML models"""
        try:
            # Try to load existing models
            if os.path.exists(os.path.join(self.model_path, 'disease_image_classifier.joblib')):
                self.image_classifier = joblib.load(os.path.join(self.model_path, 'disease_image_classifier.joblib'))
                logger.info("Loaded existing disease image classifier")
            
            if os.path.exists(os.path.join(self.model_path, 'disease_weather_classifier.joblib')):
                self.weather_classifier = joblib.load(os.path.join(self.model_path, 'disease_weather_classifier.joblib'))
                logger.info("Loaded existing weather-based disease classifier")
            
            # Create models if they don't exist
            if not self.image_classifier:
                self.image_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
                self._train_image_classifier()
            
            if not self.weather_classifier:
                self.weather_classifier = RandomForestClassifier(n_estimators=150, random_state=42)
                self._train_weather_classifier()
                
        except Exception as e:
            logger.error(f"Error initializing ML models: {e}")
            # Fallback to new models
            self.image_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
            self.weather_classifier = RandomForestClassifier(n_estimators=150, random_state=42)
    
    def _train_image_classifier(self):
        """Train image-based disease classifier with synthetic data"""
        try:
            logger.info("Training image-based disease classifier...")
            
            # Generate synthetic image features for training
            # In production, this would use real image datasets
            diseases = list(self.disease_patterns.keys())
            n_samples = 500
            n_features = 20  # Color, texture, and shape features
            
            # Generate synthetic training data
            X_train = []
            y_train = []
            
            for disease in diseases:
                for _ in range(n_samples // len(diseases)):
                    # Generate synthetic features based on disease patterns
                    features = self._generate_synthetic_image_features(disease)
                    X_train.append(features)
                    y_train.append(disease)
            
            X_train = np.array(X_train)
            y_train = np.array(y_train)
            
            # Train the model
            self.image_classifier.fit(X_train, y_train)
            
            # Save the model
            os.makedirs(self.model_path, exist_ok=True)
            joblib.dump(self.image_classifier, os.path.join(self.model_path, 'disease_image_classifier.joblib'))
            
            logger.info(f"Image classifier trained with {len(X_train)} samples")
            
        except Exception as e:
            logger.error(f"Error training image classifier: {e}")
    
    def _train_weather_classifier(self):
        """Train weather-based disease classifier"""
        try:
            logger.info("Training weather-based disease classifier...")
            
            # Generate synthetic weather-disease training data
            diseases = ['blast', 'rust', 'blight', 'wilt', 'powdery_mildew', 'bacterial_spot']
            n_samples = 1000
            
            X_train = []
            y_train = []
            
            for _ in range(n_samples):
                # Generate synthetic weather features
                temperature = np.random.normal(25, 5)
                humidity = np.random.normal(70, 15)
                rainfall = np.random.exponential(5)
                wind_speed = np.random.normal(10, 3)
                sunshine_hours = np.random.normal(6, 2)
                
                # Select disease based on weather conditions
                if humidity > 85 and temperature < 25:
                    disease = np.random.choice(['blight', 'powdery_mildew'])
                elif temperature > 28 and humidity < 60:
                    disease = np.random.choice(['wilt', 'bacterial_spot'])
                elif rainfall > 10:
                    disease = np.random.choice(['blast', 'rust'])
                else:
                    disease = np.random.choice(diseases)
                
                features = [temperature, humidity, rainfall, wind_speed, sunshine_hours,
                           temperature**2, humidity**2, temperature*humidity, rainfall*humidity]
                
                X_train.append(features)
                y_train.append(disease)
            
            X_train = np.array(X_train)
            y_train = np.array(y_train)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            
            # Train the model
            self.weather_classifier.fit(X_train_scaled, y_train)
            
            # Save the model and scaler
            os.makedirs(self.model_path, exist_ok=True)
            joblib.dump(self.weather_classifier, os.path.join(self.model_path, 'disease_weather_classifier.joblib'))
            joblib.dump(self.scaler, os.path.join(self.model_path, 'disease_scaler.joblib'))
            
            logger.info(f"Weather classifier trained with {len(X_train)} samples")
            
        except Exception as e:
            logger.error(f"Error training weather classifier: {e}")
    
    def _generate_synthetic_image_features(self, disease: str) -> List[float]:
        """Generate synthetic image features based on disease patterns"""
        features = []
        pattern = self.disease_patterns.get(disease, {})
        
        # Color features (8 features)
        color_ranges = pattern.get('color_ranges', {})
        for i in range(4):  # 4 color channels
            if len(color_ranges) > i:
                # Simulate color intensity in range
                features.append(np.random.uniform(0.3, 0.9))
            else:
                features.append(np.random.uniform(0.0, 0.3))
        
        # Add more color statistics
        features.extend([
            np.random.uniform(0.1, 0.9),  # Color variance
            np.random.uniform(0.0, 1.0),  # Color dominance
            np.random.uniform(0.2, 0.8),  # Color contrast
            np.random.uniform(0.1, 0.7)   # Color uniformity
        ])
        
        # Shape features (6 features)
        shape_features = pattern.get('shape_features', [])
        for i in range(3):
            if len(shape_features) > i:
                features.append(np.random.uniform(0.6, 1.0))
            else:
                features.append(np.random.uniform(0.0, 0.4))
        
        features.extend([
            np.random.uniform(0.1, 0.9),  # Shape regularity
            np.random.uniform(0.0, 1.0),  # Shape size distribution
            np.random.uniform(0.2, 0.8)   # Shape density
        ])
        
        # Texture features (6 features)
        texture_features = pattern.get('texture_features', [])
        for i in range(3):
            if len(texture_features) > i:
                features.append(np.random.uniform(0.5, 1.0))
            else:
                features.append(np.random.uniform(0.0, 0.5))
        
        features.extend([
            np.random.uniform(0.1, 0.9),  # Texture roughness
            np.random.uniform(0.0, 1.0),  # Texture pattern strength
            np.random.uniform(0.2, 0.8)   # Texture homogeneity
        ])
        
        return features
    
    async def analyze_disease_image(
        self, 
        image_data: str, 
        crop_type: str = "unknown"
    ) -> Dict[str, Any]:
        """
        Analyze crop/leaf image for disease detection
        
        Args:
            image_data: Base64 encoded image data
            crop_type: Type of crop being analyzed
            
        Returns:
            Disease analysis results with confidence scores
        """
        try:
            logger.info(f"Analyzing disease image for crop: {crop_type}")
            
            # Decode image
            image = self._decode_base64_image(image_data)
            if image is None:
                return {"error": "Invalid image data"}
            
            # Extract image features
            features = await self._extract_image_features(image)
            
            # Predict disease using ML model
            ml_prediction = self._predict_disease_from_features(features)
            
            # Analyze image using computer vision
            cv_analysis = await self._analyze_image_cv(image)
            
            # Combine results
            combined_result = self._combine_predictions(ml_prediction, cv_analysis, crop_type)
            
            return {
                "status": "success",
                "crop_type": crop_type,
                "analysis_timestamp": datetime.now().isoformat(),
                "disease_predictions": combined_result["diseases"],
                "confidence": combined_result["confidence"],
                "recommendations": combined_result["recommendations"],
                "image_quality": cv_analysis["image_quality"]
            }
            
        except Exception as e:
            logger.error(f"Error analyzing disease image: {e}")
            return {
                "status": "error",
                "error": str(e),
                "fallback_recommendation": "Please consult agricultural expert for visual disease diagnosis"
            }
    
    def _decode_base64_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image data to numpy array"""
        try:
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(pil_image)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return None
    
    async def _extract_image_features(self, image: np.ndarray) -> List[float]:
        """Extract features from image for disease classification"""
        try:
            # Resize image for consistent processing
            if image.shape[0] > 512 or image.shape[1] > 512:
                image = cv2.resize(image, (512, 512))
            
            # Convert to different color spaces
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            
            features = []
            
            # Color features
            for channel in range(3):
                # RGB statistics
                features.extend([
                    np.mean(image[:, :, channel]),
                    np.std(image[:, :, channel]),
                    np.percentile(image[:, :, channel], 25),
                    np.percentile(image[:, :, channel], 75)
                ])
                
                # HSV statistics
                features.extend([
                    np.mean(hsv[:, :, channel]),
                    np.std(hsv[:, :, channel])
                ])
            
            # Shape and texture features using edge detection
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            
            features.extend([
                np.sum(edges > 0) / edges.size,  # Edge density
                np.mean(gray),                   # Overall brightness
                np.std(gray)                     # Brightness variation
            ])
            
            # Ensure we have exactly 20 features (matching training data)
            if len(features) > 20:
                features = features[:20]
            elif len(features) < 20:
                features.extend([0.0] * (20 - len(features)))
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting image features: {e}")
            return [0.0] * 20  # Return default features
    
    def _predict_disease_from_features(self, features: List[float]) -> Dict[str, Any]:
        """Predict disease using extracted image features"""
        try:
            if not self.image_classifier:
                return {"disease": "unknown", "confidence": 0.0, "probabilities": {}}
            
            # Predict
            features_array = np.array(features).reshape(1, -1)
            prediction = self.image_classifier.predict(features_array)[0]
            probabilities = self.image_classifier.predict_proba(features_array)[0]
            
            # Get class names
            classes = self.image_classifier.classes_
            prob_dict = dict(zip(classes, probabilities))
            
            # Sort by probability
            sorted_probs = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
            
            return {
                "disease": prediction,
                "confidence": max(probabilities),
                "probabilities": prob_dict,
                "top_predictions": sorted_probs[:3]
            }
            
        except Exception as e:
            logger.error(f"Error predicting disease from features: {e}")
            return {"disease": "unknown", "confidence": 0.0, "probabilities": {}}
    
    async def _analyze_image_cv(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze image using computer vision techniques"""
        try:
            # Image quality assessment
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Calculate image sharpness (using Laplacian variance)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness = "good" if laplacian_var > 100 else "poor"
            
            # Calculate brightness
            brightness = np.mean(gray)
            brightness_level = "good" if 50 < brightness < 200 else "poor"
            
            # Detect potential disease spots using color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Detect brown/yellow spots (common disease symptoms)
            brown_lower = np.array([10, 50, 20])
            brown_upper = np.array([20, 255, 200])
            brown_mask = cv2.inRange(hsv, brown_lower, brown_upper)
            
            yellow_lower = np.array([20, 100, 100])
            yellow_upper = np.array([30, 255, 255])
            yellow_mask = cv2.inRange(hsv, yellow_lower, yellow_upper)
            
            # Calculate spot coverage
            brown_coverage = np.sum(brown_mask > 0) / brown_mask.size
            yellow_coverage = np.sum(yellow_mask > 0) / yellow_mask.size
            total_spot_coverage = brown_coverage + yellow_coverage
            
            # Determine potential disease indicators
            disease_indicators = []
            if brown_coverage > 0.05:
                disease_indicators.append("brown_spots_detected")
            if yellow_coverage > 0.05:
                disease_indicators.append("yellowing_detected")
            if total_spot_coverage > 0.1:
                disease_indicators.append("significant_discoloration")
            
            return {
                "image_quality": {
                    "sharpness": sharpness,
                    "brightness": brightness_level,
                    "resolution": f"{image.shape[1]}x{image.shape[0]}"
                },
                "spot_analysis": {
                    "brown_coverage": brown_coverage,
                    "yellow_coverage": yellow_coverage,
                    "total_coverage": total_spot_coverage
                },
                "disease_indicators": disease_indicators
            }
            
        except Exception as e:
            logger.error(f"Error in CV analysis: {e}")
            return {
                "image_quality": {"sharpness": "unknown", "brightness": "unknown"},
                "spot_analysis": {"brown_coverage": 0, "yellow_coverage": 0, "total_coverage": 0},
                "disease_indicators": []
            }
    
    def _combine_predictions(
        self, 
        ml_prediction: Dict[str, Any], 
        cv_analysis: Dict[str, Any], 
        crop_type: str
    ) -> Dict[str, Any]:
        """Combine ML predictions with CV analysis"""
        
        ml_disease = ml_prediction.get("disease", "unknown")
        ml_confidence = ml_prediction.get("confidence", 0.0)
        
        # Adjust confidence based on CV analysis
        cv_indicators = cv_analysis.get("disease_indicators", [])
        spot_coverage = cv_analysis.get("spot_analysis", {}).get("total_coverage", 0)
        
        # Boost confidence if CV analysis supports the prediction
        if len(cv_indicators) > 0 and ml_disease != "unknown":
            ml_confidence = min(1.0, ml_confidence + 0.1 * len(cv_indicators))
        
        # Reduce confidence for poor image quality
        image_quality = cv_analysis.get("image_quality", {})
        if image_quality.get("sharpness") == "poor" or image_quality.get("brightness") == "poor":
            ml_confidence *= 0.8
        
        # Generate recommendations
        recommendations = self._generate_image_recommendations(ml_disease, ml_confidence, cv_indicators, crop_type)
        
        # Prepare disease predictions
        diseases = []
        if ml_disease != "unknown" and ml_confidence > 0.3:
            diseases.append({
                "disease": f"{crop_type}_{ml_disease}",
                "confidence": ml_confidence,
                "detection_method": "ML + Computer Vision",
                "symptoms_detected": cv_indicators
            })
        
        # Add alternative predictions if available
        for disease, prob in ml_prediction.get("top_predictions", [])[:2]:
            if disease != ml_disease and prob > 0.2:
                diseases.append({
                    "disease": f"{crop_type}_{disease}",
                    "confidence": prob,
                    "detection_method": "ML Analysis",
                    "symptoms_detected": []
                })
        
        return {
            "diseases": diseases,
            "confidence": ml_confidence,
            "recommendations": recommendations
        }
    
    def _generate_image_recommendations(
        self, 
        disease: str, 
        confidence: float, 
        indicators: List[str], 
        crop_type: str
    ) -> List[str]:
        """Generate recommendations based on image analysis"""
        
        recommendations = []
        
        if confidence > 0.7:
            recommendations.append(f"High confidence disease detection. Immediate action recommended.")
            recommendations.append(f"Apply appropriate fungicide/bactericide treatment for {disease}.")
            recommendations.append("Isolate affected plants to prevent spread.")
        elif confidence > 0.4:
            recommendations.append("Moderate confidence detection. Monitor closely and consider preventive treatment.")
            recommendations.append("Improve air circulation and reduce humidity around plants.")
        else:
            recommendations.append("Low confidence detection. Continue monitoring and maintain good plant hygiene.")
        
        # Specific recommendations based on indicators
        if "brown_spots_detected" in indicators:
            recommendations.append("Brown spots detected - check for fungal diseases like blight or rust.")
        if "yellowing_detected" in indicators:
            recommendations.append("Yellowing detected - could indicate nutrient deficiency or disease stress.")
        if "significant_discoloration" in indicators:
            recommendations.append("Significant discoloration found - consider soil and water management.")
        
        # Add general recommendations
        recommendations.extend([
            "Ensure proper drainage and avoid overwatering.",
            "Remove and dispose of infected plant material properly.",
            "Consider consulting with local agricultural extension services."
        ])
        
        return recommendations
    
    async def predict_weather_disease_risk(
        self,
        weather_data: Dict[str, float],
        crop_type: str = "general"
    ) -> Dict[str, Any]:
        """Predict disease risk based on weather conditions using ML"""
        try:
            if not self.weather_classifier:
                return {"error": "Weather classifier not available"}
            
            # Extract weather features
            features = [
                weather_data.get('temperature', 25),
                weather_data.get('humidity', 60),
                weather_data.get('rainfall', 0),
                weather_data.get('wind_speed', 10),
                weather_data.get('sunshine_hours', 6)
            ]
            
            # Add polynomial features
            temp = features[0]
            humidity = features[1]
            features.extend([
                temp**2,
                humidity**2,
                temp * humidity,
                features[2] * humidity  # rainfall * humidity
            ])
            
            # Scale features
            features_array = np.array(features).reshape(1, -1)
            features_scaled = self.scaler.transform(features_array)
            
            # Predict
            prediction = self.weather_classifier.predict(features_scaled)[0]
            probabilities = self.weather_classifier.predict_proba(features_scaled)[0]
            
            # Get class names and probabilities
            classes = self.weather_classifier.classes_
            prob_dict = dict(zip(classes, probabilities))
            
            # Sort by probability
            sorted_probs = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
            
            return {
                "status": "success",
                "predicted_disease": prediction,
                "confidence": max(probabilities),
                "all_probabilities": prob_dict,
                "top_risks": sorted_probs[:3],
                "weather_conditions": weather_data,
                "crop_type": crop_type
            }
            
        except Exception as e:
            logger.error(f"Error predicting weather-based disease risk: {e}")
            return {"error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for ML disease service"""
        try:
            # Test image classifier
            test_features = [0.5] * 20
            if self.image_classifier:
                test_pred = self.image_classifier.predict([test_features])
                image_classifier_status = "healthy"
            else:
                image_classifier_status = "not_loaded"
            
            # Test weather classifier
            test_weather_features = [25, 70, 5, 10, 6, 625, 4900, 1750, 350]
            if self.weather_classifier:
                test_weather_pred = self.weather_classifier.predict([test_weather_features])
                weather_classifier_status = "healthy"
            else:
                weather_classifier_status = "not_loaded"
            
            return {
                "status": "healthy",
                "service": "DiseaseMLService",
                "image_classifier": image_classifier_status,
                "weather_classifier": weather_classifier_status,
                "supported_diseases": list(self.disease_patterns.keys()),
                "models_path": self.model_path
            }
            
        except Exception as e:
            logger.error(f"ML disease service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "DiseaseMLService"
            }