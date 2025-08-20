import express from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import Stripe from 'stripe';
import { getDb } from './db.js';
import { getPriceCentsForTier } from './payments.js';
import { generateProfileText, generateImage, generatePdf } from './ai.js';

// Initialize Stripe only if API key is available
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('⚠️  Stripe not initialized - STRIPE_SECRET_KEY not set');
}

const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

export function createRouter() {
  const router = express.Router();
  const db = getDb();

  // Create payment intent endpoint
  router.post('/create-payment-intent', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment system not available - Stripe not configured' });
    }
    
    try {
      const { amount, currency = 'usd', email } = req.body;
      
      if (!amount || amount < 50) { // Minimum 50 cents
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Ensure it's an integer
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          email: email || 'anonymous',
          product: 'soulmate_sketch'
        }
      });

      res.json({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Webhook endpoint for Stripe events (optional but recommended)
  router.post('/stripe-webhook', express.raw({type: 'application/json'}), (req, res) => {
    if (!stripe) {
      console.warn('Stripe webhook endpoint called but Stripe not configured');
      return res.status(503).send('Payment system not available');
    }
    
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.warn('Stripe webhook secret not configured');
      return res.status(200).send('OK');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Update order status in database if needed
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send('OK');
  });

  router.post('/orders', (req, res) => {
    const { email, tier = 'premium', addons = [], paymentIntentId, amount } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const id = randomUUID();
    const now = new Date().toISOString();
    const price = amount || getPriceCentsForTier(tier);
    const status = paymentIntentId ? 'paid' : 'created';
    
    // Insert order with payment information
    db.prepare(`INSERT INTO orders (id, email, tier, addons, status, created_at, updated_at, price_cents, currency, stripe_payment_intent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'usd', ?)`)
      .run(id, email, tier, JSON.stringify(addons), status, now, now, price, paymentIntentId || null);
    res.json({ id, price_cents: price, currency: 'usd', status });
  });

  router.post('/orders/:id/intake', upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'not found' });

    let photoPath = order.photo_path;
    if (req.file) {
      photoPath = path.join('uploads', `${id}_photo${path.extname(req.file.originalname) || ''}`);
      fs.renameSync(req.file.path, path.join(process.cwd(), photoPath));
    }

    const quiz = JSON.parse(req.body.quiz || '{}');
    db.prepare('UPDATE orders SET photo_path = ?, quiz_answers = ?, updated_at = ? WHERE id = ?')
      .run(photoPath, JSON.stringify(quiz), new Date().toISOString(), id);

    res.json({ ok: true });
  });

  router.post('/orders/:id/generate', async (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'not found' });

    try {
      const quiz = JSON.parse(order.quiz_answers || '{}');
      const addons = JSON.parse(order.addons || '[]');

      const [text] = await Promise.all([
        generateProfileText({ quiz, tier: order.tier, addons })
      ]);

      const { filePath, sharePath } = await generateImage({ style: quiz.style || 'ethereal', quiz, addons });

      const pdfPath = path.join(process.cwd(), 'uploads', `${id}_report.pdf`);
      await generatePdf({ text, imagePath: filePath, outPath: pdfPath, addons });

      db.prepare('UPDATE orders SET result_image_path = ?, result_pdf_path = ?, status = ?, updated_at = ? WHERE id = ?')
        .run(filePath, pdfPath, 'delivered', new Date().toISOString(), id);

      res.json({ 
        imagePath: `uploads/${path.basename(filePath)}`, 
        sharePath: sharePath ? `uploads/${path.basename(sharePath)}` : null, 
        pdfPath: `uploads/${path.basename(pdfPath)}`,
        profileText: text
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'generation_failed' });
    }
  });

  router.get('/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'not found' });
    res.json(order);
  });

  return router;
}
