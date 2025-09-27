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
  ButtonGroup,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
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
  Delete,
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

interface HourlyPoint {
  time: string; // e.g., '09:00'
  temp: number; // in °C (metric internal)
  pop: number; // precipitation probability in %
  wind_kmh: number; // wind speed in km/h
}

interface HourlyBlock {
  title: string; // 'Today' | 'Tomorrow'
  points: HourlyPoint[];
}

interface SavedFarmLocation {
  name: string;
  lat: number;
  lon: number;
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
  const [advisories, setAdvisories] = useState<string[]>([]);
  const [units, setUnits] = useState<'metric' | 'imperial'>(() =>
    localStorage.getItem('weather_units') === 'imperial' ? 'imperial' : 'metric'
  );
  const [hourlyBlocks, setHourlyBlocks] = useState<HourlyBlock[]>([]);
  const [crop, setCrop] = useState<string>(() => localStorage.getItem('selected_crop') || 'General');
  const [savedLocations, setSavedLocations] = useState<SavedFarmLocation[]>(() => {
    try {
      const raw = localStorage.getItem('saved_farm_locations');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedSavedName, setSelectedSavedName] = useState<string>('');

useEffect(() => {
    let hasInitialized = false;
    
    // Try to use last known coordinates immediately for faster first paint
    try {
      const raw = localStorage.getItem('last_weather_coords');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
          setCoordinates({ lat: parsed.lat, lon: parsed.lon });
          if (parsed.name) setLocation(parsed.name);
          // Kick off a fetch optimistically with last-known coords
          fetchWeatherData(parsed.lat, parsed.lon, parsed.name || undefined);
          hasInitialized = true;
        }
      }
    } catch {}

    // Only get fresh geolocation if we don't have cached data
    if (!hasInitialized) {
      getCurrentLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist units preference
  useEffect(() => {
    try {
      localStorage.setItem('weather_units', units);
    } catch (e) {
      // ignore storage errors
    }
  }, [units]);

  // Persist crop selection
  useEffect(() => {
    try {
      localStorage.setItem('selected_crop', crop);
    } catch {}
  }, [crop]);

  // Persist saved locations whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('saved_farm_locations', JSON.stringify(savedLocations));
    } catch {}
  }, [savedLocations]);

const getCurrentLocation = () => {
    // Don't set loading to true if we already have weather data
    if (!currentWeather) {
      setLoading(true);
    }
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      // Fallback to default location (Delhi)
      setLocation('Delhi, India');
      setCoordinates({ lat: 28.6139, lon: 77.2090 });
      try { localStorage.setItem('last_weather_coords', JSON.stringify({ lat: 28.6139, lon: 77.2090, name: 'Delhi, India' })); } catch {}
      fetchWeatherData(28.6139, 77.2090, 'Delhi, India');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    // Safety fallback: if geolocation is slow or blocked, show default data after a short delay
    const fallbackTimer = window.setTimeout(() => {
      if (!currentWeather) {
        setLocation('Delhi, India');
        setCoordinates({ lat: 28.6139, lon: 77.2090 });
        try { localStorage.setItem('last_weather_coords', JSON.stringify({ lat: 28.6139, lon: 77.2090, name: 'Delhi, India' })); } catch {}
        fetchWeatherData(28.6139, 77.2090, 'Delhi, India');
      }
    }, 4000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        window.clearTimeout(fallbackTimer);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          // Reverse geocoding to get location name
          const locationName = await reverseGeocode(lat, lon);
          
          setCoordinates({ lat, lon });
          setLocation(locationName);
          try { localStorage.setItem('last_weather_coords', JSON.stringify({ lat, lon, name: locationName })); } catch {}
          fetchWeatherData(lat, lon, locationName);
        } catch (error) {
          console.error('Error getting location name:', error);
          const fallbackName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
          setCoordinates({ lat, lon });
          setLocation(fallbackName);
          try { localStorage.setItem('last_weather_coords', JSON.stringify({ lat, lon, name: fallbackName })); } catch {}
          fetchWeatherData(lat, lon, fallbackName);
        }
      },
      (error) => {
        window.clearTimeout(fallbackTimer);
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
        try { localStorage.setItem('last_weather_coords', JSON.stringify({ lat: 28.6139, lon: 77.2090, name: 'Delhi, India' })); } catch {}
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

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getCacheKey = (lat: number, lon: number) => `weather_cache_${lat.toFixed(3)}_${lon.toFixed(3)}`;

const fetchWeatherData = async (lat?: number, lon?: number, locationName?: string, options?: { force?: boolean }) => {
    const currentLat = lat || coordinates.lat;
    const currentLon = lon || coordinates.lon;
    const currentLocation = locationName || location;
    
    // Only show loading if we don't already have weather data (for better UX)
    if (!currentWeather || options?.force) {
      setLoading(true);
    }
    setError(''); // Clear previous errors
    
    try {
      // Try cache first unless forced
      if (!options?.force) {
        try {
          const cacheKey = getCacheKey(currentLat, currentLon);
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
              setCurrentWeather(parsed.currentWeather);
              setForecast(parsed.forecast);
              setFarmingConditions(parsed.farmingConditions);
              setAdvisories(parsed.advisories || []);
              setHourlyBlocks(parsed.hourlyBlocks || []);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          // ignore cache errors
        }
      }
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

        setAdvisories([
          'Using demo data. Some alerts may be approximations.',
          'Light rain chance. Plan irrigation accordingly if needed.'
        ]);
        
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

        // Mock hourly blocks (next 24h and following 24h)
        setHourlyBlocks([
          {
            title: 'Today',
            points: Array.from({ length: 8 }).map((_, i) => ({
              time: `${(3 * i).toString().padStart(2, '0')}:00`,
              temp: 26 + (i % 3),
              pop: [10, 20, 30, 25, 15, 10, 20, 30][i],
              wind_kmh: 8 + i,
            })),
          },
          {
            title: 'Tomorrow',
            points: Array.from({ length: 8 }).map((_, i) => ({
              time: `${(3 * i).toString().padStart(2, '0')}:00`,
              temp: 27 + ((i + 1) % 3),
              pop: [15, 25, 35, 20, 10, 15, 25, 35][i],
              wind_kmh: 10 + i,
            })),
          },
        ]);

        // Cache demo data
        try {
          const cacheKey = getCacheKey(currentLat, currentLon);
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              currentWeather: {
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
              },
              forecast: [
                { date: 'Today', temperature: 28, description: 'partly cloudy', icon: 'partly-cloudy', precipitation: 20 },
                { date: 'Tomorrow', temperature: 30, description: 'sunny', icon: 'sunny', precipitation: 10 },
                { date: 'Thu', temperature: 26, description: 'cloudy', icon: 'cloudy', precipitation: 40 },
                { date: 'Fri', temperature: 29, description: 'partly cloudy', icon: 'partly-cloudy', precipitation: 15 },
                { date: 'Sat', temperature: 31, description: 'sunny', icon: 'sunny', precipitation: 5 }
              ],
              hourlyBlocks: [
                {
                  title: 'Today',
                  points: Array.from({ length: 8 }).map((_, i) => ({
                    time: `${(3 * i).toString().padStart(2, '0')}:00`,
                    temp: 26 + (i % 3),
                    pop: [10, 20, 30, 25, 15, 10, 20, 30][i],
                    wind_kmh: 8 + i,
                  })),
                },
                {
                  title: 'Tomorrow',
                  points: Array.from({ length: 8 }).map((_, i) => ({
                    time: `${(3 * i).toString().padStart(2, '0')}:00`,
                    temp: 27 + ((i + 1) % 3),
                    pop: [15, 25, 35, 20, 10, 15, 25, 35][i],
                    wind_kmh: 10 + i,
                  })),
                },
              ],
              farmingConditions: {
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
              },
              advisories: [
                'Using demo data. Some alerts may be approximations.',
                'Light rain chance. Plan irrigation accordingly if needed.'
              ]
            })
          );
        } catch (e) {
          // ignore cache errors
        }
        
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
          const dailyForecasts: ForecastData[] = [];
          
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

