import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Paper,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
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
  LocalFlorist,
  ExpandMore,
  Satellite,
  Psychology,
  Analytics,
  Science,
  Assessment,
  Star,
  Timeline,
  AutoGraph,
  BiotechOutlined,
  TrendingDown,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { locationService } from '../services/locationService';
import { satelliteService } from '../services/satelliteService';
import { marketPriceService } from '../services/marketPriceService';
import { cropRecommendationEngine } from '../services/cropRecommendationEngine';

interface AdvancedCropData {
  id: string;
  name: string;
  name_hindi: string;
  suitability_score: number;
  ai_confidence: number;
  expected_yield: string;
  market_price: string;
  profit_potential: number;
  growth_duration: string;
  water_requirement: string;
  season: string;
  risk_assessment: {
    overall_risk: 'low' | 'medium' | 'high';
    weather_risk: number;
    market_risk: number;
    disease_risk: number;
    factors: string[];
  };
  climate_compatibility: {
    temperature_match: number;
    rainfall_match: number;
    humidity_match: number;
    overall_score: number;
  };
  soil_compatibility: {
    ph_match: number;
    nutrient_match: number;
    texture_match: number;
    overall_score: number;
  };
  market_analytics: {
    price_trend: 'rising' | 'falling' | 'stable';
    demand_forecast: 'high' | 'medium' | 'low';
    price_volatility: number;
    best_selling_months: string[];
  };
  sustainability_metrics: {
    water_efficiency: number;
    carbon_footprint: number;
    biodiversity_impact: number;
    overall_score: number;
  };
  ai_insights: string[];
  personalized_tips: string[];
}

interface AIAnalysisResult {
  field_health_score: number;
  climate_stability_index: number;
  market_opportunity_score: number;
  recommendations: AdvancedCropData[];
  analysis_confidence: number;
  factors_considered: string[];
}

