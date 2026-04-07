# 🚀 Enhanced KisanGPT System - Setup & API Guide

## Overview

This guide covers the enhanced agricultural services integrated into KisanGPT, including setup instructions and comprehensive API documentation for the new features.

## 🎯 Enhanced Features

### 1. **Soil Analysis System** 🌱
- **Satellite Data Integration**: SoilGrids and Bhuvan APIs
- **IoT Sensor Support**: Real-time soil monitoring
- **Comprehensive Analysis**: pH, moisture, nutrients, fertility index
- **Recommendations**: Soil management and improvement suggestions

### 2. **Crop Rotation Analysis** 🔄
- **Historical Analysis**: Past crop history evaluation
- **Sustainability Scoring**: Multi-factor sustainability assessment
- **Rotation Recommendations**: Optimal crop sequences
- **Impact Analysis**: Soil fertility and economic impact

### 3. **Market Linkage System** 💰
- **Real-time Pricing**: APMC, commodity exchange data
- **Price Forecasting**: ML-based price predictions
- **Market Demand Analysis**: Supply-demand trends
- **Price Alerts**: Farmer notification system

### 4. **Computer Vision System** 👁️
- **Disease Detection**: Advanced image analysis
- **Pest Identification**: Visual pest recognition
- **Plant Health Assessment**: Overall crop health scoring
- **Treatment Recommendations**: Targeted intervention advice

## 🛠️ Setup Instructions

### 1. Install Enhanced Dependencies

```bash
# Navigate to backend directory
cd backend

# Install enhanced requirements
pip install -r requirements_enhanced.txt
```

### 2. Environment Configuration

Create or update `.env` file with additional variables:

```env
# Existing variables...

# Enhanced Services Configuration
SOILGRIDS_API_BASE=https://rest.soilgrids.org
BHUVAN_API_KEY=your_bhuvan_api_key
WEATHER_ENHANCED_API_KEY=your_weather_api_key

# Database URLs for enhanced features
REDIS_URL=redis://localhost:6379
POSTGRES_ENHANCED_URL=postgresql://user:password@localhost/kisan_gpt_enhanced

# ML Model Paths
CROP_DISEASE_MODEL_PATH=./models/disease_detection/
PRICE_PREDICTION_MODEL_PATH=./models/price_forecasting/

# Computer Vision Settings
ENABLE_GPU_ACCELERATION=false
IMAGE_PROCESSING_TIMEOUT=30

# IoT Integration
IOT_MQTT_BROKER=localhost
IOT_MQTT_PORT=1883
IOT_DATA_RETENTION_DAYS=90

# Market Data Sources
ENABLE_APMC_SCRAPING=true
MARKET_DATA_CACHE_TTL=3600
PRICE_ALERT_EMAIL_ENABLED=false
```

### 3. Database Setup

```bash
# Start MongoDB (existing)
mongod --dbpath ./data/db

# Start Redis for enhanced caching
redis-server

# Optional: PostgreSQL for enhanced analytics
# Create database: kisan_gpt_enhanced
```

### 4. Run Enhanced System

```bash
# Start the enhanced KisanGPT system
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📡 Enhanced API Endpoints

### Base URL: `http://localhost:8000/api/v1/enhanced`

---

## 🌱 Soil Analysis APIs

### 1. Comprehensive Soil Analysis
**POST** `/soil/analyze`

