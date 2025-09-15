"""
Location and Weather service for Kisan GPT
Handles location detection, reverse geocoding, and weather data fetching
"""

import asyncio
import aiohttp
import requests
from typing import Dict, Any, Optional, Tuple
from loguru import logger
import geocoder
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

from app.core.config import settings, DISTRICT_SOIL_MAPPING


class LocationService:
    """Service for location detection and reverse geocoding"""
    
    def __init__(self):
        self.geolocator = Nominatim(user_agent="kisan-gpt")
        self.timeout = settings.GEOCODING_API_TIMEOUT
    
    async def detect_location_from_ip(self, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """
        Detect location from IP address
        
        Args:
            ip_address: Optional IP address, if None uses current IP
            
        Returns:
            Dict with location information
        """
        try:
            # Use geocoder library for IP-based location
            if ip_address:
                g = geocoder.ip(ip_address)
            else:
                g = geocoder.ip('me')  # Current IP
            
            if g.ok:
                return {
                    'latitude': g.latlng[0] if g.latlng else None,
                    'longitude': g.latlng[1] if g.latlng else None,
                    'city': g.city,
                    'state': g.state,
                    'country': g.country,
                    'address': g.address,
                    'method': 'ip_geolocation'
                }
            else:
                logger.warning(f"IP geolocation failed: {g.status}")
                return self._get_default_location()
                
        except Exception as e:
            logger.error(f"IP location detection error: {e}")
            return self._get_default_location()
    
    async def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Get address information from GPS coordinates
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude
            
        Returns:
            Dict with address information
        """
        try:
            # Use geopy for reverse geocoding
            location = await asyncio.to_thread(
                self.geolocator.reverse, 
                f"{latitude}, {longitude}",
                timeout=self.timeout
            )
            
            if location:
                address = location.raw.get('address', {})
                
                return {
                    'latitude': latitude,
                    'longitude': longitude,
                    'address': location.address,
                    'city': address.get('city') or address.get('town') or address.get('village'),
                    'district': address.get('state_district') or address.get('county'),
                    'state': address.get('state'),
                    'country': address.get('country'),
                    'postcode': address.get('postcode'),
                    'method': 'reverse_geocoding'
                }
            else:
                return self._get_default_location()
                
        except GeocoderTimedOut:
            logger.warning("Reverse geocoding timeout")
            return self._get_default_location()
        except Exception as e:
            logger.error(f"Reverse geocoding error: {e}")
            return self._get_default_location()
    
    def get_district_info(self, district_name: str) -> Dict[str, Any]:
        """
        Get district information including soil type and agro zone
        
        Args:
            district_name: Name of the district
            
        Returns:
            Dict with district information
        """
        try:
            # Normalize district name
            district_key = district_name.lower().strip()
            
            # Look up in our district mapping
            district_info = DISTRICT_SOIL_MAPPING.get(district_key)
            
            if district_info:
                return {
                    'district': district_name,
                    'soil_type': district_info['soil_type'],
                    'agro_zone': district_info['agro_zone'],
                    'found': True
                }
            else:
                # Default fallback for unknown districts
                logger.warning(f"District not found in mapping: {district_name}")
                return {
                    'district': district_name,
                    'soil_type': 'mixed_soil',  # Default soil type
                    'agro_zone': 'unknown_zone',
                    'found': False
                }
                
        except Exception as e:
            logger.error(f"District info lookup error: {e}")
            return {
                'district': district_name,
                'soil_type': 'mixed_soil',
                'agro_zone': 'unknown_zone',
                'found': False
            }
    
    def _get_default_location(self) -> Dict[str, Any]:
        """Return default location (Pune) when detection fails"""
        return {
            'latitude': 18.5204,
            'longitude': 73.8567,
            'city': 'Pune',
            'district': 'Pune',
            'state': 'Maharashtra',
            'country': 'India',
            'method': 'default_fallback'
        }


class WeatherService:
    """Service for weather data fetching from OpenWeatherMap"""
    
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        self.base_url = "http://api.openweathermap.org/data/2.5"
        self.timeout = settings.WEATHER_API_TIMEOUT
    
    async def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Get current weather data
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude
            
        Returns:
            Dict with current weather information
        """
        try:
            if not self.api_key:
                logger.warning("OpenWeatherMap API key not configured")
                return self._get_mock_weather()
            
            url = f"{self.base_url}/weather"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': 'metric'  # Celsius
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_current_weather(data)
                    else:
                        logger.error(f"Weather API error: {response.status}")
                        return self._get_mock_weather()
                        
        except asyncio.TimeoutError:
            logger.warning("Weather API timeout")
            return self._get_mock_weather()
        except Exception as e:
            logger.error(f"Weather fetch error: {e}")
            return self._get_mock_weather()
    
    async def get_weather_forecast(self, latitude: float, longitude: float, days: int = 7) -> list:
        """
        Get weather forecast
        
        Args:
            latitude: GPS latitude
            longitude: GPS longitude
            days: Number of days to forecast
            
        Returns:
            List of daily weather forecasts
        """
        try:
            if not self.api_key:
                logger.warning("OpenWeatherMap API key not configured")
                return self._get_mock_forecast(days)
            
            url = f"{self.base_url}/forecast"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': min(days * 8, 40)  # API returns 3-hour intervals, max 40 calls
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_forecast(data, days)
                    else:
                        logger.error(f"Forecast API error: {response.status}")
                        return self._get_mock_forecast(days)
                        
        except asyncio.TimeoutError:
            logger.warning("Forecast API timeout")
            return self._get_mock_forecast(days)
        except Exception as e:
            logger.error(f"Forecast fetch error: {e}")
            return self._get_mock_forecast(days)
    
    def _parse_current_weather(self, data: dict) -> Dict[str, Any]:
        """Parse OpenWeatherMap current weather response"""
        try:
            main = data.get('main', {})
            weather = data.get('weather', [{}])[0]
            wind = data.get('wind', {})
            
            return {
                'temperature': main.get('temp', 0),
                'feels_like': main.get('feels_like', 0),
                'humidity': main.get('humidity', 0),
                'pressure': main.get('pressure', 0),
                'description': weather.get('description', '').title(),
                'main': weather.get('main', ''),
                'icon': weather.get('icon', ''),
                'wind_speed': wind.get('speed', 0),
                'wind_direction': wind.get('deg', 0),
                'visibility': data.get('visibility', 0) / 1000,  # Convert to km
                'cloudiness': data.get('clouds', {}).get('all', 0),
                'sunrise': data.get('sys', {}).get('sunrise', 0),
                'sunset': data.get('sys', {}).get('sunset', 0),
                'source': 'openweathermap'
            }
            
        except Exception as e:
            logger.error(f"Weather parsing error: {e}")
            return self._get_mock_weather()
    
    def _parse_forecast(self, data: dict, days: int) -> list:
        """Parse OpenWeatherMap forecast response"""
        try:
            forecast_list = data.get('list', [])
            daily_forecasts = []
            
            # Group by day and get daily summary
            current_day = None
            day_data = []
            
            for item in forecast_list[:days * 8]:  # Limit to requested days
                dt = item.get('dt', 0)
                date = dt if dt else 0
                
                # Simple daily grouping (in real implementation, use proper date handling)
                day = date // 86400  # Convert to day number
                
                if current_day != day:
                    if day_data:
                        daily_forecasts.append(self._aggregate_daily_forecast(day_data))
                    current_day = day
                    day_data = [item]
                else:
                    day_data.append(item)
            
            # Add last day
            if day_data:
                daily_forecasts.append(self._aggregate_daily_forecast(day_data))
            
            return daily_forecasts[:days]
            
        except Exception as e:
            logger.error(f"Forecast parsing error: {e}")
            return self._get_mock_forecast(days)
    
    def _aggregate_daily_forecast(self, day_data: list) -> Dict[str, Any]:
        """Aggregate 3-hourly forecasts into daily summary"""
        try:
            temps = [item['main']['temp'] for item in day_data if 'main' in item]
            humidity = [item['main']['humidity'] for item in day_data if 'main' in item]
            descriptions = [item['weather'][0]['description'] for item in day_data if 'weather' in item and item['weather']]
            
            return {
                'date': day_data[0].get('dt_txt', '')[:10] if day_data else '',
                'temp_min': min(temps) if temps else 20,
                'temp_max': max(temps) if temps else 30,
                'temp_avg': sum(temps) / len(temps) if temps else 25,
                'humidity_avg': sum(humidity) / len(humidity) if humidity else 60,
                'description': descriptions[0] if descriptions else 'Partly Cloudy',
                'rainfall': sum([item.get('rain', {}).get('3h', 0) for item in day_data]),
                'source': 'openweathermap'
            }
            
        except Exception as e:
            logger.error(f"Daily aggregation error: {e}")
            return {
                'date': '',
                'temp_min': 20,
                'temp_max': 30,
                'temp_avg': 25,
                'humidity_avg': 60,
                'description': 'Partly Cloudy',
                'rainfall': 0,
                'source': 'mock'
            }
    
    def _get_mock_weather(self) -> Dict[str, Any]:
        """Return mock weather data when API is unavailable"""
        return {
            'temperature': 28.5,
            'feels_like': 31.2,
            'humidity': 65,
            'pressure': 1013,
            'description': 'Partly Cloudy',
            'main': 'Clouds',
            'icon': '02d',
            'wind_speed': 3.2,
            'wind_direction': 180,
            'visibility': 10,
            'cloudiness': 40,
            'sunrise': 1643875200,
            'sunset': 1643917800,
            'source': 'mock_data'
        }
    
    def _get_mock_forecast(self, days: int) -> list:
        """Return mock forecast data when API is unavailable"""
        forecasts = []
        base_temp = 25
        
        for i in range(days):
            forecasts.append({
                'date': f'2024-01-{15+i:02d}',
                'temp_min': base_temp + i - 2,
                'temp_max': base_temp + i + 5,
                'temp_avg': base_temp + i + 1.5,
                'humidity_avg': 60 + (i * 2),
                'description': ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][i % 4],
                'rainfall': [0, 0, 0, 2.5][i % 4],
                'source': 'mock_data'
            })
        
        return forecasts
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if weather service is healthy"""
        try:
            if not self.api_key:
                return {
                    "status": "warning",
                    "message": "No API key configured, using mock data",
                    "service": "WeatherService"
                }
            
            # Test API call
            url = f"{self.base_url}/weather"
            params = {
                'lat': 18.5204,
                'lon': 73.8567,
                'appid': self.api_key
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        return {
                            "status": "healthy",
                            "service": "WeatherService",
                            "api_connected": True
                        }
                    else:
                        return {
                            "status": "unhealthy",
                            "message": f"API error: {response.status}",
                            "service": "WeatherService"
                        }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "WeatherService"
            }