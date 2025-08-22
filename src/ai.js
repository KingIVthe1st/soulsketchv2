import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

const hasOpenAIKey = Boolean(
  process.env.OPENAI_API_KEY && 
  process.env.OPENAI_API_KEY !== 'sk-replace-me' && 
  process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here' &&
  process.env.OPENAI_API_KEY.startsWith('sk-')
);
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

function getZodiacCompatibility(zodiac) {
  if (!zodiac) return 'earth or water energy';
  
  const compatibility = {
    'aries': 'Leo or Sagittarius fire energy, or balancing Libra air energy',
    'taurus': 'Virgo or Capricorn earth energy, or passionate Scorpio intensity',
    'gemini': 'Libra or Aquarius air energy, or adventurous Sagittarius spirit',
    'cancer': 'Scorpio or Pisces water energy, or grounding Taurus stability',
    'leo': 'Aries or Sagittarius fire energy, or harmonizing Gemini intellect',
    'virgo': 'Taurus or Capricorn earth energy, or intuitive Cancer warmth',
    'libra': 'Gemini or Aquarius air energy, or confident Leo radiance',
    'scorpio': 'Cancer or Pisces water energy, or stable Taurus grounding',
    'sagittarius': 'Aries or Leo fire energy, or communicative Gemini wit',
    'capricorn': 'Taurus or Virgo earth energy, or nurturing Cancer care',
    'aquarius': 'Gemini or Libra air energy, or bold Leo creativity',
    'pisces': 'Cancer or Scorpio water energy, or practical Virgo support'
  };
  
  return compatibility[zodiac.toLowerCase()] || 'complementary earth or water energy';
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

	const prompt = `You are an advanced AI combining the wisdom of master astrologers, numerologists, and relationship experts. Create a deeply personalized soulmate profile that feels like divine guidance tailored specifically for this person.

🌟 COSMIC PROFILE DATA:
${numerologyInfo ? `
📊 NUMEROLOGY FOUNDATION:
• Life Path Number: ${numerologyInfo.lifePath} - ${numerologyInfo.compatibility}
• Soul Urge Number: ${numerologyInfo.soulUrge} - Core desires and motivations
• Expression Number: ${numerologyInfo.expression} - How they naturally express themselves
• Compatibility Pattern: ${numerologyInfo.compatibility}` : ''}

${astroInsights ? `
🌙 ASTROLOGICAL ESSENCE:
• Sun Sign: ${birth.zodiac || 'Unknown'} - ${astroInsights}
• Birth Date: ${birth.date || 'Not provided'}
• Birth Time: ${birth.time || 'Unknown'} 
• Birth Location: ${birth.city || 'Unknown'}
• Current Cosmic Weather: Analyze current planetary transits affecting love and relationships` : ''}

💫 DEEP PERSONALITY MATRIX:
${personalityProfile}
• Love Languages Priority: ${loveLangPriorities}
• Core Values: ${(personality.values || []).join(', ') || 'Connection, growth, authenticity'}
• Relationship Must-Haves: ${(relationship.mustHaves || []).join(', ') || 'Understanding, respect, shared growth'}
• Deal-Breakers: ${relationship.dealBreakers || 'Dishonesty, lack of emotional availability'}
• Seeking: ${relationship.lookingFor || 'Deep, meaningful connection'}

🎯 PERSONAL PREFERENCES:
• Age Range: ${user.ageRange || 'Open'}
• Location: ${user.country || 'Global'} ${user.timezone ? `(${user.timezone})` : ''}
• Cultural Resonance: ${appearance.culturalResonance || 'Universal connection'}
• Attracted To: ${user.attractedTo || 'Deep souls'}

CREATE SECTIONS (use exact headings):

1. **Overview**
   - Open with their specific numerological signature and astrological essence
   - Reference their exact personality scores and what this reveals about their soulmate
   - Mention specific details that only apply to them

2. **Personality & Vibe**
   - Detail how their introvert/extrovert score (${personality.introvertExtrovert || 50}/100) attracts specific energy
   - Analyze their grounded/adventurous nature (${personality.groundedAdventurous || 50}/100) 
   - Explore their analytical/creative balance (${personality.analyticalCreative || 50}/100)
   - Connect this to their zodiac energy and life path number

3. **Attachment Style & Love Languages**
   - Focus on their top love languages: ${loveLangPriorities}
   - Connect to their numerology and how their soulmate will naturally speak these languages
   - Specific attachment patterns based on their astrological placements

4. **First Meeting Scenario**
   - Paint a vivid scene based on their personality type and preferences
   - Include cosmic timing and numerological significance of when/how they'll meet
   - Reference their location and cultural context

5. **What They're Looking For Now**
   - Deep dive into their stated desires: ${relationship.lookingFor || 'meaningful connection'}
   - Connect to current astrological transits and life path lessons
   - Address their specific must-haves and how soulmate embodies these

6. **Advanced Numerology & Astrology**
   - Detailed compatibility analysis using their birth numbers
   - Current planetary influences on their love life
   - Karmic lessons and soul growth through partnership

${tier === 'plus' || tier === 'premium' ? `
🌍 PLUS TIER SECTIONS:

7. **Location & Cosmic Alignment**
   - How their location (${user.country}) affects their romantic energy
   - Timezone and cosmic timing for optimal connection
   - Geographic astrology and where their soulmate may be located

8. **Enhanced Astrological Analysis**
   - Birth chart synthesis if data available
   - Venus and Mars placement interpretation for love style
   - 7th house analysis for partnership themes
   - Current transits affecting relationships` : ''}

${tier === 'premium' ? `
👑 PREMIUM TIER SECTIONS:

9. **Complete Birth Chart Analysis**
   - Full natal chart interpretation for love and relationships
   - Composite chart prediction with soulmate
   - Progressed chart timing for when love arrives
   - Synastry patterns to look for

10. **Personal Relationship Strategy Guide**
    - Specific action steps based on their chart and numbers
    - How to attract their soulmate using their natural magnetism
    - Timing guidance for love manifestation
    - Red flags and green flags personalized to their needs

11. **Spiritual Growth & Soul Preparation**
    - Soul lessons needed before meeting "the one"
    - Chakra and energy work specific to their profile
    - Past life patterns affecting current relationships
    - Spiritual practices for love alignment

12. **Cosmic Timing & Manifestation**
    - Optimal timing windows for love based on their chart
    - Moon cycle manifestation practices personalized for them
    - Specific affirmations and visualization techniques
    - Crystal and color recommendations for their energy signature` : ''}

📝 WRITING REQUIREMENTS:
- Write as if you've known them for years and can see their soul
- Use warm, mystical but grounded language
- Reference specific numbers, dates, and personality scores naturally
- Make every sentence feel personally relevant
- Include actionable insights they can use immediately
- Balance spiritual wisdom with practical relationship advice

LENGTH TARGETS:
- Basic: 700-900 words with deep personalization
- Plus: 1000-1300 words with location and enhanced astrology  
- Premium: 1500-2000+ words with complete analysis and guidance

🔮 COMPLETE SOUL DATA:
${JSON.stringify(quiz, null, 2)}

Service Level: ${tier}
Enhancement Add-ons: ${JSON.stringify(addons)}`;
  if (!openai) {
    // Enhanced demo content based on the user's actual quiz data
    const personalizedDemo = `**Overview**
Your soulmate carries an energy that perfectly complements your unique personality profile. Based on your responses, they embody the balance between ${personality.introvertExtrovert < 50 ? 'quiet depth and social warmth' : 'vibrant energy and thoughtful moments'}.

**Personality & Vibe**  
They naturally ${personality.groundedAdventurous < 50 ? 'bring stability and security while encouraging your adventurous spirit' : 'match your love for exploration while providing a grounding presence'}. Their ${personality.analyticalCreative < 50 ? 'creative soul will inspire your artistic side' : 'logical mind will appreciate your analytical nature'}, creating perfect intellectual harmony.

**Attachment Style & Love Languages**
Primary love languages: ${loveLangPriorities}. They express love through consistent actions and ${personality.introvertExtrovert < 50 ? 'intimate conversations that make you feel truly understood' : 'enthusiastic support for your goals and dreams'}.

**First Meeting Scenario**
You'll likely meet in ${personality.introvertExtrovert < 50 ? 'an intimate setting - perhaps a quiet bookstore, cozy cafe, or through mutual friends at a small gathering' : 'a social environment where your energies naturally align - maybe at a community event, networking function, or group activity'}. The connection will feel immediate and comfortable.

**What They're Looking For Now**
Currently seeking: ${relationship.lookingFor || 'a deep, meaningful connection'}. They value ${(personality.values || ['authenticity', 'growth', 'connection']).slice(0, 2).join(' and ')}, making them perfectly aligned with your relationship vision.

**Advanced Numerology & Astrology**
${birth.zodiac ? `Your ${birth.zodiac} energy` : 'Your cosmic signature'} attracts someone with complementary ${birth.zodiac ? getZodiacCompatibility(birth.zodiac) : 'earth or water energy'} who brings balance to your life path.

⚠️ **FALLBACK MODE**: OpenAI API key not detected. This is enhanced demo content showing the system's capabilities. The production environment should have a valid API key configured for full AI-generated content.`;
    
    return personalizedDemo;
  }
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
				{ role: 'system', content: 'You are a world-class astrologer, numerologist, and relationship advisor. Create deeply personalized, spiritually insightful soulmate reports that feel like they were written by someone who truly knows this person. Use their specific birth data, personality traits, and preferences to craft reports that feel magical yet grounded. Every detail should feel personally relevant and meaningful.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 4000,
    });
    return resp.choices[0].message.content;
  } catch (err) {
    console.error('Text generation failed, using fallback:', err?.message || err);
    // Return the same enhanced demo content if API call fails
    const personalizedDemo = `**Overview**
Your soulmate carries an energy that perfectly complements your unique personality profile. Based on your responses, they embody the balance between ${personality.introvertExtrovert < 50 ? 'quiet depth and social warmth' : 'vibrant energy and thoughtful moments'}.

**Personality & Vibe**  
They naturally ${personality.groundedAdventurous < 50 ? 'bring stability and security while encouraging your adventurous spirit' : 'match your love for exploration while providing a grounding presence'}. Their ${personality.analyticalCreative < 50 ? 'creative soul will inspire your artistic side' : 'logical mind will appreciate your analytical nature'}, creating perfect intellectual harmony.

**Attachment Style & Love Languages**
Primary love languages: ${loveLangPriorities}. They express love through consistent actions and ${personality.introvertExtrovert < 50 ? 'intimate conversations that make you feel truly understood' : 'enthusiastic support for your goals and dreams'}.

**First Meeting Scenario**
You'll likely meet in ${personality.introvertExtrovert < 50 ? 'an intimate setting - perhaps a quiet bookstore, cozy cafe, or through mutual friends at a small gathering' : 'a social environment where your energies naturally align - maybe at a community event, networking function, or group activity'}. The connection will feel immediate and comfortable.

**What They're Looking For Now**
Currently seeking: ${relationship.lookingFor || 'a deep, meaningful connection'}. They value ${(personality.values || ['authenticity', 'growth', 'connection']).slice(0, 2).join(' and ')}, making them perfectly aligned with your relationship vision.

**Advanced Numerology & Astrology**
${birth.zodiac ? `Your ${birth.zodiac} energy` : 'Your cosmic signature'} attracts someone with complementary ${birth.zodiac ? getZodiacCompatibility(birth.zodiac) : 'earth or water energy'} who brings balance to your life path.

⚠️ **API ERROR**: AI generation encountered an error (${err?.message || 'Unknown error'}). Using fallback content. Please check server logs for details.`;
    
    return personalizedDemo;
  }
}

