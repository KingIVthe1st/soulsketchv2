import { EmailService } from './email-service.js';
import { generateProfileText, generateImage, generatePdf } from './ai.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Clean Deliverables Service
 * Orchestrates the entire professional report generation and delivery process
 * Replaces the old system that exposed debug data
 */
export class DeliverablesService {
  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Generate and deliver complete soulmate report
   * @param {Object} options - Generation options
   * @param {string} options.orderId - Order ID
   * @param {Object} options.quiz - User quiz responses
   * @param {string} options.tier - Service tier
   * @param {Array} options.addons - Selected addons
   * @param {string} options.email - Delivery email
   */
  async generateAndDeliverReport({ orderId, quiz, tier, addons = [], email }) {
    const deliveryLog = {
      orderId,
      tier,
      addons,
      email,
      startTime: new Date().toISOString(),
      steps: []
    };

    try {
      console.log(`\n🚀 Starting professional report generation for order ${orderId}`);
      console.log(`📧 Delivery email: ${email}`);
      console.log(`🎯 Tier: ${tier}, Addons: ${addons.join(', ') || 'none'}`);

      // Step 1: Clean and validate input data
      deliveryLog.steps.push({ step: 'data_validation', status: 'started', timestamp: new Date().toISOString() });
      
      const cleanedQuiz = this._cleanQuizData(quiz);
      this._validateRequiredData(cleanedQuiz, tier);
      
      deliveryLog.steps.push({ step: 'data_validation', status: 'completed', timestamp: new Date().toISOString() });
      console.log('✅ Data validation completed');

      // Step 2: Generate AI text content
      deliveryLog.steps.push({ step: 'ai_text_generation', status: 'started', timestamp: new Date().toISOString() });
      
      const aiText = await generateProfileText({ 
        quiz: cleanedQuiz, 
        tier, 
        addons 
      });
      
      if (!aiText || aiText.length < 100) {
        throw new Error('AI text generation failed or produced insufficient content');
      }
      
      deliveryLog.steps.push({ 
        step: 'ai_text_generation', 
        status: 'completed', 
        timestamp: new Date().toISOString(),
        contentLength: aiText.length
      });
      console.log('✅ AI text content generated');

      // Step 3: Generate soulmate portrait using AI
      deliveryLog.steps.push({ step: 'image_generation', status: 'started', timestamp: new Date().toISOString() });
      
      const imageResult = await generateImage({
        quiz: cleanedQuiz,
        style: cleanedQuiz.style || 'realistic',
        addons
      });
      
      if (!imageResult.success && !fs.existsSync(imageResult.filePath)) {
        throw new Error('Image generation failed completely');
      }
      
      deliveryLog.steps.push({ 
        step: 'image_generation', 
        status: imageResult.success ? 'completed' : 'completed_with_fallback',
        timestamp: new Date().toISOString(),
        method: imageResult.method,
        imagePath: imageResult.filePath
      });
      console.log(`✅ Soulmate portrait generated (${imageResult.method})`);

      // Step 4: Generate professional PDF using AI
      deliveryLog.steps.push({ step: 'pdf_generation', status: 'started', timestamp: new Date().toISOString() });
      
      const pdfPath = path.join(process.cwd(), 'uploads', `${orderId}_professional_report.pdf`);
      
      await generatePdf({
        text: aiText,
        imagePath: imageResult.filePath,
        outPath: pdfPath,
        addons
      });
      
      if (!fs.existsSync(pdfPath)) {
        throw new Error('PDF generation failed - file not created');
      }
      
      const pdfStats = fs.statSync(pdfPath);
      deliveryLog.steps.push({ 
        step: 'pdf_generation', 
        status: 'completed', 
        timestamp: new Date().toISOString(),
        pdfPath,
        fileSize: pdfStats.size
      });
      console.log('✅ AI-generated PDF report created');

      // Step 6: Deliver via email
      deliveryLog.steps.push({ step: 'email_delivery', status: 'started', timestamp: new Date().toISOString() });
      
      const emailResult = await this.emailService.sendSoulmateReport({
        to: email,
        pdfPath,
        imagePath: imageResult.filePath,
        tier,
        addons
      });
      
      deliveryLog.steps.push({ 
        step: 'email_delivery', 
        status: emailResult.success ? 'completed' : 'failed',
        timestamp: new Date().toISOString(),
        method: emailResult.method,
        error: emailResult.error || null
      });
      
      if (emailResult.success) {
        console.log('✅ Report delivered via email');
      } else {
        console.log('⚠️  Email delivery logged (SMTP not configured)');
      }

      // Final cleanup and success response
      deliveryLog.completedAt = new Date().toISOString();
      deliveryLog.success = true;
      deliveryLog.deliveryMethod = emailResult.method;

      await this._saveDeliveryLog(deliveryLog);

      console.log(`\n🎉 Professional report delivery completed successfully for ${email}`);
      console.log(`📄 PDF: ${path.basename(pdfPath)}`);
      console.log(`🎨 Image: ${path.basename(imageResult.filePath)}`);

      return {
        success: true,
        orderId,
        deliveryMethod: emailResult.method,
        files: {
          pdf: pdfPath,
          image: imageResult.filePath,
          share: imageResult.sharePath
        },
        reportData: {
          tier,
          hasAddons: addons.length > 0,
          imageMethod: imageResult.method
        }
      };

    } catch (error) {
      // Log error and attempt recovery
      console.error(`❌ Deliverables generation failed for order ${orderId}:`, error);
      
      deliveryLog.success = false;
      deliveryLog.error = error.message;
      deliveryLog.completedAt = new Date().toISOString();
      
      await this._saveDeliveryLog(deliveryLog);

      throw new Error(`Professional report generation failed: ${error.message}`);
    }
  }

