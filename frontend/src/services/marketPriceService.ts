import axios from 'axios';

// Types for market price system
export interface CropPrice {
  crop: string;
  hindiName: string;
  variety: string;
  currentPrice: number;
  unit: 'kg' | 'quintal' | 'ton';
  previousPrice: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  qualityGrade: 'A' | 'B' | 'C' | 'FAQ' | 'Other';
  lastUpdated: string;
}

export interface MarketInfo {
  mandiName: string;
  hindiName: string;
  state: string;
  district: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // km from user location
  contactNumber?: string;
  workingHours: string;
  facilities: string[];
  transportationCost: number; // per quintal
}

export interface PriceAlert {
  id: string;
  crop: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  mandiNames: string[];
}

export interface MarketTrend {
  crop: string;
  period: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  data: Array<{
    date: string;
    price: number;
    volume: number; // quintals traded
  }>;
  forecast: Array<{
    date: string;
    predictedPrice: number;
    confidence: number;
  }>;
  analysis: {
    volatility: number; // 0-100 score
    seasonality: 'high' | 'medium' | 'low';
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    priceStability: number; // 0-100 score
  };
}

export interface ProfitCalculation {
  crop: string;
  investmentPerAcre: number;
  yieldPerAcre: number;
  currentMarketPrice: number;
  grossRevenue: number;
  netProfit: number;
  profitMargin: number;
  breakEvenPrice: number;
  roi: number; // Return on Investment percentage
  paybackPeriod: number; // months
  costs: {
    seeds: number;
    fertilizers: number;
    pesticides: number;
    labor: number;
    irrigation: number;
    harvesting: number;
    transportation: number;
    other: number;
  };
}

export interface MarketComparison {
  nearbyMandis: Array<{
    mandi: MarketInfo;
    price: CropPrice;
    profitability: number;
    recommendation: 'highly_recommended' | 'recommended' | 'consider' | 'avoid';
  }>;
  bestOption: {
    mandi: MarketInfo;
    price: CropPrice;
    totalProfit: number;
    reason: string;
  };
  alternativeOptions: Array<{
    mandi: MarketInfo;
    price: CropPrice;
    pros: string[];
    cons: string[];
  }>;
}

// Major mandis across India with their locations
const mandiDatabase: MarketInfo[] = [
  {
    mandiName: 'Azadpur Mandi',
    hindiName: 'आज़ादपुर मंडी',
    state: 'Delhi',
    district: 'Delhi',
    location: { latitude: 28.7041, longitude: 77.1025 },
    contactNumber: '+91-11-27654321',
    workingHours: '4:00 AM - 12:00 PM',
    facilities: ['Cold Storage', 'Quality Testing', 'Electronic Weighing', 'Banking'],
    transportationCost: 25
  },
  {
    mandiName: 'Chandigarh Grain Market',
    hindiName: 'चंडीगढ़ अनाज मंडी',
    state: 'Chandigarh',
    district: 'Chandigarh',
    location: { latitude: 30.7333, longitude: 76.7794 },
    contactNumber: '+91-172-2654321',
    workingHours: '6:00 AM - 2:00 PM',
    facilities: ['MSP Procurement', 'Quality Testing', 'Storage', 'Transportation'],
    transportationCost: 20
  },
  {
    mandiName: 'Pune APMC',
    hindiName: 'पुणे कृषि उत्पादन बाजार समिति',
    state: 'Maharashtra',
    district: 'Pune',
    location: { latitude: 18.5204, longitude: 73.8567 },
    contactNumber: '+91-20-24569876',
    workingHours: '6:00 AM - 6:00 PM',
    facilities: ['Electronic Trading', 'Cold Storage', 'Processing Units', 'Export Facility'],
    transportationCost: 30
  },
  {
    mandiName: 'Kota Chambal Mandi',
    hindiName: 'कोटा चंबल मंडी',
    state: 'Rajasthan',
    district: 'Kota',
    location: { latitude: 25.2138, longitude: 75.8648 },
    contactNumber: '+91-744-2354567',
    workingHours: '5:00 AM - 1:00 PM',
    facilities: ['Soybean Trading', 'Warehouse', 'Quality Testing'],
    transportationCost: 35
  },
  {
    mandiName: 'Bangalore APMC',
    hindiName: 'बंगलौर कृषि उत्पादन बाजार',
    state: 'Karnataka',
    district: 'Bangalore',
    location: { latitude: 12.9716, longitude: 77.5946 },
    contactNumber: '+91-80-22345678',
    workingHours: '6:00 AM - 4:00 PM',
    facilities: ['Vegetable Market', 'Flower Market', 'Organic Section', 'Export Hub'],
    transportationCost: 40
  }
];