export async function generateImage({ style, quiz, addons = [] }) {
  try {
    console.log('🖼️ Starting enhanced AI soulmate image generation...');
    
    // Extract comprehensive user data
    const user = quiz?.user || {};
    const personality = quiz?.personality || {};
    const relationship = quiz?.relationship || {};
    const birth = quiz?.birth || {};
    const attractedTo = user.attractedTo || quiz?.interest || 'women';
    
    // Setup file paths
    const outDir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `result_${Date.now()}.png`);
    
    // Debug OpenAI availability
    console.log('🔍 OpenAI Debug Info:');
    console.log(`  - hasOpenAIKey: ${hasOpenAIKey}`);
    console.log(`  - openai instance: ${openai ? 'initialized' : 'null'}`);
    console.log(`  - API Key prefix: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set'}`);
    console.log(`  - API Key length: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0}`);
    console.log(`  - Node version: ${process.version}`);
    console.log(`  - fetch available: ${typeof fetch !== 'undefined'}`);
    
    if (!hasOpenAIKey) {
      console.error('❌ No valid OpenAI API key detected - this should not happen in production');
      throw new Error('OpenAI API key not properly configured');
    }
    
    if (!openai) {
      console.error('❌ OpenAI instance not initialized despite having valid key');
      throw new Error('OpenAI instance initialization failed');
    }
    
    if (openai) {
      try {
        console.log('🤖 Building comprehensive DALL-E prompt...');
        
        // ENHANCED PROMPT GENERATION
        const prompt = buildComprehensiveSoulmatePrompt({
          attractedTo,
          user,
          personality,
          relationship,
          birth,
          addons
        });
        
        console.log(`🎨 Enhanced prompt: ${prompt.substring(0, 200)}...`);
        
        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural'
        });
        
        console.log('✅ DALL-E API call successful, downloading image...');
        const imageUrl = image.data[0].url;
        console.log(`📥 Image URL received: ${imageUrl.substring(0, 50)}...`);
        
        // Check if fetch is available
        if (typeof fetch === 'undefined') {
          throw new Error('fetch is not available in this environment');
        }
        
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to download generated image: ${response.status}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.promises.writeFile(filePath, buffer);
        console.log(`💾 Enhanced soulmate image saved to: ${filePath}`);
        
        // Create social share variant
        const sharePath = filePath.replace('.png', '_story.png');
        await sharp(buffer).resize(1080, 1920, { fit: 'cover' }).toFile(sharePath);
        console.log(`📱 Social share variant created: ${sharePath}`);
        
        console.log('✅ Enhanced DALL-E soulmate generation completed successfully');
        return { 
          success: true,
          method: 'enhanced-dall-e',
          filePath, 
          sharePath 
        };
      } catch (dallError) {
        console.error('❌ Enhanced DALL-E generation failed:', dallError.message);
        console.error('❌ Full error:', dallError);
        // Fall through to placeholder
      }
    } else {
      console.log('⚠️ OpenAI not available, using placeholder generation');
    }
    
    // Generate enhanced placeholder
    console.log('📝 Generating enhanced placeholder image...');
    const genderText = attractedTo === 'men' || attractedTo === 'male' ? 'Your Soulmate (Male)' : 
                      attractedTo === 'women' || attractedTo === 'female' ? 'Your Soulmate (Female)' :
                      'Your Soulmate';
    
    const svg = Buffer.from(
      `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFE0F0"/>
            <stop offset="50%" stop-color="#F8E8FF"/>
            <stop offset="100%" stop-color="#E8F0FF"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g)"/>
        <circle cx="512" cy="400" r="150" fill="#fff" opacity="0.3"/>
        <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-size="28" font-family="Georgia, serif" fill="#7B1FA2" font-weight="bold">${genderText}</text>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="18" font-family="Georgia, serif" fill="#AD1457">Enhanced AI Portrait</text>
        <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#666">✨ Personalized & Attractive</text>
        <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#888">Photo-realistic • Age-optimized • Context-aware</text>
      </svg>`
    );
    
    const buffer = await sharp(svg).png().toBuffer();
    await fs.promises.writeFile(filePath, buffer);
    
    // Create social share variant
    const sharePath = filePath.replace('.png', '_story.png');
    await sharp(buffer).resize(1080, 1920, { fit: 'cover' }).toFile(sharePath);
    
    console.log('✅ Enhanced placeholder image generated successfully');
    return { 
      success: true,
      method: 'enhanced-placeholder',
      filePath, 
      sharePath 
    };
  } catch (error) {
    console.error('❌ generateImage failed completely:', error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

// COMPREHENSIVE SOULMATE PROMPT BUILDER
function buildComprehensiveSoulmatePrompt({ attractedTo, user, personality, relationship, birth, addons }) {
  // GENDER & AGE CALCULATION
  let baseGender = 'person';
  if (attractedTo === 'men' || attractedTo === 'male') baseGender = 'man';
  else if (attractedTo === 'women' || attractedTo === 'female') baseGender = 'woman';
  
  // CALCULATE 5 YEARS YOUNGER AGE
  const userAge = parseInt(user.age) || 30;
  const soulmateAge = Math.max(18, userAge - 5); // Ensure minimum age of 18
  console.log(`👤 User age: ${userAge}, Soulmate age: ${soulmateAge}`);
  
  // AGE-APPROPRIATE DESCRIPTOR
  let ageDescriptor = '';
  if (soulmateAge <= 25) ageDescriptor = 'young adult';
  else if (soulmateAge <= 35) ageDescriptor = 'early thirties';
  else if (soulmateAge <= 45) ageDescriptor = 'mid thirties to early forties';
  else ageDescriptor = 'mature adult';
  
  // PERSONALITY-BASED PHYSICAL TRAITS
  const physicalTraits = buildPhysicalTraits(personality, birth);
  
  // BACKGROUND LOCATION BASED ON PERSONALITY & INTERESTS
  const background = buildIntelligentBackground(personality, relationship, birth, user);
  
  // ATTRACTIVENESS ENHANCEMENT
  const attractivenessTerms = [
    'extremely attractive', 'strikingly beautiful', 'captivating features',
    'magnetic presence', 'naturally gorgeous', 'radiant beauty',
    'alluring charm', 'stunning appearance', 'mesmerizing eyes'
  ];
  const attractiveness = attractivenessTerms[Math.floor(Math.random() * attractivenessTerms.length)];
  
  // COMPREHENSIVE PROMPT CONSTRUCTION
  const prompt = `A photo-realistic, high-definition portrait of an ${attractiveness} ${ageDescriptor} ${baseGender} (age ${soulmateAge}). ${physicalTraits.appearance} Professional photography quality with natural lighting and perfect clarity. 

SETTING: ${background.description} ${background.details}

STYLE: Ultra-realistic human photography, magazine quality, perfect focus, natural skin texture, authentic lighting. Shot with professional camera equipment, shallow depth of field, ${background.lighting}

EXPRESSION: ${physicalTraits.expression} Eyes that convey ${physicalTraits.personality}, suggesting someone who values ${(personality.values || ['authenticity', 'connection']).slice(0, 2).join(' and ')}.

QUALITY: 8K resolution, photojournalistic style, completely realistic human features, no artificial or cartoon elements, natural proportions, authentic human skin and hair texture.`;

  console.log(`🎨 Generated comprehensive prompt (${prompt.length} chars)`);
  return prompt;
}

// BUILD PERSONALITY-BASED PHYSICAL TRAITS
function buildPhysicalTraits(personality, birth) {
  const traits = {
    appearance: '',
    expression: '',
    personality: ''
  };
  
  // PERSONALITY-DRIVEN APPEARANCE
  if (personality.introvertExtrovert) {
    if (personality.introvertExtrovert < 40) {
      traits.appearance += 'Gentle, thoughtful features with expressive, intelligent eyes. ';
      traits.expression = 'A soft, genuine smile with kind, contemplative eyes.';
      traits.personality = 'depth, authenticity, and quiet wisdom';
    } else if (personality.introvertExtrovert > 60) {
      traits.appearance += 'Bright, engaging features with warm, inviting eyes. ';
      traits.expression = 'A confident, radiant smile with energetic, friendly eyes.';
      traits.personality = 'warmth, enthusiasm, and social connection';
    } else {
      traits.appearance += 'Balanced, approachable features with versatile, understanding eyes. ';
      traits.expression = 'A natural, authentic smile with adaptable, empathetic eyes.';
      traits.personality = 'balance, understanding, and emotional intelligence';
    }
  }
  
  // ADVENTURE VS GROUNDED TRAITS
  if (personality.groundedAdventurous) {
    if (personality.groundedAdventurous < 40) {
      traits.appearance += 'Strong, reliable bone structure suggesting stability and dependability. ';
    } else if (personality.groundedAdventurous > 60) {
      traits.appearance += 'Dynamic, lively features with a hint of wanderlust in their expression. ';
    }
  }
  
  // CREATIVE VS ANALYTICAL TRAITS
  if (personality.analyticalCreative) {
    if (personality.analyticalCreative < 40) {
      traits.appearance += 'Artistic, expressive features with creative spark in their eyes. ';
    } else if (personality.analyticalCreative > 60) {
      traits.appearance += 'Sharp, intelligent features with analytical depth and clarity. ';
    }
  }
  
  // ZODIAC-INFLUENCED FEATURES (if available)
  if (birth.zodiac) {
    const zodiacTraits = getZodiacPhysicalTraits(birth.zodiac);
    traits.appearance += zodiacTraits + ' ';
  }
  
  return traits;
}

// BUILD INTELLIGENT BACKGROUND BASED ON COMPATIBILITY
function buildIntelligentBackground(personality, relationship, birth, user) {
  const backgrounds = [];
  
  // PERSONALITY-DRIVEN LOCATIONS
  if (personality.introvertExtrovert) {
    if (personality.introvertExtrovert < 40) {
      backgrounds.push(
        { location: 'cozy independent bookstore', details: 'surrounded by warm wood shelves and soft reading light', lighting: 'warm, golden hour lighting filtering through large windows' },
        { location: 'quiet art gallery', details: 'with elegant artwork and sophisticated ambiance', lighting: 'gallery spotlighting with soft shadows' },
        { location: 'peaceful library reading nook', details: 'with comfortable chairs and academic atmosphere', lighting: 'natural light from tall windows' },
        { location: 'intimate coffee shop', details: 'with vintage decor and intellectual atmosphere', lighting: 'warm, cozy cafe lighting' }
      );
    } else if (personality.introvertExtrovert > 60) {
      backgrounds.push(
        { location: 'vibrant community event', details: 'with people socializing in the background', lighting: 'bright, energetic natural lighting' },
        { location: 'lively farmers market', details: 'with colorful vendors and social activity', lighting: 'bright outdoor market lighting' },
        { location: 'popular outdoor cafe', details: 'with bustling street life and urban energy', lighting: 'dynamic city lighting with warm accents' },
        { location: 'networking event or conference', details: 'with professional, social atmosphere', lighting: 'modern venue lighting' }
      );
    } else {
      backgrounds.push(
        { location: 'modern coworking space', details: 'balancing social interaction with focused work', lighting: 'contemporary mixed lighting' },
        { location: 'outdoor park pavilion', details: 'combining nature with social gathering space', lighting: 'natural outdoor lighting with architectural elements' }
      );
    }
  }
  
  // ADVENTURE VS GROUNDED PREFERENCES
  if (personality.groundedAdventurous) {
    if (personality.groundedAdventurous < 40) {
      backgrounds.push(
        { location: 'established local restaurant', details: 'with warm, homey atmosphere and traditional charm', lighting: 'comfortable, familiar lighting' },
        { location: 'community garden', details: 'with growing plants and nurturing environment', lighting: 'soft natural light among greenery' },
        { location: 'home-style kitchen or dining room', details: 'suggesting domestic harmony and stability', lighting: 'warm, inviting home lighting' }
      );
    } else if (personality.groundedAdventurous > 60) {
      backgrounds.push(
        { location: 'outdoor adventure gear shop', details: 'with equipment for exploration and discovery', lighting: 'bright, adventure-ready lighting' },
        { location: 'scenic hiking trail overlook', details: 'with beautiful natural vista in background', lighting: 'golden hour mountain or nature lighting' },
        { location: 'travel-themed cafe', details: 'with maps and global decorations', lighting: 'inspired, wanderlust-friendly lighting' }
      );
    }
  }
  
  // CREATIVE VS ANALYTICAL ENVIRONMENTS
  if (personality.analyticalCreative) {
    if (personality.analyticalCreative < 40) {
      backgrounds.push(
        { location: 'artist studio or creative workspace', details: 'with artistic materials and inspiring creativity', lighting: 'artistic studio lighting with creative shadows' },
        { location: 'music venue or concert hall', details: 'suggesting artistic appreciation and creativity', lighting: 'performance venue ambiance' },
        { location: 'design studio or gallery', details: 'with modern creative energy and innovation', lighting: 'contemporary creative lighting' }
      );
    } else if (personality.analyticalCreative > 60) {
      backgrounds.push(
        { location: 'modern office or tech workspace', details: 'with clean lines and professional efficiency', lighting: 'bright, focused professional lighting' },
        { location: 'science museum or research facility', details: 'suggesting intellectual curiosity and analysis', lighting: 'clean, analytical lighting' },
        { location: 'university or academic setting', details: 'with scholarly atmosphere and learning environment', lighting: 'academic institutional lighting' }
      );
    }
  }
  
  // SELECT MOST APPROPRIATE BACKGROUND
  const selectedBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)] || {
    location: 'sophisticated modern cafe',
    details: 'with warm, inviting atmosphere and contemporary design',
    lighting: 'natural light with warm, flattering tones'
  };
  
  return {
    description: `Set in a ${selectedBackground.location},`,
    details: selectedBackground.details,
    lighting: selectedBackground.lighting
  };
}

