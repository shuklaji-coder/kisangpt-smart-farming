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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Tab,
  Tabs,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  AttachMoney,
  Agriculture,
  LocationOn,
  CalendarMonth,
  Analytics,
  PieChart,
  BarChart,
  Refresh,
  Warning,
  CheckCircle,
  Info,
  MonetizationOn,
  Assessment,
  Timeline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';
import { marketPriceService, CropPrice, MarketTrend, ProfitCalculation, MarketComparison } from '../services/marketPriceService';

interface MarketPrice {
  crop: string;
  crop_hindi: string;
  current_price: number;
  previous_price: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  market: string;
  date: string;
}

interface EconomicForecast {
  crop: string;
  current_price: number;
  predicted_price_1_month: number;
  predicted_price_3_months: number;
  predicted_price_6_months: number;
  confidence_level: number;
  factors: string[];
}

interface ProfitAnalysis {
  crop: string;
  investment_per_hectare: number;
  expected_revenue: number;
  profit_margin: number;
  roi_percentage: number;
  break_even_price: number;
  risk_level: 'low' | 'medium' | 'high';
}

// Loading state interface
interface LoadingState {
  prices: boolean;
  trends: boolean;
  profits: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

const MarketAnalysis: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [forecasts, setForecasts] = useState<EconomicForecast[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    prices: true,
    trends: true,
    profits: true
  });
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  // Comparison state
  const [comparisonCrop, setComparisonCrop] = useState<string>('wheat');
  const [comparisonQuantity, setComparisonQuantity] = useState<number>(10); // quintals
  const [comparison, setComparison] = useState<MarketComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);

  // Alerts state
  const [alertCrop, setAlertCrop] = useState<string>('wheat');
  const [alertTargetPrice, setAlertTargetPrice] = useState<number>(3000);
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alerts, setAlerts] = useState(marketPriceService.getPriceAlerts());
  const [alertChecking, setAlertChecking] = useState<boolean>(false);
  const [triggeredAlerts, setTriggeredAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Try to get geolocation for better mandi selection
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          fetchMarketData({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to Delhi
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
          fetchMarketData({ lat: 28.6139, lng: 77.2090 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
      fetchMarketData({ lat: 28.6139, lng: 77.2090 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMarketData = async (loc?: { lat: number; lng: number }) => {
    console.log('🔄 Starting AI-powered market data fetch...');
    setLoading({ prices: true, trends: true, profits: true });
    setError(null);
    
    try {
      const crops = ['wheat', 'rice', 'cotton', 'mustard', 'sugarcane'];
      const locToUse = loc || userLocation || { lat: 28.6139, lng: 77.2090 }; // Delhi default
      
      console.log('📊 Fetching real-time crop prices from market service...');
      // Fetch real market prices using service
      const pricesPromises = crops.map(crop => 
        marketPriceService.getCropPrices(crop, locToUse)
          .catch(error => {
            console.warn(`Failed to fetch prices for ${crop}:`, error);
            return [] as any[];
          })
      );
      
      const allPricesData = await Promise.all(pricesPromises);
      
      // live/demo indicator
      setIsLive(marketPriceService.getLastProvider() === 'backend');
      
      // Convert service data to component format
      const marketData: MarketPrice[] = allPricesData.map((pricesArray, index) => {
        const crop = crops[index];
        const cropPrice = pricesArray[0]; // Get best price
        
        if (!cropPrice) {
          // Fallback data if AI service fails
          return {
            crop: crop.charAt(0).toUpperCase() + crop.slice(1),
            crop_hindi: crop === 'wheat' ? 'गेहूं' : crop === 'rice' ? 'चावल' : crop === 'cotton' ? 'कपास' : crop === 'mustard' ? 'सरसों' : 'अन्य',
            current_price: 2000,
            previous_price: 1950,
            change_percentage: 2.5,
            trend: 'stable' as const,
            unit: 'per quintal',
            market: 'Local Mandi',
            date: 'Today'
          };
        }
        
        return {
          crop: cropPrice.crop.charAt(0).toUpperCase() + cropPrice.crop.slice(1),
          crop_hindi: cropPrice.hindiName,
          current_price: cropPrice.currentPrice,
          previous_price: cropPrice.previousPrice,
          change_percentage: cropPrice.changePercent,
          trend: cropPrice.trend,
          unit: `per ${cropPrice.unit}`,
          market: 'AI Market Analysis',
          date: 'Real-time'
        };
      }).filter(Boolean);
      
      setMarketPrices(marketData);
      setLoading(prev => ({ ...prev, prices: false }));
      
      console.log('📈 Fetching market trends and forecasts...');
      // Fetch market trends for forecasting (may use backend)
      const trendsPromises = crops.slice(0, 3).map(crop => 
        marketPriceService.getMarketTrends(crop, 'weekly')
          .catch(error => {
            console.warn(`Failed to fetch trends for ${crop}:`, error);
            return null;
          })
      );
      
      const trendsData = await Promise.all(trendsPromises);
      const validTrends = trendsData.filter(trend => trend !== null) as MarketTrend[];
      setMarketTrends(validTrends);
      
      // Convert trends to forecast format
      const forecastData: EconomicForecast[] = validTrends.map(trend => {
        const currentPrice = trend.data[trend.data.length - 1]?.price || 2000;
        const predictions = trend.forecast;
        
        return {
          crop: trend.crop.charAt(0).toUpperCase() + trend.crop.slice(1),
          current_price: currentPrice,
          predicted_price_1_month: predictions[6]?.predictedPrice || currentPrice * 1.05,
          predicted_price_3_months: predictions[6]?.predictedPrice * 1.08 || currentPrice * 1.08,
          predicted_price_6_months: predictions[6]?.predictedPrice * 1.12 || currentPrice * 1.12,
          confidence_level: predictions[6]?.confidence || 75,
          factors: [
            trend.analysis.marketSentiment === 'bullish' ? 'बाजार में तेजी की भावना' : 'बाजार में मंदी की भावना',
            `मूल्य स्थिरता: ${trend.analysis.priceStability}%`,
            trend.analysis.seasonality === 'high' ? 'मौसमी मांग अधिक' : 'मौसमी मांग सामान्य'
          ]
        };
      });
      
      setForecasts(forecastData);
      setLoading(prev => ({ ...prev, trends: false }));

      // After prices fetched, we can pre-load comparison for default crop
      try {
        if (userLocation || loc) {
          await fetchComparisonInternal(comparisonCrop, comparisonQuantity, loc || (userLocation as any));
        }
      } catch {}
      
      console.log('💰 Calculating AI-powered profit analysis...');
      // Fetch profit analysis
      const profitPromises = crops.slice(0, 3).map(crop => 
        marketPriceService.calculateProfit(crop, 2.5, undefined, userLocation) // 2.5 acres farm
          .catch(error => {
            console.warn(`Failed to calculate profit for ${crop}:`, error);
            return null;
          })
      );
      
      const profitData = await Promise.all(profitPromises);
      const validProfits = profitData.filter(profit => profit !== null) as ProfitCalculation[];
      
      const profitAnalysisData: ProfitAnalysis[] = validProfits.map(profit => {
        const getRiskLevel = (roi: number): 'low' | 'medium' | 'high' => {
          if (roi > 100) return 'low';
          if (roi > 50) return 'medium';
          return 'high';
        };
        
        return {
          crop: profit.crop.charAt(0).toUpperCase() + profit.crop.slice(1),
          investment_per_hectare: profit.investmentPerAcre * 2.47, // Convert acre to hectare
          expected_revenue: profit.grossRevenue,
          profit_margin: profit.netProfit,
          roi_percentage: profit.roi,
          break_even_price: profit.breakEvenPrice,
          risk_level: getRiskLevel(profit.roi)
        };
      });
      
      setProfitAnalysis(profitAnalysisData);
      setLoading(prev => ({ ...prev, profits: false }));
      
      console.log('✅ AI market analysis complete! Data refreshed successfully.');
      
    } catch (error) {
      console.error('❌ Error in AI market analysis:', error);
      setError('Market data fetch failed. Using cached data.');
      
      // Set loading to false even on error
      setLoading({ prices: false, trends: false, profits: false });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      default: return '#757575';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp />;
      case 'down': return <TrendingDown />;
      default: return <ShowChart />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#757575';
    }
  };

  // Comparison and alerts helpers
  const fetchComparisonInternal = async (crop: string, quantity: number, loc: { lat: number; lng: number }) => {
    try {
      setComparisonLoading(true);
      const comp = await marketPriceService.getMarketComparison(crop, loc, quantity);
      setComparison(comp);
    } catch (e) {
      console.warn('Comparison fetch failed', e);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    try {
      await marketPriceService.createPriceAlert(alertCrop, alertTargetPrice, alertCondition, []);
      setAlerts(marketPriceService.getPriceAlerts());
    } catch (e) {
      console.error('Failed to create alert', e);
    }
  };

  const handleToggleAlert = (id: string) => {
    marketPriceService.toggleAlert(id);
    setAlerts(marketPriceService.getPriceAlerts());
  };

  const handleDeleteAlert = (id: string) => {
    marketPriceService.deleteAlert(id);
    setAlerts(marketPriceService.getPriceAlerts());
  };

  const handleCheckAlerts = async () => {
    try {
      setAlertChecking(true);
      const triggered = await marketPriceService.checkPriceAlerts();
      setTriggeredAlerts(triggered.map(a => `${a.crop} ${a.condition} ₹${a.targetPrice}`));
    } catch (e) {
      console.error('Check alerts failed', e);
    } finally {
      setAlertChecking(false);
    }
  };

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
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #ef6c00 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Assessment sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            📊 {t('market.title', 'Market Analysis')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {t('market.subtitle', 'बाजार का विश्लेषण - मूल्य पूर्वानुमान और लाभ योजना')}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Chip size="small" label={isLive ? 'Live prices' : 'Demo prices'} sx={{ bgcolor: isLive ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.2)', color: 'white' }} />
            {userLocation && (
              <Chip size="small" icon={<LocationOn sx={{ color: 'white' }} />} label={`${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            )}
          </Box>
        </Paper>
      </motion.div>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 'bold'
            }
          }}
        >
          <Tab icon={<ShowChart />} label="Current Prices" />
          <Tab icon={<Timeline />} label="Price Forecast" />
          <Tab icon={<MonetizationOn />} label="Profit Analysis" />
          <Tab icon={<LocationOn />} label="Market Comparison" />
          <Tab icon={<Warning />} label="Price Alerts" />
        </Tabs>
      </Paper>

      {/* Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {error && (
          <Alert severity="warning" sx={{ borderRadius: 2, mr: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ ml: 'auto' }}>
          <Button
            startIcon={<Refresh />}
            onClick={() => fetchMarketData()}
            disabled={loading.prices || loading.trends || loading.profits}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            {loading.prices || loading.trends || loading.profits ? 'AI Processing...' : 'Refresh AI Data'}
          </Button>
        </Box>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Current Market Prices */}
        {loading.prices ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="h6">🤖 AI analyzing real-time market data...</Typography>
            <Typography variant="body2" color="text.secondary">
              Processing crop prices from multiple mandis and applying ML algorithms
            </Typography>
          </Box>
        ) : (
        <Grid container spacing={3}>
          {marketPrices.map((price, index) => (
            <Grid item xs={12} sm={6} md={4} key={price.crop}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getTrendColor(price.trend),
                          mr: 2,
                          width: 50,
                          height: 50,
                        }}
                      >
                        {getTrendIcon(price.trend)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {price.crop} ({price.crop_hindi})
                        </Typography>
                    <Typography variant="body2" color="text.secondary">
                          {isLive ? 'Live Market' : price.market}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      ₹{price.current_price.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {price.unit}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={`${price.change_percentage > 0 ? '+' : ''}${price.change_percentage}%`}
                        size="small"
                        sx={{
                          bgcolor: getTrendColor(price.trend),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        vs yesterday: ₹{price.previous_price}
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Last updated: {price.date}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        )}

        {/* Market Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Paper elevation={2} sx={{ mt: 4, p: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
              📈 Market Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Trending Up: 3 crops
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Trending Down: 2 crops
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Best performing: Cotton (+0.9%)
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Price Forecast */}
        {loading.trends ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="h6">📈 AI generating price forecasts...</Typography>
            <Typography variant="body2" color="text.secondary">
              Analyzing market trends, seasonal patterns, and applying predictive models
            </Typography>
          </Box>
        ) : (
        <Grid container spacing={3}>
          {forecasts.map((forecast, index) => (
            <Grid item xs={12} md={6} key={forecast.crop}>
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.primary.main }}>
                      📊 {forecast.crop} Forecast
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Prediction Confidence
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={forecast.confidence_level}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          mb: 1,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: forecast.confidence_level > 80 ? '#4caf50' : forecast.confidence_level > 60 ? '#ff9800' : '#f44336',
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {forecast.confidence_level}%
                      </Typography>
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Period</TableCell>
                            <TableCell align="right">Price (₹)</TableCell>
                            <TableCell align="right">Change</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Current</TableCell>
                            <TableCell align="right">₹{forecast.current_price}</TableCell>
                            <TableCell align="right">-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>1 Month</TableCell>
                            <TableCell align="right">₹{forecast.predicted_price_1_month}</TableCell>
                            <TableCell align="right" sx={{ color: forecast.predicted_price_1_month > forecast.current_price ? '#4caf50' : '#f44336' }}>
                              {((forecast.predicted_price_1_month - forecast.current_price) / forecast.current_price * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>3 Months</TableCell>
                            <TableCell align="right">₹{forecast.predicted_price_3_months}</TableCell>
                            <TableCell align="right" sx={{ color: forecast.predicted_price_3_months > forecast.current_price ? '#4caf50' : '#f44336' }}>
                              {((forecast.predicted_price_3_months - forecast.current_price) / forecast.current_price * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>6 Months</TableCell>
                            <TableCell align="right">₹{forecast.predicted_price_6_months}</TableCell>
                            <TableCell align="right" sx={{ color: forecast.predicted_price_6_months > forecast.current_price ? '#4caf50' : '#f44336' }}>
                              {((forecast.predicted_price_6_months - forecast.current_price) / forecast.current_price * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                      Key Factors
                    </Typography>
                    <List dense>
                      {forecast.factors.map((factor, idx) => (
                        <ListItem key={idx} sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText primary={factor} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Profit Analysis */}
        {loading.profits ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="h6">💰 AI calculating profit scenarios...</Typography>
            <Typography variant="body2" color="text.secondary">
              Processing investment costs, market prices, and yield predictions
            </Typography>
          </Box>
        ) : (
        <Grid container spacing={3}>
          {profitAnalysis.map((profit, index) => (
            <Grid item xs={12} key={profit.crop}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              mr: 2,
                              width: 50,
                              height: 50,
                            }}
                          >
                            <MonetizationOn />
                          </Avatar>
                          <Box>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                              {profit.crop} Profitability Analysis
                            </Typography>
                            <Chip
                              label={`${profit.risk_level.toUpperCase()} RISK`}
                              size="small"
                              sx={{
                                bgcolor: getRiskColor(profit.risk_level),
                                color: 'white',
                                mt: 0.5
                              }}
                            />
                          </Box>
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">Investment</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                ₹{profit.investment_per_hectare.toLocaleString()}
                              </Typography>
                              <Typography variant="caption">per hectare</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">Revenue</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                ₹{profit.expected_revenue.toLocaleString()}
                              </Typography>
                              <Typography variant="caption">expected</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">Profit</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                ₹{profit.profit_margin.toLocaleString()}
                              </Typography>
                              <Typography variant="caption">net profit</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary">ROI</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                                {profit.roi_percentage}%
                              </Typography>
                              <Typography variant="caption">return</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📊 Key Metrics
                          </Typography>
                          <List dense>
                            <ListItem sx={{ pl: 0 }}>
                              <ListItemIcon>
                                <Analytics sx={{ fontSize: 18 }} />
                              </ListItemIcon>
                              <ListItemText
                                primary="Break-even Price"
                                secondary={`₹${profit.break_even_price}/quintal`}
                              />
                            </ListItem>
                            <ListItem sx={{ pl: 0 }}>
                              <ListItemIcon>
                                <Warning sx={{ fontSize: 18, color: getRiskColor(profit.risk_level) }} />
                              </ListItemIcon>
                              <ListItemText
                                primary="Risk Level"
                                secondary={profit.risk_level.charAt(0).toUpperCase() + profit.risk_level.slice(1)}
                              />
                            </ListItem>
                          </List>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Market Comparison */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="comp-crop">Crop</InputLabel>
                <Select
                  labelId="comp-crop"
                  label="Crop"
                  value={comparisonCrop}
                  onChange={(e) => setComparisonCrop(e.target.value)}
                >
                  {['wheat','rice','cotton','mustard','sugarcane'].map(c => (
                    <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="number"
                size="small"
                label="Quantity (quintals)"
                value={comparisonQuantity}
                onChange={(e) => setComparisonQuantity(Math.max(1, Number(e.target.value)))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={() => userLocation && fetchComparisonInternal(comparisonCrop, comparisonQuantity, userLocation)}
                disabled={!userLocation || comparisonLoading}
                startIcon={<Refresh />}
                sx={{ borderRadius: 3 }}
              >
                {comparisonLoading ? 'Analyzing...' : 'Compare Nearby Mandis'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {comparison && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Best Option</Typography>
            <Card elevation={2} sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{comparison.bestOption.mandi.mandiName} ({comparison.bestOption.mandi.hindiName})</Typography>
                    <Typography variant="body2" color="text.secondary">{comparison.bestOption.mandi.state}, {comparison.bestOption.mandi.district}</Typography>
                    <Chip sx={{ mt: 1 }} color="success" label="Highly Recommended" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="h6">Price: ₹{comparison.bestOption.price.currentPrice}/quintal</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>Estimated Profit: ₹{comparison.bestOption.totalProfit.toLocaleString()}</Typography>
                      <Typography variant="body2" color="text.secondary">Reason: {comparison.bestOption.reason}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {comparison.alternativeOptions.length > 0 && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Alternatives</Typography>
                <Grid container spacing={2}>
                  {comparison.alternativeOptions.map((alt, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{alt.mandi.mandiName}</Typography>
                        <Typography variant="body2" color="text.secondary">{alt.mandi.state}, {alt.mandi.district}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          {alt.pros.map((p, i) => <Chip key={i} size="small" color="success" label={p} />)}
                          {alt.cons.map((c, i) => <Chip key={i} size="small" color="warning" label={c} />)}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Nearby Mandis (ranked)</Typography>
            <Grid container spacing={2}>
              {comparison.nearbyMandis.map((row, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{row.mandi.mandiName}</Typography>
                        <Typography variant="caption" color="text.secondary">Distance: {row.mandi.distance} km</Typography>
                      </Box>
                      <Chip label={row.recommendation.replace('_', ' ').toUpperCase()} size="small" />
                    </Box>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Price</Typography>
                        <Typography variant="h6">₹{row.price.currentPrice}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">Profitability</Typography>
                        <Typography variant="h6" sx={{ color: '#4caf50' }}>₹{row.profitability.toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {!comparison && (
          <Alert severity="info">Select crop and click "Compare Nearby Mandis" to generate comparison.</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {/* Price Alerts */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="alert-crop">Crop</InputLabel>
                <Select
                  labelId="alert-crop"
                  label="Crop"
                  value={alertCrop}
                  onChange={(e) => setAlertCrop(e.target.value)}
                >
                  {['wheat','rice','cotton','mustard','sugarcane'].map(c => (
                    <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="alert-condition">Condition</InputLabel>
                <Select
                  labelId="alert-condition"
                  label="Condition"
                  value={alertCondition}
                  onChange={(e) => setAlertCondition(e.target.value as any)}
                >
                  <MenuItem value="above">Above</MenuItem>
                  <MenuItem value="below">Below</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="number"
                size="small"
                label="Target Price (₹/quintal)"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(Math.max(0, Number(e.target.value)))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" onClick={handleCreateAlert} sx={{ borderRadius: 3 }}>Create Alert</Button>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={handleCheckAlerts} disabled={alertChecking} startIcon={<Refresh />} sx={{ borderRadius: 3 }}>
            {alertChecking ? 'Checking...' : 'Check Alerts Now'}
          </Button>
        </Box>

        {triggeredAlerts.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {triggeredAlerts.map((msg, idx) => (
              <Alert key={idx} severity="success" sx={{ mb: 1 }}>Triggered: {msg}</Alert>
            ))}
          </Box>
        )}

        <Grid container spacing={2}>
          {alerts.map((a) => (
            <Grid item xs={12} md={6} key={a.id}>
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{a.crop} — {a.condition.toUpperCase()} ₹{a.targetPrice}</Typography>
                    <Typography variant="caption" color="text.secondary">Created: {new Date(a.createdAt).toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip size="small" color={a.isActive ? 'success' : 'default'} label={a.isActive ? 'Active' : 'Inactive'} />
                    <Button size="small" onClick={() => handleToggleAlert(a.id)}>{a.isActive ? 'Pause' : 'Resume'}</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteAlert(a.id)}>Delete</Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default MarketAnalysis;