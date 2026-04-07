const weatherService = require('../services/weatherService');
const whatsappService = require('../services/whatsappService');

// Demo function to test rain alerts
async function testRainAlertSystem() {
  console.log('🌧️ Testing KisanGPT Rain Alert System');
  console.log('=====================================');
  
  try {
    // Test coordinates for Delhi
    const testLocation = {
      latitude: 28.6139,
      longitude: 77.2090,
      name: 'Delhi, India'
    };
    
    console.log(`\n📍 Testing location: ${testLocation.name}`);
    console.log(`   Coordinates: ${testLocation.latitude}, ${testLocation.longitude}`);
    
    // Test 1: Check rain prediction
    console.log('\n🔍 Test 1: Checking rain prediction for next 4 days...');
    const rainPrediction = await weatherService.checkRainPrediction(
      testLocation.latitude,
      testLocation.longitude,
      4,
      2.5
    );
    
    console.log('Rain prediction result:', rainPrediction.hasRainPrediction);
    if (rainPrediction.hasRainPrediction) {
      console.log(`Found ${rainPrediction.predictions.length} rain predictions:`);
      rainPrediction.predictions.forEach((pred, index) => {
        console.log(`  ${index + 1}. ${pred.daysFromNow} days from now: ${Math.round(pred.precipitationProbability)}% chance`);
      });
    } else {
      console.log('   ☀️ No rain predicted in the next 4 days');
    }
    
    // Test 2: Format alert message
    console.log('\n📝 Test 2: Generating alert message...');
    const message = weatherService.formatRainAlertMessage(
      rainPrediction.predictions,
      testLocation,
      'both'
    );
    
    if (message) {
      console.log('Alert message generated:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));
    } else {
      console.log('   No alert message generated (no rain predicted)');
    }
    
    // Test 3: WhatsApp service status
    console.log('\n📱 Test 3: WhatsApp service status...');
    const whatsappStatus = whatsappService.getServiceStatus();
    console.log('WhatsApp service:', whatsappStatus);
    
    // Test 4: Send test message (demo mode)
    console.log('\n📲 Test 4: Sending test WhatsApp message...');
    const testResult = await whatsappService.sendTestMessage('+919876543210', 'Demo Farmer');
    console.log('Test message result:', testResult.success ? 'SUCCESS' : 'FAILED');
    
    if (message && rainPrediction.hasRainPrediction) {
      console.log('\n🔔 Test 5: Sending rain alert message...');
      const alertResult = await whatsappService.sendRainAlert(
        {
          userId: 'demo-user-123',
          whatsappNumber: '+919876543210',
          language: 'both'
        },
        rainPrediction.predictions,
        testLocation
      );
      console.log('Rain alert result:', alertResult.success ? 'SUCCESS' : 'FAILED');
    }
    
    console.log('\n✅ Rain Alert System Test Completed!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRainAlertSystem();
}

module.exports = testRainAlertSystem;
