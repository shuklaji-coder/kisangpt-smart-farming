const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const RainAlert = require('../models/RainAlert');
const User = require('../models/User');
const weatherService = require('../services/weatherService');
const whatsappService = require('../services/whatsappService');

// Get user's rain alert settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const rainAlert = await RainAlert.findOne({
      where: { userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!rainAlert) {
      return res.json({
        success: true,
        message: 'No rain alert settings found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Rain alert settings retrieved successfully',
      data: rainAlert
    });
  } catch (error) {
    console.error('Get rain alert settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rain alert settings'
    });
  }
});

// Create or update rain alert settings
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      whatsappNumber,
      location,
      alertDays = 4,
      rainThreshold = 2.5,
      alertTime = '08:00',
      language = 'both',
      isActive = true
    } = req.body;

    // Validate required fields
    if (!whatsappNumber || !location) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number and location are required'
      });
    }

    // Validate phone number
    if (!whatsappService.isValidPhoneNumber(whatsappNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid WhatsApp number format'
      });
    }

    // Validate location format
    if (!location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location must include latitude and longitude'
      });
    }

    // Check if rain alert settings already exist
    let rainAlert = await RainAlert.findOne({ where: { userId } });

    if (rainAlert) {
      // Update existing settings
      await rainAlert.update({
        whatsappNumber,
        location,
        alertDays,
        rainThreshold,
        alertTime,
        language,
        isActive,
        updatedAt: new Date()
      });
    } else {
      // Create new settings
      rainAlert = await RainAlert.create({
        userId,
        whatsappNumber,
        location,
        alertDays,
        rainThreshold,
        alertTime,
        language,
        isActive
      });
    }

    res.json({
      success: true,
      message: 'Rain alert settings saved successfully',
      data: rainAlert
    });
  } catch (error) {
    console.error('Save rain alert settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving rain alert settings'
    });
  }
});

// Test WhatsApp connection
router.post('/test-whatsapp', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { whatsappNumber } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number is required'
      });
    }

    // Validate phone number
    if (!whatsappService.isValidPhoneNumber(whatsappNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid WhatsApp number format'
      });
    }

    // Get user info
    const user = await User.findByPk(userId);
    
    // Send test message
    const result = await whatsappService.sendTestMessage(whatsappNumber, user.name);

    res.json({
      success: result.success,
      message: result.success ? 'Test message sent successfully' : 'Failed to send test message',
      data: result
    });
  } catch (error) {
    console.error('Test WhatsApp error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while testing WhatsApp connection'
    });
  }
});

// Check rain prediction for user's location
router.get('/check-rain', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const rainAlert = await RainAlert.findOne({ where: { userId } });
    
    if (!rainAlert) {
      return res.status(404).json({
        success: false,
        message: 'Rain alert settings not found. Please configure your settings first.'
      });
    }

    const { location, alertDays, rainThreshold } = rainAlert;
    
    // Check rain prediction
    const rainPrediction = await weatherService.checkRainPrediction(
      location.latitude,
      location.longitude,
      alertDays,
      rainThreshold
    );

    res.json({
      success: true,
      message: 'Rain prediction check completed',
      data: {
        ...rainPrediction,
        location: location,
        alertSettings: {
          alertDays,
          rainThreshold,
          language: rainAlert.language
        }
      }
    });
  } catch (error) {
    console.error('Check rain prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking rain prediction'
    });
  }
});

// Send manual rain alert
router.post('/send-alert', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const rainAlert = await RainAlert.findOne({ 
      where: { userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });
    
    if (!rainAlert) {
      return res.status(404).json({
        success: false,
        message: 'Rain alert settings not found'
      });
    }

    if (!rainAlert.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Rain alerts are disabled. Please enable them in settings.'
      });
    }

    // Check rain prediction
    const rainPrediction = await weatherService.checkRainPrediction(
      rainAlert.location.latitude,
      rainAlert.location.longitude,
      rainAlert.alertDays,
      rainAlert.rainThreshold
    );

    if (!rainPrediction.hasRainPrediction) {
      return res.json({
        success: true,
        message: 'No rain predicted in the next ' + rainAlert.alertDays + ' days',
        data: { sent: false, prediction: rainPrediction }
      });
    }

    // Send WhatsApp alert
    const alertResult = await whatsappService.sendRainAlert(
      {
        userId: userId,
        whatsappNumber: rainAlert.whatsappNumber,
        language: rainAlert.language
      },
      rainPrediction.predictions,
      rainAlert.location
    );

    // Update last alert sent time
    await rainAlert.update({ lastAlertSent: new Date() });

    res.json({
      success: alertResult.success,
      message: alertResult.success ? 'Rain alert sent successfully' : 'Failed to send rain alert',
      data: {
        sent: alertResult.success,
        prediction: rainPrediction,
        whatsappResult: alertResult
      }
    });
  } catch (error) {
    console.error('Send rain alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending rain alert'
    });
  }
});

// Get WhatsApp service status
router.get('/whatsapp-status', authenticateToken, async (req, res) => {
  try {
    const status = whatsappService.getServiceStatus();
    
    res.json({
      success: true,
      message: 'WhatsApp service status retrieved',
      data: status
    });
  } catch (error) {
    console.error('Get WhatsApp status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting WhatsApp status'
    });
  }
});

// Delete rain alert settings
router.delete('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const rainAlert = await RainAlert.findOne({ where: { userId } });
    
    if (!rainAlert) {
      return res.status(404).json({
        success: false,
        message: 'Rain alert settings not found'
      });
    }

    await rainAlert.destroy();

    res.json({
      success: true,
      message: 'Rain alert settings deleted successfully'
    });
  } catch (error) {
    console.error('Delete rain alert settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting rain alert settings'
    });
  }
});

module.exports = router;