const cron = require('node-cron');
const RainAlert = require('../models/RainAlert');
const User = require('../models/User');
const weatherService = require('./weatherService');
const whatsappService = require('./whatsappService');

class RainMonitorService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.lastRunTime = null;
    this.stats = {
      totalAlertsSent: 0,
      successfulAlerts: 0,
      failedAlerts: 0,
      lastRunDate: null,
      nextRunDate: null
    };
  }

  // Start the automated rain monitoring
  start() {
    if (this.isRunning) {
      console.log('🌧️ Rain monitoring service is already running');
      return;
    }

    // Schedule to run every day at 7:00 AM
    this.cronJob = cron.schedule('0 7 * * *', async () => {
      await this.checkAndSendRainAlerts();
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.cronJob.start();
    this.isRunning = true;
    
    console.log('🌧️ Rain monitoring service started - scheduled to run daily at 7:00 AM IST');
    this.updateNextRunDate();
  }

  // Stop the automated rain monitoring
  stop() {
    if (!this.isRunning) {
      console.log('🌧️ Rain monitoring service is not running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
    }

    this.isRunning = false;
    console.log('🌧️ Rain monitoring service stopped');
  }

  // Main function to check rain predictions and send alerts
  async checkAndSendRainAlerts() {
    try {
      console.log('🔍 Starting rain prediction check...');
      this.lastRunTime = new Date();
      this.stats.lastRunDate = this.lastRunTime;

      // Get all active rain alert settings
      const activeAlerts = await RainAlert.findAll({
        where: { isActive: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });

      if (activeAlerts.length === 0) {
        console.log('📍 No active rain alert subscriptions found');
        return;
      }

      console.log(`📍 Found ${activeAlerts.length} active rain alert subscriptions`);

      const alertsToSend = [];

      // Check rain prediction for each user
      for (const alert of activeAlerts) {
        try {
          const rainPrediction = await weatherService.checkRainPrediction(
            alert.location.latitude,
            alert.location.longitude,
            alert.alertDays,
            alert.rainThreshold
          );

          if (rainPrediction.hasRainPrediction) {
            // Check if we already sent an alert today
            const lastAlert = alert.lastAlertSent;
            const today = new Date();
            const isAlreadySentToday = lastAlert && 
              lastAlert.toDateString() === today.toDateString();

            if (!isAlreadySentToday) {
              alertsToSend.push({
                farmerData: {
                  userId: alert.userId,
                  whatsappNumber: alert.whatsappNumber,
                  language: alert.language
                },
                rainPredictions: rainPrediction.predictions,
                location: alert.location,
                alertSettings: alert
              });
            } else {
              console.log(`⏭️ Already sent alert today for user ${alert.user.name} (${alert.whatsappNumber})`);
            }
          }
        } catch (error) {
          console.error(`❌ Error checking rain prediction for user ${alert.user.name}:`, error.message);
        }
      }

      if (alertsToSend.length === 0) {
        console.log('☀️ No rain alerts to send today');
        this.updateNextRunDate();
        return;
      }

      console.log(`📱 Sending ${alertsToSend.length} rain alerts...`);

      // Send alerts in batches to avoid overwhelming the WhatsApp API
      const batchSize = 5;
      let batchResults = [];

      for (let i = 0; i < alertsToSend.length; i += batchSize) {
        const batch = alertsToSend.slice(i, i + batchSize);
        const results = await whatsappService.sendBulkRainAlerts(batch);
        batchResults.push(...results);

        // Update database with last alert sent time for successful sends
        for (let j = 0; j < batch.length; j++) {
          const alert = batch[j];
          const result = results[j];
          
          if (result.success) {
            await RainAlert.update(
              { lastAlertSent: new Date() },
              { where: { userId: alert.farmerData.userId } }
            );
          }
        }

        // Add delay between batches
        if (i + batchSize < alertsToSend.length) {
          await this.delay(5000); // 5 second delay between batches
        }
      }

      // Update statistics
      this.stats.totalAlertsSent += batchResults.length;
      this.stats.successfulAlerts += batchResults.filter(r => r.success).length;
      this.stats.failedAlerts += batchResults.filter(r => !r.success).length;

      console.log('📊 Rain alert batch results:');
      console.log(`✅ Successful: ${batchResults.filter(r => r.success).length}`);
      console.log(`❌ Failed: ${batchResults.filter(r => !r.success).length}`);
      
      this.updateNextRunDate();
      
    } catch (error) {
      console.error('💥 Error in rain monitoring service:', error);
    }
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('🔧 Manual rain alert check triggered');
    await this.checkAndSendRainAlerts();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.getNextRunTime(),
      stats: this.stats,
      cronExpression: '0 7 * * *',
      timezone: 'Asia/Kolkata'
    };
  }

  // Get next scheduled run time
  getNextRunTime() {
    if (!this.isRunning || !this.cronJob) return null;
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    
    return tomorrow;
  }

  // Update next run date in stats
  updateNextRunDate() {
    this.stats.nextRunDate = this.getNextRunTime();
  }

  // Utility function for delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get detailed statistics
  async getDetailedStats() {
    try {
      const totalUsers = await RainAlert.count();
      const activeUsers = await RainAlert.count({ where: { isActive: true } });
      const inactiveUsers = totalUsers - activeUsers;
      
      const recentAlerts = await RainAlert.findAll({
        where: {
          lastAlertSent: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['name', 'email']
        }],
        order: [['lastAlertSent', 'DESC']],
        limit: 10
      });

      return {
        serviceStatus: this.getStatus(),
        userStats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        recentAlerts: recentAlerts.map(alert => ({
          userName: alert.user.name,
          location: alert.location.name || `${alert.location.latitude}, ${alert.location.longitude}`,
          lastAlertSent: alert.lastAlertSent,
          whatsappNumber: alert.whatsappNumber.replace(/(\d{2})(\d{5})(\d{5})/, '+$1 $2-$3') // Mask number
        }))
      };
    } catch (error) {
      console.error('Error getting detailed stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const rainMonitorService = new RainMonitorService();

// Auto-start the service when the module is loaded
if (process.env.NODE_ENV === 'production') {
  rainMonitorService.start();
} else {
  console.log('🔧 Rain monitoring service in development mode - start manually');
}

module.exports = rainMonitorService;