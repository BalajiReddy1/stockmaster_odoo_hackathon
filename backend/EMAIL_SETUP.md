# Email Configuration Guide

This guide explains how to set up email sending with different providers for your **Inventora** application.

## 📧 Quick Gmail Setup (Development)

**Yes! Adding just these two environment variables will make email work with Gmail:**

```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-char-app-password
```

**Setup Steps:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings → Security
   - 2-Step Verification → App passwords  
   - Generate password for "Mail"
3. Copy `.env.example` to `.env`
4. Add your credentials to `.env`
5. Restart your server

## 📧 Email Service Options

### 1. **Gmail SMTP (Development/Testing)**

**Setup:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

**Environment Variables:**
```env
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-char-app-password
```

### 2. **Production SMTP Providers**

#### **SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### **Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

#### **AWS SES**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-ses-smtp-username
SMTP_PASS=your-aws-ses-smtp-password
```

#### **Outlook/Hotmail**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-outlook-email@outlook.com
SMTP_PASS=your-outlook-password
```

### 3. **Ethereal Email (Testing)**

For testing purposes, the application will automatically create a test account using Ethereal Email if no other configuration is provided.

## 🚀 Quick Setup

### For Development (Gmail):
1. Copy `.env.example` to `.env`
2. Add your Gmail credentials:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=your-app-password
   ```

### For Production:
1. Choose a professional email service (SendGrid, Mailgun, AWS SES)
2. Configure SMTP settings in your `.env` file
3. Set `NODE_ENV=production`

## 📝 Email Templates

The email service includes professionally designed HTML templates for:

- **Welcome Email** - Sent after user registration
- **OTP Email** - Password reset verification code  
- **Password Change Notification** - Security notification

All templates are:
- Mobile responsive
- Professionally styled
- Include both HTML and text versions
- Branded with Inventora theme

## 🧪 Testing Email Functionality

To test the email service:

```javascript
// In your development environment
const emailService = require('./src/utils/emailService');

// Test connection
await emailService.testConnection();

// Send test OTP
await emailService.sendOTP('test@example.com', '123456', 'Test User');
```

## 🔒 Security Best Practices

1. **Use App Passwords** for Gmail (never use your actual password)
2. **Store credentials securely** in environment variables
3. **Use dedicated email service** for production (not personal Gmail)
4. **Monitor email sending** for suspicious activity
5. **Implement rate limiting** on email endpoints
6. **Validate email addresses** before sending

## 📊 Monitoring & Logging

The email service automatically logs:
- ✅ Successful email sends
- ❌ Failed attempts
- 📧 Preview URLs (for testing)
- 🔗 Message IDs for tracking

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid login" error**
   - Check username/password
   - Ensure 2FA is enabled for Gmail
   - Use App Password, not regular password

2. **"Connection refused" error**  
   - Verify SMTP host and port
   - Check firewall settings
   - Ensure TLS/SSL settings are correct

3. **Emails go to spam**
   - Configure SPF/DKIM records
   - Use professional email service
   - Include unsubscribe link

### Testing Commands:

```bash
# Test email connection
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 📈 Scaling for Production

For high-volume email sending:

1. **Use dedicated email service** (SendGrid, Mailgun)
2. **Implement email queuing** (Bull Queue, Agenda)
3. **Add email templates** in database
4. **Monitor delivery rates**
5. **Set up webhooks** for bounce handling

---

**Need help?** Check the console logs for detailed error messages and preview URLs during development.