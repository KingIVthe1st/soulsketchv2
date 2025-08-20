# SoulmateSketch Production Deployment Guide

## Overview

The SoulmateSketch Professional Deliverables System is ready for production deployment. This guide covers the complete deployment process for **Vercel** (primary platform) with alternative deployment options.

## ✅ Deployment Readiness Status

### Current Configuration
- **Platform**: Configured for Vercel deployment
- **Runtime**: Node.js 20+ (specified in package.json)
- **Architecture**: Express.js with SQLite database
- **Security**: Production-ready with comprehensive security measures
- **GitHub**: Code pushed to https://github.com/KingIVthe1st/soulsketchv2.git

### Security Features Implemented
- ✅ Express rate limiting with multiple tiers
- ✅ Helmet.js security headers with CSP
- ✅ File upload security with type/size validation
- ✅ Input validation using Zod schemas
- ✅ Admin endpoint authentication
- ✅ Error sanitization for production
- ✅ UUID validation for all endpoints

---

## 🚀 Vercel Deployment (Recommended)

### Step 1: Vercel Configuration

The project includes a `vercel.json` configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/server.js"
    }
  ]
}
```

### Step 2: Environment Variables Setup

Configure the following environment variables in Vercel dashboard:

#### Required Variables
```bash
NODE_ENV=production
PORT=8080

# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
```

#### Security Configuration
```bash
# Admin API Key for monitoring endpoints
ADMIN_API_KEY=your-secure-32-character-admin-key-here

# JWT Secret for authentication features
JWT_SECRET=your-jwt-secret-minimum-32-characters-here
```

#### Email Configuration (Choose One)
```bash
# Option 1: SMTP (Gmail/Custom)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Option 2: SendGrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Option 3: Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
```

#### Production Configuration
```bash
# File Storage (Vercel compatible paths)
DATABASE_PATH=./db/soulmatesketch.sqlite
UPLOADS_DIR=./uploads
LOGS_DIR=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Professional Features
ENABLE_EMAIL_DELIVERY=true
ENABLE_ORDER_CONFIRMATIONS=true
ENABLE_MONITORING_ENDPOINTS=true
ENABLE_MAINTENANCE_ENDPOINTS=false

# Image Generation
DEFAULT_IMAGE_STYLE=realistic
DEFAULT_IMAGE_SIZE=1024x1024
IMAGE_QUALITY=hd
ENABLE_IMAGE_OPTIMIZATION=true

# Monitoring
ENABLE_DETAILED_LOGGING=true
LOG_LEVEL=info
```

### Step 3: Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel --prod
```

#### Option B: GitHub Integration
1. Connect your GitHub repository to Vercel
2. Import the project: https://github.com/KingIVthe1st/soulsketchv2
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Step 4: Database Setup on Vercel

**Important**: SQLite files are ephemeral on Vercel. For production, consider:

#### Option A: External Database (Recommended)
```bash
# Use external SQLite service or PostgreSQL
DATABASE_URL=your-database-connection-string
```

#### Option B: Vercel KV Storage
```bash
# Configure Vercel KV for order data persistence
VERCEL_KV_URL=your-kv-url
VERCEL_KV_REST_API_URL=your-kv-rest-api-url
VERCEL_KV_REST_API_TOKEN=your-kv-token
```

---

## 🔧 Alternative Deployment Platforms

### Render Deployment

Create `render.yaml` for Render deployment:

```yaml
services:
  - type: web
    name: soulmatesketch-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENAI_API_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
```

### Railway Deployment

1. Connect GitHub repository to Railway
2. Configure environment variables
3. Deploy automatically

### Self-Hosted Deployment

#### Using Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

#### Using PM2
```bash
npm install -g pm2
pm2 start src/server.js --name "soulmatesketch"
pm2 startup
pm2 save
```

---

## 🔐 Security Checklist

### Pre-Deployment Security Validation

Run the security check script:
```bash
./security-deployment-check.sh
```

Ensure all items pass:
- ✅ Rate limiting configured
- ✅ File upload security enabled
- ✅ Error sanitization active
- ✅ Admin endpoints secured
- ✅ Input validation implemented

