import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Fab,
  Collapse,
  Badge,
  Divider,
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  Send,
  SmartToy,
  Person,
  Close,
  Minimize,
  Psychology,
  ExpandLess,
  ExpandMore,
  ChatBubble,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  language: string;
  emotion?: 'happy' | 'sad' | 'neutral' | 'confused' | 'excited';
}

const FloatingChatbot: React.FC = () => {
  const { t } = (useTranslation as any)();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Supported languages
  const languages = [
    { code: 'hi', name: 'à¤¹à¤¿à¤‚à¤¦à¥€', flag: 'ðŸ‡®ðŸ‡³' },
    { code: 'en', name: 'English', flag: 'ðŸ‡ºðŸ‡¸' },
    { code: 'pa', name: 'à¨ªà©°à¨œà¨¾à¨¬à©€', flag: 'ðŸ‡®ðŸ‡³' },
    { code: 'ta', name: 'à®¤à®®à®¿à®´à¯', flag: 'ðŸ‡®ðŸ‡³' },
  ];

  // Motivational messages for different emotions
  const motivationalMessages = {
    sad: {
      hi: [
        "à¤­à¤¾à¤ˆ, à¤¹à¤¿à¤®à¥à¤®à¤¤ à¤°à¤–à¤¿à¤! à¤–à¥‡à¤¤à¥€ à¤®à¥‡à¤‚ à¤‰à¤¤à¤¾à¤°-à¤šà¤¢à¤¼à¤¾à¤µ à¤†à¤¤à¥‡ à¤°à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤ à¤†à¤ªà¤•à¥€ à¤®à¥‡à¤¹à¤¨à¤¤ à¤•à¤­à¥€ à¤¬à¥‡à¤•à¤¾à¤° à¤¨à¤¹à¥€à¤‚ à¤œà¤¾à¤à¤—à¥€à¥¤ ðŸŒ±",
        "à¤•à¤¿à¤¸à¤¾à¤¨ à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤†à¤¤à¥à¤®à¤¾ à¤¹à¥ˆà¤‚à¥¤ à¤†à¤ªà¤•à¤¾ à¤•à¤¾à¤® à¤¸à¤¬à¤¸à¥‡ à¤®à¤¹à¤¤à¥à¤µà¤ªà¥‚à¤°à¥à¤£ à¤¹à¥ˆà¥¤ à¤†à¤—à¥‡ à¤¬à¤¢à¤¼à¤¤à¥‡ à¤°à¤¹à¤¿à¤! ðŸ’ª",
      ],
      en: [
        "Brother, keep your spirits up! Farming has its ups and downs. Your hard work will never go to waste. ðŸŒ±",
        "Farmers are the soul of India. Your work is the most important. Keep moving forward! ðŸ’ª",
      ]
    },
    confused: {
      hi: [
        "à¤•à¥‹à¤ˆ à¤¬à¤¾à¤¤ à¤¨à¤¹à¥€à¤‚ à¤­à¤¾à¤ˆ, à¤¸à¤µà¤¾à¤² à¤ªà¥‚à¤›à¤¿à¤à¥¤ à¤¹à¤® à¤®à¤¿à¤²à¤•à¤° à¤¸à¤®à¤¾à¤§à¤¾à¤¨ à¤¨à¤¿à¤•à¤¾à¤²à¥‡à¤‚à¤—à¥‡! ðŸ¤",
      ],
      en: [
        "No worries brother, ask your questions. We'll find solutions together! ðŸ¤",
      ]
    }
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      
      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = () => setIsListening(false);
    }

    // Initialize speech synthesis
    synthesisRef.current = window.speechSynthesis;

    // Add welcome message when first opened
    if (isOpen && messages.length === 0) {
      addBotMessage(
        "ðŸ™ à¤¨à¤®à¤¸à¥à¤•à¤¾à¤°! à¤®à¥ˆà¤‚ à¤†à¤ªà¤•à¤¾ AI à¤•à¤¿à¤¸à¤¾à¤¨ à¤®à¤¿à¤¤à¥à¤° à¤¹à¥‚à¤à¥¤ à¤–à¥‡à¤¤à¥€ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¤¾ à¤•à¥‹à¤ˆ à¤­à¥€ à¤¸à¤µà¤¾à¤² à¤ªà¥‚à¤›à¤¿à¤! ðŸŒ¾",
        'hi'
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Reset unread count when chat is opened
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSpeechResult = (event: any) => {
    const result = event.results[0];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;
    
    setCurrentMessage(transcript);
    
    // Auto-send if confidence is high
    if (confidence > 0.7) {
      setTimeout(() => {
        handleSendMessage(transcript);
      }, 500);
    }
  };

  const handleSpeechError = (event: any) => {
    setIsListening(false);
    
    let errorMessage = 'à¤†à¤µà¤¾à¤œà¤¼ à¤ªà¤¹à¤šà¤¾à¤¨à¤¨à¥‡ à¤®à¥‡à¤‚ à¤¸à¤®à¤¸à¥à¤¯à¤¾ à¤¹à¥à¤ˆ';
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'à¤•à¥‹à¤ˆ à¤†à¤µà¤¾à¤œà¤¼ à¤¸à¥à¤¨à¤¾à¤ˆ à¤¨à¤¹à¥€à¤‚ à¤¦à¥€';
        break;
      case 'not-allowed':
        errorMessage = 'à¤®à¤¾à¤‡à¤•à¥à¤°à¥‹à¤«à¥‹à¤¨ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¦à¥‡à¤‚';
        break;
    }
    
    setError(errorMessage);
    setTimeout(() => setError(''), 3000);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('à¤†à¤ªà¤•à¤¾ à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼à¤° à¤†à¤µà¤¾à¤œà¤¼ à¤ªà¤¹à¤šà¤¾à¤¨ à¤•à¥‹ à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤¨à¤¹à¥€à¤‚ à¤•à¤°à¤¤à¤¾');
      return;
    }

    setError('');
    setIsListening(true);
    
    recognitionRef.current.lang = getLanguageCode(selectedLanguage);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const getLanguageCode = (lang: string) => {
    const langMap: { [key: string]: string } = {
      'hi': 'hi-IN',
      'en': 'en-US',
      'pa': 'pa-IN',
      'ta': 'ta-IN',
    };
    return langMap[lang] || 'hi-IN';
  };

  const speakText = (text: string, language: string) => {
    if (!synthesisRef.current || !voiceEnabled) return;

    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(language);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const detectEmotion = (text: string): 'happy' | 'sad' | 'neutral' | 'confused' | 'excited' => {
    const sadWords = ['à¤¦à¥à¤–à¥€', 'à¤ªà¤°à¥‡à¤¶à¤¾à¤¨', 'à¤®à¥à¤¶à¥à¤•à¤¿à¤²', 'à¤¸à¤®à¤¸à¥à¤¯à¤¾', 'à¤¨à¥à¤•à¤¸à¤¾à¤¨', 'à¤˜à¤¾à¤Ÿà¤¾', 'à¤¬à¤°à¥à¤¬à¤¾à¤¦', 'sad', 'problem', 'loss', 'worried'];
    const happyWords = ['à¤–à¥à¤¶', 'à¤…à¤šà¥à¤›à¤¾', 'à¤¬à¤¢à¤¼à¤¿à¤¯à¤¾', 'à¤§à¤¨à¥à¤¯à¤µà¤¾à¤¦', 'à¤¶à¥à¤•à¥à¤°à¤¿à¤¯à¤¾', 'happy', 'good', 'great', 'thanks', 'excellent'];
    const confusedWords = ['à¤¸à¤®à¤', 'à¤•à¥ˆà¤¸à¥‡', 'à¤•à¥à¤¯à¤¾', 'à¤•à¥Œà¤¨', 'à¤•à¤¹à¤¾à¤', 'à¤•à¤¬', 'how', 'what', 'when', 'where', 'confused', 'help'];

    const lowerText = text.toLowerCase();
    
    if (sadWords.some(word => lowerText.includes(word))) return 'sad';
    if (happyWords.some(word => lowerText.includes(word))) return 'happy';
    if (confusedWords.some(word => lowerText.includes(word))) return 'confused';
    
    return 'neutral';
  };

  const addUserMessage = (text: string, language: string) => {
    const emotion = detectEmotion(text);
    const message: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      language,
      emotion,
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const addBotMessage = (text: string, language: string, emotion?: 'happy' | 'sad' | 'neutral' | 'confused' | 'excited') => {
    const message: ChatMessage = {
      id: Date.now().toString() + '_bot',
      text,
      sender: 'bot',
      timestamp: new Date(),
      language,
      emotion: emotion || 'neutral',
    };
    setMessages(prev => [...prev, message]);
    
    // Increment unread count if chat is closed
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
    
    // Speak the response
    setTimeout(() => {
      speakText(text, language);
    }, 500);
    
    return message;
  };

  const generateFallbackResponse = (userMessage: string, language: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Farming-related responses
    if (lowerMessage.includes('à¤¬à¥€à¤œ') || lowerMessage.includes('seed')) {
      return language === 'hi' 
        ? "à¤…à¤šà¥à¤›à¥‡ à¤¬à¥€à¤œ à¤šà¥à¤¨à¤¨à¤¾ à¤¬à¤¹à¥à¤¤ à¤®à¤¹à¤¤à¥à¤µà¤ªà¥‚à¤°à¥à¤£ à¤¹à¥ˆà¥¤ à¤¹à¤®à¥‡à¤¶à¤¾ à¤ªà¥à¤°à¤®à¤¾à¤£à¤¿à¤¤ à¤¬à¥€à¤œ à¤–à¤°à¥€à¤¦à¥‡à¤‚ à¤”à¤° à¤®à¤¿à¤Ÿà¥à¤Ÿà¥€ à¤•à¥€ à¤œà¤¾à¤‚à¤š à¤•à¤°à¤¾à¤•à¤° à¤¬à¥€à¤œ à¤šà¥à¤¨à¥‡à¤‚à¥¤ ðŸŒ±"
        : "Choosing good seeds is very important. Always buy certified seeds and choose seeds after soil testing. ðŸŒ±";
    }
    
    if (lowerMessage.includes('à¤ªà¤¾à¤¨à¥€') || lowerMessage.includes('à¤¸à¤¿à¤‚à¤šà¤¾à¤ˆ') || lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      return language === 'hi'
        ? "à¤ªà¤¾à¤¨à¥€ à¤•à¥€ à¤¬à¤šà¤¤ à¤•à¥‡ à¤²à¤¿à¤ à¤¡à¥à¤°à¤¿à¤ª à¤‡à¤°à¤¿à¤—à¥‡à¤¶à¤¨ à¤¯à¤¾ à¤¸à¥à¤ªà¥à¤°à¤¿à¤‚à¤•à¤²à¤° à¤•à¤¾ à¤‡à¤¸à¥à¤¤à¥‡à¤®à¤¾à¤² à¤•à¤°à¥‡à¤‚à¥¤ à¤¸à¥à¤¬à¤¹ à¤¯à¤¾ à¤¶à¤¾à¤® à¤•à¥‹ à¤¸à¤¿à¤‚à¤šà¤¾à¤ˆ à¤•à¤°à¤¨à¤¾ à¤¬à¥‡à¤¹à¤¤à¤° à¤¹à¥‹à¤¤à¤¾ à¤¹à¥ˆà¥¤ ðŸ’§"
        : "Use drip irrigation or sprinklers to save water. It's better to irrigate in the morning or evening. ðŸ’§";
    }
    
    if (lowerMessage.includes('à¤•à¥€à¤Ÿ') || lowerMessage.includes('pest') || lowerMessage.includes('à¤°à¥‹à¤—') || lowerMessage.includes('disease')) {
      return language === 'hi'
        ? "à¤•à¥€à¤Ÿ-à¤°à¥‹à¤— à¤¸à¥‡ à¤¬à¤šà¤¾à¤µ à¤•à¥‡ à¤²à¤¿à¤ à¤¨à¥€à¤® à¤•à¤¾ à¤¤à¥‡à¤², à¤œà¥ˆà¤µà¤¿à¤• à¤•à¥€à¤Ÿà¤¨à¤¾à¤¶à¤• à¤•à¤¾ à¤‡à¤¸à¥à¤¤à¥‡à¤®à¤¾à¤² à¤•à¤°à¥‡à¤‚à¥¤ à¤«à¤¸à¤² à¤šà¤•à¥à¤° à¤…à¤ªà¤¨à¤¾à¤à¤‚ à¤”à¤° à¤–à¥‡à¤¤ à¤•à¥€ à¤¸à¤«à¤¾à¤ˆ à¤°à¤–à¥‡à¤‚à¥¤ ðŸ›"
        : "To prevent pests and diseases, use neem oil and organic pesticides. Adopt crop rotation and keep the field clean. ðŸ›";
    }
    
    // Default response
    return language === 'hi'
      ? "à¤†à¤ªà¤•à¤¾ à¤¸à¤µà¤¾à¤² à¤¬à¤¹à¥à¤¤ à¤…à¤šà¥à¤›à¤¾ à¤¹à¥ˆ! à¤®à¥ˆà¤‚ à¤‡à¤¸ à¤ªà¤° à¤”à¤° à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤‡à¤•à¤Ÿà¥à¤ à¤¾ à¤•à¤°à¤•à¥‡ à¤†à¤ªà¤•à¥‹ à¤¬à¥‡à¤¹à¤¤à¤° à¤œà¤µà¤¾à¤¬ à¤¦à¥‡ à¤¸à¤•à¥‚à¤‚à¤—à¤¾à¥¤ à¤•à¥à¤¯à¤¾ à¤†à¤ª à¤¥à¥‹à¤¡à¤¼à¤¾ à¤”à¤° detail à¤®à¥‡à¤‚ à¤¬à¤¤à¤¾ à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚? ðŸ¤”"
      : "Your question is very good! I can give you a better answer by gathering more information on this. Can you provide a bit more detail? ðŸ¤”";
  };

  const generateAIResponse = async (userMessage: string, userEmotion: string, language: string) => {
    try {
      setIsLoading(true);
      
      // If user is sad or confused, add motivational message first
      if ((userEmotion === 'sad' || userEmotion === 'confused') && motivationalMessages[userEmotion as keyof typeof motivationalMessages]) {
        const messages = motivationalMessages[userEmotion as keyof typeof motivationalMessages][language as keyof typeof motivationalMessages.sad] || 
                        motivationalMessages[userEmotion as keyof typeof motivationalMessages]['hi'];
        const randomMotivation = messages[Math.floor(Math.random() * messages.length)];
        
        addBotMessage(randomMotivation, language);
        
        // Wait a moment before the main response
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // For now, use fallback responses (you can connect to your backend AI API here)
      const aiResponse = generateFallbackResponse(userMessage, language);
      addBotMessage(aiResponse, language);
      
    } catch (error) {
      console.error('AI API Error:', error);
      const fallbackResponse = generateFallbackResponse(userMessage, language);
      addBotMessage(fallbackResponse, language);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || currentMessage.trim();
    if (!text) return;

    const userMessage = addUserMessage(text, selectedLanguage);
    setCurrentMessage('');

    // Generate AI response
    await generateAIResponse(text, userMessage.emotion || 'neutral', selectedLanguage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  const getEmotionIcon = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return 'ðŸ˜Š';
      case 'sad': return 'ðŸ˜”';
      case 'excited': return 'ðŸ¤©';
      case 'confused': return 'ðŸ¤”';
      default: return 'ðŸ˜';
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
            }}
          >
            <Badge badgeContent={unreadCount} color="error" max={9}>
              <Fab
                color="primary"
                onClick={toggleChat}
                sx={{
                  width: 60,
                  height: 60,
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 50%, #81c784 100%)',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 50%, #66bb6a 100%)',
                    transform: 'scale(1.05)',
                  },
                  animation: unreadCount > 0 ? 'bounce 2s infinite' : 'none',
                  '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                    '40%': { transform: 'translateY(-10px)' },
                    '60%': { transform: 'translateY(-5px)' },
                  },
                }}
              >
                <SmartToy sx={{ fontSize: 28 }} />
              </Fab>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 50, y: 50 }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0, x: 50, y: 50 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              width: '350px',
              height: isMinimized ? '60px' : '500px',
              maxHeight: '80vh',
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '20px 20px 20px 5px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                border: '2px solid #4caf50',
              }}
            >
              {/* Chat Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1, width: 35, height: 35 }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      AI à¤•à¤¿à¤¸à¤¾à¤¨ à¤®à¤¿à¤¤à¥à¤°
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                      {isSpeaking ? 'à¤¬à¥‹à¤² à¤°à¤¹à¤¾ à¤¹à¥‚à¤...' : isListening ? 'à¤¸à¥à¤¨ à¤°à¤¹à¤¾ à¤¹à¥‚à¤...' : 'à¤‘à¤¨à¤²à¤¾à¤‡à¤¨'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <IconButton
                    size="small"
                    onClick={minimizeChat}
                    sx={{ color: 'white', mr: 0.5 }}
                  >
                    {isMinimized ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={closeChat}
                    sx={{ color: 'white' }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={!isMinimized}>
                {/* Language Selector */}
                <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {languages.map((lang) => (
                        <MenuItem key={lang.code} value={lang.code} sx={{ fontSize: '0.8rem' }}>
                          {lang.flag} {lang.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ m: 1 }} onClose={() => setError('')}>
                    <Typography variant="caption">{error}</Typography>
                  </Alert>
                )}

                {/* Messages Area */}
                <Box
                  ref={chatContainerRef}
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 1,
                    maxHeight: '300px',
                  }}
                >
                  <List sx={{ py: 0 }}>
                    {messages.map((message, index) => (
                      <ListItem
                        key={message.id}
                        sx={{
                          flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                          alignItems: 'flex-start',
                          mb: 1,
                          px: 0,
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 'auto', ml: message.sender === 'user' ? 0.5 : 0, mr: message.sender === 'user' ? 0 : 0.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: message.sender === 'user' ? '#2196f3' : '#4caf50',
                              width: 30,
                              height: 30,
                              fontSize: '0.8rem',
                            }}
                          >
                            {message.sender === 'user' ? <Person /> : <SmartToy />}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <Card
                          elevation={1}
                          sx={{
                            maxWidth: '75%',
                            bgcolor: message.sender === 'user' ? '#e3f2fd' : '#f1f8e9',
                            borderRadius: message.sender === 'user' ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                          }}
                        >
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography
                              variant="body2"
                              sx={{
                                wordBreak: 'break-word',
                                fontSize: '0.85rem',
                                lineHeight: 1.4,
                              }}
                            >
                              {message.text}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                              
                              {message.emotion && (
                                <Chip
                                  size="small"
                                  label={getEmotionIcon(message.emotion)}
                                  sx={{ height: 16, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </ListItem>
                    ))}
                    
                    {isLoading && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar sx={{ minWidth: 'auto', mr: 0.5 }}>
                          <Avatar sx={{ bgcolor: '#4caf50', width: 30, height: 30 }}>
                            <SmartToy />
                          </Avatar>
                        </ListItemAvatar>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="caption" color="text.secondary">
                            à¤¸à¥‹à¤š à¤°à¤¹à¤¾ à¤¹à¥‚à¤...
                          </Typography>
                        </Box>
                      </ListItem>
                    )}
                  </List>
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={2}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={selectedLanguage === 'hi' ? "à¤¸à¤µà¤¾à¤² à¤²à¤¿à¤–à¥‡à¤‚..." : "Type question..."}
                      variant="outlined"
                      size="small"
                      disabled={isListening || isLoading}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                        },
                      }}
                    />
                    
                    <IconButton
                      color="primary"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      size="small"
                      sx={{
                        bgcolor: isListening ? '#f44336' : '#4caf50',
                        color: 'white',
                        '&:hover': {
                          bgcolor: isListening ? '#d32f2f' : '#388e3c',
                        },
                        animation: isListening ? 'pulse 1s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.05)' },
                          '100%': { transform: 'scale(1)' },
                        },
                      }}
                    >
                      {isListening ? <MicOff /> : <Mic />}
                    </IconButton>
                    
                    <IconButton
                      color="primary"
                      onClick={() => handleSendMessage()}
                      disabled={!currentMessage.trim() || isLoading}
                      size="small"
                      sx={{
                        bgcolor: '#2196f3',
                        color: 'white',
                        '&:hover': { bgcolor: '#1976d2' },
                      }}
                    >
                      <Send />
                    </IconButton>
                  </Box>

                  {/* Quick Suggestions */}
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {[
                      { hi: "à¤•à¥€à¤Ÿ à¤¸à¤®à¤¸à¥à¤¯à¤¾", en: "Pest problem" },
                      { hi: "à¤–à¤¾à¤¦ à¤¸à¤²à¤¾à¤¹", en: "Fertilizer advice" },
                      { hi: "à¤®à¥Œà¤¸à¤® à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€", en: "Weather info" },
                    ].slice(0, 3).map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={selectedLanguage === 'hi' ? suggestion.hi : suggestion.en}
                        onClick={() => setCurrentMessage(selectedLanguage === 'hi' ? suggestion.hi : suggestion.en)}
                        size="small"
                        sx={{
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          height: 24,
                          '&:hover': { bgcolor: '#e8f5e8' },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;