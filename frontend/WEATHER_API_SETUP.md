# Weather API Setup Instructions

The WeatherForecast component uses real weather data from OpenWeatherMap API. Follow these steps to set it up:

## 1. Get OpenWeatherMap API Key (Free)

1. Go to [https://openweathermap.org/api](https://openweathermap.org/api)
2. Click "Sign Up" and create a free account
3. After signing up, go to your API keys section
4. Copy your API key

## 2. Configure Environment Variables

1. Open the `.env` file in the frontend directory
2. Replace the empty value with your API key:
   ```
   REACT_APP_OPENWEATHER_API_KEY=your_actual_api_key_here
   ```

## 3. Optional: Get OpenCage Geocoding API Key

For better location name resolution:

1. Go to [https://opencagedata.com/api](https://opencagedata.com/api)
2. Sign up for a free account (2,500 requests/day)
3. Get your API key
4. Add it to `.env`:
   ```
   REACT_APP_OPENCAGE_API_KEY=your_geocoding_api_key_here
   ```

## 4. Restart the Application

After adding the API keys, restart the React development server:

```bash
npm start
```

## Demo Mode

If no API keys are configured, the app will run in demo mode with mock weather data. This is perfect for development and testing!

## Features

- **Current Weather**: Temperature, humidity, wind speed, pressure, etc.
- **5-Day Forecast**: Daily weather predictions
- **Farming Conditions**: Irrigation, spraying, harvest, and planting recommendations
- **Location Detection**: Automatic GPS-based location detection
- **Fallback Support**: IP-based location detection if GPS fails

## Troubleshooting

- **"Weather API failed"**: Check your API key is correct and active
- **"Location Error"**: Allow location permissions in your browser
- **Demo data showing**: API keys are not configured - this is normal for development

## API Limits

- **OpenWeatherMap Free**: 1,000 calls/day, 60 calls/minute
- **OpenCage Free**: 2,500 requests/day

These limits are more than sufficient for development and small-scale production use.