```json
{
  "latitude": 18.5204,
  "longitude": 73.8567,
  "depth_interval": "0-5cm",
  "include_iot_data": true,
  "farm_id": "FARM_001"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "soil_properties": {
      "basic_properties": {
        "pH": 6.8,
        "moisture_capacity": 0.35,
        "bulk_density": 1.2,
        "organic_carbon": 1.8,
        "fertility_index": 72.5
      },
      "nutrients": {
        "nitrogen": {"value": 245, "status": "adequate"},
        "phosphorus": {"value": 18, "status": "low"},
        "potassium": {"value": 180, "status": "adequate"}
      }
    },
    "recommendations": {
      "priority_level": "medium",
      "actions": ["Add phosphorus fertilizer", "Maintain organic matter"],
      "estimated_cost": 2500.0
    },
    "confidence_score": 0.85
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Soil Health Trends
**GET** `/soil/trends?latitude=18.5204&longitude=73.8567&months=12`

---

## 🔄 Crop Rotation APIs

### 1. Rotation Analysis
**POST** `/rotation/analyze`

```json
{
  "farm_id": "FARM_001",
  "field_coordinates": {
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "years": 5
}
```

### 2. Rotation Recommendations
**POST** `/rotation/recommend`

```json
{
  "farm_id": "FARM_001",
  "current_crop": "wheat",
  "field_size_hectares": 2.5,
  "soil_type": "black_soil",
  "climate_zone": "semi_arid",
  "planning_years": 3
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "rotation_schedule": [
      {
        "year": 2024,
        "kharif": {"crop": "cotton", "variety": "Bt Cotton"},
        "rabi": {"crop": "wheat", "variety": "HD-2967"}
      }
    ],
    "sustainability_metrics": {
      "overall_sustainability_score": 78.5,
      "soil_health_impact": 8.2,
      "economic_viability": 7.8
    },
    "benefits": ["Improved soil nitrogen", "Pest break cycle"],
    "estimated_profit_increase": 15.2
  }
}
```

---

## 💰 Market Analysis APIs

### 1. Real-time Market Prices
**POST** `/market/prices`

```json
{
  "crop": "wheat",
  "state": "Maharashtra",
  "district": "Pune",
  "market": "Pune APMC"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "crop": "wheat",
    "current_price": 2150.0,
    "price_unit": "Rs/quintal",
    "market_analysis": {
      "price_trend": "rising",
      "volatility": "low",
      "market_sentiment": "positive"
    },
    "forecast": {
      "next_week": 2200.0,
      "next_month": 2180.0,
      "confidence": 0.78
    },
    "selling_recommendation": {
      "action": "hold",
      "reason": "Prices expected to rise further",
      "optimal_selling_window": "next week"
    }
  }
}
```

### 2. Market Demand Analysis
**POST** `/market/demand`

### 3. Price Alerts Setup
**POST** `/market/alerts`

```json
{
  "farm_id": "FARM_001",
  "crops": ["wheat", "cotton", "soybean"],
  "price_thresholds": {
    "wheat": {"min_alert": 2000, "max_alert": 2500},
    "cotton": {"min_alert": 5000, "max_alert": 6000}
  }
}
```

---

## 👁️ Computer Vision APIs

### 1. Image Analysis (Base64)
**POST** `/vision/analyze-image`

```json
{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "crop_type": "wheat",
  "analysis_type": "comprehensive"
}
```

### 2. Image Upload & Analysis
**POST** `/vision/upload-image`

Form data:
- `file`: Image file (JPG, PNG, etc.)
- `crop_type`: Crop type (optional)
- `analysis_type`: Analysis type (optional)

**Response:**
```json
{
  "status": "success",
  "data": {
    "analysis_results": {
      "diseases_detected": [
        {
          "name": "Leaf Rust",
          "confidence": 0.87,
          "severity": "moderate",
          "affected_area_percentage": 25.5
        }
      ],
      "pests_detected": [],
      "plant_health_score": 6.8,
      "overall_condition": "fair"
    },
    "treatment_recommendations": [
      {
        "treatment_type": "fungicide",
        "product_name": "Propiconazole 25% EC",
        "dosage": "1ml per liter",
        "application_method": "foliar_spray",
        "estimated_cost": 350.0
      }
    ],
    "upload_info": {
      "filename": "crop_image.jpg",
      "file_size_bytes": 245760
    }
  }
}
```

---

## 🔗 Combined Analysis API

### Comprehensive Farm Analysis
**POST** `/comprehensive-analysis`

```json
{
  "farm_id": "FARM_001",
  "field_coordinates": {
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "crops": ["wheat", "cotton"],
  "soil_analysis": true,
  "rotation_analysis": true,
  "market_analysis": true
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "farm_id": "FARM_001",
    "analyses_performed": ["soil_analysis", "rotation_analysis", "market_analysis"],
    "soil_analysis": { /* soil analysis results */ },
    "rotation_analysis": { /* rotation analysis results */ },
    "market_analysis": [ /* market analysis results */ ],
    "integrated_insights": [
      "🌱 Excellent soil fertility supports diverse crop options",
      "📈 Wheat prices are rising - good selling opportunity",
      "🔗 Multiple analysis factors considered for comprehensive recommendations"
    ]
  }
}
```

---

## 🏥 System Health & Monitoring

### 1. Health Check
**GET** `/health`

### 2. System Capabilities
**GET** `/capabilities`

**Response:**
```json
{
  "capabilities": {
    "soil_analysis": {
      "satellite_data_integration": true,
      "iot_sensor_support": true,
      "soil_grids_api": true,
      "bhuvan_api": true
    },
    "crop_rotation": {
      "historical_analysis": true,
      "sustainability_scoring": true,
      "rotation_recommendations": true
    },
    "market_analysis": {
      "real_time_prices": true,
      "price_forecasting": true,
      "apmc_integration": true
    },
    "computer_vision": {
      "disease_detection": true,
      "pest_detection": true,
      "treatment_recommendations": true
    }
  },
  "supported_formats": {
    "image_formats": ["jpg", "jpeg", "png", "bmp", "tiff"],
    "soil_depths": ["0-5cm", "5-15cm", "15-30cm", "30-60cm"],
    "analysis_types": ["disease", "pest", "health", "comprehensive"]
  }
}
```

---

## 🧪 Testing the Enhanced System

### 1. Quick Health Check
```bash
curl http://localhost:8000/api/v1/enhanced/health
```

### 2. Test Soil Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/enhanced/soil/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "depth_interval": "0-5cm"
  }'
```

