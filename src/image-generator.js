import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Enhanced AI Image Generator for SoulmateSketch
 * Creates realistic, high-quality soulmate portraits using DALL-E
 */
export class EnhancedImageGenerator {
  constructor() {
    this.hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-replace-me');
    this.openai = this.hasOpenAIKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  }

  /**
   * Generate a professional soulmate portrait
   * @param {Object} options - Generation parameters
   * @param {Object} options.quiz - User quiz responses
   * @param {string} options.style - Art style preference
   * @param {Array} options.addons - Selected addons
   */
  async generateSoulmateImage({ quiz, style = 'realistic', addons = [] }) {
    try {
      console.log('Starting enhanced image generation...');
      
      // Build comprehensive prompt from user data
      const prompt = this._buildEnhancedPrompt(quiz, style, addons);
      console.log('Generated image prompt (character count):', prompt.length);
      
      let imageBuffer;
      
      if (this.openai) {
        // Generate with DALL-E 3
        imageBuffer = await this._generateWithDALLE(prompt);
      } else {
        // Fallback to placeholder
        imageBuffer = await this._generatePlaceholder(quiz);
      }
      
      // Process and save image
      const { filePath, sharePath } = await this._saveProcessedImages(imageBuffer);
      
      return { 
        filePath, 
        sharePath,
        success: true,
        method: this.openai ? 'dall-e' : 'placeholder'
      };
      
    } catch (error) {
      console.error('Image generation failed:', error);
      
      // Generate fallback image
      const imageBuffer = await this._generatePlaceholder(quiz);
      const { filePath, sharePath } = await this._saveProcessedImages(imageBuffer);
      
      return { 
        filePath, 
        sharePath, 
        success: false, 
        error: error.message,
        method: 'fallback'
      };
    }
  }

  /**
   * Build an enhanced, detailed prompt for DALL-E
   */
  _buildEnhancedPrompt(quiz, style, addons) {
    const user = quiz.user || {};
    const appearance = quiz.appearance || {};
    const personality = quiz.personality || {};
    const birth = quiz.birth || {};
    const preferences = quiz.preferences || {};
    
    // Determine gender and age
    const attractedTo = user.attractedTo || quiz.interest || 'person';
    let genderDescription = this._getGenderDescription(attractedTo);
    let ageDescription = this._getAgeDescription(user.ageRange);
    
    // Build comprehensive appearance description
    const appearanceDetails = this._buildAppearanceDescription(appearance);
    const personalityVibes = this._buildPersonalityExpression(personality);
    const culturalContext = this._getCulturalContext(appearance.culturalResonance);
    const zodiacEnergy = this._getZodiacVisualEnergy(birth.zodiac);
    
    // Style and technical specifications
    const styleSpecs = this._getStyleSpecifications(style);
    const lightingSpecs = this._getLightingSpecifications(personality, preferences);
    const sceneDescription = this._getSceneDescription(personality, preferences);
    
    // Add-on visual enhancements
    const addonEffects = this._getAddonVisualEffects(addons, preferences);
    
    // Construct the comprehensive prompt
    const prompt = `Create a hyper-realistic portrait photograph of ${genderDescription}${ageDescription} as the viewer's ideal soulmate, incorporating detailed personalization:

APPEARANCE SPECIFICATIONS:
${appearanceDetails}
${culturalContext}

PERSONALITY EXPRESSION:
${personalityVibes}
${zodiacEnergy}

SCENE & COMPOSITION:
${sceneDescription}
- Portrait framing: Professional headshot to upper chest, cinematic composition
- Camera angle: Slight 3/4 view or straight-on, flattering perspective
- Depth of field: Soft background blur (f/1.8-2.8 look), sharp focus on subject
${lightingSpecs}

TECHNICAL EXCELLENCE:
- Hyper-realistic rendering: Natural skin texture with pores, subtle imperfections, realistic shine
- Eye detail: Sharp, lifelike eyes with natural catchlights and iris detail
- Hair realism: Individual strands visible, natural movement, realistic texture and shine
- Skin quality: Natural subsurface scattering, healthy complexion, authentic color variation
- Expression: Warm, genuine smile or gentle, inviting expression that conveys connection and warmth
- Professional quality: Studio-grade lighting, precise color grading, sharp image quality

${styleSpecs}

${addonEffects}

STRICT REQUIREMENTS:
- Photorealistic quality only - no cartoon, anime, or illustration styles
- Natural beauty standards - avoid over-perfection or artificial enhancement
- Appropriate, tasteful presentation - focus on face and personality
- No text, watermarks, signatures, or graphic overlays
- Anatomically correct and proportionate
- Professional portrait photography aesthetic
- Warm, inviting, and approachable demeanor
- High resolution and sharp detail throughout

AVOID: Cartoon styles, plastic appearance, heavy digital effects, inappropriate content, minors, exaggerated features, fantasy elements, text overlays, multiple people, hands in frame (unless specifically requested), overly dramatic lighting, artificial backgrounds.`;

    return prompt;
  }

