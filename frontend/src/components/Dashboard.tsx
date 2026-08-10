import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  LinearProgress,
  Paper,
  useTheme,
  IconButton,
  Fab,
  Alert,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  GlobalStyles,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp,
  Agriculture,
  LocationOn,
  Group,
  Psychology,
  School,
  Policy,
  AutoGraph,
  Visibility,
  Assessment,
  VolumeUp,
  VolumeOff,
  SmartToy,
  Satellite,
  ViewInAr,
  BugReport,
  Notifications,
  LocalFlorist,
  AccountBalance,
  CloudQueue,
  Grass,
  Add,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ttsService } from '../services/ttsService';
import axios from 'axios';
import { cropRecommendationEngine } from '../services/cropRecommendationEngine';
import { satelliteService } from '../services/satelliteService';
import { marketPriceService } from '../services/marketPriceService';
import { diseaseDetectionService } from '../services/diseaseDetectionService';
import { getTranslation } from '../utils/translation';
import NewsTicker from './NewsTicker';

// Custom Marquee component since MUI doesn't have one
const ScrollingTicker = ({ children, speed = 50 }: { children: React.ReactNode, speed?: number }) => {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        position: 'relative',
        '& .scrolling-content': {
          display: 'inline-block',
          animation: `scroll ${speed}s linear infinite`,
          paddingLeft: '100%',
        },
        '@keyframes scroll': {
          '0%': { transform: 'translate3d(100%, 0, 0)' },
          '100%': { transform: 'translate3d(-100%, 0, 0)' },
        },
      }}
    >
      <Box className="scrolling-content">
        {children}
      </Box>
    </Box>
  );
};

