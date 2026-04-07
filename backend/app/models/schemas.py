"""
Pydantic models for API requests and responses
"""

from typing import List, Dict, Optional, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum


# Enums
class EmotionType(str, Enum):
    STRESS = "stress"
    WORRY = "worry"
    CONFIDENT = "confident"
    NEUTRAL = "neutral"


class LanguageType(str, Enum):
    HINDI = "hi"
    MARATHI = "mr"
    ENGLISH = "en"


class InputType(str, Enum):
    VOICE = "voice"
    TEXT = "text"


class SoilType(str, Enum):
    RED_SOIL = "red_soil"
    BLACK_SOIL = "black_soil"
    ALLUVIAL = "alluvial"
    LATERITE = "laterite"
    COASTAL_ALLUVIUM = "coastal_alluvium"


class CropSeason(str, Enum):
    KHARIF = "kharif"
    RABI = "rabi"
    ZAID = "zaid"


# Base Models
class BaseResponse(BaseModel):
    """Base response model"""
    success: bool = True
    message: str = "Success"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Voice Analysis Models
class VoiceAnalysisRequest(BaseModel):
    """Voice analysis request model"""
    user_id: str
    gps: Optional[Dict[str, float]] = Field(None, description="GPS coordinates {lat, lng}")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "gps": {"lat": 18.5204, "lng": 73.8567}
            }
        }


class VoiceAnalysisResponse(BaseResponse):
    """Voice analysis response model"""
    language: LanguageType
    emotion: EmotionType
    emotion_score: float = Field(ge=0.0, le=1.0)
    transcript: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Voice analysis completed",
                "language": "hi",
                "emotion": "neutral",
                "emotion_score": 0.75,
                "transcript": "मेरी फसल के बारे में बताइए"
            }
        }


# Text Analysis Models
class TextAnalysisRequest(BaseModel):
    """Text analysis request model"""
    text: str = Field(..., min_length=1, max_length=1000)
    user_id: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "मेरी फसल के बारे में बताइए",
                "user_id": "user_123"
            }
        }


class TextAnalysisResponse(BaseResponse):
    """Text analysis response model"""
    language: LanguageType
    emotion: EmotionType
    emotion_score: float = Field(ge=0.0, le=1.0)
    sentiment: float = Field(ge=-1.0, le=1.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Text analysis completed",
                "language": "hi",
                "emotion": "neutral",
                "emotion_score": 0.75,
                "sentiment": 0.2
            }
        }


# Location Models
class LocationInfoResponse(BaseResponse):
    """Location info response model"""
    district: str
    soil_type: SoilType
    agro_zone: str
    weather_current: Dict[str, Any]
    weather_forecast: List[Dict[str, Any]]
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Location info retrieved",
                "district": "pune",
                "soil_type": "red_soil",
                "agro_zone": "western_maharashtra",
                "weather_current": {
                    "temperature": 28.5,
                    "humidity": 65,
                    "rainfall": 0
                },
                "weather_forecast": [
                    {"date": "2024-01-15", "temp_max": 30, "temp_min": 20, "rainfall": 2.5}
                ]
            }
        }


# Crop Recommendation Models
class CropRecommendationRequest(BaseModel):
    """Crop recommendation request model"""
    district: str
    soil_type: SoilType
    season: Optional[CropSeason] = None
    weather_data: Optional[Dict[str, Any]] = None
    historical_yield_stats: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "district": "pune",
                "soil_type": "red_soil",
                "season": "kharif",
                "weather_data": {
                    "rainfall_avg": 850,
                    "temp_avg": 25.5
                }
            }
        }


class CropRecommendation(BaseModel):
    """Individual crop recommendation"""
    crop: str
    success_probability: float = Field(ge=0.0, le=1.0)
    reason: str
    recommended_practices: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "crop": "rice",
                "success_probability": 0.82,
                "reason": "High rainfall and suitable temperature for rice cultivation",
                "recommended_practices": ["Direct seeding", "Organic fertilizer use"]
            }
        }


