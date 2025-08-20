import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-replace-me');
const openai = hasOpenAIKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Helper function to calculate numerology from birth date
function calculateNumerology(birthDate) {
  if (!birthDate) return null;
  
  const date = new Date(birthDate);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  // Life Path Number
  const lifePath = reduceToSingleDigit(day + month + year);
  
  // Soul Urge (vowels in full name would be ideal, but we'll use birth data)
  const soulUrge = reduceToSingleDigit(month + day);
  
  // Expression Number (consonants in name, approximated)
  const expression = reduceToSingleDigit(year);
  
  const compatibility = generateCompatibilityInsight(lifePath);
  
  return { lifePath, soulUrge, expression, compatibility };
}

function reduceToSingleDigit(num) {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return num;
}

function generateCompatibilityInsight(lifePath) {
  const insights = {
    1: "Natural leader energy - seeks independent, ambitious partners",
    2: "Cooperative, diplomatic - thrives with supportive, gentle souls", 
    3: "Creative, expressive - drawn to artistic, communicative types",
    4: "Practical, stable - values reliability and long-term commitment",
    5: "Freedom-loving, adventurous - needs exciting, flexible partners",
    6: "Nurturing, family-oriented - seeks caring, home-focused connections",
    7: "Spiritual, introspective - connects with deep, thoughtful individuals",
    8: "Success-oriented, material - attracts ambitious, goal-driven types",
    9: "Humanitarian, compassionate - bonds with empathetic, service-minded souls",
    11: "Intuitive, inspirational - seeks spiritually aware, sensitive partners",
    22: "Master builder energy - drawn to practical visionaries",
    33: "Master teacher - connects with wise, healing-oriented individuals"
  };
  return insights[lifePath] || "Unique path seeking understanding connections";
}

function generateAstrologicalInsights(birth) {
  if (!birth.zodiac) return null;
  
  const zodiacTraits = {
    'aries': 'Fire energy - passionate, direct communication, adventurous spirit',
    'taurus': 'Earth stability - sensual, loyal, values comfort and security', 
    'gemini': 'Air intellect - witty, curious, needs mental stimulation',
    'cancer': 'Water emotion - nurturing, intuitive, values home and family',
    'leo': 'Fire confidence - generous, dramatic, seeks appreciation and fun',
    'virgo': 'Earth precision - practical, helpful, values improvement and service',
    'libra': 'Air harmony - diplomatic, romantic, seeks balance and beauty',
    'scorpio': 'Water intensity - passionate, mysterious, desires deep transformation',
    'sagittarius': 'Fire freedom - optimistic, philosophical, loves growth and travel',
    'capricorn': 'Earth ambition - disciplined, responsible, values achievement',
    'aquarius': 'Air innovation - independent, humanitarian, seeks unique connections',
    'pisces': 'Water intuition - compassionate, dreamy, values spiritual connection'
  };
  
  const sign = birth.zodiac.toLowerCase();
  const traits = zodiacTraits[sign] || 'Unique cosmic energy';
  
  let timing = '';
  if (birth.date) {
    const birthMonth = new Date(birth.date).getMonth() + 1;
    const currentMonth = new Date().getMonth() + 1;
    timing = `Current cosmic timing favors connections, especially with ${Math.abs(currentMonth - birthMonth) < 3 ? 'heightened' : 'gentle'} energy flow.`;
  }
  
  return `${traits}. ${timing}`;
}

function analyzePersonalityProfile(personality) {
  if (!personality) return 'Balanced, open to connection';
  
  let profile = [];
  
  // Analyze sliders (0-100 scale)
  const introvert = personality.introvertExtrovert || 50;
  const grounded = personality.groundedAdventurous || 50;  
  const analytical = personality.analyticalCreative || 50;
  
  if (introvert < 30) profile.push('highly extroverted, energized by social connection');
  else if (introvert > 70) profile.push('introverted, values deep one-on-one intimacy');
  else profile.push('ambivert, enjoys both social time and quiet moments');
  
  if (grounded < 30) profile.push('adventurous spirit, seeks exciting experiences');
  else if (grounded > 70) profile.push('grounded nature, appreciates stability and routine');
  else profile.push('balanced approach to adventure and stability');
  
  if (analytical < 30) profile.push('creative, intuitive decision-making style');
  else if (analytical > 70) profile.push('analytical, logical approach to relationships');
  else profile.push('balanced blend of logic and creativity');
  
  // Include values if present
  if (personality.values && personality.values.length > 0) {
    profile.push(`deeply values: ${personality.values.slice(0, 3).join(', ')}`);
  }
  
  return profile.join('; ');
}

