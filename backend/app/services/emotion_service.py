"""
Emotion analysis service for Kisan GPT
Detects emotional state from text and audio features
"""

import os
import re
from typing import Dict, Optional, Any, List
import librosa
import numpy as np
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from loguru import logger

from app.core.config import settings


class EmotionAnalysisService:
    """Service for emotion detection from text and audio"""
    
    def __init__(self):
        self.vader_analyzer = SentimentIntensityAnalyzer()
        
        # Emotion keywords in different languages
        self.emotion_keywords = {
            'stress': {
                'hi': ['चिंता', 'परेशान', 'तनाव', 'डर', 'घबराहट', 'समस्या', 'मुश्किल', 'बर्बाद'],
                'mr': ['चिंता', 'त्रास', 'ताण', 'भीती', 'घबराट', 'समस्या', 'अडचण', 'नष्ट'],
                'en': ['worry', 'stress', 'anxious', 'problem', 'trouble', 'scared', 'afraid', 'ruined']
            },
            'worry': {
                'hi': ['फिक्र', 'सोच', 'क्या होगा', 'कैसे', 'नहीं पता', 'डर लगता', 'चिंता है'],
                'mr': ['काळजी', 'विचार', 'काय होईल', 'कसे', 'माहीत नाही', 'भीती वाटते', 'चिंता आहे'],
                'en': ['concerned', 'worried', 'wonder', 'how', 'what if', 'not sure', 'afraid']
            },
            'confident': {
                'hi': ['अच्छा', 'बढ़िया', 'खुश', 'सफल', 'जरूर', 'पक्का', 'हो जाएगा', 'ठीक है'],
                'mr': ['चांगला', 'उत्तम', 'आनंदी', 'यशस्वी', 'नक्की', 'पक्का', 'होईल', 'ठीक आहे'],
                'en': ['good', 'great', 'happy', 'successful', 'sure', 'confident', 'will work', 'fine']
            },
            'neutral': {
                'hi': ['ठीक', 'सामान्य', 'पता', 'बताइए', 'क्या', 'कैसे', 'जानकारी', 'समझ'],
                'mr': ['ठीक', 'सामान्य', 'माहीत', 'सांगा', 'काय', 'कसे', 'माहिती', 'समज'],
                'en': ['okay', 'normal', 'tell', 'what', 'how', 'information', 'understand']
            }
        }
        
        # Load pre-trained emotion model if available
        self.emotion_model = None
        self.tokenizer = None
        self._load_emotion_model()
    
    def _load_emotion_model(self):
        """Load pre-trained emotion classification model"""
        try:
            # Try to load a multilingual emotion model
            model_name = "cardiffnlp/twitter-roberta-base-emotion"
            self.emotion_pipeline = pipeline(
                "text-classification",
                model=model_name,
                tokenizer=model_name,
                return_all_scores=True
            )
            logger.info("Emotion classification model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load emotion model: {e}")
            self.emotion_pipeline = None
    
    async def analyze_emotion(
        self, 
        text: str, 
        audio_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze emotion from text and optionally audio
        
        Args:
            text: Input text to analyze
            audio_path: Optional path to audio file
            
        Returns:
            Dict with emotion, confidence, and details
        """
        try:
            # Text-based emotion analysis
            text_emotion = await self._analyze_text_emotion(text)
            
            # Audio-based emotion analysis (if available)
            audio_emotion = None
            if audio_path and os.path.exists(audio_path):
                audio_emotion = await self._analyze_audio_emotion(audio_path)
            
            # Combine results
            final_emotion = await self._combine_emotion_results(text_emotion, audio_emotion)
            
            logger.info(f"Emotion analysis completed: {final_emotion['emotion']} ({final_emotion['confidence']:.2f})")
            
            return final_emotion
            
        except Exception as e:
            logger.error(f"Error in emotion analysis: {e}")
            return {
                'emotion': 'neutral',
                'confidence': 0.5,
                'text_features': {},
                'audio_features': {},
                'method': 'fallback'
            }
    
    async def _analyze_text_emotion(self, text: str) -> Dict[str, Any]:
        """Analyze emotion from text content"""
        try:
            if not text or len(text.strip()) < 3:
                return {
                    'emotion': 'neutral',
                    'confidence': 0.5,
                    'method': 'default'
                }
            
            # Clean and prepare text
            cleaned_text = self._preprocess_text(text)
            
            # Method 1: Keyword-based analysis
            keyword_emotion = self._analyze_by_keywords(cleaned_text)
            
            # Method 2: VADER sentiment analysis
            vader_scores = self.vader_analyzer.polarity_scores(text)
            vader_emotion = self._vader_to_emotion(vader_scores)
            
            # Method 3: Pre-trained model (if available)
            model_emotion = None
            if self.emotion_pipeline:
                model_emotion = await self._analyze_with_model(text)
            
            # Method 4: TextBlob sentiment
            blob = TextBlob(text)
            textblob_emotion = self._textblob_to_emotion(blob.sentiment)
            
            # Combine all methods
            emotions = [keyword_emotion, vader_emotion, model_emotion, textblob_emotion]
            emotions = [e for e in emotions if e is not None]
            
            if not emotions:
                return {'emotion': 'neutral', 'confidence': 0.5, 'method': 'fallback'}
            
            # Weight and combine results
            final_emotion = self._combine_text_emotions(emotions)
            
            return {
                'emotion': final_emotion['emotion'],
                'confidence': final_emotion['confidence'],
                'method': 'text_analysis',
                'details': {
                    'keyword_result': keyword_emotion,
                    'vader_result': vader_emotion,
                    'model_result': model_emotion,
                    'textblob_result': textblob_emotion,
                    'vader_scores': vader_scores
                }
            }
            
        except Exception as e:
            logger.error(f"Text emotion analysis error: {e}")
            return {'emotion': 'neutral', 'confidence': 0.5, 'method': 'error'}
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for analysis"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Convert to lowercase for analysis (keep original for display)
        return text.lower()
    
    def _analyze_by_keywords(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze emotion using predefined keywords"""
        try:
            scores = {'stress': 0, 'worry': 0, 'confident': 0, 'neutral': 0}
            
            # Check keywords for each emotion and language
            for emotion, lang_keywords in self.emotion_keywords.items():
                for lang, keywords in lang_keywords.items():
                    for keyword in keywords:
                        # Count occurrences of each keyword
                        count = text.count(keyword.lower())
                        scores[emotion] += count
            
            # Find dominant emotion
            if max(scores.values()) == 0:
                return None
            
            dominant_emotion = max(scores, key=scores.get)
            confidence = min(1.0, scores[dominant_emotion] / 5.0)  # Normalize
            
            return {
                'emotion': dominant_emotion,
                'confidence': confidence,
                'scores': scores
            }
            
        except Exception as e:
            logger.error(f"Keyword analysis error: {e}")
            return None
    
    def _vader_to_emotion(self, vader_scores: Dict[str, float]) -> Dict[str, Any]:
        """Convert VADER sentiment scores to emotion"""
        try:
            compound = vader_scores['compound']
            
            if compound <= -0.5:
                emotion = 'stress'
                confidence = abs(compound)
            elif compound <= -0.1:
                emotion = 'worry'
                confidence = abs(compound * 0.8)
            elif compound >= 0.3:
                emotion = 'confident'
                confidence = compound
            else:
                emotion = 'neutral'
                confidence = 0.6
            
            return {
                'emotion': emotion,
                'confidence': min(1.0, confidence),
                'compound': compound
            }
            
        except Exception as e:
            logger.error(f"VADER emotion conversion error: {e}")
            return {'emotion': 'neutral', 'confidence': 0.5}
    
    async def _analyze_with_model(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze emotion using pre-trained model"""
        try:
            if not self.emotion_pipeline:
                return None
            
            # Truncate text if too long
            if len(text) > 512:
                text = text[:512]
            
            results = self.emotion_pipeline(text)
            
            # Map model emotions to our categories
            emotion_mapping = {
                'joy': 'confident',
                'sadness': 'worry',
                'anger': 'stress',
                'fear': 'stress',
                'surprise': 'neutral',
                'disgust': 'worry',
                'optimism': 'confident',
                'pessimism': 'worry'
            }
            
            # Find best match
            best_score = 0
            best_emotion = 'neutral'
            
            for result in results:
                mapped_emotion = emotion_mapping.get(result['label'].lower(), 'neutral')
                if result['score'] > best_score:
                    best_score = result['score']
                    best_emotion = mapped_emotion
            
            return {
                'emotion': best_emotion,
                'confidence': best_score,
                'raw_results': results
            }
            
        except Exception as e:
            logger.error(f"Model emotion analysis error: {e}")
            return None
    
    def _textblob_to_emotion(self, sentiment) -> Dict[str, Any]:
        """Convert TextBlob sentiment to emotion"""
        try:
            polarity = sentiment.polarity
            subjectivity = sentiment.subjectivity
            
            if polarity <= -0.3:
                emotion = 'stress'
                confidence = abs(polarity)
            elif polarity <= -0.1:
                emotion = 'worry'
                confidence = abs(polarity) * 0.8
            elif polarity >= 0.2:
                emotion = 'confident'
                confidence = polarity
            else:
                emotion = 'neutral'
                confidence = 0.6
            
            return {
                'emotion': emotion,
                'confidence': min(1.0, confidence),
                'polarity': polarity,
                'subjectivity': subjectivity
            }
            
        except Exception as e:
            logger.error(f"TextBlob emotion conversion error: {e}")
            return {'emotion': 'neutral', 'confidence': 0.5}
    
    def _combine_text_emotions(self, emotions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Combine multiple emotion analysis results"""
        if not emotions:
            return {'emotion': 'neutral', 'confidence': 0.5}
        
        # Weight emotions by confidence and count
        emotion_scores = {'stress': 0, 'worry': 0, 'confident': 0, 'neutral': 0}
        total_weight = 0
        
        for emotion_result in emotions:
            emotion = emotion_result['emotion']
            confidence = emotion_result['confidence']
            weight = confidence
            
            emotion_scores[emotion] += weight
            total_weight += weight
        
        # Normalize scores
        if total_weight > 0:
            for emotion in emotion_scores:
                emotion_scores[emotion] /= total_weight
        
        # Find dominant emotion
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        final_confidence = emotion_scores[dominant_emotion]
        
        return {
            'emotion': dominant_emotion,
            'confidence': final_confidence,
            'all_scores': emotion_scores
        }
    
    async def _analyze_audio_emotion(self, audio_path: str) -> Optional[Dict[str, Any]]:
        """Analyze emotion from audio features"""
        try:
            # Load audio
            y, sr = librosa.load(audio_path)
            
            # Extract audio features for emotion
            features = self._extract_audio_features(y, sr)
            
            # Simple rule-based emotion from audio features
            emotion = self._audio_features_to_emotion(features)
            
            return {
                'emotion': emotion['emotion'],
                'confidence': emotion['confidence'],
                'features': features,
                'method': 'audio_analysis'
            }
            
        except Exception as e:
            logger.error(f"Audio emotion analysis error: {e}")
            return None
    
    def _extract_audio_features(self, y: np.ndarray, sr: int) -> Dict[str, float]:
        """Extract relevant audio features for emotion detection"""
        try:
            # Basic audio features
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            
            # Spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            
            # MFCC features (first few coefficients)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            
            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            
            # Energy/RMS
            rms = librosa.feature.rms(y=y)[0]
            
            return {
                'tempo': float(tempo),
                'spectral_centroid_mean': float(np.mean(spectral_centroids)),
                'spectral_rolloff_mean': float(np.mean(spectral_rolloff)),
                'mfcc1_mean': float(np.mean(mfccs[0])),
                'mfcc2_mean': float(np.mean(mfccs[1])),
                'zcr_mean': float(np.mean(zcr)),
                'rms_mean': float(np.mean(rms)),
                'pitch_variance': float(np.var(spectral_centroids))
            }
            
        except Exception as e:
            logger.error(f"Feature extraction error: {e}")
            return {}
    
    def _audio_features_to_emotion(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Map audio features to emotions using simple rules"""
        try:
            if not features:
                return {'emotion': 'neutral', 'confidence': 0.5}
            
            # Simple rule-based classification
            tempo = features.get('tempo', 120)
            pitch_variance = features.get('pitch_variance', 0)
            rms_mean = features.get('rms_mean', 0)
            
            # High tempo + high variance -> stress
            if tempo > 130 and pitch_variance > 1000:
                return {'emotion': 'stress', 'confidence': 0.7}
            
            # Low energy + low tempo -> worry
            elif rms_mean < 0.02 and tempo < 100:
                return {'emotion': 'worry', 'confidence': 0.6}
            
            # High energy + normal tempo -> confident
            elif rms_mean > 0.05 and 110 <= tempo <= 130:
                return {'emotion': 'confident', 'confidence': 0.65}
            
            # Default to neutral
            else:
                return {'emotion': 'neutral', 'confidence': 0.6}
                
        except Exception as e:
            logger.error(f"Audio emotion mapping error: {e}")
            return {'emotion': 'neutral', 'confidence': 0.5}
    
    async def _combine_emotion_results(
        self, 
        text_emotion: Dict[str, Any], 
        audio_emotion: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Combine text and audio emotion analysis results"""
        try:
            if not audio_emotion:
                return text_emotion
            
            # Weight text more heavily than audio (text is more reliable for our use case)
            text_weight = 0.7
            audio_weight = 0.3
            
            # Combine emotions
            emotions_to_combine = [
                {'emotion': text_emotion['emotion'], 'confidence': text_emotion['confidence'], 'weight': text_weight},
                {'emotion': audio_emotion['emotion'], 'confidence': audio_emotion['confidence'], 'weight': audio_weight}
            ]
            
            # Calculate weighted scores
            emotion_scores = {'stress': 0, 'worry': 0, 'confident': 0, 'neutral': 0}
            total_weight = 0
            
            for item in emotions_to_combine:
                weighted_confidence = item['confidence'] * item['weight']
                emotion_scores[item['emotion']] += weighted_confidence
                total_weight += item['weight']
            
            # Normalize
            if total_weight > 0:
                for emotion in emotion_scores:
                    emotion_scores[emotion] /= total_weight
            
            # Find dominant emotion
            final_emotion = max(emotion_scores, key=emotion_scores.get)
            final_confidence = emotion_scores[final_emotion]
            
            return {
                'emotion': final_emotion,
                'confidence': final_confidence,
                'text_features': text_emotion.get('details', {}),
                'audio_features': audio_emotion.get('features', {}),
                'method': 'combined_analysis'
            }
            
        except Exception as e:
            logger.error(f"Emotion combination error: {e}")
            return text_emotion
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if emotion analysis service is healthy"""
        try:
            # Test basic functionality
            test_analysis = await self.analyze_emotion("This is a test message")
            
            return {
                "status": "healthy",
                "service": "EmotionAnalysisService",
                "supported_emotions": list(self.emotion_keywords.keys()),
                "model_loaded": self.emotion_pipeline is not None,
                "test_result": test_analysis['emotion']
            }
            
        except Exception as e:
            logger.error(f"Emotion service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "EmotionAnalysisService"
            }