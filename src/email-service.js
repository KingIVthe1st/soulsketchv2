import fs from 'node:fs';
import path from 'node:path';

/**
 * Professional Email Service for SoulmateSketch
 * Handles delivery of PDF reports via email
 */
export class EmailService {
  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@soulmatesketch.com';
    this.smtpConfig = this._getSmtpConfig();
  }

  /**
   * Send the complete soulmate report via email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.pdfPath - Path to PDF report
   * @param {string} options.imagePath - Path to soulmate image (optional)
   * @param {Object} options.reportData - Report metadata for personalization
   */
  async sendSoulmateReport({ to, pdfPath, imagePath, reportData }) {
    try {
      console.log(`Preparing to send soulmate report to ${to}`);
      
      // Validate files exist
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF report not found: ${pdfPath}`);
      }

      // Create email content
      const emailContent = this._createEmailContent(reportData);
      
      // Prepare attachments
      const attachments = [
        {
          filename: 'Your_Soulmate_Sketch_Report.pdf',
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ];

      // Add image attachment if available
      if (imagePath && fs.existsSync(imagePath)) {
        attachments.push({
          filename: 'Your_Soulmate_Portrait.png',
          path: imagePath,
          contentType: 'image/png'
        });
      }

      // Send email based on available service
      if (this.smtpConfig) {
        await this._sendViaSmtp({
          to,
          subject: emailContent.subject,
          html: emailContent.html,
          attachments
        });
      } else {
        // Log delivery for development/testing
        await this._logEmailDelivery({
          to,
          subject: emailContent.subject,
          attachments,
          reportData
        });
      }

      console.log(`Soulmate report successfully sent to ${to}`);
      return { success: true, method: this.smtpConfig ? 'smtp' : 'logged' };

    } catch (error) {
      console.error('Email delivery failed:', error);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Create personalized email content
   */
  _createEmailContent(reportData) {
    const userName = reportData.userInfo?.name || 'Beautiful Soul';
    const tier = reportData.tier || 'basic';
    const tierName = this._getTierDisplayName(tier);
    
    const subject = `✨ Your ${tierName} Soulmate Sketch Report is Ready!`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Soulmate Sketch Report</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      line-height: 1.6;
      color: #2D2240;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fafafa;
    }
    .header {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%);
      border-radius: 15px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #E91E63;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      color: #666;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 18px;
      color: #E91E63;
      margin-bottom: 20px;
    }
    .main-text {
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 25px;
    }
    .highlight-box {
      background: #FCE4EC;
      border-left: 4px solid #E91E63;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .attachment-info {
      background: #F5F5F5;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
    }
    .attachment-icon {
      font-size: 24px;
      margin-bottom: 10px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #E91E63, #AD1457);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 25px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #eee;
      margin-top: 30px;
    }
    .disclaimer {
      font-size: 12px;
      color: #888;
      font-style: italic;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">✨ SoulmateSketch</div>
    <div class="subtitle">Your Personalized Soulmate Report Has Arrived</div>
  </div>

  <div class="content">
    <div class="greeting">Hello ${userName},</div>
    
    <div class="main-text">
      Your personalized ${tierName} Soulmate Sketch report is ready! We've created something truly special for you - a complete analysis of your ideal soulmate based on your unique preferences, personality, and cosmic influences.
    </div>

    <div class="highlight-box">
      <strong>What's Inside Your Report:</strong>
      <ul style="margin: 15px 0; padding-left: 25px;">
        <li>🎨 Your personalized AI-generated soulmate portrait</li>
        <li>💫 Comprehensive personality and energy analysis</li>
        <li>💕 Connection style and love language insights</li>
        <li>🌟 How and where you're most likely to meet</li>
        <li>🔮 Astrological and numerological compatibility notes</li>
        ${tier === 'plus' || tier === 'premium' ? '<li>📍 Enhanced location and timing insights</li>' : ''}
        ${tier === 'premium' ? '<li>🌙 Complete spiritual and relationship strategy guide</li>' : ''}
        ${reportData.addons && reportData.addons.length > 0 ? '<li>✨ Special spiritual insights (aura, twin flame, past life)</li>' : ''}
      </ul>
    </div>

    <div class="attachment-info">
      <div class="attachment-icon">📎</div>
      <strong>Your Complete Report Package:</strong><br>
      • Professional PDF Report (attached)<br>
      • High-Quality Soulmate Portrait (attached)<br>
      <br>
      <em>Everything you need is right here in this email!</em>
    </div>

    <div class="main-text">
      This isn't just another generic reading - it's a deeply personalized guide created specifically for you, incorporating your unique preferences, personality traits, and cosmic blueprint.
    </div>

    <div class="main-text">
      Take your time with this report. Read it somewhere quiet where you can truly absorb the insights. Many of our clients find it helpful to revisit their report as they navigate their romantic journey.
    </div>

    <div class="main-text">
      Remember, this report is meant to inspire and guide you toward recognizing the deep connection you deserve. Trust your intuition as you move forward in your romantic journey.
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <p style="font-style: italic; color: #E91E63;">
        "The best love stories begin with recognizing what we truly seek in another soul."
      </p>
    </div>
  </div>

  <div class="footer">
    <p>With warm wishes for your romantic journey,<br>
    <strong>The SoulmateSketch Team</strong></p>
    
    <p>Questions? Reply to this email - we're here to help!</p>
    
    <div class="disclaimer">
      This SoulmateSketch report is created for entertainment and inspiration purposes. 
      It is not intended to predict specific outcomes or provide professional relationship advice.
      Trust your own judgment and intuition in all romantic matters.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  /**
   * Get SMTP configuration if available
   */
  _getSmtpConfig() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };
    }
    return null;
  }

  /**
   * Send email via SMTP (placeholder for actual implementation)
   */
  async _sendViaSmtp({ to, subject, html, attachments }) {
    // This would use nodemailer or similar SMTP library
    // For now, we'll log the email for development
    console.log('📧 SMTP Email (would send):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Attachments: ${attachments.length}`);
    
    // In production, implement actual SMTP sending:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter(this.smtpConfig);
    
    await transporter.sendMail({
      from: this.fromEmail,
      to,
      subject,
      html,
      attachments
    });
    */
  }

  /**
   * Log email delivery for development/testing
   */
  async _logEmailDelivery({ to, subject, attachments, reportData }) {
    const logDir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      to,
      subject,
      attachments: attachments.map(att => ({
        filename: att.filename,
        exists: fs.existsSync(att.path),
        size: fs.existsSync(att.path) ? fs.statSync(att.path).size : 0
      })),
      reportData: {
        tier: reportData.tier,
        addons: reportData.addons,
        userInfo: reportData.userInfo
      }
    };

    const logPath = path.join(logDir, 'email-deliveries.json');
    let logs = [];
    
    if (fs.existsSync(logPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      } catch (error) {
        console.warn('Could not parse existing email log:', error.message);
      }
    }
    
    logs.push(logEntry);
    
    // Keep only last 100 entries
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    
    console.log(`📧 Email delivery logged for ${to}`);
    console.log(`📎 Attachments: ${attachments.length}`);
    console.log(`💾 Log saved to: ${logPath}`);
  }

  /**
   * Get display name for service tier
   */
  _getTierDisplayName(tier) {
    const tierNames = {
      'basic': 'Essential',
      'plus': 'Plus',
      'premium': 'Premium',
      'demo': 'Preview'
    };
    return tierNames[tier] || 'Custom';
  }

  /**
   * Send confirmation email when order is created
   */
  async sendOrderConfirmation({ to, orderId, tier, estimatedDelivery = '5-10 minutes' }) {
    try {
      const tierName = this._getTierDisplayName(tier);
      const subject = `✨ Your ${tierName} Soulmate Sketch Order Confirmed`;
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #2D2240; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%); border-radius: 15px; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #E91E63; margin-bottom: 10px; }
    .content { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .highlight { background: #FCE4EC; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">✨ SoulmateSketch</div>
    <div>Order Confirmed!</div>
  </div>
  
  <div class="content">
    <h3>Thank you for your order!</h3>
    
    <div class="highlight">
      <strong>Order Details:</strong><br>
      Order ID: ${orderId}<br>
      Service: ${tierName} Soulmate Sketch<br>
      Estimated Delivery: ${estimatedDelivery}
    </div>
    
    <p>We're now creating your personalized soulmate sketch and report. You'll receive your complete package via email once it's ready.</p>
    
    <p>What happens next:</p>
    <ul>
      <li>🎨 Our AI creates your personalized soulmate portrait</li>
      <li>📖 We generate your comprehensive personality analysis</li>
      <li>💌 Everything is delivered to your inbox as a beautiful PDF report</li>
    </ul>
    
    <p><em>Questions? Just reply to this email - we're here to help!</em></p>
    
    <p style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
      The SoulmateSketch Team
    </p>
  </div>
</body>
</html>`;

      if (this.smtpConfig) {
        await this._sendViaSmtp({ to, subject, html, attachments: [] });
      } else {
        await this._logEmailDelivery({ 
          to, 
          subject, 
          attachments: [], 
          reportData: { tier, orderId } 
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Order confirmation email failed:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Email template utilities
 */
export class EmailTemplates {
  /**
   * Create a simple text email for fallback
   */
  static createTextEmail({ userName, tier, reportData }) {
    const tierName = tier === 'basic' ? 'Essential' : tier === 'plus' ? 'Plus' : tier === 'premium' ? 'Premium' : 'Custom';
    
    return `Hello ${userName || 'Beautiful Soul'},

Your personalized ${tierName} Soulmate Sketch report is ready!

We've created something truly special for you - a complete analysis of your ideal soulmate based on your unique preferences, personality, and cosmic influences.

WHAT'S INCLUDED:
• Your personalized AI-generated soulmate portrait
• Comprehensive personality and energy analysis  
• Connection style and love language insights
• How and where you're most likely to meet
• Astrological and numerological compatibility notes
${tier === 'plus' || tier === 'premium' ? '• Enhanced location and timing insights' : ''}
${tier === 'premium' ? '• Complete spiritual and relationship strategy guide' : ''}

Your complete report package is attached to this email as PDF files.

This isn't just another generic reading - it's a deeply personalized guide created specifically for you.

Take your time with this report. Read it somewhere quiet where you can truly absorb the insights. Many clients find it helpful to revisit their report as they navigate their romantic journey.

Remember, this report is meant to inspire and guide you toward recognizing the deep connection you deserve.

With warm wishes for your romantic journey,
The SoulmateSketch Team

---
This report is created for entertainment and inspiration purposes. Trust your own judgment in all romantic matters.`;
  }
}