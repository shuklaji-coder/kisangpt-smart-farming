import axios from 'axios';

// Types for crop recommendation system
export interface SoilData {
  ph: number;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  temperature: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  forecast: Array<{
    date: string;
    temp: number;
    precipitation: number;
    condition: string;
  }>;
}

export interface MarketData {
  crop: string;
  currentPrice: number;
  trend: 'up' | 'down' | 'stable';
  priceChange: number;
  demandLevel: 'high' | 'medium' | 'low';
  seasonalPattern: number[];
}

export interface FarmerProfile {
  farmSize: number;
  experience: number;
  budget: number;
  location: {
    latitude: number;
    longitude: number;
    district: string;
    state: string;
  };
  previousCrops: string[];
  soilType: 'clay' | 'sandy' | 'loamy' | 'silt';
}

  export interface CropRecommendation {
    cropName: string;
    hindiName: string;
    suitabilityScore: number;
    predictedYield: number;
    expectedProfit: number;
    breakEvenPrice: number;
    sowingTime: string;
    harvestTime: string;
    waterRequirement: 'low' | 'medium' | 'high';
    investmentRequired: number;
    marketDemand: 'low' | 'medium' | 'high';
    risks: string[];
    benefits: string[];
    recommendations: string[];
    expectedProfit: number;
    breakEvenPoint: number;
  }

// Comprehensive crop database with Indian crops
const cropDatabase = {
  wheat: {
    name: 'Wheat',
    hindiName: 'गेहूं',
    optimalPh: { min: 6.0, max: 7.5 },
    optimalTemp: { min: 15, max: 25 },
    waterReq: 'medium',
    sowingSeason: 'रबी',
    duration: 120,
    averageYield: 3500, // kg/hectare
    marketPrice: 2150, // per kg
    costPerHectare: 45000,
    soilTypes: ['loamy', 'clay'],
    nitrogenReq: { min: 120, max: 150 },
    phosphorusReq: { min: 60, max: 80 },
    potassiumReq: { min: 40, max: 60 }
  },
  rice: {
    name: 'Rice',
    hindiName: 'धान',
    optimalPh: { min: 5.5, max: 7.0 },
    optimalTemp: { min: 21, max: 35 },
    waterReq: 'high',
    sowingSeason: 'खरीफ',
    duration: 130,
    averageYield: 4000,
    marketPrice: 4200,
    costPerHectare: 55000,
    soilTypes: ['clay', 'loamy'],
    nitrogenReq: { min: 100, max: 120 },
    phosphorusReq: { min: 50, max: 70 },
    potassiumReq: { min: 50, max: 70 }
  },
  maize: {
    name: 'Maize',
    hindiName: 'मक्का',
    optimalPh: { min: 5.8, max: 7.0 },
    optimalTemp: { min: 18, max: 32 },
    waterReq: 'medium',
    sowingSeason: 'खरीफ',
    duration: 110,
    averageYield: 4500,
    marketPrice: 1850,
    costPerHectare: 35000,
    soilTypes: ['loamy', 'sandy'],
    nitrogenReq: { min: 150, max: 180 },
    phosphorusReq: { min: 60, max: 80 },
    potassiumReq: { min: 40, max: 60 }
  },
  mustard: {
    name: 'Mustard',
    hindiName: 'सरसों',
    optimalPh: { min: 6.0, max: 7.5 },
    optimalTemp: { min: 10, max: 25 },
    waterReq: 'low',
    sowingSeason: 'रबी',
    duration: 140,
    averageYield: 1200,
    marketPrice: 5800,
    costPerHectare: 25000,
    soilTypes: ['loamy', 'sandy'],
    nitrogenReq: { min: 60, max: 80 },
    phosphorusReq: { min: 40, max: 60 },
    potassiumReq: { min: 30, max: 40 }
  },
  cotton: {
    name: 'Cotton',
    hindiName: 'कपास',
    optimalPh: { min: 5.8, max: 8.0 },
    optimalTemp: { min: 21, max: 30 },
    waterReq: 'high',
    sowingSeason: 'खरीफ',
    duration: 180,
    averageYield: 500,
    marketPrice: 6200,
    costPerHectare: 65000,
    soilTypes: ['clay', 'loamy'],
    nitrogenReq: { min: 100, max: 150 },
    phosphorusReq: { min: 50, max: 80 },
    potassiumReq: { min: 50, max: 80 }
  },
  sugarcane: {
    name: 'Sugarcane',
    hindiName: 'गन्ना',
    optimalPh: { min: 6.5, max: 7.5 },
    optimalTemp: { min: 26, max: 32 },
    waterReq: 'high',
    sowingSeason: 'जायद',
    duration: 365,
    averageYield: 70000,
    marketPrice: 350,
    costPerHectare: 85000,
    soilTypes: ['loamy', 'clay'],
    nitrogenReq: { min: 200, max: 250 },
    phosphorusReq: { min: 80, max: 100 },
    potassiumReq: { min: 60, max: 100 }
  }
};