### Production Environment Variables

**Required for Production:**
- `NODE_ENV=production`
- `OPENAI_API_KEY` (for AI image generation)
- `STRIPE_SECRET_KEY` (for payments)
- `ADMIN_API_KEY` (for monitoring endpoints)

**Recommended for Production:**
- Email service configuration (SMTP/SendGrid/Mailgun)
- `JWT_SECRET` for authentication
- `STRIPE_WEBHOOK_SECRET` for webhook verification

---

## 📊 API Endpoints

### Public Endpoints
- `POST /api/create-payment-intent` - Create Stripe payment intent
- `POST /api/orders` - Create new order
- `POST /api/orders/:id/intake` - Submit quiz and photo data
- `POST /api/orders/:id/generate` - Generate professional report
- `GET /api/orders/:id` - Get order status

### Protected Admin Endpoints (Require ADMIN_API_KEY)
- `GET /api/health/deliverables` - System health check
- `GET /api/stats/deliveries` - Delivery statistics
- `POST /api/maintenance/cleanup` - File cleanup utility
- `GET /api/validate/pdf/:orderId` - PDF validation

### Frontend Routes
- `/` - Landing page (SoulmateSketch homepage)
- `/order.html` - Order form
- `/pricing.html` - Pricing page
- All static assets served from `/public`

---

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health/deliverables \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

### 2. Payment Integration Test
```bash
curl -X POST https://your-domain.com/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 4997, "email": "test@example.com"}'
```

### 3. Order Creation Test
```bash
curl -X POST https://your-domain.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "tier": "premium"}'
```

### 4. Static Assets Test
- Visit: https://your-domain.com/
- Verify: Landing page loads with starfield effect
- Check: All CSS, JS, and image assets load correctly

---

## 📈 Monitoring & Maintenance

### Performance Monitoring
- Monitor response times for generation endpoints
- Track email delivery success rates
- Monitor file storage usage

### Maintenance Tasks
- Regular cleanup of old files (via `/api/maintenance/cleanup`)
- Monitor database size and performance
- Review delivery statistics regularly

### Logging
- Application logs via Pino logger
- Delivery tracking in `logs/deliverables.json`
- Email delivery logs in `logs/email-deliveries.json`

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Payment Processing Fails
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe webhook endpoint configuration
- Ensure `STRIPE_WEBHOOK_SECRET` is configured for webhooks

#### 2. Email Delivery Fails
- Verify SMTP credentials or email service API keys
- Check email service quotas and limits
- Review email delivery logs

#### 3. Image Generation Fails
- Verify `OPENAI_API_KEY` is valid and has credits
- Check OpenAI API rate limits
- Review image generation logs for errors

#### 4. File Upload Issues
- Verify upload directory permissions
- Check file size limits (5MB default)
- Ensure file type restrictions are working

### Debug Mode
For development debugging, set:
```bash
DEBUG_MODE=true
EXPOSE_DEBUG_ENDPOINTS=true
LOG_LEVEL=debug
```

**Note**: Never enable debug mode in production.

---

## 📞 Support & Documentation

- **Architecture**: See `PROFESSIONAL_DELIVERABLES_SYSTEM.md`
- **Security**: See `SECURITY_FIXES_IMPLEMENTED.md`
- **Frontend**: See `FRONTEND_INTEGRATION_COMPLETE.md`
- **Environment**: See `.env.example` for all configuration options

---

## ✅ Production Deployment Summary

The SoulmateSketch system is **production-ready** with:

1. **Secure Architecture**: Rate limiting, input validation, error sanitization
2. **Professional Deliverables**: PDF reports with AI-generated imagery
3. **Payment Integration**: Stripe payment processing with webhook support
4. **Email Delivery**: Professional email templates with attachments
5. **Monitoring**: Health checks, statistics, and maintenance endpoints
6. **Platform Ready**: Configured for Vercel with alternative deployment options

**Next Steps:**
1. Configure production environment variables
2. Deploy to chosen platform (Vercel recommended)
3. Configure external database for data persistence
4. Set up monitoring and backup procedures
5. Test all functionality in production environment

The system is ready for immediate production deployment.