  /**
   * Generate image using DALL-E 3
   */
  async _generateWithDALLE(prompt) {
    console.log('Generating image with DALL-E 3...');
    
    const response = await this.openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
      response_format: 'url'
    });

    const imageUrl = response.data[0].url;
    console.log('DALL-E generated image URL received');

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    return Buffer.from(await imageResponse.arrayBuffer());
  }

  /**
   * Generate a professional placeholder image
   */
  async _generatePlaceholder(quiz) {
    console.log('Generating professional placeholder image...');
    
    const user = quiz.user || {};
    const attractedTo = user.attractedTo || 'person';
    
    // Create a sophisticated gradient placeholder
    const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#FCE4EC"/>
          <stop offset="60%" stop-color="#F8BBD9"/>
          <stop offset="100%" stop-color="#E1BEE7"/>
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)"/>
      
      <!-- Decorative elements -->
      <circle cx="200" cy="200" r="100" fill="#E91E63" opacity="0.1"/>
      <circle cx="800" cy="300" r="80" fill="#9C27B0" opacity="0.1"/>
      <circle cx="300" cy="800" r="120" fill="#E91E63" opacity="0.08"/>
      
      <!-- Main content -->
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" 
            font-size="48" font-family="serif" fill="#2D2240" filter="url(#glow)">
        Your Soulmate
      </text>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" 
            font-size="32" font-family="serif" fill="#E91E63">
        Portrait
      </text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" 
            font-size="16" font-family="sans-serif" fill="#666">
        AI-Generated Image Coming Soon
      </text>
      
      <!-- Bottom decoration -->
      <path d="M 200 900 Q 512 850 824 900" stroke="#E91E63" stroke-width="3" fill="none" opacity="0.4"/>
    </svg>`;

    return await sharp(Buffer.from(svg)).png().toBuffer();
  }

  /**
   * Save processed images (main and social share variant)
   */
  async _saveProcessedImages(imageBuffer) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    
    const timestamp = Date.now();
    const filePath = path.join(uploadsDir, `soulmate_${timestamp}.png`);
    const sharePath = path.join(uploadsDir, `soulmate_${timestamp}_story.png`);
    
    // Save main image (optimized)
    await sharp(imageBuffer)
      .resize(1024, 1024, { 
        fit: 'cover',
        position: 'center'
      })
      .png({ 
        quality: 90,
        compressionLevel: 6
      })
      .toFile(filePath);
    
    // Create social media story variant (9:16 aspect ratio)
    await sharp(imageBuffer)
      .resize(1080, 1920, { 
        fit: 'cover',
        position: 'center'
      })
      .png({ 
        quality: 85,
        compressionLevel: 7
      })
      .toFile(sharePath);
    
    console.log(`Images saved: ${path.basename(filePath)}, ${path.basename(sharePath)}`);
    
    return { filePath, sharePath };
  }

  // Helper methods for building prompt components

  _getGenderDescription(attractedTo) {
    const genderMap = {
      'men': 'an attractive male adult',
      'male': 'an attractive male adult', 
      'women': 'an attractive female adult',
      'female': 'an attractive female adult',
      'both': 'an attractive adult person',
      'non-binary': 'an attractive non-binary adult',
      'all': 'an attractive adult person'
    };
    return genderMap[attractedTo] || 'an attractive adult person';
  }

  _getAgeDescription(ageRange) {
    if (!ageRange) return '';
    
    const ageMap = {
      '18-25': ' appearing to be in their early twenties',
      '25-35': ' appearing to be in their late twenties to early thirties',
      '35-45': ' appearing to be in their thirties to early forties',
      '45-55': ' appearing to be in their forties to early fifties',
      '55+': ' appearing to be in their mature years with distinguished features'
    };
    
    return ageMap[ageRange] || '';
  }

  _buildAppearanceDescription(appearance) {
    if (!appearance || Object.keys(appearance).length === 0) {
      return 'Natural, attractive features with warm, approachable appearance and friendly demeanor';
    }
    
    let details = [];
    
    // Face structure
    if (appearance.faceShape) {
      const faceMap = {
        'oval': 'oval face shape with balanced, harmonious proportions',
        'round': 'round, soft face shape with gentle, welcoming curves',
        'square': 'strong, defined jawline with confident square face shape',
        'heart': 'heart-shaped face with elegant, defined cheekbones',
        'long': 'elongated, refined face shape with distinguished features',
        'diamond': 'diamond face shape with striking, prominent cheekbones'
      };
      details.push(faceMap[appearance.faceShape] || `${appearance.faceShape} face shape`);
    }
    
    // Hair description
    if (appearance.hairLength || appearance.hairTexture || appearance.hairColor) {
      let hairParts = [];
      if (appearance.hairLength && appearance.hairLength !== 'any') hairParts.push(appearance.hairLength);
      if (appearance.hairTexture && appearance.hairTexture !== 'any') hairParts.push(appearance.hairTexture);
      if (appearance.hairColor && appearance.hairColor !== 'any') hairParts.push(appearance.hairColor);
      
      if (hairParts.length > 0) {
        details.push(`${hairParts.join(', ')} hair with natural movement and healthy shine`);
      }
    }
    
    // Eye details
    if (appearance.eyeColor || appearance.eyeShape) {
      let eyeParts = [];
      if (appearance.eyeColor && appearance.eyeColor !== 'any') eyeParts.push(appearance.eyeColor);
      if (appearance.eyeShape && appearance.eyeShape !== 'any') eyeParts.push(appearance.eyeShape);
      
      if (eyeParts.length > 0) {
        details.push(`${eyeParts.join(', ')} eyes with natural warmth and expressive depth`);
      }
    }
    
    // Skin tone
    if (appearance.skinTone && appearance.skinTone !== 'any') {
      details.push(`${appearance.skinTone} skin tone with healthy, natural radiance`);
    }
    
    // Additional features
    if (appearance.facialHair && appearance.facialHair !== 'none') {
      details.push(`well-groomed ${appearance.facialHair} facial hair`);
    }
    
    if (appearance.freckles && appearance.freckles !== 'none') {
      details.push(`natural ${appearance.freckles} freckles adding character and charm`);
    }
    
    return details.length > 0 
      ? details.join('; ')
      : 'Natural, attractive features with warm, approachable appearance';
  }

  _buildPersonalityExpression(personality) {
    if (!personality) return 'Warm, confident energy with genuine approachability and kind demeanor';
    
    let expressions = [];
    
    // Extract personality metrics
    const introvert = personality.introvertExtrovert || 50;
    const grounded = personality.groundedAdventurous || 50;
    const analytical = personality.analyticalCreative || 50;
    
    // Energy level expression
    if (introvert < 30) {
      expressions.push('vibrant, outgoing energy with animated, engaging expression');
    } else if (introvert > 70) {
      expressions.push('calm, thoughtful presence with serene, contemplative expression');
    } else {
      expressions.push('balanced, warm energy with approachable, friendly expression');
    }
    
    // Adventure/stability vibe
    if (grounded < 30) {
      expressions.push('adventurous, dynamic spirit visible in bright, excited eyes');
    } else if (grounded > 70) {
      expressions.push('grounded, stable presence with reassuring, steady gaze');
    } else {
      expressions.push('harmonious balance of excitement and stability in their expression');
    }
    
    // Creative/analytical energy
    if (analytical < 30) {
      expressions.push('creative, artistic soul with dreamy, imaginative look');
    } else if (analytical > 70) {
      expressions.push('intelligent, thoughtful nature with clear, focused eyes');
    } else {
      expressions.push('creative intelligence with both wisdom and imagination in their gaze');
    }
    
    return expressions.join(', ');
  }

  _getCulturalContext(culturalResonance) {
    if (!culturalResonance) return '';
    
    const culturalMap = {
      'European': 'with refined European aesthetic and classical features',
      'Asian': 'with elegant Asian features and graceful beauty',
      'Latin': 'with warm Latin heritage and expressive features',
      'African': 'with stunning African features and radiant beauty',
      'Middle Eastern': 'with striking Middle Eastern features and exotic allure',
      'Mixed': 'with beautiful mixed heritage combining multiple cultural aesthetics',
      'Other': 'with unique cultural beauty and distinctive features'
    };
    
    return culturalMap[culturalResonance] || `with ${culturalResonance} cultural aesthetic`;
  }

  _getZodiacVisualEnergy(zodiac) {
    if (!zodiac) return '';
    
    const zodiacEnergy = {
      'aries': 'confident, dynamic presence with hint of fiery warmth in their aura',
      'taurus': 'grounded, sensual energy with natural, earthy beauty',
      'gemini': 'bright, intellectual sparkle with quick, engaging expression',
      'cancer': 'nurturing, gentle energy with soft, caring eyes',
      'leo': 'radiant, magnetic presence with natural charisma and warmth',
      'virgo': 'refined, elegant energy with precise, thoughtful features',
      'libra': 'harmonious, beautiful energy with naturally balanced, aesthetic features',
      'scorpio': 'intense, magnetic energy with deep, mysterious eyes',
      'sagittarius': 'optimistic, free-spirited energy with bright, adventurous expression',
      'capricorn': 'dignified, ambitious energy with strong, determined features',
      'aquarius': 'unique, innovative energy with distinctive, original beauty',
      'pisces': 'dreamy, intuitive energy with soft, ethereal, compassionate expression'
    };
    
    return zodiacEnergy[zodiac.toLowerCase()] || '';
  }

  _getStyleSpecifications(style) {
    const styleMap = {
      'realistic': `
