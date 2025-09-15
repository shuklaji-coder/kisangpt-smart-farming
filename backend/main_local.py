"""
Kisan GPT - Local Development Server
Simplified version without external dependencies for testing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Import local configuration
from app.core.config_local import settings, local_storage

# Create FastAPI app
app = FastAPI(
    title="Kisan GPT - Local Dev",
    description="Multilingual emotional AI assistant for farmers (Local Development)",
    version="1.0.0-local",
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

# Create static directory if it doesn't exist
os.makedirs("static", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with basic info"""
    return {
        "message": "Welcome to Kisan GPT - The Emotional Agronomist (Local Dev)",
        "version": "1.0.0-local",
        "docs": "/api/docs",
        "health": "/health",
        "status": "running_locally"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": "Kisan GPT - Local Dev",
        "version": "1.0.0-local",
        "environment": "local_development",
        "database": "in_memory",
        "external_apis": "mock_data"
    }

# Simple text analysis endpoint
@app.post("/api/v1/text/analyze")
async def analyze_text(request: dict):
    """Simple text analysis for testing"""
    text = request.get('text', '')
    user_id = request.get('user_id', 'unknown')
    
    # Simple emotion detection based on keywords
    emotion = "neutral"
    emotion_score = 0.6
    
    stress_words = ['चिंता', 'परेशान', 'समस्या', 'tension', 'problem', 'worry']
    confident_words = ['अच्छा', 'खुश', 'सफल', 'good', 'happy', 'success']
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in stress_words):
        emotion = "stress"
        emotion_score = 0.8
    elif any(word in text_lower for word in confident_words):
        emotion = "confident"
        emotion_score = 0.7
    
    # Simple language detection
    language = "hi"  # Default to Hindi
    if any(ord(char) > 2304 and ord(char) < 2431 for char in text):
        language = "hi"  # Devanagari script
    elif text.isascii():
        language = "en"
    
    # Store in local storage
    session_id = str(uuid.uuid4())
    local_storage['sessions'][session_id] = {
        'user_id': user_id,
        'text': text,
        'emotion': emotion,
        'language': language,
        'timestamp': datetime.now().isoformat()
    }
    
    return {
        "success": True,
        "language": language,
        "emotion": emotion,
        "emotion_score": emotion_score,
        "sentiment": 0.1 if emotion == "confident" else -0.2 if emotion == "stress" else 0.0,
        "message": "Text analysis completed (local dev mode)"
    }

# Simple crop recommendation endpoint
@app.post("/api/v1/crop/recommend")
async def recommend_crops(request: dict):
    """Simple crop recommendation for testing"""
    district = request.get('district', 'pune')
    soil_type = request.get('soil_type', 'red_soil')
    season = request.get('season', 'kharif')
    
    # Simple recommendations based on season
    season_crops = {
        'kharif': [
            {'crop': 'rice', 'success_probability': 0.85, 'reason': 'Monsoon season ideal for rice cultivation'},
            {'crop': 'cotton', 'success_probability': 0.78, 'reason': 'Good cotton growing season with adequate rainfall'},
            {'crop': 'maize', 'success_probability': 0.72, 'reason': 'Suitable weather conditions for maize'}
        ],
        'rabi': [
            {'crop': 'wheat', 'success_probability': 0.82, 'reason': 'Winter season perfect for wheat cultivation'},
            {'crop': 'gram', 'success_probability': 0.75, 'reason': 'Cool weather ideal for gram crops'},
            {'crop': 'onion', 'success_probability': 0.70, 'reason': 'Good market demand and suitable climate'}
        ],
        'zaid': [
            {'crop': 'maize', 'success_probability': 0.68, 'reason': 'Summer crop with irrigation support'},
            {'crop': 'groundnut', 'success_probability': 0.65, 'reason': 'Heat resistant crop suitable for summer'},
            {'crop': 'vegetables', 'success_probability': 0.60, 'reason': 'Short duration crops for quick returns'}
        ]
    }
    
    recommendations = season_crops.get(season, season_crops['kharif'])
    
    # Add recommended practices
    for rec in recommendations:
        rec['recommended_practices'] = [
            'Use certified seeds',
            'Apply balanced fertilizer',
            'Monitor for pests regularly',
            'Ensure proper irrigation'
        ]
    
    return {
        "success": True,
        "recommendations": recommendations,
        "message": f"Crop recommendations for {district} district ({season} season)"
    }

