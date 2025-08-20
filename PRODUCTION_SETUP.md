# Production Setup Requirements

## Required Environment Variables

The following environment variables MUST be set in the production environment (Render) for full AI functionality:

### Essential for AI Generation
```bash
# OpenAI API Configuration (REQUIRED)
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# Production Environment
NODE_ENV=production
PORT=8080

# Database
DATABASE_PATH=./db/soulmatesketch.sqlite

# File Storage
UPLOADS_DIR=./uploads
```

### Optional (for enhanced features)
```bash
# Stripe (if payments needed)
STRIPE_SECRET_KEY=sk_live_your-stripe-live-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email (if email delivery needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@soulmatesketch.com
```

## AI Features Enabled

With proper OpenAI API key configuration, the system will provide:

1. **GPT-4 Generated Reports**:
   - Deeply personalized soulmate profiles
   - Numerology and astrology integration
   - Personality-based recommendations
   - Love language analysis
   - Cultural and location insights

2. **DALL-E 3 Generated Images**:
   - Hyper-realistic soulmate portraits
   - Personalized based on quiz responses
   - Astrological and numerological energy
   - Cultural resonance integration
   - Multiple style options

3. **Enhanced Personalization**:
   - Birth chart analysis
   - Life path number calculations
   - Compatibility insights
   - Spiritual guidance
   - Manifestation timing

## Testing AI Generation

Once deployed with proper API keys, test with:
1. Go to /order.html
2. Complete the full quiz with detailed information
3. Use "Test Deliverables" button
4. Verify AI-generated content is received

## Fallback Behavior

Without API keys, the system gracefully falls back to:
- Sample text content
- Placeholder images
- Basic functionality maintained

But for production, authentic AI generation is essential for the premium experience.