function analyzeLoveLanguages(loveLanguages) {
  if (!loveLanguages || Object.keys(loveLanguages).length === 0) {
    return 'Quality Time and Words of Affirmation';
  }
  
  const languages = [
    { name: 'Words of Affirmation', score: loveLanguages.words || 0 },
    { name: 'Quality Time', score: loveLanguages.qualityTime || 0 },
    { name: 'Receiving Gifts', score: loveLanguages.gifts || 0 },
    { name: 'Acts of Service', score: loveLanguages.acts || 0 },
    { name: 'Physical Touch', score: loveLanguages.touch || 0 }
  ];
  
  languages.sort((a, b) => b.score - a.score);
  
  return languages.slice(0, 2).map(l => l.name).join(' and ');
}

// Helper functions for image generation personalization
function buildAppearanceDescription(appearance) {
  if (!appearance || Object.keys(appearance).length === 0) {
    return 'Natural, attractive features with warm, approachable appearance';
  }
  
  let description = [];
  
  // Face shape and structure
  if (appearance.faceShape) {
    const faceMap = {
      'oval': 'oval face shape with balanced proportions',
      'round': 'round, soft face shape with gentle curves', 
      'square': 'strong, defined jawline with square face shape',
      'heart': 'heart-shaped face with defined cheekbones',
      'long': 'elongated, elegant face shape',
      'diamond': 'diamond face shape with prominent cheekbones'
    };
    description.push(faceMap[appearance.faceShape] || `${appearance.faceShape} face shape`);
  }
  
  // Hair details
  if (appearance.hairLength || appearance.hairTexture || appearance.hairColor) {
    let hair = [];
    if (appearance.hairLength) hair.push(appearance.hairLength);
    if (appearance.hairTexture) hair.push(appearance.hairTexture);
    if (appearance.hairColor) hair.push(appearance.hairColor);
    description.push(`${hair.join(', ')} hair`);
  }
  
  // Eye details
  if (appearance.eyeColor || appearance.eyeShape) {
    let eyes = [];
    if (appearance.eyeColor) eyes.push(appearance.eyeColor);
    if (appearance.eyeShape) eyes.push(appearance.eyeShape);
    description.push(`${eyes.join(', ')} eyes with natural warmth`);
  }
  
  // Skin tone
  if (appearance.skinTone) {
    description.push(`${appearance.skinTone} skin tone with healthy, natural glow`);
  }
  
  // Facial hair
  if (appearance.facialHair && appearance.facialHair !== 'none') {
    description.push(`${appearance.facialHair} facial hair, well-groomed`);
  }
  
  // Freckles
  if (appearance.freckles && appearance.freckles !== 'none') {
    description.push(`${appearance.freckles} freckles adding natural character`);
  }
  
  // Apparent age
  if (appearance.apparentAge) {
    description.push(`appears ${appearance.apparentAge}, with youthful vitality`);
  }
  
  return description.length > 0 ? description.join('; ') : 'Natural, attractive features with warm, approachable appearance';
}

function buildPersonalityVibes(personality) {
  if (!personality) return 'Warm, confident energy with genuine approachability';
  
  let vibes = [];
  
  // Introvert/Extrovert energy
  const introvert = personality.introvertExtrovert || 50;
  if (introvert < 30) vibes.push('vibrant, outgoing energy');
  else if (introvert > 70) vibes.push('calm, thoughtful presence');
  else vibes.push('balanced, adaptable energy');
  
  // Grounded/Adventurous vibe
  const grounded = personality.groundedAdventurous || 50;
  if (grounded < 30) vibes.push('adventurous, spontaneous spirit');
  else if (grounded > 70) vibes.push('grounded, stable presence');
  else vibes.push('balanced between adventure and stability');
  
  // Analytical/Creative energy
  const analytical = personality.analyticalCreative || 50;
  if (analytical < 30) vibes.push('creative, artistic aura');
  else if (analytical > 70) vibes.push('intelligent, thoughtful demeanor');
  else vibes.push('creative intelligence');
  
  return vibes.join(', ');
}