### 3. Test Market Prices
```bash
curl -X POST "http://localhost:8000/api/v1/enhanced/market/prices" \
  -H "Content-Type: application/json" \
  -d '{
    "crop": "wheat",
    "district": "pune"
  }'
```

### 4. Test Image Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/enhanced/vision/upload-image" \
  -F "file=@crop_image.jpg" \
  -F "crop_type=wheat" \
  -F "analysis_type=disease"
```

---

## 📊 Integration with Existing System

The enhanced APIs seamlessly integrate with the existing KisanGPT system:

1. **Backward Compatibility**: All existing APIs continue to work unchanged
2. **Unified Authentication**: Uses the same JWT authentication system
3. **Consistent Response Format**: Follows the established API response patterns
4. **Shared Database**: Integrates with existing MongoDB and PostgreSQL databases
5. **Cross-Service Communication**: Enhanced services can be called from existing voice/text interfaces

---

## 🔧 Production Deployment Notes

### 1. Scaling Considerations
- Use Redis for caching market data and API responses
- Implement rate limiting for computer vision APIs
- Use background tasks (Celery) for heavy processing

### 2. Security
- API key validation for external service calls
- Input sanitization for image uploads
- Rate limiting on resource-intensive endpoints

### 3. Monitoring
- Health check endpoints for service monitoring
- Logging integration with existing system
- Performance metrics tracking

---

## 📞 Support & Documentation

- **Interactive API Docs**: http://localhost:8000/api/docs
- **Alternative Docs**: http://localhost:8000/api/redoc
- **Health Status**: http://localhost:8000/api/v1/enhanced/health
- **System Capabilities**: http://localhost:8000/api/v1/enhanced/capabilities

---

## 🎉 What's Next?

The enhanced system provides a solid foundation for advanced agricultural intelligence. Future enhancements could include:

- Advanced satellite imagery analysis
- IoT sensor network integration
- Blockchain-based supply chain tracking
- AI-powered crop yield optimization
- Community knowledge sharing features

---

**Happy Farming with Enhanced KisanGPT! 🚜🌾**