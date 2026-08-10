// Enhanced Crop Recommendation with Satellite Data Integration
// Real-time location-based recommendations using Bhuvan API and NDVI data

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  useTheme,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Agriculture,
  LocationOn,
  Satellite,
  WaterDrop,
  AttachMoney,
  TrendingUp,
  LocalFlorist,
  Assessment,
  ExpandMore,
  CheckCircle,
  Warning,
  Info,
  Star,
  Timeline,
  Science
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Services
import { enhancedSatelliteService, SatelliteAnalysis } from '../services/enhancedSatelliteService';
import { locationService, LocationData } from '../services/locationService';
import { cropRecommendationEngine } from '../services/cropRecommendationEngine';
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

// Enhanced interfaces
interface EnhancedCropRecommendation {
  id: number;
  name: string;
  hindiName: string;
  suitabilityScore: number; // 0-100
  expectedYield: string;
  marketPrice: string;
  profitPotential: number;
  growthDuration: string;
  waterRequirement: string;
  riskLevel: 'low' | 'medium' | 'high';
  season: string;
  plantingTime: string;
  benefits: string[];
  requirements: string[];
  satelliteInsights: {
    ndviScore: number;
    soilHealth: number;
    waterStress: string;
    cropHealth: number;
    recommendations: string[];
  };
  marketData: {
    currentPrice: number;
    pricetrend: string;
    demand: string;
  };
}

interface ProcessingState {
  stage: string;
  progress: number;
  message: string;
}

