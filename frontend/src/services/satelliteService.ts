import axios from 'axios';

// Types for satellite data
export interface SatelliteCoordinates {
  latitude: number;
  longitude: number;
}

export interface SoilProperties {
  ph: number;
  moisture: number;
  temperature: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  clay_content: number;
  sand_content: number;
  silt_content: number;
  bulk_density: number;
  cation_exchange_capacity: number;
}

export interface VegetationIndices {
  ndvi: number; // Normalized Difference Vegetation Index
  evi: number;  // Enhanced Vegetation Index
  savi: number; // Soil Adjusted Vegetation Index
  gndvi: number; // Green Normalized Difference Vegetation Index
}

export interface LandCoverData {
  landCoverType: string;
  cropType: string;
  irrigation_status: 'irrigated' | 'rainfed' | 'unknown';
  crop_intensity: 'single' | 'double' | 'triple';
  crop_calendar: {
    sowing_month: number;
    harvesting_month: number;
  };
}

export interface SatelliteImagery {
  date: string;
  cloudCover: number;
  resolution: number;
  bands: {
    red: number[];
    green: number[];
    blue: number[];
    nir: number[];
  };
}

export interface WeatherSatelliteData {
  temperature: {
    surface: number;
    air: number;
    max: number;
    min: number;
  };
  precipitation: {
    current: number;
    forecast_7days: number[];
    monthly_average: number;
  };
  humidity: number;
  wind_speed: number;
  solar_radiation: number;
  evapotranspiration: number;
}

export interface SatelliteAnalysisResult {
  coordinates: SatelliteCoordinates;
  timestamp: string;
  soil_properties: SoilProperties;
  vegetation_indices: VegetationIndices;
  land_cover: LandCoverData;
  weather_data: WeatherSatelliteData;
  imagery: SatelliteImagery;
  analysis: {
    crop_health_score: number;
    water_stress_level: 'low' | 'medium' | 'high';
    soil_fertility_index: number;
    growth_stage: string;
    recommendations: string[];
    alerts: string[];
  };
}

class SatelliteService {
  private bhuvanApiKey: string;
  private soilGridsApiUrl: string;
  private sentinelApiKey: string;
  private cache: Map<string, SatelliteAnalysisResult>;
  private cacheExpiration: number = 3600000; // 1 hour in milliseconds

  constructor() {
    this.bhuvanApiKey = process.env.REACT_APP_BHUVAN_API_KEY || 'demo_key';
    this.soilGridsApiUrl = 'https://rest.isric.org';
    this.sentinelApiKey = process.env.REACT_APP_SENTINEL_API_KEY || 'demo_key';
    this.cache = new Map();
  }

