# Kisan GPT - The Emotional Agronomist 🌾🤖

An AI-powered agricultural assistant that understands farmers' emotions through voice and text, providing personalized crop recommendations, disease predictions, and market forecasts in Hindi, Marathi, and English.

## 🌟 Features

### Core Capabilities
- **🎤 Voice + Emotion Analysis**: Process audio input with speech-to-text, detect emotional state (stress/worry/confident/neutral)
- **🌍 Location Intelligence**: Auto-detect location, fetch real-time weather, soil type mapping
- **🌱 Smart Crop Recommendations**: ML-based suggestions using RandomForest/XGBoost with success probabilities
- **🦠 Disease Prediction**: Early warning system for crop diseases with preventive actions
- **📈 Market Forecasting**: Price prediction using time-series analysis (Prophet/ARIMA)
- **🗣️ Multilingual TTS**: Text-to-speech responses in Hindi/Marathi/English
- **❤️ Emotional AI**: Adaptive responses based on farmer's psychological state

### Technical Architecture
- **Frontend**: React with i18n support, farmer-friendly UI
- **Backend**: FastAPI with async capabilities
- **Database**: MongoDB for user data, PostgreSQL for time-series data
- **ML Models**: scikit-learn, XGBoost, Prophet for predictions
- **Speech**: Google Speech Recognition + offline fallback
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for development)
- Node.js 18+ (for frontend development)
- MongoDB (included in Docker setup)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd kisan-gpt
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env
```

Required API keys:
- `OPENWEATHER_API_KEY`: Get from [OpenWeatherMap](https://openweathermap.org/api)
- `GOOGLE_MAPS_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/)

### 3. Run with Docker (Recommended)
```bash
# Start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **MongoDB**: localhost:27017

## 🛠️ Development Setup

### Backend Development
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 📊 API Endpoints

### Core Analysis
- `POST /api/v1/voice/analyze` - Voice analysis (emotion + transcript)
- `POST /api/v1/text/analyze` - Text analysis (emotion + language)

### Agricultural Intelligence
- `GET /api/v1/location/info` - Location + weather data
- `POST /api/v1/crop/recommend` - Crop recommendations
- `POST /api/v1/disease/predict` - Disease risk prediction
- `GET /api/v1/market/forecast` - Price forecasting

### Response Generation
- `POST /api/v1/reply/generate` - Generate multilingual responses with TTS

### Example Usage

#### Voice Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/voice/analyze" \
  -H "Content-Type: multipart/form-data" \
  -F "audio_file=@sample_audio.wav" \
  -F "user_id=farmer_123" \
  -F "lat=18.5204" \
  -F "lng=73.8567"
```

#### Text Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/text/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "मेरी फसल में समस्या हो रही है",
    "user_id": "farmer_123"
  }'
```

#### Crop Recommendations
```bash
curl -X POST "http://localhost:8000/api/v1/crop/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "district": "pune",
    "soil_type": "red_soil",
    "season": "kharif"
  }'
```

## 📁 Project Structure

```
kisan-gpt/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/routes/        # API endpoints
│   │   ├── core/              # Configuration & database
│   │   ├── models/            # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── main.py           # Application entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Main pages
│   │   ├── services/         # API integration
│   │   └── utils/            # Helper functions
│   ├── public/
│   └── package.json
├── models/                     # ML models and training
│   ├── training/              # Training scripts
│   └── saved_models/          # Trained models
├── data/                       # Sample datasets
│   ├── raw/                   # Raw historical data
│   ├── processed/             # Processed datasets
│   └── sample_audio/          # Demo audio files
├── tests/                      # Test files
├── deployment/                 # Deployment configurations
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🤖 ML Models & Features

### 1. Emotion Detection
- **Multilingual**: Hindi, Marathi, English support
- **Multi-modal**: Text + audio features
- **Methods**: VADER sentiment, keyword matching, transformers
- **Output**: 4 emotions (stress, worry, confident, neutral) with confidence scores

### 2. Crop Recommendation
- **Algorithm**: RandomForest/XGBoost classifier
- **Features**: Weather, soil type, historical yields, season
- **Output**: Top 3 crops with success probability + reasoning

