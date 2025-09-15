import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Paper,
  useTheme,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  WbSunny,
  Cloud,
  Umbrella,
  Air,
  Thermostat,
  Opacity,
  Visibility,
  Agriculture,
  CheckCircle,
  LocationOn,
  Update,
  WaterDrop,
  Speed,
  Thunderstorm,
  NightsStay,
  AcUnit,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';

interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  feels_like: number;
  pressure: number;
  visibility: number;
  uv_index: number;
}

interface ForecastData {
  date: string;
  temperature: number;
  description: string;
  icon: string;
  precipitation: number;
}

interface FarmingConditions {
  irrigation_needed: boolean;
  spraying_conditions: string;
  harvest_conditions: string;
  planting_conditions: string;
  overall_score: number;
  recommendations: string[];
}

const WeatherForecast: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [farmingConditions, setFarmingConditions] = useState<FarmingConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('Detecting location...');
  const [coordinates, setCoordinates] = useState({ lat: 0, lon: 0 });
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocation = () => {
    setLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      // Fallback to default location (Delhi)
      setLocation('Delhi, India');
      setCoordinates({ lat: 28.6139, lon: 77.2090 });
      fetchWeatherData(28.6139, 77.2090, 'Delhi, India');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          // Reverse geocoding to get location name
          const locationName = await reverseGeocode(lat, lon);
          
          setCoordinates({ lat, lon });
          setLocation(locationName);
          fetchWeatherData(lat, lon, locationName);
        } catch (error) {
          console.error('Error getting location name:', error);
          setLocation(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
          fetchWeatherData(lat, lon, `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = '';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
            break;
        }
        
        setLocationError(errorMessage);
        // Fallback to default location
        setLocation('Delhi, India');
        setCoordinates({ lat: 28.6139, lon: 77.2090 });
        fetchWeatherData(28.6139, 77.2090, 'Delhi, India');
      },
      options
    );
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      // Using OpenCage Geocoding API (free tier)
      const apiKey = process.env.REACT_APP_OPENCAGE_API_KEY;
      if (!apiKey) {
        throw new Error('OpenCage API key not configured');
      }
      
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}&language=en&pretty=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API failed');
      }
      
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const result = data.results[0];
        const city = result.components.city || result.components.town || result.components.village;
        const state = result.components.state;
        const country = result.components.country;
        
        return `${city ? city + ', ' : ''}${state ? state + ', ' : ''}${country || 'Unknown'}`;
      }
      
      throw new Error('No results found');
    } catch (error) {
      // Fallback: try to get location from IP
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        return `${ipData.city}, ${ipData.region}, ${ipData.country_name}`;
      } catch (ipError) {
        console.error('IP geolocation failed:', ipError);
        throw new Error('Failed to get location name');
      }
    }
  };

  const fetchWeatherData = async (lat?: number, lon?: number, locationName?: string) => {
    const currentLat = lat || coordinates.lat;
    const currentLon = lon || coordinates.lon;
    const currentLocation = locationName || location;
    
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      // Get current weather from OpenWeatherMap API (free) 
      // You can get a free API key from: https://openweathermap.org/api
      const weatherApiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
      
      if (!weatherApiKey || weatherApiKey === 'demo_key') {
        // Use mock data if no API key is configured
        console.warn('No OpenWeatherMap API key configured. Using mock data.');
        setCurrentWeather({
          location: currentLocation,
          temperature: 28,
          humidity: 65,
          wind_speed: 10,
          description: 'partly cloudy',
          icon: '02d',
          feels_like: 31,
          pressure: 1013,
          visibility: 10,
          uv_index: 6
        });
        
        // Set mock farming conditions
        setFarmingConditions({
          irrigation_needed: false,
          spraying_conditions: 'Good',
          harvest_conditions: 'Good',
          planting_conditions: 'Excellent',
          overall_score: 78,
          recommendations: [
            'API key not configured - using demo data',
            'Get your free API key from openweathermap.org',
            'Add REACT_APP_OPENWEATHER_API_KEY to your .env file',
            'Restart the app after adding the API key'
          ]
        });
        
        // Set mock forecast
        setForecast([
          { date: 'Today', temperature: 28, description: 'partly cloudy', icon: 'partly-cloudy', precipitation: 20 },
          { date: 'Tomorrow', temperature: 30, description: 'sunny', icon: 'sunny', precipitation: 10 },
          { date: 'Thu', temperature: 26, description: 'cloudy', icon: 'cloudy', precipitation: 40 },
          { date: 'Fri', temperature: 29, description: 'partly cloudy', icon: 'partly-cloudy', precipitation: 15 },
          { date: 'Sat', temperature: 31, description: 'sunny', icon: 'sunny', precipitation: 5 }
        ]);
        
        setError('Using demo data. Configure REACT_APP_OPENWEATHER_API_KEY for live weather data.');
        return;
      }
      
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${currentLat}&lon=${currentLon}&appid=${weatherApiKey}&units=metric`;
      
      const weatherResponse = await fetch(weatherUrl);
      
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        
        setCurrentWeather({
          location: currentLocation,
          temperature: Math.round(weatherData.main.temp),
          humidity: weatherData.main.humidity,
          wind_speed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          feels_like: Math.round(weatherData.main.feels_like),
          pressure: weatherData.main.pressure,
          visibility: Math.round((weatherData.visibility || 10000) / 1000), // Convert to km
          uv_index: 0 // Would need separate UV API call
        });
        
        // Try to get farming conditions from backend, fallback to mock data
        try {
          const conditionsResponse = await axios.get(`http://localhost:8000/api/location/farming-conditions`, {
            params: {
              lat: currentLat,
              lon: currentLon,
              temperature: weatherData.main.temp,
              humidity: weatherData.main.humidity,
              wind_speed: weatherData.wind.speed
            }
          });
          setFarmingConditions(conditionsResponse.data);
        } catch (conditionsError) {
          console.log('Using mock farming conditions data');
          setFarmingConditions({
            irrigation_needed: weatherData.main.humidity < 60,
            spraying_conditions: weatherData.wind.speed < 3 ? 'Good' : 'Fair',
            harvest_conditions: weatherData.main.temp > 25 && weatherData.main.temp < 35 ? 'Excellent' : 'Good',
            planting_conditions: weatherData.main.temp > 20 && weatherData.main.temp < 30 ? 'Good' : 'Fair',
            overall_score: 85,
            recommendations: [
              weatherData.main.humidity < 50 ? 'Consider irrigation today' : 'Soil moisture looks good',
              weatherData.wind.speed < 3 ? 'Good conditions for spraying' : 'Wait for calmer winds for spraying',
              weatherData.weather[0].main === 'Clear' ? 'Perfect weather for outdoor farm work' : 'Plan indoor activities if needed',
              'Monitor weather changes throughout the day'
            ]
          });
        }
        
        // Get 5-day forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${currentLat}&lon=${currentLon}&appid=${weatherApiKey}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          const dailyForecasts = [];
          
          // Process forecast data (every 3 hours, so take every 8th item for daily)
          for (let i = 0; i < Math.min(5, Math.floor(forecastData.list.length / 8)); i++) {
            const dayData = forecastData.list[i * 8];
            const date = new Date(dayData.dt * 1000);
            
            dailyForecasts.push({
              date: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }),
              temperature: Math.round(dayData.main.temp),
              description: dayData.weather[0].description,
              icon: getWeatherIconType(dayData.weather[0].icon),
              precipitation: Math.round((dayData.pop || 0) * 100)
            });
          }
          
          setForecast(dailyForecasts);
        }
        
      } else {
        throw new Error('Weather API failed');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError(`Error fetching weather data: ${error}`);
      
      // Set fallback mock data in case of error
      setCurrentWeather({
        location: currentLocation,
        temperature: 28,
        humidity: 65,
        wind_speed: 10,
        description: 'partly cloudy',
        icon: '02d',
        feels_like: 31,
        pressure: 1013,
        visibility: 10,
        uv_index: 6
      });
      
      setFarmingConditions({
        irrigation_needed: false,
        spraying_conditions: 'Good',
        harvest_conditions: 'Good',
        planting_conditions: 'Excellent',
        overall_score: 78,
        recommendations: [
          'Weather data unavailable - using default recommendations',
          'Check local weather conditions before outdoor activities',
          'Monitor soil moisture levels',
          'Consider weather apps for more accurate information'
        ]
      });
      
      setForecast([
        { date: 'Today', temperature: 28, description: 'partly cloudy', icon: 'partly-cloudy', precipitation: 20 },
        { date: 'Tomorrow', temperature: 30, description: 'sunny', icon: 'sunny', precipitation: 10 },
        { date: 'Thu', temperature: 26, description: 'cloudy', icon: 'cloudy', precipitation: 40 },
        { date: 'Fri', temperature: 29, description: 'partly cloudy', icon: 'partly-cloudy', precipitation: 15 },
        { date: 'Sat', temperature: 31, description: 'sunny', icon: 'sunny', precipitation: 5 }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to map OpenWeatherMap icons to our icon types
  const getWeatherIconType = (owmIcon: string) => {
    const iconMap: { [key: string]: string } = {
      '01d': 'sunny',
      '01n': 'clear-night',
      '02d': 'partly-cloudy',
      '02n': 'partly-cloudy',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'stormy',
      '11n': 'stormy',
      '13d': 'snowy',
      '13n': 'snowy',
      '50d': 'foggy',
      '50n': 'foggy'
    };
    return iconMap[owmIcon] || 'partly-cloudy';
  };

  // Refresh handler
  const handleRefresh = () => {
    if (coordinates.lat && coordinates.lon) {
      fetchWeatherData(coordinates.lat, coordinates.lon, location);
    } else {
      getCurrentLocation();
    }
  };

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny':
      case 'sun': 
        return <WbSunny sx={{ fontSize: 40, color: '#ff9800' }} />;
      case 'partly-cloudy':
      case 'cloud': 
        return <Cloud sx={{ fontSize: 40, color: '#757575' }} />;
      case 'cloudy': 
        return <Cloud sx={{ fontSize: 40, color: '#9e9e9e' }} />;
      case 'rainy':
      case 'rain': 
        return <Umbrella sx={{ fontSize: 40, color: '#2196f3' }} />;
      case 'stormy': 
        return <Thunderstorm sx={{ fontSize: 40, color: '#9c27b0' }} />;
      case 'snowy': 
        return <AcUnit sx={{ fontSize: 40, color: '#00bcd4' }} />;
      case 'foggy': 
        return <Visibility sx={{ fontSize: 40, color: '#607d8b' }} />;
      case 'clear-night': 
        return <NightsStay sx={{ fontSize: 40, color: '#3f51b5' }} />;
      default: 
        return <WbSunny sx={{ fontSize: 40, color: '#ff9800' }} />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#2196f3';
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
            background: 'linear-gradient(135deg, #2196f3 0%, #03a9f4 50%, #00bcd4 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <WbSunny sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🌤️ {t('weather.title', 'Weather Forecast')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {t('weather.subtitle', 'मौसम की जानकारी और खेती की सलाह')}
          </Typography>
        </Paper>
      </motion.div>

      {/* Error Alerts */}
      {locationError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Location Error: {locationError}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Weather Error: {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading weather data...</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Current Weather */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
                    📍 Current Weather
                  </Typography>
                  
                  {currentWeather && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 60, height: 60 }}>
                          {getWeatherIcon(currentWeather.icon)}
                        </Avatar>
                        <Box>
                          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {currentWeather.temperature}°C
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {currentWeather.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                            {currentWeather.location}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Thermostat sx={{ fontSize: 20, mr: 1, color: '#ff5722' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Feels like</Typography>
                              <Typography variant="body1">{currentWeather.feels_like}°C</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Opacity sx={{ fontSize: 20, mr: 1, color: '#2196f3' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Humidity</Typography>
                              <Typography variant="body1">{currentWeather.humidity}%</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Air sx={{ fontSize: 20, mr: 1, color: '#4caf50' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Wind Speed</Typography>
                              <Typography variant="body1">{currentWeather.wind_speed} km/h</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Speed sx={{ fontSize: 20, mr: 1, color: '#ff9800' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Pressure</Typography>
                              <Typography variant="body1">{currentWeather.pressure} hPa</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>

                      <Button
                        variant="outlined"
                        startIcon={<Update />}
                        onClick={handleRefresh}
                        sx={{ mt: 2, borderRadius: 3 }}
                        fullWidth
                      >
                        Refresh Weather
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Farming Conditions */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
                    🌾 Farming Conditions
                  </Typography>
                  
                  {farmingConditions && (
                    <Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Overall Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={farmingConditions.overall_score}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            mb: 1,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: farmingConditions.overall_score > 80 ? '#4caf50' : farmingConditions.overall_score > 60 ? '#ff9800' : '#f44336',
                            },
                          }}
                        />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: farmingConditions.overall_score > 80 ? '#4caf50' : farmingConditions.overall_score > 60 ? '#ff9800' : '#f44336' }}>
                          {farmingConditions.overall_score}/100
                        </Typography>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Chip
                            icon={farmingConditions.irrigation_needed ? <WaterDrop /> : <CheckCircle />}
                            label={farmingConditions.irrigation_needed ? 'Irrigation Needed' : 'No Irrigation'}
                            color={farmingConditions.irrigation_needed ? 'warning' : 'success'}
                            variant="outlined"
                            sx={{ width: '100%', mb: 1 }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Chip
                            icon={<Agriculture />}
                            label={`Spraying: ${farmingConditions.spraying_conditions}`}
                            sx={{
                              width: '100%',
                              mb: 1,
                              bgcolor: getConditionColor(farmingConditions.spraying_conditions),
                              color: 'white',
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Chip
                            icon={<Agriculture />}
                            label={`Harvest: ${farmingConditions.harvest_conditions}`}
                            sx={{
                              width: '100%',
                              mb: 1,
                              bgcolor: getConditionColor(farmingConditions.harvest_conditions),
                              color: 'white',
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Chip
                            icon={<Agriculture />}
                            label={`Planting: ${farmingConditions.planting_conditions}`}
                            sx={{
                              width: '100%',
                              mb: 1,
                              bgcolor: getConditionColor(farmingConditions.planting_conditions),
                              color: 'white',
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        🌱 Recommendations
                      </Typography>
                      <List dense>
                        {farmingConditions.recommendations.map((recommendation, index) => (
                          <ListItem key={index} sx={{ pl: 0 }}>
                            <ListItemIcon>
                              <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                            </ListItemIcon>
                            <ListItemText primary={recommendation} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 5-Day Forecast */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
                    📅 5-Day Forecast
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {forecast.map((day, index) => (
                      <Grid item xs={12} sm={6} md={2.4} key={index}>
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2,
                            borderRadius: 3,
                            textAlign: 'center',
                            border: index === 0 ? '2px solid' : 'none',
                            borderColor: index === 0 ? theme.palette.primary.main : 'transparent',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {day.date}
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            {getWeatherIcon(day.icon)}
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {day.temperature}°C
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {day.description}
                          </Typography>
                          <Chip
                            icon={<WaterDrop />}
                            label={`${day.precipitation}%`}
                            size="small"
                            color={day.precipitation > 50 ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default WeatherForecast;
