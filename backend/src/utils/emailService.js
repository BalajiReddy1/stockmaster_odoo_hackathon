const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Create transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development configuration - using Gmail or test account
      if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        // Gmail SMTP (for development)
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS, // Use App Password for Gmail
          },
        });
      } else {
        // Ethereal test account for development
        this.createTestAccount();
      }
    }
  }

  async createTestAccount() {
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('📧 Test email account created:');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
    } catch (error) {
      console.error('Failed to create test account:', error);
      this.transporter = null;
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = '') {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Inventora'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@inventora.com'}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendOTP(email, otp, userName = 'User') {
    const subject = 'Your Inventora Password Reset Code';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; border: 2px solid #4f46e5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 8px; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inventora</h1>
            <p>Inventory Management System</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Dear ${userName},</p>
            <p>You have requested to reset your password for your Inventora account. Please use the verification code below:</p>
            
            <div class="otp-box">
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>Important:</strong>
              <ul>
                <li>This code will expire in <strong>10 minutes</strong></li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this reset, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you continue to have problems, please contact our support team.</p>
            
            <p>Best regards,<br>The Stock Master Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2025 Stock Master. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Dear ${userName},

Your Inventora password reset verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this password reset, please ignore this email.

Best regards,
Inventora Team
    `;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }

  async sendWelcomeEmail(email, userName) {
    const subject = 'Welcome to Inventora IMS!';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Inventora</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
          .welcome-box { background: white; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .features { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .feature-list { list-style: none; padding: 0; }
          .feature-list li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Inventora!</h1>
            <p>Inventory Management System</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2>Hello ${userName}!</h2>
              <p>Your account has been successfully created. You're now ready to start managing your inventory with Inventora.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Get Started</a>
            </div>
            
            <div class="features">
              <h3>What you can do with Inventora:</h3>
              <ul class="feature-list">
                <li>📦 Manage product inventory</li>
                <li>🏭 Track warehouse locations</li>
                <li>📄 Process receipts and deliveries</li>
                <li>📊 Monitor stock levels</li>
                <li>🔄 Handle internal transfers</li>
                <li>📈 Generate inventory reports</li>
              </ul>
            </div>
            
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            
            <p>Best regards,<br>The Stock Master Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2025 Stock Master. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to Inventora Inventory Management System!

Hello ${userName},

Your account has been successfully created. You're now ready to start managing your inventory with Inventora.

What you can do:
- Manage product inventory
- Track warehouse locations  
- Process receipts and deliveries
- Monitor stock levels
- Handle internal transfers
- Generate inventory reports

Get started: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login

Best regards,
The Inventora Team
    `;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }

  async sendPasswordChangeNotification(email, userName) {
    const subject = 'Password Changed Successfully - Inventora';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background: white; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inventora</h1>
            <p>Security Notification</p>
          </div>
          <div class="content">
            <div class="success-box">
              <h2>✅ Password Changed Successfully</h2>
              <p>Dear ${userName},</p>
              <p>Your Inventora account password has been successfully changed on ${new Date().toLocaleString()}.</p>
            </div>
            
            <div class="warning">
              <strong>Didn't make this change?</strong>
              <p>If you did not initiate this password change, please contact our support team immediately and secure your account.</p>
            </div>
            
            <p>For your security, we recommend:</p>
            <ul>
              <li>Using a strong, unique password</li>
              <li>Not sharing your password with anyone</li>
              <li>Logging out from shared devices</li>
            </ul>
            
            <p>Best regards,<br>The Inventora Security Team</p>
          </div>
          <div class="footer">
            <p>This is an automated security message. Please do not reply to this email.</p>
            <p>&copy; 2025 Inventora. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Inventora - Password Changed Successfully

Dear ${userName},

Your Inventora account password has been successfully changed on ${new Date().toLocaleString()}.

If you did not make this change, please contact our support team immediately.

For your security, we recommend:
- Using a strong, unique password
- Not sharing your password with anyone  
- Logging out from shared devices

Best regards,
The Inventora Security Team
    `;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }

  // Test email connection
  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;