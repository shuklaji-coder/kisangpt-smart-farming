"""
Kisan GPT - Simplified Railway Deployment Version
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Simple settings
class SimpleSettings:
    APP_NAME = "Kisan GPT"
    APP_VERSION = "1.0.0"
    DEBUG = False
    HOST = "0.0.0.0"
    PORT = int(os.getenv("PORT", 8000))
    CORS_ORIGINS = ["*"]  # Allow all origins for now

settings = SimpleSettings()

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

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with basic info"""
    return {
        "message": "Welcome to Kisan GPT - The Emotional Agronomist",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health",
        "status": "Railway deployment ready"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "railway_production"
    }

# Simple test endpoint
@app.get("/api/v1/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {
        "message": "API is working!",
        "status": "success"
    }

# Mock Authentication Endpoints
@app.post("/api/auth/login")
async def login(request: dict = {}):
    """Mock login endpoint"""
    email = request.get('email', '')
    password = request.get('password', '')
    
    # Simple mock validation
    if email and password:
        return {
            "success": True,
            "message": "Login successful",
            "token": "mock-jwt-token-12345",
            "user": {
                "id": "user123",
                "name": "Test User",
                "email": email,
                "role": "farmer"
            }
        }
    else:
        return {
            "success": False,
            "message": "Invalid credentials"
        }

@app.post("/api/auth/register")
async def register(request: dict = {}):
    """Mock registration endpoint"""
    name = request.get('name', '')
    email = request.get('email', '')
    password = request.get('password', '')
    
    if name and email and password:
        return {
            "success": True,
            "message": "Registration successful",
            "token": "mock-jwt-token-12345",
            "user": {
                "id": "user123",
                "name": name,
                "email": email,
                "role": "farmer"
            }
        }
    else:
        return {
            "success": False,
            "message": "Missing required fields"
        }

@app.get("/api/auth/me")
async def get_current_user():
    """Mock current user endpoint"""
    return {
        "success": True,
        "user": {
            "id": "user123",
            "name": "Test User",
            "email": "test@example.com",
            "role": "farmer"
        }
    }

@app.get("/api/health")
async def api_health():
    """API health endpoint (different from root health)"""
    return {
        "status": "healthy",
        "service": "api",
        "version": settings.APP_VERSION
    }

# Simple crop recommendation (mock data for now)
@app.post("/api/v1/crop/recommend")
async def recommend_crops(request: dict = {}):
    """Simple crop recommendation with mock data"""
    district = request.get('district', 'pune')
    season = request.get('season', 'kharif')
    
    mock_recommendations = [
        {
            "crop": "rice",
            "success_probability": 0.85,
            "reason": "Suitable for current season and soil conditions"
        },
        {
            "crop": "wheat",
            "success_probability": 0.78,
            "reason": "Good market demand and weather conditions"
        }
    ]
    
    return {
        "success": True,
        "district": district,
        "season": season,
        "recommendations": mock_recommendations,
        "message": f"Mock recommendations for {district} district"
    }

if __name__ == "__main__":
    import uvicorn
    print(f"🌾 Starting Kisan GPT Railway Server on port {settings.PORT}...")
    uvicorn.run(
        "main_railway:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level="info"
    )