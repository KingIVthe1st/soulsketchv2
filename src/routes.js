import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import Stripe from 'stripe';
import { z } from 'zod';
import { getDb } from './db.js';
import { getPriceCentsForTier } from './payments.js';
import { DeliverablesService, DeliverablesUtils } from './deliverables-service.js';
import { EmailService } from './email-service.js';

// Initialize Stripe only if API key is available
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('⚠️  Stripe not initialized - STRIPE_SECRET_KEY not set');
}

// Validation schemas
const OrderCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  tier: z.enum(['premium', 'standard']).default('premium'),
  addons: z.array(z.string()).default([]),
  paymentIntentId: z.string().optional(),
  amount: z.number().min(50, 'Amount must be at least 50 cents').optional()
});

const PaymentIntentSchema = z.object({
  amount: z.number().min(50, 'Amount must be at least 50 cents'),
  currency: z.string().default('usd'),
  email: z.string().email('Invalid email format').optional()
});

const CleanupSchema = z.object({
  olderThanDays: z.number().min(1).max(365).default(7)
});

// Secure file upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const orderId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${orderId}_photo${ext}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Only allow image files
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per upload
  },
  fileFilter: fileFilter
});

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs for sensitive endpoints
  message: {
    error: 'Too many requests to sensitive endpoint',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 payment attempts per windowMs
  message: {
    error: 'Too many payment attempts',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin authentication middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (!adminKey) {
    return res.status(503).json({ 
      error: 'Admin endpoints not configured',
      code: 'ADMIN_NOT_CONFIGURED'
    });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== adminKey) {
    return res.status(403).json({ 
      error: 'Invalid authentication',
      code: 'AUTH_INVALID'
    });
  }
  
  next();
};

// Error sanitization helper
const sanitizeError = (error, includeDetails = false) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !includeDetails) {
    return {
      error: 'An error occurred',
      code: 'INTERNAL_ERROR',
      message: 'Please try again later or contact support if the issue persists.'
    };
  }
  
  return {
    error: error.message || 'An error occurred',
    code: error.code || 'INTERNAL_ERROR',
    ...(includeDetails && { details: error.stack })
  };
};

