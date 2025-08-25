# 📧 Email Delivery Setup Guide

## Current Status
✅ **Email system implemented** with professional templates  
✅ **Attachment support** for PDF reports and images  
✅ **Order confirmations** integrated with payment flow  
⚠️  **Production email service needs configuration**

## Quick Setup (Resend - Recommended)

### 1. Create Resend Account
1. Visit [resend.com](https://resend.com)
2. Sign up for free account (10,000 emails/month)
3. Verify your email address

### 2. Add Domain (Optional but Recommended)
1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `soulmatesketch.com`)
3. Add DNS records provided by Resend
4. Wait for verification

### 3. Get API Key
1. Go to "API Keys" in Resend dashboard
2. Create new API key
3. Copy the key (starts with `re_`)

### 4. Configure Environment Variables
Add to your production environment:
```bash
RESEND_API_KEY=re_your-actual-api-key-here
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### 5. Test Configuration
```bash
npm install
npm run production
```

## Alternative: SMTP Setup (Gmail)

### 1. Enable 2-Factor Authentication
- Go to Google Account settings
- Enable 2-factor authentication

### 2. Create App Password
- Go to "App passwords" in Google Account
- Create password for "Mail"
- Copy the 16-character password

### 3. Configure Environment Variables
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

## Email Features Included

### 📨 Order Confirmation Emails
- Sent immediately when payment completes
- Professional branding with order details
- Estimated delivery time

### 📄 Report Delivery Emails
- Beautiful HTML templates with gradient design
- PDF report attachment (professional format)
- High-quality soulmate portrait attachment
- Personalized content based on service tier

### 🔍 Delivery Tracking
- JSON logs for monitoring delivery status
- Error handling with retry capabilities
- Development mode with local logging

## Configuration Options

### Environment Variables
```bash
# Required - Choose ONE email service
RESEND_API_KEY=re_your-key                    # Option 1: Resend (recommended)
# OR
SMTP_HOST=smtp.gmail.com                      # Option 2: SMTP
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Always required
SMTP_FROM_EMAIL=noreply@yourdomain.com       # Your sender email
EMAIL_TIMEOUT=30000                          # Timeout in milliseconds
```

### Service Comparison

| Service | Free Limit | Pros | Cons |
|---------|------------|------|------|
| **Resend** | 10k/month | Simple API, great docs, analytics | Newer service |
| **SMTP (Gmail)** | 500/day | Reliable, free | Requires app passwords |
| **SendGrid** | 100/day | Enterprise features | Complex setup |
| **Mailgun** | 5k/month | Good for high volume | Pricing complexity |

## Testing Email Delivery

### 1. Development Mode
Without email config, system logs emails to `/logs/email-deliveries.json`

### 2. Test Email
```bash
curl -X POST http://localhost:8080/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 3. Production Test
1. Complete a small order ($19.99)
2. Check email delivery
3. Verify attachments open correctly

## Troubleshooting

### Common Issues

**1. Resend "Domain not verified"**
- Solution: Add DNS records or use your verified domain

**2. Gmail "Authentication failed"**
- Solution: Use app password, not regular password

**3. Emails not arriving**
- Check spam folder
- Verify sender email format
- Check service quotas

**4. Attachments too large**
- PDF reports: ~200KB (normal)
- Images: ~100KB (normal)
- Total limit: 25MB per email

### Debug Mode
Enable detailed logging:
```bash
ENABLE_DETAILED_LOGGING=true
LOG_LEVEL=debug
```

## Security Best Practices

1. **Never commit API keys** to source control
2. **Use environment variables** for all credentials
3. **Rotate API keys** periodically
4. **Monitor email quotas** to prevent service disruption
5. **Use verified domains** to improve deliverability

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ⚡ Choose email service (Resend recommended)
3. 🔑 Configure environment variables
4. 🧪 Test with small order
5. 🚀 Deploy to production

## Support

For email delivery issues:
- Check service status pages
- Review logs in `/logs/email-deliveries.json`
- Test with curl commands above
- Contact your email service provider

**Production Ready**: The email system is fully implemented and ready for production use once you configure your preferred email service provider.