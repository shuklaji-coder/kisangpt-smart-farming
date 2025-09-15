"""
Local development configuration for Kisan GPT
Simplified setup without external dependencies
"""

import os
from typing import List, Dict, Any, Optional
from pydantic_settings import BaseSettings
import json


class LocalSettings(BaseSettings):
    """Local development settings"""
    
    # App Configuration
    APP_NAME: str = "Kisan GPT - Local Dev"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Database Configuration (disabled for local dev)
    MONGODB_URL: str = "sqlite:///./local_dev.db"  # Using SQLite for local dev
    MONGODB_DATABASE: str = "kisan_gpt_local"
    
    # API Keys (optional for testing)
    OPENWEATHER_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "local-dev-secret-key-not-for-production"
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
    LOG_FILE: str = "logs/kisan_gpt_local.log"
    
    # Security
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"]
    RATE_LIMIT_REQUESTS: int = 1000  # More generous for local dev
    RATE_LIMIT_PERIOD: int = 60
    
    # Community AI Settings
    ENABLE_COMMUNITY_SHARING: bool = False  # Disabled for local dev
    ANONYMIZE_DATA: bool = True
    MIN_USERS_FOR_COMMUNITY_MODEL: int = 5  # Lower threshold for testing
    
    model_config = {"env_file": ".env", "case_sensitive": True}


# Create global settings instance
settings = LocalSettings()

# Simple in-memory storage for local development
local_storage = {
    'users': {},
    'sessions': {},
    'predictions': {},
    'market_prices': {},
    'historical_yields': {}
}

# District and Soil Type Mappings (same as before)
DISTRICT_SOIL_MAPPING = {
    "pune": {"soil_type": "red_soil", "agro_zone": "western_maharashtra"},
    "mumbai": {"soil_type": "coastal_alluvium", "agro_zone": "konkan"},
    "nashik": {"soil_type": "black_soil", "agro_zone": "western_maharashtra"},
    "nagpur": {"soil_type": "black_soil", "agro_zone": "vidarbha"},
    "aurangabad": {"soil_type": "black_soil", "agro_zone": "marathwada"},
    "kolhapur": {"soil_type": "red_soil", "agro_zone": "western_maharashtra"},
    "bangalore": {"soil_type": "red_soil", "agro_zone": "southern_plateau"},
    "mysore": {"soil_type": "red_soil", "agro_zone": "southern_plateau"},
    "hubli": {"soil_type": "black_soil", "agro_zone": "northern_karnataka"},
    "mangalore": {"soil_type": "laterite", "agro_zone": "coastal_karnataka"},
    "ahmedabad": {"soil_type": "alluvial", "agro_zone": "middle_gujarat"},
    "surat": {"soil_type": "alluvial", "agro_zone": "south_gujarat"},
    "vadodara": {"soil_type": "black_soil", "agro_zone": "middle_gujarat"},
    "rajkot": {"soil_type": "black_soil", "agro_zone": "saurashtra"},
}

# Crop Season Mapping
CROP_SEASONS = {
    "kharif": {
        "months": [6, 7, 8, 9, 10],
        "crops": ["rice", "cotton", "sugarcane", "maize", "soybean", "groundnut"]
    },
    "rabi": {
        "months": [11, 12, 1, 2, 3],
        "crops": ["wheat", "gram", "pea", "mustard", "barley", "onion"]
    },
    "zaid": {
        "months": [4, 5, 6],
        "crops": ["watermelon", "muskmelon", "cucumber", "fodder_maize"]
    }
}

# Emotion Response Mapping
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