// Sample crop pricing data (in production, this would come from real APIs)
const mockPriceData: { [key: string]: CropPrice[] } = {
  wheat: [
    {
      crop: 'wheat',
      hindiName: 'गेहूं',
      variety: 'HD-2967',
      currentPrice: 2150,
      unit: 'quintal',
      previousPrice: 2100,
      changePercent: 2.38,
      trend: 'up',
      minPrice: 2025,
      maxPrice: 2250,
      avgPrice: 2125,
      qualityGrade: 'A',
      lastUpdated: new Date().toISOString()
    },
    {
      crop: 'wheat',
      hindiName: 'गेहूं',
      variety: 'PBW-343',
      currentPrice: 2080,
      unit: 'quintal',
      previousPrice: 2120,
      changePercent: -1.89,
      trend: 'down',
      minPrice: 1980,
      maxPrice: 2180,
      avgPrice: 2050,
      qualityGrade: 'B',
      lastUpdated: new Date().toISOString()
    }
  ],
  rice: [
    {
      crop: 'rice',
      hindiName: 'चावल',
      variety: 'Basmati 1121',
      currentPrice: 4200,
      unit: 'quintal',
      previousPrice: 4150,
      changePercent: 1.20,
      trend: 'up',
      minPrice: 4000,
      maxPrice: 4400,
      avgPrice: 4180,
      qualityGrade: 'A',
      lastUpdated: new Date().toISOString()
    },
    {
      crop: 'rice',
      hindiName: 'चावल',
      variety: 'PR-126',
      currentPrice: 2850,
      unit: 'quintal',
      previousPrice: 2800,
      changePercent: 1.79,
      trend: 'up',
      minPrice: 2750,
      maxPrice: 2950,
      avgPrice: 2825,
      qualityGrade: 'FAQ',
      lastUpdated: new Date().toISOString()
    }
  ],
  cotton: [
    {
      crop: 'cotton',
      hindiName: 'कपास',
      variety: 'Shankar-6',
      currentPrice: 6200,
      unit: 'quintal',
      previousPrice: 6100,
      changePercent: 1.64,
      trend: 'up',
      minPrice: 5950,
      maxPrice: 6350,
      avgPrice: 6150,
      qualityGrade: 'A',
      lastUpdated: new Date().toISOString()
    }
  ],
  mustard: [
    {
      crop: 'mustard',
      hindiName: 'सरसों',
      variety: 'Varuna',
      currentPrice: 5800,
      unit: 'quintal',
      previousPrice: 5650,
      changePercent: 2.65,
      trend: 'up',
      minPrice: 5500,
      maxPrice: 6000,
      avgPrice: 5725,
      qualityGrade: 'A',
      lastUpdated: new Date().toISOString()
    }
  ]
};

class MarketPriceService {
  private apiKey: string;
  private priceAlerts: PriceAlert[] = [];
  private priceCache: Map<string, CropPrice[]> = new Map();
  private cacheExpiration: number = 300000; // 5 minutes

  constructor() {
    this.apiKey = process.env.REACT_APP_AGMARKET_API_KEY || 'demo_key';
    this.loadAlertsFromStorage();
  }

  // Get real-time crop prices from multiple mandis
  async getCropPrices(cropName: string, location?: { lat: number; lng: number }): Promise<CropPrice[]> {
    try {
      const cacheKey = `${cropName}_${location?.lat || 0}_${location?.lng || 0}`;
      
      // Check cache first
      if (this.priceCache.has(cacheKey)) {
        const cached = this.priceCache.get(cacheKey)!;
        if (this.isCacheValid(cached[0]?.lastUpdated)) {
          return cached;
        }
      }

      // In production, fetch from real APIs like:
      // - Government e-NAM platform
      // - State APMC websites
      // - AgMarkNet API
      // For demo, return mock data with some randomization

      let prices = mockPriceData[cropName.toLowerCase()] || [];
      
      // Add some realistic price variations
      prices = prices.map(price => ({
        ...price,
        currentPrice: this.addPriceVariation(price.currentPrice),
        lastUpdated: new Date().toISOString()
      }));

      // If location provided, sort by proximity and adjust transportation costs
      if (location) {
        prices = this.adjustPricesForLocation(prices, location);
      }

      // Cache the results
      this.priceCache.set(cacheKey, prices);

      return prices;

    } catch (error) {
      console.error('Error fetching crop prices:', error);
      return this.getFallbackPrices(cropName);
    }
  }

  // Get detailed market information for nearby mandis
  async getNearbyMandis(userLocation: { lat: number; lng: number }, radius: number = 200): Promise<MarketInfo[]> {
    const nearbyMandis = mandiDatabase
      .map(mandi => ({
        ...mandi,
        distance: this.calculateDistance(userLocation, mandi.location)
      }))
      .filter(mandi => mandi.distance! <= radius)
      .sort((a, b) => a.distance! - b.distance!);

    return nearbyMandis;
  }

  // Get comprehensive market comparison for a crop
  async getMarketComparison(
    cropName: string, 
    userLocation: { lat: number; lng: number },
    quantity: number // quintals to sell
  ): Promise<MarketComparison> {
    try {
      const [cropPrices, nearbyMandis] = await Promise.all([
        this.getCropPrices(cropName, userLocation),
        this.getNearbyMandis(userLocation)
      ]);

      const comparisons = nearbyMandis.map(mandi => {
        const price = cropPrices[0]; // Use best price for now
        const transportationCost = mandi.transportationCost * quantity;
        const netPrice = price.currentPrice * quantity - transportationCost;
        
        return {
          mandi,
          price,
          profitability: netPrice,
          recommendation: this.getRecommendationLevel(netPrice, price.currentPrice * quantity)
        };
      }).sort((a, b) => b.profitability - a.profitability);

      const bestOption = {
        mandi: comparisons[0].mandi,
        price: comparisons[0].price,
        totalProfit: comparisons[0].profitability,
        reason: this.getBestOptionReason(comparisons[0])
      };

      const alternativeOptions = comparisons.slice(1, 4).map(comp => ({
        mandi: comp.mandi,
        price: comp.price,
        pros: this.generatePros(comp),
        cons: this.generateCons(comp)
      }));

      return {
        nearbyMandis: comparisons,
        bestOption,
        alternativeOptions
      };

    } catch (error) {
      console.error('Error in market comparison:', error);
      throw new Error('Market comparison failed');
    }
  }