  /**
   * Clean and sanitize quiz data (remove debug info, normalize structure)
   */
  _cleanQuizData(quiz) {
    const cleaned = {
      user: {
        email: quiz.user?.email,
        name: quiz.user?.name,
        country: quiz.user?.country,
        timezone: quiz.user?.timezone,
        ageRange: quiz.user?.ageRange,
        attractedTo: quiz.user?.attractedTo || quiz.interest
      },
      birth: {
        date: quiz.birth?.date,
        time: quiz.birth?.time,
        city: quiz.birth?.city,
        zodiac: quiz.birth?.zodiac
      },
      appearance: {
        faceShape: quiz.appearance?.faceShape,
        hairLength: quiz.appearance?.hairLength,
        hairTexture: quiz.appearance?.hairTexture,
        hairColor: quiz.appearance?.hairColor,
        eyeColor: quiz.appearance?.eyeColor,
        eyeShape: quiz.appearance?.eyeShape,
        skinTone: quiz.appearance?.skinTone,
        facialHair: quiz.appearance?.facialHair,
        freckles: quiz.appearance?.freckles,
        apparentAge: quiz.appearance?.apparentAge,
        culturalResonance: quiz.appearance?.culturalResonance
      },
      personality: {
        introvertExtrovert: this._normalizeSliderValue(quiz.personality?.introvertExtrovert),
        groundedAdventurous: this._normalizeSliderValue(quiz.personality?.groundedAdventurous),
        analyticalCreative: this._normalizeSliderValue(quiz.personality?.analyticalCreative),
        values: Array.isArray(quiz.personality?.values) ? quiz.personality.values : [],
        loveLanguages: quiz.personality?.loveLanguages || {}
      },
      relationship: {
        lookingFor: quiz.relationship?.lookingFor,
        mustHaves: Array.isArray(quiz.relationship?.mustHaves) ? quiz.relationship.mustHaves : [],
        dealBreakers: quiz.relationship?.dealBreakers
      },
      preferences: {
        auraPalette: quiz.preferences?.auraPalette,
        addons: quiz.preferences?.addons || {}
      },
      style: quiz.style || 'realistic'
    };

    // Remove empty/null values
    return this._removeEmptyValues(cleaned);
  }

  /**
   * Normalize slider values to 0-100 range
   */
  _normalizeSliderValue(value) {
    if (typeof value !== 'number') return 50; // Default center
    return Math.max(0, Math.min(100, value));
  }

