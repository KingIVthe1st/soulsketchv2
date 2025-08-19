import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import pino from 'pino';
import { createRouter } from './routes.js';

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

// Serve static files from public directory (landing page design)
app.use(express.static(path.join(process.cwd(), 'public')));

// API routes
app.use('/api', createRouter());

// Landing page - serve index.html from public folder
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Fallback for SPA routing - also serve index.html for any non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).send('Not found');
  }
  // For any other route, try to serve the specific file or fall back to index.html
  const filePath = path.join(process.cwd(), 'public', req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  logger.info(`Soulmate Sketch backend running on http://localhost:${port}`);
});