function buildSceneDescription(personality, preferences) {
  let scene = 'Clean, softly lit environment with subtle depth and warmth';
  
  // Customize based on personality
  if (personality) {
    const introvert = personality.introvertExtrovert || 50;
    const grounded = personality.groundedAdventurous || 50;
    
    if (introvert > 60) {
      scene = 'Intimate, cozy setting - soft lighting, perhaps a reading nook or quiet cafe ambiance';
    } else if (introvert < 40) {
      scene = 'Bright, open setting - natural light, perhaps outdoor or bright interior space';
    }
    
    if (grounded < 40) {
      scene += ', with hints of adventure or travel elements in the background';
    } else if (grounded > 60) {
      scene += ', with comfortable, homey elements suggesting stability';
    }
  }
  
  // Consider art style preferences
  if (preferences?.auraPalette) {
    scene += `, with subtle color harmonies in ${preferences.auraPalette} tones`;
  }
  
  return scene;
}

function getZodiacVisualEnergy(zodiac) {
  if (!zodiac) return '';
  
  const visualEnergy = {
    'aries': 'confident, dynamic energy with hint of fire/warmth in lighting',
    'taurus': 'grounded, sensual energy with earthy, natural background elements',
    'gemini': 'bright, intellectual energy with clear, crisp lighting',
    'cancer': 'nurturing, gentle energy with soft, protective lighting',
    'leo': 'radiant, warm energy with golden, regal lighting tones',
    'virgo': 'precise, refined energy with clean, organized background',
    'libra': 'harmonious, beautiful energy with balanced, aesthetic composition',
    'scorpio': 'intense, magnetic energy with dramatic lighting and shadows',
    'sagittarius': 'optimistic, free-spirited energy with open, expansive background',
    'capricorn': 'dignified, ambitious energy with structured, professional setting',
    'aquarius': 'unique, innovative energy with modern, unconventional elements',
    'pisces': 'dreamy, intuitive energy with soft, flowing, ethereal qualities'
  };
  
  return visualEnergy[zodiac.toLowerCase()] || '';
}

// Personalized add-on content generators
function generatePersonalizedAuraReading(quiz) {
  const user = quiz.user || {};
  const personality = quiz.personality || {};
  const birth = quiz.birth || {};
  const preferences = quiz.preferences || {};
  
  // Base aura color on personality and preferences
  let auraColor = preferences.auraPalette || 'warm golden';
  
  // Personality-based aura interpretation
  const introvert = personality.introvertExtrovert || 50;
  const grounded = personality.groundedAdventurous || 50;
  const creative = personality.analyticalCreative || 50;
  
  let energyType = 'balanced and harmonious';
  if (introvert < 30) energyType = 'vibrant and expansive';
  else if (introvert > 70) energyType = 'deep and contemplative';
  
  let connectionStyle = 'steady and nurturing';
  if (grounded < 30) connectionStyle = 'dynamic and adventurous';
  else if (grounded > 70) connectionStyle = 'grounding and stabilizing';
  
  // Zodiac influence on aura
  let zodiacInfluence = '';
  if (birth.zodiac) {
    const zodiacAura = {
      'aries': 'with fiery undertones that inspire action and passion',
      'taurus': 'with earthy stability that provides security and comfort',
      'gemini': 'with quick, sparkling energy that stimulates mental connection',
      'cancer': 'with nurturing waves that create emotional safety',
      'leo': 'with radiant warmth that draws admiration and joy',
      'virgo': 'with precise, healing energy that supports growth',
      'libra': 'with harmonizing frequencies that create balance',
      'scorpio': 'with intense, transformative power that deepens bonds',
      'sagittarius': 'with expansive, optimistic rays that encourage exploration',
      'capricorn': 'with structured, ambitious energy that builds lasting foundations',
      'aquarius': 'with innovative, electric currents that spark unique connections',
      'pisces': 'with flowing, intuitive streams that enhance spiritual connection'
    };
    zodiacInfluence = zodiacAura[birth.zodiac.toLowerCase()] || '';
  }
  
  return `Your aura radiates in ${auraColor} hues, creating an ${energyType} energy field around you. This luminous presence attracts connections that are ${connectionStyle} in nature${zodiacInfluence}. 

Your soulmate will be naturally drawn to this energetic signature, feeling an immediate sense of comfort and recognition when they encounter your auric field. The chemistry between your energy and theirs creates a complementary resonance - where your light amplifies theirs and vice versa.

Expect to notice subtle signs of this auric compatibility: conversations that flow effortlessly, a sense of being "seen" on multiple levels, and an inexplicable feeling of coming home when you're together.`;
}

