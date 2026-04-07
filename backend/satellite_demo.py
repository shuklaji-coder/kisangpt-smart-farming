"""
Satellite Data Analysis Demo for Farmers
Real-time NDVI analysis, field boundary detection, and crop monitoring
"""

import asyncio
from datetime import datetime, timedelta
from app.services.enhanced.satellite_data_service import SatelliteDataService

class SatelliteAnalysisDemo:
    """Demonstrate satellite data analysis capabilities"""
    
    def __init__(self):
        self.satellite_service = SatelliteDataService()
        
        # Sample field location (Pune, Maharashtra)
        self.field_location = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "location_name": "Pune, Maharashtra"
        }
    
    def display_header(self):
        """Display demo header"""
        print("\n" + "="*70)
        print("🛰️  KISANGPT SATELLITE DATA ANALYSIS DEMO")
        print("   Advanced Agricultural Monitoring from Space")
        print("="*70)
    
    async def demo_ndvi_analysis(self):
        """Demonstrate NDVI analysis"""
        print(f"\n📡 NDVI ANALYSIS - {self.field_location['location_name']}")
        print("-" * 50)
        
        result = await self.satellite_service.calculate_ndvi_analysis(
            latitude=self.field_location["latitude"],
            longitude=self.field_location["longitude"],
            historical_months=6
        )
        
        # Display current vegetation indices
        current_indices = result["current_indices"]
        ndvi_data = current_indices["ndvi"]
        evi_data = current_indices["evi"]
        
        print(f"🌱 NDVI Value: {ndvi_data['value']:.3f}")
        print(f"   Interpretation: {ndvi_data['interpretation']}")
        print(f"   Health Status: {ndvi_data['health_status'].upper()}")
        
        print(f"\n🍃 EVI Value: {evi_data['value']:.3f}")
        print(f"   Interpretation: {evi_data['interpretation']}")
        
        # Display crop health assessment
        health = result["crop_health_assessment"]
        print(f"\n🏥 CROP HEALTH ASSESSMENT:")
        print(f"   Overall Status: {health['status'].upper()}")
        print(f"   Health Score: {health['score']}/100")
        
        # Display historical trends
        historical = result["historical_analysis"]
        trends = historical["trend_analysis"]
        print(f"\n📊 HISTORICAL TRENDS ({historical['data_points']} data points):")
        print(f"   Average NDVI: {historical['average_ndvi']:.3f}")
        print(f"   Trend: {trends['trend'].upper()}")
        print(f"   Trend Stability: {trends['stability'].upper()}")
        
        # Display recommendations
        print(f"\n💡 SATELLITE-BASED RECOMMENDATIONS:")
        for i, rec in enumerate(result["recommendations"][:3], 1):
            print(f"   {i}. {rec}")
        
        print(f"\n✅ Analysis Confidence: {result['confidence_score']*100:.1f}%")
        
        return result
    
    async def demo_field_boundaries(self):
        """Demonstrate field boundary detection"""
        print(f"\n🗺️  FIELD BOUNDARY DETECTION - {self.field_location['location_name']}")
        print("-" * 50)
        
        result = await self.satellite_service.detect_field_boundaries(
            latitude=self.field_location["latitude"],
            longitude=self.field_location["longitude"]
        )
        
        # Display boundary detection results
        boundaries = result["detected_boundaries"]
        stats = result["field_statistics"]
        
        print(f"📍 Detected {len(boundaries)} boundary points")
        print(f"📏 Field Area: {stats['area_hectares']:.2f} hectares")
        print(f"📐 Field Perimeter: {stats['perimeter_meters']:.0f} meters")
        print(f"🔷 Shape Regularity: {stats['shape_regularity']:.2f}")
        
        # Display GIS information
        gis_data = result["gis_data"]
        print(f"\n🌍 GIS DATA:")
        print(f"   Coordinate System: {gis_data['coordinate_system']}")
        print(f"   Accuracy: ±{gis_data['accuracy_meters']:.1f} meters")
        print(f"   Imagery Resolution: {gis_data['imagery_resolution']}")
        
        # Display boundary confidence
        print(f"\n✅ Boundary Detection Confidence: {result['boundary_confidence']*100:.1f}%")
        
        # Display recommendations
        print(f"\n💡 BOUNDARY RECOMMENDATIONS:")
        for i, rec in enumerate(result["field_recommendations"], 1):
            print(f"   {i}. {rec}")
        
        return result
    
    async def demo_crop_growth_monitoring(self):
        """Demonstrate crop growth monitoring"""
        print(f"\n🌾 CROP GROWTH MONITORING - {self.field_location['location_name']}")
        print("-" * 50)
        
        # Simulate wheat planted 60 days ago
        planting_date = datetime.now() - timedelta(days=60)
        crop_type = "wheat"
        
        result = await self.satellite_service.monitor_crop_growth(
            latitude=self.field_location["latitude"],
            longitude=self.field_location["longitude"],
            crop_type=crop_type,
            planting_date=planting_date
        )
        
        # Display crop information
        crop_info = result["crop_info"]
        print(f"🌱 Crop Type: {crop_info['type'].upper()}")
        print(f"📅 Planting Date: {planting_date.strftime('%Y-%m-%d')}")
        print(f"⏱️  Days Since Planting: {crop_info['days_since_planting']}")
        
        # Display current growth stage
        print(f"🔄 Current Growth Stage: {result['current_stage'].upper()}")
        
        # Display growth analysis
        growth = result["growth_analysis"]
        print(f"\n📈 GROWTH ANALYSIS:")
        print(f"   Growth Rate: {growth['growth_rate'].upper()}")
        print(f"   Current NDVI: {growth['current_ndvi']:.3f}")
        print(f"   Growth Trend: {growth['trend'].upper()}")
        
        # Display yield prediction
        yield_pred = result["yield_prediction"]
        print(f"\n🎯 YIELD PREDICTION:")
        print(f"   Predicted Yield: {yield_pred['predicted_yield_per_hectare']:.0f} kg/hectare")
        print(f"   Prediction Confidence: {yield_pred['confidence']*100:.0f}%")
        
        # Display potential issues
        issues = result["potential_issues"]
        if issues:
            print(f"\n⚠️  POTENTIAL ISSUES DETECTED:")
            for issue in issues:
                print(f"   • {issue['issue'].replace('_', ' ').title()}: {issue['severity'].upper()}")
                print(f"     Confidence: {issue['confidence']*100:.0f}% - {issue['recommendation']}")
        else:
            print(f"\n✅ No significant issues detected")
        
        # Display monitoring recommendations
        print(f"\n💡 MONITORING RECOMMENDATIONS:")
        for i, rec in enumerate(result["monitoring_recommendations"], 1):
            print(f"   {i}. {rec}")
        
        print(f"\n📅 Next Monitoring: {result['next_monitoring_date'][:10]}")
        
        return result
    
    async def demo_environmental_stress(self):
        """Demonstrate environmental stress assessment"""
        print(f"\n🌡️  ENVIRONMENTAL STRESS ASSESSMENT - {self.field_location['location_name']}")
        print("-" * 50)
        
        result = await self.satellite_service.assess_environmental_stress(
            latitude=self.field_location["latitude"],
            longitude=self.field_location["longitude"]
        )
        
        # Display overall stress level
        overall_stress = result["overall_stress_level"]
        print(f"📊 Overall Stress Level: {overall_stress['level'].upper()}")
        print(f"📈 Stress Score: {overall_stress['score']:.1f}/100")
        
        # Display primary stressors
        primary_stressors = overall_stress.get("primary_stressors", [])
        if primary_stressors:
            print(f"🎯 Primary Stressors: {', '.join(primary_stressors).title()}")
        
        # Display individual stress assessments
        stress_assessment = result["individual_stress_assessment"]
        print(f"\n🔍 INDIVIDUAL STRESS FACTORS:")
        for factor, assessment in stress_assessment.items():
            severity = assessment["severity"]
            confidence = assessment["confidence"] * 100
            emoji = "🔴" if severity == "high" else "🟡" if severity == "medium" else "🟢"
            
            print(f"   {emoji} {factor.replace('_', ' ').title()}: {severity.upper()} (Confidence: {confidence:.0f}%)")
        
        # Display critical stress factors
        critical_factors = result["critical_stress_factors"]
        if critical_factors:
            print(f"\n🚨 CRITICAL STRESS FACTORS:")
            for factor in critical_factors:
                print(f"   • {factor.replace('_', ' ').title()}")
        else:
            print(f"\n✅ No critical stress factors detected")
        
        # Display stress indices
        stress_indices = result["stress_indices"]
        print(f"\n📐 STRESS INDICES:")
        print(f"   Moisture Stress Index: {stress_indices['moisture_stress_index']:.3f}")
        print(f"   Temperature Vegetation Index: {stress_indices['temperature_vegetation_index']:.3f}")
        print(f"   Crop Water Stress Index: {stress_indices['crop_water_stress_index']:.3f}")
        
        # Display mitigation recommendations
        print(f"\n💡 STRESS MITIGATION STRATEGIES:")
        for i, strategy in enumerate(result["mitigation_recommendations"], 1):
            print(f"   {i}. {strategy}")
        
        print(f"\n🔔 Monitoring Priority: {result['monitoring_priority'].upper()}")
        
        return result
    
    async def demo_satellite_imagery(self):
        """Demonstrate satellite imagery fetching"""
        print(f"\n🛰️  SATELLITE IMAGERY - {self.field_location['location_name']}")
        print("-" * 50)
        
        result = await self.satellite_service.get_satellite_imagery(
            latitude=self.field_location["latitude"],
            longitude=self.field_location["longitude"],
            date_range=15,
            resolution="10m",
            satellite_source="sentinel-2"
        )
        
        # Display imagery metadata
        print(f"🛰️  Satellite Source: {result['source'].upper()}")
        print(f"📐 Resolution: {result['resolution']}")
        print(f"📅 Acquisition Date: {result['acquisition_date'][:10]}")
        print(f"☁️  Cloud Coverage: {result['cloud_coverage']:.1f}%")
        
        # Display metadata
        metadata = result["metadata"]
        print(f"\n📊 TECHNICAL DETAILS:")
        print(f"   Sensor: {metadata['sensor']}")
        print(f"   Path/Row: {metadata['path_row']}")
        print(f"   Quality Score: {metadata['quality_score']*100:.1f}%")
        
        # Display spectral bands info
        bands = result["spectral_bands"]
        print(f"\n🌈 SPECTRAL BANDS AVAILABLE:")
        for band, data in bands.items():
            if isinstance(data, list) and len(data) > 0:
                print(f"   • {band.upper()}: {len(data)} x {len(data[0])} pixels")
        
        return result
    
    def display_summary(self):
        """Display demo summary"""
        print("\n" + "="*70)
        print("🎯 SATELLITE DATA ANALYSIS COMPLETE!")
        print("="*70)
        
        print(f"""
🛰️  CAPABILITIES DEMONSTRATED:

✅ NDVI Analysis          - Vegetation health monitoring
✅ Field Boundaries       - Automated field mapping  
✅ Growth Monitoring      - Time-series crop tracking
✅ Stress Assessment      - Environmental impact analysis
✅ Satellite Imagery      - Multi-spectral data access

📊 INTEGRATION BENEFITS:
• Real-time crop health monitoring
• Precision agriculture insights
• Early stress detection
• Yield prediction capabilities
• Scientific farming decisions

🌾 Ready for integration with KisanGPT mobile app!
""")

async def run_satellite_demo():
    """Run the complete satellite data demo"""
    demo = SatelliteAnalysisDemo()
    demo.display_header()
    
    try:
        # Run all satellite analysis demos
        print("🚀 Starting satellite data analysis...")
        
        await demo.demo_ndvi_analysis()
        await asyncio.sleep(1)  # Brief pause for readability
        
        await demo.demo_field_boundaries()
        await asyncio.sleep(1)
        
        await demo.demo_crop_growth_monitoring()
        await asyncio.sleep(1)
        
        await demo.demo_environmental_stress()
        await asyncio.sleep(1)
        
        await demo.demo_satellite_imagery()
        
        demo.display_summary()
        
    except Exception as e:
        print(f"\n❌ Demo error: {e}")
        print("Note: This is expected in development environment without satellite API keys")

if __name__ == "__main__":
    # Run the satellite demo
    asyncio.run(run_satellite_demo())