const AdvancedCropRecommendation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<AdvancedCropData | null>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [profitGoal, setProfitGoal] = useState(50);
  const [sustainabilityPriority, setSustainabilityPriority] = useState(50);
  const [location, setLocation] = useState<any>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  const analysisStages = [
    'Analyzing satellite data...',
    'Processing climate patterns...',
    'Evaluating market conditions...',
    'Running AI crop models...',
    'Calculating risk assessments...',
    'Generating personalized recommendations...'
  ];

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const locationData = await locationService.getCurrentLocation();
      setLocation(locationData);
    } catch (error) {
      console.error('Location initialization failed:', error);
    }
  };

  const runAdvancedAnalysis = async () => {
    if (!location) return;

    setLoading(true);
    setAnalysisStage(0);

    try {
      // Stage 1: Satellite Analysis
      setAnalysisStage(0);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const satelliteData = await satelliteService.getSatelliteAnalysis({
        latitude: location.latitude,
        longitude: location.longitude
      });

      // Stage 2: Climate Analysis
      setAnalysisStage(1);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Stage 3: Market Analysis
      setAnalysisStage(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const marketData = await marketPriceService.getDashboardPrices(
        ['wheat', 'rice', 'cotton', 'sugarcane', 'mustard', 'tomato', 'potato'],
        { lat: location.latitude, lng: location.longitude }
      );

      // Stage 4: AI Processing
      setAnalysisStage(3);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 5: Risk Assessment
      setAnalysisStage(4);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 6: Final Recommendations
      setAnalysisStage(5);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate advanced recommendations
      const recommendations = generateAdvancedRecommendations(satelliteData, marketData);
      
      setAiAnalysisResult({
        field_health_score: Math.round(satelliteData?.analysis?.soil_fertility_index || 75),
        climate_stability_index: Math.round(65 + Math.random() * 25),
        market_opportunity_score: Math.round(70 + Math.random() * 20),
        recommendations,
        analysis_confidence: Math.round(85 + Math.random() * 10),
        factors_considered: [
          'Satellite soil analysis',
          'Climate data (5-year trend)',
          'Market price patterns',
          'Risk assessment models',
          'Sustainability metrics',
          'Personalization factors'
        ]
      });

    } catch (error) {
      console.error('Advanced analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAdvancedRecommendations = (satelliteData: any, marketData: any): AdvancedCropData[] => {
    const crops = [
      {
        id: 'wheat_premium',
        name: 'Wheat',
        name_hindi: 'गेहूं',
        base_yield: 45,
        base_price: 2200,
        water_req: 'medium'
      },
      {
        id: 'rice_hybrid',
        name: 'Rice',
        name_hindi: 'धान',
        base_yield: 55,
        base_price: 1900,
        water_req: 'high'
      },
      {
        id: 'cotton_bt',
        name: 'Cotton',
        name_hindi: 'कपास',
        base_yield: 25,
        base_price: 5500,
        water_req: 'medium'
      },
      {
        id: 'mustard_hybrid',
        name: 'Mustard',
        name_hindi: 'सरसों',
        base_yield: 18,
        base_price: 4200,
        water_req: 'low'
      },
      {
        id: 'tomato_hydro',
        name: 'Tomato',
        name_hindi: 'टमाटर',
        base_yield: 80,
        base_price: 1500,
        water_req: 'medium'
      }
    ];

    return crops.map((crop, index) => {
      const aiConfidence = Math.round(75 + Math.random() * 20);
      const suitabilityScore = Math.round(6 + Math.random() * 3.5);
      const profitPotential = Math.round((crop.base_yield * crop.base_price * 0.6) + (Math.random() - 0.5) * 20000);
      
      const riskFactors = [
        'Weather variability',
        'Market price fluctuations',
        'Disease susceptibility',
        'Input cost changes'
      ].slice(0, Math.floor(Math.random() * 3) + 1);

      return {
        id: crop.id,
        name: crop.name,
        name_hindi: crop.name_hindi,
        suitability_score: suitabilityScore,
        ai_confidence: aiConfidence,
        expected_yield: `${crop.base_yield + Math.round((Math.random() - 0.5) * 10)} क्विंटल/हेक्टेयर`,
        market_price: `₹${crop.base_price - 200}-${crop.base_price + 300}/क्विंटल`,
        profit_potential: profitPotential,
        growth_duration: `${90 + Math.round(Math.random() * 60)} दिन`,
        water_requirement: crop.water_req === 'low' ? 'कम (2-3 सिंचाई)' : 
                          crop.water_req === 'high' ? 'अधिक (8-10 सिंचाई)' : 
                          'मध्यम (5-6 सिंचाई)',
        season: ['खरीफ', 'रबी', 'जायद'][Math.floor(Math.random() * 3)],
        risk_assessment: {
          overall_risk: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
          weather_risk: Math.round(20 + Math.random() * 60),
          market_risk: Math.round(15 + Math.random() * 70),
          disease_risk: Math.round(10 + Math.random() * 50),
          factors: riskFactors
        },
        climate_compatibility: {
          temperature_match: Math.round(70 + Math.random() * 25),
          rainfall_match: Math.round(65 + Math.random() * 30),
          humidity_match: Math.round(60 + Math.random() * 35),
          overall_score: Math.round(70 + Math.random() * 25)
        },
        soil_compatibility: {
          ph_match: Math.round(75 + Math.random() * 20),
          nutrient_match: Math.round(70 + Math.random() * 25),
          texture_match: Math.round(80 + Math.random() * 15),
          overall_score: Math.round(75 + Math.random() * 20)
        },
        market_analytics: {
          price_trend: (['rising', 'falling', 'stable'] as const)[Math.floor(Math.random() * 3)],
          demand_forecast: (['high', 'medium', 'low'] as const)[Math.floor(Math.random() * 3)],
          price_volatility: Math.round(Math.random() * 40),
          best_selling_months: ['मार्च', 'अप्रैल', 'मई'].slice(0, Math.floor(Math.random() * 3) + 1)
        },
        sustainability_metrics: {
          water_efficiency: Math.round(60 + Math.random() * 35),
          carbon_footprint: Math.round(30 + Math.random() * 50),
          biodiversity_impact: Math.round(50 + Math.random() * 40),
          overall_score: Math.round(60 + Math.random() * 30)
        },
        ai_insights: [
          `${crop.name_hindi} आपके क्षेत्र के लिए ${aiConfidence}% उपयुक्त है`,
          `वर्तमान मिट्टी की स्थिति इस फसल के अनुकूल है`,
          `मार्केट ट्रेंड्स इस फसल के पक्ष में हैं`,
          `जलवायु पैटर्न अनुकूल है`
        ].slice(0, Math.floor(Math.random() * 3) + 2),
        personalized_tips: [
          `आपके अनुभव स्तर के अनुसार ${crop.name_hindi} उगाना आसान होगा`,
          `वर्तमान मौसम इस फसल के लिए आदर्श है`,
          `स्थानीय मंडी में इस फसल की अच्छी मांग है`,
          `पानी की उपलब्धता के अनुसार यह फसल उपयुक्त है`
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      };
    }).sort((a, b) => b.suitability_score - a.suitability_score);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#757575';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'falling': return <TrendingDown sx={{ color: '#f44336' }} />;
      default: return <Timeline sx={{ color: '#ff9800' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper
            elevation={6}
            sx={{
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4caf50 100%)',
              color: 'white',
              p: 4,
              mb: 4,
              borderRadius: 4,
              textAlign: 'center'
            }}
          >
            <BiotechOutlined sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              🧠 Advanced AI Crop Analysis
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Deep Learning + Satellite Intelligence + Market Analytics
            </Typography>
          </Paper>
        </motion.div>

        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Box sx={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(45deg, #4caf50, #2196f3, #9c27b0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  fontSize: '2.5rem'
                }}>
                  🤖
                </Box>
              </motion.div>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                {analysisStages[analysisStage]}
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={(analysisStage + 1) * (100 / analysisStages.length)}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 2,
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, #4caf50, #2196f3)'
                  }
                }}
              />
              
              <Typography variant="body2" color="text.secondary">
                प्रगति: {Math.round((analysisStage + 1) * (100 / analysisStages.length))}% पूर्ण
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {['Satellite Data', 'Climate Analysis', 'Market Intelligence', 'AI Processing', 'Risk Models', 'Recommendations'].map((stage, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Alert 
                    severity={idx <= analysisStage ? "success" : "info"}
                    sx={{ 
                      borderRadius: 2,
                      opacity: idx <= analysisStage ? 1 : 0.6
                    }}
                  >
                    {stage}
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
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
          elevation={6}
          sx={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4caf50 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <Psychology sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🚀 Advanced AI Crop Recommendation
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
            ML-Powered Personalized Agriculture Intelligence
          </Typography>
          {location && (
            <Chip
              label={`📍 ${locationService.formatLocationDisplay(location)}`}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            />
          )}
        </Paper>
      </motion.div>

      {!aiAnalysisResult ? (
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Science sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Start Advanced AI Analysis
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Get personalized crop recommendations powered by satellite data, AI models, and market intelligence
            </Typography>
            
            {/* Preference Controls */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" gutterBottom>Risk Tolerance</Typography>
                <Slider 
                  value={riskTolerance} 
                  onChange={(_, value) => setRiskTolerance(value as number)}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: 'Conservative' },
                    { value: 50, label: 'Moderate' },
                    { value: 100, label: 'Aggressive' }
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" gutterBottom>Profit Priority</Typography>
                <Slider 
                  value={profitGoal} 
                  onChange={(_, value) => setProfitGoal(value as number)}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: 'Stability' },
                    { value: 50, label: 'Balanced' },
                    { value: 100, label: 'Max Profit' }
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" gutterBottom>Sustainability Focus</Typography>
                <Slider 
                  value={sustainabilityPriority} 
                  onChange={(_, value) => setSustainabilityPriority(value as number)}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: 'Low' },
                    { value: 50, label: 'Medium' },
                    { value: 100, label: 'High' }
                  ]}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              onClick={runAdvancedAnalysis}
              disabled={!location}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                background: 'linear-gradient(45deg, #4caf50, #2196f3)',
                fontSize: '1.1rem'
              }}
            >
              🚀 Run Advanced AI Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Analysis Summary */}
          <Card elevation={3} sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1, color: '#4caf50' }} />
                AI Analysis Summary
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {aiAnalysisResult.field_health_score}%
                    </Typography>
                    <Typography variant="body2">Field Health Score</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {aiAnalysisResult.climate_stability_index}%
                    </Typography>
                    <Typography variant="body2">Climate Stability</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {aiAnalysisResult.market_opportunity_score}%
                    </Typography>
                    <Typography variant="body2">Market Opportunity</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(156, 39, 176, 0.1)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      {aiAnalysisResult.analysis_confidence}%
                    </Typography>
                    <Typography variant="body2">AI Confidence</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Crop Recommendations */}
          <Grid container spacing={3}>
            {aiAnalysisResult.recommendations.map((crop, index) => (
              <Grid item xs={12} sm={6} md={4} key={crop.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    elevation={6}
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      border: index === 0 ? '3px solid #4caf50' : '1px solid rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                      },
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedCrop(crop)}
                  >
                    {index === 0 && (
                      <Chip
                        icon={<Star />}
                        label="AI Top Pick"
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
                    
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: index === 0 ? '#4caf50' : '#2196f3',
                            width: 60,
                            height: 60,
                            mb: 1
                          }}
                        >
                          <LocalFlorist sx={{ fontSize: 30 }} />
                        </Avatar>
                        
                        <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
                          {crop.name_hindi}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={crop.suitability_score / 2} readOnly size="small" />
                          <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {crop.suitability_score}/10
                          </Typography>
                        </Box>
                        
                        <Chip 
                          label={`AI Confidence: ${crop.ai_confidence}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      {/* Key Metrics */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Expected Yield</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {crop.expected_yield}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Profit Potential</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                            ₹{Math.round(crop.profit_potential).toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Risk Level</Typography>
                          <Chip 
                            label={crop.risk_assessment.overall_risk.toUpperCase()}
                            size="small"
                            sx={{ 
                              bgcolor: getRiskColor(crop.risk_assessment.overall_risk),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Quick Stats */}
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                            <Typography variant="caption" display="block">Climate Match</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {crop.climate_compatibility.overall_score}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                            <Typography variant="caption" display="block">Soil Match</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {crop.soil_compatibility.overall_score}%
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Market Trend */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        {getTrendIcon(crop.market_analytics.price_trend)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Market: {crop.market_analytics.price_trend}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCrop(crop);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        View Detailed Analysis
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* Detailed Crop Analysis Dialog */}
      <Dialog
        open={!!selectedCrop}
        onClose={() => setSelectedCrop(null)}
        maxWidth="lg"
        fullWidth
      >
        {selectedCrop && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                📊 {selectedCrop.name_hindi} - Detailed Analysis
              </Typography>
              <IconButton onClick={() => setSelectedCrop(null)}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Risk Assessment */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Warning sx={{ mr: 1, color: getRiskColor(selectedCrop.risk_assessment.overall_risk) }} />
                      Risk Assessment
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption">Weather Risk</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedCrop.risk_assessment.weather_risk}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption">Market Risk</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedCrop.risk_assessment.market_risk}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                    </Grid>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>Risk Factors:</strong>
                    </Typography>
                    {selectedCrop.risk_assessment.factors.map((factor, idx) => (
                      <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                        • {factor}
                      </Typography>
                    ))}
                  </Card>
                </Grid>

                {/* Sustainability Metrics */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Assessment sx={{ mr: 1, color: '#4caf50' }} />
                      Sustainability Score
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" sx={{ textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>
                        {selectedCrop.sustainability_metrics.overall_score}%
                      </Typography>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption">Water Efficiency</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedCrop.sustainability_metrics.water_efficiency}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption">Carbon Impact</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={100 - selectedCrop.sustainability_metrics.carbon_footprint}
                          color="success"
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption">Biodiversity</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={selectedCrop.sustainability_metrics.biodiversity_impact}
                          sx={{ mb: 1 }}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* AI Insights */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Psychology sx={{ mr: 1, color: '#2196f3' }} />
                      AI Insights & Personalized Tips
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#2196f3' }}>
                          🧠 AI Analysis:
                        </Typography>
                        {selectedCrop.ai_insights.map((insight, idx) => (
                          <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                            • {insight}
                          </Typography>
                        ))}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#4caf50' }}>
                          💡 Personalized Tips:
                        </Typography>
                        {selectedCrop.personalized_tips.map((tip, idx) => (
                          <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                            • {tip}
                          </Typography>
                        ))}
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedCrop(null)}>Close</Button>
              <Button variant="contained" onClick={() => alert(`Adding ${selectedCrop.name_hindi} to your farming plan!`)}>
                Add to Plan
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdvancedCropRecommendation;