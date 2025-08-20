import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Professional PDF Report Generator for SoulmateSketch
 * Creates clean, branded PDF reports without exposing debug data
 */
export class ProfessionalPDFGenerator {
  constructor() {
    this.brandColor = '#E91E63';
    this.accentColor = '#2D2240';
    this.textColor = '#111';
    this.lightTextColor = '#666';
  }

  /**
   * Generate a complete professional PDF report
   * @param {Object} reportData - Clean, processed report data
   * @param {string} imagePath - Path to generated soulmate image
   * @param {string} outputPath - Where to save the PDF
   */
  async generateReport(reportData, imagePath, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'LETTER', 
          margins: { top: 60, left: 60, right: 60, bottom: 60 },
          info: {
            Title: 'Your Soulmate Sketch Report',
            Author: 'SoulmateSketch',
            Subject: 'Personalized Soulmate Analysis',
            Creator: 'SoulmateSketch AI System'
          }
        });
        
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Generate all pages
        this._createCoverPage(doc, reportData, imagePath);
        this._createMainReportPage(doc, reportData);
        
        // Add premium content if applicable
        if (reportData.tier === 'plus' || reportData.tier === 'premium') {
          this._createPlusContentPage(doc, reportData);
        }
        
        if (reportData.tier === 'premium') {
          this._createPremiumContentPage(doc, reportData);
        }

        // Add addon content if present
        if (reportData.addons && reportData.addons.length > 0) {
          this._createAddonsPage(doc, reportData);
        }

        // Footer with disclaimer
        this._addDisclaimer(doc);

        doc.end();
        
        stream.on('finish', () => {
          console.log(`Professional PDF report generated: ${outputPath}`);
          resolve(outputPath);
        });
        
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create the cover page with branding and main image
   */
  _createCoverPage(doc, reportData, imagePath) {
    // Brand header
    doc.rect(0, 0, doc.page.width, 140)
       .fillAndStroke('#FCE4EC', '#E91E63');

    // Logo area (centered)
    doc.fontSize(24)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('SoulmateSketch', 0, 40, { align: 'center' });

    doc.fontSize(12)
       .fillColor('#FFFFFF')
       .font('Helvetica')
       .text('Your Personalized Soulmate Report', 0, 70, { align: 'center' });

    // Main title
    doc.moveDown(3);
    doc.fontSize(32)
       .fillColor(this.accentColor)
       .font('Helvetica-Bold')
       .text('Your Soulmate Sketch', { align: 'center' });

    // Subtitle with personalization
    doc.moveDown(1);
    doc.fontSize(14)
       .fillColor(this.lightTextColor)
       .font('Helvetica')
       .text(`Prepared especially for ${reportData.userInfo?.name || 'You'}`, { align: 'center' });

    // Main image (if exists)
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        const imageY = doc.y + 30;
        const imageSize = 300;
        const imageX = (doc.page.width - imageSize) / 2;
        
        doc.image(imagePath, imageX, imageY, { 
          width: imageSize, 
          height: imageSize,
          align: 'center'
        });
        
        // Image frame
        doc.rect(imageX - 5, imageY - 5, imageSize + 10, imageSize + 10)
           .strokeColor('#E0E0E0')
           .lineWidth(2)
           .stroke();
        
        doc.y = imageY + imageSize + 40;
      } catch (error) {
        console.warn('Could not add image to PDF:', error.message);
        doc.moveDown(8);
      }
    } else {
      doc.moveDown(8);
    }

    // Footer info
    doc.fontSize(10)
       .fillColor(this.lightTextColor)
       .text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.fontSize(8)
       .fillColor(this.lightTextColor)
       .text('This report is created for entertainment and inspiration purposes', { align: 'center' });
  }

  /**
   * Create the main content page with core analysis
   */
  _createMainReportPage(doc, reportData) {
    doc.addPage();
    
    // Page header
    this._addPageHeader(doc, 'Your Soulmate Analysis');
    
    // Core sections
    this._addSection(doc, 'Overview', reportData.analysis.overview);
    this._addSection(doc, 'Personality & Energy', reportData.analysis.personality);
    this._addSection(doc, 'Connection Style', reportData.analysis.connectionStyle);
    this._addSection(doc, 'How You\'ll Meet', reportData.analysis.meetingScenario);
    this._addSection(doc, 'What They\'re Seeking', reportData.analysis.seeking);
    
    if (reportData.analysis.astrology) {
      this._addSection(doc, 'Cosmic Insights', reportData.analysis.astrology);
    }
  }

  /**
   * Create plus tier content page
   */
  _createPlusContentPage(doc, reportData) {
    doc.addPage();
    
    this._addPageHeader(doc, 'Enhanced Analysis (Plus)');
    
    if (reportData.plusContent?.locationInsights) {
      this._addSection(doc, 'Location & Timing Insights', reportData.plusContent.locationInsights);
    }
    
    if (reportData.plusContent?.enhancedAstrology) {
      this._addSection(doc, 'Advanced Astrological Analysis', reportData.plusContent.enhancedAstrology);
    }
  }

  /**
   * Create premium tier content page
   */
  _createPremiumContentPage(doc, reportData) {
    doc.addPage();
    
    this._addPageHeader(doc, 'Premium Spiritual Analysis');
    
    if (reportData.premiumContent?.fullAstrology) {
      this._addSection(doc, 'Complete Birth Chart Analysis', reportData.premiumContent.fullAstrology);
    }
    
    if (reportData.premiumContent?.relationshipStrategy) {
      this._addSection(doc, 'Personal Relationship Strategy', reportData.premiumContent.relationshipStrategy);
    }
    
    if (reportData.premiumContent?.spiritualGrowth) {
      this._addSection(doc, 'Spiritual Growth & Preparation', reportData.premiumContent.spiritualGrowth);
    }
    
    if (reportData.premiumContent?.cosmicTiming) {
      this._addSection(doc, 'Cosmic Timing & Manifestation', reportData.premiumContent.cosmicTiming);
    }
  }

  /**
   * Create addons page for special content
   */
  _createAddonsPage(doc, reportData) {
    if (reportData.addonContent && Object.keys(reportData.addonContent).length > 0) {
      doc.addPage();
      
      this._addPageHeader(doc, 'Special Spiritual Insights');
      
      if (reportData.addonContent.auraReading) {
        this._addSection(doc, 'Your Aura Reading', reportData.addonContent.auraReading);
      }
      
      if (reportData.addonContent.twinFlame) {
        this._addSection(doc, 'Twin Flame Connection Insights', reportData.addonContent.twinFlame);
      }
      
      if (reportData.addonContent.pastLife) {
        this._addSection(doc, 'Past Life Connection Glimpse', reportData.addonContent.pastLife);
      }
    }
  }

  /**
   * Add a page header with consistent styling
   */
  _addPageHeader(doc, title) {
    // Header line
    doc.moveTo(60, 80)
       .lineTo(doc.page.width - 60, 80)
       .strokeColor(this.brandColor)
       .lineWidth(2)
       .stroke();

    // Title
    doc.fontSize(18)
       .fillColor(this.accentColor)
       .font('Helvetica-Bold')
       .text(title, 60, 90);
    
    doc.moveDown(2);
  }

  /**
   * Add a content section with consistent formatting
   */
  _addSection(doc, heading, content) {
    if (!content || content.trim() === '') return;
    
    // Check if we need a new page
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }
    
    // Section heading
    doc.fontSize(14)
       .fillColor(this.brandColor)
       .font('Helvetica-Bold')
       .text(heading);
    
    doc.moveDown(0.3);
    
    // Section content
    doc.fontSize(11)
       .fillColor(this.textColor)
       .font('Helvetica')
       .text(content, { 
         align: 'left',
         lineGap: 2
       });
    
    doc.moveDown(1.5);
  }

  /**
   * Add disclaimer at the end
   */
  _addDisclaimer(doc) {
    // Ensure we're at the bottom of the last page
    const remainingSpace = doc.page.height - doc.y - 60;
    if (remainingSpace < 80) {
      doc.addPage();
    } else {
      doc.y = doc.page.height - 120;
    }
    
    // Separator line
    doc.moveTo(60, doc.y)
       .lineTo(doc.page.width - 60, doc.y)
       .strokeColor('#E0E0E0')
       .lineWidth(1)
       .stroke();
    
    doc.moveDown(0.5);
    
    // Disclaimer text
    doc.fontSize(9)
       .fillColor(this.lightTextColor)
       .font('Helvetica')
       .text('Important: This SoulmateSketch report is created for entertainment, inspiration, and self-reflection purposes. It is not intended to provide professional advice, predict specific outcomes, or guarantee romantic results. All insights are generated through AI analysis of your preferences and should be considered as creative inspiration for your personal journey.', {
         align: 'left',
         lineGap: 1
       });
    
    doc.moveDown(0.3);
    
    doc.fontSize(8)
       .fillColor(this.lightTextColor)
       .text(`© ${new Date().getFullYear()} SoulmateSketch. All rights reserved.`, { align: 'center' });
  }
}