PHOTOGRAPHIC STYLE:
- Ultra-realistic portrait photography with natural lighting
- Professional studio quality with soft key lighting and gentle fill
- 85mm portrait lens aesthetic with beautiful bokeh
- Natural color grading with warm, inviting tones
- Sharp focus with subtle depth of field`,
      
      'ethereal': `
ETHEREAL REALISTIC STYLE:
- Realistic portrait with subtle, dreamy enhancement
- Soft, angelic lighting with gentle rim light
- Natural beauty with slight luminous quality
- Warm, celestial color palette
- Realistic features with ethereal atmosphere`,
      
      'artistic': `
ARTISTIC REALISTIC STYLE:
- Photorealistic with subtle artistic enhancement
- Creative lighting with artistic shadows and highlights
- Natural features with slightly enhanced dramatic appeal
- Rich, sophisticated color grading
- Professional portrait with artistic flair`,
      
      'modern': `
MODERN REALISTIC STYLE:
- Contemporary portrait photography style
- Clean, modern lighting setup
- Sharp, high-resolution detail
- Modern color grading with crisp, clean tones
- Fashion-forward but natural presentation`
    };
    
    return styleMap[style] || styleMap['realistic'];
  }

  _getLightingSpecifications(personality, preferences) {
    const introvert = personality?.introvertExtrovert || 50;
    const auraPalette = preferences?.auraPalette;
    
    let lighting = '- Lighting: Soft, flattering key light with gentle fill lighting';
    
    if (introvert < 30) {
      lighting = '- Lighting: Bright, vibrant lighting with energetic, uplifting quality';
    } else if (introvert > 70) {
      lighting = '- Lighting: Soft, intimate lighting with warm, cozy atmosphere';
    }
    
    if (auraPalette) {
      lighting += `\n- Color temperature: Warm tones with subtle ${auraPalette} color influence`;
    }
    
    return lighting;
  }

  _getSceneDescription(personality, preferences) {
    const introvert = personality?.introvertExtrovert || 50;
    let scene = 'Clean, professional background with subtle depth and warmth';
    
    if (introvert > 60) {
      scene = 'Intimate, cozy setting with soft, warm background suggesting comfort and security';
    } else if (introvert < 40) {
      scene = 'Bright, open background with natural light suggesting openness and social energy';
    }
    
    // Add preference-based modifications
    if (preferences?.auraPalette) {
      scene += `, with subtle ${preferences.auraPalette} color harmonies in the background`;
    }
    
    return scene;
  }

  _getAddonVisualEffects(addons, preferences) {
    let effects = '';
    
    if (addons.includes('aura')) {
      const auraColor = preferences?.auraPalette || 'warm golden';
      effects += `\n- Subtle aura effect: Very gentle, realistic rim lighting in ${auraColor} tones around the subject (barely noticeable, professional and tasteful)`;
    }
    
    if (addons.includes('twin_flame')) {
      effects += '\n- Twin flame energy: Subtle dual-light effect or gentle mirrored highlight suggesting spiritual connection (keep photographic and unobtrusive)';
    }
    
    if (addons.includes('past_life')) {
      effects += '\n- Timeless quality: Subtle classical or vintage-inspired lighting that suggests depth and history while maintaining modern appeal';
    }
    
    return effects;
  }
}

/**
 * Image processing utilities
 */
export class ImageProcessor {
  /**
   * Optimize image for web delivery
   */
  static async optimizeImage(imagePath, quality = 85) {
    const optimizedPath = imagePath.replace('.png', '_optimized.png');
    
    await sharp(imagePath)
      .resize(1024, 1024, { 
        fit: 'cover',
        position: 'center'
      })
      .png({ 
        quality,
        compressionLevel: 6,
        adaptiveFiltering: true
      })
      .toFile(optimizedPath);
    
    return optimizedPath;
  }

  /**
   * Create thumbnail version
   */
  static async createThumbnail(imagePath, size = 256) {
    const thumbnailPath = imagePath.replace('.png', '_thumb.png');
    
    await sharp(imagePath)
      .resize(size, size, { 
        fit: 'cover',
        position: 'center'
      })
      .png({ 
        quality: 80,
        compressionLevel: 8
      })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  }
}