// ZODIAC PHYSICAL TRAIT MAPPING
function getZodiacPhysicalTraits(zodiac) {
  const zodiacMap = {
    'Aries': 'Strong, confident features with dynamic energy',
    'Taurus': 'Serene, stable features with natural beauty',
    'Gemini': 'Expressive, animated features with intelligent sparkle',
    'Cancer': 'Nurturing, gentle features with emotional depth',
    'Leo': 'Radiant, commanding features with natural charisma',
    'Virgo': 'Refined, precise features with understated elegance',
    'Libra': 'Harmonious, balanced features with natural grace',
    'Scorpio': 'Intense, magnetic features with mysterious allure',
    'Sagittarius': 'Adventurous, optimistic features with worldly charm',
    'Capricorn': 'Distinguished, mature features with quiet authority',
    'Aquarius': 'Unique, innovative features with intellectual appeal',
    'Pisces': 'Dreamy, intuitive features with artistic sensitivity'
  };
  
  return zodiacMap[zodiac] || 'Harmonious, attractive features with inner wisdom';
}

// Generate location prediction based on numerology and astrology
function generateLocationPrediction(quiz) {
  const user = quiz.user || {};
  const birth = quiz.birth || {};
  const personality = quiz.personality || {};
  
  // Calculate numerology-based location insights
  const numerologyInfo = birth.date ? calculateNumerology(birth.date) : null;
  const lifePath = numerologyInfo?.lifePath || 5;
  
  // Location directions based on life path number
  const locationMap = {
    1: { direction: 'East or Northeast', type: 'urban centers', energy: 'dynamic business districts' },
    2: { direction: 'Southeast or South', type: 'community-focused areas', energy: 'cooperative environments' },
    3: { direction: 'West or Southwest', type: 'creative districts', energy: 'artistic communities' },
    4: { direction: 'North or Northwest', type: 'established neighborhoods', energy: 'stable, traditional areas' },
    5: { direction: 'Central or multiple directions', type: 'travel hubs', energy: 'cosmopolitan zones' },
    6: { direction: 'Southwest or West', type: 'family-oriented areas', energy: 'nurturing communities' },
    7: { direction: 'North or Northeast', type: 'educational centers', energy: 'intellectual environments' },
    8: { direction: 'Northwest or North', type: 'financial districts', energy: 'ambitious professional areas' },
    9: { direction: 'South or Southeast', type: 'diverse communities', energy: 'humanitarian organizations' },
    11: { direction: 'East or multiple directions', type: 'spiritual centers', energy: 'enlightened communities' },
    22: { direction: 'Northeast or East', type: 'development zones', energy: 'visionary projects' },
    33: { direction: 'Central or all directions', type: 'healing centers', energy: 'service-oriented areas' }
  };
  
  const location = locationMap[lifePath] || locationMap[5];
  
  // Astrological timing and location refinement
  let astroInfluence = '';
  if (birth.zodiac) {
    const zodiacLocations = {
      'aries': 'near sports facilities, gyms, or competitive venues',
      'taurus': 'in gardens, parks, or areas with natural beauty',
      'gemini': 'around libraries, schools, or communication hubs',
      'cancer': 'near water, homes, or family gathering places',
      'leo': 'in entertainment districts, theaters, or social venues',
      'virgo': 'around health centers, organized spaces, or service areas',
      'libra': 'in aesthetic areas, art galleries, or partnership-focused venues',
      'scorpio': 'near transformative spaces, research centers, or intense environments',
      'sagittarius': 'around universities, travel hubs, or international areas',
      'capricorn': 'in business districts, government areas, or achievement-focused zones',
      'aquarius': 'around innovative spaces, tech hubs, or humanitarian organizations',
      'pisces': 'near spiritual centers, water, or artistic communities'
    };
    astroInfluence = zodiacLocations[birth.zodiac.toLowerCase()] || '';
  }
  
  // Current location context
  let currentLocationContext = '';
  if (user.country) {
    currentLocationContext = `Given your current location in ${user.country}, `;
  }
  
  // Distance prediction based on personality
  const introvert = personality.introvertExtrovert || 50;
  const adventurous = personality.groundedAdventurous || 50;
  
  let distanceType = 'within your local area';
  if (adventurous > 70) {
    distanceType = 'potentially through travel or relocation';
  } else if (introvert < 30) {
    distanceType = 'through expanded social circles';
  }
  
  return `${currentLocationContext}your soulmate is most likely to be found in the ${location.direction} direction from your current position. Look for connections in ${location.type}, particularly ${astroInfluence || location.energy}.

The cosmic timing suggests meeting ${distanceType}. Your numerological signature (Life Path ${lifePath}) creates magnetic attraction in ${location.energy}, where your natural energy aligns with theirs.

Key locations to focus your attention: ${location.type} that embody ${location.energy}. Trust your intuition when visiting these spaces - you'll feel a heightened sense of possibility and connection.`;
}

