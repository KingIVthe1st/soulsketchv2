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
    console.log('🖼️ Starting generateImage function...');
    
    // Extract data safely with fallbacks
    const user = quiz?.user || {};
    const attractedTo = user.attractedTo || quiz?.interest || 'women';
    let gender = 'adult person';
    if (attractedTo === 'men' || attractedTo === 'male') gender = 'male adult';
    else if (attractedTo === 'women' || attractedTo === 'female') gender = 'female adult';
    
    // Simple placeholder generation to avoid complex dependencies
    const outDir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `result_${Date.now()}.png`);
    
    if (openai) {
      try {
        console.log('🤖 Attempting DALL-E generation...');
        const simplePrompt = `A beautiful, realistic portrait of a ${gender} with warm, kind eyes and a gentle smile. Professional headshot style, natural lighting, attractive features, photorealistic quality.`;
        
        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt: simplePrompt,
          size: '1024x1024',
          quality: 'hd',
          style: 'natural'
        });
        
        console.log('✅ DALL-E image generated, downloading...');
        const imageUrl = image.data[0].url;
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to download generated image');
        
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.promises.writeFile(filePath, buffer);
        
        // Create social share variant
        const sharePath = filePath.replace('.png', '_story.png');
        await sharp(buffer).resize(1080, 1920, { fit: 'cover' }).toFile(sharePath);
        
        console.log('✅ DALL-E image saved successfully');
        return { 
          success: true,
          method: 'dall-e',
          filePath, 
          sharePath 
        };
      } catch (dallError) {
        console.error('❌ DALL-E generation failed:', dallError.message);
        // Fall through to placeholder
      }
    }
    
    // Generate simple placeholder
    console.log('📝 Generating placeholder image...');
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
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="32" font-family="Georgia, serif" fill="#7B1FA2" font-weight="bold">${genderText}</text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="22" font-family="Georgia, serif" fill="#AD1457">AI Portrait Coming Soon</text>
        <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="#666">✨ Professional Generation</text>
      </svg>`
    );
    
    const buffer = await sharp(svg).png().toBuffer();
    await fs.promises.writeFile(filePath, buffer);
    
    // Create social share variant
    const sharePath = filePath.replace('.png', '_story.png');
    await sharp(buffer).resize(1080, 1920, { fit: 'cover' }).toFile(sharePath);
    
    console.log('✅ Placeholder image generated successfully');
    return { 
      success: true,
      method: 'placeholder',
      filePath, 
      sharePath 
    };
  } catch (error) {
    console.error('❌ generateImage failed completely:', error);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

export async function generatePdf({ text, imagePath, outPath, addons = [], quiz = {} }) {
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
	if (Array.isArray(addons) && (addons.includes('aura-reading') || addons.includes('aura'))) {
		const auraContent = generatePersonalizedAuraReading(quiz);
		writeSection('Your Personal Aura Reading', auraContent);
	}
	if (Array.isArray(addons) && (addons.includes('compatibility-snapshot') || addons.includes('twin_flame'))) {
		const twinFlameContent = generatePersonalizedTwinFlameInsight(quiz);
		writeSection('Soul Compatibility Insights', twinFlameContent);
	}
	if (Array.isArray(addons) && (addons.includes('12-hour-rush') || addons.includes('past_life'))) {
		const pastLifeContent = generatePersonalizedPastLifeGlimpse(quiz);
		writeSection('Past Life Connection Glimpse', pastLifeContent);
	}

  // Disclaimer
	doc.moveDown(1);
	doc.fontSize(9).fillColor('#666').text('This experience is for inspiration and reflection. It does not promise outcomes or provide medical or professional advice.', { align: 'left' });

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
}
