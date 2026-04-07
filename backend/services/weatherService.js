const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'f0ee189e8fc575d580eec8764caee056';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  // Get 7-day weather forecast
  async getForecast(latitude, longitude) {
    try {
      const response = await axios.get(`${this.baseUrl}/onecall`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: 'metric',
          exclude: 'minutely,hourly,alerts'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Weather API error:', error.message);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  // Check if rain is predicted in next N days
  async checkRainPrediction(latitude, longitude, days = 4, threshold = 2.5) {
    try {
      const forecast = await this.getForecast(latitude, longitude);
      const dailyForecasts = forecast.daily.slice(0, days);

      const rainPredictions = [];

      for (let i = 0; i < dailyForecasts.length; i++) {
        const day = dailyForecasts[i];
        const date = new Date(day.dt * 1000);
        
        // Check for rain in weather conditions
        const hasRain = day.weather.some(weather => 
          weather.main.toLowerCase().includes('rain') || 
          weather.description.toLowerCase().includes('rain')
        );

        // Check rain volume (if available)
        const rainVolume = day.rain ? (day.rain['1h'] || day.rain['3h'] || 0) : 0;
        
        // Check precipitation probability
        const precipitationProb = day.pop || 0; // Probability of precipitation

        if (hasRain || rainVolume >= threshold || precipitationProb >= 0.3) {
          rainPredictions.push({
            date: date,
            dayIndex: i,
            daysFromNow: i + 1,
            rainVolume: rainVolume,
            precipitationProbability: precipitationProb * 100,
            weatherDescription: day.weather[0].description,
            temperature: {
              min: day.temp.min,
              max: day.temp.max
            },
            humidity: day.humidity,
            windSpeed: day.wind_speed
          });
        }
      }

      return {
        hasRainPrediction: rainPredictions.length > 0,
        predictions: rainPredictions,
        location: {
          lat: latitude,
          lon: longitude
        },
        checkedDays: days,
        threshold: threshold
      };
    } catch (error) {
      console.error('Rain prediction check error:', error.message);
      throw error;
    }
  }

  // Get weather alerts for specific location
  async getWeatherAlerts(latitude, longitude) {
    try {
      const forecast = await this.getForecast(latitude, longitude);
      return forecast.alerts || [];
    } catch (error) {
      console.error('Weather alerts error:', error.message);
      return [];
    }
  }

  // Get current weather
  async getCurrentWeather(latitude, longitude) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Current weather error:', error.message);
      throw error;
    }
  }

  // Format rain alert message for farmers
  formatRainAlertMessage(predictions, location, language = 'both') {
    if (!predictions.length) return null;

    const messages = {
      hindi: [],
      english: []
    };

    // Hindi message
    messages.hindi.push(`🌧️ बारिश की चेतावनी - ${location.name || 'आपके क्षेत्र में'}`);
    messages.hindi.push('');
    
    predictions.forEach(pred => {
      const dateStr = pred.date.toLocaleDateString('hi-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      messages.hindi.push(`📅 ${dateStr} (${pred.daysFromNow} दिन बाद)`);
      messages.hindi.push(`☔ बारिश की संभावना: ${Math.round(pred.precipitationProbability)}%`);
      if (pred.rainVolume > 0) {
        messages.hindi.push(`🌧️ अनुमानित वर्षा: ${pred.rainVolume.toFixed(1)} मिमी`);
      }
      messages.hindi.push(`🌡️ तापमान: ${Math.round(pred.temperature.min)}°C - ${Math.round(pred.temperature.max)}°C`);
      messages.hindi.push('');
    });

    messages.hindi.push('🚜 सुझाव:');
    messages.hindi.push('• फसल की सुरक्षा के लिए तैयारी करें');
    messages.hindi.push('• खेत में जल निकासी की व्यवस्था देखें');
    messages.hindi.push('• कटाई के लिए तैयार फसल को सुरक्षित करें');

    // English message
    messages.english.push(`🌧️ Rain Alert - ${location.name || 'Your Area'}`);
    messages.english.push('');
    
    predictions.forEach(pred => {
      const dateStr = pred.date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      messages.english.push(`📅 ${dateStr} (in ${pred.daysFromNow} days)`);
      messages.english.push(`☔ Rain Probability: ${Math.round(pred.precipitationProbability)}%`);
      if (pred.rainVolume > 0) {
        messages.english.push(`🌧️ Expected Rainfall: ${pred.rainVolume.toFixed(1)} mm`);
      }
      messages.english.push(`🌡️ Temperature: ${Math.round(pred.temperature.min)}°C - ${Math.round(pred.temperature.max)}°C`);
      messages.english.push('');
    });

    messages.english.push('🚜 Suggestions:');
    messages.english.push('• Prepare crop protection measures');
    messages.english.push('• Check field drainage systems');
    messages.english.push('• Secure ready-to-harvest crops');

    // Return message based on language preference
    switch (language) {
      case 'hindi':
        return messages.hindi.join('\n');
      case 'english':
        return messages.english.join('\n');
      case 'both':
      default:
        return messages.hindi.join('\n') + '\n\n' + '---' + '\n\n' + messages.english.join('\n');
    }
  }
}

module.exports = new WeatherService();