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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ttsService } from '../services/ttsService';
import axios from 'axios';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userName, setUserName] = useState('किसान जी');
  const [userEmail, setUserEmail] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lon: number, name: string} | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [newsTickerPaused, setNewsTickerPaused] = useState(false);

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

  useEffect(() => {
    // Welcome message when component loads - wait for userName to be set
    if (userName && userName !== 'किसान जी') {
      const welcomeMessage = `नमस्कार ${userName}! किसान जीपीटी में आपका स्वागत है। आज का मौसम खेती के लिए अनुकूल है।`;
      setTimeout(() => {
        handleTTSSpeak(welcomeMessage);
      }, 1000);
    }
  }, [userName]);

  // Get user location and weather data
  useEffect(() => {
    getCurrentLocation();
  }, []);

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
      title: t('dashboard.totalIncome'),
      value: '₹45,000',
      change: '+12%',
      icon: <TrendingUp />,
      color: '#4caf50',
      description: 'इस महीने की कुल आय'
    },
    {
      title: t('dashboard.policyReviews'),
      value: '8',
      change: 'New',
      icon: <Policy />,
      color: '#2196f3',
      description: 'नई सरकारी योजनाएं'
    },
    {
      title: t('dashboard.successPredictions'),
      value: '85%',
      change: '+5%',
      icon: <AutoGraph />,
      color: '#ff9800',
      description: 'फसल सफलता दर'
    },
    {
      title: 'Weather Score',
      value: '92/100',
      change: 'Excellent',
      icon: <LocationOn />,
      color: '#9c27b0',
      description: 'आज का मौसम स्कोर'
    },
  ];

  const quickActions = [
    {
      title: '🌤️ मौसम की जानकारी',
      description: 'आज का मौसम और खेती की स्थिति देखें',
      icon: <LocationOn />,
      color: '#03a9f4',
      path: '/weather',
      badge: 'Hot',
    },
    {
      title: '👥 किसान कम्युनिटी',
      description: 'अपने आस-पास के किसानों से जुड़ें',
      icon: <Group />,
      color: '#9c27b0',
      path: '/community',
      badge: 'New',
    },
    {
      title: '🎯 फसल सुझाव',
      description: 'आपकी मिट्टी के लिए बेहतर फसल का चुनाव',
      icon: <School />,
      color: '#4caf50',
      path: '/crop-recommendation',
      badge: 'AI',
    },
    {
      title: '💹 बाजार विश्लेषण',
      description: 'फसलों के दाम और बाजार की भविष्यवाणी',
      icon: <Assessment />,
      color: '#ff5722',
      path: '/market-analysis',
      badge: 'Live',
    },
    {
      title: '🤖 AI किसान मित्र',
      description: 'खेती के सवालों के लिए AI सहायक',
      icon: <SmartToy />,
      color: '#4caf50',
      path: '/ai-chat',
      badge: 'Voice',
    },
    {
      title: '👩‍⚕️ फसल डॉक्टर',
      description: 'पौधों की बीमारियों की पहचान और इलाज',
      icon: <BugReport />,
      color: '#f44336',
      path: '/disease-detection',
      badge: 'Smart',
    },
    {
      title: '🛰️ सैटेलाइट व्यू',
      description: 'अपने खेत को सैटेलाइट से देखें',
      icon: <Satellite />,
      color: '#2196f3',
      path: '/satellite-view',
      badge: '3D',
    },
    {
      title: '🌱 AR प्लांट व्यू',
      description: 'फसलों को 3D में देखें AR/VR तकनीक से',
      icon: <ViewInAr />,
      color: '#9c27b0',
      path: '/ar-visualization',
      badge: 'VR',
    },
    {
      title: '🌧️ रेन अलर्ट',
      description: 'बारिश की भविष्यवाणी और WhatsApp अलर्ट',
      icon: <Notifications />,
      color: '#00bcd4',
      path: '/rain-alerts',
      badge: 'WhatsApp',
    },
    {
      title: '🎨 सपनों का विज़ुअलाइज़ेशन',
      description: 'मानसिक सहायता और प्रेरणा पाएं',
      icon: <Psychology />,
      color: '#e91e63',
      path: '/dream-visualization',
      badge: 'Inspire',
    },
  ];

  return (
    <Box>
      {/* Breaking News Ticker */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
      >
        <Paper
          elevation={4}
          sx={{
            background: farmingNews[currentNewsIndex]?.urgent 
              ? 'linear-gradient(135deg, #ff5722 0%, #ff7043 30%, #ff8a65 70%, #ffab91 100%)'
              : 'linear-gradient(135deg, #2e7d32 0%, #388e3c 30%, #4caf50 70%, #66bb6a 100%)',
            color: 'white',
            p: { xs: 1, md: 1.5 },
            mb: 0,
            borderRadius: { xs: 0, md: 2 },
            position: 'sticky',
            top: 64,
            zIndex: 100,
            overflow: 'hidden',
            boxShadow: farmingNews[currentNewsIndex]?.urgent 
              ? '0 4px 20px rgba(255, 87, 34, 0.4), 0 2px 10px rgba(0,0,0,0.2)'
              : '0 4px 20px rgba(46, 125, 50, 0.4), 0 2px 10px rgba(0,0,0,0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              animation: 'shimmer 3s infinite',
              pointerEvents: 'none',
            },
            '@keyframes shimmer': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', height: { xs: '35px', md: '40px' } }}>
            {/* Breaking News Label */}
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                px: 2,
                py: 0.5,
                mr: 2,
                minWidth: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {farmingNews[currentNewsIndex]?.urgent ? '🚨 Breaking' : '📢 News'}
              </Typography>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: farmingNews[currentNewsIndex]?.urgent ? '#ffeb3b' : '#4caf50',
                  animation: farmingNews[currentNewsIndex]?.urgent ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1, transform: 'scale(1)', boxShadow: '0 0 5px rgba(255,235,59,0.5)' },
                    '50%': { opacity: 0.7, transform: 'scale(1.3)', boxShadow: '0 0 15px rgba(255,235,59,0.8)' },
                    '100%': { opacity: 1, transform: 'scale(1)', boxShadow: '0 0 5px rgba(255,235,59,0.5)' },
                  },
                }}
              />
            </Box>

            {/* Scrolling News Content */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <ScrollingTicker speed={30}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'medium',
                    fontSize: { xs: '0.85rem', md: '0.95rem' },
                    whiteSpace: 'nowrap',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                  }}
                >
                  {farmingNews[currentNewsIndex]?.title}
                  <Box component="span" sx={{ mx: 4, color: 'rgba(255,255,255,0.7)' }}>•</Box>
                  <Box component="span" sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    px: 1, 
                    py: 0.2, 
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}>
                    {farmingNews[currentNewsIndex]?.category}
                  </Box>
                </Typography>
              </ScrollingTicker>
            </Box>

            {/* News Counter */}
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                px: 1,
                py: 0.2,
                ml: 2,
                minWidth: 'fit-content',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                }}
              >
                {currentNewsIndex + 1}/{farmingNews.length}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={8}
          sx={{
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 25%, #4caf50 75%, #81c784 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
              zIndex: 1,
            },
            '&::after': {
              content: '"🌾"',
              position: 'absolute',
              top: 20,
              right: 30,
              fontSize: '60px',
              opacity: 0.3,
              zIndex: 1,
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative', zIndex: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mr: 3,
                width: 70,
                height: 70,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                border: '3px solid rgba(255,255,255,0.3)',
              }}
            >
              <Agriculture sx={{ fontSize: 35 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                {t('dashboard.welcome', { name: userName })}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                {t('dashboard.futureVision')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                {userEmail && (
                  <Typography variant="body2" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                    📫 {userEmail}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                  📅 {new Date().toLocaleDateString('hi-IN', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                  ⏰ {new Date().toLocaleTimeString('hi-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ position: 'relative', zIndex: 2, mt: 2, p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
              {t('dashboard.personalizedAdvice')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
              {getWeatherBasedAdvice()}
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* Stats Cards */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main, display: 'flex', alignItems: 'center' }}>
        📈 आपके खेत के आंकड़े
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                elevation={6}
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.03)',
                    boxShadow: `0 25px 50px ${stat.color}40, 0 8px 16px rgba(0,0,0,0.15)`,
                    background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 100%)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${stat.color}, ${stat.color}aa)`,
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: stat.color,
                        mr: 2,
                        width: 56,
                        height: 56,
                        boxShadow: `0 4px 12px ${stat.color}40`,
                        background: `linear-gradient(135deg, ${stat.color}, ${stat.color}cc)`,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: stat.color, mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'medium', mb: 1 }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {stat.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={stat.change}
                      size="small"
                      sx={{
                        bgcolor: `${stat.color}15`,
                        color: stat.color,
                        fontWeight: 'bold',
                        border: `1px solid ${stat.color}30`,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      आज अपडेटेड
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
          elevation={6}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #fff3e0 0%, #fffde7 50%, #f9fbe7 100%)',
            border: '2px solid rgba(255, 193, 7, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ff9800, #ffc107, #ffeb3b)',
            },
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f57c00', mb: 3, display: 'flex', alignItems: 'center' }}>
            🌅 आज का सारांश
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                {weatherLoading ? (
                  <Typography variant="h4" sx={{ color: '#757575' }}>...</Typography>
                ) : (
                  <Typography variant="h2" sx={{ color: '#4caf50', fontWeight: 'bold', mb: 1 }}>
                    {weatherData ? Math.round(weatherData.main.temp) : 28}°C
                  </Typography>
                )}
                <Typography variant="body1" color="text.secondary">
                  ☀️ आज का तापमान
                </Typography>
                {location && (
                  <Typography variant="caption" color="text.secondary">
                    📍 {location.name}
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h2" sx={{ color: '#2196f3', fontWeight: 'bold', mb: 1 }}>
                  {weatherData ? weatherData.main.humidity : 65}%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  💧 हवा में नमी
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Humidity
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h2" sx={{ color: '#ff5722', fontWeight: 'bold', mb: 1 }}>
                  {weatherData ? weatherData.weather[0].main : 'Good'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  🌤️ मौसम स्थिति
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {weatherData ? weatherData.weather[0].description : 'Clear sky'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h2" sx={{ color: '#9c27b0', fontWeight: 'bold', mb: 1 }}>
                  {weatherData ? Math.round(weatherData.wind.speed * 3.6) : 15}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  🌬️ हवा की गति
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  km/h
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, display: 'flex', alignItems: 'center' }}>
          🚀 तुरंत सेवाएं
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          आपके खेत के लिए समार्ट समाधान
        </Typography>
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
                      width: 70,
                      height: 70,
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
                      py: 1.2,
                      background: `linear-gradient(45deg, ${action.color}, ${action.color}cc)`,
                      boxShadow: `0 4px 15px ${action.color}40`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${action.color}dd, ${action.color}aa)`,
                        boxShadow: `0 6px 20px ${action.color}50`,
                      },
                    }}
                  >
                    अभी शुरू करें
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
      
      {/* Floating Weather Widget */}
      {weatherData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              top: { xs: 'auto', md: 120 },
              bottom: { xs: 100, md: 'auto' },
              right: 24,
              zIndex: 999,
              p: 2,
              minWidth: 200,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: 4,
              border: '2px solid rgba(33, 150, 243, 0.2)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 12px 30px rgba(33, 150, 243, 0.3)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                🌤️ LIVE WEATHER
              </Typography>
              <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold', mb: 0.5 }}>
                {Math.round(weatherData.main.temp)}°C
              </Typography>
              <Typography variant="body2" sx={{ color: '#1565c0', mb: 1 }}>
                {weatherData.weather[0].main}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <Typography variant="caption">💧 {weatherData.main.humidity}%</Typography>
                <Typography variant="caption">🌬️ {Math.round(weatherData.wind.speed * 3.6)}km/h</Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      )}

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