# Simple location info endpoint
@app.get("/api/v1/location/info")
async def get_location_info(lat: Optional[float] = None, lng: Optional[float] = None):
    """Simple location info for testing"""
    
    # Mock weather data
    mock_weather = {
        "temperature": 28.5,
        "humidity": 65,
        "rainfall": 0,
        "description": "Partly Cloudy",
        "wind_speed": 3.2
    }
    
    mock_forecast = [
        {"date": "2024-01-15", "temp_max": 30, "temp_min": 20, "rainfall": 0},
        {"date": "2024-01-16", "temp_max": 32, "temp_min": 22, "rainfall": 2.5},
        {"date": "2024-01-17", "temp_max": 29, "temp_min": 19, "rainfall": 0}
    ]
    
    return {
        "success": True,
        "district": "pune",
        "soil_type": "red_soil", 
        "agro_zone": "western_maharashtra",
        "weather_current": mock_weather,
        "weather_forecast": mock_forecast,
        "message": "Location info retrieved (mock data for local dev)"
    }

# Simple disease prediction endpoint
@app.post("/api/v1/disease/predict")
async def predict_disease(request: dict):
    """Simple disease prediction for testing"""
    crop = request.get('crop', 'tomato')
    weather = request.get('current_weather', {})
    
    humidity = weather.get('humidity', 60)
    temperature = weather.get('temperature', 25)
    
    # Simple risk assessment
    risks = []
    
    if humidity > 80:
        risks.append({
            "disease": f"{crop}_fungal_disease",
            "risk_level": "high",
            "days_until_expected": 7,
            "preventive_action": "Apply fungicide spray immediately. Improve ventilation."
        })
    elif humidity > 70:
        risks.append({
            "disease": f"{crop}_moderate_risk",
            "risk_level": "medium", 
            "days_until_expected": 10,
            "preventive_action": "Monitor crop closely. Prepare preventive measures."
        })
    
    if not risks:
        risks.append({
            "disease": f"{crop}_general_monitoring",
            "risk_level": "low",
            "days_until_expected": 14,
            "preventive_action": "Continue regular monitoring. Maintain good practices."
        })
    
    return {
        "success": True,
        "risks": risks,
        "message": "Disease risk assessment completed (local dev mode)"
    }

# Simple market forecast endpoint  
@app.get("/api/v1/market/forecast")
async def market_forecast(crop: str = "rice", district: str = "pune"):
    """Simple market forecast for testing"""
    
    # Mock price data
    base_price = {"rice": 2800, "wheat": 2200, "onion": 1800}.get(crop, 2500)
    
    forecasted_prices = []
    for i in range(1, 8):  # 7 days
        date = f"2024-01-{14+i:02d}"
        price_variation = 1 + (i * 0.01)  # Small price increase
        price = base_price * price_variation
        
        forecasted_prices.append({
            "date": date,
            "price": round(price, 2)
        })
    
    return {
        "success": True,
        "forecasted_prices": forecasted_prices,
        "recommended_sell_window": {
            "start": "2024-01-18",
            "end": "2024-01-22"
        },
        "confidence": 0.75,
        "message": "Market forecast generated (mock data for local dev)"
    }

if __name__ == "__main__":
    import uvicorn
    print("🌾 Starting Kisan GPT Local Development Server...")
    print(f"📍 Server will be available at: http://{settings.HOST}:{settings.PORT}")
    print(f"📖 API Documentation: http://{settings.HOST}:{settings.PORT}/api/docs")
    print("🔧 Running in LOCAL DEVELOPMENT mode with mock data")
    
    uvicorn.run(
        "main_local:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )