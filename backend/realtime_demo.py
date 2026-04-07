"""
Real-time Crop Recommendation Demo for Farmers
Ye script dikhata hai ki real-time mein kaise crop recommendation milegi
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any

class RealtimeCropRecommendation:
    """Real-time crop recommendation system for farmers"""
    
    def __init__(self):
        # Sample farmer location (Pune, Maharashtra)
        self.current_location = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "district": "Pune",
            "state": "Maharashtra"
        }
        
        # Current season and weather
        self.current_season = self._get_current_season()
        self.weather_data = self._get_current_weather()
    
    def _get_current_season(self) -> str:
        """Current season identify karo"""
        month = datetime.now().month
        
        if month in [6, 7, 8, 9, 10]:  # June to October
            return "kharif"
        elif month in [11, 12, 1, 2, 3]:  # November to March
            return "rabi"
        else:  # April to June
            return "zaid"
    
    def _get_current_weather(self) -> Dict[str, Any]:
        """Current weather conditions (simulated)"""
        return {
            "temperature": 28.5,
            "humidity": 65,
            "rainfall_last_week": 15.2,
            "wind_speed": 12.3,
            "soil_temperature": 26.8,
            "weather_condition": "partly_cloudy"
        }
    
    def _analyze_soil_realtime(self) -> Dict[str, Any]:
        """Real-time soil analysis (simulated)"""
        return {
            "soil_type": "black_soil",
            "pH": 7.2,
            "moisture_level": 42.5,
            "organic_matter": 2.8,
            "nitrogen": {"level": 245, "status": "good"},
            "phosphorus": {"level": 18, "status": "medium"},
            "potassium": {"level": 180, "status": "good"},
            "fertility_index": 75.5
        }
    
    def _get_market_prices(self) -> Dict[str, Dict[str, Any]]:
        """Current market prices"""
        return {
            "wheat": {
                "current_price": 2150,
                "trend": "rising",
                "demand": "high",
                "profit_potential": 8.5
            },
            "cotton": {
                "current_price": 5800,
                "trend": "stable", 
                "demand": "medium",
                "profit_potential": 7.2
            },
            "soybean": {
                "current_price": 4200,
                "trend": "rising",
                "demand": "high",
                "profit_potential": 8.8
            },
            "sugarcane": {
                "current_price": 3200,
                "trend": "stable",
                "demand": "medium",
                "profit_potential": 6.5
            },
            "onion": {
                "current_price": 2800,
                "trend": "volatile",
                "demand": "high",
                "profit_potential": 9.2
            }
        }
    
    def _calculate_crop_suitability(self, crop: str, soil_data: Dict, weather_data: Dict, market_data: Dict) -> float:
        """Crop suitability score calculate karo"""
        suitability_scores = {
            "wheat": {
                "soil_requirements": {"pH_min": 6.0, "pH_max": 7.5, "fertility_min": 60},
                "weather_requirements": {"temp_min": 15, "temp_max": 25, "rainfall_min": 30},
                "season": ["rabi"]
            },
            "cotton": {
                "soil_requirements": {"pH_min": 5.8, "pH_max": 8.0, "fertility_min": 65},
                "weather_requirements": {"temp_min": 21, "temp_max": 30, "rainfall_min": 50},
                "season": ["kharif"]
            },
            "soybean": {
                "soil_requirements": {"pH_min": 6.0, "pH_max": 7.0, "fertility_min": 70},
                "weather_requirements": {"temp_min": 20, "temp_max": 30, "rainfall_min": 40},
                "season": ["kharif"]
            },
            "sugarcane": {
                "soil_requirements": {"pH_min": 6.5, "pH_max": 7.5, "fertility_min": 75},
                "weather_requirements": {"temp_min": 21, "temp_max": 27, "rainfall_min": 75},
                "season": ["kharif"]
            },
            "onion": {
                "soil_requirements": {"pH_min": 6.0, "pH_max": 7.0, "fertility_min": 65},
                "weather_requirements": {"temp_min": 13, "temp_max": 24, "rainfall_min": 25},
                "season": ["rabi", "kharif"]
            }
        }
        
        if crop not in suitability_scores:
            return 0.0
        
        crop_req = suitability_scores[crop]
        score = 0.0
        
        # Soil suitability
        soil_req = crop_req["soil_requirements"]
        if soil_req["pH_min"] <= soil_data["pH"] <= soil_req["pH_max"]:
            score += 30
        if soil_data["fertility_index"] >= soil_req["fertility_min"]:
            score += 25
        
        # Weather suitability
        weather_req = crop_req["weather_requirements"]
        temp = weather_data["temperature"]
        if weather_req["temp_min"] <= temp <= weather_req["temp_max"]:
            score += 25
        
        # Season suitability
        if self.current_season in crop_req["season"]:
            score += 15
        
        # Market factor
        market_score = market_data.get("profit_potential", 5) / 10 * 5
        score += market_score
        
        return min(score, 100)
    
    async def get_realtime_recommendation(self) -> Dict[str, Any]:
        """Real-time crop recommendation generate karo"""
        print("🔍 Analyzing your field in real-time...")
        
        # Step 1: Soil Analysis
        print("📍 Location detected: Pune, Maharashtra")
        soil_data = self._analyze_soil_realtime()
        print(f"🌱 Soil Type: {soil_data['soil_type']}")
        print(f"🧪 Soil pH: {soil_data['pH']}")
        print(f"💧 Moisture: {soil_data['moisture_level']}%")
        
        # Step 2: Weather Analysis
        print(f"🌡️ Current Temperature: {self.weather_data['temperature']}°C")
        print(f"☔ Recent Rainfall: {self.weather_data['rainfall_last_week']}mm")
        print(f"📅 Current Season: {self.current_season.upper()}")
        
        # Step 3: Market Analysis
        market_data = self._get_market_prices()
        print("💰 Fetching current market prices...")
        
        # Step 4: Calculate recommendations
        print("🤖 AI analyzing best crops for your field...")
        
        crop_recommendations = []
        for crop, market_info in market_data.items():
            suitability_score = self._calculate_crop_suitability(
                crop, soil_data, self.weather_data, market_info
            )
            
            crop_recommendations.append({
                "crop": crop,
                "suitability_score": suitability_score,
                "market_price": market_info["current_price"],
                "price_trend": market_info["trend"],
                "profit_potential": market_info["profit_potential"],
                "recommendation_reason": self._get_recommendation_reason(crop, suitability_score, market_info)
            })
        
        # Sort by suitability score
        crop_recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
        
        # Generate final recommendation
        recommendation = {
            "timestamp": datetime.now().isoformat(),
            "location": self.current_location,
            "season": self.current_season,
            "soil_analysis": soil_data,
            "weather_analysis": self.weather_data,
            "top_recommendations": crop_recommendations[:3],
            "market_insights": self._generate_market_insights(crop_recommendations),
            "farming_tips": self._generate_farming_tips(soil_data, self.current_season)
        }
        
        return recommendation
    
    def _get_recommendation_reason(self, crop: str, score: float, market_info: Dict) -> str:
        """Recommendation reason generate karo"""
        reasons = []
        
        if score >= 80:
            reasons.append("Excellent soil and weather match")
        elif score >= 60:
            reasons.append("Good growing conditions")
        else:
            reasons.append("Moderate suitability")
        
        if market_info["profit_potential"] >= 8:
            reasons.append("High profit potential")
        elif market_info["profit_potential"] >= 6:
            reasons.append("Good market demand")
        
        if market_info["trend"] == "rising":
            reasons.append("Rising market prices")
        
        return ", ".join(reasons)
    
    def _generate_market_insights(self, recommendations: List[Dict]) -> List[str]:
        """Market insights generate karo"""
        insights = []
        
        best_crop = recommendations[0]
        if best_crop["price_trend"] == "rising":
            insights.append(f"💹 {best_crop['crop'].title()} prices are rising - good time to plant!")
        
        high_profit_crops = [r for r in recommendations if r["profit_potential"] >= 8]
        if high_profit_crops:
            crops_list = ", ".join([c["crop"] for c in high_profit_crops])
            insights.append(f"🎯 High profit crops: {crops_list}")
        
        return insights
    
    def _generate_farming_tips(self, soil_data: Dict, season: str) -> List[str]:
        """Farming tips generate karo"""
        tips = []
        
        if soil_data["pH"] > 7.5:
            tips.append("🧪 Soil slightly alkaline - consider adding organic matter")
        elif soil_data["pH"] < 6.0:
            tips.append("🧪 Soil acidic - lime application recommended")
        
        if soil_data["moisture_level"] < 30:
            tips.append("💧 Increase irrigation frequency")
        elif soil_data["moisture_level"] > 70:
            tips.append("💧 Ensure proper drainage")
        
        if season == "kharif":
            tips.append("🌧️ Monsoon season - focus on water-intensive crops")
        elif season == "rabi":
            tips.append("❄️ Winter season - choose cold-resistant varieties")
        
        return tips
    
    def display_recommendation(self, recommendation: Dict):
        """User-friendly recommendation display"""
        print("\n" + "="*60)
        print("🎯 REAL-TIME CROP RECOMMENDATION FOR YOUR FIELD")
        print("="*60)
        
        print(f"\n📍 Location: {recommendation['location']['district']}, {recommendation['location']['state']}")
        print(f"📅 Analysis Time: {recommendation['timestamp']}")
        print(f"🌾 Current Season: {recommendation['season'].upper()}")
        
        print("\n🏆 TOP 3 RECOMMENDED CROPS:")
        print("-" * 40)
        
        for i, crop_rec in enumerate(recommendation['top_recommendations'], 1):
            print(f"\n{i}. {crop_rec['crop'].upper()}")
            print(f"   ✅ Suitability Score: {crop_rec['suitability_score']:.1f}/100")
            print(f"   💰 Current Price: ₹{crop_rec['market_price']}/quintal")
            print(f"   📈 Price Trend: {crop_rec['price_trend']}")
            print(f"   🎯 Profit Potential: {crop_rec['profit_potential']}/10")
            print(f"   💡 Why: {crop_rec['recommendation_reason']}")
        
        print(f"\n🌱 SOIL ANALYSIS:")
        print(f"   • Soil Type: {recommendation['soil_analysis']['soil_type']}")
        print(f"   • pH Level: {recommendation['soil_analysis']['pH']}")
        print(f"   • Fertility Index: {recommendation['soil_analysis']['fertility_index']}/100")
        print(f"   • Moisture Level: {recommendation['soil_analysis']['moisture_level']}%")
        
        print(f"\n🌡️ WEATHER CONDITIONS:")
        print(f"   • Temperature: {recommendation['weather_analysis']['temperature']}°C")
        print(f"   • Humidity: {recommendation['weather_analysis']['humidity']}%")
        print(f"   • Recent Rainfall: {recommendation['weather_analysis']['rainfall_last_week']}mm")
        
        if recommendation['market_insights']:
            print(f"\n💡 MARKET INSIGHTS:")
            for insight in recommendation['market_insights']:
                print(f"   • {insight}")
        
        if recommendation['farming_tips']:
            print(f"\n🚜 FARMING TIPS:")
            for tip in recommendation['farming_tips']:
                print(f"   • {tip}")
        
        print("\n" + "="*60)


# Demo function
async def run_realtime_demo():
    """Real-time recommendation demo run karo"""
    print("🚜 KISANGPT REAL-TIME CROP RECOMMENDATION DEMO")
    print("Simulating farmer visiting field with mobile app...\n")
    
    # Initialize recommendation system
    recommender = RealtimeCropRecommendation()
    
    # Get real-time recommendation
    recommendation = await recommender.get_realtime_recommendation()
    
    # Display results
    recommender.display_recommendation(recommendation)
    
    print("\n🌾 Real-time analysis complete!")
    print("💡 This is how KisanGPT will work when you visit your field!")


if __name__ == "__main__":
    # Run the demo
    asyncio.run(run_realtime_demo())