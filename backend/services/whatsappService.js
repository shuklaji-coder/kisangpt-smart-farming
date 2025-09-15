const axios = require('axios');

class WhatsAppService {
  constructor() {
    // Using Twilio WhatsApp API (you can also use WhatsApp Business API)
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio Sandbox
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // For demo purposes, we'll simulate WhatsApp sending
    this.isDemoMode = !this.twilioAccountSid || !this.twilioAuthToken;
  }

  // Send WhatsApp message using Twilio
  async sendMessage(toNumber, message) {
    try {
      // Ensure number is in correct format
      const formattedNumber = this.formatPhoneNumber(toNumber);
      
      if (this.isDemoMode) {
        // Demo mode - just log the message
        console.log('📱 WhatsApp Alert (Demo Mode):');
        console.log(`To: ${formattedNumber}`);
        console.log(`Message: ${message}`);
        console.log('─'.repeat(50));
        
        return {
          success: true,
          messageId: 'demo_' + Date.now(),
          status: 'sent_demo',
          to: formattedNumber,
          message: message
        };
      }

      // Production mode - send actual WhatsApp message
      const twilioClient = require('twilio')(this.twilioAccountSid, this.twilioAuthToken);
      
      const messageResponse = await twilioClient.messages.create({
        body: message,
        from: this.twilioWhatsAppNumber,
        to: `whatsapp:${formattedNumber}`
      });

      return {
        success: true,
        messageId: messageResponse.sid,
        status: messageResponse.status,
        to: formattedNumber,
        message: message
      };

    } catch (error) {
      console.error('WhatsApp sending error:', error.message);
      
      return {
        success: false,
        error: error.message,
        to: toNumber,
        message: message
      };
    }
  }

  // Format phone number for WhatsApp
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      // Assume Indian number if 10 digits
      cleaned = '91' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      // Remove leading zero and add country code
      cleaned = '91' + cleaned.substring(1);
    }
    
    return '+' + cleaned;
  }

  // Send rain alert to farmer
  async sendRainAlert(farmerData, rainPredictions, location) {
    try {
      const { whatsappNumber, language = 'both' } = farmerData;
      
      // Import weather service here to avoid circular dependency
      const weatherService = require('./weatherService');
      const message = weatherService.formatRainAlertMessage(rainPredictions, location, language);
      
      if (!message) {
        throw new Error('No rain alert message to send');
      }

      const result = await this.sendMessage(whatsappNumber, message);
      
      // Log the alert
      console.log(`Rain alert sent to ${whatsappNumber}:`, result.success ? 'SUCCESS' : 'FAILED');
      
      return result;
    } catch (error) {
      console.error('Rain alert sending error:', error.message);
      throw error;
    }
  }

  // Send bulk rain alerts
  async sendBulkRainAlerts(alertData) {
    const results = [];
    
    for (const alert of alertData) {
      try {
        const result = await this.sendRainAlert(
          alert.farmerData,
          alert.rainPredictions,
          alert.location
        );
        results.push({ ...result, farmerId: alert.farmerData.userId });
        
        // Add delay between messages to avoid rate limiting
        await this.delay(1000);
        
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          farmerId: alert.farmerData.userId,
          to: alert.farmerData.whatsappNumber
        });
      }
    }
    
    return results;
  }

  // Send test message
  async sendTestMessage(phoneNumber, userName = 'Test User') {
    const testMessage = `🌾 KisanGPT Rain Alert Test\n\nHello ${userName}!\n\nYour rain alerts are now active. You will receive notifications 4 days before expected rainfall.\n\n✅ Test successful!\n\n---\n\n🌾 KisanGPT वर्षा अलर्ट टेस्ट\n\nनमस्कार ${userName}!\n\nआपके वर्षा अलर्ट अब सक्रिय हैं। आपको अपेक्षित वर्षा से 4 दिन पहले सूचनाएं मिलेंगी।\n\n✅ टेस्ट सफल!`;
    
    return await this.sendMessage(phoneNumber, testMessage);
  }

  // Utility function for delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate phone number
  isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  // Get service status
  getServiceStatus() {
    return {
      isActive: true,
      mode: this.isDemoMode ? 'demo' : 'production',
      provider: 'Twilio',
      configured: !this.isDemoMode
    };
  }
}

module.exports = new WhatsAppService();