function generatePersonalizedTwinFlameInsight(quiz) {
  const personality = quiz.personality || {};
  const relationship = quiz.relationship || {};
  const birth = quiz.birth || {};
  
  // Analyze personality for growth themes
  const introvert = personality.introvertExtrovert || 50;
  const grounded = personality.groundedAdventurous || 50;
  const analytical = personality.analyticalCreative || 50;
  
  let growthTheme = 'balance and integration';
  let mirrorLessons = [];
  
  if (Math.abs(introvert - 50) > 20) {
    mirrorLessons.push(introvert < 50 ? 'learning to embrace quiet reflection' : 'discovering the joy of shared expression');
  }
  if (Math.abs(grounded - 50) > 20) {
    mirrorLessons.push(grounded < 50 ? 'finding beauty in stability and routine' : 'opening to spontaneity and new experiences');
  }
  if (Math.abs(analytical - 50) > 20) {
    mirrorLessons.push(analytical < 50 ? 'appreciating logical perspectives' : 'trusting intuitive wisdom');
  }
  
  // Values-based growth opportunities
  let valueAlignment = '';
  if (personality.values && personality.values.length > 0) {
    valueAlignment = `Your shared commitment to ${personality.values.slice(0, 2).join(' and ')} creates a foundation for mutual growth and understanding.`;
  }
  
  // Relationship desires and twin flame dynamics
  let connectionPurpose = '';
  if (relationship.lookingFor) {
    connectionPurpose = `This twin flame connection supports your desire for ${relationship.lookingFor}, while challenging you to grow beyond your comfort zone in beautiful ways.`;
  }
  
  const lessons = mirrorLessons.length > 0 ? mirrorLessons.join(', and ') : 'embracing both strength and vulnerability';
  
  return `Your twin flame connection operates on the principle of divine mirroring - where each of you reflects the other's greatest potential and areas for growth. This relationship will gently challenge you in the areas of ${lessons}.

${valueAlignment}

The intensity of this connection comes not from drama, but from the accelerated spiritual growth you experience together. You'll find yourselves naturally inspiring each other to become the highest versions of yourselves. 

${connectionPurpose}

Key guidance for your twin flame journey: Practice radical honesty, embrace the growth opportunities that arise through your differences, and remember that this connection serves your mutual evolution. The magnetic pull you feel is your souls recognizing a shared mission of growth and love.`;
}

function generatePersonalizedPastLifeGlimpse(quiz) {
  const user = quiz.user || {};
  const personality = quiz.personality || {};
  const relationship = quiz.relationship || {};
  const birth = quiz.birth || {};
  const appearance = quiz.appearance || {};
  
  // Generate past life theme based on personality and desires
  let lifeTheme = 'partnership and mutual support';
  let historicalContext = '';
  let unfinishedBusiness = '';
  let currentLifeLessons = '';
  
  // Personality-based past life scenario
  const introvert = personality.introvertExtrovert || 50;
  const grounded = personality.groundedAdventurous || 50;
  const analytical = personality.analyticalCreative || 50;
  
  if (grounded < 30) {
    historicalContext = 'travelers and explorers in a distant land';
    unfinishedBusiness = 'an adventure left incomplete, a journey that called you both toward something greater';
    currentLifeLessons = 'completion of that spiritual quest and the courage to explore new territories together';
  } else if (analytical < 30) {
    historicalContext = 'artists or creators in a vibrant cultural period';
    unfinishedBusiness = 'a masterpiece left unfinished, creative dreams that needed more time to flourish';
    currentLifeLessons = 'bringing those creative visions to life and supporting each other\'s artistic expression';
  } else {
    historicalContext = 'healers or teachers in a community that valued wisdom';
    unfinishedBusiness = 'knowledge that was meant to be shared, healing work that was interrupted';
    currentLifeLessons = 'continuing that service to others and creating the stable foundation that was missing';
  }
  
  // Cultural and location influences
  let culturalEcho = '';
  if (appearance.culturalResonance || user.country) {
    const culture = appearance.culturalResonance || user.country;
    culturalEcho = `There are echoes of ${culture} in this past-life connection, suggesting deep roots in that cultural wisdom.`;
  }
  
  // Relationship goals connection
  let modernPurpose = '';
  if (relationship.lookingFor) {
    modernPurpose = `In this lifetime, you're drawn to ${relationship.lookingFor} because it represents the fulfillment of what you were building together in that past existence.`;
  }
  
  // Values connection to past life
  let valuesContinuation = '';
  if (personality.values && personality.values.length > 0) {
    valuesContinuation = `Your current values of ${personality.values.slice(0, 2).join(' and ')} were also central to your shared mission in that previous lifetime.`;
  }
  
  return `In a past life glimpse, you appear as ${historicalContext}, connected by ${lifeTheme}. Your bond was forged through ${unfinishedBusiness}, creating a soul contract that extends into this lifetime.

${culturalEcho}

The familiarity you'll feel upon meeting stems from this ancient recognition - your souls remembering not just each other, but the shared purpose that once united you. The challenges you faced together then have prepared you for the joy and fulfillment possible now.

${valuesContinuation}

${modernPurpose}

This lifetime offers you the opportunity for ${currentLifeLessons}. The deep understanding and instant comfort you'll experience together is your souls saying, "Ah, there you are. Now we can finish what we started."

Trust the déjà vu moments and the feeling that you've loved this person before - because in the truest sense, you have.`;
}

