import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Fade,
  Slide,
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  Send,
  SmartToy,
  Person,
  Refresh,
  Language,
  EmojiEmotions,
  Psychology,
  Agriculture,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { faq } from '../data/faq';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  language: string;
  emotion?: 'happy' | 'sad' | 'neutral' | 'confused' | 'excited';
  audioUrl?: string;
}

interface VoiceRecognitionResult {
  text: string;
  language: string;
  confidence: number;
  emotion?: string;
}

const AIChatbot: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('hi'); // Default Hindi
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Supported languages
  const languages = [
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  ];

  // Motivational messages for different emotions
  const motivationalMessages = {
    sad: {
      hi: [
        "भाई, हिम्मत रखिए! खेती में उतार-चढ़ाव आते रहते हैं। आपकी मेहनत कभी बेकार नहीं जाएगी। 🌱",
        "किसान भारत की आत्मा हैं। आपका काम सबसे महत्वपूर्ण है। आगे बढ़ते रहिए! 💪",
        "मुश्किल समय है, लेकिन आप जैसे मेहनती किसान हार नहीं सकते। नई तकनीक से बेहतर फसल होगी! 🚜"
      ],
      en: [
        "Brother, keep your spirits up! Farming has its ups and downs. Your hard work will never go to waste. 🌱",
        "Farmers are the soul of India. Your work is the most important. Keep moving forward! 💪",
        "These are tough times, but hardworking farmers like you never give up. Better crops await with new technology! 🚜"
      ]
    },
    confused: {
      hi: [
        "कोई बात नहीं भाई, सवाल पूछिए। हम मिलकर समाधान निकालेंगे! 🤝",
        "खेती में कोई भी सवाल छोटा नहीं होता। बेझिझक पूछिए, हम यहाँ मदद के लिए हैं। 📚"
      ],
      en: [
        "No worries brother, ask your questions. We'll find solutions together! 🤝",
        "No question in farming is too small. Ask freely, we're here to help. 📚"
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

    // Add welcome message
    addBotMessage(
      "🙏 नमस्कार! मैं आपका AI किसान मित्र हूँ। खेती से जुड़ा कोई भी सवाल पूछिए - मैं आपकी मदद करूँगा! 🌾",
      'hi'
    );

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSpeechResult = (event: any) => {
    const result = event.results[0];
    const transcript = result[0].transcript;
    const confidence = result[0].confidence;
    
    console.log('Speech recognized:', transcript, 'Confidence:', confidence);
    
    setCurrentMessage(transcript);
    
    // Auto-send if confidence is high
    if (confidence > 0.7) {
      setTimeout(() => {
        handleSendMessage(transcript);
      }, 500);
    }
  };

  const handleSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    
    let errorMessage = 'आवाज़ पहचानने में समस्या हुई';
    switch (event.error) {
      case 'no-speech':
        errorMessage = 'कोई आवाज़ सुनाई नहीं दी';
        break;
      case 'audio-capture':
        errorMessage = 'माइक्रोफोन की समस्या';
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
    
    // Set language for recognition
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
      'te': 'te-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
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
    
    // Try to find a voice for the selected language
    const voices = synthesisRef.current.getVoices();
    const voice = voices.find(v => v.lang.startsWith(language === 'hi' ? 'hi' : language)) || voices[0];
    if (voice) {
      utterance.voice = voice;
    }
    
    synthesisRef.current.speak(utterance);
  };

  const detectEmotion = (text: string): 'happy' | 'sad' | 'neutral' | 'confused' | 'excited' => {
    const sadWords = ['दुखी', 'परेशान', 'मुश्किल', 'समस्या', 'नुकसान', 'घाटा', 'बर्बाद', 'sad', 'problem', 'loss', 'worried'];
    const happyWords = ['खुश', 'अच्छा', 'बढ़िया', 'धन्यवाद', 'शुक्रिया', 'happy', 'good', 'great', 'thanks', 'excellent'];
    const confusedWords = ['समझ', 'कैसे', 'क्या', 'कौन', 'कहाँ', 'कब', 'how', 'what', 'when', 'where', 'confused', 'help'];
    const excitedWords = ['वाह', 'शानदार', 'कमाल', 'amazing', 'wonderful', 'excited', 'wow'];

    const lowerText = text.toLowerCase();
    
    if (sadWords.some(word => lowerText.includes(word))) return 'sad';
    if (happyWords.some(word => lowerText.includes(word))) return 'happy';
    if (excitedWords.some(word => lowerText.includes(word))) return 'excited';
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
    
    // Speak the response
    setTimeout(() => {
      speakText(text, language);
    }, 500);
    
    return message;
  };

  // Simple FAQ retrieval by token overlap
  const getFaqAnswer = (query: string, lang: string) => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let best = { score: 0, a: '' };
    faq.filter(f => f.lang === (lang as any) || f.lang === 'en').forEach(item => {
      const bag = (item.q + ' ' + item.tags.join(' ')).toLowerCase();
      const overlap = terms.filter(t => bag.includes(t)).length;
      const score = overlap / Math.max(1, terms.length);
      if (score > best.score) best = { score, a: item.a };
    });
    return best;
  };

  const generateAIResponse = async (userMessage: string, userEmotion: string, language: string) => {
    try {
      setIsLoading(true);
      
      // Quick FAQ match (fast RAG)
      const faqHit = getFaqAnswer(userMessage, language);
      if (faqHit.score >= 0.35) {
        addBotMessage(faqHit.a, language);
        setIsLoading(false);
        return;
      }

      // If user is sad or confused, add motivational message first
      if ((userEmotion === 'sad' || userEmotion === 'confused') && motivationalMessages[userEmotion as keyof typeof motivationalMessages]) {
        const messages = motivationalMessages[userEmotion as keyof typeof motivationalMessages][language as keyof typeof motivationalMessages.sad] || 
                        motivationalMessages[userEmotion as keyof typeof motivationalMessages]['hi'];
        const randomMotivation = messages[Math.floor(Math.random() * messages.length)];
        
        addBotMessage(randomMotivation, language);
        
        // Wait a moment before the main response
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Call your backend AI API
      const system_context = `
You are KisanGPT, a helpful and safe agricultural assistant. Answer briefly, step-by-step with bullet points. Prefer local practices for Indian farmers. If unsure, say what additional info is needed. Avoid brand endorsements; give generic active ingredients. Output language: ${language}.`;

      const API = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';
      const response = await axios.post(`${API}/api/v1/ai/chat`, {
        message: userMessage,
        language: language,
        emotion: userEmotion,
        context: 'farming',
        system_context,
        faq_context: faqHit.score > 0 ? faqHit.a : undefined,
        previous_messages: messages.slice(-5)
      });

      let aiResponse = response.data.response;
      
      // Fallback to rule-based responses if API fails
      if (!aiResponse) {
        aiResponse = generateFallbackResponse(userMessage, language);
      }

      addBotMessage(aiResponse, language);
      
    } catch (error) {
      console.error('AI API Error:', error);
      
      // Fallback response
      const fallbackResponse = generateFallbackResponse(userMessage, language);
      addBotMessage(fallbackResponse, language);
      
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (userMessage: string, language: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Comprehensive farming-related responses
    if (lowerMessage.includes('बीज') || lowerMessage.includes('seed')) {
      const seedResponses = {
        hi: [
          "🌱 अच्छे बीज के लिए ये बातें ध्यान रखें:\n1️⃣ हमेशा प्रमाणित बीज ही खरीदें\n2️⃣ बीज की उम्र 6 महीने से ज्यादा न हो\n3️⃣ मिट्टी टेस्ट के बाद बीज चुनें\n4️⃣ स्थानीय किस्म को प्राथमिकता दें",
          "🌱 बीज का ट्रीटमेंट बहुत जरूरी है:\n• Trichoderma से बीज को treat करें\n• PSB (Phosphate Solubilizing Bacteria) का इस्तेमाल करें\n• Azotobacter बीज की जीवन शक्ति बढ़ाता है",
        ],
        en: [
          "🌱 For good seeds, keep these points in mind:\n1️⃣ Always buy certified seeds only\n2️⃣ Seed age should not exceed 6 months\n3️⃣ Choose seeds after soil testing\n4️⃣ Give priority to local varieties",
          "🌱 Seed treatment is very important:\n• Treat seeds with Trichoderma\n• Use PSB (Phosphate Solubilizing Bacteria)\n• Azotobacter increases seed viability",
        ]
      };
      return seedResponses[language as keyof typeof seedResponses][Math.floor(Math.random() * seedResponses[language as keyof typeof seedResponses].length)];
    }
    
    if (lowerMessage.includes('पानी') || lowerMessage.includes('सिंचाई') || lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      const waterResponses = {
        hi: [
          "💧 पानी बचाने के स्मार्ट तरीके:\n1️⃣ ड्रिप इरिगेशन - 40-60% पानी बचता है\n2️⃣ मल्चिंग करें - मिट्टी में नमी बनी रहती है\n3️⃣ सुबह 6-8 या शाम 4-6 बजे सिंचाई करें\n4️⃣ मिट्टी मॉइश्चर मीटर का उपयोग",
          "💧 वर्षा के पानी को बचाने के तरीके:\n• खेत में बोरवेल बनाएं\n• पोखर बनाकर रेन वाटर हार्वेस्टिंग\n• ड्रेनेज की व्यवस्था ठीक रखें\n• वाटर टेबल मॉनिटरिंग करें",
        ],
        en: [
          "💧 Smart ways to save water:\n1️⃣ Drip irrigation - saves 40-60% water\n2️⃣ Mulching - retains soil moisture\n3️⃣ Irrigate at 6-8 AM or 4-6 PM\n4️⃣ Use soil moisture meter",
          "💧 Ways to save rainwater:\n• Build borewells in fields\n• Rain water harvesting with ponds\n• Keep drainage system proper\n• Monitor water table",
        ]
      };
      return waterResponses[language as keyof typeof waterResponses][Math.floor(Math.random() * waterResponses[language as keyof typeof waterResponses].length)];
    }
    
    if (lowerMessage.includes('कीट') || lowerMessage.includes('pest') || lowerMessage.includes('रोग') || lowerMessage.includes('disease')) {
      const pestResponses = {
        hi: [
          "🐛 कीट-रोग के प्राकृतिक उपाय:\n• नीम का तेल (5ml/लीटर)\n• लहसुन-मिर्च का काड़ा\n• नीलगाय का गोबर (नाइट्रोजन फिक्सर)\n• ट्राइकोडरमा से बीज ट्रीटमेंट",
          "🐛 IPM (एकीकृत कीट प्रबंधन) की रणनीति:\n1️⃣ फसल चक्र (धान-गेहूं-दलहन)\n2️⃣ फेरोमोन ट्रैप का उपयोग\n3️⃣ सुबह 4-6 बजे चिपचिपे कार्ड लगाएं\n4️⃣ बॉरो का 1% घोल छिड़कें",
          "🐛 मुख्य फसलों के प्रमुख कीट:\n• घान: नेक ब्लास्ट, पत्ता झुलसा\n• गेहूं: काला रतुआ, चूहा, मक्खी\n• मक्का: तना छेदक, पत्ती लपेटना\n• कपास: सूँडी, कीड़े, मक्खी",
        ],
        en: [
          "🐛 Natural pest control methods:\n• Neem oil (5ml/liter)\n• Garlic-chili decoction\n• Blue cow dung (nitrogen fixer)\n• Trichoderma seed treatment",
          "🐛 IPM (Integrated Pest Management) strategy:\n1️⃣ Crop rotation (Rice-Wheat-Pulses)\n2️⃣ Use pheromone traps\n3️⃣ Install sticky cards at 4-6 AM\n4️⃣ Spray 1% Bordeaux solution",
          "🐛 Major pests of main crops:\n• Paddy: Neck blast, Leaf folder\n• Wheat: Black rust, Mouse, Aphid\n• Maize: Stem borer, Leaf wrapping\n• Cotton: Bollworm, Thrips, Aphid",
        ]
      };
      return pestResponses[language as keyof typeof pestResponses][Math.floor(Math.random() * pestResponses[language as keyof typeof pestResponses].length)];
    }
    
    if (lowerMessage.includes('मौसम') || lowerMessage.includes('weather') || lowerMessage.includes('बारिश') || lowerMessage.includes('rain')) {
      return language === 'hi'
        ? "मौसम की सही जानकारी के लिए हमारे Weather Forecast सेक्शन को देखें। IMD की एडवाइजरी फॉलो करें और अपनी फसल को मौसम के अनुसार तैयार करें। ⛅"
        : "Check our Weather Forecast section for accurate weather information. Follow IMD advisories and prepare your crop according to the weather. ⛅";
    }
    
    if (lowerMessage.includes('कीमत') || lowerMessage.includes('price') || lowerMessage.includes('मंडी') || lowerMessage.includes('market')) {
      return language === 'hi'
        ? "फसल की सही कीमत पाने के लिए ई-NAM पोर्टल का इस्तेमाल करें। अलग-अलग मंडियों की कीमत compare करें। FPO या सहकारी समिति से जुड़ें। 💰"
        : "Use e-NAM portal to get right price for your crop. Compare prices in different markets. Join FPO or cooperative society. 💰";
    }
    
    // Advanced farming topics
    if (lowerMessage.includes('खाद') || lowerMessage.includes('fertilizer') || lowerMessage.includes('यूरिया') || lowerMessage.includes('urea')) {
      const fertilizerResponses = {
        hi: [
          "🌿 खाद के प्रकार और उपयोग:\n1️⃣ यूरिया (46% नाइट्रोजन) - बुआई के समय\n2️⃣ DAP (18-46-0) - बीज के साथ\n3️⃣ MOP (60% पोटाश) - फल आने पर\n4️⃣ जिंक सल्फेट - मिट्टी टेस्ट के बाद",
          "🌿 जैविक खाद के फायदे:\n• वर्मीकंपोस्ट - सबसे अच्छी\n• गोबर की खाद - 8-10 टन/हेक्टेयर\n• हरी खाद - ढैंचा, बरसीम\n• कंपोस्ट खाद - घरेलू कचरे से",
        ],
        en: [
          "🌿 Types and uses of fertilizers:\n1️⃣ Urea (46% Nitrogen) - At sowing time\n2️⃣ DAP (18-46-0) - With seeds\n3️⃣ MOP (60% Potash) - During fruiting\n4️⃣ Zinc Sulfate - After soil test",
          "🌿 Benefits of organic fertilizers:\n• Vermicompost - The best option\n• Cow dung manure - 8-10 tons/hectare\n• Green manure - Dhaincha, Berseem\n• Compost - From household waste",
        ]
      };
      return fertilizerResponses[language as keyof typeof fertilizerResponses][Math.floor(Math.random() * fertilizerResponses[language as keyof typeof fertilizerResponses].length)];
    }

    if (lowerMessage.includes('मिट्टी') || lowerMessage.includes('soil') || lowerMessage.includes('जांच') || lowerMessage.includes('test')) {
      const soilResponses = {
        hi: [
          "🌱 मिट्टी की जांच किया जाता है:\n1️⃣ pH वैल्यू (6.5-7.5 आदर्श)\n2️⃣ नाइट्रोजन (N)\n3️⃣ फास्फोरस (P)\n4️⃣ पोटाशियम (K)\n5️⃣ जिंक, आयरन, बोरॉन",
          "🌱 मिट्टी सुधार के उपाय:\n• खारी मिट्टी: जिप्सम (2-3 टन/हे)\n• अम्लीय मिट्टी: चूना (1-2 टन/हे)\n• दुमट मिट्टी: ड्रेनेज की व्यवस्था\n• बलुई मिट्टी: जैविक खाद ज्यादा",
        ],
        en: [
          "🌱 Soil testing parameters:\n1️⃣ pH value (6.5-7.5 ideal)\n2️⃣ Nitrogen (N)\n3️⃣ Phosphorus (P)\n4️⃣ Potassium (K)\n5️⃣ Zinc, Iron, Boron",
          "🌱 Soil improvement methods:\n• Alkaline soil: Gypsum (2-3 tons/ha)\n• Acidic soil: Lime (1-2 tons/ha)\n• Clay soil: Drainage system\n• Sandy soil: More organic manure",
        ]
      };
      return soilResponses[language as keyof typeof soilResponses][Math.floor(Math.random() * soilResponses[language as keyof typeof soilResponses].length)];
    }

    if (lowerMessage.includes('फसल') || lowerMessage.includes('crop') || lowerMessage.includes('किस्म') || lowerMessage.includes('variety')) {
      const cropResponses = {
        hi: [
          "🌾 मुख्य फसलों की उन्नत किस्में:\n• गेहूं: HD-2967, DBW-88\n• धान: पूसा बासमती-1509, IR-64\n• मक्का: गंगा-11, DKC-9144\n• अरहर: UPAS-120, Azad P-1",
          "🌾 फसल चक्र के फायदे:\n1️⃣ मिट्टी की उर्वरता बढ़ती है\n2️⃣ कीट-पतंग कम होते हैं\n3️⃣ पानी की आवश्यकता कम\n4️⃣ रासायनिक खाद की बचत",
        ],
        en: [
          "🌾 Improved varieties of major crops:\n• Wheat: HD-2967, DBW-88\n• Rice: Pusa Basmati-1509, IR-64\n• Maize: Ganga-11, DKC-9144\n• Pigeon pea: UPAS-120, Azad P-1",
          "🌾 Benefits of crop rotation:\n1️⃣ Increases soil fertility\n2️⃣ Reduces pest-insects\n3️⃣ Less water requirement\n4️⃣ Saves chemical fertilizers",
        ]
      };
      return cropResponses[language as keyof typeof cropResponses][Math.floor(Math.random() * cropResponses[language as keyof typeof cropResponses].length)];
    }

    // Advanced technology topics
    if (lowerMessage.includes('ड्रोन') || lowerMessage.includes('drone') || lowerMessage.includes('तकनीक') || lowerMessage.includes('technology') || lowerMessage.includes('AI')) {
      const techResponses = {
        hi: [
          "🚁 खेती में नई तकनीक:\n• ड्रोन छिड़काव - 40% दवा की बचत\n• सेटेलाइट मॉनिटरिंग - फसल का सेहत\n• स्मार्ट इरिगेशन - ऑटोमेटिक पानी\n• AI क्रॉप आडाइजरी - मोबाइल एप",
          "🚁 प्रिसिजन एग्रिकल्चर के फायदे:\n1️⃣ GPS गाइडेड ट्रैक्टर\n2️⃣ सॉयल सेंसर - नमी मापना\n3️⃣ वेरिएबल रेट स्प्रेयर\n4️⃣ यील्ड मॉनिटरिंग - उत्पादन मापना",
        ],
        en: [
          "🚁 New technology in farming:\n• Drone spraying - 40% medicine savings\n• Satellite monitoring - Crop health\n• Smart irrigation - Automatic water\n• AI Crop Advisory - Mobile app",
          "🚁 Benefits of precision agriculture:\n1️⃣ GPS guided tractor\n2️⃣ Soil sensors - Moisture measurement\n3️⃣ Variable rate sprayer\n4️⃣ Yield monitoring - Production measurement",
        ]
      };
      return techResponses[language as keyof typeof techResponses][Math.floor(Math.random() * techResponses[language as keyof typeof techResponses].length)];
    }
    
    // Default response
    return language === 'hi'
      ? "आपका सवाल बहुत अच्छा है! मैं इस पर और जानकारी इकट्ठा करके आपको बेहतर जवाब दे सकूंगा। क्या आप थोड़ा और detail में बता सकते हैं? 🤔"
      : "Your question is very good! I can give you a better answer by gathering more information on this. Can you provide a bit more detail? 🤔";
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

  const clearChat = () => {
    setMessages([]);
    addBotMessage(
      "🙏 नमस्कार! मैं आपका AI किसान मित्र हूँ। खेती से जुड़ा कोई भी सवाल पूछिए - मैं आपकी मदद करूँगा! 🌾",
      selectedLanguage
    );
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return '#4caf50';
      case 'sad': return '#f44336';
      case 'excited': return '#ff9800';
      case 'confused': return '#2196f3';
      default: return '#757575';
    }
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      >
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 30%, #66bb6a 70%, #81c784 100%)',
            color: 'white',
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(46, 125, 50, 0.3)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)',
              pointerEvents: 'none',
            },
          }}
        >
          <SmartToy sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🤖 AI किसान मित्र
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            आपका व्यक्तिगत खेती सलाहकार - आवाज़ में बात करें! 🎙️
          </Typography>
        </Paper>
      </motion.div>

      {/* Language & Controls */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>भाषा / Language</InputLabel>
            <Select
              value={selectedLanguage}
              label="भाषा / Language"
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              color={voiceEnabled ? 'primary' : 'default'}
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title="आवाज़ चालू/बंद"
            >
              {voiceEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
            
            <IconButton
              onClick={clearChat}
              title="चैट साफ़ करें"
              color="secondary"
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Chat Messages */}
      <Paper elevation={3} sx={{ height: '500px', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <List sx={{ py: 0 }}>
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 30, x: message.sender === 'user' ? 50 : -50 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.4, delay: index * 0.1, type: "spring", bounce: 0.2 }}
                >
                  <ListItem
                    sx={{
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 'auto', ml: message.sender === 'user' ? 1 : 0, mr: message.sender === 'user' ? 0 : 1 }}>
                      <Avatar
                        sx={{
                          bgcolor: message.sender === 'user' ? '#2196f3' : '#4caf50',
                          border: `2px solid ${getEmotionColor(message.emotion)}`,
                        }}
                      >
                        {message.sender === 'user' ? <Person /> : <SmartToy />}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <Card
                      elevation={2}
                      sx={{
                        maxWidth: '70%',
                        bgcolor: message.sender === 'user' ? '#e3f2fd' : '#f1f8e9',
                        borderRadius: 3,
                        position: 'relative',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography
                          variant="body1"
                          sx={{
                            wordBreak: 'break-word',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                          }}
                        >
                          {message.text}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          
                          {message.emotion && (
                            <Chip
                              size="small"
                              label={getEmotionIcon(message.emotion)}
                              sx={{ height: 20, fontSize: '12px' }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#4caf50' }}>
                      <SmartToy />
                    </Avatar>
                  </ListItemAvatar>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      सोच रहा हूँ...
                    </Typography>
                  </Box>
                </ListItem>
              </motion.div>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedLanguage === 'hi' ? "अपना सवाल यहाँ लिखें या माइक दबाकर बोलें..." : "Type your question here or press mic to speak..."}
              variant="outlined"
              size="small"
              disabled={isListening || isLoading}
              sx={{ borderRadius: 2 }}
            />
            
            <IconButton
              color="primary"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              sx={{
                bgcolor: isListening ? '#f44336' : '#4caf50',
                color: 'white',
                '&:hover': {
                  bgcolor: isListening ? '#d32f2f' : '#388e3c',
                },
                animation: isListening ? 'micPulse 1s infinite' : 'none',
                boxShadow: isListening ? '0 0 20px rgba(244, 67, 54, 0.6)' : '0 4px 15px rgba(76, 175, 80, 0.3)',
                '@keyframes micPulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(244, 67, 54, 0.6)' },
                  '50%': { transform: 'scale(1.15)', boxShadow: '0 0 30px rgba(244, 67, 54, 0.8)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(244, 67, 54, 0.6)' },
                },
              }}
              title={isListening ? "सुनना बंद करें" : "माइक से बोलें"}
            >
              {isListening ? <MicOff /> : <Mic />}
            </IconButton>
            
            <IconButton
              color="primary"
              onClick={() => handleSendMessage()}
              disabled={!currentMessage.trim() || isLoading}
              sx={{
                bgcolor: '#2196f3',
                color: 'white',
                '&:hover': { bgcolor: '#1976d2' },
              }}
              title="भेजें"
            >
              <Send />
            </IconButton>
          </Box>

          {isSpeaking && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: '#4caf50' }}>
              <VolumeUp fontSize="small" />
              <Typography variant="caption">बोल रहा हूँ...</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 2, mt: 3, borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          त्वरित प्रश्न / Quick Questions:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {[
            { hi: "मेरी फसल में कीट लगे हैं", en: "Pests in my crop" },
            { hi: "कौन सी खाद डालूं?", en: "Which fertilizer to use?" },
            { hi: "बारिश के बाद क्या करूं?", en: "What to do after rain?" },
            { hi: "फसल कब बेचूं?", en: "When to sell crop?" },
            { hi: "नई तकनीक के बारे में बताओ", en: "Tell about new technology" },
          ].map((question, index) => (
            <Chip
              key={index}
              label={selectedLanguage === 'hi' ? question.hi : question.en}
              onClick={() => setCurrentMessage(selectedLanguage === 'hi' ? question.hi : question.en)}
              sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: '#e8f5e8' },
              }}
              icon={<Psychology />}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default AIChatbot;