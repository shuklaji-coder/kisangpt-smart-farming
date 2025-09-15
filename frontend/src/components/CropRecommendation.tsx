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

interface CropRecommendationData {
  name: string;
  name_hindi: string;
  suitability_score: number;
  expected_yield: string;
  market_price: string;
  profit_potential: string;
  growth_duration: string;
  water_requirement: string;
  soil_type: string[];
  season: string;
  benefits: string[];
  considerations: string[];
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
  const { t } = useTranslation();
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState<CropRecommendationData[]>([]);
  const [loading, setLoading] = useState(false);
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

  const steps = ['व्यक्तिगत जानकारी', 'खेत की जानकारी', 'फसल सुझाव'];

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

  // Get user location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

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
    if (activeStep === 1) {
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
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const crops = getLocationBasedCrops();
      const scoredCrops = crops.map(crop => ({
        ...crop,
        suitability_score: parseFloat(calculateSuitabilityScore(crop, formData).toFixed(1))
      }));

      // Sort by suitability score and take top 6
      const topRecommendations = scoredCrops
        .sort((a, b) => b.suitability_score - a.suitability_score)
        .slice(0, 6);

      setRecommendations(topRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

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
        <Paper elevation={2} sx={{ p: 2, bgcolor: '#e8f5e8', border: '1px solid #4caf50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOn sx={{ mr: 1, color: '#4caf50' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              आपकी स्थिति
            </Typography>
          </Box>
          {locationLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>स्थान प्राप्त कर रहे हैं...</Typography>
            </Box>
          ) : formData.location ? (
            <Typography>📍 {formData.location}</Typography>
          ) : (
            <Typography color="text.secondary">स्थान उपलब्ध नहीं</Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFarmDetails = () => (
    <Grid container spacing={3}>
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
          <Paper elevation={2} sx={{ p: 2, bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
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
    </Grid>
  );

  const renderRecommendations = () => (
    <Box>
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            आपके लिए सबसे अच्छी फसलों का चुनाव कर रहे हैं...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            यह आपकी स्थिति, मिट्टी और मौसम के आधार पर हो रहा है
          </Typography>
        </Box>
      ) : (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              🎉 आपके लिए {recommendations.length} बेहतरीन फसल सुझाव तैयार हैं!
            </Typography>
            <Typography variant="body2">
              ये सुझाव आपकी स्थिति ({formData.location}), मौसम, और व्यक्तिगत जानकारी के आधार पर हैं
            </Typography>
          </Alert>
          
          <Grid container spacing={3}>
            {recommendations.map((crop, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    elevation={6}
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      position: 'relative',
                      border: index === 0 ? '3px solid #4caf50' : '1px solid rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
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
                    
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: getSuitabilityColor(crop.suitability_score),
                            width: 60,
                            height: 60,
                            mr: 2,
                            fontSize: '1.5rem',
                          }}
                        >
                          <LocalFlorist sx={{ fontSize: 30 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {crop.name_hindi}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {crop.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Rating value={crop.suitability_score / 2} readOnly size="small" />
                            <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', color: getSuitabilityColor(crop.suitability_score) }}>
                              {crop.suitability_score}/10
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={crop.suitability_score * 10}
                        sx={{
                          mb: 2,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getSuitabilityColor(crop.suitability_score),
                            borderRadius: 4,
                          },
                        }}
                      />

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e8f5e8', borderRadius: 2 }}>
                            <TrendingUp sx={{ color: '#4caf50', mb: 0.5 }} />
                            <Typography variant="caption" display="block">उत्पादन</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {crop.expected_yield}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fff3e0', borderRadius: 2 }}>
                            <AttachMoney sx={{ color: '#ff9800', mb: 0.5 }} />
                            <Typography variant="caption" display="block">कीमत</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {crop.market_price}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Accordion elevation={0} sx={{ bgcolor: 'transparent' }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            विस्तृत जानकारी
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>अवधि:</strong> {crop.growth_duration}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>पानी:</strong> {crop.water_requirement}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>मुनाफा:</strong> {crop.profit_potential}
                          </Typography>
                          
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: '#4caf50' }}>
                            ✅ फायदे:
                          </Typography>
                          {crop.benefits.map((benefit, idx) => (
                            <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                              • {benefit}
                            </Typography>
                          ))}
                          
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: '#f44336' }}>
                            ⚠️ सावधानियां:
                          </Typography>
                          {crop.considerations.map((consideration, idx) => (
                            <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                              • {consideration}
                            </Typography>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
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
          {activeStep === 0 && renderPersonalInfo()}
          {activeStep === 1 && renderFarmDetails()}
          {activeStep === 2 && renderRecommendations()}
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
              (activeStep === 0 && (!formData.name || !formData.experience_level || !formData.primary_goal || !formData.phone)) ||
              (activeStep === 1 && (!formData.season || !formData.soil_type || !formData.water_availability || !formData.irrigation_method || !formData.budget_range)) ||
              activeStep === 2
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