export async function generateProfileText({ quiz, tier, addons }) {
  // Extract detailed user data for personalization
  const user = quiz.user || {};
  const birth = quiz.birth || {};
  const appearance = quiz.appearance || {};
  const personality = quiz.personality || {};
  const relationship = quiz.relationship || {};
  const preferences = quiz.preferences || {};
  
  // Calculate numerology from birth date
  const numerologyInfo = birth.date ? calculateNumerology(birth.date) : null;
  
  // Generate astrological insights from birth data
  const astroInsights = birth.zodiac ? generateAstrologicalInsights(birth) : null;
  
  // Personality analysis from sliders and values
  const personalityProfile = analyzePersonalityProfile(personality);
  
  // Love language priorities
  const loveLangPriorities = analyzeLoveLanguages(personality.loveLanguages || {});

	const prompt = `You are "Soulmate Sketch" AI. Create a hyper-personalized soulmate profile using the user's detailed quiz responses. This must feel uniquely crafted for them, incorporating their specific preferences, personality traits, and cosmic data.

PERSONALIZATION REQUIREMENTS:
- Use their exact appearance preferences and personality traits
- Reflect their zodiac sign (${birth.zodiac || 'not provided'}) and birth insights
- Incorporate their love language preferences: ${loveLangPriorities}
- Consider their relationship must-haves: ${(relationship.mustHaves || []).join(', ') || 'not specified'}
- Factor in their deal-breakers: ${relationship.dealBreakers || 'not specified'}
- Reference their cultural resonance: ${appearance.culturalResonance || 'not specified'}
- Consider their location: ${user.country || 'not specified'}
- Age preferences: ${user.ageRange || 'not specified'}

PERSONALITY ANALYSIS:
${personalityProfile}

${numerologyInfo ? `NUMEROLOGY INSIGHTS:
Life Path: ${numerologyInfo.lifePath}
Soul Urge: ${numerologyInfo.soulUrge}
Expression: ${numerologyInfo.expression}
Compatibility Notes: ${numerologyInfo.compatibility}` : ''}

${astroInsights ? `ASTROLOGICAL FOUNDATION:
${astroInsights}` : ''}

Required sections (use these headings exactly):
- Overview (mention specific traits that align with their personality sliders and values)
- Personality & Vibe (incorporate their introvert/extrovert level, grounded/adventurous, analytical/creative scores)
- Attachment Style & Love Languages (prioritize their top love languages: ${loveLangPriorities})
- First Meeting Scenario (consider their personality type and preferences)
- What They're Looking For Now (reference their relationship.lookingFor: ${relationship.lookingFor || 'not specified'})
- Numerology/Astro Notes (use actual birth data if provided)

${tier === 'plus' || tier === 'premium' ? `
PLUS TIER ADDITIONS - Add these sections:
- Location Insights (based on their country: ${user.country}, timezone: ${user.timezone}, and cosmic alignment)
- Enhanced Astrological Analysis (deeper analysis using birth date: ${birth.date}, time: ${birth.time}, location: ${birth.city})
` : ''}

${tier === 'premium' ? `
PREMIUM TIER ADDITIONS - Add these sections:
- Full Astrological AI Analysis (comprehensive birth chart analysis using date: ${birth.date}, time: ${birth.time}, location: ${birth.city})
- Personal Relationship Strategy Guide (actionable steps based on their personality profile and love languages)
- Spiritual Growth & Preparation (customized to their zodiac sign and personality traits)
- Cosmic Timing & Manifestation (specific to their birth chart and current astrological transits)
` : ''}

Tone: warm, contemporary, romantic-but-grounded. Output plain text (no markdown symbols like # or *).

CRITICAL: Make this feel like it was written specifically for this person. Use their data points naturally throughout.

Length: Basic ~500-650 words, Plus ~700-900 words, Premium ~1000-1300+ words.

Complete User Data:
${JSON.stringify(quiz, null, 2)}

Tier: ${tier}
Add-ons: ${JSON.stringify(addons)}`;
  if (!openai) {
    return `Name: Aiden (or similar)\n\nEssence: Warm, grounded, quietly confident. Likely to notice little details about you and make you feel safe to be fully yourself.\n\nAttachment & Love: Secure leaning. Gives reassurance without being overbearing. Primary love languages: Quality Time and Words of Affirmation.\n\nHow you meet: A calm setting where conversation flows—think a cozy cafe on a rainy day, a local bookstore aisle, or a friend’s intimate gathering. You’ll feel a sense of instant familiarity.\n\nRight now: Looking for a relationship that feels like a deep exhale—steady, playful, and honest. Values consistency, humor, and shared little rituals.\n\nAstro vibes (light): Complimentary energy balance with you (yin/yang). Numerology suggests a 2 or 6 life-path resonance—cooperation, care, and home-building.\n\nDisclaimer: This is an inspirational guide for reflection, not a prediction.`;
  }
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
				{ role: 'system', content: 'You write beautiful, clear, uplifting soulmate reports with ethical, non-deterministic framing and sectioned formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    });
    return resp.choices[0].message.content;
  } catch (err) {
    console.error('Text generation failed, using fallback:', err?.message || err);
    return `Name: Aiden (or similar)\n\nEssence: Warm, grounded, quietly confident. Likely to notice little details about you and make you feel safe to be fully yourself.\n\nAttachment & Love: Secure leaning. Gives reassurance without being overbearing. Primary love languages: Quality Time and Words of Affirmation.\n\nHow you meet: A calm setting where conversation flows—think a cozy cafe on a rainy day, a local bookstore aisle, or a friend’s intimate gathering. You’ll feel a sense of instant familiarity.\n\nRight now: Looking for a relationship that feels like a deep exhale—steady, playful, and honest. Values consistency, humor, and shared little rituals.\n\nAstro vibes (light): Complimentary energy balance with you (yin/yang). Numerology suggests a 2 or 6 life-path resonance—cooperation, care, and home-building.\n\nDisclaimer: This is an inspirational guide for reflection, not a prediction.`;
  }
}