  // Generate cache key for coordinates
  private getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  }

  // Check if cached data is still valid
  private isCacheValid(data: SatelliteAnalysisResult): boolean {
    const dataTime = new Date(data.timestamp).getTime();
    const currentTime = Date.now();
    return (currentTime - dataTime) < this.cacheExpiration;
  }

  // Get soil properties from SoilGrids API
  async getSoilProperties(coordinates: SatelliteCoordinates): Promise<SoilProperties> {
    try {
      const { latitude, longitude } = coordinates;
      
      // SoilGrids API endpoints for different soil properties
      const properties = [
        'phh2o',    // pH in H2O
        'soc',      // Soil organic carbon
        'nitrogen', // Total nitrogen
        'bdod',     // Bulk density
        'cec',      // Cation exchange capacity
        'clay',     // Clay content
        'sand',     // Sand content
        'silt'      // Silt content
      ];

      const soilData: any = {};

      // Fetch data for each property
      for (const property of properties) {
        try {
          const response = await axios.get(
            `${this.soilGridsApiUrl}/soilgrids/v2.0/properties/query`,
            {
              params: {
                lat: latitude,
                lon: longitude,
                property: property,
                depth: '0-5cm', // Surface soil
                value: 'mean'
              },
              timeout: 5000
            }
          );

          if (response.data && response.data.properties) {
            soilData[property] = response.data.properties[property];
          }
        } catch (error) {
          console.warn(`Failed to fetch ${property}:`, error);
          // Provide default values if API fails
          soilData[property] = this.getDefaultSoilValue(property);
        }
      }

      // Process and normalize the data
      return {
        ph: soilData.phh2o ? soilData.phh2o.mean / 10 : 6.5, // Convert from pH*10
        moisture: this.estimateSoilMoisture(coordinates), // Estimated from weather data
        temperature: await this.getSoilTemperature(coordinates),
        nitrogen: soilData.nitrogen ? soilData.nitrogen.mean / 100 : 120,
        phosphorus: this.estimatePhosphorus(soilData),
        potassium: this.estimatePotassium(soilData),
        organic_matter: soilData.soc ? soilData.soc.mean / 10 : 2.5,
        clay_content: soilData.clay ? soilData.clay.mean : 25,
        sand_content: soilData.sand ? soilData.sand.mean : 45,
        silt_content: soilData.silt ? soilData.silt.mean : 30,
        bulk_density: soilData.bdod ? soilData.bdod.mean / 100 : 1.3,
        cation_exchange_capacity: soilData.cec ? soilData.cec.mean : 15
      };

    } catch (error) {
      console.error('Error fetching soil properties:', error);
      // Return default soil properties for demo
      return this.getDefaultSoilProperties();
    }
  }

  // Get vegetation indices from satellite imagery
  async getVegetationIndices(coordinates: SatelliteCoordinates): Promise<VegetationIndices> {
    try {
      // In a real implementation, this would fetch from Sentinel-2 or other satellite APIs
      // For demo purposes, we'll simulate NDVI calculation
      
      const mockImagery = await this.getMockSatelliteImagery(coordinates);
      
      // Calculate NDVI: (NIR - RED) / (NIR + RED)
      const ndvi = this.calculateNDVI(mockImagery.bands.nir, mockImagery.bands.red);
      
      // Calculate other vegetation indices
      const evi = this.calculateEVI(mockImagery.bands);
      const savi = this.calculateSAVI(mockImagery.bands);
      const gndvi = this.calculateGNDVI(mockImagery.bands);

      return {
        ndvi: parseFloat(ndvi.toFixed(3)),
        evi: parseFloat(evi.toFixed(3)),
        savi: parseFloat(savi.toFixed(3)),
        gndvi: parseFloat(gndvi.toFixed(3))
      };

    } catch (error) {
      console.error('Error calculating vegetation indices:', error);
      // Return mock values for demo
      return {
        ndvi: 0.65 + Math.random() * 0.25,
        evi: 0.45 + Math.random() * 0.20,
        savi: 0.55 + Math.random() * 0.25,
        gndvi: 0.60 + Math.random() * 0.25
      };
    }
  }

  // Get land cover information from Bhuvan APIs
  async getLandCoverData(coordinates: SatelliteCoordinates): Promise<LandCoverData> {
    try {
      // This would typically call Bhuvan Land Use/Land Cover APIs
      // For demo purposes, we'll return simulated data based on coordinates
      
      const { latitude, longitude } = coordinates;
      
      // Determine likely crop type based on geographic region
      const cropType = this.determineCropType(latitude, longitude);
      const irrigationStatus = this.determineIrrigationStatus(coordinates);
      
      return {
        landCoverType: 'Agricultural',
        cropType: cropType,
        irrigation_status: irrigationStatus,
        crop_intensity: 'double',
        crop_calendar: {
          sowing_month: cropType.includes('रबी') ? 11 : 6, // Nov for Rabi, Jun for Kharif
          harvesting_month: cropType.includes('रबी') ? 4 : 10 // Apr for Rabi, Oct for Kharif
        }
      };

    } catch (error) {
      console.error('Error fetching land cover data:', error);
      return {
        landCoverType: 'Agricultural',
        cropType: 'मिश्रित फसल',
        irrigation_status: 'rainfed',
        crop_intensity: 'single',
        crop_calendar: {
          sowing_month: 6,
          harvesting_month: 10
        }
      };
    }
  }

  // Get weather data from satellite sources
  async getWeatherSatelliteData(coordinates: SatelliteCoordinates): Promise<WeatherSatelliteData> {
    try {
      // This would typically integrate with weather satellite APIs
      // For demo, we'll generate realistic weather data
      
      const baseTemp = this.getRegionalBaseTemperature(coordinates.latitude);
      const seasonal_variation = Math.sin((Date.now() / (365 * 24 * 60 * 60 * 1000)) * 2 * Math.PI) * 10;
      const current_temp = baseTemp + seasonal_variation + (Math.random() - 0.5) * 8;

      return {
        temperature: {
          surface: current_temp + 2,
          air: current_temp,
          max: current_temp + 8,
          min: current_temp - 6
        },
        precipitation: {
          current: Math.random() * 5,
          forecast_7days: Array.from({ length: 7 }, () => Math.random() * 10),
          monthly_average: 85 + Math.random() * 60
        },
        humidity: 60 + Math.random() * 30,
        wind_speed: 5 + Math.random() * 15,
        solar_radiation: 15 + Math.random() * 10,
        evapotranspiration: 3 + Math.random() * 4
      };

    } catch (error) {
      console.error('Error fetching weather satellite data:', error);
      return {
        temperature: { surface: 28, air: 26, max: 32, min: 20 },
        precipitation: { current: 0, forecast_7days: [2, 0, 5, 1, 0, 8, 3], monthly_average: 95 },
        humidity: 65,
        wind_speed: 12,
        solar_radiation: 20,
        evapotranspiration: 5.2
      };
    }
  }

  // Main function to get comprehensive satellite analysis
  async getSatelliteAnalysis(coordinates: SatelliteCoordinates): Promise<SatelliteAnalysisResult> {
    const cacheKey = this.getCacheKey(coordinates.latitude, coordinates.longitude);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (this.isCacheValid(cached)) {
        return cached;
      }
    }

    try {
      // Fetch all satellite data in parallel
      const [soilProperties, vegetationIndices, landCover, weatherData] = await Promise.all([
        this.getSoilProperties(coordinates),
        this.getVegetationIndices(coordinates),
        this.getLandCoverData(coordinates),
        this.getWeatherSatelliteData(coordinates)
      ]);

      // Get mock imagery data
      const imagery = await this.getMockSatelliteImagery(coordinates);

      // Perform analysis
      const analysis = this.performCropAnalysis(
        soilProperties,
        vegetationIndices,
        weatherData,
        landCover
      );

      const result: SatelliteAnalysisResult = {
        coordinates,
        timestamp: new Date().toISOString(),
        soil_properties: soilProperties,
        vegetation_indices: vegetationIndices,
        land_cover: landCover,
        weather_data: weatherData,
        imagery,
        analysis
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Error in satellite analysis:', error);
      throw new Error('Satellite data analysis failed');
    }
  }

  // Helper methods
  private getDefaultSoilValue(property: string): any {
    const defaults: { [key: string]: any } = {
      phh2o: { mean: 65 }, // pH 6.5
      soc: { mean: 25 },   // 2.5% organic carbon
      nitrogen: { mean: 1200 }, // 120 kg/ha
      bdod: { mean: 130 },  // 1.3 g/cm³
      cec: { mean: 150 },   // 15 cmol/kg
      clay: { mean: 250 },  // 25%
      sand: { mean: 450 },  // 45%
      silt: { mean: 300 }   // 30%
    };
    return defaults[property] || { mean: 100 };
  }

  private getDefaultSoilProperties(): SoilProperties {
    return {
      ph: 6.5,
      moisture: 25,
      temperature: 25,
      nitrogen: 120,
      phosphorus: 65,
      potassium: 45,
      organic_matter: 2.5,
      clay_content: 25,
      sand_content: 45,
      silt_content: 30,
      bulk_density: 1.3,
      cation_exchange_capacity: 15
    };
  }

  private async estimateSoilMoisture(coordinates: SatelliteCoordinates): Promise<number> {
    // Estimate based on recent precipitation and evapotranspiration
    const weather = await this.getWeatherSatelliteData(coordinates);
    const recentRain = weather.precipitation.current;
    const et = weather.evapotranspiration;
    
    // Simple moisture estimation
    const baseMoisture = 20;
    const moistureFromRain = Math.min(recentRain * 2, 30);
    const moistureLoss = et * 2;
    
    return Math.max(5, Math.min(45, baseMoisture + moistureFromRain - moistureLoss));
  }

  private async getSoilTemperature(coordinates: SatelliteCoordinates): Promise<number> {
    const weather = await this.getWeatherSatelliteData(coordinates);
    return weather.temperature.surface;
  }

  private estimatePhosphorus(soilData: any): number {
    // Estimate phosphorus based on organic matter and clay content
    const organicMatter = soilData.soc ? soilData.soc.mean / 10 : 2.5;
    const clayContent = soilData.clay ? soilData.clay.mean : 25;
    
    return 30 + (organicMatter * 8) + (clayContent * 0.5) + Math.random() * 20;
  }

  private estimatePotassium(soilData: any): number {
    // Estimate potassium based on clay and silt content
    const clayContent = soilData.clay ? soilData.clay.mean : 25;
    const siltContent = soilData.silt ? soilData.silt.mean : 30;
    
    return 20 + (clayContent * 0.8) + (siltContent * 0.6) + Math.random() * 15;
  }

  private async getMockSatelliteImagery(coordinates: SatelliteCoordinates): Promise<SatelliteImagery> {
    // Generate realistic mock imagery data
    const generateBand = () => Array.from({ length: 100 }, () => Math.random() * 255);
    
    return {
      date: new Date().toISOString().split('T')[0],
      cloudCover: Math.random() * 30,
      resolution: 10, // 10m resolution
      bands: {
        red: generateBand(),
        green: generateBand(),
        blue: generateBand(),
        nir: generateBand()
      }
    };
  }

  private calculateNDVI(nirBand: number[], redBand: number[]): number {
    let totalNDVI = 0;
    for (let i = 0; i < Math.min(nirBand.length, redBand.length); i++) {
      const nir = nirBand[i];
      const red = redBand[i];
      if (nir + red !== 0) {
        totalNDVI += (nir - red) / (nir + red);
      }
    }
    return totalNDVI / nirBand.length;
  }

  private calculateEVI(bands: any): number {
    // Enhanced Vegetation Index calculation
    // EVI = 2.5 * (NIR - Red) / (NIR + 6 * Red - 7.5 * Blue + 1)
    const nirAvg = bands.nir.reduce((a: number, b: number) => a + b) / bands.nir.length;
    const redAvg = bands.red.reduce((a: number, b: number) => a + b) / bands.red.length;
    const blueAvg = bands.blue.reduce((a: number, b: number) => a + b) / bands.blue.length;
    
    return 2.5 * (nirAvg - redAvg) / (nirAvg + 6 * redAvg - 7.5 * blueAvg + 1);
  }

  private calculateSAVI(bands: any): number {
    // Soil Adjusted Vegetation Index
    const L = 0.5; // Soil brightness correction factor
    const nirAvg = bands.nir.reduce((a: number, b: number) => a + b) / bands.nir.length;
    const redAvg = bands.red.reduce((a: number, b: number) => a + b) / bands.red.length;
    
    return ((nirAvg - redAvg) / (nirAvg + redAvg + L)) * (1 + L);
  }

  private calculateGNDVI(bands: any): number {
    // Green Normalized Difference Vegetation Index
    const nirAvg = bands.nir.reduce((a: number, b: number) => a + b) / bands.nir.length;
    const greenAvg = bands.green.reduce((a: number, b: number) => a + b) / bands.green.length;
    
    return (nirAvg - greenAvg) / (nirAvg + greenAvg);
  }

  private determineCropType(lat: number, lng: number): string {
    // Determine likely crop based on geographic region in India
    if (lat > 28) return 'गेहूं'; // North India - wheat belt
    if (lat < 20) return 'चावल'; // South India - rice
    if (lng > 77 && lat > 25) return 'सरसों'; // North-central - mustard
    if (lng < 75) return 'कपास'; // Western India - cotton
    return 'मिश्रित फसल';
  }

  private determineIrrigationStatus(coordinates: SatelliteCoordinates): 'irrigated' | 'rainfed' | 'unknown' {
    // Simple heuristic based on location
    const { latitude, longitude } = coordinates;
    
    // Punjab, Haryana region - typically irrigated
    if (latitude > 28 && longitude > 75 && longitude < 78) return 'irrigated';
    
    // Western regions - mixed
    if (longitude < 75) return Math.random() > 0.5 ? 'irrigated' : 'rainfed';
    
    // Default to rainfed for other regions
    return 'rainfed';
  }

  private getRegionalBaseTemperature(latitude: number): number {
    // Base temperature varies with latitude in India
    if (latitude > 30) return 22; // Himalayan regions
    if (latitude > 25) return 28; // North India
    if (latitude > 20) return 32; // Central India
    return 35; // South India
  }

  private performCropAnalysis(
    soil: SoilProperties,
    vegetation: VegetationIndices,
    weather: WeatherSatelliteData,
    landCover: LandCoverData
  ) {
    // Calculate crop health score based on NDVI and other factors
    let healthScore = vegetation.ndvi * 100;
    
    // Adjust based on soil conditions
    if (soil.ph >= 6.0 && soil.ph <= 7.5) healthScore += 5;
    if (soil.moisture >= 20 && soil.moisture <= 30) healthScore += 5;
    if (soil.organic_matter > 2.0) healthScore += 5;
    
    // Water stress assessment
    let waterStressLevel: 'low' | 'medium' | 'high' = 'low';
    if (vegetation.ndvi < 0.4) waterStressLevel = 'high';
    else if (vegetation.ndvi < 0.6) waterStressLevel = 'medium';
    
    // Soil fertility index
    const fertilityIndex = (
      (soil.nitrogen / 150) * 30 +
      (soil.phosphorus / 80) * 25 +
      (soil.potassium / 60) * 20 +
      (soil.organic_matter / 4) * 25
    );
    
    // Growth stage determination
    let growthStage = 'अज्ञात';
    if (vegetation.ndvi > 0.7) growthStage = 'तीव्र वृद्धि';
    else if (vegetation.ndvi > 0.5) growthStage = 'मध्यम वृद्धि';
    else if (vegetation.ndvi > 0.3) growthStage = 'प्रारंभिक वृद्धि';
    else growthStage = 'अंकुरण/फूल';
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (soil.ph < 6.0) recommendations.push('मिट्टी का pH बढ़ाएं');
    if (soil.moisture < 15) recommendations.push('सिंचाई की आवश्यकता');
    if (vegetation.ndvi < 0.5) recommendations.push('पोषक तत्वों की जांच करें');
    if (soil.nitrogen < 100) recommendations.push('नाइट्रोजन उर्वरक डालें');
    
    // Generate alerts
    const alerts: string[] = [];
    if (waterStressLevel === 'high') alerts.push('तुरंत सिंचाई करें');
    if (soil.ph < 5.5 || soil.ph > 8.0) alerts.push('मिट्टी pH सुधार आवश्यक');
    if (vegetation.ndvi < 0.3) alerts.push('फसल स्वास्थ्य चेतावनी');
    
    return {
      crop_health_score: Math.round(Math.min(100, Math.max(0, healthScore))),
      water_stress_level: waterStressLevel,
      soil_fertility_index: Math.round(Math.min(100, Math.max(0, fertilityIndex))),
      growth_stage: growthStage,
      recommendations,
      alerts
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cached data count
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const satelliteService = new SatelliteService();
export default satelliteService;