/**
 * Data processor to clean and structure report data
 */
export class ReportDataProcessor {
  /**
   * Process raw quiz and AI data into clean report structure
   * @param {Object} quiz - User quiz responses
   * @param {string} aiText - Generated text content
   * @param {string} tier - Service tier
   * @param {Array} addons - Selected addons
   */
  static processReportData(quiz, aiText, tier, addons = []) {
    const userInfo = {
      name: quiz.user?.name || quiz.user?.email?.split('@')[0] || null,
      location: quiz.user?.country || null,
      preferences: quiz.preferences || {}
    };

    // Parse AI text into structured sections
    const sections = this._parseAITextSections(aiText);
    
    // Core analysis (available in all tiers)
    const analysis = {
      overview: sections['Overview'] || sections['overview'] || 'Your soulmate analysis reveals unique insights about your ideal connection.',
      personality: sections['Personality & Vibe'] || sections['personality'] || 'A warm, compatible personality awaits.',
      connectionStyle: sections['Attachment Style & Love Languages'] || sections['connection'] || 'Your connection will be built on understanding and compatibility.',
      meetingScenario: sections['First Meeting Scenario'] || sections['meeting'] || 'Your paths will cross in a meaningful way.',
      seeking: sections["What They're Looking For Now"] || sections['seeking'] || 'Someone seeking the same depth of connection as you.',
      astrology: sections['Numerology/Astro Notes'] || sections['astrology'] || null
    };

    // Plus tier content
    const plusContent = (tier === 'plus' || tier === 'premium') ? {
      locationInsights: sections['Location Insights'] || null,
      enhancedAstrology: sections['Enhanced Astrological Analysis'] || null
    } : null;

    // Premium tier content
    const premiumContent = (tier === 'premium') ? {
      fullAstrology: sections['Full Astrological AI Analysis'] || null,
      relationshipStrategy: sections['Personal Relationship Strategy Guide'] || null,
      spiritualGrowth: sections['Spiritual Growth & Preparation'] || null,
      cosmicTiming: sections['Cosmic Timing & Manifestation'] || null
    } : null;

    // Addon content
    const addonContent = {};
    if (addons.includes('aura')) {
      addonContent.auraReading = this._generatePersonalizedAuraReading(quiz);
    }
    if (addons.includes('twin_flame')) {
      addonContent.twinFlame = this._generateTwinFlameInsight(quiz);
    }
    if (addons.includes('past_life')) {
      addonContent.pastLife = this._generatePastLifeGlimpse(quiz);
    }

    return {
      userInfo,
      tier,
      addons,
      analysis,
      plusContent,
      premiumContent,
      addonContent: Object.keys(addonContent).length > 0 ? addonContent : null,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Parse AI-generated text into structured sections
   */
  static _parseAITextSections(text) {
    const sections = {};
    if (!text) return sections;
    
    const lines = text.split(/\r?\n/);
    let currentSection = 'default';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if this line is a section header
      const sectionHeaders = [
        'Overview', 'Personality & Vibe', 'Attachment Style & Love Languages',
        'First Meeting Scenario', "What They're Looking For Now", 'Numerology/Astro Notes',
        'Location Insights', 'Enhanced Astrological Analysis',
        'Full Astrological AI Analysis', 'Personal Relationship Strategy Guide',
        'Spiritual Growth & Preparation', 'Cosmic Timing & Manifestation'
      ];
      
      if (sectionHeaders.includes(trimmed)) {
        currentSection = trimmed;
        sections[currentSection] = '';
        continue;
      }
      
      // Add content to current section
      if (trimmed) {
        if (!sections[currentSection]) {
          sections[currentSection] = trimmed;
        } else {
          sections[currentSection] += '\n' + trimmed;
        }
      }
    }
    
    return sections;
  }

  /**
   * Generate personalized aura reading
   */
  static _generatePersonalizedAuraReading(quiz) {
    const personality = quiz.personality || {};
    const preferences = quiz.preferences || {};
    
    const auraColor = preferences.auraPalette || 'warm golden';
    
    return `Your aura radiates in ${auraColor} hues, creating a magnetic energy field that naturally attracts compatible souls. This luminous presence reflects your inner harmony and draws connections that resonate with your authentic self.\n\nYour soulmate will be naturally drawn to this energetic signature, feeling an immediate sense of comfort and recognition when they encounter your presence. The chemistry between your energies creates a complementary resonance - where your light amplifies theirs and vice versa.\n\nExpect to notice subtle signs of this auric compatibility: conversations that flow effortlessly, a sense of being truly "seen," and an inexplicable feeling of coming home when you're together.`;
  }

  /**
   * Generate twin flame insight
   */
  static _generateTwinFlameInsight(quiz) {
    const personality = quiz.personality || {};
    const values = personality.values || [];
    
    return `Your twin flame connection operates on the principle of divine mirroring - where each of you reflects the other's greatest potential and areas for growth. This relationship will gently challenge you while providing deep spiritual fulfillment.\n\n${values.length > 0 ? `Your shared commitment to ${values.slice(0, 2).join(' and ')} creates a foundation for mutual growth and understanding.` : ''}\n\nThe intensity of this connection comes not from drama, but from the accelerated spiritual growth you experience together. You'll find yourselves naturally inspiring each other to become the highest versions of yourselves.\n\nKey guidance for your twin flame journey: Practice radical honesty, embrace the growth opportunities that arise through your differences, and remember that this connection serves your mutual evolution.`;
  }

  /**
   * Generate past life glimpse
   */
  static _generatePastLifeGlimpse(quiz) {
    const personality = quiz.personality || {};
    const values = personality.values || [];
    
    return `In a past life glimpse, you appear as kindred spirits connected by a shared mission of love and service. Your bond was forged through challenges that strengthened your commitment to each other and to a greater purpose.\n\nThe familiarity you'll feel upon meeting stems from this ancient recognition - your souls remembering not just each other, but the shared purpose that once united you. The deep understanding you experienced then has prepared you for the joy and fulfillment possible now.\n\n${values.length > 0 ? `Your current values of ${values.slice(0, 2).join(' and ')} were also central to your shared mission in that previous lifetime.` : ''}\n\nThis lifetime offers you the opportunity to complete what was left unfinished and to build the lasting connection that circumstances previously prevented. Trust the déjà vu moments and the feeling that you've loved this person before - because in the truest sense, you have.`;
  }
}