import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import pino from 'pino';
import { createRouter } from './routes.js';
import { demoHtml } from './templates.js';

const app = express();
const logger = pino({ transport: { target: 'pino-pretty' } });

// Configure CSP to allow Stripe scripts and other required external resources
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://js.stripe.com"],
        "script-src-attr": ["'unsafe-inline'", "'unsafe-hashes'"],
        "style-src": ["'self'", 'https:', "'unsafe-inline'"],
        "img-src": ["'self'", 'data:', 'https:'],
        "connect-src": ["'self'", "https://api.stripe.com"],
        "frame-src": ["'self'", "https://js.stripe.com"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'self'"],
      },
    },
  })
);

// Configure rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 API requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again after 15 minutes.'
  }
});

// Even stricter rate limiting for payment-related endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 payment requests per windowMs
  message: {
    error: 'Too many payment requests from this IP, please try again after 15 minutes.'
  }
});

app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use(morgan('dev'));

// Apply general rate limiting to all requests
app.use(limiter);

// API routes with rate limiting (before static files)
console.log('🔧 Loading API routes...');
const apiRouter = createRouter();
console.log('🔧 API router created:', !!apiRouter);
app.use('/api', apiLimiter, apiRouter);

// Apply stricter rate limiting to payment endpoints
app.use('/api/payment-intent', paymentLimiter);
app.use('/api/orders', paymentLimiter);

// Specific routes BEFORE static file serving
// Landing page - serve the Sketch My Soulmate design
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Disable caching for the root HTML to ensure latest UI ships
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Order page - serve the payment page (BEFORE static middleware)
app.get('/order.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  console.log('📄 Serving order.html page via explicit route');
  res.sendFile(path.join(process.cwd(), 'public', 'order.html'));
});

// Apple logo - ensure image is served properly (BEFORE static middleware)
app.get('/images/apple-logo.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  console.log('🍎 Serving Apple logo image via explicit route');
  res.sendFile(path.join(process.cwd(), 'public', 'images', 'apple-logo.png'));
});

// Serve static from public (for starfield.js and assets) - AFTER specific routes
const publicPath = path.join(process.cwd(), 'public');
console.log('🗂️ Serving static files from:', publicPath);
console.log('🗂️ Current working directory:', process.cwd());
console.log('🗂️ Public directory exists:', fs.existsSync(publicPath));

app.use(express.static(publicPath, {
  etag: false,
  lastModified: false,
  cacheControl: true,
  setHeaders: (res, filePath) => {
    console.log('📁 Serving static file:', filePath);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
}));

// Static uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  logger.info(`Soulmate Sketch backend running on http://localhost:${port}`);
});