class CropRecommendationResponse(BaseResponse):
    """Crop recommendation response model"""
    recommendations: List[CropRecommendation]
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Crop recommendations generated",
                "recommendations": [
                    {
                        "crop": "rice",
                        "success_probability": 0.82,
                        "reason": "High rainfall and suitable temperature",
                        "recommended_practices": ["Direct seeding"]
                    }
                ]
            }
        }


# Disease Prediction Models
class DiseasePredictionRequest(BaseModel):
    """Disease prediction request model"""
    district: str
    crop: str
    current_weather: Dict[str, Any]
    forecast_horizon_days: int = Field(default=14, ge=1, le=30)
    
    class Config:
        json_schema_extra = {
            "example": {
                "district": "pune",
                "crop": "tomato",
                "current_weather": {
                    "humidity": 80,
                    "temperature": 25
                },
                "forecast_horizon_days": 18
            }
        }


class DiseaseRisk(BaseModel):
    """Disease risk prediction"""
    disease: str
    risk_level: str = Field(..., pattern="^(low|medium|high)$")
    days_until_expected: int
    preventive_action: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "disease": "tomato_blight",
                "risk_level": "high",
                "days_until_expected": 18,
                "preventive_action": "Apply copper-based fungicide spray"
            }
        }


class DiseasePredictionResponse(BaseResponse):
    """Disease prediction response model"""
    risks: List[DiseaseRisk]
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Disease risks predicted",
                "risks": [
                    {
                        "disease": "tomato_blight",
                        "risk_level": "high",
                        "days_until_expected": 18,
                        "preventive_action": "Apply fungicide spray"
                    }
                ]
            }
        }


# Market Forecast Models
class PricePoint(BaseModel):
    """Price point model"""
    date: str
    price: float = Field(ge=0)


class MarketForecastResponse(BaseResponse):
    """Market forecast response model"""
    forecasted_prices: List[PricePoint]
    recommended_sell_window: Dict[str, str]
    confidence: float = Field(ge=0.0, le=1.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Market forecast generated",
                "forecasted_prices": [
                    {"date": "2024-01-15", "price": 25.50},
                    {"date": "2024-01-16", "price": 26.20}
                ],
                "recommended_sell_window": {
                    "start": "2024-01-20",
                    "end": "2024-01-25"
                },
                "confidence": 0.78
            }
        }


# Reply Generation Models
class ReplyGenerationRequest(BaseModel):
    """Reply generation request model"""
    user_id: str
    language: LanguageType
    emotion: EmotionType
    recommended_actions: List[str]
    tone: str = Field(default="informative", pattern="^(motivational|informative|urgent)$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "language": "hi",
                "emotion": "worry",
                "recommended_actions": ["Apply fertilizer", "Increase watering"],
                "tone": "reassuring"
            }
        }


class ReplyGenerationResponse(BaseResponse):
    """Reply generation response model"""
    text_reply: str
    tts_audio_url: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Reply generated",
                "text_reply": "चिंता न करें, आपकी फसल अच्छी होगी। खाद डालें और पानी बढ़ाएं।",
                "tts_audio_url": "/static/audio/reply_123.mp3"
            }
        }


# Database Models
class User(BaseModel):
    """User model"""
    user_id: str
    name: str
    village: Optional[str] = None
    district: str
    phone: Optional[str] = None
    language_pref: LanguageType = LanguageType.HINDI
    opt_in: Dict[str, bool] = {"sharing": True}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Session(BaseModel):
    """Session model"""
    session_id: str
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    input_type: InputType
    transcript: Optional[str] = None
    emotion: EmotionType
    language: LanguageType
    location: Optional[Dict[str, float]] = None


class Prediction(BaseModel):
    """Prediction model"""
    prediction_id: str
    user_id: str
    model_version: str
    input_features: Dict[str, Any]
    output: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MarketPrice(BaseModel):
    """Market price model"""
    district: str
    crop: str
    date: str
    price: float = Field(ge=0)
    market: Optional[str] = None
    
    
class HistoricalYield(BaseModel):
    """Historical yield model"""
    district: str
    crop: str
    year: int
    yield_per_hectare: float = Field(ge=0)
    area_hectares: float = Field(ge=0)
    production_tonnes: float = Field(ge=0)
    soil_type: SoilType
    rainfall_mm: float = Field(ge=0)
    temp_avg_celsius: float