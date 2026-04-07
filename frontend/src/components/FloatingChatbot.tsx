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
  const { t } = useTranslation();
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
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  ];

  // Motivational messages for different emotions
  const motivationalMessages = {
    sad: {
      hi: [
        "भाई, हिम्मत रखिए! खेती में उतार-चढ़ाव आते रहते हैं। आपकी मेहनत कभी बेकार नहीं जाएगी। 🌱",
        "किसान भारत की आत्मा हैं। आपका काम सबसे महत्वपूर्ण है। आगे बढ़ते रहिए! 💪",
      ],
      en: [
        "Brother, keep your spirits up! Farming has its ups and downs. Your hard work will never go to waste. 🌱",
        "Farmers are the soul of India. Your work is the most important. Keep moving forward! 💪",
      ]
    },
    confused: {
      hi: [
        "कोई बात नहीं भाई, सवाल पूछिए। हम मिलकर समाधान निकालेंगे! 🤝",
      ],
      en: [
        "No worries brother, ask your questions. We'll find solutions together! 🤝",
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
        "🙏 नमस्कार! मैं आपका AI किसान मित्र हूँ। खेती से जुड़ा कोई भी सवाल पूछिए! 🌾",
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
    
    let errorMessage = 'आवाज़ पहचानने में समस्या हुई';
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'कोई आवाज़ सुनाई नहीं दी';
        break;
      case 'not-allowed':
        errorMessage = 'माइक्रोफोन की अनुमति दें';
        break;
    }
    
    setError(errorMessage);
    setTimeout(() => setError(''), 3000);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('आपका ब्राउज़र आवाज़ पहचान को सपोर्ट नहीं करता');
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
    const sadWords = ['दुखी', 'परेशान', 'मुश्किल', 'समस्या', 'नुकसान', 'घाटा', 'बर्बाद', 'sad', 'problem', 'loss', 'worried'];
    const happyWords = ['खुश', 'अच्छा', 'बढ़िया', 'धन्यवाद', 'शुक्रिया', 'happy', 'good', 'great', 'thanks', 'excellent'];
    const confusedWords = ['समझ', 'कैसे', 'क्या', 'कौन', 'कहाँ', 'कब', 'how', 'what', 'when', 'where', 'confused', 'help'];

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
    if (lowerMessage.includes('बीज') || lowerMessage.includes('seed')) {
      return language === 'hi' 
        ? "अच्छे बीज चुनना बहुत महत्वपूर्ण है। हमेशा प्रमाणित बीज खरीदें और मिट्टी की जांच कराकर बीज चुनें। 🌱"
        : "Choosing good seeds is very important. Always buy certified seeds and choose seeds after soil testing. 🌱";
    }
    
    if (lowerMessage.includes('पानी') || lowerMessage.includes('सिंचाई') || lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      return language === 'hi'
        ? "पानी की बचत के लिए ड्रिप इरिगेशन या स्प्रिंकलर का इस्तेमाल करें। सुबह या शाम को सिंचाई करना बेहतर होता है। 💧"
        : "Use drip irrigation or sprinklers to save water. It's better to irrigate in the morning or evening. 💧";
    }
    
    if (lowerMessage.includes('कीट') || lowerMessage.includes('pest') || lowerMessage.includes('रोग') || lowerMessage.includes('disease')) {
      return language === 'hi'
        ? "कीट-रोग से बचाव के लिए नीम का तेल, जैविक कीटनाशक का इस्तेमाल करें। फसल चक्र अपनाएं और खेत की सफाई रखें। 🐛"
        : "To prevent pests and diseases, use neem oil and organic pesticides. Adopt crop rotation and keep the field clean. 🐛";
    }
    
    // Default response
    return language === 'hi'
      ? "आपका सवाल बहुत अच्छा है! मैं इस पर और जानकारी इकट्ठा करके आपको बेहतर जवाब दे सकूंगा। क्या आप थोड़ा और detail में बता सकते हैं? 🤔"
      : "Your question is very good! I can give you a better answer by gathering more information on this. Can you provide a bit more detail? 🤔";
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
      case 'happy': return '😊';
      case 'sad': return '😔';
      case 'excited': return '🤩';
      case 'confused': return '🤔';
      default: return '😐';
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
                      AI किसान मित्र
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                      {isSpeaking ? 'बोल रहा हूँ...' : isListening ? 'सुन रहा हूँ...' : 'ऑनलाइन'}
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
                            सोच रहा हूँ...
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
                      placeholder={selectedLanguage === 'hi' ? "सवाल लिखें..." : "Type question..."}
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
                      { hi: "कीट समस्या", en: "Pest problem" },
                      { hi: "खाद सलाह", en: "Fertilizer advice" },
                      { hi: "मौसम जानकारी", en: "Weather info" },
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