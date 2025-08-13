# SoulmateSketch v2

AI-powered soulmate sketch generator with mystical insights.

## Features

- 🎨 Beautiful two-column design with glassmorphism UI
- 🤖 AI-powered image generation using OpenAI DALL-E
- 📸 Photo analysis for personalized traits
- 🔮 Numerology integration from birthdate
- 📱 Fully responsive mobile design
- 🎭 Neural network visualization during processing

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

3. Start the server:
```bash
npm start
```

4. Open http://localhost:8080

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KingIVthe1st/soulsketchv2)

## Environment Variables

- `OPENAI_API_KEY` - Required for AI features
- `STRIPE_SECRET_KEY` - Optional for payments (simulated without it)

## Tech Stack

- Node.js + Express
- OpenAI API (GPT-4 Vision + DALL-E 3)
- SQLite database
- Vanilla JavaScript frontend
- Modern CSS with animations