          // Hourly blocks for today and tomorrow
          const list: any[] = Array.isArray(forecastData.list) ? forecastData.list : [];
          const block1 = list.slice(0, 8);
          const block2 = list.slice(8, 16);
          const mapToPoints = (arr: any[]): HourlyPoint[] =>
            arr.map((item: any) => ({
              time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              temp: Math.round(item.main?.temp ?? 0),
              pop: Math.round(((item.pop ?? 0) * 100)),
              wind_kmh: Math.round(((item.wind?.speed ?? 0) * 3.6)),
            }));
          const hb: HourlyBlock[] = [
            { title: 'Today', points: mapToPoints(block1) },
            { title: 'Tomorrow', points: mapToPoints(block2) },
          ];
          setHourlyBlocks(hb);

          // Compute advisories
          const next24List = Array.isArray(forecastData.list) ? forecastData.list.slice(0, 8) : [];
          const maxPopNext24 = next24List.length > 0 ? Math.round(Math.max(...next24List.map((i: any) => ((i.pop || 0) * 100)))) : 0;
          const windKmh = Math.round((weatherData.wind?.speed || 0) * 3.6);
          const tempC = Math.round(weatherData.main?.temp || 0);
          const feelsC = Math.round(weatherData.main?.feels_like || 0);
          const newAdvisories: string[] = [];
          if (maxPopNext24 >= 60) {
            newAdvisories.push(`High chance of rain in next 24h (${maxPopNext24}%). Avoid spraying and plan irrigation accordingly.`);
          } else if (maxPopNext24 >= 30) {
            newAdvisories.push(`Possible rain in next 24h (${maxPopNext24}%). Consider irrigation scheduling and protect harvested produce.`);
          }
          if (windKmh >= 20) {
            newAdvisories.push('Windy conditions — avoid spraying and secure lightweight materials.');
          }
          if (tempC >= 38 || feelsC >= 40) {
            newAdvisories.push('Heat alert — schedule field work early morning/evening and ensure irrigation for sensitive crops.');
          }

