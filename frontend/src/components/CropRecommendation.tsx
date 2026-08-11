import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Paper,
  useTheme,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  MenuItem,
  Slider,
  Rating,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from '@mui/material';
import {
  Agriculture,
  LocationOn,
  CalendarMonth,
  WaterDrop,
  AttachMoney,
  TrendingUp,
  CheckCircle,
  Warning,
  MonetizationOn,
  ExpandMore,
  Person,
  Thermostat,
  Cloud,
  Star,
  LocalFlorist,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';
import { cropRecommendationEngine } from '../services/cropRecommendationEngine';
import { satelliteService } from '../services/satelliteService';
import { marketPriceService } from '../services/marketPriceService';
import { locationService } from '../services/locationService';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

interface CropRecommendationData {
  name: string;
  name_hindi: string;
  suitability_score: number; // 0-10 scale
  expected_yield: string;
  market_price: string;
  profit_potential: string;
  growth_duration: string;
  water_requirement: string;
  soil_type: string[];
  season: string;
  benefits: string[];
  considerations: string[];
  sustainability_score?: number; // 0-100
  market_demand?: 'high' | 'medium' | 'low';
  why_reason?: string;
}

interface FormData {
  name: string;
  location: string;
  coordinates?: { lat: number; lon: number; city: string; state: string };
  season: string;
  soil_type: string;
  water_availability: string;
  budget_range: string;
  farm_size: number;
  experience_level: string;
  primary_goal: string;
  irrigation_method: string;
  phone: string;
  weatherData?: any;
}

const CropRecommendation: React.FC = () => {
  const { t } = (useTranslation as any)();
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState<CropRecommendationData[]>([]);
  const [loading, setLoading] = useState(false);
  // Preferences for re-ranking
  const [prefProfit, setPrefProfit] = useState<number>(40);
  const [prefSustain, setPrefSustain] = useState<number>(35);
  const [prefWater, setPrefWater] = useState<number>(25);
  // Compare selection
  const [compareSelected, setCompareSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  // Planned crops
  const [planned, setPlanned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('planned_crops') || '[]'); } catch { return []; }
  });
  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    season: '',
    soil_type: '',
    water_availability: '',
    budget_range: '',
    farm_size: 2,
    experience_level: '',
    primary_goal: '',
    irrigation_method: '',
    phone: '',
  });
  const [activeStep, setActiveStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  // AI Services Data
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [soilAnalysis, setSoilAnalysis] = useState<any>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [useSatellite, setUseSatellite] = useState(true);
  const [fieldContext, setFieldContext] = useState<{ ndvi?: number; ph?: number; soil_type?: string; season?: string } | null>(null);

  const steps = ['खेत की जानकारी', 'फसल सुझाव'];

  const seasons = [
    { value: 'रबी', label: 'रबी (अक्टूबर-मार्च) - सर्दी की फसल' },
    { value: 'खरीफ', label: 'खरीफ (जून-अक्टूबर) - मानसून की फसल' },
    { value: 'जायद', label: 'जायद (मार्च-जून) - गर्मी की फसल' },
  ];

  const primaryGoals = [
    { value: 'अधिकतम_मुनाफा', label: 'अधिकतम मुनाफा कमाना' },
    { value: 'कम_जोखिम', label: 'कम जोखिम के साथ स्थिर आय' },
    { value: 'ऑर्गैनिक', label: 'ऑर्गैनिक खेती करना' },
    { value: 'निर्यात', label: 'निर्यात के लिए उत्पादन' },
    { value: 'पारंपरिक', label: 'पारंपरिक खेती जारी रखना' },
  ];

  const irrigationMethods = [
    { value: 'नहर', label: 'नहर से सिंचाई' },
    { value: 'बोरवेल', label: 'बोरवेल/ट्यूबवेल' },
    { value: 'ड्रिप', label: 'ड्रिप इरिगेशन' },
    { value: 'वर्षा', label: 'केवल बारिश पर निर्भर' },
    { value: 'तालाब', label: 'तालाब/कुआं' },
  ];

  const soilTypes = [
    { value: 'sandy', label: 'Sandy Soil (बलुई मिट्टी)' },
    { value: 'loamy', label: 'Loamy Soil (दोमट मिट्टी)' },
    { value: 'clayey', label: 'Clayey Soil (चिकनी मिट्टी)' },
    { value: 'black', label: 'Black Soil (काली मिट्टी)' },
    { value: 'red', label: 'Red Soil (लाल मिट्टी)' },
  ];

  const waterAvailability = [
    { value: 'abundant', label: 'Abundant (प्रचुर)' },
    { value: 'adequate', label: 'Adequate (पर्याप्त)' },
    { value: 'limited', label: 'Limited (सीमित)' },
    { value: 'scarce', label: 'Scarce (दुर्लभ)' },
  ];

  const budgetRanges = [
    { value: 'low', label: 'Low (₹10,000 - ₹50,000)' },
    { value: 'medium', label: 'Medium (₹50,000 - ₹1,50,000)' },
    { value: 'high', label: 'High (₹1,50,000+)' },
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner (नया किसान)' },
    { value: 'intermediate', label: 'Intermediate (अनुभवी)' },
    { value: 'expert', label: 'Expert (विशेषज्ञ)' },
  ];

  // Get user location on component mount using enhanced location service
  useEffect(() => {
    getCurrentLocationEnhanced();
  }, []);

  const getCurrentLocationEnhanced = async () => {
    setLocationLoading(true);
    try {
      console.log('🌍 Getting enhanced location data...');
      const location = await locationService.getCurrentLocation();
      
      const locationString = locationService.formatLocationDisplay(location);
      
      setFormData(prev => ({
        ...prev,
        location: locationString,
        coordinates: {
          lat: location.latitude,
          lon: location.longitude,
          city: location.address?.city || 'Unknown',
          state: location.address?.state || 'India'
        }
      }));
      
      // Also get weather data for the real location
      await getWeatherData(location.latitude, location.longitude);
      
      console.log('✅ Location updated:', locationString);
      
    } catch (error) {
      console.error('❌ Enhanced location error:', error);
      // Fallback to original method
      getCurrentLocation();
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await getLocationDetails(latitude, longitude);
          await getWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Location error:', error);
          // Fallback to Delhi
          getLocationDetails(28.6139, 77.2090);
          getWeatherData(28.6139, 77.2090);
        },
        { timeout: 10000 }
      );
    }
  };

  const getLocationDetails = async (lat: number, lon: number) => {
    try {
      const API_KEY = '2d8a45c2b33b3f6c9d8f4d5e6f1a2b3c';
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
      );
      
      if (response.data && response.data[0]) {
        const location = response.data[0];
        setFormData(prev => ({
          ...prev,
          location: `${location.name}, ${location.state}`,
          coordinates: {
            lat,
            lon,
            city: location.name,
            state: location.state,
          }
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setFormData(prev => ({
        ...prev,
        location: 'Delhi, Delhi',
        coordinates: { lat, lon, city: 'Delhi', state: 'Delhi' }
      }));
    } finally {
      setLocationLoading(false);
    }
  };

  const getWeatherData = async (lat: number, lon: number) => {
    try {
      const API_KEY = '2d8a45c2b33b3f6c9d8f4d5e6f1a2b3c';
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      setFormData(prev => ({ ...prev, weatherData: response.data }));
    } catch (error) {
      console.error('Weather API error:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      fetchRecommendations();
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Location-based crop database
  const getLocationBasedCrops = () => {
    const allCrops = [
      // Rabi Crops
      {
        name: 'Wheat',
        name_hindi: 'गेहूं',
        base_suitability_score: 8.5,
        expected_yield: '35-45 क्विंटल/हेक्टेयर',
        market_price: '₹2,200-2,400/क्विंटल',
        profit_potential: 'उच्च (₹70,000-1,00,000/हेक्टेयर)',
        growth_duration: '120-150 दिन',
        water_requirement: 'मध्यम (4-5 सिंचाई)',
        soil_type: ['दोमट', 'चिकनी दोमट'],
        season: 'रबी',
        benefits: ['सरकारी खरीद गारंटी', 'स्थिर मार्केट', 'भंडारण आसान'],
        considerations: ['समय पर सिंचाई जरूरी', 'कीट प्रबंधन चाहिए'],
        regions: ['पंजाब', 'हरियाणा', 'उत्तर प्रदेश', 'बिहार', 'राजस्थान'],
        irrigation_methods: ['नहर', 'बोरवेल', 'ड्रिप'],
        difficulty: 'आसान'
      },
      {
        name: 'Mustard',
        name_hindi: 'सरसों',
        base_suitability_score: 7.8,
        expected_yield: '15-20 क्विंटल/हेक्टेयर',
        market_price: '₹5,500-6,500/क्विंटल',
        profit_potential: 'उच्च (₹50,000-80,000/हेक्टेयर)',
        growth_duration: '90-120 दिन',
        water_requirement: 'कम (2-3 सिंचाई)',
        soil_type: ['दोमट', 'बलुई दोमट'],
        season: 'रबी',
        benefits: ['कम पानी चाहिए', 'अच्छा मार्जिन', 'तेल की मांग'],
        considerations: ['मौसम संवेदनशील', 'एफिड का खतरा'],
        regions: ['राजस्थान', 'हरियाणा', 'पंजाब', 'उत्तर प्रदेश'],
        irrigation_methods: ['नहर', 'बोरवेल', 'वर्षा'],
        difficulty: 'आसान'
      },
      // Kharif Crops
      {
        name: 'Rice',
        name_hindi: 'धान',
        base_suitability_score: 9.0,
        expected_yield: '60-80 क्विंटल/हेक्टेयर',
        market_price: '₹1,940-2,040/क्विंटल',
        profit_potential: 'उच्च (₹80,000-1,20,000/हेक्टेयर)',
        growth_duration: '120-160 दिन',
        water_requirement: 'अधिक (बाढ़ की स्थिति)',
        soil_type: ['चिकनी', 'दोमट', 'चिकनी दोमट'],
        season: 'खरीफ',
        benefits: ['मुख्य भोजन', 'सरकारी खरीद', 'अधिक उत्पादन'],
        considerations: ['बहुत पानी चाहिए', 'मेहनत अधिक', 'बीमारी का खतरा'],
        regions: ['पंजाब', 'हरियाणा', 'पश्चिम बंगाल', 'आंध्र प्रदेश'],
        irrigation_methods: ['नहर', 'बोरवेल', 'वर्षा'],
        difficulty: 'मध्यम'
      },
      {
        name: 'Cotton',
        name_hindi: 'कपास',
        base_suitability_score: 7.5,
        expected_yield: '15-25 क्विंटल/हेक्टेयर',
        market_price: '₹5,500-6,500/क्विंटल',
        profit_potential: 'उच्च (₹70,000-1,20,000/हेक्टेयर)',
        growth_duration: '160-180 दिन',
        water_requirement: 'मध्यम (6-8 सिंचाई)',
        soil_type: ['काली', 'दोमट'],
        season: 'खरीफ',
        benefits: ['नकदी फसल', 'टेक्सटाइल मांग', 'निर्यात संभावना'],
        considerations: ['कीट की समस्या', 'अधिक दवा', 'मार्केट रिस्क'],
        regions: ['गुजरात', 'महाराष्ट्र', 'आंध्र प्रदेश', 'राजस्थान'],
        irrigation_methods: ['बोरवेल', 'ड्रिप', 'नहर'],
        difficulty: 'कठिन'
      },
      {
        name: 'Sugarcane',
        name_hindi: 'गन्ना',
        base_suitability_score: 8.2,
        expected_yield: '700-1000 क्विंटल/हेक्टेयर',
        market_price: '₹350-380/क्विंटल',
        profit_potential: 'अत्यधिक (₹1,50,000-2,50,000/हेक्टेयर)',
        growth_duration: '10-12 महीने',
        water_requirement: 'अधिक (10-12 सिंचाई)',
        soil_type: ['दोमट', 'चिकनी दोमट'],
        season: 'खरीफ',
        benefits: ['अधिक मुनाफा', 'चीनी मिल गारंटी', 'लंबी फसल'],
        considerations: ['अधिक पानी', 'भारी निवेश', 'लंबा इंतजार'],
        regions: ['उत्तर प्रदेश', 'महाराष्ट्र', 'कर्नाटक', 'पंजाब'],
        irrigation_methods: ['नहर', 'बोरवेल', 'ड्रिप'],
        difficulty: 'कठिन'
      },
      // Zaid Crops
      {
        name: 'Watermelon',
        name_hindi: 'तरबूज',
        base_suitability_score: 7.2,
        expected_yield: '200-300 क्विंटल/हेक्टेयर',
        market_price: '₹8-15/kg',
        profit_potential: 'उच्च (₹80,000-1,50,000/हेक्टेयर)',
        growth_duration: '90-100 दिन',
        water_requirement: 'मध्यम (ड्रिप आदर्श)',
        soil_type: ['बलुई दोमट', 'दोमट'],
        season: 'जायद',
        benefits: ['गर्मी में मांग', 'अच्छा मार्जिन', 'जल्दी फसल'],
        considerations: ['बाजार उतार-चढ़ाव', 'परिवहन की समस्या'],
        regions: ['राजस्थान', 'गुजरात', 'हरियाणा', 'पंजाब'],
        irrigation_methods: ['ड्रिप', 'बोरवेल'],
        difficulty: 'मध्यम'
      },
      {
        name: 'Muskmelon',
        name_hindi: 'खरबूजा',
        base_suitability_score: 6.8,
        expected_yield: '150-250 क्विंटल/हेक्टेयर',
        market_price: '₹10-20/kg',
        profit_potential: 'मध्यम (₹60,000-1,20,000/हेक्टेयर)',
        growth_duration: '85-95 दिन',
        water_requirement: 'मध्यम (6-8 सिंचाई)',
        soil_type: ['बलुई दोमट', 'दोमट'],
        season: 'जायद',
        benefits: ['गर्मी की मांग', 'कम समय', 'पोषक तत्व'],
        considerations: ['मार्केटिंग चुनौती', 'फल मक्खी का डर'],
        regions: ['राजस्थान', 'गुजरात', 'हरियाणा'],
        irrigation_methods: ['ड्रिप', 'बोरवेल'],
        difficulty: 'मध्यम'
      }
    ];

    return allCrops;
  };

  // Smart recommendation algorithm
  const calculateSuitabilityScore = (crop: any, formData: FormData) => {
    let score = crop.base_suitability_score;

    // Season matching
    if (crop.season === formData.season) score += 1.5;
    else score -= 2;

    // Soil type matching
    if (crop.soil_type.some((soil: string) => soil.includes(formData.soil_type))) {
      score += 1;
    } else {
      score -= 1.5;
    }

    // Experience level adjustment
    if (formData.experience_level === 'beginner' && crop.difficulty === 'कठिन') {
      score -= 2;
    } else if (formData.experience_level === 'expert' && crop.difficulty === 'कठिन') {
      score += 0.5;
    }

    // Budget considerations
    if (formData.budget_range === 'low' && crop.name === 'Sugarcane') {
      score -= 2;
    } else if (formData.budget_range === 'high') {
      score += 0.5;
    }

    // Farm size considerations
    if (formData.farm_size < 2 && crop.name === 'Sugarcane') {
      score -= 1;
    } else if (formData.farm_size > 5) {
      score += 0.5;
    }

    // Water availability
    if (formData.water_availability === 'scarce' || formData.water_availability === 'limited') {
      if (crop.water_requirement.includes('अधिक')) {
        score -= 2;
      } else if (crop.water_requirement.includes('कम')) {
        score += 1;
      }
    }

    // Irrigation method compatibility
    if (crop.irrigation_methods.includes(formData.irrigation_method)) {
      score += 0.5;
    }

    // Weather data integration
    if (formData.weatherData) {
      const temp = formData.weatherData.main.temp;
      const humidity = formData.weatherData.main.humidity;

      // Temperature adjustments
      if (crop.season === 'रबी' && temp < 20) score += 0.5;
      if (crop.season === 'खरीफ' && temp > 25) score += 0.5;
      if (crop.season === 'जायद' && temp > 30) score += 0.8;

      // Humidity adjustments
      if (crop.name === 'Rice' && humidity > 70) score += 0.5;
      if ((crop.name === 'Watermelon' || crop.name === 'Muskmelon') && humidity < 60) score += 0.5;
    }

    // Location-based adjustments
    if (formData.coordinates && crop.regions) {
      const userState = formData.coordinates.state;
      if (crop.regions.some((region: string) => region.includes(userState))) {
        score += 1;
      }
    }

    // Primary goal matching
    if (formData.primary_goal === 'अधिकतम_मुनाफा' && 
        crop.profit_potential.includes('अत्यधिक')) {
      score += 1;
    } else if (formData.primary_goal === 'कम_जोखिम' && 
               crop.difficulty === 'आसान') {
      score += 1;
    }

    return Math.max(0, Math.min(10, score));
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setAiProcessing(true);
    try {
      if (!formData.coordinates) {
        throw new Error('स्थान की जानकारी उपलब्ध नहीं है');
      }

      // If satellite toggle is on, use backend advanced endpoint directly
      if (useSatellite) {
        const url = API_BASE ? `${API_BASE}/api/v1/crop/recommend-advanced` : `/api/v1/crop/recommend-advanced`;
        const adv = await axios.get(url, {
          params: { lat: formData.coordinates.lat, lng: formData.coordinates.lon }
        });
        const items = adv.data?.recommendations || [];

        // Set field context
        const ctx = adv.data?.context || null;
        setFieldContext(ctx);

        // Derive satellite-like data for the UI panel (with safe fallbacks)
        if (ctx) {
          const derivedSat = {
            soil_properties: {
              ph: typeof ctx.ph === 'number' ? ctx.ph : (typeof ctx.soil_ph === 'number' ? ctx.soil_ph : 6.8),
              moisture: typeof ctx.moisture === 'number' ? ctx.moisture : 25,
              nitrogen: typeof ctx.nitrogen === 'number' ? ctx.nitrogen : 120,
              phosphorus: typeof ctx.phosphorus === 'number' ? ctx.phosphorus : 40,
              potassium: typeof ctx.potassium === 'number' ? ctx.potassium : 40,
              organic_matter: typeof ctx.organic_matter === 'number' ? ctx.organic_matter : 1.2,
              temperature: typeof ctx.temperature === 'number' ? ctx.temperature : (formData.weatherData?.main?.temp || 28)
            },
            vegetation_indices: {
              ndvi: typeof ctx.ndvi === 'number' ? ctx.ndvi : 0.5
            },
            analysis: {
              crop_health_score: Math.round(Math.min(100, Math.max(0, ((typeof ctx.ndvi === 'number' ? ctx.ndvi : 0.5) * 100) + (ctx && ctx.ph >= 6 && ctx.ph <= 7.5 ? 5 : 0)))) ,
              water_stress_level: (typeof ctx.ndvi === 'number' ? (ctx.ndvi < 0.4 ? 'high' : ctx.ndvi < 0.6 ? 'medium' : 'low') : 'medium'),
              soil_fertility_index: Math.round(Math.min(100, Math.max(0, 70 + (typeof ctx.organic_matter === 'number' ? (ctx.organic_matter - 1.0) * 10 : 0))))
            }
          } as any;

          setSatelliteData(derivedSat);
          setSoilAnalysis(derivedSat.soil_properties);
        }

      const formatted = items.map((r: any) => ({
        name: r.crop,
        name_hindi: r.crop,
        suitability_score: Math.round((r.success_probability || 0.6) * 10),
        expected_yield: r.predicted_yield_quintal_per_hectare ? `${r.predicted_yield_quintal_per_hectare} क्विंटल/हेक्टेयर` : '—',
        market_price: '—',
        profit_potential: '—',
        growth_duration: '—',
        water_requirement: (r.water_requirement === 'low' ? 'कम' : r.water_requirement === 'high' ? 'अधिक' : 'मध्यम'),
        soil_type: ['दोमट'],
        season: (adv.data?.context?.season || formData.season || 'खरीफ') as string,
        benefits: r.recommended_practices || [],
        considerations: [],
        sustainability_score: r.sustainability_score,
        market_demand: r.market_demand,
        why_reason: r.reason,
      }));
        if (formatted.length > 0) {
          setRecommendations(formatted);
          return;
        }
        // If advanced path returned empty, fall through to engine-based path
      }

      // Step 1: Get satellite data for soil analysis
      const satData = await satelliteService.getSatelliteAnalysis({
        latitude: formData.coordinates.lat,
        longitude: formData.coordinates.lon
      });
      setSatelliteData(satData);
      setSoilAnalysis(satData.soil_properties);
      setFieldContext({ ndvi: satData?.vegetation_indices?.ndvi, ph: satData?.soil_properties?.ph, soil_type: formData.soil_type, season: formData.season });

      // Step 2: Prepare data for AI crop recommendation engine
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
        temperature: formData.weatherData?.main?.temp || 28,
        humidity: formData.weatherData?.main?.humidity || 65,
        rainfall: 85, // Mock data for now
        windSpeed: formData.weatherData?.wind?.speed || 3.5,
        forecast: []
      };

      const farmerProfile = {
        farmSize: formData.farm_size,
        experience: formData.experience_level === 'expert' ? 10 : formData.experience_level === 'intermediate' ? 5 : 2,
        budget: getBudgetValue(formData.budget_range),
        location: {
          latitude: formData.coordinates.lat,
          longitude: formData.coordinates.lon,
          district: formData.coordinates.city,
          state: formData.coordinates.state
        },
        previousCrops: [], // Empty for new analysis
        soilType: getSoilTypeForAI(formData.soil_type)
      };

      // Step 3: Get market data for price analysis
      const marketData = await marketPriceService.getDashboardPrices(
        ['wheat', 'rice', 'cotton', 'sugarcane', 'mustard'], 
        { lat: formData.coordinates.lat, lng: formData.coordinates.lon }
      );

      const marketDataArray = Object.values(marketData).map(price => ({
        crop: price.crop,
        currentPrice: price.currentPrice,
        trend: price.trend,
        priceChange: price.changePercent,
        demandLevel: 'medium' as const,
        seasonalPattern: []
      }));

      // Step 4: Get AI recommendations
      const aiRecommendations = await cropRecommendationEngine.getRecommendations(
        soilData,
        weatherDataForAI,
        marketDataArray,
        farmerProfile
      );

      // Step 5: Convert AI recommendations to component format
      const formattedRecommendations = aiRecommendations.map(rec => ({
        name: rec.cropName,
        name_hindi: rec.hindiName,
        suitability_score: rec.suitabilityScore / 10, // Convert to 0-10 scale
        expected_yield: `${Math.round(rec.predictedYield)} क्विंटल`,
        market_price: `₹${rec.breakEvenPrice}-${Math.round(rec.breakEvenPrice * 1.2)}/क्विंटल`,
        profit_potential: `₹${Math.round(rec.expectedProfit).toLocaleString()}/हेक्टेयर`,
        growth_duration: rec.harvestTime,
        water_requirement: getWaterRequirementText(rec.waterRequirement),
        soil_type: getSoilTypesFromAI(),
        season: rec.sowingTime,
        benefits: rec.benefits,
        considerations: rec.risks,
        sustainability_score: rec.sustainabilityScore,
        market_demand: rec.marketDemand,
      }));

      setRecommendations(formattedRecommendations.slice(0, 6));

    } catch (error) {
      console.error('AI Recommendation Error:', error);
      // Fallback to mock data if AI fails
      const fallbackCrops = getLocationBasedCrops();
      const scoredCrops = fallbackCrops.map(crop => ({
        ...crop,
        suitability_score: parseFloat(calculateSuitabilityScore(crop, formData).toFixed(1))
      }));
      
      const topRecommendations = scoredCrops
        .sort((a, b) => b.suitability_score - a.suitability_score)
        .slice(0, 6);
      
      setRecommendations(topRecommendations);
    } finally {
      // Ensure we never show 0 crops — final safety fallback
      setRecommendations((prev) => {
        if (prev && prev.length > 0) return prev;
        const fallbackCrops = getLocationBasedCrops();
        const scoredCrops = fallbackCrops.map(crop => ({
          ...crop,
          suitability_score: parseFloat(calculateSuitabilityScore(crop, formData).toFixed(1))
        }));
        return scoredCrops.sort((a, b) => b.suitability_score - a.suitability_score).slice(0, 6);
      });
      setLoading(false);
      setAiProcessing(false);
    }
  };

  // Helper functions for AI integration
  const getBudgetValue = (budgetRange: string): number => {
    switch (budgetRange) {
      case 'low': return 30000;
      case 'medium': return 100000;
      case 'high': return 200000;
      default: return 50000;
    }
  };

  const getSoilTypeForAI = (soilType: string): 'clay' | 'sandy' | 'loamy' | 'silt' => {
    if (soilType.includes('sandy')) return 'sandy';
    if (soilType.includes('clayey') || soilType.includes('black')) return 'clay';
    if (soilType.includes('red')) return 'sandy';
    return 'loamy';
  };

  const getWaterRequirementText = (waterReq: string): string => {
    switch (waterReq) {
      case 'high': return 'अधिक (8-10 सिंचाई)';
      case 'medium': return 'मध्यम (4-6 सिंचाई)';
      case 'low': return 'कम (2-3 सिंचाई)';
      default: return 'मध्यम';
    }
  };

  const getSoilTypesFromAI = (): string[] => {
    return ['दोमट', 'चिकनी दोमट', 'बलुई दोमट'];
  };

  // Compute rank score from preferences
  const parseProfit = (p: string): number => {
    try {
      const m = p.replace(/[^0-9]/g, '');
      return Math.min(200000, Math.max(0, parseInt(m || '0', 10)));
    } catch { return 0; }
  };
  const waterSavingScore = (w: string): number => {
    const t = (w || '').toLowerCase();
    if (t.includes('कम')) return 100;
    if (t.includes('low')) return 100;
    if (t.includes('मध्यम') || t.includes('medium')) return 60;
    if (t.includes('अधिक') || t.includes('high')) return 20;
    return 50;
  };
  const computeRank = (c: CropRecommendationData): number => {
    const profit = parseProfit(c.profit_potential || '₹50000');
    const profitN = Math.min(100, Math.round((profit / 200000) * 100));
    const sustain = c.sustainability_score ?? 70;
    const water = waterSavingScore(c.water_requirement);
    const sum = prefProfit + prefSustain + prefWater || 1;
    const wP = prefProfit / sum, wS = prefSustain / sum, wW = prefWater / sum;
    return Math.round(profitN * wP + sustain * wS + water * wW);
  };

  // Planned crops helpers
  const addToPlan = (name: string) => {
    if (planned.includes(name)) return;
    const next = [...planned, name];
    setPlanned(next);
    try { localStorage.setItem('planned_crops', JSON.stringify(next)); } catch {}
  };
  const removeFromPlan = (name: string) => {
    const next = planned.filter(n => n !== name);
    setPlanned(next);
    try { localStorage.setItem('planned_crops', JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    if (activeStep === 1) {
      // Ensure recommendations are fetched when entering the results step
      fetchRecommendations();
    }
  }, [activeStep]);

  // Re-rank by preferences whenever recommendations or prefs change
  useEffect(() => {
    if (!recommendations || recommendations.length === 0) return;
    const ranked = [...recommendations].sort((a, b) => computeRank(b) - computeRank(a));
    setRecommendations(ranked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefProfit, prefSustain, prefWater]);

  const getSuitabilityColor = (score: number) => {
    if (score >= 8.5) return '#4caf50';
    if (score >= 7.0) return '#8bc34a';
    if (score >= 5.5) return '#ff9800';
    return '#f44336';
  };

  const getSuitabilityText = (score: number) => {
    if (score >= 8.5) return 'Excellent';
    if (score >= 7.0) return 'Good';
    if (score >= 5.5) return 'Fair';
    return 'Poor';
  };

  // --- Match scoring helpers for pH and NDVI ---
  type Range = { min: number; max: number };

  const normalizeCropKey = (name?: string) =>
    (name || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[\u0900-\u097F]/g, ''); // strip Devanagari for fallback matching

  const cropPhRanges: Record<string, Range> = {
    wheat: { min: 6.0, max: 7.5 },
    rice: { min: 5.5, max: 7.0 },
    maize: { min: 5.8, max: 7.0 },
    mustard: { min: 6.0, max: 7.5 },
    cotton: { min: 5.8, max: 8.0 },
    sugarcane: { min: 6.5, max: 7.5 },
    watermelon: { min: 6.0, max: 7.5 },
    muskmelon: { min: 6.0, max: 7.5 },
  };

  const cropNdviRanges: Record<string, Range> = {
    // Typical canopy vigor expectations by crop during vegetative phase
    wheat: { min: 0.50, max: 0.80 },
    rice: { min: 0.60, max: 0.85 },
    maize: { min: 0.50, max: 0.80 },
    mustard: { min: 0.35, max: 0.65 },
    cotton: { min: 0.40, max: 0.70 },
    sugarcane: { min: 0.60, max: 0.85 },
    watermelon: { min: 0.45, max: 0.70 },
    muskmelon: { min: 0.45, max: 0.70 },
  };

  const getRangesForCrop = (name: string): { ph?: Range; ndvi?: Range } => {
    const key = normalizeCropKey(name);
    return {
      ph: cropPhRanges[key],
      ndvi: cropNdviRanges[key],
    };
  };

  type MatchCategory = 'good' | 'fair' | 'poor' | 'unknown';

  const categorizeMatch = (value: number | undefined, range?: Range, buffer = 0): MatchCategory => {
    if (typeof value !== 'number' || !range) return 'unknown';
    if (value >= range.min && value <= range.max) return 'good';
    // one-sided proximity buffer
    if (value >= range.min - buffer && value <= range.max + buffer) return 'fair';
    return 'poor';
  };

  const getChipColor = (cat: MatchCategory): 'success' | 'warning' | 'error' | 'default' => {
    if (cat === 'good') return 'success';
    if (cat === 'fair') return 'warning';
    if (cat === 'poor') return 'error';
    return 'default';
  };

  // Helper functions for stepper forms
  const renderPersonalInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="आपका नाम"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          InputProps={{
            startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="मोबाइल नंबर"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          type="tel"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>खेती का अनुभव</InputLabel>
          <Select
            value={formData.experience_level}
            label="खेती का अनुभव"
            onChange={(e) => handleInputChange('experience_level', e.target.value)}
          >
            {experienceLevels.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>मुख्य उद्देश्य</InputLabel>
          <Select
            value={formData.primary_goal}
            label="मुख्य उद्देश्य"
            onChange={(e) => handleInputChange('primary_goal', e.target.value)}
          >
            {primaryGoals.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 2, bgcolor: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.35)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justify: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1, color: '#4caf50' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                🌍 आपकी स्थिति (Real-time)
              </Typography>
            </Box>
            {!locationLoading && formData.location && (
              <Button
                size="small"
                variant="outlined"
                onClick={getCurrentLocationEnhanced}
                sx={{ 
                  minWidth: 'auto',
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                }}
              >
                🔄 Refresh
              </Button>
            )}
          </Box>
          {locationLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>📍 Enhanced location data प्राप्त कर रहे हैं...</Typography>
            </Box>
          ) : formData.location ? (
            <Box>
              <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>📍 {formData.location}</Typography>
              {formData.coordinates && (
                <Typography variant="caption" sx={{ color: '#8fa39a' }}>
                  🎯 Coordinates: {formData.coordinates.lat.toFixed(4)}°N, {formData.coordinates.lon.toFixed(4)}°E
                </Typography>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">स्थान उपलब्ध नहीं</Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFarmDetails = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 2, border: '1px dashed #4caf50', bgcolor: 'rgba(76,175,80,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>🛰️ Use satellite + weather powered recommendations</Typography>
            <Button size="small" variant={useSatellite ? 'contained' : 'outlined'} onClick={() => setUseSatellite(!useSatellite)}>
              {useSatellite ? 'Satellite: ON' : 'Satellite: OFF'}
            </Button>
          </Box>
          {fieldContext && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {typeof fieldContext.ndvi === 'number' && (
                <Chip label={`NDVI: ${fieldContext.ndvi.toFixed(2)}`} color={fieldContext.ndvi >= 0.5 ? 'success' : fieldContext.ndvi >= 0.3 ? 'warning' : 'error'} />
              )}
              {typeof fieldContext.ph === 'number' && (
                <Chip label={`pH: ${fieldContext.ph.toFixed(1)}`} color={fieldContext.ph >= 6.0 && fieldContext.ph <= 7.8 ? 'success' : 'warning'} />
              )}
              {fieldContext.soil_type && <Chip label={`Soil: ${fieldContext.soil_type}`} />}
              {fieldContext.season && <Chip label={`Season: ${fieldContext.season}`} />}
            </Box>
          )}
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>मौसम/सीजन</InputLabel>
          <Select
            value={formData.season}
            label="मौसम/सीजन"
            onChange={(e) => handleInputChange('season', e.target.value)}
            startAdornment={<CalendarMonth sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            {seasons.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>मिट्टी का प्रकार</InputLabel>
          <Select
            value={formData.soil_type}
            label="मिट्टी का प्रकार"
            onChange={(e) => handleInputChange('soil_type', e.target.value)}
          >
            {soilTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>पानी की उपलब्धता</InputLabel>
          <Select
            value={formData.water_availability}
            label="पानी की उपलब्धता"
            onChange={(e) => handleInputChange('water_availability', e.target.value)}
            startAdornment={<WaterDrop sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            {waterAvailability.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>सिंचाई की व्यवस्था</InputLabel>
          <Select
            value={formData.irrigation_method}
            label="सिंचाई की व्यवस्था"
            onChange={(e) => handleInputChange('irrigation_method', e.target.value)}
          >
            {irrigationMethods.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>बजट रेंज</InputLabel>
          <Select
            value={formData.budget_range}
            label="बजट रेंज"
            onChange={(e) => handleInputChange('budget_range', e.target.value)}
            startAdornment={<AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />}
          >
            {budgetRanges.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
          खेत का आकार: {formData.farm_size} हेक्टेयर
        </Typography>
        <Slider
          value={formData.farm_size}
          onChange={(_, value) => handleInputChange('farm_size', value)}
          min={0.5}
          max={20}
          step={0.5}
          marks={[
            { value: 0.5, label: '0.5' },
            { value: 5, label: '5' },
            { value: 10, label: '10' },
            { value: 20, label: '20+' }
          ]}
          valueLabelDisplay="auto"
        />
      </Grid>
      
      {formData.weatherData && (
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'rgba(96, 165, 250, 0.12)', border: '1px solid rgba(96, 165, 250, 0.4)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Cloud sx={{ mr: 1, color: '#2196f3' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                वर्तमान मौसम स्थिति
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Thermostat sx={{ color: '#ff5722', mb: 0.5 }} />
                  <Typography variant="h6">{Math.round(formData.weatherData.main.temp)}°C</Typography>
                  <Typography variant="caption">तापमान</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <WaterDrop sx={{ color: '#2196f3', mb: 0.5 }} />
                  <Typography variant="h6">{formData.weatherData.main.humidity}%</Typography>
                  <Typography variant="caption">नमी</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Cloud sx={{ color: '#9e9e9e', mb: 0.5 }} />
                  <Typography variant="h6">{formData.weatherData.weather[0].main}</Typography>
                  <Typography variant="caption">मौसम</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{Math.round(formData.weatherData.wind.speed * 3.6)} km/h</Typography>
                  <Typography variant="caption">हवा</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}
      
      {/* Satellite Soil Analysis */}
      {satelliteData && (
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, bgcolor: 'rgba(192, 132, 252, 0.12)', border: '1px solid rgba(192, 132, 252, 0.4)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                bgcolor: '#9c27b0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mr: 2
              }}>
                🛰️
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#6a1b9a' }}>
                  रियल-टाइम सैटेलाइट मिट्टी विश्लेषण
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  NASA और ISRO सैटेलाइट डेटा से लिव एनालिसिस
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    pH {satelliteData.soil_properties.ph.toFixed(1)}
                  </Typography>
                  <Typography variant="caption">मिट्टी का pH</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(satelliteData.soil_properties.ph / 14) * 100} 
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {Math.round(satelliteData.soil_properties.moisture)}%
                  </Typography>
                  <Typography variant="caption">मिट्टी में नमी</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={satelliteData.soil_properties.moisture} 
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ color: '#4ade80', fontWeight: 'bold' }}>
                    {Math.round(satelliteData.soil_properties.nitrogen)}
                  </Typography>
                  <Typography variant="caption">N (kg/ha)</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(satelliteData.soil_properties.nitrogen / 200) * 100} 
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                    {satelliteData.vegetation_indices.ndvi.toFixed(2)}
                  </Typography>
                  <Typography variant="caption">NDVI Index</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={satelliteData.vegetation_indices.ndvi * 100} 
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                🧠 AI विश्लेषण:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                मिट्टी स्वास्थ्य स्कोर: <strong>{satelliteData.analysis.soil_fertility_index}%</strong> | 
                फसल स्वास्थ्य: <strong>{satelliteData.analysis.crop_health_score}%</strong> | 
                जल तनाव: <strong>{satelliteData.analysis.water_stress_level === 'low' ? 'कम' : satelliteData.analysis.water_stress_level === 'medium' ? 'मध्यम' : 'अधिक'}</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      )}
    </Grid>
  );

  const renderRecommendations = () => (
    <Box>
      {/* Planned crops */}
      {planned.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px dashed #4caf50', bgcolor: 'rgba(76,175,80,0.05)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>📌 Planned Crops</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {planned.map(p => (
              <Chip key={p} label={p} onDelete={() => removeFromPlan(p)} color="success" variant="outlined" />
            ))}
          </Box>
        </Paper>
      )}
      {/* Preferences re-ranking */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>🎛️ Preference Weights</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption">Profit</Typography>
            <Slider value={prefProfit} onChange={(_,v)=>setPrefProfit(v as number)} min={0} max={100} valueLabelDisplay="auto" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption">Sustainability</Typography>
            <Slider value={prefSustain} onChange={(_,v)=>setPrefSustain(v as number)} min={0} max={100} valueLabelDisplay="auto" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption">Water Saving</Typography>
            <Slider value={prefWater} onChange={(_,v)=>setPrefWater(v as number)} min={0} max={100} valueLabelDisplay="auto" />
          </Grid>
        </Grid>
      </Paper>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'linear-gradient(45deg, #4caf50, #81c784)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              fontSize: '2rem'
            }}>
              🤖
            </Box>
          </motion.div>
          
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#4ade80' }}>
            🧠 AI कृषि विशेषज्ञ काम कर रहा है...
          </Typography>
          
          <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
            <Grid item xs={12} md={4}>
              <Alert severity="info" sx={{ mb: 1 }}>
                🛰️ सैटेलाइट डेटा प्राप्त कर रहे हैं
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="warning" sx={{ mb: 1 }}>
                🧪 मिट्टी विश्लेषण हो रहा है
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="success" sx={{ mb: 1 }}>
                📈 मार्केट भाव जांच रहे हैं
              </Alert>
            </Grid>
          </Grid>
          
          <Typography variant="body1" sx={{ mb: 2, color: '#8fa39a' }}>
            यह विश्लेषण आपकी स्थिति, मिट्टी और मौसम के आधार पर हो रहा है
          </Typography>
          
          <LinearProgress 
            sx={{ 
              width: '60%', 
              mx: 'auto', 
              height: 8, 
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(45deg, #4caf50, #81c784)'
              }
            }} 
          />
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            कृपया प्रतीक्षा करें... AI आपके लिए सबसे अच्छे सुझाव तैयार कर रहा है
          </Typography>
        </Box>
      ) : (
        <Box>
          <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(74, 222, 128, 0.12)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              🎉 AI-प्राप्त {recommendations.length} बेहतरीन फसल सुझाव!
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              🛰️ <strong>सैटेलाइट डेटा:</strong> {formData.location} से रियल-टाइम मिट्टी विश्लेषण
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🧪 मिट्टी स्वास्थ्य: {satelliteData?.analysis?.soil_fertility_index || 85}% | 
              💰 मार्केट डेटा: लिव मंडी भाव | 
              🌤️ मौसम: {formData.weatherData?.main?.temp || 28}°C
            </Typography>
          </Alert>
          
          <Grid container spacing={3}>
            {recommendations.map((crop, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    elevation={6}
                    sx={{
                      height: '100%',
                      borderRadius: { xs: 3, md: 4 },
                      position: 'relative',
                      border: index === 0 ? '3px solid #4caf50' : '1px solid rgba(0,0,0,0.1)',
                      minHeight: { xs: 350, sm: 380, md: 400 },
                      maxHeight: { xs: 450, sm: 480, md: 500 },
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    {index === 0 && (
                      <Chip
                        icon={<Star />}
                        label="सर्वोत्तम सुझाव"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
                          color: 'white',
                          fontWeight: 'bold',
                          zIndex: 1,
                        }}
                      />
                    )}
                    
                    <CardContent sx={{ 
                      p: { xs: 1.5, md: 2 },
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Checkbox */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                        <Checkbox
                          checked={compareSelected.includes(crop.name)}
                          onChange={(e)=>{
                            const checked = e.target.checked;
                            setCompareSelected(prev=>{
                              if (!checked) return prev.filter(n=>n!==crop.name);
                              if (prev.length>=3) return prev; // limit 3
                              return [...prev, crop.name];
                            });
                          }}
                          size="small"
                        />
                      </Box>
                      
                      {/* Crop Header */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: getSuitabilityColor(crop.suitability_score),
                            width: { xs: 50, md: 60 },
                            height: { xs: 50, md: 60 },
                            mb: 1,
                            fontSize: '1.5rem',
                          }}
                        >
                          <LocalFlorist sx={{ fontSize: { xs: 24, md: 30 } }} />
                        </Avatar>
                        
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          mb: 0.5,
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          textAlign: 'center',
                          lineHeight: 1.2
                        }}>
                          {crop.name_hindi}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 1,
                          textAlign: 'center',
                          fontSize: '0.8rem'
                        }}>
                          {crop.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={crop.suitability_score / 2} readOnly size="small" />
                          <Typography variant="body2" sx={{ 
                            ml: 1, 
                            fontWeight: 'bold', 
                            color: getSuitabilityColor(crop.suitability_score),
                            fontSize: '0.8rem'
                          }}>
                            {crop.suitability_score}/10
                          </Typography>
                        </Box>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={crop.suitability_score * 10}
                        sx={{
                          mb: 2,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(255,255,255,0.14)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getSuitabilityColor(crop.suitability_score),
                            borderRadius: 4,
                          },
                        }}
                      />

                      {/* Key Metrics - Stacked Layout */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 1, 
                          bgcolor: 'rgba(74, 222, 128, 0.16)', 
                          borderRadius: 2,
                          mb: 1
                        }}>
                          <TrendingUp sx={{ color: '#4caf50', mb: 0.5, fontSize: 18 }} />
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', mb: 0.5 }}>उत्पादन</Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            lineHeight: 1.2
                          }}>
                            {crop.expected_yield}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 1, 
                          bgcolor: 'rgba(251, 191, 36, 0.16)', 
                          borderRadius: 2
                        }}>
                          <AttachMoney sx={{ color: '#ff9800', mb: 0.5, fontSize: 18 }} />
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', mb: 0.5 }}>कीमत</Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            lineHeight: 1.2
                          }}>
                            {crop.market_price}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Key Info Chips */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: 0.5, 
                        mb: 2 
                      }}>
                        <Chip 
                          label={`${crop.season}`} 
                          size="small" 
                          sx={{ fontSize: '0.65rem', height: 24 }}
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`${crop.water_requirement}`} 
                          size="small" 
                          sx={{ fontSize: '0.65rem', height: 24 }}
                          color="info" 
                          variant="outlined"
                        />
                        {crop.market_demand && (
                          <Chip 
                            label={`मांग: ${crop.market_demand === 'high' ? 'उच्च' : crop.market_demand === 'medium' ? 'मध्यम' : 'कम'}`} 
                            size="small" 
                            sx={{ fontSize: '0.65rem', height: 24, gridColumn: '1 / -1' }}
                            color={crop.market_demand === 'high' ? 'success' : crop.market_demand === 'low' ? 'error' : 'warning'} 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      {/* Profit Chip */}
                      <Box sx={{ textAlign: 'center', mb: 1 }}>
                        <Chip 
                          label={crop.profit_potential} 
                          size="small" 
                          sx={{ fontSize: '0.65rem' }}
                          color="success" 
                          variant="filled"
                        />
                      </Box>

                      {/* Spacer to push buttons to bottom */}
                      <Box sx={{ flex: 1 }} />
                      
                      {/* Simple Details Section */}
                      <Box sx={{ 
                        bgcolor: 'rgba(76, 175, 80, 0.05)', 
                        p: 1, 
                        borderRadius: 2, 
                        mb: 1,
                        border: '1px dashed rgba(76, 175, 80, 0.3)'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.7rem', 
                          color: '#4ade80',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          अवधि: {crop.growth_duration} | मुनाफा: {crop.profit_potential}
                        </Typography>
                      </Box>

                      {/* CTA Buttons */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => addToPlan(crop.name)}
                          sx={{ 
                            fontSize: '0.7rem',
                            py: 0.5,
                            borderRadius: 2
                          }}
                        >
                          योजना में जोड़ें
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => alert(`${crop.name_hindi} के लिए सलाह खोली जाएगी`)}
                          sx={{ 
                            fontSize: '0.7rem',
                            py: 0.5,
                            borderRadius: 2
                          }}
                        >
                          विस्तार देखें
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Compare modal trigger */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button disabled={compareSelected.length < 2} variant="contained" onClick={()=>setCompareOpen(true)}>
          Compare ({compareSelected.length})
        </Button>
      </Box>

      <Dialog open={compareOpen} onClose={()=>setCompareOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>📊 Compare Selected Crops</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                {compareSelected.map(name => (
                  <TableCell key={name} sx={{ fontWeight: 'bold' }}>{name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {['Suitability','Expected Yield','Profit','Water','Sustainability','Demand','Season'].map((m, idx)=> (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{m}</TableCell>
                  {compareSelected.map(name => {
                    const c = recommendations.find(r=>r.name===name);
                    const val = !c ? '-' :
                      m==='Suitability'? `${c.suitability_score}/10` :
                      m==='Expected Yield'? c.expected_yield :
                      m==='Profit'? c.profit_potential :
                      m==='Water'? c.water_requirement :
                      m==='Sustainability'? (c.sustainability_score? `${c.sustainability_score}%` : '-') :
                      m==='Demand'? (c.market_demand || '-') :
                      m==='Season'? c.season : '-';
                    return <TableCell key={name+idx}>{val}</TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setCompareOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={6}
          sx={{
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
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
          <LocalFlorist sx={{ fontSize: 50, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🌾 स्मार्ट फसल सुझाव
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            आपकी स्थिति और जरूरतों के अनुसार सबसे अच्छी फसल चुनें
          </Typography>
        </Paper>
      </motion.div>

      {/* Stepper */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Content */}
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4 }}>
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeStep === 0 && renderFarmDetails()}
          {activeStep === 1 && renderRecommendations()}
        </motion.div>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            size="large"
          >
            वापस
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && (!formData.season || !formData.soil_type || !formData.water_availability || !formData.irrigation_method || !formData.budget_range)) ||
              activeStep === 1
            }
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
              '&:hover': {
                background: 'linear-gradient(45deg, #45a049, #5cb85c)',
              },
            }}
          >
            {activeStep === 1 ? 'सुझाव पाएं' : activeStep === 2 ? 'पूर्ण' : 'अगला'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CropRecommendation;
