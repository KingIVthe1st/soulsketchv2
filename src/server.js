import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
        "script-src": ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
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
app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use(morgan('dev'));

// Serve static from public (for starfield.js and assets)
app.use(express.static(path.join(process.cwd(), 'public'), {
  etag: false,
  lastModified: false,
  cacheControl: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  }
}));

// Static uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', createRouter());

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

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  logger.info(`Soulmate Sketch backend running on http://localhost:${port}`);
});
