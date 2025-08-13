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

// Relax CSP for demo to allow inline scripts/styles in the demo page
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", 'https:', "'unsafe-inline'"],
        "img-src": ["'self'", 'data:'],
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

// Static uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', createRouter());

// Demo page
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(demoHtml({ baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}` }));
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  logger.info(`Soulmate Sketch backend running on http://localhost:${port}`);
});