const Dashboard: React.FC = () => {
const { t } = (useTranslation as any)();
  const tt = getTranslation(t);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userName, setUserName] = useState('किसान जी');
  const [userEmail, setUserEmail] = useState('');
  const [now, setNow] = useState(new Date());
  const [weatherData, setWeatherData] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lon: number, name: string} | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [newsTickerPaused, setNewsTickerPaused] = useState(false);
  // AI Services Data
  const [cropRecommendations, setCropRecommendations] = useState<any[]>([]);
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [marketPrices, setMarketPrices] = useState<any>(null);
  const [soilHealth, setSoilHealth] = useState<number>(85);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Farmer Tasks (Today)
  type Task = { id: string; text: string; done: boolean };
  const [tasks, setTasks] = useState<Task[]>([]);
  const todayKey = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || 'किसान जी');
        setUserEmail(user.email || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Welcome greeting (speaks once per day). Waits for browser audio permission/user gesture.
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const spokenKey = 'welcome_spoken_date';
    const alreadySpokenToday = localStorage.getItem(spokenKey) === today;

    if (alreadySpokenToday) return;

    let attempts = 0;
    let cancelled = false;

    const trySpeak = async () => {
      if (cancelled) return;
      const allowed = ttsService.isAllowed();
      if (!allowed) {
        // Retry for up to ~10 seconds (20 x 500ms), waiting for user gesture/visibility
        attempts += 1;
        if (attempts < 20) {
          setTimeout(trySpeak, 500);
        }
        return;
      }

      const name = userName && userName.trim() ? userName.trim() : 'किसान जी';
      const msg = `नमस्कार ${name}! किसान जीपीटी में आपका स्वागत है।`;
      try {
        await ttsService.speak(msg, 'hi');
        try { localStorage.setItem(spokenKey, today); } catch {}
      } catch {
        // no-op
      }
    };

    // Start the attempt loop (slight delay lets voices load)
    const startId = setTimeout(trySpeak, 600);

    return () => {
      cancelled = true;
      clearTimeout(startId);
    };
  }, [userName]);

  // Auto news voice: speak one headline every 60s
  const newsVoiceStartedRef = React.useRef(false);
  const newsIndexRef = React.useRef(0);
  const newsIntervalRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (newsVoiceStartedRef.current) return;
    newsVoiceStartedRef.current = true;
    // start after 10s to give time after welcome
    const startTimer = window.setTimeout(() => {
      if (newsIntervalRef.current) return;
      newsIntervalRef.current = window.setInterval(async () => {
        try {
          // Skip if currently speaking
          if (isSpeaking) return;
          const item = farmingNews[newsIndexRef.current % farmingNews.length];
          await ttsService.speak(item.title, 'hi');
          newsIndexRef.current = (newsIndexRef.current + 1) % farmingNews.length;
        } catch {}
      }, 20000); // every 20s
    }, 10000);

    return () => {
      window.clearTimeout(startTimer);
      if (newsIntervalRef.current) {
        window.clearInterval(newsIntervalRef.current);
      }
    };
  }, []);

  // Live time updater (every second)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Get user location and weather data
  useEffect(() => {
    getCurrentLocation();
    fetchAIServicesData();
  }, []);

  // Load tasks from storage or generate suggestions
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`today_tasks_${todayKey}`);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch {}
  }, [todayKey]);

  useEffect(() => {
    // If no stored tasks, generate after we have some weather data
    if (tasks.length === 0 && weatherData) {
      const suggested = generateSuggestedTasks(weatherData);
      setTasks(suggested);
      try { localStorage.setItem(`today_tasks_${todayKey}`, JSON.stringify(suggested)); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherData]);

  const saveTasks = (list: Task[]) => {
    setTasks(list);
    try { localStorage.setItem(`today_tasks_${todayKey}`, JSON.stringify(list)); } catch {}
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    saveTasks(updated);
  };

  const addTask = (text: string) => {
    if (!text.trim()) return;
    const updated = [{ id: Date.now().toString(), text: text.trim(), done: false }, ...tasks];
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  const generateSuggestedTasks = (w: any): Task[] => {
    const list: string[] = [];
    try {
      const temp = w?.main?.temp ?? 28;
      const humidity = w?.main?.humidity ?? 60;
      const main = (w?.weather?.[0]?.main || '').toLowerCase();
      const wind = w?.wind?.speed ?? 3.0;

      if (main.includes('rain')) list.push('उपकरण/बीज को ढकें, छिड़काव टालें');
      if (temp > 35) list.push('सुबह जल्दी या शाम को सिंचाई करें');
      if (humidity > 80) list.push('फंगल रोग से बचाव के लिए निगरानी करें');
      if (wind > 5) list.push('तेज हवा में स्प्रे न करें');

      if (list.length === 0) list.push('खेत की सामान्य जांच और निराई‑गुड़ाई');
      list.push('मिट्टी की नमी जाँचें');
      list.push('कल के काम प्लान करें');
    } catch {
      return [
        { id: '1', text: 'खेत की सामान्य जांच', done: false },
        { id: '2', text: 'मिट्टी की नमी जाँचें', done: false },
      ];
    }
    return list.map((t, i) => ({ id: `${Date.now()}_${i}`, text: t, done: false }));
  };

  // Fetch AI services data
  const fetchAIServicesData = async () => {
    setLoading(true);
    try {
      // Mock user location for demo - in production, use real GPS
      const userLocation = { lat: 28.6139, lng: 77.2090 };
      
      // Fetch satellite data for soil analysis
      const satData = await satelliteService.getSatelliteAnalysis({
        latitude: userLocation.lat,
        longitude: userLocation.lng
      });
      setSatelliteData(satData);
      setSoilHealth(satData.analysis.soil_fertility_index);
      
      // Get market prices for common crops
      const prices = await marketPriceService.getDashboardPrices(['wheat', 'rice', 'cotton'], userLocation);
      setMarketPrices(prices);
      
      // Get crop recommendations based on soil and weather
      const soilData = {
        ph: satData.soil_properties.ph,
        moisture: satData.soil_properties.moisture,
        nitrogen: satData.soil_properties.nitrogen,
        phosphorus: satData.soil_properties.phosphorus,
        potassium: satData.soil_properties.potassium,
        organic_matter: satData.soil_properties.organic_matter,
        temperature: satData.soil_properties.temperature
      };
      
      const weatherDataForAI = {
        temperature: weatherData?.main?.temp || 28,
        humidity: weatherData?.main?.humidity || 65,
        rainfall: 85,
        windSpeed: weatherData?.wind?.speed || 3.5,
        forecast: []
      };
      
      const farmerProfile = {
        farmSize: 2.5,
        experience: 5,
        budget: 100000,
        location: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          district: 'Delhi',
          state: 'Delhi'
        },
        previousCrops: ['wheat', 'rice'],
        soilType: 'loamy' as const
      };
      
      const recommendations = await cropRecommendationEngine.getRecommendations(
        soilData,
        weatherDataForAI,
        [],
        farmerProfile
      );
      setCropRecommendations(recommendations.slice(0, 3));
      
      // Generate AI insights
      const insights = [
        `🌿 मिट्टी की गुणवत्ता ${satData.analysis.soil_fertility_index}% है - ${satData.analysis.soil_fertility_index > 80 ? 'उत्कृष्ट' : 'सुधार की आवश्यकता'}`,
        `🛰️ NDVI Index: ${satData.vegetation_indices.ndvi.toFixed(2)} - फसल स्वास्थ्य ${satData.vegetation_indices.ndvi > 0.7 ? 'बहुत अच्छा' : 'सामान्य'}`,
        `💧 जल तनाव स्तर: ${satData.analysis.water_stress_level === 'low' ? 'कम - अच्छी स्थिति' : 'सावधानी बरतें'}`,
        `📈 सबसे लाभदायक फसल: ${recommendations[0]?.hindiName} (${recommendations[0]?.expectedProfit ? Math.round(recommendations[0].expectedProfit).toLocaleString() : 'N/A'} लाभ)`
      ];
      setAiInsights(insights);
      
    } catch (error) {
      console.error('AI Services data fetch error:', error);
      // Set fallback data
      setAiInsights([
        '🌿 AI सेवाएं लोड हो रही हैं...',
        '🛰️ सैटेलाइट डेटा प्राप्त कर रहे हैं...',
        '💰 बाजार की कीमतें अपडेट हो रही हैं...'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude, name: 'Your Location' });
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Location error:', error);
          // Fallback to Delhi coordinates
          const fallbackLat = 28.6139;
          const fallbackLon = 77.2090;
          setLocation({ lat: fallbackLat, lon: fallbackLon, name: 'Delhi' });
          fetchWeatherData(fallbackLat, fallbackLon);
        },
        { timeout: 10000 }
      );
    } else {
      // Browser doesn't support geolocation, use Delhi as fallback
      const fallbackLat = 28.6139;
      const fallbackLon = 77.2090;
      setLocation({ lat: fallbackLat, lon: fallbackLon, name: 'Delhi' });
      fetchWeatherData(fallbackLat, fallbackLon);
    }
  };

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setWeatherLoading(true);
      
      // Use OpenWeatherMap API (free tier)
      const API_KEY = '2d8a45c2b33b3f6c9d8f4d5e6f1a2b3c'; // Demo key, replace with real one
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      
      setWeatherData(response.data);
      
      // Also get city name
      try {
        const geocodeResponse = await axios.get(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );
        if (geocodeResponse.data && geocodeResponse.data[0]) {
          setLocation(prev => ({
            ...prev!,
            name: geocodeResponse.data[0].name + ', ' + geocodeResponse.data[0].state
          }));
        }
      } catch (geocodeError) {
        console.error('Geocode error:', geocodeError);
      }
      
    } catch (error) {
      console.error('Weather API error:', error);
      // Set demo weather data as fallback
      setWeatherData({
        main: { temp: 28, humidity: 65, feels_like: 30, temp_min: 24, temp_max: 32 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        wind: { speed: 3.5 },
        name: 'Delhi'
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleTTSSpeak = async (text: string) => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
    } else {
      try {
        setIsSpeaking(true);
        await ttsService.speak(text, 'hi');
        setIsSpeaking(false);
      } catch (error) {
        console.error('TTS Error:', error);
        setIsSpeaking(false);
      }
    }
  };

  const handleMotivationalSpeech = async () => {
    if (!isSpeaking) {
      try {
        setIsSpeaking(true);
        await ttsService.speakMotivationalMessage();
        setIsSpeaking(false);
      } catch (error) {
        console.error('TTS Error:', error);
        setIsSpeaking(false);
      }
    }
  };

  const getWeatherBasedAdvice = () => {
    if (!weatherData) {
      return '🌿 आज का सुझाव: सुबह 6-8 बजे खेत की निरीक्षण करें और पौधों में पानी की जांच करें।';
    }

    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const weather = weatherData.weather[0].main.toLowerCase();
    const windSpeed = weatherData.wind.speed;

    if (weather.includes('rain')) {
      return '🌧️ आज बारिश का अनुमान है! फसल की ड्रेनेज की जांच करें, खाद का हल्का ं छिड़काव करें और कीटनाशक न दें।';
    }

    if (temp > 35) {
      return '🌡️ आज बहुत गर्मी है! दोपहर 12-4 बजे खेत में काम न करें। पौधों को शेड नेट से ढक दें और ज्यादा पानी दें।';
    }

    if (temp < 10) {
      return '❄️ आज बहुत ठंड है! फसलों को पाले से बचाएं। मूली, आलू, पत्ता गोभी के लिए अच्छा मौसम है।';
    }

    if (humidity > 80) {
      return '💧 आज हवा में बहुत नमी है! फंगल रोग का खतरा है। पौधों में जिक या कॉपर का खिड़काव करें।';
    }

    if (windSpeed > 5) {
      return '🌬️ आज तेज हवा चल रही है! लम्बे पौधों को सहारा दें और फसल पर खाद का छिड़काव न करें।';
    }

    if (weather.includes('clear') && temp >= 20 && temp <= 30) {
      return '☀️ आज बहुत अच्छा मौसम है! खेत का काम करने के लिए परफेक्ट दिन है। नई बुआई, खाद का इस्तेमाल या कटाई कर सकते हैं।';
    }

    return '🌿 आज का मौसम खेती के लिए उपयुक्त है। रोजाना की देखभाल, पानी की जांच और मिट्टी परीक्षण करें।';
  };

  // Farming news headlines
  const farmingNews = [
    {
      id: 1,
      title: '🌾 केंद्र सरकार ने किसानों के लिए नई MSP घोषणा की - गेहूं ₹2,275/क्विंटल',
      category: 'Policy',
      urgent: true
    },
    {
      id: 2,
      title: '🚜 PM-KISAN योजना का 15वां किस्त जारी - 11 करोड़ किसानों को मिले ₹2000',
      category: 'Government',
      urgent: false
    },
    {
      id: 3,
      title: '☔ मौसम विभाग की चेतावनी: अगले 3 दिन भारी बारिश का अनुमान',
      category: 'Weather',
      urgent: true
    },
    {
      id: 4,
      title: '💰 आज के मंडी भाव: टमाटर ₹25/kg, प्याज ₹18/kg, आलू ₹20/kg',
      category: 'Market',
      urgent: false
    },
    {
      id: 5,
      title: '🌱 नई तकनीक: ड्रोन से छिड़काव पर 50% सब्सिडी - आवेदन शुरू',
      category: 'Technology',
      urgent: false
    },
    {
      id: 6,
      title: '📱 KisanGPT ऐप के 1 करोड़ डाउनलोड पूरे - किसानों का भरपूर समर्थन',
      category: 'App Update',
      urgent: false
    },
    {
      id: 7,
      title: '🐛 चेतावनी: रबी फसल में तना छेदक कीट का प्रकोप बढ़ा - तुरंत छिड़काव करें',
      category: 'Alert',
      urgent: true
    },
    {
      id: 8,
      title: '🏆 ऑर्गैनिक फार्मिंग अवार्ड 2024: पंजाब के किसान राम सिंह को मिला प्रथम पुरस्कार',
      category: 'Achievement',
      urgent: false
    },
    {
      id: 9,
      title: '💧 जल संरक्षण योजना: ड्रिप इरिगेशन पर 80% तक सब्सिडी उपलब्ध',
      category: 'Subsidy',
      urgent: false
    },
    {
      id: 10,
      title: '📊 कृषि GDP में 3.5% की बृद्धि - भारतीय कृषि का उज्ज्वल भविष्य',
      category: 'Statistics',
      urgent: false
    },
    {
      id: 11,
      title: '🌽 मक्का की नई हाइब्रिड किस्म: प्रति एकड़ 40% बढ़ा उत्पादन - IARI का नया आविष्कार',
      category: 'Research',
      urgent: false
    },
    {
      id: 12,
      title: '🚛 किसान रेल योजना: आज रात 11 बजे 150 टन आलू की खेप मुंबई रवाना',
      category: 'Transport',
      urgent: false
    },
    {
      id: 13,
      title: '☀️ सोलार पंप सब्सिडी: 90% तक सब्सिडी पर 5HP तक के पंप - ऑनलाइन आवेदन',
      category: 'Energy',
      urgent: false
    },
    {
      id: 14,
      title: '🐄 पशुपालन विकास योजना: दूध उत्पादन बढ़ाने के लिए मुफ्त पशु चिकित्सा',
      category: 'Livestock',
      urgent: false
    },
    {
      id: 15,
      title: '🌡️ गर्मी की चेतावनी: अगले 5 दिन 35°C+ तापमान - फसलों को गर्मी से बचाएं',
      category: 'Alert',
      urgent: true
    },
    {
      id: 16,
      title: '🍃 बायोफेर्टिलाइजर का प्रयोग: रासायनिक खाद की 50% बचत संभव - IIT दिल्ली का रिसर्च',
      category: 'Innovation',
      urgent: false
    },
    {
      id: 17,
      title: '🌾 फसल बीमा योजना: 31 मार्च तक प्रीमियम जमा करें - मात्र 2% प्रीमियम',
      category: 'Insurance',
      urgent: true
    },
    {
      id: 18,
      title: '🍂 मिलेट मिशन: 2024 मिलेट वर्ष - मोटे अनाज के उत्पादन पर विशेष बोनस',
      category: 'Mission',
      urgent: false
    },
    {
      id: 19,
      title: '🐝 मधुमक्खी पालन: हनी की बढ़ती मांग - प्रति किलो ₹400 तक भाव - आज का मार्केट',
      category: 'Beekeeping',
      urgent: false
    },
    {
      id: 20,
      title: '📱 KisanGPT AI अपडेट: अब 15 भारतीय भाषाओं में बात करें - नया v2.0 लाइव',
      category: 'Technology',
      urgent: false
    }
  ];

  // Cycle through news headlines every 4 seconds
  useEffect(() => {
    const newsInterval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => 
        prevIndex === farmingNews.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(newsInterval);
  }, [farmingNews.length]);

  const statsCards = [
    {
      // @ts-ignore
      title: t('dashboard.totalIncome'),
      value: cropRecommendations.length > 0 ? `₹${Math.round(cropRecommendations[0]?.expectedProfit || 45000).toLocaleString()}` : '₹45,000',
      change: '+12%',
      icon: <TrendingUp />,
      color: '#4caf50',
      description: tt('dashboard.estimatedProfit')
    },
    {
      title: tt('dashboard.soilHealth'),
      value: `${soilHealth}%`,
      change: satelliteData?.analysis?.soil_fertility_index > 80 ? 'Excellent' : 'Good',
      icon: <Agriculture />,
      color: '#2196f3',
      description: tt('dashboard.fromSatelliteData')
    },
    {
      title: tt('dashboard.cropHealth'),
      value: satelliteData ? `${satelliteData.analysis.crop_health_score}%` : '85%',
      change: satelliteData?.vegetation_indices?.ndvi > 0.7 ? '+Excellent' : '+Good',
      icon: <LocalFlorist />,
      color: '#ff9800',
      description: tt('dashboard.ndviBasedAnalysis')
    },
    {
      title: tt('dashboard.marketTrend'),
      value: marketPrices?.wheat ? `₹${marketPrices.wheat.currentPrice}` : '₹2,150',
      change: marketPrices?.wheat?.trend === 'up' ? `+${marketPrices.wheat.changePercent}%` : 'Stable',
      icon: <Assessment />,
      color: '#9c27b0',
      description: tt('dashboard.wheatRatePerQuintal')
    },
  ];

  const quickActions = [
    {
      title: `🌤️ ${tt('navbar.weather')}`,
      description: tt('dashboard.qa.weather'),
      icon: <LocationOn />,
      color: '#03a9f4',
      path: '/weather',
      badge: 'Hot',
    },
    {
      title: `👥 ${tt('navbar.community')}`,
      description: tt('dashboard.qa.community'),
      icon: <Group />,
      color: '#9c27b0',
      path: '/community',
      badge: 'New',
    },
    {
      title: `🎯 ${tt('navbar.cropRecommendation')}`,
      description: tt('dashboard.qa.cropRecommendation'),
      icon: <School />,
      color: '#4caf50',
      path: '/crop-recommendation',
      badge: 'AI',
    },
    {
      title: `💹 ${tt('navbar.marketAnalysis')}`,
      description: tt('dashboard.qa.marketAnalysis'),
      icon: <Assessment />,
      color: '#ff5722',
      path: '/market-analysis',
      badge: 'Live',
    },
    {
      title: `🏦 Loan / KCC Apply` ,
      description: 'Kheti ke liye seed/fertilizer/equipment loan request bhejein',
      icon: <AccountBalance />,
      color: '#2e7d32',
      path: '/loans',
      badge: 'New',
    },
    {
      title: `🤖 ${tt('navbar.aiChat')}`,
      description: tt('dashboard.qa.aiChat'),
      icon: <SmartToy />,
      color: '#4caf50',
      path: '/ai-chat',
      badge: 'Voice',
    },
    {
      title: '👩‍⚕️ ' + tt('diseaseDetection.title'),
      description: tt('dashboard.qa.diseaseDetection'),
      icon: <BugReport />,
      color: '#f44336',
      path: '/disease-detection',
      badge: 'Smart',
    },
    {
      title: '🆘 Quick Help',
      description: 'WhatsApp/Call expert with your location and issue',
      icon: <SmartToy />,
      color: '#e53935',
      path: '/help',
      badge: 'Help',
    },
    {
      title: `🛰️ ${tt('navbar.satellite')}`,
      description: tt('dashboard.qa.satelliteView'),
      icon: <Satellite />,
      color: '#2196f3',
      path: '/satellite-view',
      badge: '3D',
    },
    {
      title: `🌱 ${tt('navbar.arView')}`,
      description: tt('dashboard.qa.arView'),
      icon: <ViewInAr />,
      color: '#9c27b0',
      path: '/ar-visualization',
      badge: 'VR',
    },
    {
      title: `🏦 ${tt('navbar.governmentSchemes')}`,
      description: tt('dashboard.qa.governmentSchemes'),
      icon: <AccountBalance />,
      color: '#1976d2',
      path: '/government-subsidy',
      badge: 'Money',
    },
    {
      title: `🌧️ ${tt('navbar.rainAlerts')}`,
      description: tt('dashboard.qa.rainAlerts'),
      icon: <Notifications />,
      color: '#00bcd4',
      path: '/rain-alerts',
      badge: 'WhatsApp',
    },
    {
      title: `🎨 ${tt('dreamVisualization.title')}`,
      description: tt('dashboard.qa.dreamVisualization'),
      icon: <Psychology />,
      color: '#e91e63',
      path: '/dream-visualization',
      badge: 'Inspire',
    },
  ];

  return (
    <Box>
      <GlobalStyles
        styles={{
          '@keyframes glow': {
            '0%': {
              filter: 'drop-shadow(0 2px 4px rgba(255,193,7,0.3))'
            },
            '100%': {
              filter: 'drop-shadow(0 4px 8px rgba(255,193,7,0.6)) drop-shadow(0 0 12px rgba(255,193,7,0.4))'
            }
          }
        }}
      />
      {/* Breaking News Ticker */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NewsTicker
          items={farmingNews.map(n => ({ title: n.title, category: n.category, urgent: n.urgent, icon: n.urgent ? '⚠️' : '🌾' }))}
          height={56}
          speed={120}
          label="कृषि समाचार • Farming News"
        />
      </motion.div>

      <Box sx={{ p: { xs: 1, md: 3 } }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Paper
          className="glass-card-dark"
          sx={{
            p: { xs: 3, md: 5 },
            mb: { xs: 3, md: 5 },
            borderRadius: '32px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Background animated blob inside the card */}
          <Box sx={{
            position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', 
            background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)', zIndex: 0, animation: 'levitate 8s infinite'
          }} />

          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2, flex: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: '#10b981',
                mr: { xs: 2.5, md: 4 },
                width: { xs: 72, md: 96 },
                height: { xs: 72, md: 96 },
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Agriculture sx={{ fontSize: { xs: 40, md: 50 } }} />
            </Avatar>
            <Box>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, color: '#ffffff', letterSpacing: '-0.03em' }}>
                {t('dashboard.welcome', { name: userName })}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, mb: 2 }}>
                {t('dashboard.futureVision')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip icon={<LocationOn fontSize="small" sx={{ color: '#fff !important' }}/>} label={userEmail || 'India'} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} />
                <Chip label={new Intl.DateTimeFormat('hi-IN', { weekday: 'long', month: 'short', day: 'numeric' }).format(now)} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} />
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ position: 'relative', zIndex: 2, minWidth: { xs: '100%', md: '320px' }, p: 3, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
            <Typography variant="subtitle2" sx={{ color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, mb: 1 }}>
              {t('dashboard.personalizedAdvice')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#f8fafc', fontWeight: 500, lineHeight: 1.6 }}>
              {getWeatherBasedAdvice()}
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* Stats Cards */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main, display: 'flex', alignItems: 'center' }}>
        {`📈 ${tt('dashboard.yourFarmStats')}`}
      </Typography>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card
                className="glass-card"
                sx={{
                  borderRadius: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                {/* Colored accent line on top */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: stat.color }} />
                
                <CardContent sx={{ p: 3.5, pb: "28px !important" }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ flex: 1, pr: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                        {stat.title}
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 800,
                          color: '#022c22',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.1,
                          textShadow: '0 2px 10px rgba(0,0,0,0.03)'
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                    <div className="pulse-ring">
                      <Avatar
                        sx={{
                          bgcolor: '#ffffff',
                          color: stat.color,
                          width: 56,
                          height: 56,
                          boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                    </div>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                    <Chip
                      label={stat.change}
                      size="small"
                      sx={{
                        bgcolor: `${stat.color}15`,
                        color: stat.color,
                        fontWeight: 700,
                        border: 'none',
                        px: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      {stat.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 6,
            background: 'linear-gradient(145deg, #fef7e0 0%, #fff8e1 30%, #f9fbe7 70%, #f3e5f5 100%)',
            border: '2px solid rgba(255, 193, 7, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 16px rgba(255,193,7,0.15)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #ff6f00, #ff8f00, #ffb300, #ffc107)',
              boxShadow: '0 2px 8px rgba(255,193,7,0.3)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 12,
              right: 12,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 50%, transparent 100%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box 
              sx={{ 
                fontSize: '2rem', 
                mr: 2,
                filter: 'drop-shadow(0 2px 4px rgba(255,193,7,0.3))',
                animation: 'glow 2s ease-in-out infinite alternate'
              }}
            >
              🌅
            </Box>
            <Box>
              {isMobile ? (
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 800, 
                    color: '#f57c00', 
                    lineHeight: 1.2,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  आज का सारांश
                </Typography>
              ) : (
                <>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 800, 
                      color: '#f57c00', 
                      lineHeight: 1.2,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    आज का सारांश
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 500, 
                      color: '#ff8f00', 
                      opacity: 0.8,
                      letterSpacing: '0.5px'
                    }}
                  >
                    Today's Summary
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 4,
                  background: 'rgba(76, 175, 80, 0.08)',
                  border: '2px solid rgba(76, 175, 80, 0.12)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.15)'
                  }
                }}
              >
                {weatherLoading ? (
                  <Box sx={{ py: 3 }}>
                    <Typography variant="h4" sx={{ color: '#757575', mb: 2 }}>...</Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>लोड हो रहा है</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography 
                      variant="h1" 
                      sx={{ 
                        color: '#2e7d32', 
                        fontWeight: 900, 
                        mb: 1.5,
                        textShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                        fontSize: { xs: '2.5rem', md: '3.5rem' }
                      }}
                    >
                      {weatherData ? Math.round(weatherData.main.temp) : 28}°C
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#388e3c', 
                        fontWeight: 600, 
                        mb: 1,
                        fontSize: '1.1rem'
                      }}
                    >
                      ☀️ आज का तापमान
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50', opacity: 0.8, display: { xs: 'none', md: 'block' } }}>
                      Your Location
                    </Typography>
                    {location && (
                      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                        <Box sx={{ fontSize: '0.9rem', mr: 0.5, color: '#ff5722' }}>📍</Box>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                          {location.name}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 4,
                  background: 'rgba(33, 150, 243, 0.08)',
                  border: '2px solid rgba(33, 150, 243, 0.12)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(33, 150, 243, 0.15)'
                  }
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    color: '#1565c0', 
                    fontWeight: 900, 
                    mb: 1.5,
                    textShadow: '0 2px 8px rgba(21, 101, 192, 0.2)',
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  {weatherData ? weatherData.main.humidity : 65}%
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#1976d2', 
                    fontWeight: 600, 
                    mb: 1,
                    fontSize: '1.1rem'
                  }}
                >
                  💧 हवा में नमी
                </Typography>
                <Typography variant="body2" sx={{ color: '#2196f3', opacity: 0.8, display: { xs: 'none', md: 'block' } }}>
                  Humidity
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 4,
                  background: 'rgba(244, 67, 54, 0.08)',
                  border: '2px solid rgba(244, 67, 54, 0.12)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.15)'
                  }
                }}
              >
                <Typography 
                  variant="h2" 
                  sx={{ 
                    color: '#c62828', 
                    fontWeight: 800, 
                    mb: 1.5,
                    textShadow: '0 2px 8px rgba(198, 40, 40, 0.2)',
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    textTransform: 'capitalize'
                  }}
                >
                  {weatherData ? (
                    weatherData.weather[0].main === 'Clear' ? 'Clear' : 
                    weatherData.weather[0].main === 'Clouds' ? 'Cloudy' :
                    weatherData.weather[0].main === 'Rain' ? 'Rainy' :
                    weatherData.weather[0].main
                  ) : 'Clear'}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#d32f2f', 
                    fontWeight: 600, 
                    mb: 1,
                    fontSize: '1.1rem'
                  }}
                >
                  🌤️ मौसम स्थिति
                </Typography>
                <Typography variant="body2" sx={{ color: '#f44336', opacity: 0.8, textTransform: 'capitalize', display: { xs: 'none', md: 'block' } }}>
                  {weatherData ? weatherData.weather[0].description : 'clear sky'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  borderRadius: 4,
                  background: 'rgba(156, 39, 176, 0.08)',
                  border: '2px solid rgba(156, 39, 176, 0.12)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(156, 39, 176, 0.15)'
                  }
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    color: '#6a1b9a', 
                    fontWeight: 900, 
                    mb: 1.5,
                    textShadow: '0 2px 8px rgba(106, 27, 154, 0.2)',
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  {weatherData ? Math.round(weatherData.wind.speed * 3.6) : 13}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#7b1fa2', 
                    fontWeight: 600, 
                    mb: 1,
                    fontSize: '1.1rem'
                  }}
                >
                  🌬️ हवा की गति
                </Typography>
                <Typography variant="body2" sx={{ color: '#9c27b0', opacity: 0.8 }}>
                  km/h
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Today's Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <Paper elevation={6} sx={{ p: 3, mb: 4, borderRadius: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            ✅ आज के काम • Today’s Tasks
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              placeholder="नया काम जोड़ें..."
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTask((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              InputProps={{ endAdornment: (
                <IconButton onClick={() => {
                  const el = document.getElementById('taskInput') as HTMLInputElement | null;
                  if (el) { addTask(el.value); el.value=''; }
                }}>
                  <Add />
                </IconButton>
              )}}
              id="taskInput"
            />
          </Box>
          <List dense>
            {tasks.map((task) => (
              <ListItem
                key={task.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => deleteTask(task.id)} aria-label="delete">
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <IconButton onClick={() => toggleTask(task.id)} aria-label="toggle">
                    {task.done ? <CheckCircle sx={{ color: '#4caf50' }} /> : <RadioButtonUnchecked />}
                  </IconButton>
                </ListItemIcon>
                <ListItemText
                  primary={task.text}
                  primaryTypographyProps={{
                    sx: { textDecoration: task.done ? 'line-through' : 'none', color: task.done ? 'text.disabled' : 'text.primary' }
                  }}
                />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ mt: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Saved locally for {new Date(todayKey).toLocaleDateString('hi-IN')}
          </Typography>
        </Paper>
      </motion.div>

      {/* AI Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 50%, #e0f2f0 100%)',
            border: '2px solid rgba(76, 175, 80, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4caf50, #81c784, #a5d6a7)',
            },
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 3, display: 'flex', alignItems: 'center' }}>
            🤖 AI सुझाव • AI Insights
          </Typography>
          
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" sx={{ color: '#4caf50', mb: 2 }}>
                AI विश्लेषण हो रहा है... कृपया प्रतीक्षा करें
              </Typography>
              {[0, 1, 2].map((index) => (
                <LinearProgress 
                  key={index}
                  sx={{ 
                    mb: 1, 
                    height: 6, 
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }} 
                />
              ))}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {aiInsights.map((insight, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Alert 
                      severity="info" 
                      sx={{ 
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                          color: '#4caf50'
                        }
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {insight}
                      </Typography>
                    </Alert>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* Crop Recommendations Preview */}
          {cropRecommendations.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 2 }}>
                🌾 सुझाई गई फसलें (AI आधारित)
              </Typography>
              <Grid container spacing={2}>
                {cropRecommendations.slice(0, 3).map((crop, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card 
                      sx={{ 
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: `2px solid ${crop.suitabilityScore > 80 ? '#4caf50' : '#ffc107'}`,
                        borderRadius: 2
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {crop.hindiName}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip 
                            label={`${crop.suitabilityScore}% उपयुक्त`}
                            color={crop.suitabilityScore > 80 ? 'success' : 'warning'}
                            size="small"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            ₹{Math.round(crop.expectedProfit).toLocaleString()} लाभ
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={crop.suitabilityScore}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: crop.suitabilityScore > 80 ? '#4caf50' : '#ffc107',
                              borderRadius: 3
                            }
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Button
                variant="outlined"
                onClick={() => navigate('/crop-recommendation')}
                sx={{ 
                  mt: 2, 
                  color: '#4caf50', 
                  borderColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#4caf50',
                    color: 'white'
                  }
                }}
              >
                सभी सुझाव देखें →
              </Button>
            </Box>
          )}
        </Paper>
      </motion.div>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, display: 'flex', alignItems: 'center' }}>
          {`🚀 ${tt('dashboard.quickActions')} • Quick Actions`}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          आपके खेत के लिए आसान सेवाएं • Simple tools for your farm
        </Typography>
      </Box>

      {/* Primary Shortcuts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<CloudQueue />}
          onClick={() => navigate('/weather')}
          sx={{ borderRadius: 6, px: 2.5, py: 1.25 }}
        >
          {tt('navbar.weather')} • Weather
        </Button>
        <Button
          variant="outlined"
          startIcon={<Grass />}
          onClick={() => navigate('/crop-recommendation')}
          sx={{ borderRadius: 6, px: 2.5, py: 1.25 }}
        >
          {tt('navbar.cropRecommendation')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => navigate('/market-analysis')}
          sx={{ borderRadius: 6, px: 2.5, py: 1.25 }}
        >
          {tt('navbar.marketAnalysis')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<SmartToy />}
          onClick={() => navigate('/ai-chat')}
          sx={{ borderRadius: 6, px: 2.5, py: 1.25 }}
        >
          {tt('navbar.aiChat')}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} lg={4} xl={3} key={index}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                elevation={4}
                onClick={() => navigate(action.path)}
                sx={{
                  borderRadius: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-10px) scale(1.04)',
                    boxShadow: `0 25px 50px ${action.color}35, 0 10px 20px rgba(0,0,0,0.1)`,
                    background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.97) 50%, rgba(255,255,255,0.95) 100%)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${action.color}, ${action.color}80)`,
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3, position: 'relative' }}>
                  {action.badge && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: action.color,
                        color: 'white',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        boxShadow: `0 2px 8px ${action.color}40`,
                      }}
                    >
                      {action.badge}
                    </Box>
                  )}
                  <Avatar
                    sx={{
                      bgcolor: action.color,
                      mx: 'auto',
                      mb: 2,
                      width: 82,
                      height: 82,
                      boxShadow: `0 8px 20px ${action.color}30`,
                      background: `linear-gradient(135deg, ${action.color}, ${action.color}cc)`,
                    }}
                  >
                    {action.icon}
                  </Avatar>
                  <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 'bold', color: 'text.primary' }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {action.description}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(action.path);
                    }}
                    sx={{
                      borderRadius: 3,
                      py: 1.4,
                      fontWeight: 'bold',
                      background: `linear-gradient(45deg, ${action.color}, ${action.color}cc)`,
                      boxShadow: `0 4px 15px ${action.color}40`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${action.color}dd, ${action.color}aa)`,
                        boxShadow: `0 6px 20px ${action.color}50`,
                      },
                    }}
                  >
                    {tt('dashboard.startNow')} • Start
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Success Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.8 }}
      >
        <Paper
          elevation={8}
          sx={{
            mt: 5,
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 50%, #e0f2e0 100%)',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid rgba(76, 175, 80, 0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)',
            },
            '&::after': {
              content: '"🌿"',
              position: 'absolute',
              top: 20,
              right: 30,
              fontSize: '80px',
              opacity: 0.1,
              zIndex: 1,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Visibility sx={{ mr: 2, color: theme.palette.primary.main, fontSize: 28 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
                🌾 आपकी खेती यात्रा
              </Typography>
            </Box>
            
            <Typography variant="h6" sx={{ mb: 3, color: theme.palette.text.primary, fontStyle: 'italic' }}>
              "निरंतर प्रयास से आपके सपने हकीकत बन जाएंगे!"
            </Typography>

            {/* Multiple Progress Indicators */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    🌱 फसल सफलता
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'rgba(76, 175, 80, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#4caf50',
                        borderRadius: 6,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    85% - उत्कृष्ट प्रगति
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    💰 आर्थिक लक्ष्य
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={72}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'rgba(255, 193, 7, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#ffc107',
                        borderRadius: 6,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    72% - लक्ष्य की ओर
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                    📈 ज्ञान वृद्धि
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={90}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'rgba(33, 150, 243, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#2196f3',
                        borderRadius: 6,
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    90% - नया सीख रहे हैं
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium', color: theme.palette.primary.dark }}>
                🏆 आज का सुझाव: अपने खेत में मिट्टी परीक्षण कराएं और पौषण तत्वों की जांच करें।
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
      
      {/* Quick Suggestions Chips */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <Paper
          elevation={3}
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center' }}>
            ✨ आज के सुझाव
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {[
              { text: '🌡️ मौसम देखें', color: '#2196f3', path: '/weather' },
              { text: '🤖 AI से बात करें', color: '#4caf50', path: '/ai-chat' },
              { text: '📊 बाजार रेट देखें', color: '#ff9800', path: '/market-analysis' },
              { text: '🌱 फसल सुझाव', color: '#9c27b0', path: '/crop-recommendation' },
              { text: '👩‍⚕️ फसल डॉक्टर', color: '#f44336', path: '/disease-detection' },
            ].map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Chip
                  label={suggestion.text}
                  onClick={() => navigate(suggestion.path)}
                  sx={{
                    fontSize: '0.85rem',
                    fontWeight: 'medium',
                    py: 1.5,
                    px: 2,
                    height: 'auto',
                    background: `linear-gradient(45deg, ${suggestion.color}, ${suggestion.color}cc)`,
                    color: 'white',
                    border: `2px solid ${suggestion.color}30`,
                    boxShadow: `0 4px 15px ${suggestion.color}30`,
                    cursor: 'pointer',
                    '&:hover': {
                      background: `linear-gradient(45deg, ${suggestion.color}dd, ${suggestion.color}aa)`,
                      boxShadow: `0 6px 20px ${suggestion.color}40`,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </Paper>
      </motion.div>
      

      {/* Voice Control FAB */}
      <Fab
        color="secondary"
        onClick={handleMotivationalSpeech}
        disabled={isSpeaking}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 70,
          height: 70,
          background: 'linear-gradient(45deg, #4caf50, #81c784)',
          boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
          '&:hover': {
            background: 'linear-gradient(45deg, #45a049, #7cb342)',
            boxShadow: '0 12px 35px rgba(76, 175, 80, 0.5)',
            transform: 'scale(1.1)',
          },
          '&:disabled': {
            background: 'linear-gradient(45deg, #9e9e9e, #bdbdbd)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {isSpeaking ? <VolumeOff sx={{ fontSize: 32 }} /> : <VolumeUp sx={{ fontSize: 32 }} />}
      </Fab>
    </Box>
  </Box>
  );
};

export default Dashboard;
