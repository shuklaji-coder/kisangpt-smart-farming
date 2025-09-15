"""
Kisan GPT - The Emotional Agronomist
Main FastAPI application
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import init_database
from app.api.routes import voice, text, location, crop, disease, market, reply
from app.core.logging_config import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting Kisan GPT application")
    await init_database()
    logger.info("Database initialized")
    
    # Create necessary directories
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.TTS_CACHE_DIR, exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    yield
    
    # Shutdown
    logger.info("Shutting down Kisan GPT application")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual emotional AI assistant for farmers",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(voice.router, prefix="/api/v1/voice")
app.include_router(text.router, prefix="/api/v1/text")
app.include_router(location.router, prefix="/api/v1/location")
app.include_router(crop.router, prefix="/api/v1/crop")
app.include_router(disease.router, prefix="/api/v1/disease")
app.include_router(market.router, prefix="/api/v1/market")
app.include_router(reply.router, prefix="/api/v1/reply")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with basic info"""
    return {
        "message": "Welcome to Kisan GPT - The Emotional Agronomist",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )