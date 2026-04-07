"""
Kisan GPT - Render.com Deployment Version
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Settings for Render deployment
class Settings:
    APP_NAME = "Kisan GPT"
    APP_VERSION = "1.0.0"
    DEBUG = False
    HOST = "0.0.0.0"
    PORT = int(os.getenv("PORT", 8000))
    # Allow all origins for now, can be restricted later
    CORS_ORIGINS = ["*"]

settings = Settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual emotional AI assistant for farmers",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request validation
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class CropRequest(BaseModel):
    district: Optional[str] = "pune"
    season: Optional[str] = "kharif"

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with basic info"""
    return {
        "message": "🌾 Welcome to Kisan GPT - The Emotional Agronomist",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health",
        "status": "Render.com deployment ready",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "render_production",
        "port": settings.PORT
    }

# Simple test endpoint
@app.get("/api/v1/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {
        "message": "✅ API is working perfectly!",
        "status": "success",
        "timestamp": "2024-01-01T00:00:00Z"
    }

# Mock Authentication Endpoints
@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Mock login endpoint with proper validation"""
    email = request.email.strip()
    password = request.password.strip()
    
    # Simple mock validation
    if email and password and len(password) >= 3:
        return {
            "success": True,
            "message": "Login successful! 🎉",
            "token": f"mock-jwt-token-{email[:5]}",
            "user": {
                "id": f"user_{email[:8]}",
                "name": email.split("@")[0].title(),
                "email": email,
                "role": "farmer",
                "avatar": None
            }
        }
    else:
        return {
            "success": False,
            "message": "❌ Invalid credentials. Please check email and password."
        }

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Mock registration endpoint with proper validation"""
    name = request.name.strip()
    email = request.email.strip()
    password = request.password.strip()
    
    if name and email and password and len(password) >= 3:
        return {
            "success": True,
            "message": "Registration successful! 🎉 Welcome to Kisan GPT!",
            "token": f"mock-jwt-token-{email[:5]}",
            "user": {
                "id": f"user_{email[:8]}",
                "name": name,
                "email": email,
                "role": "farmer",
                "avatar": None,
                "created_at": "2024-01-01T00:00:00Z"
            }
        }
    else:
        return {
            "success": False,
            "message": "❌ Missing required fields. Please provide name, email and password (min 3 chars)."
        }

@app.get("/api/auth/me")
async def get_current_user():
    """Mock current user endpoint"""
    return {
        "success": True,
        "user": {
            "id": "user123",
            "name": "Test Farmer",
            "email": "farmer@example.com",
            "role": "farmer",
            "avatar": None,
            "location": {
                "district": "Pune",
                "state": "Maharashtra"
            }
        }
    }

@app.get("/api/health")
async def api_health():
    """API health endpoint (different from root health)"""
    return {
        "status": "healthy",
        "service": "api",
        "version": settings.APP_VERSION,
        "endpoints": ["auth", "crop", "health"],
        "uptime": "running"
    }

# Simple crop recommendation (mock data for now)
@app.post("/api/v1/crop/recommend")
async def recommend_crops(request: CropRequest):
    """Simple crop recommendation with mock data"""
    district = request.district.lower()
    season = request.season.lower()
    
    # Mock recommendations based on district and season
    mock_recommendations = []
    
    if season == "kharif":
        mock_recommendations = [
            {
                "crop": "Rice 🌾",
                "success_probability": 0.87,
                "reason": "Perfect for monsoon season and clayey soil",
                "expected_yield": "3.5-4.2 tons/hectare",
                "market_price": "₹2,100-2,400/quintal"
            },
            {
                "crop": "Cotton 🌱",
                "success_probability": 0.78,
                "reason": "High demand and suitable weather conditions",
                "expected_yield": "2.8-3.5 tons/hectare", 
                "market_price": "₹5,800-6,200/quintal"
            },
            {
                "crop": "Sugarcane 🎋",
                "success_probability": 0.72,
                "reason": "Good water availability and soil fertility",
                "expected_yield": "65-75 tons/hectare",
                "market_price": "₹340-380/quintal"
            }
        ]
    else:  # rabi season
        mock_recommendations = [
            {
                "crop": "Wheat 🌾",
                "success_probability": 0.85,
                "reason": "Excellent winter crop with high market demand",
                "expected_yield": "4.2-4.8 tons/hectare",
                "market_price": "₹2,250-2,550/quintal"
            },
            {
                "crop": "Mustard 🌻",
                "success_probability": 0.79,
                "reason": "Low water requirement and good oil content",
                "expected_yield": "1.8-2.2 tons/hectare",
                "market_price": "₹5,200-5,800/quintal"
            }
        ]
    
    return {
        "success": True,
        "district": district.title(),
        "season": season.title(),
        "recommendations": mock_recommendations,
        "message": f"🌱 Top crop recommendations for {district.title()} district in {season} season",
        "generated_at": "2024-01-01T00:00:00Z"
    }

# Weather-based advisory (mock)
@app.get("/api/v1/weather/advisory")
async def weather_advisory():
    """Mock weather advisory endpoint"""
    return {
        "success": True,
        "advisory": {
            "current_weather": "Partly cloudy, 28°C",
            "forecast": "Light rain expected in next 2-3 days",
            "farming_tips": [
                "🌧️ Prepare for light irrigation due to expected rainfall",
                "🌱 Good time for transplanting rice seedlings",
                "🐛 Monitor crops for pest activity after rain"
            ],
            "alerts": [
                "⚠️ Heavy rainfall alert for next weekend"
            ]
        },
        "location": "Pune, Maharashtra",
        "updated_at": "2024-01-01T00:00:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    print(f"🌾 Starting Kisan GPT Render Server on port {settings.PORT}...")
    uvicorn.run(
        "main_render:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level="info"
    )