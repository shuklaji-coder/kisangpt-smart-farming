"""
Disease information database for Kisan GPT
Contains comprehensive disease information, symptoms, treatments, and prevention measures
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
from loguru import logger


class DiseaseDatabase:
    """Comprehensive disease information database"""
    
    def __init__(self):
        self.disease_info = self._initialize_disease_database()
        
    def _initialize_disease_database(self) -> Dict[str, Dict]:
        """Initialize comprehensive disease database"""
        return {
            'rice_blast': {
                'name': 'Rice Blast',
                'scientific_name': 'Pyricularia oryzae',
                'crop': 'rice',
                'type': 'fungal',
                'severity': 'high',
                'symptoms': [
                    'Diamond-shaped lesions with gray centers and brown margins on leaves',
                    'White to gray lesions with brown borders on stems',
                    'Neck rot causing panicle death',
                    'Reduced grain filling and quality'
                ],
                'conditions': {
                    'temperature_range': '20-30°C',
                    'humidity': '>85%',
                    'rainfall': 'High (>10mm)',
                    'favorable_conditions': 'Cool nights with high humidity, dense crop canopy'
                },
                'prevention': [
                    'Use resistant varieties',
                    'Maintain proper plant spacing',
                    'Apply balanced fertilization (avoid excess nitrogen)',
                    'Ensure good drainage',
                    'Remove infected crop debris'
                ],
                'treatment': {
                    'chemical': [
                        'Tricyclazole 75% WP @ 0.6g/L',
                        'Carbendazim 50% WP @ 1g/L',
                        'Propiconazole 25% EC @ 1ml/L'
                    ],
                    'organic': [
                        'Neem oil spray @ 3-5ml/L',
                        'Pseudomonas fluorescens @ 2.5kg/ha',
                        'Trichoderma viride @ 2.5kg/ha'
                    ],
                    'cultural': [
                        'Remove excess water from fields',
                        'Apply silicon fertilizer',
                        'Use pheromone traps for monitoring'
                    ]
                },
                'economic_impact': 'Can cause 10-85% yield loss depending on variety and environmental conditions',
                'stages_affected': ['seedling', 'tillering', 'panicle_initiation', 'flowering'],
                'geographic_distribution': 'Global - major rice growing regions'
            },
            
            'rice_brown_spot': {
                'name': 'Rice Brown Spot',
                'scientific_name': 'Bipolaris oryzae',
                'crop': 'rice',
                'type': 'fungal',
                'severity': 'medium',
                'symptoms': [
                    'Small, circular brown spots on leaves',
                    'Dark brown lesions on leaf sheaths',
                    'Blackening of glumes and grains',
                    'Reduced grain quality and weight'
                ],
                'conditions': {
                    'temperature_range': '25-35°C',
                    'humidity': '>80%',
                    'rainfall': 'Moderate (5-15mm)',
                    'favorable_conditions': 'Water stress, nutrient deficiency, high temperature'
                },
                'prevention': [
                    'Use disease-free seeds',
                    'Maintain balanced nutrition',
                    'Proper water management',
                    'Avoid water stress',
                    'Use tolerant varieties'
                ],
                'treatment': {
                    'chemical': [
                        'Propiconazole 25% EC @ 1ml/L',
                        'Mancozeb 75% WP @ 2g/L',
                        'Hexaconazole 5% SC @ 2ml/L'
                    ],
                    'organic': [
                        'Neem cake application @ 250kg/ha',
                        'Bacillus subtilis spray',
                        'Potassium bicarbonate @ 5g/L'
                    ],
                    'cultural': [
                        'Ensure adequate potash supply',
                        'Maintain proper water levels',
                        'Apply organic matter'
                    ]
                },
                'economic_impact': 'Can cause 5-45% yield loss, especially under stress conditions',
                'stages_affected': ['tillering', 'booting', 'grain_filling'],
                'geographic_distribution': 'Tropical and subtropical rice regions'
            },
            
            'wheat_rust': {
                'name': 'Wheat Rust',
                'scientific_name': 'Puccinia graminis, P. striiformis, P. triticina',
                'crop': 'wheat',
                'type': 'fungal',
                'severity': 'high',
                'symptoms': [
                    'Orange to reddish-brown pustules on leaves and stems',
                    'Yellow stripes on leaves (yellow rust)',
                    'Black pustules on stems (stem rust)',
                    'Premature leaf senescence'
                ],
                'conditions': {
                    'temperature_range': '15-25°C',
                    'humidity': '>70%',
                    'rainfall': 'Light to moderate',
                    'favorable_conditions': 'Moderate temperatures, high humidity, dew formation'
                },
                'prevention': [
                    'Use resistant varieties',
                    'Early sowing',
                    'Proper plant spacing',
                    'Remove alternate hosts',
                    'Balanced fertilization'
                ],
                'treatment': {
                    'chemical': [
                        'Propiconazole 25% EC @ 1ml/L',
                        'Tebuconazole 25% WG @ 1g/L',
                        'Triazophos 40% EC @ 2ml/L'
                    ],
                    'organic': [
                        'Sulfur dust @ 20-25kg/ha',
                        'Trichoderma application',
                        'Baking soda spray @ 5g/L'
                    ],
                    'cultural': [
                        'Remove infected plant debris',
                        'Avoid excessive nitrogen',
                        'Ensure good air circulation'
                    ]
                },
                'economic_impact': 'Can cause 10-70% yield loss in susceptible varieties',
                'stages_affected': ['tillering', 'stem_elongation', 'flowering'],
                'geographic_distribution': 'Global wheat production areas'
            },
            
            'tomato_blight': {
                'name': 'Tomato Late Blight',
                'scientific_name': 'Phytophthora infestans',
                'crop': 'tomato',
                'type': 'oomycete',
                'severity': 'high',
                'symptoms': [
                    'Dark brown to black lesions on leaves',
                    'Water-soaked spots on fruits',
                    'White fungal growth on leaf undersides',
                    'Rapid plant death in severe cases'
                ],
                'conditions': {
                    'temperature_range': '18-25°C',
                    'humidity': '>90%',
                    'rainfall': 'High (>10mm)',
                    'favorable_conditions': 'Cool, moist conditions with poor air circulation'
                },
                'prevention': [
                    'Use resistant varieties',
                    'Ensure good air circulation',
                    'Avoid overhead irrigation',
                    'Proper plant spacing',
                    'Remove plant debris'
                ],
                'treatment': {
                    'chemical': [
                        'Copper hydroxide @ 2-3g/L',
                        'Mancozeb 75% WP @ 2.5g/L',
                        'Cymoxanil 8% + Mancozeb 64% WP @ 2g/L'
                    ],
                    'organic': [
                        'Copper sulfate @ 2g/L',
                        'Bacillus subtilis spray',
                        'Potassium bicarbonate @ 5g/L'
                    ],
                    'cultural': [
                        'Improve drainage',
                        'Reduce humidity around plants',
                        'Remove infected plant parts immediately'
                    ]
                },
                'economic_impact': 'Can destroy entire crop within days under favorable conditions',
                'stages_affected': ['all_stages'],
                'geographic_distribution': 'Global - wherever tomatoes are grown'
            },
            
            'cotton_wilt': {
                'name': 'Cotton Wilt',
                'scientific_name': 'Fusarium oxysporum f.sp. vasinfectum',
                'crop': 'cotton',
                'type': 'fungal',
                'severity': 'high',
                'symptoms': [
                    'Yellowing of leaves starting from bottom',
                    'Wilting of plants during day',
                    'Brown discoloration of vascular tissue',
                    'Stunted growth and premature death'
                ],
                'conditions': {
                    'temperature_range': '28-35°C',
                    'humidity': '40-60%',
                    'rainfall': 'Low to moderate',
                    'favorable_conditions': 'High soil temperature, water stress, poor drainage'
                },
                'prevention': [
                    'Use resistant varieties',
                    'Crop rotation with non-host crops',
                    'Deep summer plowing',
                    'Proper drainage',
                    'Soil solarization'
                ],
                'treatment': {
                    'chemical': [
                        'Carbendazim 50% WP @ 1g/L (soil drench)',
                        'Trichoderma harzianum @ 2.5kg/ha',
                        'Pseudomonas fluorescens @ 2.5kg/ha'
                    ],
                    'organic': [
                        'Neem cake @ 250kg/ha',
                        'Bio-agents application',
                        'Organic matter incorporation'
                    ],
                    'cultural': [
                        'Improve soil drainage',
                        'Avoid water stress',
                        'Remove infected plants'
                    ]
                },
                'economic_impact': 'Can cause 10-60% yield loss depending on variety and conditions',
                'stages_affected': ['seedling', 'vegetative', 'flowering'],
                'geographic_distribution': 'Cotton growing regions worldwide'
            },
            
            'onion_purple_blotch': {
                'name': 'Onion Purple Blotch',
                'scientific_name': 'Alternaria porri',
                'crop': 'onion',
                'type': 'fungal',
                'severity': 'medium',
                'symptoms': [
                    'Purple to brown lesions on leaves',
                    'Concentric rings in lesions',
                    'Tip dieback of leaves',
                    'Reduced bulb size and quality'
                ],
                'conditions': {
                    'temperature_range': '20-30°C',
                    'humidity': '>80%',
                    'rainfall': 'Moderate (5-10mm)',
                    'favorable_conditions': 'High humidity, leaf wetness, thrips damage'
                },
                'prevention': [
                    'Use disease-free seeds',
                    'Proper plant spacing',
                    'Control thrips population',
                    'Avoid excessive nitrogen',
                    'Crop rotation'
                ],
                'treatment': {
                    'chemical': [
                        'Mancozeb 75% WP @ 2g/L',
                        'Chlorothalonil 75% WP @ 2g/L',
                        'Azoxystrobin 23% SC @ 1ml/L'
                    ],
                    'organic': [
                        'Neem oil @ 3-5ml/L',
                        'Copper sulfate @ 2g/L',
                        'Trichoderma spray'
                    ],
                    'cultural': [
                        'Improve air circulation',
                        'Remove infected plant debris',
                        'Avoid overhead irrigation'
                    ]
                },
                'economic_impact': 'Can cause 20-40% yield loss in severe cases',
                'stages_affected': ['vegetative', 'bulb_development'],
                'geographic_distribution': 'Onion growing regions globally'
            },
            
            'sugarcane_red_rot': {
                'name': 'Sugarcane Red Rot',
                'scientific_name': 'Colletotrichum falcatum',
                'crop': 'sugarcane',
                'type': 'fungal',
                'severity': 'high',
                'symptoms': [
                    'Red discoloration of internal tissues',
                    'White patches with black dots on internodes',
                    'Hollow stems in advanced stages',
                    'Reduced sugar content'
                ],
                'conditions': {
                    'temperature_range': '25-35°C',
                    'humidity': '>60%',
                    'rainfall': 'High (>20mm)',
                    'favorable_conditions': 'Waterlogging, stem injuries, susceptible varieties'
                },
                'prevention': [
                    'Use resistant varieties',
                    'Plant disease-free setts',
                    'Proper drainage',
                    'Avoid mechanical injuries',
                    'Crop rotation'
                ],
                'treatment': {
                    'chemical': [
                        'Carbendazim 50% WP @ 1g/L',
                        'Propiconazole 25% EC @ 1ml/L',
                        'Bordeaux mixture @ 1%'
                    ],
                    'organic': [
                        'Trichoderma treatment of setts',
                        'Neem oil spray',
                        'Pseudomonas application'
                    ],
                    'cultural': [
                        'Remove infected canes immediately',
                        'Improve field drainage',
                        'Avoid ratoon crops in infected fields'
                    ]
                },
                'economic_impact': 'Can cause 25-80% sugar loss in severely infected canes',
                'stages_affected': ['all_stages'],
                'geographic_distribution': 'Major sugarcane producing countries'
            }
        }
    
    def get_disease_info(self, disease_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive information about a specific disease"""
        return self.disease_info.get(disease_id.lower().replace(' ', '_'))
    
    def search_diseases_by_crop(self, crop: str) -> List[Dict[str, Any]]:
        """Get all diseases affecting a specific crop"""
        crop_diseases = []
        for disease_id, disease_data in self.disease_info.items():
            if disease_data['crop'].lower() == crop.lower():
                disease_info = disease_data.copy()
                disease_info['id'] = disease_id
                crop_diseases.append(disease_info)
        
        return crop_diseases
    
    def search_diseases_by_symptoms(self, symptoms: List[str]) -> List[Dict[str, Any]]:
        """Search diseases by symptoms"""
        matching_diseases = []
        
        for disease_id, disease_data in self.disease_info.items():
            disease_symptoms = [s.lower() for s in disease_data['symptoms']]
            
            # Calculate symptom match score
            matches = 0
            for user_symptom in symptoms:
                for disease_symptom in disease_symptoms:
                    if user_symptom.lower() in disease_symptom:
                        matches += 1
                        break
            
            if matches > 0:
                disease_info = disease_data.copy()
                disease_info['id'] = disease_id
                disease_info['match_score'] = matches / len(symptoms)
                matching_diseases.append(disease_info)
        
        # Sort by match score
        matching_diseases.sort(key=lambda x: x['match_score'], reverse=True)
        return matching_diseases
    
    def get_treatment_recommendations(
        self, 
        disease_id: str, 
        severity: str = 'medium',
        organic_preference: bool = False
    ) -> Dict[str, Any]:
        """Get specific treatment recommendations"""
        disease_info = self.get_disease_info(disease_id)
        
        if not disease_info:
            return {"error": "Disease not found"}
        
        treatment = disease_info.get('treatment', {})
        
        recommendations = {
            "disease": disease_info['name'],
            "severity_assessed": severity,
            "immediate_actions": [],
            "chemical_treatments": treatment.get('chemical', []),
            "organic_treatments": treatment.get('organic', []),
            "cultural_practices": treatment.get('cultural', []),
            "prevention_future": disease_info.get('prevention', [])
        }
        
        # Add severity-based immediate actions
        if severity == 'high':
            recommendations["immediate_actions"] = [
                "Isolate affected plants immediately",
                "Apply emergency treatment within 24 hours",
                "Monitor spread to adjacent plants",
                "Consider destroying severely infected plants"
            ]
        elif severity == 'medium':
            recommendations["immediate_actions"] = [
                "Begin treatment within 48 hours",
                "Monitor disease progression",
                "Improve environmental conditions",
                "Remove infected plant parts"
            ]
        else:
            recommendations["immediate_actions"] = [
                "Monitor closely for disease progression",
                "Implement preventive measures",
                "Maintain good plant hygiene",
                "Consider preventive treatments"
            ]
        
        # Prioritize organic if preferred
        if organic_preference:
            recommendations["priority_treatments"] = treatment.get('organic', [])
            recommendations["alternative_treatments"] = treatment.get('chemical', [])
        else:
            recommendations["priority_treatments"] = treatment.get('chemical', [])
            recommendations["alternative_treatments"] = treatment.get('organic', [])
        
        return recommendations
    
    def get_prevention_guide(self, crop: str) -> Dict[str, Any]:
        """Get comprehensive prevention guide for a crop"""
        crop_diseases = self.search_diseases_by_crop(crop)
        
        if not crop_diseases:
            return {"error": f"No disease information found for {crop}"}
        
        # Consolidate prevention measures
        all_prevention = []
        common_conditions = []
        
        for disease in crop_diseases:
            all_prevention.extend(disease.get('prevention', []))
            conditions = disease.get('conditions', {})
            common_conditions.append(conditions)
        
        # Remove duplicates and categorize
        unique_prevention = list(set(all_prevention))
        
        prevention_guide = {
            "crop": crop,
            "total_diseases": len(crop_diseases),
            "major_diseases": [d['name'] for d in crop_diseases if d['severity'] == 'high'],
            "general_prevention": {
                "variety_selection": [p for p in unique_prevention if 'resistant' in p.lower() or 'variety' in p.lower()],
                "field_management": [p for p in unique_prevention if any(word in p.lower() for word in ['spacing', 'drainage', 'irrigation', 'rotation'])],
                "nutrition": [p for p in unique_prevention if any(word in p.lower() for word in ['fertiliz', 'nutrition', 'nitrogen'])],
                "sanitation": [p for p in unique_prevention if any(word in p.lower() for word in ['debris', 'clean', 'remove', 'destroy'])],
                "other": [p for p in unique_prevention if not any(cat in p.lower() for cat in ['resistant', 'variety', 'spacing', 'drainage', 'irrigation', 'rotation', 'fertiliz', 'nutrition', 'nitrogen', 'debris', 'clean', 'remove', 'destroy'])]
            },
            "monitoring_schedule": {
                "daily": ["Visual inspection of plants", "Check for pest damage"],
                "weekly": ["Disease symptom monitoring", "Environmental condition assessment"],
                "monthly": ["Soil health evaluation", "Prevention measure effectiveness review"]
            },
            "critical_periods": self._get_critical_periods(crop_diseases)
        }
        
        return prevention_guide
    
    def _get_critical_periods(self, diseases: List[Dict]) -> Dict[str, List[str]]:
        """Determine critical periods for disease management"""
        stage_risks = {}
        
        for disease in diseases:
            stages = disease.get('stages_affected', [])
            disease_name = disease['name']
            
            for stage in stages:
                if stage not in stage_risks:
                    stage_risks[stage] = []
                stage_risks[stage].append(disease_name)
        
        return stage_risks
    
    def get_disease_calendar(self, crop: str, region: str = "general") -> Dict[str, Any]:
        """Get disease calendar showing seasonal disease risks"""
        crop_diseases = self.search_diseases_by_crop(crop)
        
        if not crop_diseases:
            return {"error": f"No disease information found for {crop}"}
        
        # Simplified seasonal mapping (would be more complex in production)
        seasonal_risks = {
            "spring": [],
            "summer": [],
            "monsoon": [],
            "post_monsoon": [],
            "winter": []
        }
        
        for disease in crop_diseases:
            conditions = disease.get('conditions', {})
            temp_range = conditions.get('temperature_range', '')
            humidity = conditions.get('humidity', '')
            rainfall = conditions.get('rainfall', '')
            
            disease_entry = {
                "disease": disease['name'],
                "severity": disease['severity'],
                "key_conditions": f"Temp: {temp_range}, Humidity: {humidity}, Rainfall: {rainfall}"
            }
            
            # Assign to seasons based on conditions
            if 'high' in rainfall.lower() or '>10' in rainfall:
                seasonal_risks["monsoon"].append(disease_entry)
            elif 'cool' in conditions.get('favorable_conditions', '').lower() or '15-25' in temp_range:
                seasonal_risks["winter"].append(disease_entry)
            elif 'hot' in conditions.get('favorable_conditions', '').lower() or '28-35' in temp_range:
                seasonal_risks["summer"].append(disease_entry)
            else:
                seasonal_risks["spring"].append(disease_entry)
                seasonal_risks["post_monsoon"].append(disease_entry)
        
        return {
            "crop": crop,
            "region": region,
            "seasonal_disease_calendar": seasonal_risks,
            "general_recommendations": [
                "Monitor weather forecasts regularly",
                "Adjust management practices based on seasonal risks",
                "Prepare treatment materials before high-risk periods",
                "Maintain detailed field records"
            ]
        }
    
    def get_economic_impact_analysis(self, disease_ids: List[str]) -> Dict[str, Any]:
        """Analyze economic impact of diseases"""
        if not disease_ids:
            return {"error": "No diseases specified"}
        
        impacts = []
        total_potential_loss = 0
        high_risk_diseases = 0
        
        for disease_id in disease_ids:
            disease_info = self.get_disease_info(disease_id)
            if disease_info:
                impact = disease_info.get('economic_impact', 'Impact not quantified')
                severity = disease_info.get('severity', 'unknown')
                
                impacts.append({
                    "disease": disease_info['name'],
                    "crop": disease_info['crop'],
                    "severity": severity,
                    "economic_impact": impact
                })
                
                if severity == 'high':
                    high_risk_diseases += 1
                
                # Extract potential loss percentage (simplified)
                if '%' in impact:
                    try:
                        loss_range = [int(x.strip('%')) for x in impact.split() if '%' in x][0]
                        total_potential_loss += loss_range
                    except:
                        pass
        
        return {
            "analyzed_diseases": len(impacts),
            "high_severity_diseases": high_risk_diseases,
            "disease_impacts": impacts,
            "risk_assessment": "High" if high_risk_diseases > 2 else "Medium" if high_risk_diseases > 0 else "Low",
            "management_priority": "Immediate action required" if high_risk_diseases > 2 else "Regular monitoring needed",
            "estimated_max_loss_potential": f"Up to {min(total_potential_loss, 100)}% if left untreated"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for disease database"""
        try:
            total_diseases = len(self.disease_info)
            crops_covered = len(set(d['crop'] for d in self.disease_info.values()))
            severity_distribution = {}
            
            for disease_data in self.disease_info.values():
                severity = disease_data.get('severity', 'unknown')
                severity_distribution[severity] = severity_distribution.get(severity, 0) + 1
            
            return {
                "status": "healthy",
                "service": "DiseaseDatabase",
                "total_diseases": total_diseases,
                "crops_covered": crops_covered,
                "severity_distribution": severity_distribution,
                "available_functions": [
                    "get_disease_info",
                    "search_diseases_by_crop",
                    "search_diseases_by_symptoms",
                    "get_treatment_recommendations",
                    "get_prevention_guide",
                    "get_disease_calendar",
                    "get_economic_impact_analysis"
                ]
            }
            
        except Exception as e:
            logger.error(f"Disease database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "service": "DiseaseDatabase"
            }