const EnhancedCropRecommendation: React.FC = () => {
  const { t } = (useTranslation as any)();
  const theme = useTheme();
  
  const [recommendations, setRecommendations] = useState<EnhancedCropRecommendation[]>([]);
  const [satelliteAnalysis, setSatelliteAnalysis] = useState<SatelliteAnalysis | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<ProcessingState>({
    stage: 'Initializing...',
    progress: 0,
    message: 'Setting up AI-powered recommendations'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeEnhancedRecommendations();
  }, []);

  const initializeEnhancedRecommendations = async () => {
    console.log('ðŸš€ Initializing enhanced crop recommendations with satellite data...');
    setError(null);
    
    try {
      // Step 1: Get user location with high accuracy
      setProcessing({
        stage: 'Location',
        progress: 10,
        message: 'ðŸ“ Getting precise location for satellite analysis...'
      });
      
      const location = await locationService.getCurrentLocation();
      setLocationData(location);
      console.log('âœ… Location obtained:', locationService.formatLocationDisplay(location));
      
      // Step 2: Fetch comprehensive satellite analysis
      setProcessing({
        stage: 'Satellite Data',
        progress: 30,
        message: 'ðŸ›°ï¸ Analyzing satellite data (NDVI, soil properties, weather)...'
      });
      
      const satellite = await enhancedSatelliteService.getEnhancedSatelliteAnalysis({
        latitude: location.latitude,
        longitude: location.longitude
      });
      setSatelliteAnalysis(satellite);
      console.log('âœ… Satellite analysis completed');
      
      // Step 3: Generate AI-powered recommendations
      setProcessing({
        stage: 'AI Analysis',
        progress: 60,
        message: 'ðŸ¤– Generating intelligent crop recommendations...'
      });
      
      const enhancedRecs = await generateEnhancedRecommendations(location, satellite);
      setRecommendations(enhancedRecs);
      
      // Step 4: Complete
      setProcessing({
        stage: 'Complete',
        progress: 100,
        message: 'âœ… Enhanced recommendations ready!'
      });
      
      setTimeout(() => setLoading(false), 1000);
      
    } catch (error) {
      console.error('âŒ Error in enhanced recommendations:', error);
      setError('Failed to generate enhanced recommendations. Using fallback data.');
      
      // Generate fallback recommendations
      const fallbackRecs = generateFallbackRecommendations();
      setRecommendations(fallbackRecs);
      setLoading(false);
    }
  };

  const mapHindi = (name: string) => ({
    'Wheat': 'à¤—à¥‡à¤¹à¥‚à¤‚', 'Rice': 'à¤§à¤¾à¤¨', 'Maize': 'à¤®à¤•à¥à¤•à¤¾', 'Mustard': 'à¤¸à¤°à¤¸à¥‹à¤‚', 'Cotton': 'à¤•à¤ªà¤¾à¤¸', 'Sugarcane': 'à¤—à¤¨à¥à¤¨à¤¾'
  }[name] || name);

  const generateEnhancedRecommendations = async (
    location: LocationData,
    satellite: SatelliteAnalysis
  ): Promise<EnhancedCropRecommendation[]> => {
    console.log('ðŸŒ¾ Generating location-specific recommendations...');

    // 1) Try backend advanced recommender first (district + pH + NDVI + weather fusion)
    try {
      const url = API_BASE ? `${API_BASE}/api/v1/crop/recommend-advanced` : `/api/v1/crop/recommend-advanced`;
      const res = await axios.get(url, {
        params: { lat: location.latitude, lng: location.longitude },
        timeout: 8000,
      });
      const items = res.data?.recommendations || [];
      if (items.length > 0) {
        const adv: EnhancedCropRecommendation[] = items.map((r: any, idx: number) => {
          const en = (r.crop || '').toString();
          const hi = mapHindi(en);
          const yieldQ = r.predicted_yield_quintal_per_hectare || 35;
          const water = r.water_requirement || 'medium';
          const sust = r.sustainability_score || 75;
          const demand = r.market_demand || 'medium';
          return {
            id: idx + 1,
            name: en,
            hindiName: hi,
            suitabilityScore: Math.round((r.success_probability || 0.6) * 100),
            expectedYield: `${yieldQ} à¤•à¥à¤µà¤¿à¤‚à¤Ÿà¤²/à¤¹à¥‡à¤•à¥à¤Ÿà¥‡à¤¯à¤°`,
            marketPrice: 'â€”',
            profitPotential: Math.round(40000 + (sust * 500)),
            growthDuration: 'â€”',
            waterRequirement: water,
            riskLevel: water === 'high' ? 'high' : water === 'low' ? 'low' as const : 'medium' as const,
            season: (res.data?.context?.season || getCurrentSeason()),
            plantingTime: 'à¤®à¥Œà¤¸à¤® à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤°',
            benefits: r.recommended_practices || [],
            requirements: [
              `pH: ${(res.data?.context?.ph ?? satellite.soilData.ph).toFixed ? (res.data?.context?.ph ?? satellite.soilData.ph).toFixed(1) : (res.data?.context?.ph ?? satellite.soilData.ph)}`,
              `NDVI: ${(res.data?.context?.ndvi ?? satellite.ndviData.ndvi).toFixed ? (res.data?.context?.ndvi ?? satellite.ndviData.ndvi).toFixed(2) : (res.data?.context?.ndvi ?? satellite.ndviData.ndvi)}`
            ],
            satelliteInsights: {
              ndviScore: Math.round((res.data?.context?.ndvi ?? satellite.ndviData.ndvi) * 100),
              soilHealth: satellite.analysis.soilFertilityIndex,
              waterStress: satellite.analysis.waterStressLevel,
              cropHealth: satellite.analysis.cropHealthScore,
              recommendations: satellite.analysis.actionableInsights
            },
            marketData: {
              currentPrice: 0,
              pricetrend: 'stable',
              demand: demand
            }
          };
        });
        return adv.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
      }
    } catch (e) {
      console.warn('Advanced backend recommender unavailable, using satellite-only path.', e);
    }

    // 2) Satellite-only path (existing)
    const satelliteRecommendations = satellite.analysis.recommendedCrops || ['Wheat', 'Rice', 'Maize'];
    const enhancedRecs: EnhancedCropRecommendation[] = satelliteRecommendations.map((cropName, index) => {
      const crop = getCropDetails(cropName, satellite, location);
      return {
        id: index + 1,
        name: crop.name,
        hindiName: crop.hindiName,
        suitabilityScore: calculateSuitability(cropName, satellite),
        expectedYield: `${crop.expectedYield} à¤•à¥à¤µà¤¿à¤‚à¤Ÿà¤²/à¤¹à¥‡à¤•à¥à¤Ÿà¥‡à¤¯à¤°`,
        marketPrice: `â‚¹${crop.marketPrice}/à¤•à¥à¤µà¤¿à¤‚à¤Ÿà¤²`,
        profitPotential: crop.profitPotential,
        growthDuration: crop.growthDuration,
        waterRequirement: crop.waterRequirement,
        riskLevel: crop.riskLevel,
        season: getCurrentSeason(),
        plantingTime: crop.plantingTime,
        benefits: crop.benefits,
        requirements: crop.requirements,
        satelliteInsights: {
          ndviScore: Math.round(satellite.ndviData.ndvi * 100),
          soilHealth: satellite.analysis.soilFertilityIndex,
          waterStress: satellite.analysis.waterStressLevel,
          cropHealth: satellite.analysis.cropHealthScore,
          recommendations: satellite.analysis.actionableInsights
        },
        marketData: {
          currentPrice: crop.marketPrice,
          pricetrend: 'stable',
          demand: 'high'
        }
      };
    });
    return enhancedRecs.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  };

  const getCropDetails = (cropName: string, satellite: SatelliteAnalysis, location: LocationData) => {
    const cropDatabase: any = {
      'Wheat': {
        name: 'Wheat',
        hindiName: 'à¤—à¥‡à¤¹à¥‚à¤‚',
        expectedYield: 40 + Math.round(satellite.ndviData.ndvi * 20),
        marketPrice: 2150 + Math.round(Math.random() * 200),
        profitPotential: 45000 + Math.round(satellite.analysis.soilFertilityIndex * 300),
        growthDuration: '120-140 à¤¦à¤¿à¤¨',
        waterRequirement: satellite.analysis.waterStressLevel === 'low' ? 'à¤•à¤®' : 'à¤®à¤§à¥à¤¯à¤®',
        riskLevel: 'low' as const,
        plantingTime: 'à¤¨à¤µà¤‚à¤¬à¤°-à¤¦à¤¿à¤¸à¤‚à¤¬à¤°',
        benefits: [
          'à¤¸à¥à¤¥à¤¿à¤° à¤¬à¤¾à¤œà¤¾à¤° à¤®à¥‚à¤²à¥à¤¯',
          'à¤¨à¥à¤¯à¥‚à¤¨à¤¤à¤® à¤¸à¤®à¤°à¥à¤¥à¤¨ à¤®à¥‚à¤²à¥à¤¯ à¤•à¥€ à¤—à¤¾à¤°à¤‚à¤Ÿà¥€',
          'à¤…à¤šà¥à¤›à¥€ à¤­à¤‚à¤¡à¤¾à¤°à¤£ à¤•à¥à¤·à¤®à¤¤à¤¾'
        ],
        requirements: [
          `pH: ${satellite.soilData.ph.toFixed(1)} (à¤†à¤¦à¤°à¥à¤¶: 6.0-7.5)`,
          `à¤¨à¤¾à¤‡à¤Ÿà¥à¤°à¥‹à¤œà¤¨: ${(satellite.soilData.nitrogen * 100).toFixed(1)}%`,
          'à¤¸à¤®à¤¯ à¤ªà¤° à¤¸à¤¿à¤‚à¤šà¤¾à¤ˆ à¤†à¤µà¤¶à¥à¤¯à¤•'
        ]
      },
      'Rice': {
        name: 'Rice',
        hindiName: 'à¤§à¤¾à¤¨',
        expectedYield: 50 + Math.round(satellite.ndviData.ndvi * 25),
        marketPrice: 2800 + Math.round(Math.random() * 300),
        profitPotential: 60000 + Math.round(satellite.analysis.soilFertilityIndex * 400),
        growthDuration: '115-125 à¤¦à¤¿à¤¨',
        waterRequirement: 'à¤…à¤§à¤¿à¤•',
        riskLevel: satellite.analysis.waterStressLevel === 'high' ? 'high' as const : 'medium' as const,
        plantingTime: 'à¤œà¥‚à¤¨-à¤œà¥à¤²à¤¾à¤ˆ',
        benefits: [
          'à¤‰à¤šà¥à¤š à¤‰à¤¤à¥à¤ªà¤¾à¤¦à¤•à¤¤à¤¾',
          'à¤¨à¤¿à¤°à¥à¤¯à¤¾à¤¤ à¤•à¥€ à¤¸à¤‚à¤­à¤¾à¤µà¤¨à¤¾',
          'à¤®à¥à¤–à¥à¤¯ à¤­à¥‹à¤œà¤¨ à¤«à¤¸à¤²'
        ],
        requirements: [
          'à¤ªà¤°à¥à¤¯à¤¾à¤ªà¥à¤¤ à¤ªà¤¾à¤¨à¥€ à¤•à¥€ à¤†à¤µà¤¶à¥à¤¯à¤•à¤¤à¤¾',
          `à¤«à¥‰à¤¸à¥à¤«à¥‹à¤°à¤¸: ${satellite.soilData.phosphorus.toFixed(0)} ppm`,
          'à¤‰à¤°à¥à¤µà¤° à¤®à¤¿à¤Ÿà¥à¤Ÿà¥€ à¤šà¤¾à¤¹à¤¿à¤'
        ]
      },
      'Cotton': {
        name: 'Cotton',
        hindiName: 'à¤•à¤ªà¤¾à¤¸',
        expectedYield: 15 + Math.round(satellite.ndviData.ndvi * 10),
        marketPrice: 6200 + Math.round(Math.random() * 500),
        profitPotential: 80000 + Math.round(satellite.analysis.soilFertilityIndex * 500),
        growthDuration: '180-200 à¤¦à¤¿à¤¨',
        waterRequirement: 'à¤®à¤§à¥à¤¯à¤® à¤¸à¥‡ à¤…à¤§à¤¿à¤•',
        riskLevel: 'medium' as const,
        plantingTime: 'à¤…à¤ªà¥à¤°à¥ˆà¤²-à¤®à¤ˆ',
        benefits: [
          'à¤‰à¤šà¥à¤š à¤®à¤¾à¤°à¥à¤œà¤¿à¤¨',
          'à¤¨à¤¿à¤°à¥à¤¯à¤¾à¤¤ à¤®à¥‚à¤²à¥à¤¯',
          'à¤”à¤¦à¥à¤¯à¥‹à¤—à¤¿à¤• à¤®à¤¾à¤‚à¤—'
        ],
        requirements: [
          'à¤•à¤¾à¤²à¥€ à¤®à¤¿à¤Ÿà¥à¤Ÿà¥€ à¤‰à¤¤à¥à¤¤à¤®',
          'à¤•à¥€à¤Ÿ à¤ªà¥à¤°à¤¬à¤‚à¤§à¤¨ à¤†à¤µà¤¶à¥à¤¯à¤•',
          'à¤—à¤°à¥à¤® à¤œà¤²à¤µà¤¾à¤¯à¥'
        ]
      }
    };

    return cropDatabase[cropName] || cropDatabase['Wheat'];
  };

  const calculateSuitability = (cropName: string, satellite: SatelliteAnalysis): number => {
    let score = 50; // Base score

    // NDVI contribution (30%)
    score += satellite.ndviData.ndvi * 30;

    // Soil health contribution (25%)
    score += (satellite.analysis.soilFertilityIndex / 100) * 25;

    // Weather suitability (25%)
    score += (satellite.analysis.cropHealthScore / 100) * 25;

    // Water availability (20%)
    const waterScore = satellite.analysis.waterStressLevel === 'low' ? 20 : 
                       satellite.analysis.waterStressLevel === 'medium' ? 15 : 10;
    score += waterScore;

    return Math.min(Math.max(Math.round(score), 30), 95);
  };

  const generateFallbackRecommendations = (): EnhancedCropRecommendation[] => {
    const fallbackCrops = ['Wheat', 'Rice', 'Cotton'];
    
    return fallbackCrops.map((cropName, index) => ({
      id: index + 1,
      name: cropName,
      hindiName: cropName === 'Wheat' ? 'à¤—à¥‡à¤¹à¥‚à¤‚' : cropName === 'Rice' ? 'à¤§à¤¾à¤¨' : 'à¤•à¤ªà¤¾à¤¸',
      suitabilityScore: 75 - (index * 5),
      expectedYield: '35-45 à¤•à¥à¤µà¤¿à¤‚à¤Ÿà¤²/à¤¹à¥‡à¤•à¥à¤Ÿà¥‡à¤¯à¤°',
      marketPrice: 'â‚¹2000-2500/à¤•à¥à¤µà¤¿à¤‚à¤Ÿà¤²',
      profitPotential: 50000,
      growthDuration: '120-140 à¤¦à¤¿à¤¨',
      waterRequirement: 'à¤®à¤§à¥à¤¯à¤®',
      riskLevel: 'medium' as const,
      season: getCurrentSeason(),
      plantingTime: 'à¤®à¥Œà¤¸à¤® à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤°',
      benefits: ['à¤¸à¥à¤¥à¤¿à¤° à¤†à¤¯', 'à¤…à¤šà¥à¤›à¥€ à¤®à¤¾à¤‚à¤—'],
      requirements: ['à¤‰à¤šà¤¿à¤¤ à¤¸à¤¿à¤‚à¤šà¤¾à¤ˆ', 'à¤¸à¤®à¤¯ à¤ªà¤° à¤¬à¥à¤†à¤ˆ'],
      satelliteInsights: {
        ndviScore: 65,
        soilHealth: 70,
        waterStress: 'medium',
        cropHealth: 75,
        recommendations: ['Enable location services for accurate analysis']
      },
      marketData: {
        currentPrice: 2200,
        pricetrend: 'stable',
        demand: 'high'
      }
    }));
  };

  const getCurrentSeason = (): string => {
    const month = new Date().getMonth() + 1;
    if (month >= 11 || month <= 3) return 'à¤°à¤¬à¥€';
    if (month >= 4 && month <= 6) return 'à¤œà¤¾à¤¯à¤¦';
    return 'à¤–à¤°à¥€à¤«';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#757575';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Loading Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)',
              color: 'white',
              p: 4,
              mb: 4,
              borderRadius: 4,
              textAlign: 'center'
            }}
          >
            <Satellite sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              ðŸ›°ï¸ AI-Powered Crop Analysis
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              à¤‰à¤¨à¥à¤¨à¤¤ à¤‰à¤ªà¤—à¥à¤°à¤¹ à¤¡à¥‡à¤Ÿà¤¾ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤«à¤¸à¤² à¤•à¥€ à¤¸à¤¿à¤«à¤¾à¤°à¤¿à¤¶
            </Typography>
          </Paper>
        </motion.div>

        {/* Processing Steps */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={processing.progress}
                    sx={{ mr: 2 }}
                    size={40}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {processing.stage}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {processing.message}
                    </Typography>
                  </Box>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={processing.progress}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4caf50'
                    }
                  }}
                />

                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    ðŸ”„ Processing: {processing.progress}% complete
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Location Info (if available) */}
        {locationData && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="body1">
                  ðŸ“ <strong>Location:</strong> {locationService.formatLocationDisplay(locationData)}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <LocalFlorist sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            ðŸŒ¾ AI-Enhanced Crop Recommendations
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            à¤‰à¤ªà¤—à¥à¤°à¤¹ à¤¡à¥‡à¤Ÿà¤¾ à¤”à¤° AI à¤•à¥‡ à¤¸à¤¾à¤¥ à¤µà¥à¤¯à¤•à¥à¤¤à¤¿à¤—à¤¤ à¤«à¤¸à¤² à¤¸à¥à¤à¤¾à¤µ
          </Typography>
          
          {locationData && (
            <Chip
              label={`ðŸ“ ${locationService.formatLocationDisplay(locationData)}`}
              sx={{
                mt: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            />
          )}
        </Paper>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Satellite Analysis Summary */}
      {satelliteAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
              ðŸ›°ï¸ Satellite Analysis Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {Math.round(satelliteAnalysis.ndviData.ndvi * 100)}%
                  </Typography>
                  <Typography variant="body2">NDVI Score</Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {satelliteAnalysis.analysis.soilFertilityIndex}%
                  </Typography>
                  <Typography variant="body2">Soil Health</Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                    {satelliteAnalysis.analysis.cropHealthScore}%
                  </Typography>
                  <Typography variant="body2">Crop Health</Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(156, 39, 176, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                    {satelliteAnalysis.analysis.waterStressLevel.toUpperCase()}
                  </Typography>
                  <Typography variant="body2">Water Stress</Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      )}

      {/* Recommendations */}
      <Grid container spacing={3}>
        {recommendations.map((rec, index) => (
          <Grid item xs={12} md={6} key={rec.id}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getScoreColor(rec.suitabilityScore),
                        mr: 2,
                        width: 56,
                        height: 56
                      }}
                    >
                      <Agriculture sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {rec.name} ({rec.hindiName})
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="h6" sx={{ color: getScoreColor(rec.suitabilityScore) }}>
                          {rec.suitabilityScore}%
                        </Typography>
                        <Typography variant="body2">Suitability</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Key Metrics */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">Expected Yield</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                          {rec.expectedYield}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">Market Price</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                          {rec.marketPrice}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Details */}
                  <Accordion sx={{ boxShadow: 'none', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ðŸ“Š Detailed Analysis
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><AttachMoney /></ListItemIcon>
                          <ListItemText 
                            primary="Profit Potential"
                            secondary={`â‚¹${rec.profitPotential.toLocaleString()}/hectare`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><WaterDrop /></ListItemIcon>
                          <ListItemText 
                            primary="Water Requirement"
                            secondary={rec.waterRequirement}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><Warning sx={{ color: getRiskColor(rec.riskLevel) }} /></ListItemIcon>
                          <ListItemText 
                            primary="Risk Level"
                            secondary={rec.riskLevel.toUpperCase()}
                          />
                        </ListItem>
                      </List>

                      {/* Satellite Insights */}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ðŸ›°ï¸ Satellite Insights:
                      </Typography>
                      <List dense>
                        {rec.satelliteInsights.recommendations.slice(0, 3).map((insight, idx) => (
                          <ListItem key={idx} sx={{ py: 0.5 }}>
                            <ListItemIcon><CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} /></ListItemIcon>
                            <ListItemText 
                              primary={insight}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* Action Chips */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={rec.season} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={rec.plantingTime} 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`${rec.growthDuration}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Assessment />}
          onClick={initializeEnhancedRecommendations}
          sx={{
            mr: 2,
            borderRadius: 3,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(45deg, #4caf50, #2e7d32)'
          }}
        >
          Refresh Analysis
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<Info />}
          sx={{ borderRadius: 3, px: 4, py: 1.5 }}
        >
          Get Detailed Report
        </Button>
      </Box>
    </Box>
  );
};

export default EnhancedCropRecommendation;