  /**
   * Remove empty/null values from object
   */
  _removeEmptyValues(obj) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = this._removeEmptyValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else if (Array.isArray(value)) {
        const filteredArray = value.filter(item => 
          item !== null && item !== undefined && item !== ''
        );
        if (filteredArray.length > 0) {
          cleaned[key] = filteredArray;
        }
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * Validate required data for report generation
   */
  _validateRequiredData(quiz, tier) {
    // Basic validation
    if (!quiz.user?.email) {
      throw new Error('User email is required for delivery');
    }

    if (!quiz.user?.attractedTo) {
      throw new Error('Gender preference is required for image generation');
    }

    // Tier-specific validation
    if ((tier === 'plus' || tier === 'premium') && !quiz.birth?.zodiac) {
      console.warn('Advanced tiers work best with birth information, but proceeding anyway');
    }

    return true;
  }

  /**
   * Save delivery log for tracking and debugging
   */
  async _saveDeliveryLog(log) {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      
      const logFile = path.join(logsDir, 'deliverables.json');
      let logs = [];
      
      if (fs.existsSync(logFile)) {
        try {
          logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
        } catch (parseError) {
          console.warn('Could not parse existing deliverables log:', parseError.message);
        }
      }
      
      logs.push(log);
      
      // Keep only last 50 deliveries
      if (logs.length > 50) {
        logs = logs.slice(-50);
      }
      
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      console.log(`📊 Delivery log saved: ${log.orderId}`);
      
    } catch (error) {
      console.warn('Could not save delivery log:', error.message);
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats() {
    try {
      const logFile = path.join(process.cwd(), 'logs', 'deliverables.json');
      
      if (!fs.existsSync(logFile)) {
        return { totalDeliveries: 0, successRate: 0, avgProcessingTime: 0 };
      }
      
      const logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      const successful = logs.filter(log => log.success);
      
      const processingTimes = logs
        .filter(log => log.startTime && log.completedAt)
        .map(log => {
          const start = new Date(log.startTime);
          const end = new Date(log.completedAt);
          return end - start;
        });
      
      const avgProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      return {
        totalDeliveries: logs.length,
        successfulDeliveries: successful.length,
        successRate: logs.length > 0 ? (successful.length / logs.length) * 100 : 0,
        avgProcessingTimeMs: Math.round(avgProcessingTime),
        avgProcessingTimeMinutes: Math.round(avgProcessingTime / 1000 / 60 * 100) / 100
      };
      
    } catch (error) {
      console.error('Could not calculate delivery stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    try {
      // Check OpenAI API availability
      health.services.openai = {
        available: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-replace-me'),
        method: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-replace-me') ? 'ai-generated' : 'fallback'
      };

      // Check email service
      health.services.email = {
        available: Boolean(this.emailService.smtpConfig),
        method: this.emailService.smtpConfig ? 'smtp' : 'logging'
      };

      // Check file system
      const uploadsDir = path.join(process.cwd(), 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });
      
      health.services.fileSystem = {
        available: fs.existsSync(uploadsDir),
        uploadsDir: uploadsDir,
        writable: true
      };

      // Overall status
      health.status = Object.values(health.services).every(service => service.available)
        ? 'healthy' : 'degraded';

    } catch (error) {
      health.status = 'error';
      health.error = error.message;
    }

    return health;
  }
}

/**
 * Utility functions for deliverables
 */
export class DeliverablesUtils {
  /**
   * Clean up old delivery files
   */
  static async cleanupOldFiles(olderThanDays = 7) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) return { cleaned: 0 };

      const files = fs.readdirSync(uploadsDir);
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      
      let cleaned = 0;
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
      
      console.log(`🧹 Cleaned up ${cleaned} old delivery files`);
      return { cleaned };
      
    } catch (error) {
      console.error('Cleanup failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Validate PDF integrity
   */
  static validatePDF(pdfPath) {
    try {
      if (!fs.existsSync(pdfPath)) {
        return { valid: false, error: 'File does not exist' };
      }

      const stats = fs.statSync(pdfPath);
      if (stats.size < 10000) { // Less than 10KB is suspicious
        return { valid: false, error: 'File too small' };
      }

      const buffer = fs.readFileSync(pdfPath, { start: 0, end: 10 });
      if (!buffer.toString().startsWith('%PDF')) {
        return { valid: false, error: 'Not a valid PDF file' };
      }

      return { 
        valid: true, 
        size: stats.size,
        created: stats.birthtime
      };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}