  // Get historical trends and forecast
  async getMarketTrends(cropName: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<MarketTrend> {
    try {
      // Generate mock historical data
      const historicalData = this.generateHistoricalData(cropName, period);
      const forecast = this.generatePriceForecast(cropName, historicalData);
      const analysis = this.analyzeMarketTrends(historicalData);

      return {
        crop: cropName,
        period,
        data: historicalData,
        forecast,
        analysis
      };

    } catch (error) {
      console.error('Error fetching market trends:', error);
      throw new Error('Market trend analysis failed');
    }
  }

  // Calculate profit potential for a crop
  async calculateProfit(
    cropName: string,
    farmSize: number,
    variety?: string,
    location?: { lat: number; lng: number }
  ): Promise<ProfitCalculation> {
    try {
      const prices = await this.getCropPrices(cropName, location);
      const bestPrice = prices[0]?.currentPrice || 0;
      
      // Get cost estimates (in production, this would come from a cost database)
      const costs = this.getCropCosts(cropName, farmSize);
      const expectedYield = this.getExpectedYield(cropName, farmSize);
      
      const grossRevenue = expectedYield * bestPrice;
      const totalCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
      const netProfit = grossRevenue - totalCosts;
      const profitMargin = (netProfit / grossRevenue) * 100;
      const roi = (netProfit / totalCosts) * 100;
      const breakEvenPrice = totalCosts / expectedYield;
      const paybackPeriod = this.calculatePaybackPeriod(cropName);

      return {
        crop: cropName,
        investmentPerAcre: totalCosts / farmSize,
        yieldPerAcre: expectedYield / farmSize,
        currentMarketPrice: bestPrice,
        grossRevenue,
        netProfit,
        profitMargin,
        breakEvenPrice,
        roi,
        paybackPeriod,
        costs
      };

    } catch (error) {
      console.error('Error calculating profit:', error);
      throw new Error('Profit calculation failed');
    }
  }

  // Price alert system
  async createPriceAlert(
    crop: string,
    targetPrice: number,
    condition: 'above' | 'below',
    mandiNames: string[] = []
  ): Promise<PriceAlert> {
    const alert: PriceAlert = {
      id: Date.now().toString(),
      crop,
      targetPrice,
      condition,
      isActive: true,
      createdAt: new Date().toISOString(),
      mandiNames
    };

    this.priceAlerts.push(alert);
    this.saveAlertsToStorage();

    return alert;
  }

  // Check for triggered alerts
  async checkPriceAlerts(): Promise<PriceAlert[]> {
    const triggeredAlerts: PriceAlert[] = [];

    for (const alert of this.priceAlerts) {
      if (!alert.isActive || alert.triggeredAt) continue;

      try {
        const prices = await this.getCropPrices(alert.crop);
        const currentPrice = prices[0]?.currentPrice;

        if (currentPrice && this.shouldTriggerAlert(alert, currentPrice)) {
          alert.triggeredAt = new Date().toISOString();
          alert.isActive = false;
          triggeredAlerts.push(alert);
        }
      } catch (error) {
        console.error(`Error checking alert for ${alert.crop}:`, error);
      }
    }

    if (triggeredAlerts.length > 0) {
      this.saveAlertsToStorage();
    }

    return triggeredAlerts;
  }

  // Get MSP (Minimum Support Price) information
  getMSPInfo(cropName: string): { msp: number; year: string; increase: number } {
    const mspData: { [key: string]: { msp: number; year: string; increase: number } } = {
      wheat: { msp: 2125, year: '2023-24', increase: 5.5 },
      rice: { msp: 2183, year: '2023-24', increase: 7.0 },
      cotton: { msp: 6380, year: '2023-24', increase: 6.2 },
      mustard: { msp: 5650, year: '2023-24', increase: 8.1 }
    };

    return mspData[cropName.toLowerCase()] || { msp: 0, year: '2023-24', increase: 0 };
  }

  // Get seasonal price patterns
  getSeasonalPatterns(cropName: string): Array<{ month: string; priceIndex: number; description: string }> {
    const patterns: { [key: string]: Array<{ month: string; priceIndex: number; description: string }> } = {
      wheat: [
        { month: 'जनवरी', priceIndex: 105, description: 'हार्वेस्ट से पहले उच्च मांग' },
        { month: 'फरवरी', priceIndex: 98, description: 'हार्वेस्ट शुरू, कीमतें स्थिर' },
        { month: 'मार्च', priceIndex: 92, description: 'मुख्य हार्वेस्ट, सप्लाई बढ़ी' },
        { month: 'अप्रैल', priceIndex: 88, description: 'साल की सबसे कम कीमत' },
        { month: 'मई', priceIndex: 95, description: 'भंडारण की मांग' },
        { month: 'जून', priceIndex: 102, description: 'मानसून से पहले स्टॉकिंग' }
      ],
      rice: [
        { month: 'सितंबर', priceIndex: 95, description: 'नई फसल आने से पहले' },
        { month: 'अक्टूबर', priceIndex: 88, description: 'हार्वेस्ट सीजन, कम दाम' },
        { month: 'नवंबर', priceIndex: 92, description: 'त्योहारी मांग' },
        { month: 'दिसंबर', priceIndex: 98, description: 'सर्दी की मांग' },
        { month: 'जनवरी', priceIndex: 105, description: 'स्टॉक कम, कीमत बढ़ी' },
        { month: 'फरवरी', priceIndex: 108, description: 'साल की सबसे ज्यादा कीमत' }
      ]
    };

    return patterns[cropName.toLowerCase()] || [];
  }

  // Helper methods
  private isCacheValid(lastUpdated: string): boolean {
    const updateTime = new Date(lastUpdated).getTime();
    return (Date.now() - updateTime) < this.cacheExpiration;
  }

  private addPriceVariation(basePrice: number): number {
    // Add ±2% random variation to simulate real-time price changes
    const variation = (Math.random() - 0.5) * 0.04;
    return Math.round(basePrice * (1 + variation));
  }

  private adjustPricesForLocation(prices: CropPrice[], location: { lat: number; lng: number }): CropPrice[] {
    // In a real implementation, this would adjust prices based on:
    // - Transportation costs from mandis
    // - Regional demand/supply
    // - Local market conditions
    return prices;
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getRecommendationLevel(netPrice: number, grossPrice: number): 'highly_recommended' | 'recommended' | 'consider' | 'avoid' {
    const profitMargin = (netPrice / grossPrice) * 100;
    
    if (profitMargin >= 90) return 'highly_recommended';
    if (profitMargin >= 80) return 'recommended';
    if (profitMargin >= 70) return 'consider';
    return 'avoid';
  }

  private getBestOptionReason(comparison: any): string {
    const reasons = [
      'सबसे अच्छी कीमत और कम ट्रांसपोर्टेशन कॉस्ट',
      'उत्कृष्ट बाजार सुविधाएं और तत्काल भुगतान',
      'नजदीकी स्थान और विश्वसनीय व्यापारी',
      'बेहतर गुणवत्ता की पहचान और फेयर ट्रेडिंग'
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private generatePros(comparison: any): string[] {
    const allPros = [
      'अच्छी कीमत मिल रही है',
      'नजदीकी स्थान',
      'अच्छी सुविधाएं',
      'तत्काल भुगतान',
      'गुणवत्ता की जांच',
      'कम ट्रांसपोर्टेशन कॉस्ट'
    ];
    
    return allPros.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private generateCons(comparison: any): string[] {
    const allCons = [
      'अधिक दूरी',
      'ट्रांसपोर्टेशन कॉस्ट ज्यादा',
      'भीड़भाड़',
      'भुगतान में देरी हो सकती है',
      'कम सुविधाएं'
    ];
    
    return allCons.slice(0, 1 + Math.floor(Math.random() * 2));
  }

  private generateHistoricalData(cropName: string, period: string): Array<{ date: string; price: number; volume: number }> {
    const days = period === 'daily' ? 30 : period === 'weekly' ? 12 : 6;
    const data = [];
    const basePrice = mockPriceData[cropName.toLowerCase()]?.[0]?.currentPrice || 2000;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const priceVariation = (Math.random() - 0.5) * 0.15;
      const price = Math.round(basePrice * (1 + priceVariation));
      const volume = Math.round(1000 + Math.random() * 2000);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price,
        volume
      });
    }
    
    return data;
  }

  private generatePriceForecast(cropName: string, historicalData: any[]): Array<{ date: string; predictedPrice: number; confidence: number }> {
    const forecast = [];
    const lastPrice = historicalData[historicalData.length - 1]?.price || 2000;
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const trend = (Math.random() - 0.45) * 0.05; // Slight upward bias
      const predictedPrice = Math.round(lastPrice * (1 + trend));
      const confidence = Math.round(85 - (i * 5) + Math.random() * 10);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedPrice,
        confidence: Math.max(60, Math.min(95, confidence))
      });
    }
    
