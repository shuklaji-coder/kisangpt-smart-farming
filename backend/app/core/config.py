"""
Configuration settings for Kisan GPT
"""

import os
from typing import List, Dict, Any, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
import json


class Settings(BaseSettings):
    """Application settings"""
    
    # App Configuration
    APP_NAME: str = "Kisan GPT"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "kisan_gpt"
    POSTGRES_URL: Optional[str] = None
    
    # API Keys
    OPENWEATHER_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    GOOGLE_EARTH_ENGINE_KEY: Optional[str] = None
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ML Model Settings
    MODEL_PATH: str = "../models/saved_models/"
    ENABLE_GPU: bool = False
    
    # Speech Recognition Settings
    SPEECH_RECOGNITION_TIMEOUT: int = 10
    SUPPORTED_LANGUAGES: List[str] = ["hi", "mr", "en"]
    DEFAULT_LANGUAGE: str = "hi"
    
    # TTS Settings
    TTS_CACHE_DIR: str = "./cache/tts/"
    TTS_LANGUAGE_MAPPING: Dict[str, str] = {"hi": "hi", "mr": "mr", "en": "en"}
    
    # External APIs
    WEATHER_API_TIMEOUT: int = 30
    GEOCODING_API_TIMEOUT: int = 20
    
    # File Upload Settings
    MAX_AUDIO_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_AUDIO_FORMATS: List[str] = ["wav", "mp3", "ogg", "m4a"]
    UPLOAD_DIR: str = "./uploads/"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/kisan_gpt.log"
    
    # Security
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60
    
    # Community AI Settings
    ENABLE_COMMUNITY_SHARING: bool = True
    ANONYMIZE_DATA: bool = True
    MIN_USERS_FOR_COMMUNITY_MODEL: int = 50
    
    @field_validator('CORS_ORIGINS', mode='before')
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from string or list"""
        if isinstance(v, str) and not v.startswith('['):
            return [i.strip() for i in v.split(',')]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @field_validator('SUPPORTED_LANGUAGES', mode='before')
    def parse_supported_languages(cls, v: str) -> List[str]:
        """Parse supported languages from string"""
        if isinstance(v, str):
            return [lang.strip() for lang in v.split(',')]
        return v
    
    @field_validator('ALLOWED_AUDIO_FORMATS', mode='before')
    def parse_allowed_formats(cls, v: str) -> List[str]:
        """Parse allowed audio formats from string"""
        if isinstance(v, str):
            return [fmt.strip() for fmt in v.split(',')]
        return v
    
    @field_validator('TTS_LANGUAGE_MAPPING', mode='before')
    def parse_tts_mapping(cls, v: str) -> Dict[str, str]:
        """Parse TTS language mapping from JSON string"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {"hi": "hi", "mr": "mr", "en": "en"}
        return v
    
    model_config = {"env_file": ".env", "case_sensitive": True}


# Create global settings instance
settings = Settings()


# District and Soil Type Mappings
DISTRICT_SOIL_MAPPING = {
    # Maharashtra districts (sample)
    "pune": {"soil_type": "red_soil", "agro_zone": "western_maharashtra"},
    "mumbai": {"soil_type": "coastal_alluvium", "agro_zone": "konkan"},
    "nashik": {"soil_type": "black_soil", "agro_zone": "western_maharashtra"},
    "nagpur": {"soil_type": "black_soil", "agro_zone": "vidarbha"},
    "aurangabad": {"soil_type": "black_soil", "agro_zone": "marathwada"},
    "kolhapur": {"soil_type": "red_soil", "agro_zone": "western_maharashtra"},
    
    # Karnataka districts (sample)
    "bangalore": {"soil_type": "red_soil", "agro_zone": "southern_plateau"},
    "mysore": {"soil_type": "red_soil", "agro_zone": "southern_plateau"},
    "hubli": {"soil_type": "black_soil", "agro_zone": "northern_karnataka"},
    "mangalore": {"soil_type": "laterite", "agro_zone": "coastal_karnataka"},
    
    # Gujarat districts (sample)
    "ahmedabad": {"soil_type": "alluvial", "agro_zone": "middle_gujarat"},
    "surat": {"soil_type": "alluvial", "agro_zone": "south_gujarat"},
    "vadodara": {"soil_type": "black_soil", "agro_zone": "middle_gujarat"},
    "rajkot": {"soil_type": "black_soil", "agro_zone": "saurashtra"},
}


# Crop Season Mapping
CROP_SEASONS = {
    "kharif": {
        "months": [6, 7, 8, 9, 10],  # June to October
        "crops": ["rice", "cotton", "sugarcane", "maize", "soybean", "groundnut"]
    },
    "rabi": {
        "months": [11, 12, 1, 2, 3],  # November to March
        "crops": ["wheat", "gram", "pea", "mustard", "barley", "onion"]
    },
    "zaid": {
        "months": [4, 5, 6],  # April to June
        "crops": ["watermelon", "muskmelon", "cucumber", "fodder_maize"]
    }
}


# Emotion to Response Tone Mapping
EMOTION_RESPONSE_MAPPING = {
    "stress": {
        "tone": "empathetic",
        "complexity": "simple",
        "urgency": "high",
        "include_helpline": True
    },
    "worry": {
        "tone": "reassuring",
        "complexity": "simple",
        "urgency": "medium",
        "include_helpline": True
    },
    "confident": {
        "tone": "informative",
        "complexity": "detailed",
        "urgency": "low",
        "include_helpline": False
    },
    "neutral": {
        "tone": "friendly",
        "complexity": "moderate",
        "urgency": "low",
        "include_helpline": False
    }
}


# Language Code Mapping
LANGUAGE_CODES = {
    "hi": {"name": "Hindi", "tts_code": "hi", "rtl": False},
    "mr": {"name": "Marathi", "tts_code": "mr", "rtl": False},
    "en": {"name": "English", "tts_code": "en", "rtl": False}
}