export async function generateImage({ style, quiz, addons = [] }) {
  // Extract detailed appearance data from quiz
  const user = quiz.user || {};
  const appearance = quiz.appearance || {};
  const personality = quiz.personality || {};
  const birth = quiz.birth || {};
  const preferences = quiz.preferences || {};
  
  // Determine gender based on user preference
  const attractedTo = user.attractedTo || quiz.interest;
  let gender = 'adult person';
  if (attractedTo === 'men' || attractedTo === 'male') gender = 'male adult';
  else if (attractedTo === 'women' || attractedTo === 'female') gender = 'female adult';
  
  // Build comprehensive appearance description from quiz data
  const appearanceDetails = buildAppearanceDescription(appearance);
  const personalityVibes = buildPersonalityVibes(personality);
  const culturalContext = appearance.culturalResonance ? `with ${appearance.culturalResonance} cultural aesthetic` : '';
  const zodiacEnergy = birth.zodiac ? getZodiacVisualEnergy(birth.zodiac) : '';
  
  const styleMap = {
		realistic: 'hyper-realistic portrait photography, natural skin texture, studio-grade lighting, 85mm lens, shallow depth of field, precise color grading',
		'pencil-realistic': 'hyper-realistic portrait photography with subtle artistic enhancement, natural skin texture, studio-grade lighting, 85mm lens',
		ethereal: 'ethereal but realistic portrait, soft glow, celestial accents, pastel tones, natural skin texture, subtle bokeh',
		anime: 'anime style character portrait, clean lines, studio quality, detailed eyes',
		mystical: 'mystical but realistic portrait, arcane accents, cinematic light, painterly color grading'
  };
	const stylePrompt = styleMap[style] || styleMap['realistic'];
	
	// Build setting based on personality and preferences
	const setting = buildSceneDescription(personality, preferences);
	
	// Add-on visual enhancements
	const auraHint = (Array.isArray(addons) && addons.includes('aura')) || preferences.addons?.colorUpgrade ? 
	  `Add a very subtle, realistic aura-like rim light in ${preferences.auraPalette || 'warm golden'} tones around the hair/shoulders (barely noticeable, tasteful).` : '';
	const twinFlameHint = Array.isArray(addons) && addons.includes('twin_flame') ? 
	  'Include a faint twin-light effect or mirrored highlight in the background that gently suggests duality (keep it photographic and unobtrusive).' : '';
	
	const basePrompt = `Create a hyper-realistic portrait of a ${gender} as the user's ideal soulmate, incorporating their detailed preferences:

APPEARANCE SPECIFICATIONS:
${appearanceDetails}
${culturalContext}

PERSONALITY ENERGY:
${personalityVibes}
${zodiacEnergy}

SCENE & COMPOSITION:
${setting}
- Composition: waist-up portrait, cinematic framing, soft depth of field, gentle rim light
- Lighting: soft natural or studio key light, flattering and warm
- Camera: 85mm portrait lens look, f/1.8 depth of field, high dynamic range, professional color grading

TECHNICAL REQUIREMENTS:
- Hyper-realism: photorealistic skin with natural texture, pores, flyaway hairs, realistic eyes with catchlights
- Natural beauty: symmetrical features, flattering angles, genuine warmth and approachability  
- Professional quality: studio-grade lighting, precise color balance, sharp focus on eyes
- Skin rendering: natural subsurface scattering, appropriate skin tone with realistic variation
- Hair detail: individual strands, natural movement, realistic texture and shine
- Expression: warm, inviting smile or gentle expression that conveys connection

${auraHint} ${twinFlameHint}

STYLE TREATMENT:
${stylePrompt}

Strictly avoid: cartoonish looks, plastic skin, heavy airbrushing, distorted anatomy, exaggerated features, fantasy elements, minors, weapons, text overlays, logos, watermarks, signatures, uncanny valley effects.`;
  let buffer;
  if (!openai) {
    // Fallback: generate a soft gradient placeholder with text
    const svg = Buffer.from(
      `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#FCE4EC"/>
            <stop offset="100%" stop-color="#E1BEE7"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g)"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="48" font-family="Georgia, serif" fill="#7B1FA2">Soulmate Sketch</text>
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-size="28" font-family="Georgia, serif" fill="#AD1457">Preview Image</text>
      </svg>`
    );
    buffer = await sharp(svg).png().toBuffer();
  } else {
    try {
      const image = await openai.images.generate({
        model: 'dall-e-3',
        prompt: basePrompt,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural'
      });
      const imageUrl = image.data[0].url;
      // Download the image from URL since DALL-E 3 returns URL not base64
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to download generated image');
      buffer = Buffer.from(await response.arrayBuffer());
    } catch (err) {
      console.error('Image generation failed, using placeholder:', err?.message || err);
      const svg = Buffer.from(
        `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#FCE4EC"/>
              <stop offset="100%" stop-color="#E1BEE7"/>
            </linearGradient>
          </defs>
          <rect width="1024" height="1024" fill="url(#g)"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="48" font-family="Georgia, serif" fill="#7B1FA2">Soulmate Sketch</text>
          <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-size="28" font-family="Georgia, serif" fill="#AD1457">Preview Image</text>
        </svg>`
      );
      buffer = await sharp(svg).png().toBuffer();
    }
  }
  const outDir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `result_${Date.now()}.png`);
  await fs.promises.writeFile(filePath, buffer);
  // create social share variant 1080x1920
  const sharePath = filePath.replace('.png', '_story.png');
  await sharp(buffer).resize(1080, 1920, { fit: 'cover' }).toFile(sharePath);
  return { filePath, sharePath };
}

