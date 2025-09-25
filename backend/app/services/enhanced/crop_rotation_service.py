"""
Crop Rotation Analysis Service for KisanGPT
Analyzes past crop history, calculates soil fertility impact, and suggests optimal rotation schedules
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from loguru import logger
import json

from app.core.config import settings


class CropRotationService:
    """Service for analyzing crop rotation patterns and sustainability"""
    
    def __init__(self):
        self.crop_categories = self._initialize_crop_categories()
        self.crop_nutrient_profiles = self._initialize_nutrient_profiles()
        self.rotation_rules = self._initialize_rotation_rules()
        self.sustainability_weights = {
            "soil_health": 0.3,
            "nutrient_balance": 0.25,
            "pest_disease_control": 0.2,
            "yield_stability": 0.15,
            "economic_return": 0.1
        }
    
    def _initialize_crop_categories(self) -> Dict[str, Dict[str, Any]]:
        """Initialize crop categories with their characteristics"""
        return {
            "cereals": {
                "crops": ["rice", "wheat", "maize", "sorghum", "millet", "barley"],
                "root_type": "fibrous",
                "nitrogen_demand": "high",
                "growth_habit": "annual",
                "soil_depth": "medium"
            },
            "legumes": {
                "crops": ["soybean", "gram", "arhar", "moong", "urad", "groundnut"],
                "root_type": "taproot",
                "nitrogen_demand": "low",  # Fixes nitrogen
                "growth_habit": "annual",
                "soil_depth": "deep",
                "nitrogen_fixation": True
            },
            "oilseeds": {
                "crops": ["mustard", "sesame", "sunflower", "safflower", "niger"],
                "root_type": "taproot",
                "nitrogen_demand": "medium",
                "growth_habit": "annual",
                "soil_depth": "medium"
            },
            "cash_crops": {
                "crops": ["cotton", "sugarcane", "tobacco"],
                "root_type": "taproot",
                "nitrogen_demand": "very_high",
                "growth_habit": "perennial_annual",
                "soil_depth": "deep"
            },
            "vegetables": {
                "crops": ["tomato", "onion", "potato", "cabbage", "cauliflower", "brinjal"],
                "root_type": "fibrous",
                "nitrogen_demand": "high",
                "growth_habit": "annual",
                "soil_depth": "shallow"
            },
            "fodder": {
                "crops": ["alfalfa", "berseem", "oats", "maize_fodder"],
                "root_type": "fibrous",
                "nitrogen_demand": "medium",
                "growth_habit": "annual",
                "soil_depth": "medium"
            }
        }
    
    def _initialize_nutrient_profiles(self) -> Dict[str, Dict[str, float]]:
        """Initialize nutrient uptake/addition profiles for crops"""
        return {
            # Cereals - Heavy nutrient consumers
            "rice": {"N": -120, "P": -25, "K": -80, "organic_matter": -0.5},
            "wheat": {"N": -100, "P": -20, "K": -60, "organic_matter": -0.3},
            "maize": {"N": -140, "P": -30, "K": -100, "organic_matter": -0.4},
            "sorghum": {"N": -80, "P": -15, "K": -50, "organic_matter": -0.2},
            
            # Legumes - Nitrogen fixers
            "soybean": {"N": 60, "P": -20, "K": -80, "organic_matter": 0.8},
            "gram": {"N": 40, "P": -15, "K": -40, "organic_matter": 0.6},
            "arhar": {"N": 80, "P": -25, "K": -60, "organic_matter": 1.0},
            "groundnut": {"N": 50, "P": -20, "K": -70, "organic_matter": 0.7},
            
            # Oilseeds
            "mustard": {"N": -90, "P": -18, "K": -50, "organic_matter": -0.2},
            "sunflower": {"N": -100, "P": -22, "K": -80, "organic_matter": -0.3},
            
            # Cash crops - Very demanding
            "cotton": {"N": -150, "P": -35, "K": -120, "organic_matter": -0.6},
            "sugarcane": {"N": -200, "P": -40, "K": -180, "organic_matter": -0.8},
            
            # Vegetables
            "tomato": {"N": -130, "P": -28, "K": -150, "organic_matter": -0.4},
            "onion": {"N": -80, "P": -15, "K": -60, "organic_matter": -0.2},
            "potato": {"N": -110, "P": -25, "K": -140, "organic_matter": -0.3},
            
            # Fodder crops
            "berseem": {"N": 30, "P": -10, "K": -30, "organic_matter": 0.5},
            "alfalfa": {"N": 100, "P": -15, "K": -50, "organic_matter": 1.2}
        }
    
    def _initialize_rotation_rules(self) -> Dict[str, List[str]]:
        """Initialize crop rotation compatibility rules"""
        return {
            # Good successors for each crop category
            "cereals": ["legumes", "oilseeds", "fodder"],
            "legumes": ["cereals", "cash_crops", "vegetables"],
            "oilseeds": ["cereals", "legumes"],
            "cash_crops": ["legumes", "fodder"],
            "vegetables": ["legumes", "cereals"],
            "fodder": ["cereals", "cash_crops", "vegetables"],
            
            # Avoid continuous cultivation
            "avoid_continuous": ["cotton", "sugarcane", "rice", "tomato"],
            
            # Recommended gaps (in seasons)
            "minimum_gap": {
                "cotton": 2,
                "tomato": 2, 
                "sugarcane": 4,
                "rice": 1
            }
        }
    
    async def analyze_crop_history(
        self,
        farm_id: str,
        field_coordinates: Dict[str, float],
        years: int = 5
    ) -> Dict[str, Any]:
        """
        Analyze crop history for a farm field
        
        Args:
            farm_id: Farm identifier
            field_coordinates: Field GPS coordinates
            years: Number of years of history to analyze
            
        Returns:
            Comprehensive crop history analysis
        """
        try:
            logger.info(f"Analyzing crop history for farm {farm_id} over {years} years")
            
            # Get crop history (in production, fetch from database)
            crop_history = await self._get_crop_history(farm_id, years)
            
            if not crop_history:
                return self._get_default_analysis(farm_id, field_coordinates)
            
            # Analyze cropping patterns
            pattern_analysis = self._analyze_cropping_patterns(crop_history)
            
            # Calculate soil nutrient depletion/enhancement
            nutrient_impact = self._calculate_nutrient_impact(crop_history)
            
            # Assess sustainability metrics
            sustainability_metrics = self._assess_sustainability(crop_history)
            
            # Identify potential issues
            issues = self._identify_rotation_issues(crop_history, pattern_analysis)
            
            return {
                "farm_id": farm_id,
                "field_coordinates": field_coordinates,
                "analysis_period_years": years,
                "crop_history": crop_history,
                "pattern_analysis": pattern_analysis,
                "nutrient_impact": nutrient_impact,
                "sustainability_metrics": sustainability_metrics,
                "identified_issues": issues,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing crop history: {e}")
            return {"error": f"Could not analyze crop history: {str(e)}"}
    
    async def recommend_rotation_schedule(
        self,
        farm_id: str,
        current_crop: Optional[str] = None,
        field_size_hectares: float = 1.0,
        soil_type: str = "mixed_soil",
        climate_zone: str = "semi_arid",
        planning_years: int = 3
    ) -> Dict[str, Any]:
        """
        Recommend optimal crop rotation schedule
        
        Args:
            farm_id: Farm identifier
            current_crop: Currently grown crop
            field_size_hectares: Field size in hectares
            soil_type: Soil type classification
            climate_zone: Climate classification
            planning_years: Number of years to plan ahead
            
        Returns:
            Recommended rotation schedule with sustainability scores
        """
        try:
            logger.info(f"Generating rotation recommendations for farm {farm_id}")
            
            # Get crop history for context
            crop_history = await self._get_crop_history(farm_id, 3)
            
            # Generate rotation options
            rotation_options = self._generate_rotation_options(
                current_crop, soil_type, climate_zone, planning_years, crop_history
            )
            
            # Evaluate each rotation option
            evaluated_rotations = []
            for rotation in rotation_options:
                evaluation = self._evaluate_rotation(rotation, soil_type, field_size_hectares)
                evaluated_rotations.append({
                    "rotation": rotation,
                    "evaluation": evaluation
                })
            
            # Sort by sustainability score
            evaluated_rotations.sort(key=lambda x: x["evaluation"]["sustainability_score"], reverse=True)
            
            # Generate detailed recommendations for top options
            top_rotations = evaluated_rotations[:3]
            detailed_recommendations = []
            
            for i, rot in enumerate(top_rotations):
                detailed_rec = self._generate_detailed_recommendation(
                    rot["rotation"], rot["evaluation"], i+1
                )
                detailed_recommendations.append(detailed_rec)
            
            return {
                "farm_id": farm_id,
                "current_crop": current_crop,
                "field_characteristics": {
                    "size_hectares": field_size_hectares,
                    "soil_type": soil_type,
                    "climate_zone": climate_zone
                },
                "planning_period_years": planning_years,
                "recommended_rotations": detailed_recommendations,
                "general_principles": self._get_rotation_principles(),
                "recommendation_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating rotation recommendations: {e}")
            return {"error": f"Could not generate rotation recommendations: {str(e)}"}
    
    async def _get_crop_history(self, farm_id: str, years: int) -> List[Dict[str, Any]]:
        """Fetch crop history from database"""
        # In production, this would query the database
        # For now, generate realistic sample history
        
        sample_crops = ["rice", "wheat", "soybean", "cotton", "maize", "gram"]
        seasons = ["kharif", "rabi", "zaid"]
        history = []
        
        current_date = datetime.now()
        
        for year_offset in range(years):
            for season in seasons[:2]:  # Only kharif and rabi for simplicity
                crop_date = current_date - timedelta(days=365 * year_offset + (180 if season == "kharif" else 0))
                
                # Simulate realistic crop selection
                if season == "kharif":
                    crop = np.random.choice(["rice", "cotton", "soybean", "maize"], p=[0.3, 0.3, 0.2, 0.2])
                else:  # rabi
                    crop = np.random.choice(["wheat", "gram", "mustard", "onion"], p=[0.4, 0.3, 0.2, 0.1])
                
                history.append({
                    "year": crop_date.year,
                    "season": season,
                    "crop": crop,
                    "area_hectares": np.random.uniform(0.5, 2.0),
                    "yield_per_hectare": self._get_typical_yield(crop),
                    "input_costs": np.random.uniform(15000, 50000),  # INR per hectare
                    "market_price": self._get_typical_price(crop),
                    "profit_per_hectare": np.random.uniform(-5000, 25000)
                })
        
        return sorted(history, key=lambda x: (x["year"], x["season"]))
    
    def _get_typical_yield(self, crop: str) -> float:
        """Get typical yield for crop (tonnes per hectare)"""
        typical_yields = {
            "rice": 3.5, "wheat": 3.0, "maize": 5.0, "sorghum": 2.5,
            "soybean": 1.8, "gram": 1.2, "groundnut": 2.2,
            "cotton": 1.5, "sugarcane": 70.0,
            "tomato": 25.0, "onion": 20.0, "potato": 22.0,
            "mustard": 1.5, "sunflower": 1.8
        }
        base_yield = typical_yields.get(crop, 2.0)
        return max(0.5, np.random.normal(base_yield, base_yield * 0.2))
    
    def _get_typical_price(self, crop: str) -> float:
        """Get typical market price (INR per quintal)"""
        typical_prices = {
            "rice": 2800, "wheat": 2200, "maize": 2000, "sorghum": 2500,
            "soybean": 4200, "gram": 5200, "groundnut": 5000,
            "cotton": 5500, "sugarcane": 280,
            "tomato": 2500, "onion": 1800, "potato": 1600,
            "mustard": 4800, "sunflower": 4500
        }
        base_price = typical_prices.get(crop, 2500)
        return max(1000, np.random.normal(base_price, base_price * 0.15))
    
    def _analyze_cropping_patterns(self, crop_history: List[Dict]) -> Dict[str, Any]:
        """Analyze cropping patterns from history"""
        
        # Crop frequency analysis
        crop_frequency = {}
        season_patterns = {"kharif": {}, "rabi": {}, "zaid": {}}
        
        for record in crop_history:
            crop = record["crop"]
            season = record["season"]
            
            # Overall frequency
            crop_frequency[crop] = crop_frequency.get(crop, 0) + 1
            
            # Seasonal patterns
            season_patterns[season][crop] = season_patterns[season].get(crop, 0) + 1
        
        # Detect monoculture risk
        total_records = len(crop_history)
        dominant_crop = max(crop_frequency.items(), key=lambda x: x[1]) if crop_frequency else ("none", 0)
        monoculture_risk = dominant_crop[1] / total_records if total_records > 0 else 0
        
        # Crop category diversity
        categories_used = set()
        for crop in crop_frequency.keys():
            category = self._get_crop_category(crop)
            if category:
                categories_used.add(category)
        
        diversity_score = len(categories_used) / len(self.crop_categories) * 100
        
        return {
            "crop_frequency": crop_frequency,
            "seasonal_patterns": season_patterns,
            "dominant_crop": dominant_crop[0],
            "monoculture_risk_percent": round(monoculture_risk * 100, 1),
            "diversity_score": round(diversity_score, 1),
            "categories_used": list(categories_used),
            "total_seasons_analyzed": total_records
        }
    
    def _calculate_nutrient_impact(self, crop_history: List[Dict]) -> Dict[str, Any]:
        """Calculate cumulative nutrient impact on soil"""
        
        cumulative_impact = {"N": 0, "P": 0, "K": 0, "organic_matter": 0}
        yearly_impact = {}
        
        for record in crop_history:
            crop = record["crop"]
            year = record["year"]
            area = record["area_hectares"]
            
            if crop in self.crop_nutrient_profiles:
                profile = self.crop_nutrient_profiles[crop]
                
                # Calculate impact for this crop
                for nutrient, impact_per_ha in profile.items():
                    impact = impact_per_ha * area
                    cumulative_impact[nutrient] += impact
                    
                    # Track yearly trends
                    if year not in yearly_impact:
                        yearly_impact[year] = {"N": 0, "P": 0, "K": 0, "organic_matter": 0}
                    yearly_impact[year][nutrient] += impact
        
        # Calculate nutrient balance status
        nutrient_status = {}
        for nutrient, cumulative in cumulative_impact.items():
            if cumulative > 20:
                status = "surplus"
            elif cumulative < -50:
                status = "severely_depleted"
            elif cumulative < -20:
                status = "depleted"
            else:
                status = "balanced"
            
            nutrient_status[nutrient] = {
                "cumulative_impact": round(cumulative, 1),
                "status": status,
                "recommendation": self._get_nutrient_recommendation(nutrient, status)
            }
        
        return {
            "cumulative_impact": cumulative_impact,
            "nutrient_status": nutrient_status,
            "yearly_trends": yearly_impact,
            "overall_soil_health": self._assess_soil_health_from_nutrients(cumulative_impact)
        }
    
    def _assess_sustainability(self, crop_history: List[Dict]) -> Dict[str, Any]:
        """Assess sustainability metrics"""
        
        # Economic sustainability
        profits = [r.get("profit_per_hectare", 0) for r in crop_history]
        avg_profit = np.mean(profits) if profits else 0
        profit_stability = 1 - (np.std(profits) / abs(avg_profit)) if avg_profit != 0 else 0
        
        # Environmental sustainability
        legume_frequency = sum(1 for r in crop_history if self._get_crop_category(r["crop"]) == "legumes")
        legume_ratio = legume_frequency / len(crop_history) if crop_history else 0
        
        # Yield sustainability
        yields_by_crop = {}
        for record in crop_history:
            crop = record["crop"]
            yield_val = record.get("yield_per_hectare", 0)
            if crop not in yields_by_crop:
                yields_by_crop[crop] = []
            yields_by_crop[crop].append(yield_val)
        
        # Calculate yield trends
        yield_trends = {}
        for crop, yields in yields_by_crop.items():
            if len(yields) >= 3:
                # Simple trend calculation
                x = np.arange(len(yields))
                z = np.polyfit(x, yields, 1)
                trend_slope = z[0]
                yield_trends[crop] = "increasing" if trend_slope > 0.1 else "decreasing" if trend_slope < -0.1 else "stable"
        
        # Overall sustainability score
        sustainability_components = {
            "economic_stability": min(100, max(0, profit_stability * 100)),
            "environmental_balance": min(100, legume_ratio * 200),  # Legumes contribute to soil health
            "yield_sustainability": 75 if len([t for t in yield_trends.values() if t != "decreasing"]) > len([t for t in yield_trends.values() if t == "decreasing"]) else 45
        }
        
        overall_score = sum(
            sustainability_components[component] * self.sustainability_weights.get(component.split("_")[0], 0.2)
            for component in sustainability_components
        )
        
        return {
            "economic_metrics": {
                "average_profit_per_hectare": round(avg_profit, 0),
                "profit_stability_score": round(profit_stability * 100, 1)
            },
            "environmental_metrics": {
                "legume_inclusion_ratio": round(legume_ratio * 100, 1),
                "nitrogen_fixation_potential": "high" if legume_ratio > 0.3 else "medium" if legume_ratio > 0.1 else "low"
            },
            "yield_trends": yield_trends,
            "sustainability_components": sustainability_components,
            "overall_sustainability_score": round(overall_score, 1),
            "sustainability_grade": self._get_sustainability_grade(overall_score)
        }
    
    def _identify_rotation_issues(self, crop_history: List[Dict], pattern_analysis: Dict) -> List[Dict[str, Any]]:
        """Identify potential issues in crop rotation"""
        
        issues = []
        
        # Check for monoculture
        if pattern_analysis["monoculture_risk_percent"] > 60:
            issues.append({
                "type": "monoculture_risk",
                "severity": "high",
                "description": f"High monoculture risk - {pattern_analysis['dominant_crop']} dominates {pattern_analysis['monoculture_risk_percent']}% of seasons",
                "recommendation": "Introduce diverse crops to break monoculture pattern"
            })
        
        # Check for continuous cultivation of same crop family
        consecutive_issues = self._check_consecutive_cultivation(crop_history)
        issues.extend(consecutive_issues)
        
        # Check for lack of nitrogen fixers
        if pattern_analysis["diversity_score"] < 50:
            issues.append({
                "type": "low_diversity",
                "severity": "medium",
                "description": f"Low crop diversity score: {pattern_analysis['diversity_score']}%",
                "recommendation": "Include crops from different families (cereals, legumes, oilseeds)"
            })
        
        # Check for nutrient mining
        legume_count = sum(1 for record in crop_history if self._get_crop_category(record["crop"]) == "legumes")
        if legume_count / len(crop_history) < 0.2:
            issues.append({
                "type": "nutrient_mining",
                "severity": "medium",
                "description": "Insufficient nitrogen-fixing crops in rotation",
                "recommendation": "Include legumes like soybean, gram, or groundnut every 2-3 seasons"
            })
        
        return issues
    
    def _check_consecutive_cultivation(self, crop_history: List[Dict]) -> List[Dict[str, Any]]:
        """Check for problematic consecutive cultivation"""
        
        issues = []
        sorted_history = sorted(crop_history, key=lambda x: (x["year"], x["season"]))
        
        consecutive_count = 1
        prev_crop = None
        
        for record in sorted_history:
            current_crop = record["crop"]
            
            if current_crop == prev_crop:
                consecutive_count += 1
            else:
                # Check if previous consecutive cultivation was problematic
                if prev_crop and consecutive_count >= 3:
                    if prev_crop in self.rotation_rules.get("avoid_continuous", []):
                        issues.append({
                            "type": "excessive_consecutive_cultivation",
                            "severity": "high",
                            "crop": prev_crop,
                            "consecutive_seasons": consecutive_count,
                            "description": f"{prev_crop.title()} grown continuously for {consecutive_count} seasons",
                            "recommendation": f"Avoid continuous {prev_crop} cultivation - introduce rotation crops"
                        })
                
                consecutive_count = 1
            
            prev_crop = current_crop
        
        return issues
    
    def _generate_rotation_options(
        self,
        current_crop: Optional[str],
        soil_type: str,
        climate_zone: str,
        planning_years: int,
        crop_history: List[Dict]
    ) -> List[List[str]]:
        """Generate multiple rotation options"""
        
        rotation_options = []
        
        # Option 1: Balanced cereal-legume rotation
        balanced_rotation = self._create_balanced_rotation(current_crop, planning_years)
        rotation_options.append(balanced_rotation)
        
        # Option 2: Cash crop focused rotation
        cash_crop_rotation = self._create_cash_crop_rotation(current_crop, planning_years)
        rotation_options.append(cash_crop_rotation)
        
        # Option 3: Soil restoration rotation (if soil health is poor)
        restoration_rotation = self._create_restoration_rotation(current_crop, planning_years)
        rotation_options.append(restoration_rotation)
        
        # Option 4: Market-optimized rotation
        market_rotation = self._create_market_optimized_rotation(current_crop, planning_years)
        rotation_options.append(market_rotation)
        
        return rotation_options
    
    def _create_balanced_rotation(self, current_crop: Optional[str], years: int) -> List[str]:
        """Create a balanced rotation prioritizing soil health"""
        rotation = []
        seasons_per_year = 2  # Kharif and Rabi
        total_seasons = years * seasons_per_year
        
        # Ensure good balance between crop categories
        cereal_seasons = total_seasons // 3
        legume_seasons = total_seasons // 3
        other_seasons = total_seasons - cereal_seasons - legume_seasons
        
        # Build rotation sequence
        for i in range(total_seasons):
            season = "kharif" if i % 2 == 0 else "rabi"
            
            if i < cereal_seasons:
                if season == "kharif":
                    crop = np.random.choice(["rice", "maize", "sorghum"])
                else:
                    crop = np.random.choice(["wheat", "barley"])
            elif i < cereal_seasons + legume_seasons:
                if season == "kharif":
                    crop = np.random.choice(["soybean", "groundnut"])
                else:
                    crop = np.random.choice(["gram", "arhar"])
            else:
                if season == "kharif":
                    crop = np.random.choice(["cotton", "sunflower"])
                else:
                    crop = np.random.choice(["mustard", "onion"])
            
            rotation.append(crop)
        
        return rotation
    
    def _create_cash_crop_rotation(self, current_crop: Optional[str], years: int) -> List[str]:
        """Create rotation focused on cash crops with soil health maintenance"""
        rotation = []
        seasons_per_year = 2
        total_seasons = years * seasons_per_year
        
        for i in range(total_seasons):
            season = "kharif" if i % 2 == 0 else "rabi"
            position_in_cycle = i % 4  # 4-season cycle
            
            if position_in_cycle == 0:  # Cash crop
                crop = "cotton" if season == "kharif" else "mustard"
            elif position_in_cycle == 1:  # Cereal
                crop = "maize" if season == "kharif" else "wheat"
            elif position_in_cycle == 2:  # Legume (soil restoration)
                crop = "soybean" if season == "kharif" else "gram"
            else:  # Another cash crop or cereal
                crop = "sunflower" if season == "kharif" else "wheat"
            
            rotation.append(crop)
        
        return rotation
    
    def _create_restoration_rotation(self, current_crop: Optional[str], years: int) -> List[str]:
        """Create rotation focused on soil restoration"""
        rotation = []
        seasons_per_year = 2
        total_seasons = years * seasons_per_year
        
        # Heavy emphasis on legumes and green manure crops
        for i in range(total_seasons):
            season = "kharif" if i % 2 == 0 else "rabi"
            position_in_cycle = i % 3  # 3-season cycle
            
            if position_in_cycle == 0:  # Legume
                crop = "soybean" if season == "kharif" else "gram"
            elif position_in_cycle == 1:  # Cereal with organic matter
                crop = "maize" if season == "kharif" else "wheat"
            else:  # Fodder/green manure
                crop = "berseem" if season == "rabi" else "soybean"
            
            rotation.append(crop)
        
        return rotation
    
    def _create_market_optimized_rotation(self, current_crop: Optional[str], years: int) -> List[str]:
        """Create rotation based on market demand and prices"""
        rotation = []
        seasons_per_year = 2
        total_seasons = years * seasons_per_year
        
        # High-value crops with market demand
        high_value_kharif = ["cotton", "sugarcane", "tomato", "soybean"]
        high_value_rabi = ["wheat", "mustard", "gram", "onion"]
        
        for i in range(total_seasons):
            season = "kharif" if i % 2 == 0 else "rabi"
            
            if season == "kharif":
                crop = np.random.choice(high_value_kharif)
            else:
                crop = np.random.choice(high_value_rabi)
            
            rotation.append(crop)
        
        return rotation
    
    def _evaluate_rotation(self, rotation: List[str], soil_type: str, field_size: float) -> Dict[str, Any]:
        """Evaluate a rotation option on multiple criteria"""
        
        # Calculate sustainability score
        sustainability_score = self._calculate_rotation_sustainability(rotation)
        
        # Calculate economic potential
        economic_score = self._calculate_economic_potential(rotation, field_size)
        
        # Calculate soil health impact
        soil_health_score = self._calculate_soil_health_impact(rotation)
        
        # Calculate risk assessment
        risk_score = self._calculate_rotation_risk(rotation)
        
        # Calculate feasibility
        feasibility_score = self._calculate_rotation_feasibility(rotation, soil_type)
        
        # Overall score (weighted average)
        overall_score = (
            sustainability_score * 0.3 +
            economic_score * 0.25 +
            soil_health_score * 0.25 +
            (100 - risk_score) * 0.1 +  # Lower risk is better
            feasibility_score * 0.1
        )
        
        return {
            "sustainability_score": round(sustainability_score, 1),
            "economic_potential": round(economic_score, 1),
            "soil_health_impact": round(soil_health_score, 1),
            "risk_assessment": round(risk_score, 1),
            "feasibility": round(feasibility_score, 1),
            "overall_score": round(overall_score, 1),
            "grade": self._get_rotation_grade(overall_score)
        }
    
    def _calculate_rotation_sustainability(self, rotation: List[str]) -> float:
        """Calculate sustainability score for rotation"""
        
        # Count crop categories
        category_counts = {}
        for crop in rotation:
            category = self._get_crop_category(crop)
            if category:
                category_counts[category] = category_counts.get(category, 0) + 1
        
        # Diversity score
        diversity = len(category_counts) / len(self.crop_categories) * 100
        
        # Nitrogen fixation score
        legume_ratio = category_counts.get("legumes", 0) / len(rotation)
        nitrogen_score = min(100, legume_ratio * 300)
        
        # Avoid monoculture
        max_crop_count = max([rotation.count(crop) for crop in set(rotation)]) if rotation else 0
        monoculture_penalty = max_crop_count / len(rotation) * 50 if rotation else 0
        
        sustainability = diversity + nitrogen_score - monoculture_penalty
        return max(0, min(100, sustainability))
    
    def _calculate_economic_potential(self, rotation: List[str], field_size: float) -> float:
        """Calculate economic potential of rotation"""
        
        total_potential = 0
        for crop in rotation:
            typical_yield = self._get_typical_yield(crop)
            typical_price = self._get_typical_price(crop)
            typical_cost = self._get_typical_cost(crop)
            
            revenue = typical_yield * typical_price / 100  # Convert quintal to tonnes
            profit = revenue - typical_cost
            total_potential += max(0, profit)
        
        # Average per season
        avg_potential = total_potential / len(rotation) if rotation else 0
        
        # Normalize to 0-100 scale
        return min(100, avg_potential / 30000 * 100)  # Assuming 30k as good profit
    
    def _calculate_soil_health_impact(self, rotation: List[str]) -> float:
        """Calculate soil health impact of rotation"""
        
        cumulative_impact = {"N": 0, "P": 0, "K": 0, "organic_matter": 0}
        
        for crop in rotation:
            if crop in self.crop_nutrient_profiles:
                profile = self.crop_nutrient_profiles[crop]
                for nutrient, impact in profile.items():
                    cumulative_impact[nutrient] += impact
        
        # Score based on nutrient balance
        soil_score = 50  # Base score
        
        # Nitrogen balance (positive is good for soil)
        if cumulative_impact["N"] > 0:
            soil_score += 20
        elif cumulative_impact["N"] < -100:
            soil_score -= 20
        
        # Organic matter (positive is always good)
        if cumulative_impact["organic_matter"] > 0:
            soil_score += 25
        elif cumulative_impact["organic_matter"] < -2:
            soil_score -= 15
        
        # Overall depletion check
        total_depletion = sum(abs(v) for v in cumulative_impact.values() if v < 0)
        if total_depletion > 300:  # High depletion
            soil_score -= 10
        
        return max(0, min(100, soil_score))
    
    def _calculate_rotation_risk(self, rotation: List[str]) -> float:
        """Calculate risk score for rotation (higher = more risky)"""
        
        risk_score = 20  # Base risk
        
        # Market risk - too many similar crops
        crop_counts = {}
        for crop in rotation:
            crop_counts[crop] = crop_counts.get(crop, 0) + 1
        
        # Monoculture risk
        max_frequency = max(crop_counts.values()) if crop_counts else 0
        if max_frequency > len(rotation) // 2:
            risk_score += 30
        
        # Weather risk - all crops in same vulnerability class
        weather_sensitive_crops = ["cotton", "tomato", "sugarcane"]
        sensitive_count = sum(1 for crop in rotation if crop in weather_sensitive_crops)
        if sensitive_count > len(rotation) // 2:
            risk_score += 20
        
        # Pest/disease risk - consecutive crops from same family
        consecutive_risk = self._assess_consecutive_risk(rotation)
        risk_score += consecutive_risk
        
        return min(100, risk_score)
    
    def _calculate_rotation_feasibility(self, rotation: List[str], soil_type: str) -> float:
        """Calculate feasibility score for rotation"""
        
        feasibility = 80  # Base feasibility
        
        # Soil compatibility
        for crop in rotation:
            if not self._is_crop_suitable_for_soil(crop, soil_type):
                feasibility -= 5
        
        # Resource requirements
        high_input_crops = ["cotton", "sugarcane", "tomato"]
        high_input_count = sum(1 for crop in rotation if crop in high_input_crops)
        if high_input_count > len(rotation) // 2:
            feasibility -= 10  # May be difficult for small farmers
        
        return max(0, min(100, feasibility))
    
    def _get_crop_category(self, crop: str) -> Optional[str]:
        """Get category for a crop"""
        for category, info in self.crop_categories.items():
            if crop in info["crops"]:
                return category
        return None
    
    def _get_typical_cost(self, crop: str) -> float:
        """Get typical cultivation cost (INR per hectare)"""
        typical_costs = {
            "rice": 25000, "wheat": 20000, "maize": 22000, "sorghum": 18000,
            "soybean": 20000, "gram": 18000, "groundnut": 25000,
            "cotton": 35000, "sugarcane": 80000,
            "tomato": 60000, "onion": 40000, "potato": 50000,
            "mustard": 15000, "sunflower": 18000
        }
        return typical_costs.get(crop, 20000)
    
    def _assess_consecutive_risk(self, rotation: List[str]) -> float:
        """Assess risk from consecutive cultivation"""
        risk = 0
        for i in range(len(rotation) - 1):
            if rotation[i] == rotation[i + 1]:
                if rotation[i] in self.rotation_rules.get("avoid_continuous", []):
                    risk += 15
                else:
                    risk += 5
        return min(30, risk)
    
    def _is_crop_suitable_for_soil(self, crop: str, soil_type: str) -> bool:
        """Check if crop is suitable for soil type"""
        # Simplified soil-crop compatibility
        soil_preferences = {
            "red_soil": ["groundnut", "cotton", "maize", "millets"],
            "black_soil": ["cotton", "wheat", "gram", "sorghum"],
            "alluvial": ["rice", "wheat", "sugarcane", "vegetables"],
            "laterite": ["cashew", "coconut", "spices"],
            "sandy": ["groundnut", "millets", "vegetables"]
        }
        
        suitable_crops = soil_preferences.get(soil_type, [])
        return crop in suitable_crops or len(suitable_crops) == 0  # If unknown soil, assume suitable
    
    def _get_nutrient_recommendation(self, nutrient: str, status: str) -> str:
        """Get recommendation based on nutrient status"""
        recommendations = {
            "N": {
                "surplus": "Reduce nitrogen fertilizer application",
                "balanced": "Maintain current nitrogen management",
                "depleted": "Apply nitrogen fertilizer or include legumes",
                "severely_depleted": "Immediate nitrogen supplementation required"
            },
            "P": {
                "surplus": "No phosphorus application needed",
                "balanced": "Apply maintenance dose of phosphorus",
                "depleted": "Apply phosphorus fertilizer (SSP/DAP)",
                "severely_depleted": "Heavy phosphorus application required"
            },
            "K": {
                "surplus": "Reduce potassium fertilizer",
                "balanced": "Maintain potassium levels",
                "depleted": "Apply potassium fertilizer (MOP)",
                "severely_depleted": "Heavy potassium supplementation needed"
            },
            "organic_matter": {
                "surplus": "Good organic matter levels",
                "balanced": "Maintain organic matter with crop residues",
                "depleted": "Add compost or farmyard manure",
                "severely_depleted": "Urgent need for organic matter addition"
            }
        }
        
        return recommendations.get(nutrient, {}).get(status, "Monitor nutrient levels")
    
    def _assess_soil_health_from_nutrients(self, cumulative_impact: Dict[str, float]) -> Dict[str, Any]:
        """Assess overall soil health from nutrient impact"""
        
        # Calculate health indicators
        nitrogen_status = "good" if cumulative_impact["N"] > -50 else "moderate" if cumulative_impact["N"] > -100 else "poor"
        organic_matter_status = "good" if cumulative_impact["organic_matter"] > 0 else "moderate" if cumulative_impact["organic_matter"] > -1 else "poor"
        
        # Overall health score
        health_score = 50  # Base
        if cumulative_impact["N"] > 0:
            health_score += 20
        elif cumulative_impact["N"] < -100:
            health_score -= 20
            
        if cumulative_impact["organic_matter"] > 0:
            health_score += 20
        elif cumulative_impact["organic_matter"] < -2:
            health_score -= 15
        
        health_grade = "excellent" if health_score > 80 else "good" if health_score > 60 else "fair" if health_score > 40 else "poor"
        
        return {
            "overall_score": max(0, min(100, health_score)),
            "grade": health_grade,
            "nitrogen_status": nitrogen_status,
            "organic_matter_status": organic_matter_status,
            "key_concerns": self._identify_soil_concerns(cumulative_impact)
        }
    
    def _identify_soil_concerns(self, cumulative_impact: Dict[str, float]) -> List[str]:
        """Identify key soil health concerns"""
        concerns = []
        
        if cumulative_impact["N"] < -100:
            concerns.append("Severe nitrogen depletion")
        if cumulative_impact["P"] < -50:
            concerns.append("Phosphorus depletion")
        if cumulative_impact["K"] < -100:
            concerns.append("Potassium depletion")
        if cumulative_impact["organic_matter"] < -2:
            concerns.append("Low organic matter content")
        
        if not concerns:
            concerns.append("No major concerns identified")
        
        return concerns
    
    def _get_sustainability_grade(self, score: float) -> str:
        """Convert sustainability score to grade"""
        if score >= 80:
            return "A - Excellent"
        elif score >= 70:
            return "B - Good"
        elif score >= 60:
            return "C - Fair"
        elif score >= 50:
            return "D - Poor"
        else:
            return "F - Unsustainable"
    
    def _get_rotation_grade(self, score: float) -> str:
        """Convert rotation score to grade"""
        if score >= 85:
            return "A+ - Highly Recommended"
        elif score >= 75:
            return "A - Recommended"
        elif score >= 65:
            return "B - Good Option"
        elif score >= 55:
            return "C - Acceptable"
        else:
            return "D - Not Recommended"
    
    def _generate_detailed_recommendation(self, rotation: List[str], evaluation: Dict, rank: int) -> Dict[str, Any]:
        """Generate detailed recommendation for a rotation"""
        
        # Calculate season-wise breakdown
        kharif_crops = [rotation[i] for i in range(0, len(rotation), 2)]
        rabi_crops = [rotation[i] for i in range(1, len(rotation), 2)]
        
        # Generate implementation timeline
        timeline = []
        current_date = datetime.now()
        for i, crop in enumerate(rotation[:4]):  # First 2 years
            season = "Kharif" if i % 2 == 0 else "Rabi"
            year = current_date.year + (i // 2)
            
            timeline.append({
                "year": year,
                "season": season,
                "crop": crop,
                "planting_month": "June-July" if season == "Kharif" else "November-December",
                "harvest_month": "October-November" if season == "Kharif" else "March-April"
            })
        
        return {
            "rank": rank,
            "rotation_name": f"{rotation[0].title()}-based Rotation",
            "crops_sequence": rotation,
            "evaluation_scores": evaluation,
            "seasonal_breakdown": {
                "kharif_crops": list(set(kharif_crops)),
                "rabi_crops": list(set(rabi_crops))
            },
            "implementation_timeline": timeline,
            "key_benefits": self._identify_rotation_benefits(rotation, evaluation),
            "potential_challenges": self._identify_rotation_challenges(rotation),
            "management_tips": self._get_management_tips(rotation),
            "expected_outcomes": self._predict_rotation_outcomes(rotation, evaluation)
        }
    
    def _identify_rotation_benefits(self, rotation: List[str], evaluation: Dict) -> List[str]:
        """Identify key benefits of the rotation"""
        benefits = []
        
        if evaluation["sustainability_score"] > 70:
            benefits.append("High sustainability with good environmental balance")
        
        if evaluation["soil_health_impact"] > 70:
            benefits.append("Improves soil health and fertility")
        
        if evaluation["economic_potential"] > 60:
            benefits.append("Good economic returns potential")
        
        # Check for legumes
        legume_count = sum(1 for crop in rotation if self._get_crop_category(crop) == "legumes")
        if legume_count >= len(rotation) // 4:
            benefits.append("Natural nitrogen fixation reduces fertilizer costs")
        
        # Check for diversity
        unique_categories = len(set(self._get_crop_category(crop) for crop in rotation if self._get_crop_category(crop)))
        if unique_categories >= 3:
            benefits.append("High crop diversity reduces pest and disease risks")
        
        return benefits
    
    def _identify_rotation_challenges(self, rotation: List[str]) -> List[str]:
        """Identify potential challenges in the rotation"""
        challenges = []
        
        # High input crops
        high_input_crops = ["cotton", "sugarcane", "tomato"]
        high_input_count = sum(1 for crop in rotation if crop in high_input_crops)
        if high_input_count > len(rotation) // 3:
            challenges.append("High input costs for some crops")
        
        # Market risk crops
        volatile_crops = ["cotton", "onion", "tomato"]
        volatile_count = sum(1 for crop in rotation if crop in volatile_crops)
        if volatile_count > len(rotation) // 3:
            challenges.append("Price volatility in some crops")
        
        # Water-intensive crops
        water_intensive = ["rice", "sugarcane"]
        if any(crop in rotation for crop in water_intensive):
            challenges.append("High water requirement for some crops")
        
        return challenges
    
    def _get_management_tips(self, rotation: List[str]) -> List[str]:
        """Get management tips for the rotation"""
        tips = []
        
        # Legume-specific tips
        if any(self._get_crop_category(crop) == "legumes" for crop in rotation):
            tips.append("Use rhizobium inoculants for legume crops to enhance nitrogen fixation")
        
        # Organic matter management
        tips.append("Incorporate crop residues and practice composting")
        
        # Pest management
        tips.append("Monitor for pests and diseases specific to each crop")
        
        # Soil testing
        tips.append("Conduct soil testing before each major crop to adjust fertilization")
        
        # Water management
        tips.append("Practice efficient water management with proper scheduling")
        
        return tips
    
    def _predict_rotation_outcomes(self, rotation: List[str], evaluation: Dict) -> Dict[str, str]:
        """Predict outcomes of implementing the rotation"""
        
        outcomes = {}
        
        # Soil health
        if evaluation["soil_health_impact"] > 70:
            outcomes["soil_health"] = "Expected improvement in soil fertility and structure"
        else:
            outcomes["soil_health"] = "Soil health may remain stable with proper management"
        
        # Economic returns
        if evaluation["economic_potential"] > 70:
            outcomes["economics"] = "Good profit potential with proper market timing"
        elif evaluation["economic_potential"] > 50:
            outcomes["economics"] = "Moderate returns expected with cost management"
        else:
            outcomes["economics"] = "Focus on cost reduction and yield improvement"
        
        # Sustainability
        if evaluation["sustainability_score"] > 75:
            outcomes["sustainability"] = "Highly sustainable system for long-term farming"
        else:
            outcomes["sustainability"] = "Requires monitoring and adjustments for sustainability"
        
        return outcomes
    
    def _get_default_analysis(self, farm_id: str, field_coordinates: Dict[str, float]) -> Dict[str, Any]:
        """Return default analysis when no history is available"""
        
        return {
            "farm_id": farm_id,
            "field_coordinates": field_coordinates,
            "analysis_period_years": 0,
            "crop_history": [],
            "pattern_analysis": {
                "crop_frequency": {},
                "dominant_crop": "none",
                "monoculture_risk_percent": 0,
                "diversity_score": 0,
                "categories_used": [],
                "total_seasons_analyzed": 0
            },
            "nutrient_impact": {
                "cumulative_impact": {"N": 0, "P": 0, "K": 0, "organic_matter": 0},
                "overall_soil_health": {
                    "overall_score": 50,
                    "grade": "unknown",
                    "key_concerns": ["No historical data available"]
                }
            },
            "sustainability_metrics": {
                "overall_sustainability_score": 50,
                "sustainability_grade": "Unknown - No History"
            },
            "identified_issues": [{
                "type": "no_history",
                "severity": "info",
                "description": "No crop history available for analysis",
                "recommendation": "Start recording crop details for future analysis"
            }],
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    def _get_rotation_principles(self) -> List[str]:
        """Get general crop rotation principles"""
        return [
            "Include nitrogen-fixing legumes every 2-3 seasons",
            "Avoid continuous cultivation of the same crop",
            "Alternate deep-rooted and shallow-rooted crops",
            "Include crops that add organic matter to soil",
            "Consider market demand and price trends",
            "Plan for efficient use of farm resources",
            "Maintain soil health as the primary goal",
            "Diversify to reduce pest and disease risks"
        ]

    async def health_check(self) -> Dict[str, Any]:
        """Check health of crop rotation service"""
        try:
            # Test core functionality
            test_result = await self.recommend_rotation_schedule(
                "test_farm", "wheat", 2.0, "black_soil", "semi_arid", 2
            )
            
            return {
                "status": "healthy",
                "service": "CropRotationService",
                "crop_categories_loaded": len(self.crop_categories),
                "nutrient_profiles_loaded": len(self.crop_nutrient_profiles),
                "test_recommendations_generated": bool(test_result.get("recommended_rotations"))
            }
            
        except Exception as e:
            logger.error(f"Crop rotation service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "CropRotationService"
            }