### 3. Disease Prediction
- **Approach**: Rule-based + weather pattern analysis
- **Horizon**: 2-3 weeks early warning
- **Output**: Risk level + preventive actions + timing

### 4. Price Forecasting
- **Models**: Prophet, ARIMA for time-series
- **Data**: Historical prices + sentiment analysis
- **Output**: Price forecast + optimal sell window

## 🌐 Multilingual Support

### Supported Languages
- **Hindi (हिंदी)**: Primary language for most farmers
- **Marathi (मराठी)**: Maharashtra regional support
- **English**: Urban and educated farmers

### Language Detection
- Automatic detection from voice/text input
- Script-based heuristics (Devanagari vs Latin)
- Character-level analysis for Hindi/Marathi distinction

### Response Generation
- Emotion-adaptive tone (empathetic for stress, detailed for confident)
- Simple language for stressed users, technical details for confident users
- Cultural context and local farming practices

## 📱 Farmer-Friendly UI

### Design Principles
- **Large, clear fonts** for readability
- **Voice-first interaction** with big "Speak" button
- **Simple navigation** with minimal steps
- **Offline fallback** messages
- **Visual crop indicators** and weather icons

### Emotional Adaptivity
- **Stressed farmers**: Simple instructions, urgent helpline contacts
- **Confident farmers**: Detailed technical information
- **Worried farmers**: Reassuring tone, step-by-step guidance

## 🔒 Privacy & Security

### Data Protection
- **Opt-in consent** for data sharing
- **Anonymization** of village-level data
- **Encryption** of personal information
- **JWT authentication** for API access

### Community AI
- Village-level models trained on aggregated, anonymous data
- Minimum 50 users before community model activation
- Local insights while preserving individual privacy

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

### Sample Data
- **Audio files**: 10 samples in Hindi/Marathi/English in `data/sample_audio/`
- **Historical data**: CSV files in `data/raw/`
- **Demo script**: End-to-end farmer interaction examples

## 🚀 Deployment

### Production Setup
1. **Environment**: Copy `.env.example` to `.env` and configure production values
2. **SSL**: Add certificates to `deployment/nginx/ssl/`
3. **Domain**: Update `deployment/nginx/nginx.conf`
4. **Deploy**: `docker-compose -f docker-compose.prod.yml up -d`

### Cloud Deployment
- **AWS**: ECS, RDS, S3 for file storage
- **GCP**: Cloud Run, Cloud SQL, Cloud Storage
- **Render**: One-click deployment support

### Monitoring
- Application health checks in Docker Compose
- Log aggregation with structured logging
- Error tracking and performance monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with tests
4. Run tests: `pytest` and `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Submit Pull Request

### Code Standards
- **Python**: Black formatting, type hints, docstrings
- **JavaScript**: ESLint, Prettier formatting
- **API**: OpenAPI documentation
- **Tests**: Unit tests for all business logic

## 📞 Support

### Documentation
- **API Docs**: http://localhost:8000/api/docs
- **Frontend Guide**: `frontend/README.md`
- **Model Training**: `models/README.md`

### Community
- **Issues**: GitHub Issues for bug reports
- **Discussions**: Feature requests and questions
- **Wiki**: Detailed guides and examples

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Voice + emotion analysis
- ✅ Basic crop recommendations
- ✅ Multilingual support
- ✅ Docker deployment

### Phase 2 (Next)
- 🔄 Advanced ML models
- 🔄 WhatsApp integration
- 🔄 Satellite imagery analysis
- 🔄 Community features

### Phase 3 (Future)
- 📋 IoT sensor integration
- 📋 Blockchain for supply chain
- 📋 Government scheme integration
- 📋 Cooperative farming features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenWeatherMap for weather data
- Google Speech Recognition for multilingual speech processing
- Hugging Face for transformer models
- MongoDB and FastAPI communities
- Indian agricultural research institutes for domain knowledge

---

**Made with ❤️ for India's farmers** 🇮🇳🌾

For questions or support, please open an issue or contact the development team.