export async function generatePdf({ text, imagePath, outPath, addons = [], quiz = {}, tier = 'basic' }) {
  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // Enhanced cover page with tier-specific styling
  doc.addPage({ size: 'LETTER', margins: { top: 56, left: 56, right: 56, bottom: 56 } });
  
  // Tier-specific header with gradient background
  const headerHeight = 120;
  doc.rect(0, 0, doc.page.width, headerHeight)
     .fillAndStroke(tier === 'premium' ? '#1A237E' : tier === 'plus' ? '#4A148C' : '#E91E63', '#FFF');
  
  // Tier badge with enhanced styling
  const tierColors = {
    'basic': { bg: '#E91E63', text: '#FFFFFF', label: '✨ BASIC EDITION' },
    'plus': { bg: '#4A148C', text: '#FFFFFF', label: '🌟 PLUS EDITION' },
    'premium': { bg: '#1A237E', text: '#FFFFFF', label: '👑 PREMIUM EDITION' }
  };
  
  const tierStyle = tierColors[tier] || tierColors.basic;
  doc.roundedRect(170, 25, 285, 32, 16)
     .fillOpacity(0.9)
     .fill(tierStyle.bg)
     .fillOpacity(1);
  
  doc.fontSize(12)
     .fillColor(tierStyle.text)
     .font('Helvetica-Bold')
     .text(tierStyle.label, 0, 35, { align: 'center' });
     
  doc.fontSize(10)
     .fillColor('#FFFFFF')
     .font('Helvetica')
     .text('Soulmate Sketch • Personal Report', 0, 52, { align: 'center' });

  // Main title with enhanced typography
  doc.moveDown(2);
  doc.fontSize(36)
     .fillColor('#2D2240')
     .font('Helvetica-Bold')
     .text('Your Soulmate Sketch', { align: 'center' });
     
  doc.fontSize(14)
     .fillColor('#666')
     .font('Helvetica')
     .text('A Personalized Spiritual Analysis', { align: 'center' });

  // Image with enhanced frame
  if (imagePath && fs.existsSync(imagePath)) {
    doc.moveDown(1.5);
    const imageSize = 320;
    const imageX = (doc.page.width - imageSize) / 2;
    const imageY = doc.y;
    
    // Add shadow effect
    doc.rect(imageX + 5, imageY + 5, imageSize, imageSize)
       .fillOpacity(0.1)
       .fill('#000')
       .fillOpacity(1);
    
    doc.image(imagePath, imageX, imageY, { width: imageSize, height: imageSize });
    
    // Enhanced frame with tier-specific accent
    doc.rect(imageX - 3, imageY - 3, imageSize + 6, imageSize + 6)
       .strokeColor(tierStyle.bg)
       .lineWidth(3)
       .stroke();
       
    doc.y = imageY + imageSize + 20;
  }

  // Enhanced footer with personalization
  const userName = quiz.user?.name || quiz.user?.email?.split('@')[0] || 'You';
  doc.fontSize(11)
     .fillColor('#888')
     .font('Helvetica')
     .text(`Prepared especially for ${userName}`, { align: 'center' });
     
  doc.fontSize(9)
     .fillColor('#AAA')
     .text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

  // Enhanced report page with professional layout
  doc.addPage({ size: 'LETTER', margins: { top: 56, left: 56, right: 56, bottom: 56 } });
  
  // Enhanced section writing function with better styling
  const writeSection = (heading, body, isSpecialSection = false) => {
    if (!body || body.trim() === '') return;
    
    // Check if we need a new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage({ size: 'LETTER', margins: { top: 56, left: 56, right: 56, bottom: 56 } });
    }
    
    doc.moveDown(0.8);
    
    // Enhanced section headers with icons and better typography
    const sectionIcons = {
      'Overview': '🌟',
      'Personality & Vibe': '✨',
      'Attachment Style & Love Languages': '💝',
      'First Meeting Scenario': '💫',
      "What They're Looking For Now": '🎯',
      'Numerology/Astro Notes': '🔮',
      'Soulmate Location Prediction': '🗺️',
      'Enhanced Astrological Analysis': '🌙',
      'Full Astrological AI Analysis': '⭐',
      'Personal Relationship Strategy Guide': '📋',
      'Spiritual Growth & Preparation': '🙏',
      'Cosmic Timing & Manifestation': '⏰'
    };
    
    const icon = sectionIcons[heading] || '💎';
    
    // Section header with enhanced styling
    if (isSpecialSection) {
      doc.rect(doc.x - 10, doc.y - 5, doc.page.width - 112, 28)
         .fillOpacity(0.05)
         .fill(tierStyle.bg)
         .fillOpacity(1);
    }
    
    doc.fontSize(16)
       .fillColor(isSpecialSection ? tierStyle.bg : '#2D2240')
       .font('Helvetica-Bold')
       .text(`${icon} ${heading}`, doc.x, doc.y + (isSpecialSection ? 5 : 0));
    
    doc.moveDown(0.4);
    
    // Section content with improved readability
    doc.fontSize(12)
       .fillColor('#111')
       .font('Helvetica')
       .text(body.trim(), {
         align: 'left',
         lineGap: 3,
         paragraphGap: 8
       });
  };

  // Parse and organize content sections
  const sections = {
    Overview: '',
    'Personality & Vibe': '',
    'Attachment Style & Love Languages': '',
    'First Meeting Scenario': '',
    "What They're Looking For Now": '',
    'Numerology/Astro Notes': '',
    'Location Insights': '',
    'Enhanced Astrological Analysis': '',
    'Full Astrological AI Analysis': '',
    'Personal Relationship Strategy Guide': '',
    'Spiritual Growth & Preparation': '',
    'Cosmic Timing & Manifestation': ''
  };
  
  const lines = String(text || '').split(/\r?\n/);
  let current = 'Overview';
  for (const line of lines) {
    const trimmed = line.trim();
    if (sections.hasOwnProperty(trimmed)) { 
      current = trimmed; 
      continue; 
    }
    if (!sections[current]) {
      sections[current] = trimmed;
    } else if (trimmed) {
      sections[current] += '\n' + trimmed;
    }
  }

  // Write core sections (available in all tiers)
  writeSection('Overview', sections['Overview'] || text);
  writeSection('Personality & Vibe', sections['Personality & Vibe']);
  writeSection('Attachment Style & Love Languages', sections['Attachment Style & Love Languages']);
  writeSection('First Meeting Scenario', sections['First Meeting Scenario']);
  writeSection("What They're Looking For Now", sections["What They're Looking For Now"]);
  writeSection('Numerology/Astro Notes', sections['Numerology/Astro Notes']);

  // PLUS TIER: Add location prediction and enhanced content
  if (tier === 'plus' || tier === 'premium') {
    // Generate location prediction based on numerology and astrology
    const locationPrediction = generateLocationPrediction(quiz);
    writeSection('Soulmate Location Prediction', locationPrediction, true);
    
    if (sections['Location Insights']) {
      writeSection('Enhanced Location Insights', sections['Location Insights'], true);
    }
    if (sections['Enhanced Astrological Analysis']) {
      writeSection('Enhanced Astrological Analysis', sections['Enhanced Astrological Analysis'], true);
    }
  }

  // PREMIUM TIER: Add complete premium content
  if (tier === 'premium') {
    if (sections['Full Astrological AI Analysis']) {
      writeSection('Full Astrological AI Analysis', sections['Full Astrological AI Analysis'], true);
    }
    if (sections['Personal Relationship Strategy Guide']) {
      writeSection('Personal Relationship Strategy Guide', sections['Personal Relationship Strategy Guide'], true);
    }
    if (sections['Spiritual Growth & Preparation']) {
      writeSection('Spiritual Growth & Preparation', sections['Spiritual Growth & Preparation'], true);
    }
    if (sections['Cosmic Timing & Manifestation']) {
      writeSection('Cosmic Timing & Manifestation', sections['Cosmic Timing & Manifestation'], true);
    }
  }

  // Enhanced personalized add-on sections
  if (Array.isArray(addons) && (addons.includes('aura-reading') || addons.includes('aura'))) {
    const auraContent = generatePersonalizedAuraReading(quiz);
    writeSection('Your Personal Aura Reading', auraContent, true);
  }
  if (Array.isArray(addons) && (addons.includes('compatibility-snapshot') || addons.includes('twin_flame'))) {
    const twinFlameContent = generatePersonalizedTwinFlameInsight(quiz);
    writeSection('Soul Compatibility Insights', twinFlameContent, true);
  }
  if (Array.isArray(addons) && (addons.includes('12-hour-rush') || addons.includes('past_life'))) {
    const pastLifeContent = generatePersonalizedPastLifeGlimpse(quiz);
    writeSection('Past Life Connection Glimpse', pastLifeContent, true);
  }

  // Enhanced disclaimer with tier information
  doc.moveDown(2);
  doc.rect(doc.x - 10, doc.y - 5, doc.page.width - 112, 50)
     .fillOpacity(0.02)
     .fill('#000')
     .fillOpacity(1);
     
  doc.fontSize(9)
     .fillColor('#666')
     .font('Helvetica')
     .text('✨ Important Notice: This SoulmateSketch report is created for entertainment, inspiration, and self-reflection. It combines spiritual wisdom with AI technology to provide personalized insights for your journey.', {
       align: 'left',
       lineGap: 2
     });
     
  doc.moveDown(0.5);
  doc.fontSize(8)
     .fillColor('#888')
     .text(`© ${new Date().getFullYear()} SoulmateSketch ${tierStyle.label} • Generated with Love & AI`, { align: 'center' });

  doc.end();
  await new Promise((resolve) => stream.on('finish', resolve));
}