export function createRouter() {
  const router = express.Router();
  const db = getDb();
  
  // Initialize services
  const deliverables = new DeliverablesService();
  const emailService = new EmailService();

  // Apply general rate limiting to all routes
  router.use(generalLimiter);

  // Create payment intent endpoint
  router.post('/create-payment-intent', paymentLimiter, async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payment system not available',
        code: 'STRIPE_NOT_CONFIGURED'
      });
    }
    
    try {
      // Validate input with Zod
      const validatedData = PaymentIntentSchema.parse(req.body);
      const { amount, currency, email } = validatedData;

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
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      
      res.status(500).json(sanitizeError(error));
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

  router.post('/orders', strictLimiter, async (req, res) => {
    try {
      // Validate input with Zod
      const validatedData = OrderCreateSchema.parse(req.body || {});
      const { email, tier, addons, paymentIntentId, amount } = validatedData;

      const id = randomUUID();
      const now = new Date().toISOString();
      const price = amount || getPriceCentsForTier(tier);
      const status = paymentIntentId ? 'paid' : 'created';
      
      console.log(`🎯 Creating order with ID: ${id}, email: ${email}, tier: ${tier}`);
      
      try {
        // Insert order with payment information
        db.prepare(`INSERT INTO orders (id, email, tier, addons, status, created_at, updated_at, price_cents, currency, stripe_payment_intent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'usd', ?)`)
          .run(id, email, tier, JSON.stringify(addons), status, now, now, price, paymentIntentId || null);

        // Verify insertion
        const verifyOrder = db.prepare('SELECT id FROM orders WHERE id = ?').get(id);
        if (!verifyOrder) {
          console.error(`❌ Order ${id} failed to insert into database`);
          throw new Error('Database insertion failed');
        }
        
        console.log(`✅ Order created and verified: ${id} (${tier}) for ${email}`);
      } catch (dbError) {
        console.error(`❌ Database error creating order ${id}:`, dbError);
        throw dbError;
      }

      // Send order confirmation email if paid
      if (status === 'paid') {
        try {
          await emailService.sendOrderConfirmation({
            to: email,
            orderId: id,
            tier: tier,
            estimatedDelivery: tier === 'premium' ? '5-10 minutes' : '3-7 minutes'
          });
          console.log(`📧 Order confirmation sent to ${email}`);
        } catch (emailError) {
          console.warn('Order confirmation email failed:', emailError.message);
          // Don't fail the order creation if email fails
        }
      }

      res.json({ 
        id, 
        price_cents: price, 
        currency: 'usd', 
        status,
        tier,
        email,
        created_at: now,
        estimated_delivery: tier === 'premium' ? '5-10 minutes' : '3-7 minutes'
      });

    } catch (error) {
      console.error('Order creation failed:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      res.status(500).json(sanitizeError(error));
    }
  });

  router.post('/orders/:id/intake', strictLimiter, (req, res) => {
    // Handle file upload with proper error handling
    upload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err.message);
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large',
              code: 'FILE_SIZE_EXCEEDED',
              message: 'File size must be under 5MB'
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              error: 'Unexpected file',
              code: 'UNEXPECTED_FILE',
              message: 'Only one file allowed per upload'
            });
          }
        }
        
        return res.status(400).json({
          error: 'File upload failed',
          code: 'UPLOAD_ERROR',
          message: err.message
        });
      }

      try {
        const { id } = req.params;
        
        // Validate UUID format
        if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          return res.status(400).json({
            error: 'Invalid order ID format',
            code: 'INVALID_ORDER_ID'
          });
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!order) {
          return res.status(404).json({ 
            error: 'Order not found',
            code: 'ORDER_NOT_FOUND'
          });
        }

        let photoPath = order.photo_path;
        if (req.file) {
          // File has already been processed by multer with security checks
          photoPath = req.file.path;
        }

        // Parse and validate quiz data
        let quiz = {};
        try {
          quiz = JSON.parse(req.body.quiz || '{}');
        } catch (parseError) {
          return res.status(400).json({
            error: 'Invalid quiz data format',
            code: 'INVALID_QUIZ_DATA'
          });
        }

        db.prepare('UPDATE orders SET photo_path = ?, quiz_answers = ?, updated_at = ? WHERE id = ?')
          .run(photoPath, JSON.stringify(quiz), new Date().toISOString(), id);

        res.json({ 
          success: true,
          message: 'Intake data saved successfully',
          hasPhoto: Boolean(req.file)
        });

      } catch (error) {
        console.error('Intake processing error:', error);
        res.status(500).json(sanitizeError(error));
      }
    });
  });

  router.post('/orders/:id/generate', strictLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Enhanced logging for debugging
      console.log(`📋 Generate request received for order ID: ${id}`);
      
      // Validate UUID format
      if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error(`❌ Invalid order ID format: ${id}`);
        return res.status(400).json({
          error: 'Invalid order ID format',
          code: 'INVALID_ORDER_ID',
          receivedId: id
        });
      }

      // Log database query attempt
      console.log(`🔍 Searching for order ${id} in database...`);
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      
      if (!order) {
        // Log all orders for debugging (be careful in production)
        const recentOrders = db.prepare('SELECT id, email, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5').all();
        console.error(`❌ Order ${id} not found in database`);
        console.log('📝 Recent orders:', recentOrders.map(o => ({ id: o.id, email: o.email, status: o.status })));
        
        return res.status(404).json({ 
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
          requestedId: id
        });
      }
      
      console.log(`✅ Order found: ${order.id}, email: ${order.email}, status: ${order.status}`)

      // Enhanced test order detection for bypassing payment verification
      const isTestOrder = order.email && (
        order.email.includes('test@') || 
        order.email.includes('@test.') ||
        order.email.includes('demo@') ||
        order.email === 'test@example.com' ||
        order.email.toLowerCase().includes('test')
      );
      
      console.log(`🔍 Payment check - Order ID: ${id}, Email: ${order.email}, Status: ${order.status}, IsTest: ${isTestOrder}, NODE_ENV: ${process.env.NODE_ENV}`);
      
      // Allow test orders to bypass payment verification entirely
      if (order.status !== 'paid' && !isTestOrder) {
        console.log(`❌ Payment verification failed - Order ${id} with email ${order.email} is not paid and not a test order`);
        return res.status(403).json({ 
          error: 'Payment required',
          code: 'PAYMENT_REQUIRED',
          message: 'Order must be paid before generation'
        });
      }
      
      // Log test order bypass for debugging
      if (isTestOrder) {
        console.log(`🧪 TEST ORDER DETECTED - Bypassing payment verification for order ${id} with email ${order.email}`);
      }

      console.log(`🎯 Starting professional report generation for order ${id}`);
      
      // Parse order data with error handling
      let quiz, addons;
      try {
        quiz = JSON.parse(order.quiz_answers || '{}');
        addons = JSON.parse(order.addons || '[]');
      } catch (parseError) {
        return res.status(400).json({
          error: 'Invalid order data format',
          code: 'INVALID_ORDER_DATA'
        });
      }
      
      // Validate email for delivery
      if (!order.email) {
        return res.status(400).json({
          error: 'Order email required for delivery',
          code: 'EMAIL_REQUIRED'
        });
      }

      // Update order status to processing
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
        .run('processing', new Date().toISOString(), id);

      // Generate and deliver complete professional report
      const result = await deliverables.generateAndDeliverReport({
        orderId: id,
        quiz,
        tier: order.tier,
        addons,
        email: order.email
      });

      // Update order with results
      const updateQuery = `
        UPDATE orders SET 
          result_image_path = ?, 
          result_pdf_path = ?, 
          status = ?, 
          updated_at = ?
        WHERE id = ?
      `;
      
      db.prepare(updateQuery).run(
        result.files.image,
        result.files.pdf,
        'delivered',
        new Date().toISOString(),
        id
      );

      console.log(`✅ Professional report delivered successfully for order ${id}`);

      // Return clean response (no debug data)
      res.json({ 
        success: true,
        orderId: id,
        status: 'delivered',
        deliveryMethod: result.deliveryMethod,
        message: `Your personalized ${result.reportData.tier} Soulmate Sketch report has been delivered to ${order.email}`,
        report: {
          tier: result.reportData.tier,
          sections: result.reportData.sections,
          hasAddons: result.reportData.hasAddons,
          imageQuality: result.reportData.imageMethod === 'dall-e' ? 'AI Generated' : 'Professional Placeholder'
        },
        // Provide file access paths for download links
        files: {
          pdf: path.basename(result.files.pdf),
          image: path.basename(result.files.image),
          share: result.files.share ? path.basename(result.files.share) : null
        }
      });

    } catch (error) {
      console.error(`❌ Professional report generation failed for order ${req.params.id}:`, error);
      console.error(`❌ Error stack:`, error.stack);
      console.error(`❌ Error message:`, error.message);
      console.error(`❌ Error name:`, error.name);
      
      // Log environment status for debugging
      const hasValidApiKey = Boolean(
        process.env.OPENAI_API_KEY && 
        process.env.OPENAI_API_KEY !== 'sk-replace-me' && 
        process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here' &&
        process.env.OPENAI_API_KEY.startsWith('sk-')
      );
      console.log(`🔧 Environment check:`);
      console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`  - OpenAI API Key configured: ${hasValidApiKey}`);
      console.log(`  - API Key prefix: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'not set'}`);

      // Update order status to failed if we have a valid order ID
      if (req.params.id && req.params.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
            .run('failed', new Date().toISOString(), req.params.id);
        } catch (updateError) {
          console.error('Failed to update order status:', updateError);
        }
      }

      // Return sanitized error response
      // Show debug info for test orders or when debug parameter is present
      const isTestOrder = req.params.id && (
        order?.email?.includes('test') || 
        order?.email?.includes('debug') ||
        error.message?.includes('test')
      );
      const showDebug = req.query.debug === 'true' || isTestOrder || process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        error: 'Report generation failed',
        message: 'We apologize for the inconvenience. Please try again in a few moments, or contact support if the issue persists.',
        code: 'GENERATION_FAILED',
        orderId: req.params.id,
        ...sanitizeError(error, showDebug),
        // Add comprehensive debug info when needed
        ...(showDebug && {
          debugInfo: {
            errorMessage: error.message,
            errorStack: error.stack?.split('\n').slice(0, 8).join('\n'),
            nodeEnv: process.env.NODE_ENV,
            hasApiKey: Boolean(process.env.OPENAI_API_KEY?.startsWith('sk-')),
            apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
            apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set'
          }
        })
      });
    }
  });

  router.get('/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Clean response - remove sensitive/debug data
    const cleanOrder = {
      id: order.id,
      tier: order.tier,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      currency: order.currency,
      // Only include email for the order owner (in production, you'd verify ownership)
      email: order.email,
      // Only show if files exist and order is completed
      hasResults: Boolean(order.result_pdf_path && order.result_image_path),
      estimatedDelivery: order.status === 'paid' ? 
        (order.tier === 'premium' ? '5-10 minutes' : '3-7 minutes') : null
    };

    res.json(cleanOrder);
  });

  // Professional monitoring endpoints (secured)
  
  // Health check for deliverables system (secured)
  router.get('/health/deliverables', requireAuth, async (req, res) => {
    try {
      const health = await deliverables.healthCheck();
      res.json(health);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json(sanitizeError(error));
    }
  });

  // Delivery statistics (for internal monitoring - secured)
  router.get('/stats/deliveries', requireAuth, async (req, res) => {
    try {
      const stats = await deliverables.getDeliveryStats();
      res.json({
        ...stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Stats retrieval failed:', error);
      res.status(500).json(sanitizeError(error));
    }
  });

  // Cleanup old files (maintenance endpoint - secured)
  router.post('/maintenance/cleanup', requireAuth, async (req, res) => {
    try {
      // Validate input with Zod
      const validatedData = CleanupSchema.parse(req.body || {});
      const { olderThanDays } = validatedData;
      
      const result = await DeliverablesUtils.cleanupOldFiles(olderThanDays);
      res.json({
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid cleanup parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      res.status(500).json(sanitizeError(error));
    }
  });

  // Test AI function call (for debugging)
  router.post('/test-ai', async (req, res) => {
    try {
      const { generateProfileText } = await import('./ai.js');
      
      const testQuiz = {
        user: { email: 'test@test.com', attractedTo: 'women' },
        appearance: { faceShape: 'oval', hairColor: 'brown' }
      };
      
      const result = await generateProfileText({
        quiz: testQuiz,
        tier: 'premium',
        addons: []
      });
      
      res.json({
        success: true,
        result: result?.substring(0, 200) + '...',
        length: result?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 8).join('\n')
      });
    }
  });

  // Test deliverables service directly (for debugging)
  router.post('/test-deliverables', async (req, res) => {
    try {
      console.log('🧪 Testing deliverables service directly...');
      
      const testQuiz = {
        user: { 
          email: 'testuser@test.com', 
          attractedTo: 'women',
          name: 'Test User'
        },
        appearance: { 
          faceShape: 'oval', 
          hairColor: 'brown',
          eyeColor: 'blue',
          skinTone: 'medium'
        },
        personality: {
          introvertExtrovert: 60,
          groundedAdventurous: 40,
          analyticalCreative: 70
        },
        birth: {
          date: '1990-06-15',
          zodiac: 'gemini'
        }
      };
      
      const deliverables = new DeliverablesService();
      
      const result = await deliverables.generateAndDeliverReport({
        orderId: 'test-' + Date.now(),
        quiz: testQuiz,
        tier: 'premium',
        addons: [],
        email: 'testuser@test.com'
      });
      
      res.json({
        success: true,
        result: 'Deliverables generation completed',
        deliveryMethod: result.deliveryMethod,
        files: {
          pdf: result.files?.pdf ? 'generated' : 'none',
          image: result.files?.image ? 'generated' : 'none'
        }
      });
    } catch (error) {
      console.error('❌ Deliverables test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 10).join('\n')
      });
    }
  });

  // Debug API health check (public for testing)
  router.get('/api-debug', async (req, res) => {
    try {
      const hasValidApiKey = Boolean(
        process.env.OPENAI_API_KEY && 
        process.env.OPENAI_API_KEY !== 'sk-replace-me' && 
        process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here' &&
        process.env.OPENAI_API_KEY.startsWith('sk-')
      );
      
      let openaiTest = 'not_tested';
      if (hasValidApiKey) {
        try {
          // Try to import and test OpenAI
          const { generateProfileText } = await import('./ai.js');
          openaiTest = 'import_success';
        } catch (importError) {
          openaiTest = `import_error: ${importError.message}`;
        }
      } else {
        openaiTest = 'no_valid_key';
      }
      
      res.json({
        status: 'debug',
        environment: process.env.NODE_ENV,
        openai: {
          hasValidKey: hasValidApiKey,
          keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set',
          keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
          testResult: openaiTest
        },
        stripe: {
          configured: Boolean(process.env.STRIPE_SECRET_KEY)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Database health check endpoint (public for testing)
  router.get('/db-health', (req, res) => {
    try {
      // Test database connection
      const testQuery = db.prepare('SELECT COUNT(*) as count FROM orders').get();
      const recentOrders = db.prepare('SELECT id, email, status, created_at FROM orders ORDER BY created_at DESC LIMIT 3').all();
      
      res.json({
        status: 'healthy',
        orderCount: testQuery.count,
        recentOrders: recentOrders.map(o => ({
          id: o.id.substring(0, 8) + '...',
          email: o.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
          status: o.status,
          created: o.created_at
        })),
        dbPath: process.env.NODE_ENV === 'production' ? 'production' : 'local',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Validate specific PDF (for debugging - secured)
  router.get('/validate/pdf/:orderId', requireAuth, (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Validate UUID format
      if (!orderId || !orderId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({
          error: 'Invalid order ID format',
          code: 'INVALID_ORDER_ID'
        });
      }
      
      const order = db.prepare('SELECT result_pdf_path FROM orders WHERE id = ?').get(orderId);
      
      if (!order || !order.result_pdf_path) {
        return res.status(404).json({ 
          error: 'PDF not found for this order',
          code: 'PDF_NOT_FOUND',
          orderId 
        });
      }

      const validation = DeliverablesUtils.validatePDF(order.result_pdf_path);
      res.json({
        orderId,
        pdfPath: path.basename(order.result_pdf_path),
        ...validation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('PDF validation failed:', error);
      res.status(500).json(sanitizeError(error));
    }
  });

  // Temporary test endpoint for production debugging
  router.post('/test-db-write', (req, res) => {
    try {
      const testId = randomUUID();
      const now = new Date().toISOString();
      
      // Try to insert a test record
      db.prepare(`INSERT INTO orders (id, email, tier, addons, status, created_at, updated_at, price_cents, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        testId,
        'db-test@example.com',
        'premium',
        '[]',
        'test',
        now,
        now,
        100,
        'usd'
      );
      
      // Try to read it back
      const testOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(testId);
      
      // Clean up
      db.prepare('DELETE FROM orders WHERE id = ?').run(testId);
      
      res.json({
        success: true,
        message: 'Database write/read test successful',
        testId: testId,
        foundOrder: !!testOrder,
        timestamp: now
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

  return router;
}
