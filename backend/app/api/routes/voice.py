"""
Voice analysis API routes
Handles voice input, speech-to-text, language detection, and emotion analysis
"""

import os
import uuid
import tempfile
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from loguru import logger

from app.models.schemas import VoiceAnalysisResponse, EmotionType, LanguageType
from app.services.speech_service import SpeechAnalysisService
from app.services.emotion_service import EmotionAnalysisService
from app.core.config import settings
from app.core.database import get_sessions_collection
from datetime import datetime

router = APIRouter()

# Initialize services
speech_service = SpeechAnalysisService()
emotion_service = EmotionAnalysisService()


@router.post("/voice/analyze", response_model=VoiceAnalysisResponse)
async def analyze_voice(
    audio_file: UploadFile = File(...),
    user_id: str = Form(...),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None)
):
    """
    Analyze voice input for language, emotion, and transcript
    
    Args:
        audio_file: Audio file (wav, mp3, ogg, m4a)
        user_id: User identifier
        lat: Optional GPS latitude
        lng: Optional GPS longitude
        
    Returns:
        VoiceAnalysisResponse with language, emotion, transcript
    """
    try:
        # Validate file format
        if not audio_file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
            
        file_extension = audio_file.filename.split('.')[-1].lower()
        if file_extension not in settings.ALLOWED_AUDIO_FORMATS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported audio format. Allowed formats: {settings.ALLOWED_AUDIO_FORMATS}"
            )
        
        # Check file size
        file_content = await audio_file.read()
        if len(file_content) > settings.MAX_AUDIO_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_AUDIO_FILE_SIZE} bytes"
            )
        
        # Save temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Perform speech-to-text
            logger.info(f"Processing audio file for user {user_id}")
            speech_result = await speech_service.transcribe_audio(temp_file_path)
            
            if not speech_result or not speech_result.get('transcript'):
                raise HTTPException(
                    status_code=422,
                    detail="Could not transcribe audio. Please ensure clear audio quality."
                )
            
            transcript = speech_result['transcript']
            detected_language = speech_result.get('language', 'hi')  # Default to Hindi
            
            # Validate detected language
            if detected_language not in [lang.value for lang in LanguageType]:
                detected_language = 'hi'  # Fallback to Hindi
            
            # Perform emotion analysis
            emotion_result = await emotion_service.analyze_emotion(
                text=transcript,
                audio_path=temp_file_path
            )
            
            emotion = emotion_result.get('emotion', 'neutral')
            emotion_score = emotion_result.get('confidence', 0.5)
            
            # Validate emotion
            if emotion not in [e.value for e in EmotionType]:
                emotion = 'neutral'  # Fallback to neutral
            
            # Store session data
            session_data = {
                "session_id": str(uuid.uuid4()),
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "input_type": "voice",
                "transcript": transcript,
                "emotion": emotion,
                "language": detected_language,
                "location": {"lat": lat, "lng": lng} if lat and lng else None,
                "audio_duration": speech_result.get('duration', 0),
                "audio_quality_score": speech_result.get('quality_score', 0.5)
            }
            
            # Save to database
            sessions_collection = get_sessions_collection()
            await sessions_collection.insert_one(session_data)
            
            logger.info(f"Voice analysis completed for user {user_id}: {emotion} ({emotion_score:.2f})")
            
            return VoiceAnalysisResponse(
                language=LanguageType(detected_language),
                emotion=EmotionType(emotion),
                emotion_score=emotion_score,
                transcript=transcript,
                message="Voice analysis completed successfully"
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in voice analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during voice analysis: {str(e)}"
        )


@router.get("/voice/supported-formats")
async def get_supported_formats():
    """Get list of supported audio formats"""
    return {
        "supported_formats": settings.ALLOWED_AUDIO_FORMATS,
        "max_file_size_mb": settings.MAX_AUDIO_FILE_SIZE // (1024 * 1024),
        "timeout_seconds": settings.SPEECH_RECOGNITION_TIMEOUT
    }


@router.get("/voice/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for voice analysis"""
    return {
        "supported_languages": [
            {"code": "hi", "name": "Hindi", "native_name": "हिंदी"},
            {"code": "mr", "name": "Marathi", "native_name": "मराठी"},
            {"code": "en", "name": "English", "native_name": "English"}
        ]
    }


@router.post("/voice/test-connection")
async def test_voice_services():
    """Test voice analysis services connectivity"""
    try:
        # Test speech service
        speech_status = await speech_service.health_check()
        
        # Test emotion service  
        emotion_status = await emotion_service.health_check()
        
        return {
            "speech_service": speech_status,
            "emotion_service": emotion_status,
            "overall_status": "healthy" if speech_status["status"] == "healthy" and emotion_status["status"] == "healthy" else "unhealthy"
        }
        
    except Exception as e:
        logger.error(f"Voice services health check failed: {e}")
        return {
            "speech_service": {"status": "error", "message": str(e)},
            "emotion_service": {"status": "error", "message": str(e)},
            "overall_status": "unhealthy"
        }