    return forecast;
  }

  private analyzeMarketTrends(data: any[]) {
    const prices = data.map(d => d.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, price) => a + Math.pow(price - avgPrice, 2), 0) / prices.length;
    const volatility = Math.round((Math.sqrt(variance) / avgPrice) * 100);
    
    return {
      volatility: Math.min(100, volatility),
      seasonality: volatility > 15 ? 'high' : volatility > 8 ? 'medium' : 'low',
      marketSentiment: prices[prices.length - 1] > avgPrice ? 'bullish' : prices[prices.length - 1] < avgPrice ? 'bearish' : 'neutral',
      priceStability: Math.max(0, 100 - volatility)
    };
  }

  private getCropCosts(cropName: string, farmSize: number): ProfitCalculation['costs'] {
    const costPerAcre: { [key: string]: ProfitCalculation['costs'] } = {
      wheat: {
        seeds: 3500,
        fertilizers: 8500,
        pesticides: 2500,
        labor: 12000,
        irrigation: 6000,
        harvesting: 4000,
        transportation: 2000,
        other: 3000
      },
      rice: {
        seeds: 4000,
        fertilizers: 10000,
        pesticides: 3000,
        labor: 15000,
        irrigation: 8000,
        harvesting: 5000,
        transportation: 2500,
        other: 3500
      }
    };

    const baseCosts = costPerAcre[cropName.toLowerCase()] || costPerAcre.wheat;
    
    // Scale costs by farm size
    return Object.fromEntries(
      Object.entries(baseCosts).map(([key, value]) => [key, value * farmSize])
    ) as ProfitCalculation['costs'];
  }

  private getExpectedYield(cropName: string, farmSize: number): number {
    const yieldPerAcre: { [key: string]: number } = {
      wheat: 35, // quintals per acre
      rice: 40,
      cotton: 8,
      mustard: 12
    };

    return (yieldPerAcre[cropName.toLowerCase()] || 30) * farmSize;
  }

  private calculatePaybackPeriod(cropName: string): number {
    const cropCycles: { [key: string]: number } = {
      wheat: 4, // months
      rice: 4,
      cotton: 6,
      sugarcane: 12
    };

    return cropCycles[cropName.toLowerCase()] || 4;
  }

  private getFallbackPrices(cropName: string): CropPrice[] {
    return [{
      crop: cropName,
      hindiName: cropName,
      variety: 'सामान्य',
      currentPrice: 2000,
      unit: 'quintal',
      previousPrice: 1950,
      changePercent: 2.56,
      trend: 'up',
      minPrice: 1900,
      maxPrice: 2100,
      avgPrice: 1975,
      qualityGrade: 'FAQ',
      lastUpdated: new Date().toISOString()
    }];
  }

  private shouldTriggerAlert(alert: PriceAlert, currentPrice: number): boolean {
    return alert.condition === 'above' ? 
           currentPrice >= alert.targetPrice : 
           currentPrice <= alert.targetPrice;
  }

  // Storage methods for alerts
  private saveAlertsToStorage(): void {
    try {
      localStorage.setItem('market_price_alerts', JSON.stringify(this.priceAlerts));
    } catch (error) {
      console.error('Error saving price alerts:', error);
    }
  }

  private loadAlertsFromStorage(): void {
    try {
      const stored = localStorage.getItem('market_price_alerts');
      if (stored) {
        this.priceAlerts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading price alerts:', error);
      this.priceAlerts = [];
    }
  }

  // Public methods for managing alerts
  getPriceAlerts(): PriceAlert[] {
    return this.priceAlerts;
  }

  deleteAlert(alertId: string): boolean {
    const index = this.priceAlerts.findIndex(alert => alert.id === alertId);
    if (index !== -1) {
      this.priceAlerts.splice(index, 1);
      this.saveAlertsToStorage();
      return true;
    }
    return false;
  }

  toggleAlert(alertId: string): boolean {
    const alert = this.priceAlerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.isActive = !alert.isActive;
      this.saveAlertsToStorage();
      return true;
    }
    return false;
  }

  // Batch price fetching for dashboard
  async getDashboardPrices(crops: string[], location?: { lat: number; lng: number }): Promise<{ [crop: string]: CropPrice }> {
    const results: { [crop: string]: CropPrice } = {};
    
    for (const crop of crops) {
      try {
        const prices = await this.getCropPrices(crop, location);
        if (prices.length > 0) {
          results[crop] = prices[0]; // Best price
        }
      } catch (error) {
        console.error(`Error fetching price for ${crop}:`, error);
      }
    }
    
    return results;
  }

  // Clear all caches
  clearCache(): void {
    this.priceCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.priceCache.size,
      keys: Array.from(this.priceCache.keys())
    };
  }
}

export const marketPriceService = new MarketPriceService();
export default marketPriceService;