export async function generatePdf({ text, imagePath, outPath, addons = [] }) {
	const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

	// Cover page
	doc.addPage({ size: 'LETTER', margins: { top: 56, left: 56, right: 56, bottom: 56 } });
	// Title badge
	doc.roundedRect(180, 60, 255, 28, 14).fillOpacity(0.06).fill('#E91E63').fillOpacity(1);
	doc.fontSize(10).fillColor('#E91E63').font('Times-Bold').text('Soulmate Sketch • Personal Report', 190, 67);
	// Main title
	doc.moveDown(2);
	doc.fontSize(30).fillColor('#000').font('Times-Bold').text('Your Soulmate Sketch', { align: 'center' });
	if (imagePath && fs.existsSync(imagePath)) {
		doc.moveDown();
		doc.image(imagePath, { fit: [480, 480], align: 'center', valign: 'center' });
	}
	doc.moveDown(0.5);
	doc.fontSize(11).fillColor('#666').font('Times-Roman').text('Prepared with care by Soulmate Sketch', { align: 'center' });

	// Report page
	doc.addPage({ size: 'LETTER', margins: { top: 56, left: 56, right: 56, bottom: 56 } });
	// Section header style
	const writeSection = (heading, body) => {
		if (!body) return;
		doc.moveDown(0.6);
		doc.fontSize(14).fillColor('#2D2240').font('Times-Bold').text(heading);
		doc.moveDown(0.2);
		doc.fontSize(12).fillColor('#111').font('Times-Roman').text(body, { align: 'left' });
	};

	// Split generated text by our requested headings if present
	const sections = {
		Overview: '',
		'Personality & Vibe': '',
		'Attachment Style & Love Languages': '',
		'First Meeting Scenario': '',
		"What They're Looking For Now": '',
		'Numerology/Astro Notes': '',
		// Plus tier sections
		'Location Insights': '',
		'Enhanced Astrological Analysis': '',
		// Premium tier sections
		'Full Astrological AI Analysis': '',
		'Personal Relationship Strategy Guide': '',
		'Spiritual Growth & Preparation': '',
		'Cosmic Timing & Manifestation': ''
	};
	const lines = String(text || '').split(/\r?\n/);
	let current = 'Overview';
	for (const line of lines) {
		const trimmed = line.trim();
		if (sections.hasOwnProperty(trimmed)) { current = trimmed; continue; }
		if (!sections[current]) sections[current] = trimmed; else sections[current] += (trimmed ? ('\n' + trimmed) : '');
	}

	writeSection('Overview', sections['Overview'] || text);
	writeSection('Personality & Vibe', sections['Personality & Vibe']);
	writeSection('Attachment Style & Love Languages', sections['Attachment Style & Love Languages']);
	writeSection('First Meeting Scenario', sections['First Meeting Scenario']);
	writeSection("What They're Looking For Now", sections["What They're Looking For Now"]);
	writeSection('Numerology/Astro Notes', sections['Numerology/Astro Notes']);

	// Plus tier sections
	if (sections['Location Insights']) {
		writeSection('Location Insights', sections['Location Insights']);
	}
	if (sections['Enhanced Astrological Analysis']) {
		writeSection('Enhanced Astrological Analysis', sections['Enhanced Astrological Analysis']);
	}

	// Premium tier sections  
	if (sections['Full Astrological AI Analysis']) {
		writeSection('Full Astrological AI Analysis', sections['Full Astrological AI Analysis']);
	}
	if (sections['Personal Relationship Strategy Guide']) {
		writeSection('Personal Relationship Strategy Guide', sections['Personal Relationship Strategy Guide']);
	}
	if (sections['Spiritual Growth & Preparation']) {
		writeSection('Spiritual Growth & Preparation', sections['Spiritual Growth & Preparation']);
	}
	if (sections['Cosmic Timing & Manifestation']) {
		writeSection('Cosmic Timing & Manifestation', sections['Cosmic Timing & Manifestation']);
	}

	// Enhanced personalized add-on sections
	if (Array.isArray(addons) && addons.includes('aura')) {
		const auraContent = generatePersonalizedAuraReading(quiz);
		writeSection('Aura Reading', auraContent);
	}
	if (Array.isArray(addons) && addons.includes('twin_flame')) {
		const twinFlameContent = generatePersonalizedTwinFlameInsight(quiz);
		writeSection('Twin Flame Insight', twinFlameContent);
	}
	if (Array.isArray(addons) && addons.includes('past_life')) {
		const pastLifeContent = generatePersonalizedPastLifeGlimpse(quiz);
		writeSection('Past Life Glimpse', pastLifeContent);
	}

  // Disclaimer
	doc.moveDown(1);
	doc.fontSize(9).fillColor('#666').text('This experience is for inspiration and reflection. It does not promise outcomes or provide medical or professional advice.', { align: 'left' });

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
}
