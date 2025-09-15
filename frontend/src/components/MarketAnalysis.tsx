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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // In production, these would be actual API calls
      const mockMarketData = await Promise.resolve([
        {
          crop: 'Wheat',
          crop_hindi: 'गेहूं',
          current_price: 2150,
          previous_price: 2080,
          change_percentage: 3.4,
          trend: 'up' as const,
          unit: 'per quintal',
          market: 'Delhi Mandi',
          date: 'Today'
        },
        {
          crop: 'Rice',
          crop_hindi: 'चावल',
          current_price: 4200,
          previous_price: 4350,
          change_percentage: -3.4,
          trend: 'down' as const,
          unit: 'per quintal',
          market: 'Punjab Mandi',
          date: 'Today'
        },
        {
          crop: 'Cotton',
          crop_hindi: 'कपास',
          current_price: 5800,
          previous_price: 5750,
          change_percentage: 0.9,
          trend: 'up' as const,
          unit: 'per quintal',
          market: 'Gujarat Mandi',
          date: 'Today'
        },
        {
          crop: 'Sugarcane',
          crop_hindi: 'गन्ना',
          current_price: 320,
          previous_price: 315,
          change_percentage: 1.6,
          trend: 'up' as const,
          unit: 'per quintal',
          market: 'UP Mandi',
          date: 'Today'
        },
        {
          crop: 'Tomato',
          crop_hindi: 'टमाटर',
          current_price: 1800,
          previous_price: 2200,
          change_percentage: -18.2,
          trend: 'down' as const,
          unit: 'per quintal',
          market: 'Haryana Mandi',
          date: 'Today'
        }
      ]);

      const mockForecasts = await Promise.resolve([
        {
          crop: 'Wheat',
          current_price: 2150,
          predicted_price_1_month: 2280,
          predicted_price_3_months: 2450,
          predicted_price_6_months: 2600,
          confidence_level: 85,
          factors: ['Monsoon forecast positive', 'Export demand increasing', 'Government procurement active']
        },
        {
          crop: 'Rice',
          current_price: 4200,
          predicted_price_1_month: 4100,
          predicted_price_3_months: 4300,
          predicted_price_6_months: 4500,
          confidence_level: 78,
          factors: ['Seasonal price dip', 'Storage costs increasing', 'Festival demand upcoming']
        },
        {
          crop: 'Cotton',
          current_price: 5800,
          predicted_price_1_month: 6000,
          predicted_price_3_months: 6200,
          predicted_price_6_months: 6100,
          confidence_level: 72,
          factors: ['Global cotton prices rising', 'Textile industry recovery', 'Weather conditions favorable']
        }
      ]);

      const mockProfitAnalysis = await Promise.resolve([
        {
          crop: 'Wheat',
          investment_per_hectare: 45000,
          expected_revenue: 86000,
          profit_margin: 41000,
          roi_percentage: 91.1,
          break_even_price: 1125,
          risk_level: 'low' as const
        },
        {
          crop: 'Rice',
          investment_per_hectare: 55000,
          expected_revenue: 168000,
          profit_margin: 113000,
          roi_percentage: 205.5,
          break_even_price: 1375,
          risk_level: 'medium' as const
        },
        {
          crop: 'Cotton',
          investment_per_hectare: 35000,
          expected_revenue: 87000,
          profit_margin: 52000,
          roi_percentage: 148.6,
          break_even_price: 2917,
          risk_level: 'medium' as const
        }
      ]);

      setMarketPrices(mockMarketData);
      setForecasts(mockForecasts);
      setProfitAnalysis(mockProfitAnalysis);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
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
        </Tabs>
      </Paper>

      {/* Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          startIcon={<Refresh />}
          onClick={fetchMarketData}
          disabled={loading}
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Current Market Prices */}
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
                          {price.market}
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
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Profit Analysis */}
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
      </TabPanel>
    </Box>
  );
};

export default MarketAnalysis;