          // Crop-specific advisories
          const cropThresholds: Record<string, { maxSprayWindKmh: number; maxSprayRainPopPct: number; heatStressC: number; irrigationHumidityMinPct: number; }> = {
            General: { maxSprayWindKmh: 15, maxSprayRainPopPct: 40, heatStressC: 38, irrigationHumidityMinPct: 55 },
            Wheat: { maxSprayWindKmh: 12, maxSprayRainPopPct: 30, heatStressC: 34, irrigationHumidityMinPct: 50 },
            Rice: { maxSprayWindKmh: 15, maxSprayRainPopPct: 50, heatStressC: 36, irrigationHumidityMinPct: 60 },
            Cotton: { maxSprayWindKmh: 15, maxSprayRainPopPct: 40, heatStressC: 37, irrigationHumidityMinPct: 55 },
            Maize: { maxSprayWindKmh: 18, maxSprayRainPopPct: 40, heatStressC: 36, irrigationHumidityMinPct: 50 },
            Soybean: { maxSprayWindKmh: 15, maxSprayRainPopPct: 40, heatStressC: 35, irrigationHumidityMinPct: 55 },
          };
          const th = cropThresholds[crop] || cropThresholds.General;
          if (windKmh > th.maxSprayWindKmh) {
            newAdvisories.push(`${crop}: Avoid spraying (wind > ${th.maxSprayWindKmh} km/h).`);
          }
          if (maxPopNext24 > th.maxSprayRainPopPct) {
            newAdvisories.push(`${crop}: Rain likely — defer spraying (POP > ${th.maxSprayRainPopPct}%).`);
          }
          if (tempC >= th.heatStressC) {
            newAdvisories.push(`${crop}: Heat stress risk — consider shade/mulch and irrigate during cool hours.`);
          }
          if ((weatherData.main?.humidity ?? 0) < th.irrigationHumidityMinPct && maxPopNext24 < 30) {
            newAdvisories.push(`${crop}: Irrigation recommended — humidity < ${th.irrigationHumidityMinPct}% and low rain chance.`);
          }

          setAdvisories(newAdvisories);
          
          setForecast(dailyForecasts);

          // Cache fresh data
          try {
            const cacheKey = getCacheKey(currentLat, currentLon);
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                timestamp: Date.now(),
                currentWeather: {
                  location: currentLocation,
                  temperature: Math.round(weatherData.main.temp),
                  humidity: weatherData.main.humidity,
                  wind_speed: Math.round(weatherData.wind.speed * 3.6),
                  description: weatherData.weather[0].description,
                  icon: weatherData.weather[0].icon,
                  feels_like: Math.round(weatherData.main.feels_like),
                  pressure: weatherData.main.pressure,
                  visibility: Math.round((weatherData.visibility || 10000) / 1000),
                  uv_index: 0
                },
                forecast: dailyForecasts,
                hourlyBlocks: hb,
                farmingConditions: (function() {
                  // Use latest in state if available; else simple derived fallback
                  return (typeof farmingConditions === 'object' && farmingConditions) ? farmingConditions : {
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
                  } as FarmingConditions;
                })(),
                advisories: newAdvisories
              })
            );
          } catch (e) {
            // ignore cache errors
          }
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
      setAdvisories(['Weather data unavailable — showing default recommendations.']);
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

  // If coordinates become available and we still have no data, fetch once automatically
  useEffect(() => {
    if (!loading && !currentWeather && coordinates.lat && coordinates.lon) {
      fetchWeatherData(coordinates.lat, coordinates.lon, location);
    }
  }, [coordinates.lat, coordinates.lon]);

