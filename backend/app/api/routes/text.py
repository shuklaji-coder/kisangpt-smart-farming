"""
Text analysis API routes
Handles text input, language detection, and emotion analysis
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models.schemas import (
    TextAnalysisRequest, 
    TextAnalysisResponse, 
    EmotionType, 
    LanguageType
)
from app.services.emotion_service import EmotionAnalysisService
from app.core.database import get_sessions_collection

router = APIRouter()

# Initialize services
emotion_service = EmotionAnalysisService()


@router.post("/text/analyze", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text input for language, emotion, and sentiment
    
    Args:
        request: TextAnalysisRequest with text and user_id
        
    Returns:
        TextAnalysisResponse with language, emotion, sentiment scores
    """
    try:
        text = request.text.strip()
        user_id = request.user_id
        
        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        logger.info(f"Processing text analysis for user {user_id}: {len(text)} characters")
        
        # Perform emotion analysis (includes language detection)
        emotion_result = await emotion_service.analyze_emotion(text=text)
        
        emotion = emotion_result.get('emotion', 'neutral')
        emotion_score = emotion_result.get('confidence', 0.5)
        
        # Validate emotion
        if emotion not in [e.value for e in EmotionType]:
            emotion = 'neutral'
        
        # Detect language from text (simple heuristic)
        detected_language = await _detect_text_language(text)
        
        # Calculate overall sentiment score (-1 to 1)
        sentiment_score = _calculate_sentiment_score(emotion_result)
        
        # Store session data
        session_data = {
            "session_id": str(uuid.uuid4()),
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "input_type": "text",
            "transcript": text,
            "emotion": emotion,
            "language": detected_language,
            "location": None,
            "sentiment_score": sentiment_score,
            "emotion_details": emotion_result.get('details', {})
        }
        
        # Save to database
        sessions_collection = get_sessions_collection()
        await sessions_collection.insert_one(session_data)
        
        logger.info(f"Text analysis completed for user {user_id}: {emotion} ({emotion_score:.2f})")
        
        return TextAnalysisResponse(
            language=LanguageType(detected_language),
            emotion=EmotionType(emotion),
            emotion_score=emotion_score,
            sentiment=sentiment_score,
            message="Text analysis completed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in text analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during text analysis: {str(e)}"
        )


async def _detect_text_language(text: str) -> str:
    """
    Detect language from text using simple heuristics
    
    Args:
        text: Input text
        
    Returns:
        Language code (hi, mr, en)
    """
    try:
        from langdetect import detect, LangDetectError
        
        if len(text.strip()) < 3:
            return 'hi'  # Default to Hindi
        
        # Try langdetect first
        try:
            detected = detect(text)
            if detected in ['hi', 'mr', 'en']:
                return detected
        except LangDetectError:
            pass
        
        # Check for Devanagari script (Hindi/Marathi)
        devanagari_chars = sum(1 for char in text if '\u0900' <= char <= '\u097F')
        total_chars = len([char for char in text if char.isalpha()])
        
        if total_chars > 0 and devanagari_chars / total_chars > 0.5:
            # Check for specific Marathi characters
            marathi_chars = ['ळ', 'ण', 'ं', 'ः', 'ॅ', 'ऑ']
            if any(char in text for char in marathi_chars):
                return 'mr'
            return 'hi'
        
        # Check for English (Latin script)
        latin_chars = sum(1 for char in text if 'a' <= char.lower() <= 'z')
        if total_chars > 0 and latin_chars / total_chars > 0.8:
            return 'en'
        
        # Default to Hindi
        return 'hi'
        
    except Exception as e:
        logger.warning(f"Language detection failed: {e}")
        return 'hi'  # Default fallback


def _calculate_sentiment_score(emotion_result: dict) -> float:
    """
    Calculate overall sentiment score from emotion analysis
    
    Args:
        emotion_result: Emotion analysis result
        
    Returns:
        Sentiment score between -1 (negative) and 1 (positive)
    """
    try:
        emotion = emotion_result.get('emotion', 'neutral')
        confidence = emotion_result.get('confidence', 0.5)
        
        # Map emotions to sentiment scores
        emotion_sentiment_mapping = {
            'stress': -0.8,
            'worry': -0.4,
            'neutral': 0.0,
            'confident': 0.6
        }
        
        base_sentiment = emotion_sentiment_mapping.get(emotion, 0.0)
        
        # Adjust by confidence
        adjusted_sentiment = base_sentiment * confidence
        
        # Check for VADER scores if available
        details = emotion_result.get('details', {})
        vader_result = details.get('vader_result', {})
        if vader_result and 'compound' in vader_result:
            vader_compound = vader_result['compound']
            # Blend with VADER score (30% weight)
            adjusted_sentiment = 0.7 * adjusted_sentiment + 0.3 * vader_compound
        
        # Ensure within bounds
        return max(-1.0, min(1.0, adjusted_sentiment))
        
    except Exception as e:
        logger.error(f"Sentiment score calculation error: {e}")
        return 0.0


@router.get("/text/supported-languages")
async def get_supported_text_languages():
    """Get list of supported languages for text analysis"""
    return {
        "supported_languages": [
            {"code": "hi", "name": "Hindi", "native_name": "हिंदी"},
            {"code": "mr", "name": "Marathi", "native_name": "मराठी"},
            {"code": "en", "name": "English", "native_name": "English"}
        ]
    }


@router.get("/text/supported-emotions")
async def get_supported_emotions():
    """Get list of supported emotions for text analysis"""
    return {
        "supported_emotions": [
            {"code": "stress", "name": "Stress", "description": "High anxiety and tension"},
            {"code": "worry", "name": "Worry", "description": "Concerned and uncertain"},
            {"code": "confident", "name": "Confident", "description": "Positive and assured"},
            {"code": "neutral", "name": "Neutral", "description": "Balanced emotional state"}
        ]
    }


@router.post("/text/test-connection")
async def test_text_services():
    """Test text analysis services connectivity"""
    try:
        # Test emotion service
        emotion_status = await emotion_service.health_check()
        
        # Test basic text analysis
        test_result = await emotion_service.analyze_emotion("This is a test message")
        
        return {
            "emotion_service": emotion_status,
            "test_analysis": {
                "emotion": test_result.get('emotion'),
                "confidence": test_result.get('confidence')
            },
            "overall_status": "healthy" if emotion_status.get("status") == "healthy" else "unhealthy"
        }
        
    except Exception as e:
        logger.error(f"Text services health check failed: {e}")
        return {
            "emotion_service": {"status": "error", "message": str(e)},
            "test_analysis": None,
            "overall_status": "unhealthy"
        }