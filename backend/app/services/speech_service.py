"""
Speech analysis service for Kisan GPT
Handles speech-to-text conversion and language detection
"""

import os
import asyncio
from typing import Dict, Optional, Any
import speech_recognition as sr
from langdetect import detect, LangDetectException
import librosa
import soundfile as sf
from pydub import AudioSegment
from loguru import logger

from app.core.config import settings


class SpeechAnalysisService:
    """Service for speech recognition and language detection"""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.5
        
        # Language mappings for speech recognition
        self.language_mapping = {
            'hi': 'hi-IN',  # Hindi
            'mr': 'mr-IN',  # Marathi  
            'en': 'en-IN'   # English (Indian)
        }
        
        # Language detection mappings
        self.lang_detect_mapping = {
            'hi': 'hi',
            'mr': 'mr', 
            'en': 'en'
        }
    
    async def transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file to text and detect language
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dict with transcript, language, duration, quality_score
        """
        try:
            # Convert audio to WAV format if needed
            wav_path = await self._convert_to_wav(audio_path)
            
            # Get audio metadata
            duration = await self._get_audio_duration(wav_path)
            quality_score = await self._assess_audio_quality(wav_path)
            
            # Transcribe using Google Speech Recognition
            transcript = await self._transcribe_with_google(wav_path)
            
            if not transcript:
                # Fallback to other recognition methods
                transcript = await self._transcribe_with_sphinx(wav_path)
            
            if not transcript:
                logger.warning(f"Could not transcribe audio: {audio_path}")
                return {
                    'transcript': '',
                    'language': settings.DEFAULT_LANGUAGE,
                    'duration': duration,
                    'quality_score': quality_score,
                    'confidence': 0.0
                }
            
            # Detect language
            detected_language = await self._detect_language(transcript)
            
            # Clean up temporary WAV file if created
            if wav_path != audio_path and os.path.exists(wav_path):
                os.unlink(wav_path)
            
            logger.info(f"Transcription successful: {len(transcript)} chars, language: {detected_language}")
            
            return {
                'transcript': transcript.strip(),
                'language': detected_language,
                'duration': duration,
                'quality_score': quality_score,
                'confidence': 0.85  # Placeholder confidence score
            }
            
        except Exception as e:
            logger.error(f"Error in speech transcription: {e}")
            return {
                'transcript': '',
                'language': settings.DEFAULT_LANGUAGE,
                'duration': 0,
                'quality_score': 0.0,
                'confidence': 0.0
            }
    
    async def _convert_to_wav(self, audio_path: str) -> str:
        """Convert audio file to WAV format"""
        try:
            # Check if already WAV
            if audio_path.lower().endswith('.wav'):
                return audio_path
            
            # Convert using pydub
            audio = AudioSegment.from_file(audio_path)
            wav_path = audio_path.rsplit('.', 1)[0] + '_converted.wav'
            audio.export(wav_path, format='wav')
            
            return wav_path
            
        except Exception as e:
            logger.error(f"Error converting audio to WAV: {e}")
            return audio_path
    
    async def _get_audio_duration(self, audio_path: str) -> float:
        """Get audio file duration in seconds"""
        try:
            y, sr = librosa.load(audio_path)
            return float(librosa.get_duration(y=y, sr=sr))
        except Exception as e:
            logger.error(f"Error getting audio duration: {e}")
            return 0.0
    
    async def _assess_audio_quality(self, audio_path: str) -> float:
        """Assess audio quality (0-1 score)"""
        try:
            y, sr = librosa.load(audio_path)
            
            # Calculate signal-to-noise ratio approximation
            rms_energy = librosa.feature.rms(y=y)[0]
            mean_rms = float(rms_energy.mean())
            
            # Spectral rolloff for quality assessment
            rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            mean_rolloff = float(rolloff.mean())
            
            # Combine metrics for quality score
            quality_score = min(1.0, (mean_rms * 10 + mean_rolloff / 5000) / 2)
            
            return max(0.0, quality_score)
            
        except Exception as e:
            logger.error(f"Error assessing audio quality: {e}")
            return 0.5  # Default medium quality
    
    async def _transcribe_with_google(self, wav_path: str) -> Optional[str]:
        """Transcribe using Google Speech Recognition"""
        try:
            with sr.AudioFile(wav_path) as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.record(source)
            
            # Try Hindi first (most likely)
            for lang_code in ['hi-IN', 'mr-IN', 'en-IN']:
                try:
                    transcript = self.recognizer.recognize_google(
                        audio, 
                        language=lang_code,
                        show_all=False
                    )
                    if transcript:
                        logger.info(f"Google recognition successful with {lang_code}")
                        return transcript
                except sr.UnknownValueError:
                    continue
                except sr.RequestError as e:
                    logger.error(f"Google recognition request error: {e}")
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Google transcription error: {e}")
            return None
    
    async def _transcribe_with_sphinx(self, wav_path: str) -> Optional[str]:
        """Fallback transcription using PocketSphinx"""
        try:
            with sr.AudioFile(wav_path) as source:
                audio = self.recognizer.record(source)
            
            # PocketSphinx (offline) - mainly for English
            transcript = self.recognizer.recognize_sphinx(audio)
            if transcript:
                logger.info("Sphinx recognition successful")
                return transcript
                
            return None
            
        except Exception as e:
            logger.error(f"Sphinx transcription error: {e}")
            return None
    
    async def _detect_language(self, text: str) -> str:
        """Detect language from text"""
        try:
            if not text or len(text.strip()) < 3:
                return settings.DEFAULT_LANGUAGE
            
            # Use langdetect library
            detected = detect(text)
            
            # Map to our supported languages
            if detected in self.lang_detect_mapping:
                return self.lang_detect_mapping[detected]
            
            # Check for Devanagari script (Hindi/Marathi)
            if any('\u0900' <= char <= '\u097F' for char in text):
                # Simple heuristic: if contains specific Marathi characters
                marathi_chars = ['ळ', 'ण', 'ं', 'ः']
                if any(char in text for char in marathi_chars):
                    return 'mr'
                return 'hi'
            
            # Default fallback
            return settings.DEFAULT_LANGUAGE
            
        except (LangDetectException, Exception) as e:
            logger.warning(f"Language detection failed: {e}")
            return settings.DEFAULT_LANGUAGE
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if speech recognition service is healthy"""
        try:
            # Test basic recognizer initialization
            test_recognizer = sr.Recognizer()
            
            return {
                "status": "healthy",
                "service": "SpeechAnalysisService",
                "supported_languages": list(self.language_mapping.keys()),
                "engines": ["google", "sphinx"]
            }
            
        except Exception as e:
            logger.error(f"Speech service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "SpeechAnalysisService"
            }