class CropRecommendationEngine {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_CROP_API_KEY || 'demo_key';
  }

  // Calculate soil suitability score for a crop
  private calculateSoilSuitability(soilData: SoilData, cropData: any): number {
    let score = 100;

    // pH suitability
    if (soilData.ph < cropData.optimalPh.min || soilData.ph > cropData.optimalPh.max) {
      const phDeviation = Math.min(
        Math.abs(soilData.ph - cropData.optimalPh.min),
        Math.abs(soilData.ph - cropData.optimalPh.max)
      );
      score -= phDeviation * 10;
    }

    // Nutrient suitability
    const nDeficit = Math.max(0, cropData.nitrogenReq.min - soilData.nitrogen);
    const pDeficit = Math.max(0, cropData.phosphorusReq.min - soilData.phosphorus);
    const kDeficit = Math.max(0, cropData.potassiumReq.min - soilData.potassium);
    
    score -= (nDeficit / 10) + (pDeficit / 5) + (kDeficit / 5);

    // Organic matter bonus
    score += Math.min(10, soilData.organic_matter * 2);

    return Math.max(0, Math.min(100, score));
  }

  // Calculate climate suitability
  private calculateClimateSuitability(weatherData: WeatherData, cropData: any): number {
    let score = 100;

    // Temperature suitability
    if (weatherData.temperature < cropData.optimalTemp.min || 
        weatherData.temperature > cropData.optimalTemp.max) {
      const tempDeviation = Math.min(
        Math.abs(weatherData.temperature - cropData.optimalTemp.min),
        Math.abs(weatherData.temperature - cropData.optimalTemp.max)
      );
      score -= tempDeviation * 3;
    }

    // Water requirement vs rainfall
    const rainfallScore = this.calculateRainfallScore(weatherData.rainfall, cropData.waterReq);
    score = score * 0.7 + rainfallScore * 0.3;

    return Math.max(0, Math.min(100, score));
  }

  private calculateRainfallScore(rainfall: number, waterReq: string): number {
    switch (waterReq) {
      case 'low': return rainfall < 500 ? 100 : Math.max(50, 100 - (rainfall - 500) / 10);
      case 'medium': return rainfall >= 500 && rainfall <= 1000 ? 100 : 
                     rainfall < 500 ? 60 + rainfall / 12.5 : Math.max(40, 100 - (rainfall - 1000) / 15);
      case 'high': return rainfall > 800 ? 100 : Math.max(30, rainfall / 8);
      default: return 70;
    }
  }

  // Calculate market viability
  private calculateMarketViability(marketData: MarketData, cropData: any): number {
    let score = 70; // Base score

    // Price trend impact
    if (marketData.trend === 'up') score += 15;
    else if (marketData.trend === 'down') score -= 10;

    // Demand level impact
    if (marketData.demandLevel === 'high') score += 15;
    else if (marketData.demandLevel === 'low') score -= 10;

    // Price comparison with cost
    const profitMargin = ((marketData.currentPrice - cropData.costPerHectare / cropData.averageYield) / 
                         (cropData.costPerHectare / cropData.averageYield)) * 100;
    
    if (profitMargin > 50) score += 20;
    else if (profitMargin > 30) score += 10;
    else if (profitMargin < 10) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  // Calculate sustainability score
  private calculateSustainabilityScore(
    farmerProfile: FarmerProfile, 
    cropData: any,
    previousCrops: string[]
  ): number {
    let score = 80; // Base sustainability score

    // Crop rotation benefits
    if (!previousCrops.includes(cropData.name.toLowerCase())) {
      score += 10;
    } else {
      const lastIndex = previousCrops.lastIndexOf(cropData.name.toLowerCase());
      if (lastIndex === previousCrops.length - 1) score -= 15; // Same crop last season
      else if (lastIndex >= previousCrops.length - 3) score -= 8; // Same crop in last 3 seasons
    }

    // Soil type compatibility
    if (cropData.soilTypes.includes(farmerProfile.soilType)) {
      score += 10;
    } else {
      score -= 15;
    }

    // Farm size suitability
    if (farmerProfile.farmSize >= 2) score += 5;
    else if (farmerProfile.farmSize < 0.5) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  // Main recommendation engine
  async getRecommendations(
    soilData: SoilData,
    weatherData: WeatherData,
    marketData: MarketData[],
    farmerProfile: FarmerProfile
  ): Promise<CropRecommendation[]> {
    const recommendations: CropRecommendation[] = [];

    for (const [cropKey, cropData] of Object.entries(cropDatabase)) {
      // Find market data for this crop
      const cropMarketData = marketData.find(m => 
        m.crop.toLowerCase() === cropData.name.toLowerCase()
      ) || {
        crop: cropData.name,
        currentPrice: cropData.marketPrice,
        trend: 'stable' as const,
        priceChange: 0,
        demandLevel: 'medium' as const,
        seasonalPattern: []
      };

      // Calculate various suitability scores
      const soilScore = this.calculateSoilSuitability(soilData, cropData);
      const climateScore = this.calculateClimateSuitability(weatherData, cropData);
      const marketScore = this.calculateMarketViability(cropMarketData, cropData);
      const sustainabilityScore = this.calculateSustainabilityScore(
        farmerProfile, 
        cropData, 
        farmerProfile.previousCrops
      );

      // Calculate overall suitability (weighted average)
      const overallScore = (
        soilScore * 0.3 +
        climateScore * 0.25 +
        marketScore * 0.25 +
        sustainabilityScore * 0.2
      );

      // Calculate financial projections
      const predictedYield = cropData.averageYield * (overallScore / 100) * farmerProfile.farmSize;
      const totalRevenue = predictedYield * cropMarketData.currentPrice;
      const totalCost = cropData.costPerHectare * farmerProfile.farmSize;
      const expectedProfit = totalRevenue - totalCost;
      const profitMargin = (expectedProfit / totalCost) * 100;

      // Generate risks and benefits
      const risks = this.generateRisks(soilScore, climateScore, marketScore, cropData);
      const benefits = this.generateBenefits(overallScore, cropData, expectedProfit);
      const recommendations = this.generateRecommendations(soilData, cropData, overallScore);

      const recommendation: CropRecommendation = {
        cropName: cropData.name,
        hindiName: cropData.hindiName,
        suitabilityScore: Math.round(overallScore),
        predictedYield: Math.round(predictedYield),
        profitMargin: Math.round(profitMargin),
        sustainabilityScore: Math.round(sustainabilityScore),
        sowingTime: cropData.sowingSeason,
        harvestTime: `${cropData.duration} दिन`,
        waterRequirement: cropData.waterReq,
        investmentRequired: Math.round(totalCost),
        marketDemand: cropMarketData.demandLevel,
        risks,
        benefits,
        recommendations,
        expectedProfit: Math.round(expectedProfit),
        breakEvenPoint: Math.round(totalCost / cropMarketData.currentPrice)
      };

      recommendations.push(recommendation);
    }

    // Sort by suitability score and return top recommendations
    return recommendations
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
      .slice(0, 5);
  }

  private generateRisks(soilScore: number, climateScore: number, marketScore: number, cropData: any): string[] {
    const risks: string[] = [];

    if (soilScore < 60) {
      risks.push('मिट्टी की गुणवत्ता सुधार की आवश्यकता');
    }
    if (climateScore < 70) {
      risks.push('मौसम संबंधी चुनौतियां');
    }
    if (marketScore < 60) {
      risks.push('बाजार में कीमत में गिरावट का जोखिम');
    }
    if (cropData.waterReq === 'high') {
      risks.push('अधिक पानी की आवश्यकता');
    }

    return risks.length > 0 ? risks : ['न्यूनतम जोखिम'];
  }

  private generateBenefits(score: number, cropData: any, profit: number): string[] {
    const benefits: string[] = [];

    if (score > 80) {
      benefits.push('उच्च उत्पादकता की संभावना');
    }
    if (profit > 50000) {
      benefits.push('अच्छा मुनाफा');
    }
    if (cropData.waterReq === 'low') {
      benefits.push('कम पानी की आवश्यकता');
    }
    benefits.push('स्थायी कृषि के लिए उपयुक्त');

    return benefits;
  }

  private generateRecommendations(soilData: SoilData, cropData: any, score: number): string[] {
    const recommendations: string[] = [];

    if (soilData.ph < cropData.optimalPh.min) {
      recommendations.push('मिट्टी का pH बढ़ाने के लिए चूना डालें');
    } else if (soilData.ph > cropData.optimalPh.max) {
      recommendations.push('मिट्टी का pH कम करने के लिए सल्फर का प्रयोग करें');
    }

    if (soilData.nitrogen < cropData.nitrogenReq.min) {
      recommendations.push('नाइट्रोजन उर्वरक की मात्रा बढ़ाएं');
    }

    if (score > 75) {
      recommendations.push('यह फसल आपके लिए बहुत उपयुक्त है');
    } else if (score < 50) {
      recommendations.push('इस फसल के लिए अतिरिक्त देखभाल की आवश्यकता');
    }

    return recommendations;
  }

  // Get seasonal recommendations
  async getSeasonalRecommendations(currentSeason: string): Promise<string[]> {
    const seasonalCrops: { [key: string]: string[] } = {
      'रबी': ['गेहूं', 'सरसों', 'जौ', 'चना', 'मटर'],
      'खरीफ': ['धान', 'मक्का', 'कपास', 'गन्ना', 'ज्वार'],
      'जायद': ['तरबूज', 'खीरा', 'भिंडी', 'लौकी', 'टमाटर']
    };

    return seasonalCrops[currentSeason] || [];
  }

  // Cache recommendations for offline use
  async cacheRecommendations(recommendations: CropRecommendation[]): Promise<void> {
    try {
      localStorage.setItem('cached_crop_recommendations', JSON.stringify({
        data: recommendations,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  }

  // Get cached recommendations
  getCachedRecommendations(): CropRecommendation[] | null {
    try {
      const cached = localStorage.getItem('cached_crop_recommendations');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        
        // Cache valid for 24 hours
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error retrieving cached recommendations:', error);
    }
    return null;
  }
}

export const cropRecommendationEngine = new CropRecommendationEngine();
export default cropRecommendationEngine;