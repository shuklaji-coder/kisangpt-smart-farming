# 🚀 Kisan GPT - Quick Start Guide

## ⚡ **1-Minute Setup**

### **Option A: Windows PowerShell (Recommended)**
```powershell
# Run the automated setup script
PowerShell -ExecutionPolicy Bypass -File setup.ps1
```

### **Option B: Manual Setup**
```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit API keys (required for full functionality)
notepad .env  # Add your OpenWeatherMap API key

# 3. Start all services
docker-compose up --build -d

# 4. Check status
docker-compose ps
```

## 🌐 **Access Points**

Once running, access your Kisan GPT services:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React farmer interface |
| **Backend API** | http://localhost:8000 | FastAPI backend |
| **API Docs** | http://localhost:8000/api/docs | Interactive API documentation |
| **MongoDB** | localhost:27017 | Database (internal) |

## 🧪 **Test the System**

### **1. Test Voice Analysis**
```bash
curl -X POST "http://localhost:8000/api/v1/voice/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "audio_file=@sample_audio.wav" \
  -F "user_id=test_farmer" \
  -F "lat=18.5204" \
  -F "lng=73.8567"
```

### **2. Test Text Analysis**
```bash
curl -X POST "http://localhost:8000/api/v1/text/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "मेरी फसल में कोई समस्या तो नहीं है?",
    "user_id": "test_farmer"
  }'
```

### **3. Test Crop Recommendations**
```bash
curl -X POST "http://localhost:8000/api/v1/crop/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "pune",
    "soil_type": "red_soil",
    "season": "kharif"
  }'
```

### **4. Test Disease Prediction**
```bash
curl -X POST "http://localhost:8000/api/v1/disease/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "pune",
    "crop": "tomato",
    "current_weather": {
      "temperature": 28,
      "humidity": 85,
      "rainfall": 10
    },
    "forecast_horizon_days": 14
  }'
```

### **5. Test Location & Weather**
```bash
curl -X GET "http://localhost:8000/api/v1/location/info?lat=18.5204&lng=73.8567"
```

## ✅ **System Status Check**

Run health checks to verify all services:

```bash
# Overall health
curl http://localhost:8000/health

# Voice services
curl -X POST http://localhost:8000/api/v1/voice/test-connection

# Text services  
curl -X POST http://localhost:8000/api/v1/text/test-connection

# Location services
curl -X POST http://localhost:8000/api/v1/location/test-services

# Crop ML services
curl -X POST http://localhost:8000/api/v1/crop/test-service
```

## 🔧 **Essential Configuration**

### **Required API Keys**
Add these to your `.env` file for full functionality:

```env
# Weather data (highly recommended)
OPENWEATHER_API_KEY=your_api_key_here

# Maps and geocoding (optional)
GOOGLE_MAPS_API_KEY=your_api_key_here

# Security (change in production)
JWT_SECRET_KEY=your-secure-secret-key
```

### **Get API Keys**
- **OpenWeatherMap**: [Sign up here](https://openweathermap.org/api) (Free tier: 1000 calls/day)
- **Google Maps**: [Get key here](https://console.cloud.google.com/) (Free tier: $200 credit)

## 📊 **Core Features Working**

✅ **Voice Analysis**: Speech-to-text in Hindi/Marathi/English  
✅ **Emotion Detection**: Stress/worry/confident/neutral classification  
✅ **Location Intelligence**: GPS/IP detection + weather data  
✅ **Crop Recommendations**: ML-powered suggestions with success probabilities  
✅ **Disease Prediction**: 18+ disease models with 2-3 week early warnings  
✅ **Market Forecasting**: Price predictions with optimal sell windows  
✅ **Multilingual Support**: Automatic language detection and responses  

## 🛠️ **Troubleshooting**

### **Services not starting?**
```bash
# Check Docker status
docker --version
docker-compose --version

# View logs
docker-compose logs -f backend

# Restart services
docker-compose restart
```

### **API returning errors?**
```bash
# Check backend logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend python -c "from app.core.database import init_database; import asyncio; asyncio.run(init_database())"
```

### **Need to reset everything?**
```bash
# Stop all services
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v

# Rebuild from scratch
docker-compose up --build -d
```

## 📱 **Demo Scenarios**

### **Farmer Stress Scenario**
```json
{
  "text": "मुझे बहुत चिंता हो रही है, फसल खराब हो रही है",
  "user_id": "worried_farmer"
}
```
**Expected**: Emotion = "stress", Simple empathetic response with urgent help

### **Confident Farmer Scenario**  
```json
{
  "text": "इस बार अच्छी फसल होगी, नई तकनीक अपनाई है",
  "user_id": "confident_farmer"
}
```
**Expected**: Emotion = "confident", Detailed technical recommendations

### **Crop Planning Scenario**
```json
{
  "district": "nashik",
  "soil_type": "black_soil", 
  "season": "kharif"
}
```
**Expected**: Top 3 crops with probabilities, reasoning, practices

### **Disease Alert Scenario**
```json
{
  "crop": "rice",
  "current_weather": {"humidity": 90, "temperature": 25, "rainfall": 15}
}
```
**Expected**: High risk for rice blast, specific preventive actions

## 🎯 **Next Steps**

1. **Add your API keys** to `.env` for full weather functionality
2. **Test core workflows** using the examples above
3. **Explore the API documentation** at http://localhost:8000/api/docs
4. **Check logs** if anything doesn't work as expected
5. **Deploy to cloud** when ready for production

## 🆘 **Need Help?**

- **View logs**: `docker-compose logs -f [service_name]`
- **API docs**: http://localhost:8000/api/docs  
- **Health check**: http://localhost:8000/health
- **Stop services**: `docker-compose down`
- **Restart**: `docker-compose restart`

---

**🌾 Your AI-powered agricultural assistant is ready! Happy farming! 🚀**