const express = require('express');
const emailService = require('../utils/emailService');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Test email connection (admin only)
router.get('/test-connection', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await emailService.testConnection();
    res.json({
      success: true,
      message: 'Email connection verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email connection failed',
      error: error.message
    });
  }
});

// Send test email (admin only, development only)
router.post('/test-email', authenticate, authorize('ADMIN'), async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Test email endpoint is disabled in production'
    });
  }

  const { email, type = 'welcome' } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required'
    });
  }

  try {
    let result;
    
    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(email, 'Test User');
        break;
      case 'otp':
        result = await emailService.sendOTP(email, '123456', 'Test User');
        break;
      case 'password-change':
        result = await emailService.sendPasswordChangeNotification(email, 'Test User');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Use: welcome, otp, password-change'
        });
    }

    res.json({
      success: true,
      message: `Test ${type} email sent successfully`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;