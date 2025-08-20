# SoulmateSketch Environment Variables

## Production Environment Configuration

This document lists all environment variables required for production deployment of the SoulmateSketch Professional Deliverables System.

## 🚨 Required Variables

### Core Application
```bash
NODE_ENV=production
PORT=8080
```

### OpenAI Integration (Required)
```bash
# Required for AI image generation with DALL-E 3
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_TIMEOUT=60000
```

### Stripe Payment Processing (Required)
```bash
# Required for payment processing
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
STRIPE_TIMEOUT=30000
```

### Security Configuration (Required)
```bash
# Required for admin monitoring endpoints
ADMIN_API_KEY=your-secure-32-character-admin-key-here

# Required for JWT authentication features
JWT_SECRET=your-jwt-secret-minimum-32-characters-here
```

## ⚡ Email Delivery Configuration

**Choose ONE email service:**

### Option A: SMTP (Gmail/Custom SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
EMAIL_TIMEOUT=30000
```

### Option B: SendGrid
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
EMAIL_TIMEOUT=30000
```

### Option C: Mailgun
```bash
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
SMTP_FROM_EMAIL=noreply@yourdomain.com
EMAIL_TIMEOUT=30000
```

## 📁 File Storage Configuration

```bash
# Database location (SQLite)
DATABASE_PATH=./db/soulmatesketch.sqlite

# File upload directory
UPLOADS_DIR=./uploads

# Logs directory
LOGS_DIR=./logs
```

## 🛡️ Security & Rate Limiting

```bash
# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature toggles
ENABLE_EMAIL_DELIVERY=true
ENABLE_ORDER_CONFIRMATIONS=true
ENABLE_MONITORING_ENDPOINTS=true
ENABLE_MAINTENANCE_ENDPOINTS=false
```

## 🎨 PDF & Image Generation

```bash
# PDF branding
PDF_BRAND_COLOR=#E91E63
PDF_ACCENT_COLOR=#2D2240
PDF_FONT_FAMILY=Helvetica

# Image generation settings
DEFAULT_IMAGE_STYLE=realistic
DEFAULT_IMAGE_SIZE=1024x1024
IMAGE_QUALITY=hd
ENABLE_IMAGE_OPTIMIZATION=true
```

## 🔧 Optional Configuration

### Cleanup & Maintenance
```bash
AUTO_CLEANUP_ENABLED=false
CLEANUP_OLDER_THAN_DAYS=7
CLEANUP_SCHEDULE_CRON=0 2 * * *
```

### Monitoring & Logging
```bash
ENABLE_DETAILED_LOGGING=true
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn-here
```

### Caching (Optional)
```bash
ENABLE_RESPONSE_CACHING=false
CACHE_TTL_SECONDS=300
```

### Development/Debug (Never enable in production)
```bash
# DEBUG_MODE=false
# EXPOSE_DEBUG_ENDPOINTS=false
# SAVE_RAW_QUIZ_DATA=false
```

## 🚀 Platform-Specific Configuration

### Vercel
- Set all environment variables in Vercel dashboard
- Use production Stripe keys (sk_live_...)
- Configure webhook endpoints in Stripe dashboard

### Render
- Use environment variables section in Render dashboard
- Ensure DATABASE_PATH points to persistent storage if needed

### Railway
- Configure environment variables in Railway dashboard
- Set up persistent volumes for SQLite database

### Self-Hosted
- Create .env file with all required variables
- Ensure proper file permissions for uploads directory
- Configure reverse proxy (nginx/Apache) for HTTPS

## ✅ Environment Validation

Use the built-in security check:
```bash
npm run security-check
```

Or manually validate:
```bash
node -e "
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing');
console.log('ADMIN_API_KEY:', process.env.ADMIN_API_KEY ? 'Set' : 'Missing');
"
```

## 🔗 Quick Setup Commands

### Copy and configure environment:
```bash
cp .env.example .env
# Edit .env with your production values
```

### Test configuration:
```bash
npm run security-check
```

### Start in production mode:
```bash
npm run production
```

## 📋 Deployment Checklist

- [ ] NODE_ENV set to "production"
- [ ] OPENAI_API_KEY configured with valid key
- [ ] STRIPE_SECRET_KEY configured with live key
- [ ] ADMIN_API_KEY set with secure random key
- [ ] Email service configured (SMTP/SendGrid/Mailgun)
- [ ] Database path accessible and writable
- [ ] Uploads directory exists and writable
- [ ] Security check passes all tests
- [ ] All required environment variables set

## 🆘 Troubleshooting

### Missing Environment Variables
If environment variables are missing, the application will:
- Log warnings for optional variables
- Return 503 errors for endpoints requiring missing services
- Continue running with degraded functionality

### Common Issues
1. **Stripe not working**: Check STRIPE_SECRET_KEY format (should start with sk_live_ for production)
2. **Email not sending**: Verify email service credentials and quotas
3. **AI generation failing**: Verify OPENAI_API_KEY has sufficient credits
4. **Admin endpoints not accessible**: Check ADMIN_API_KEY is set and matches Bearer token

For complete deployment instructions, see `PRODUCTION_DEPLOYMENT_GUIDE.md`.