// Refresh handler
  const handleRefresh = () => {
    if (coordinates.lat && coordinates.lon) {
      fetchWeatherData(coordinates.lat, coordinates.lon, location, { force: true });
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

const getConditionColor = (condition?: string) => {
    const c = (condition || '').toString().toLowerCase().trim();
    switch (c) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#2196f3'; // default info color if unknown/empty
    }
  };

  // Unit formatting helpers (store metric internally; convert for display)
  const toF = (c: number) => Math.round((c * 9) / 5 + 32);
  const kmhToMph = (k: number) => Math.round(k * 0.621371);
  const kmToMiles = (k: number) => Math.round(k * 0.621371);
  const formatTemp = (c: number) => (units === 'metric' ? `${c}°C` : `${toF(c)}°F`);
  const formatWind = (kmh: number) => (units === 'metric' ? `${kmh} km/h` : `${kmhToMph(kmh)} mph`);
  const formatVisibility = (km: number) => (units === 'metric' ? `${km} km` : `${kmToMiles(km)} mi`);

  // Saved farms helpers
  const saveCurrentLocationAsFarm = () => {
    if (!coordinates.lat || !coordinates.lon) return;
    const name = location || `${coordinates.lat.toFixed(2)}, ${coordinates.lon.toFixed(2)}`;
    if (savedLocations.find((f) => f.name === name)) return; // avoid duplicates by name
    setSavedLocations([...savedLocations, { name, lat: coordinates.lat, lon: coordinates.lon }]);
    setSelectedSavedName(name);
  };

  const deleteSelectedFarm = () => {
    if (!selectedSavedName) return;
    const next = savedLocations.filter((f) => f.name !== selectedSavedName);
    setSavedLocations(next);
    setSelectedSavedName('');
  };

  const selectFarmByName = (name: string) => {
    setSelectedSavedName(name);
    const farm = savedLocations.find((f) => f.name === name);
    if (farm) {
      setCoordinates({ lat: farm.lat, lon: farm.lon });
      setLocation(farm.name);
      fetchWeatherData(farm.lat, farm.lon, farm.name, { force: true });
    }
  };

  // Lightweight SVG chart component
  const SVGChart: React.FC<{ points: number[]; width?: number; height?: number; color?: string; min?: number; max?: number }>
    = ({ points, width = 260, height = 80, color = '#2196f3', min, max }) => {
      if (!points || points.length === 0) return null;
      const padding = 6;
      const n = points.length;
      const xStep = (width - padding * 2) / Math.max(1, n - 1);
      const vmin = min !== undefined ? min : Math.min(...points);
      const vmax = max !== undefined ? max : Math.max(...points);
      const rng = vmax - vmin || 1;
      const toY = (v: number) => height - padding - ((v - vmin) / rng) * (height - padding * 2);
      const toX = (i: number) => padding + i * xStep;
      const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p)}`).join(' ');
      return (
        <svg width={width} height={height} role="img" aria-label="chart">
          <path d={path} fill="none" stroke={color} strokeWidth={2} />
        </svg>
      );
    };

  const SVGBar: React.FC<{ points: number[]; width?: number; height?: number; color?: string; max?: number }>
    = ({ points, width = 260, height = 80, color = '#00bcd4', max }) => {
      if (!points || points.length === 0) return null;
      const padding = 6;
      const n = points.length;
      const barW = (width - padding * 2) / n;
      const vmax = max !== undefined ? max : 100;
      return (
        <svg width={width} height={height} role="img" aria-label="bar-chart">
          {points.map((v, i) => {
            const h = Math.max(0, (v / (vmax || 1)) * (height - padding * 2));
            const x = padding + i * barW;
            const y = height - padding - h;
            return <rect key={i} x={x + 1} y={y} width={barW - 2} height={h} fill={color} rx={2} />;
          })}
        </svg>
      );
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
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
            {t('weather.subtitle', 'मौसम की जानकारी और खेती की सलाह')}
          </Typography>

          {/* Saved farm locations controls */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="saved-farm-select-label" sx={{ color: 'white' }}>Saved Farms</InputLabel>
              <Select
                labelId="saved-farm-select-label"
                label="Saved Farms"
                value={selectedSavedName}
                onChange={(e) => selectFarmByName(e.target.value as string)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '& .MuiSvgIcon-root': { color: 'white' },
                }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {savedLocations.map((f) => (
                  <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" color="inherit" onClick={saveCurrentLocationAsFarm} sx={{ borderColor: 'white' }}>
              Save Current Location
            </Button>
            <Tooltip title="Delete selected farm">
              <span>
                <IconButton color="inherit" onClick={deleteSelectedFarm} disabled={!selectedSavedName}>
                  <Delete />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
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

      {/* Dynamic Advisories */}
      {advisories.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {advisories.map((msg, idx) => (
            <Alert key={idx} severity={/heat|alert|high/i.test(msg) ? 'warning' : 'info'} sx={{ mb: 1 }}>
              {msg}
            </Alert>
          ))}
        </Box>
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
<Typography variant="h5" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.primary.main }}>
                    📍 Current Weather
                  </Typography>

                  {/* Units toggle */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <ButtonGroup size="small" variant="outlined">
                      <Button
                        variant={units === 'metric' ? 'contained' : 'outlined'}
                        onClick={() => setUnits('metric')}
                      >
                        °C / km/h
                      </Button>
                      <Button
                        variant={units === 'imperial' ? 'contained' : 'outlined'}
                        onClick={() => setUnits('imperial')}
                      >
                        °F / mph
                      </Button>
                    </ButtonGroup>
                  </Box>
                  
                  {currentWeather && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 60, height: 60 }}>
                          {getWeatherIcon(currentWeather.icon)}
                        </Avatar>
                        <Box>
<Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {formatTemp(currentWeather.temperature)}
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
                              <Typography variant="body1">{formatTemp(currentWeather.feels_like)}</Typography>
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
                              <Typography variant="body1">{formatWind(currentWeather.wind_speed)}</Typography>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
                      🌾 Farming Conditions
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel id="crop-select-label">Crop</InputLabel>
                      <Select
                        labelId="crop-select-label"
                        label="Crop"
                        value={crop}
                        onChange={(e) => setCrop(e.target.value)}
                      >
                        <MenuItem value="General">General</MenuItem>
                        <MenuItem value="Wheat">Wheat</MenuItem>
                        <MenuItem value="Rice">Rice</MenuItem>
                        <MenuItem value="Maize">Maize</MenuItem>
                        <MenuItem value="Soybean">Soybean</MenuItem>
                        <MenuItem value="Cotton">Cotton</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
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

          {/* Hourly Charts (hidden on phones for compact view) */}
          <Grid item xs={12} sx={{ display: { xs: 'none', md: 'block' } }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
                    ⏱️ Hourly Forecast (Next 48h)
                  </Typography>
                  <Grid container spacing={3}>
                    {hourlyBlocks.map((blk, idx) => (
                      <Grid key={idx} item xs={12} md={6}>
                        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{blk.title}</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">Temperature</Typography>
                              <SVGChart points={blk.points.map(p => p.temp)} color="#ff7043" />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                {blk.points.map((p, i) => (
                                  <Typography key={i} variant="caption" color="text.secondary">{p.time.replace(':00','')}</Typography>
                                ))}
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                {blk.points.map((p, i) => (
                                  <Typography key={i} variant="caption">{formatTemp(p.temp)}</Typography>
                                ))}
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">Precipitation chance</Typography>
                              <SVGBar points={blk.points.map(p => p.pop)} color="#03a9f4" />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                {blk.points.map((p, i) => (
                                  <Typography key={i} variant="caption">{p.pop}%</Typography>
                                ))}
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">Wind</Typography>
                              <SVGChart points={blk.points.map(p => p.wind_kmh)} color="#4caf50" />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                {blk.points.map((p, i) => (
                                  <Typography key={i} variant="caption">{formatWind(p.wind_kmh)}</Typography>
                                ))}
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
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
                            {formatTemp(day.temperature)}
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
