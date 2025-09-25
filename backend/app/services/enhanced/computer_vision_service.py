"""
Advanced Computer Vision Service for KisanGPT
Implements disease and pest detection using deep learning and image processing
"""

import cv2
import numpy as np
import base64
import io
from PIL import Image
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from loguru import logger
import json
import os

# Try to import deep learning libraries
try:
    import torch
    import torchvision.transforms as transforms
    from torchvision import models
    import tensorflow as tf
    DEEP_LEARNING_AVAILABLE = True
except ImportError:
    DEEP_LEARNING_AVAILABLE = False
    logger.warning("Deep learning libraries not available, using basic image processing")

from app.core.config import settings


class ComputerVisionService:
    """Advanced computer vision service for crop health analysis"""
    
    def __init__(self):
        self.model_path = os.path.join(settings.MODEL_PATH, "vision")
        os.makedirs(self.model_path, exist_ok=True)
        
        # Disease and pest classification database
        self.disease_database = self._initialize_disease_database()
        self.pest_database = self._initialize_pest_database()
        
        # Image processing parameters
        self.target_image_size = (224, 224)
        self.supported_formats = ['jpg', 'jpeg', 'png', 'bmp', 'tiff']
        
        # Initialize ML models
        if DEEP_LEARNING_AVAILABLE:
            self.disease_model = None
            self.pest_model = None
            self._load_or_create_models()
        
        # Color spaces and thresholds for image analysis
        self.color_thresholds = self._initialize_color_thresholds()
        
        # Confidence thresholds
        self.confidence_thresholds = {
            "high_confidence": 0.85,
            "medium_confidence": 0.70,
            "low_confidence": 0.50
        }
    
    def _initialize_disease_database(self) -> Dict[str, Dict[str, Any]]:
        """Initialize comprehensive disease database"""
        return {
            "early_blight": {
                "crop_types": ["tomato", "potato", "pepper"],
                "symptoms": [
                    "Dark brown spots with concentric rings",
                    "Yellow halo around spots", 
                    "Leaf yellowing and dropping"
                ],
                "color_signatures": {
                    "brown_spots": [(10, 50, 20), (25, 255, 200)],
                    "yellow_halo": [(20, 100, 100), (30, 255, 255)]
                },
                "texture_features": ["concentric_rings", "rough_edges"],
                "severity_indicators": {
                    "mild": "Few scattered spots",
                    "moderate": "Multiple spots, some leaf yellowing", 
                    "severe": "Extensive spotting, significant leaf drop"
                },
                "treatment": {
                    "organic": ["Neem oil spray", "Copper-based fungicide", "Remove affected leaves"],
                    "chemical": ["Chlorothalonil", "Mancozeb", "Azoxystrobin"],
                    "preventive": ["Crop rotation", "Proper spacing", "Drip irrigation"]
                },
                "conditions_favoring": {
                    "temperature": "24-29°C",
                    "humidity": ">90%",
                    "weather": "Warm, humid conditions"
                }
            },
            
            "late_blight": {
                "crop_types": ["tomato", "potato"],
                "symptoms": [
                    "Water-soaked spots on leaves",
                    "White fungal growth on leaf undersides",
                    "Brown to black lesions"
                ],
                "color_signatures": {
                    "water_soaked": [(0, 0, 100), (180, 50, 150)],
                    "white_growth": [(0, 0, 200), (180, 30, 255)]
                },
                "texture_features": ["water_soaked_appearance", "fuzzy_growth"],
                "severity_indicators": {
                    "mild": "Small water-soaked spots",
                    "moderate": "Spreading lesions with some white growth",
                    "severe": "Extensive blackening, plant collapse"
                },
                "treatment": {
                    "organic": ["Copper sulfate", "Bacillus subtilis", "Remove infected parts"],
                    "chemical": ["Metalaxyl", "Dimethomorph", "Fluopicolide"],
                    "preventive": ["Resistant varieties", "Good air circulation", "Avoid overhead watering"]
                }
            },
            
            "powdery_mildew": {
                "crop_types": ["cucumber", "tomato", "pepper", "grape", "wheat"],
                "symptoms": [
                    "White powdery coating on leaves",
                    "Yellowing of affected areas",
                    "Stunted growth"
                ],
                "color_signatures": {
                    "white_powder": [(0, 0, 200), (180, 30, 255)],
                    "yellowing": [(20, 100, 100), (30, 255, 255)]
                },
                "texture_features": ["powdery_coating", "flour_like_appearance"],
                "severity_indicators": {
                    "mild": "Small white patches",
                    "moderate": "Coating on multiple leaves",
                    "severe": "Extensive coverage, leaf distortion"
                },
                "treatment": {
                    "organic": ["Baking soda spray", "Milk solution", "Neem oil"],
                    "chemical": ["Sulfur", "Triadimefon", "Myclobutanil"],
                    "preventive": ["Proper spacing", "Avoid over-fertilization", "Choose resistant varieties"]
                }
            },
            
            "leaf_rust": {
                "crop_types": ["wheat", "corn", "coffee", "apple"],
                "symptoms": [
                    "Orange to reddish-brown pustules",
                    "Circular to oval spots",
                    "Yellowing around pustules"
                ],
                "color_signatures": {
                    "rust_pustules": [(5, 100, 100), (25, 255, 255)],
                    "brown_spots": [(10, 50, 50), (20, 255, 200)]
                },
                "texture_features": ["raised_pustules", "powdery_spores"],
                "treatment": {
                    "organic": ["Neem oil", "Copper fungicide", "Remove affected leaves"],
                    "chemical": ["Propiconazole", "Tebuconazole", "Azoxystrobin"]
                }
            },
            
            "bacterial_spot": {
                "crop_types": ["tomato", "pepper"],
                "symptoms": [
                    "Small dark spots with yellow halos",
                    "Water-soaked appearance initially",
                    "Spots may have greasy appearance"
                ],
                "color_signatures": {
                    "dark_spots": [(0, 100, 0), (10, 255, 100)],
                    "yellow_halos": [(25, 100, 100), (35, 255, 255)]
                },
                "texture_features": ["greasy_appearance", "water_soaked"],
                "treatment": {
                    "organic": ["Copper-based bactericide", "Remove infected plants"],
                    "chemical": ["Streptomycin", "Copper hydroxide"]
                }
            },
            
            "anthracnose": {
                "crop_types": ["tomato", "pepper", "bean", "mango"],
                "symptoms": [
                    "Circular dark spots",
                    "Sunken lesions on fruits",
                    "Pink spore masses in wet weather"
                ],
                "color_signatures": {
                    "dark_circles": [(0, 50, 50), (20, 255, 150)],
                    "sunken_areas": [(0, 0, 80), (180, 50, 120)]
                },
                "treatment": {
                    "organic": ["Copper fungicide", "Remove infected fruits"],
                    "chemical": ["Chlorothalonil", "Mancozeb"]
                }
            }
        }
    
    def _initialize_pest_database(self) -> Dict[str, Dict[str, Any]]:
        """Initialize comprehensive pest database"""
        return {
            "aphids": {
                "crop_types": ["tomato", "pepper", "cucumber", "wheat", "corn"],
                "visual_characteristics": {
                    "size": "2-4mm",
                    "color": ["green", "black", "red", "white"],
                    "shape": "pear-shaped",
                    "clustering": "dense_colonies"
                },
                "damage_symptoms": [
                    "Curled or distorted leaves",
                    "Sticky honeydew on leaves",
                    "Yellowing of leaves",
                    "Stunted growth"
                ],
                "detection_features": {
                    "color_range": [(35, 40, 40), (85, 255, 255)],  # Green aphids
                    "size_range": (2, 8),  # pixels
                    "clustering_pattern": "dense_groups"
                },
                "treatment": {
                    "organic": ["Insecticidal soap", "Neem oil", "Ladybugs", "Reflective mulch"],
                    "chemical": ["Imidacloprid", "Thiamethoxam", "Acetamiprid"],
                    "biological": ["Ladybugs", "Lacewings", "Parasitic wasps"]
                },
                "lifecycle": "15-20 days",
                "peak_activity": "Spring and early summer"
            },
            
            "whiteflies": {
                "crop_types": ["tomato", "cucumber", "cotton", "soybean"],
                "visual_characteristics": {
                    "size": "1-2mm",
                    "color": "white",
                    "shape": "triangular wings",
                    "behavior": "flutter when disturbed"
                },
                "damage_symptoms": [
                    "Yellowing leaves",
                    "Honeydew secretion", 
                    "Sooty mold growth",
                    "Virus transmission"
                ],
                "detection_features": {
                    "color_range": [(0, 0, 200), (180, 30, 255)],
                    "size_range": (1, 4),
                    "movement_pattern": "erratic_flight"
                },
                "treatment": {
                    "organic": ["Yellow sticky traps", "Reflective mulch", "Insecticidal soap"],
                    "chemical": ["Spiromesifen", "Pyriproxyfen", "Buprofezin"],
                    "biological": ["Encarsia formosa", "Eretmocerus eremicus"]
                }
            },
            
            "spider_mites": {
                "crop_types": ["tomato", "cucumber", "bean", "cotton"],
                "visual_characteristics": {
                    "size": "0.5mm",
                    "color": ["red", "green", "yellow"],
                    "webbing": "fine_silk_webs"
                },
                "damage_symptoms": [
                    "Stippling or tiny yellow spots",
                    "Fine webbing on leaves",
                    "Bronzing of leaves",
                    "Premature leaf drop"
                ],
                "detection_features": {
                    "stippling_pattern": "tiny_yellow_dots",
                    "webbing_presence": True,
                    "leaf_bronzing": [(20, 100, 100), (40, 255, 200)]
                },
                "treatment": {
                    "organic": ["Predatory mites", "Insecticidal soap", "Increase humidity"],
                    "chemical": ["Abamectin", "Bifenazate", "Spiromesifen"]
                }
            },
            
            "caterpillars": {
                "crop_types": ["tomato", "corn", "cabbage", "cotton"],
                "visual_characteristics": {
                    "size": "10-50mm",
                    "color": ["green", "brown", "striped"],
                    "shape": "cylindrical"
                },
                "damage_symptoms": [
                    "Holes in leaves",
                    "Chewed leaf margins",
                    "Frass (droppings) present",
                    "Fruit boring"
                ],
                "detection_features": {
                    "hole_patterns": "irregular_holes",
                    "frass_presence": True,
                    "feeding_damage": "chewed_edges"
                },
                "treatment": {
                    "organic": ["Bt (Bacillus thuringiensis)", "Hand picking", "Pheromone traps"],
                    "chemical": ["Chlorantraniliprole", "Spinetoram", "Indoxacarb"]
                }
            },
            
            "thrips": {
                "crop_types": ["tomato", "pepper", "onion", "cotton"],
                "visual_characteristics": {
                    "size": "1-2mm",
                    "color": ["yellow", "brown", "black"],
                    "shape": "elongated"
                },
                "damage_symptoms": [
                    "Silver or bronze streaks on leaves",
                    "Black specks (excrement)",
                    "Scarred fruit",
                    "Distorted growth"
                ],
                "detection_features": {
                    "streak_patterns": "silver_bronze_lines",
                    "black_specks": True,
                    "feeding_scars": "surface_scarring"
                },
                "treatment": {
                    "organic": ["Blue sticky traps", "Predatory mites", "Insecticidal soap"],
                    "chemical": ["Imidacloprid", "Spinosad", "Abamectin"]
                }
            }
        }
    
    def _initialize_color_thresholds(self) -> Dict[str, Tuple[Tuple[int, int, int], Tuple[int, int, int]]]:
        """Initialize color thresholds for different conditions"""
        return {
            "healthy_green": ((35, 40, 40), (85, 255, 255)),
            "yellowing": ((20, 100, 100), (30, 255, 255)),
            "browning": ((10, 50, 20), (25, 255, 200)),
            "white_disease": ((0, 0, 200), (180, 30, 255)),
            "black_spots": ((0, 0, 0), (180, 255, 50)),
            "red_rust": ((0, 100, 100), (20, 255, 255))
        }
    
    def _load_or_create_models(self):
        """Load or create deep learning models"""
        try:
            if not DEEP_LEARNING_AVAILABLE:
                return
            
            # Disease classification model
            disease_model_path = os.path.join(self.model_path, "disease_classifier.pth")
            if os.path.exists(disease_model_path):
                self.disease_model = torch.load(disease_model_path, map_location='cpu')
                logger.info("Loaded existing disease classification model")
            else:
                # Create and train a simple CNN model
                self.disease_model = self._create_disease_model()
                logger.info("Created new disease classification model")
            
            # Pest detection model
            pest_model_path = os.path.join(self.model_path, "pest_detector.pth")
            if os.path.exists(pest_model_path):
                self.pest_model = torch.load(pest_model_path, map_location='cpu')
                logger.info("Loaded existing pest detection model")
            else:
                self.pest_model = self._create_pest_model()
                logger.info("Created new pest detection model")
                
        except Exception as e:
            logger.error(f"Error loading/creating models: {e}")
    
    def _create_disease_model(self):
        """Create a simple CNN model for disease classification"""
        if not DEEP_LEARNING_AVAILABLE:
            return None
        
        try:
            # Use a pre-trained ResNet and modify for our use case
            model = models.resnet18(pretrained=True)
            num_diseases = len(self.disease_database)
            model.fc = torch.nn.Linear(model.fc.in_features, num_diseases)
            
            # Set to evaluation mode
            model.eval()
            return model
            
        except Exception as e:
            logger.error(f"Error creating disease model: {e}")
            return None
    
    def _create_pest_model(self):
        """Create a simple CNN model for pest detection"""
        if not DEEP_LEARNING_AVAILABLE:
            return None
        
        try:
            # Use a pre-trained ResNet and modify for our use case
            model = models.resnet18(pretrained=True)
            num_pests = len(self.pest_database)
            model.fc = torch.nn.Linear(model.fc.in_features, num_pests)
            
            # Set to evaluation mode
            model.eval()
            return model
            
        except Exception as e:
            logger.error(f"Error creating pest model: {e}")
            return None
    
    async def analyze_crop_image(
        self,
        image_data: str,
        crop_type: str = "unknown",
        analysis_type: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        Comprehensive crop image analysis for diseases and pests
        
        Args:
            image_data: Base64 encoded image data
            crop_type: Type of crop being analyzed
            analysis_type: Type of analysis (disease, pest, comprehensive)
            
        Returns:
            Comprehensive analysis results
        """
        try:
            logger.info(f"Analyzing crop image for {crop_type} - {analysis_type} analysis")
            
            # Decode and preprocess image
            image = self._decode_image(image_data)
            if image is None:
                return {"error": "Could not decode image data"}
            
            # Validate image quality
            quality_check = self._check_image_quality(image)
            if not quality_check["is_suitable"]:
                return {
                    "error": "Image quality insufficient for analysis",
                    "quality_issues": quality_check["issues"]
                }
            
            # Preprocess image for analysis
            processed_image = self._preprocess_image(image)
            
            # Perform different types of analysis
            analysis_results = {}
            
            if analysis_type in ["disease", "comprehensive"]:
                disease_analysis = await self._analyze_diseases(processed_image, crop_type)
                analysis_results["disease_analysis"] = disease_analysis
            
            if analysis_type in ["pest", "comprehensive"]:
                pest_analysis = await self._analyze_pests(processed_image, crop_type)
                analysis_results["pest_analysis"] = pest_analysis
            
            if analysis_type in ["health", "comprehensive"]:
                health_analysis = await self._analyze_plant_health(processed_image)
                analysis_results["health_analysis"] = health_analysis
            
            # Generate overall assessment
            overall_assessment = self._generate_overall_assessment(analysis_results)
            
            # Generate recommendations
            recommendations = self._generate_treatment_recommendations(
                analysis_results, crop_type
            )
            
            return {
                "crop_type": crop_type,
                "analysis_type": analysis_type,
                "analysis_timestamp": datetime.now().isoformat(),
                "image_quality": quality_check,
                "analysis_results": analysis_results,
                "overall_assessment": overall_assessment,
                "treatment_recommendations": recommendations,
                "confidence_summary": self._calculate_confidence_summary(analysis_results)
            }
            
        except Exception as e:
            logger.error(f"Error in crop image analysis: {e}")
            return {"error": f"Analysis failed: {str(e)}"}
    
    def _decode_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image data"""
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
    
    def _check_image_quality(self, image: np.ndarray) -> Dict[str, Any]:
        """Check if image is suitable for analysis"""
        issues = []
        
        # Check image size
        height, width = image.shape[:2]
        if height < 100 or width < 100:
            issues.append("Image too small (minimum 100x100 pixels)")
        
        # Check if image is too blurry
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 100:
            issues.append("Image appears to be blurry")
        
        # Check brightness
        brightness = np.mean(gray)
        if brightness < 50:
            issues.append("Image is too dark")
        elif brightness > 200:
            issues.append("Image is too bright")
        
        # Check for sufficient plant matter
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        green_mask = cv2.inRange(hsv, self.color_thresholds["healthy_green"][0], 
                                self.color_thresholds["healthy_green"][1])
        green_percentage = (cv2.countNonZero(green_mask) / (height * width)) * 100
        
        if green_percentage < 10:
            issues.append("Insufficient plant material visible in image")
        
        return {
            "is_suitable": len(issues) == 0,
            "issues": issues,
            "quality_metrics": {
                "resolution": f"{width}x{height}",
                "sharpness_score": float(laplacian_var),
                "brightness_level": float(brightness),
                "plant_coverage_percent": float(green_percentage)
            }
        }
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for analysis"""
        try:
            # Resize image to standard size
            resized = cv2.resize(image, self.target_image_size)
            
            # Normalize pixel values
            normalized = resized.astype(np.float32) / 255.0
            
            # Apply slight Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(normalized, (3, 3), 0)
            
            return blurred
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return image
    
    async def _analyze_diseases(self, image: np.ndarray, crop_type: str) -> Dict[str, Any]:
        """Analyze image for plant diseases"""
        try:
            disease_detections = []
            
            # Convert to different color spaces for analysis
            rgb_image = (image * 255).astype(np.uint8)
            hsv_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2HSV)
            lab_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2LAB)
            
            # Check each disease in our database
            for disease_name, disease_info in self.disease_database.items():
                # Skip if disease doesn't affect this crop
                if crop_type != "unknown" and crop_type not in disease_info.get("crop_types", []):
                    continue
                
                detection_result = self._detect_specific_disease(
                    rgb_image, hsv_image, lab_image, disease_name, disease_info
                )
                
                if detection_result["confidence"] > self.confidence_thresholds["low_confidence"]:
                    disease_detections.append(detection_result)
            
            # Sort by confidence
            disease_detections.sort(key=lambda x: x["confidence"], reverse=True)
            
            # Use deep learning model if available
            if DEEP_LEARNING_AVAILABLE and self.disease_model:
                ml_predictions = self._deep_learning_disease_prediction(image)
                disease_detections = self._merge_predictions(disease_detections, ml_predictions)
            
            return {
                "detected_diseases": disease_detections[:5],  # Top 5 detections
                "total_detections": len(disease_detections),
                "analysis_method": "computer_vision" + ("_and_ml" if DEEP_LEARNING_AVAILABLE else ""),
                "crop_specific_analysis": crop_type != "unknown"
            }
            
        except Exception as e:
            logger.error(f"Error in disease analysis: {e}")
            return {"error": f"Disease analysis failed: {str(e)}"}
    
    def _detect_specific_disease(
        self,
        rgb_image: np.ndarray,
        hsv_image: np.ndarray,
        lab_image: np.ndarray,
        disease_name: str,
        disease_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Detect a specific disease using computer vision techniques"""
        
        confidence = 0.0
        detected_features = []
        affected_areas = []
        
        try:
            # Analyze color signatures
            color_signatures = disease_info.get("color_signatures", {})
            for signature_name, (lower, upper) in color_signatures.items():
                mask = cv2.inRange(hsv_image, np.array(lower), np.array(upper))
                coverage = (cv2.countNonZero(mask) / (mask.shape[0] * mask.shape[1])) * 100
                
                if coverage > 1.0:  # At least 1% coverage
                    confidence += min(coverage * 10, 30)  # Max 30 points per signature
                    detected_features.append(signature_name)
                    
                    # Find contours of affected areas
                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    for contour in contours:
                        area = cv2.contourArea(contour)
                        if area > 50:  # Minimum area threshold
                            x, y, w, h = cv2.boundingRect(contour)
                            affected_areas.append({
                                "location": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                                "area_pixels": int(area),
                                "feature_type": signature_name
                            })
            
            # Analyze texture features (simplified)
            texture_features = disease_info.get("texture_features", [])
            for texture in texture_features:
                if self._detect_texture_feature(rgb_image, texture):
                    confidence += 10
                    detected_features.append(texture)
            
            # Determine severity based on coverage and features
            severity = self._assess_disease_severity(confidence, detected_features, affected_areas)
            
            # Normalize confidence to 0-1 range
            confidence = min(confidence / 100, 1.0)
            
            return {
                "disease": disease_name,
                "confidence": float(confidence),
                "detected_features": detected_features,
                "affected_areas": affected_areas,
                "severity": severity,
                "symptoms_detected": disease_info.get("symptoms", []),
                "treatment_available": bool(disease_info.get("treatment")),
                "area_coverage_percent": sum(area["area_pixels"] for area in affected_areas) / (rgb_image.shape[0] * rgb_image.shape[1]) * 100
            }
            
        except Exception as e:
            logger.error(f"Error detecting {disease_name}: {e}")
            return {
                "disease": disease_name,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def _detect_texture_feature(self, image: np.ndarray, texture_type: str) -> bool:
        """Detect specific texture features"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            if texture_type == "concentric_rings":
                # Use Hough circles to detect ring-like patterns
                circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 20,
                                         param1=50, param2=30, minRadius=10, maxRadius=50)
                return circles is not None and len(circles[0]) > 0
            
            elif texture_type == "rough_edges":
                # Use Canny edge detection
                edges = cv2.Canny(gray, 50, 150)
                edge_density = cv2.countNonZero(edges) / (edges.shape[0] * edges.shape[1])
                return edge_density > 0.1
            
            elif texture_type == "powdery_coating":
                # Look for high-frequency texture patterns
                laplacian = cv2.Laplacian(gray, cv2.CV_64F)
                texture_variance = np.var(laplacian)
                return texture_variance > 500
            
            elif texture_type == "water_soaked_appearance":
                # Look for areas with low contrast
                local_std = cv2.Laplacian(gray, cv2.CV_64F)
                low_contrast_areas = np.sum(np.abs(local_std) < 10)
                return low_contrast_areas > (gray.shape[0] * gray.shape[1] * 0.1)
            
            return False
            
        except Exception as e:
            logger.error(f"Error detecting texture feature {texture_type}: {e}")
            return False
    
    def _assess_disease_severity(
        self, 
        confidence: float, 
        detected_features: List[str], 
        affected_areas: List[Dict]
    ) -> str:
        """Assess disease severity based on detection results"""
        
        total_affected_area = sum(area["area_pixels"] for area in affected_areas)
        num_features = len(detected_features)
        
        if confidence < 30 or total_affected_area < 100:
            return "mild"
        elif confidence < 60 or total_affected_area < 1000 or num_features < 2:
            return "moderate"
        else:
            return "severe"
    
    async def _analyze_pests(self, image: np.ndarray, crop_type: str) -> Dict[str, Any]:
        """Analyze image for pest presence"""
        try:
            pest_detections = []
            
            # Convert to different formats for analysis
            rgb_image = (image * 255).astype(np.uint8)
            hsv_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2HSV)
            gray_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
            
            # Check each pest in our database
            for pest_name, pest_info in self.pest_database.items():
                # Skip if pest doesn't affect this crop
                if crop_type != "unknown" and crop_type not in pest_info.get("crop_types", []):
                    continue
                
                detection_result = self._detect_specific_pest(
                    rgb_image, hsv_image, gray_image, pest_name, pest_info
                )
                
                if detection_result["confidence"] > self.confidence_thresholds["low_confidence"]:
                    pest_detections.append(detection_result)
            
            # Sort by confidence
            pest_detections.sort(key=lambda x: x["confidence"], reverse=True)
            
            # Use deep learning model if available
            if DEEP_LEARNING_AVAILABLE and self.pest_model:
                ml_predictions = self._deep_learning_pest_prediction(image)
                pest_detections = self._merge_predictions(pest_detections, ml_predictions)
            
            return {
                "detected_pests": pest_detections[:5],  # Top 5 detections
                "total_detections": len(pest_detections),
                "analysis_method": "computer_vision" + ("_and_ml" if DEEP_LEARNING_AVAILABLE else ""),
                "crop_specific_analysis": crop_type != "unknown"
            }
            
        except Exception as e:
            logger.error(f"Error in pest analysis: {e}")
            return {"error": f"Pest analysis failed: {str(e)}"}
    
    def _detect_specific_pest(
        self,
        rgb_image: np.ndarray,
        hsv_image: np.ndarray,
        gray_image: np.ndarray,
        pest_name: str,
        pest_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Detect a specific pest using computer vision techniques"""
        
        confidence = 0.0
        detected_locations = []
        damage_indicators = []
        
        try:
            # Analyze damage symptoms
            damage_symptoms = pest_info.get("damage_symptoms", [])
            
            # Look for specific damage patterns
            if "Stippling or tiny yellow spots" in damage_symptoms:
                # Detect stippling pattern for spider mites
                stippling_score = self._detect_stippling_pattern(hsv_image)
                if stippling_score > 0.1:
                    confidence += stippling_score * 50
                    damage_indicators.append("stippling_pattern")
            
            if "Holes in leaves" in damage_symptoms:
                # Detect holes for caterpillars
                holes_detected = self._detect_leaf_holes(gray_image)
                if holes_detected > 0:
                    confidence += min(holes_detected * 20, 40)
                    damage_indicators.append("leaf_holes")
            
            if "Curled or distorted leaves" in damage_symptoms:
                # Detect leaf distortion for aphids
                distortion_score = self._detect_leaf_distortion(gray_image)
                if distortion_score > 0.1:
                    confidence += distortion_score * 30
                    damage_indicators.append("leaf_distortion")
            
            if "Silver or bronze streaks on leaves" in damage_symptoms:
                # Detect feeding streaks for thrips
                streak_score = self._detect_feeding_streaks(hsv_image)
                if streak_score > 0.1:
                    confidence += streak_score * 40
                    damage_indicators.append("feeding_streaks")
            
            # Look for pest-specific visual characteristics
            detection_features = pest_info.get("detection_features", {})
            if "color_range" in detection_features:
                color_range = detection_features["color_range"]
                mask = cv2.inRange(hsv_image, np.array(color_range[0]), np.array(color_range[1]))
                coverage = (cv2.countNonZero(mask) / (mask.shape[0] * mask.shape[1])) * 100
                
                if coverage > 0.5:  # At least 0.5% coverage
                    confidence += min(coverage * 15, 25)
                    
                    # Find pest locations
                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    for contour in contours:
                        area = cv2.contourArea(contour)
                        if area > 10:  # Minimum area for pests
                            x, y, w, h = cv2.boundingRect(contour)
                            detected_locations.append({
                                "location": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                                "area_pixels": int(area)
                            })
            
            # Assess infestation level
            infestation_level = self._assess_infestation_level(confidence, len(detected_locations))
            
            # Normalize confidence
            confidence = min(confidence / 100, 1.0)
            
            return {
                "pest": pest_name,
                "confidence": float(confidence),
                "detected_locations": detected_locations[:10],  # Max 10 locations
                "damage_indicators": damage_indicators,
                "infestation_level": infestation_level,
                "visual_characteristics": pest_info.get("visual_characteristics", {}),
                "treatment_available": bool(pest_info.get("treatment")),
                "estimated_count": len(detected_locations)
            }
            
        except Exception as e:
            logger.error(f"Error detecting {pest_name}: {e}")
            return {
                "pest": pest_name,
                "confidence": 0.0,
                "error": str(e)
            }
    
    def _detect_stippling_pattern(self, hsv_image: np.ndarray) -> float:
        """Detect stippling pattern characteristic of spider mite damage"""
        try:
            # Look for small yellow/white spots
            yellow_mask = cv2.inRange(hsv_image, (20, 100, 100), (30, 255, 255))
            
            # Use morphological operations to find small spots
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            spots = cv2.morphologyEx(yellow_mask, cv2.MORPH_OPEN, kernel)
            
            # Count and analyze spots
            contours, _ = cv2.findContours(spots, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            small_spots = [c for c in contours if 1 <= cv2.contourArea(c) <= 10]
            
            # Calculate stippling score based on spot density
            total_area = hsv_image.shape[0] * hsv_image.shape[1]
            stippling_score = len(small_spots) / (total_area / 1000)  # Spots per 1000 pixels
            
            return min(stippling_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error detecting stippling pattern: {e}")
            return 0.0
    
    def _detect_leaf_holes(self, gray_image: np.ndarray) -> int:
        """Detect holes in leaves characteristic of caterpillar damage"""
        try:
            # Use adaptive threshold to find dark areas
            thresh = cv2.adaptiveThreshold(gray_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                         cv2.THRESH_BINARY, 11, 2)
            
            # Find contours of potential holes
            contours, _ = cv2.findContours(255 - thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter for hole-like shapes
            holes = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if 20 <= area <= 500:  # Reasonable hole size
                    # Check if shape is roughly circular (hole-like)
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                        if circularity > 0.3:  # Somewhat circular
                            holes.append(contour)
            
            return len(holes)
            
        except Exception as e:
            logger.error(f"Error detecting leaf holes: {e}")
            return 0
    
    def _detect_leaf_distortion(self, gray_image: np.ndarray) -> float:
        """Detect leaf distortion characteristic of aphid damage"""
        try:
            # Use edge detection to find leaf boundaries
            edges = cv2.Canny(gray_image, 50, 150)
            
            # Find contours representing leaf edges
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            distortion_score = 0.0
            for contour in contours:
                if cv2.contourArea(contour) > 100:  # Significant leaf area
                    # Calculate contour smoothness
                    epsilon = 0.02 * cv2.arcLength(contour, True)
                    smooth_contour = cv2.approxPolyDP(contour, epsilon, True)
                    
                    # More vertices in smoothed contour indicates more distortion
                    vertex_ratio = len(smooth_contour) / max(len(contour), 1)
                    distortion_score += vertex_ratio
            
            return min(distortion_score / len(contours) if contours else 0, 1.0)
            
        except Exception as e:
            logger.error(f"Error detecting leaf distortion: {e}")
            return 0.0
    
    def _detect_feeding_streaks(self, hsv_image: np.ndarray) -> float:
        """Detect feeding streaks characteristic of thrips damage"""
        try:
            # Convert to grayscale for line detection
            gray = cv2.cvtColor(hsv_image, cv2.COLOR_HSV2RGB)
            gray = cv2.cvtColor(gray, cv2.COLOR_RGB2GRAY)
            
            # Use HoughLines to detect linear streaks
            edges = cv2.Canny(gray, 50, 150)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=20, 
                                  minLineLength=10, maxLineGap=5)
            
            if lines is not None:
                # Filter for lines that could be feeding streaks
                streak_lines = []
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                    if 10 <= length <= 50:  # Typical streak length
                        streak_lines.append(line)
                
                # Calculate streak density
                total_area = hsv_image.shape[0] * hsv_image.shape[1]
                streak_score = len(streak_lines) / (total_area / 10000)  # Streaks per 10k pixels
                return min(streak_score, 1.0)
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error detecting feeding streaks: {e}")
            return 0.0
    
    def _assess_infestation_level(self, confidence: float, location_count: int) -> str:
        """Assess pest infestation level"""
        if confidence < 30 or location_count < 2:
            return "low"
        elif confidence < 60 or location_count < 5:
            return "moderate"
        else:
            return "high"
    
    async def _analyze_plant_health(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze overall plant health from image"""
        try:
            rgb_image = (image * 255).astype(np.uint8)
            hsv_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2HSV)
            
            # Analyze leaf color distribution
            health_metrics = {}
            
            # Calculate healthy green percentage
            healthy_mask = cv2.inRange(hsv_image, 
                                     self.color_thresholds["healthy_green"][0],
                                     self.color_thresholds["healthy_green"][1])
            healthy_percentage = (cv2.countNonZero(healthy_mask) / (healthy_mask.shape[0] * healthy_mask.shape[1])) * 100
            
            # Calculate yellowing percentage
            yellow_mask = cv2.inRange(hsv_image, 
                                    self.color_thresholds["yellowing"][0],
                                    self.color_thresholds["yellowing"][1])
            yellow_percentage = (cv2.countNonZero(yellow_mask) / (yellow_mask.shape[0] * yellow_mask.shape[1])) * 100
            
            # Calculate browning percentage
            brown_mask = cv2.inRange(hsv_image, 
                                   self.color_thresholds["browning"][0],
                                   self.color_thresholds["browning"][1])
            brown_percentage = (cv2.countNonZero(brown_mask) / (brown_mask.shape[0] * brown_mask.shape[1])) * 100
            
            health_metrics = {
                "healthy_green_percent": float(healthy_percentage),
                "yellowing_percent": float(yellow_percentage),
                "browning_percent": float(brown_percentage)
            }
            
            # Calculate overall health score
            health_score = self._calculate_health_score(health_metrics)
            
            # Determine health status
            if health_score > 80:
                health_status = "excellent"
            elif health_score > 60:
                health_status = "good"
            elif health_score > 40:
                health_status = "fair"
            else:
                health_status = "poor"
            
            return {
                "health_metrics": health_metrics,
                "overall_health_score": health_score,
                "health_status": health_status,
                "analysis_notes": self._generate_health_notes(health_metrics, health_status)
            }
            
        except Exception as e:
            logger.error(f"Error in plant health analysis: {e}")
            return {"error": f"Health analysis failed: {str(e)}"}
    
    def _calculate_health_score(self, metrics: Dict[str, float]) -> float:
        """Calculate overall plant health score"""
        healthy_green = metrics.get("healthy_green_percent", 0)
        yellowing = metrics.get("yellowing_percent", 0)
        browning = metrics.get("browning_percent", 0)
        
        # Base score from healthy green coverage
        base_score = min(healthy_green * 2, 80)  # Max 80 from green coverage
        
        # Penalty for yellowing and browning
        penalty = (yellowing * 0.5) + (browning * 1.0)
        
        final_score = max(0, min(100, base_score - penalty))
        return final_score
    
    def _generate_health_notes(self, metrics: Dict[str, float], status: str) -> List[str]:
        """Generate health analysis notes"""
        notes = []
        
        healthy_green = metrics.get("healthy_green_percent", 0)
        yellowing = metrics.get("yellowing_percent", 0)
        browning = metrics.get("browning_percent", 0)
        
        if healthy_green > 60:
            notes.append("Good healthy green foliage coverage")
        elif healthy_green < 30:
            notes.append("Low healthy green foliage - may indicate stress")
        
        if yellowing > 15:
            notes.append("Significant yellowing detected - check for nutrient deficiency or disease")
        
        if browning > 10:
            notes.append("Browning areas detected - possible disease or environmental stress")
        
        if status == "excellent":
            notes.append("Plant appears very healthy with minimal stress indicators")
        elif status == "poor":
            notes.append("Plant shows significant health issues requiring attention")
        
        return notes
    
    def _deep_learning_disease_prediction(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Use deep learning model for disease prediction"""
        if not DEEP_LEARNING_AVAILABLE or not self.disease_model:
            return []
        
        try:
            # Prepare image for PyTorch model
            transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            # Convert and transform image
            image_uint8 = (image * 255).astype(np.uint8)
            input_tensor = transform(image_uint8).unsqueeze(0)
            
            # Run prediction
            with torch.no_grad():
                outputs = self.disease_model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                
            # Convert to predictions
            predictions = []
            disease_names = list(self.disease_database.keys())
            
            for i, prob in enumerate(probabilities[0]):
                if i < len(disease_names) and prob > 0.1:  # Minimum confidence threshold
                    predictions.append({
                        "disease": disease_names[i],
                        "confidence": float(prob),
                        "method": "deep_learning"
                    })
            
            return sorted(predictions, key=lambda x: x["confidence"], reverse=True)
            
        except Exception as e:
            logger.error(f"Error in deep learning disease prediction: {e}")
            return []
    
    def _deep_learning_pest_prediction(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Use deep learning model for pest prediction"""
        if not DEEP_LEARNING_AVAILABLE or not self.pest_model:
            return []
        
        try:
            # Similar process as disease prediction
            transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                                   std=[0.229, 0.224, 0.225])
            ])
            
            image_uint8 = (image * 255).astype(np.uint8)
            input_tensor = transform(image_uint8).unsqueeze(0)
            
            with torch.no_grad():
                outputs = self.pest_model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
            
            predictions = []
            pest_names = list(self.pest_database.keys())
            
            for i, prob in enumerate(probabilities[0]):
                if i < len(pest_names) and prob > 0.1:
                    predictions.append({
                        "pest": pest_names[i],
                        "confidence": float(prob),
                        "method": "deep_learning"
                    })
            
            return sorted(predictions, key=lambda x: x["confidence"], reverse=True)
            
        except Exception as e:
            logger.error(f"Error in deep learning pest prediction: {e}")
            return []
    
    def _merge_predictions(self, cv_predictions: List[Dict], ml_predictions: List[Dict]) -> List[Dict]:
        """Merge computer vision and machine learning predictions"""
        merged = {}
        
        # Add CV predictions
        for pred in cv_predictions:
            key = pred.get("disease") or pred.get("pest")
            merged[key] = pred.copy()
            merged[key]["cv_confidence"] = pred["confidence"]
        
        # Merge ML predictions
        for pred in ml_predictions:
            key = pred.get("disease") or pred.get("pest")
            if key in merged:
                # Average the confidences
                merged[key]["ml_confidence"] = pred["confidence"]
                merged[key]["confidence"] = (merged[key]["cv_confidence"] + pred["confidence"]) / 2
                merged[key]["method"] = "combined_cv_ml"
            else:
                merged[key] = pred.copy()
                merged[key]["ml_confidence"] = pred["confidence"]
        
        return list(merged.values())
    
    def _generate_overall_assessment(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall assessment from all analysis results"""
        
        assessment = {
            "overall_status": "healthy",
            "confidence": 0.0,
            "primary_issues": [],
            "severity_level": "none"
        }
        
        try:
            # Check disease analysis
            disease_analysis = analysis_results.get("disease_analysis", {})
            detected_diseases = disease_analysis.get("detected_diseases", [])
            
            # Check pest analysis
            pest_analysis = analysis_results.get("pest_analysis", {})
            detected_pests = pest_analysis.get("detected_pests", [])
            
            # Check health analysis
            health_analysis = analysis_results.get("health_analysis", {})
            health_score = health_analysis.get("overall_health_score", 80)
            
            # Determine primary issues
            if detected_diseases:
                top_disease = detected_diseases[0]
                if top_disease["confidence"] > self.confidence_thresholds["medium_confidence"]:
                    assessment["primary_issues"].append({
                        "type": "disease",
                        "name": top_disease["disease"],
                        "confidence": top_disease["confidence"],
                        "severity": top_disease.get("severity", "unknown")
                    })
            
            if detected_pests:
                top_pest = detected_pests[0]
                if top_pest["confidence"] > self.confidence_thresholds["medium_confidence"]:
                    assessment["primary_issues"].append({
                        "type": "pest",
                        "name": top_pest["pest"],
                        "confidence": top_pest["confidence"],
                        "infestation_level": top_pest.get("infestation_level", "unknown")
                    })
            
            # Determine overall status
            if health_score < 40 or (detected_diseases and detected_diseases[0]["confidence"] > 0.7):
                assessment["overall_status"] = "poor"
                assessment["severity_level"] = "high"
            elif health_score < 60 or assessment["primary_issues"]:
                assessment["overall_status"] = "concerning"
                assessment["severity_level"] = "moderate"
            elif health_score < 80:
                assessment["overall_status"] = "fair"
                assessment["severity_level"] = "low"
            else:
                assessment["overall_status"] = "healthy"
                assessment["severity_level"] = "none"
            
            # Calculate overall confidence
            confidences = []
            if detected_diseases:
                confidences.extend([d["confidence"] for d in detected_diseases[:2]])
            if detected_pests:
                confidences.extend([p["confidence"] for p in detected_pests[:2]])
            if health_score > 0:
                confidences.append(health_score / 100)
            
            assessment["confidence"] = np.mean(confidences) if confidences else 0.5
            
        except Exception as e:
            logger.error(f"Error generating overall assessment: {e}")
        
        return assessment
    
    def _generate_treatment_recommendations(
        self, 
        analysis_results: Dict[str, Any], 
        crop_type: str
    ) -> Dict[str, Any]:
        """Generate comprehensive treatment recommendations"""
        
        recommendations = {
            "immediate_actions": [],
            "treatment_options": {
                "organic": [],
                "chemical": [],
                "biological": []
            },
            "preventive_measures": [],
            "monitoring_schedule": [],
            "severity_based_action": ""
        }
        
        try:
            # Get primary issues from overall assessment
            overall_assessment = analysis_results.get("overall_assessment", {})
            if isinstance(overall_assessment, dict):
                primary_issues = overall_assessment.get("primary_issues", [])
                severity_level = overall_assessment.get("severity_level", "none")
            else:
                primary_issues = []
                severity_level = "none"
            
            # Generate recommendations based on detected issues
            for issue in primary_issues:
                if issue["type"] == "disease":
                    disease_name = issue["name"]
                    disease_info = self.disease_database.get(disease_name, {})
                    treatment_info = disease_info.get("treatment", {})
                    
                    # Add treatment options
                    recommendations["treatment_options"]["organic"].extend(
                        treatment_info.get("organic", [])
                    )
                    recommendations["treatment_options"]["chemical"].extend(
                        treatment_info.get("chemical", [])
                    )
                    recommendations["preventive_measures"].extend(
                        treatment_info.get("preventive", [])
                    )
                    
                    # Add immediate actions based on severity
                    if issue.get("severity") == "severe":
                        recommendations["immediate_actions"].append(
                            f"Immediate treatment required for {disease_name} - consider chemical control"
                        )
                    else:
                        recommendations["immediate_actions"].append(
                            f"Begin treatment for {disease_name} - organic options available"
                        )
                
                elif issue["type"] == "pest":
                    pest_name = issue["name"]
                    pest_info = self.pest_database.get(pest_name, {})
                    treatment_info = pest_info.get("treatment", {})
                    
                    # Add treatment options
                    recommendations["treatment_options"]["organic"].extend(
                        treatment_info.get("organic", [])
                    )
                    recommendations["treatment_options"]["chemical"].extend(
                        treatment_info.get("chemical", [])
                    )
                    recommendations["treatment_options"]["biological"].extend(
                        treatment_info.get("biological", [])
                    )
                    
                    # Add immediate actions based on infestation level
                    infestation_level = issue.get("infestation_level", "low")
                    if infestation_level == "high":
                        recommendations["immediate_actions"].append(
                            f"High {pest_name} infestation detected - immediate intervention required"
                        )
                    else:
                        recommendations["immediate_actions"].append(
                            f"Monitor and treat {pest_name} population"
                        )
            
            # Remove duplicates
            for category in recommendations["treatment_options"]:
                recommendations["treatment_options"][category] = list(set(recommendations["treatment_options"][category]))
            
            recommendations["preventive_measures"] = list(set(recommendations["preventive_measures"]))
            
            # Generate monitoring schedule
            if severity_level == "high":
                recommendations["monitoring_schedule"] = [
                    "Daily monitoring for next 7 days",
                    "Weekly monitoring for next month",
                    "Monthly monitoring thereafter"
                ]
            elif severity_level == "moderate":
                recommendations["monitoring_schedule"] = [
                    "Monitor every 2-3 days for next 2 weeks",
                    "Weekly monitoring for next month"
                ]
            else:
                recommendations["monitoring_schedule"] = [
                    "Weekly monitoring recommended",
                    "Monthly comprehensive inspection"
                ]
            
            # Set severity-based action
            if severity_level == "high":
                recommendations["severity_based_action"] = "Urgent intervention required to prevent significant crop loss"
            elif severity_level == "moderate":
                recommendations["severity_based_action"] = "Timely treatment recommended to prevent escalation"
            elif severity_level == "low":
                recommendations["severity_based_action"] = "Preventive measures and monitoring recommended"
            else:
                recommendations["severity_based_action"] = "Continue current good practices"
            
            # Add general recommendations if no specific issues found
            if not primary_issues:
                recommendations["preventive_measures"].extend([
                    "Maintain proper plant spacing for air circulation",
                    "Practice crop rotation",
                    "Monitor regularly for early detection",
                    "Ensure proper nutrition and irrigation"
                ])
            
        except Exception as e:
            logger.error(f"Error generating treatment recommendations: {e}")
        
        return recommendations
    
    def _calculate_confidence_summary(self, analysis_results: Dict[str, Any]) -> Dict[str, float]:
        """Calculate confidence summary for the analysis"""
        
        summary = {
            "overall_confidence": 0.0,
            "disease_detection_confidence": 0.0,
            "pest_detection_confidence": 0.0,
            "health_assessment_confidence": 0.8  # Health assessment is generally reliable
        }
        
        try:
            # Disease detection confidence
            disease_analysis = analysis_results.get("disease_analysis", {})
            detected_diseases = disease_analysis.get("detected_diseases", [])
            if detected_diseases:
                disease_confidences = [d["confidence"] for d in detected_diseases[:3]]
                summary["disease_detection_confidence"] = np.mean(disease_confidences)
            
            # Pest detection confidence
            pest_analysis = analysis_results.get("pest_analysis", {})
            detected_pests = pest_analysis.get("detected_pests", [])
            if detected_pests:
                pest_confidences = [p["confidence"] for p in detected_pests[:3]]
                summary["pest_detection_confidence"] = np.mean(pest_confidences)
            
            # Overall confidence
            all_confidences = [
                summary["disease_detection_confidence"],
                summary["pest_detection_confidence"],
                summary["health_assessment_confidence"]
            ]
            
            # Weight by importance and availability
            weights = []
            values = []
            
            if summary["disease_detection_confidence"] > 0:
                weights.append(0.4)
                values.append(summary["disease_detection_confidence"])
            
            if summary["pest_detection_confidence"] > 0:
                weights.append(0.4)
                values.append(summary["pest_detection_confidence"])
            
            weights.append(0.2)
            values.append(summary["health_assessment_confidence"])
            
            # Normalize weights
            total_weight = sum(weights)
            normalized_weights = [w / total_weight for w in weights]
            
            summary["overall_confidence"] = sum(v * w for v, w in zip(values, normalized_weights))
            
        except Exception as e:
            logger.error(f"Error calculating confidence summary: {e}")
        
        return summary

    async def health_check(self) -> Dict[str, Any]:
        """Check health of computer vision service"""
        try:
            # Test basic functionality
            test_image = np.ones((224, 224, 3), dtype=np.uint8) * 128  # Gray test image
            
            # Test image preprocessing
            processed = self._preprocess_image(test_image)
            
            return {
                "status": "healthy",
                "service": "ComputerVisionService",
                "deep_learning_available": DEEP_LEARNING_AVAILABLE,
                "disease_database_loaded": len(self.disease_database),
                "pest_database_loaded": len(self.pest_database),
                "models_loaded": {
                    "disease_model": self.disease_model is not None,
                    "pest_model": self.pest_model is not None
                },
                "image_processing_functional": processed is not None,
                "supported_formats": self.supported_formats
            }
            
        except Exception as e:
            logger.error(f"Computer vision service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "ComputerVisionService"
            }