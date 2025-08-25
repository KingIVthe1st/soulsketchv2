import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createPaymentIntent } from './payments.js';
import OpenAI from 'openai';

// OpenAI configuration (add your OpenAI API key to environment variables)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Enhanced quiz data storage (in production, use a database)
const orders = new Map();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Life Path Compatibility Functions
function getLifePathCompatibility(lifePathNumber) {
  const compatibilityMap = {
    1: "Life Paths 3, 5, and 6 - creative energies that appreciate leadership",
    2: "Life Paths 6, 8, and 9 - supportive partnerships with emotional depth", 
    3: "Life Paths 1, 5, and 7 - creative and intellectual connections",
    4: "Life Paths 2, 6, and 8 - stable, grounded relationships",
    5: "Life Paths 1, 3, and 9 - adventurous spirits who share freedom",
    6: "Life Paths 2, 4, and 9 - nurturing, family-oriented partnerships",
    7: "Life Paths 3, 5, and 9 - deep thinkers who appreciate independence", 
    8: "Life Paths 2, 4, and 6 - ambitious partners who value success",
    9: "Life Paths 2, 6, and 7 - humanitarian souls with compassionate hearts",
    11: "Life Paths 2, 6, and 22 - spiritual connections that honor intuition",
    22: "Life Paths 4, 11, and 33 - master builders creating legacy together",
    33: "Life Paths 6, 11, and 22 - master teachers sharing wisdom and love",
    44: "Life Paths 4, 22, and 33 - master healers working for humanity"
  };
  return compatibilityMap[lifePathNumber] || "Universal compatibility with all numbers";
}

function getCompatibilityExplanation(lifePathNumber) {
  const explanationMap = {
    1: "Leaders need partners who can both support their vision and maintain their own creative independence.",
    2: "Peacemakers thrive with partners who appreciate emotional connection and collaborative decision-making.",
    3: "Creative communicators need partners who stimulate them intellectually and appreciate their artistic nature.",
    4: "Builders seek stable, loyal partners who share their values of hard work and long-term commitment.",
    5: "Free spirits require partners who embrace adventure and won't try to restrict their need for variety.",
    6: "Nurturers connect deeply with partners who value family, home, and caring for others.",
    7: "Seekers need partners who respect their need for solitude and share their interest in deeper meanings.",
    8: "Achievers work best with partners who understand ambition and can support their material goals.",
    9: "Humanitarians connect with partners who share their compassion and desire to help others.",
    11: "Intuitive illuminators need partners who understand their spiritual sensitivity and visionary nature.",
    22: "Master builders require partners who can support their grand visions and practical implementation.",
    33: "Master teachers thrive with partners who appreciate their wisdom and share their desire to uplift humanity.",
    44: "Master healers connect with partners who support their mission to heal and transform the world."
  };
  return explanationMap[lifePathNumber] || "Your universal energy connects with all life paths through love and understanding.";
}

export function createRouter() {
  const router = express.Router();

  // NUMEROLOGY CALCULATIONS
  // AI-ENHANCED LIFE PATH CALCULATION
  async function calculateLifePathNumberAI(birthDate, birthTime = null, birthCity = null) {
    if (!birthDate) return 1;
    
    try {
      // First, do traditional calculation as backup
      const traditionalResult = calculateLifePathNumberTraditional(birthDate);
      
      // Use AI for verification and enhanced calculation
      const prompt = `You are an expert numerologist. Calculate the Life Path Number for someone born on ${birthDate}${birthTime ? ` at ${birthTime}` : ''}${birthCity ? ` in ${birthCity}` : ''}.

IMPORTANT CALCULATION RULES:
1. Use the birth date: ${birthDate}
2. For Life Path calculation, add ALL individual digits from the full birth date (MM/DD/YYYY format)
3. Master Numbers (11, 22, 33, 44) should NOT be reduced further
4. Only reduce to single digit if the sum is NOT a master number
5. Example: May 28, 1980 = 05/28/1980 = 0+5+2+8+1+9+8+0 = 33 (Master Number - do NOT reduce)

Please provide ONLY the Life Path Number as a single number (like 33 or 7), no explanation needed.`;

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a precise numerology calculator. Respond only with the calculated Life Path Number.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const aiResult = parseInt(aiResponse.choices[0].message.content.trim());
      
      // Validate AI result
      if (aiResult && (aiResult >= 1 && aiResult <= 9) || [11, 22, 33, 44].includes(aiResult)) {
        return aiResult;
      } else {
        console.warn('AI Life Path calculation returned invalid result, using traditional method:', aiResult);
        return traditionalResult;
      }
      
    } catch (error) {
      console.error('Error with AI Life Path calculation, falling back to traditional:', error);
      return calculateLifePathNumberTraditional(birthDate);
    }
  }

  function calculateLifePathNumberTraditional(birthDate) {
    if (!birthDate) return 1;
    
    try {
      console.log(`🔢 Traditional calculation starting with birthDate: ${birthDate}`);
      
      // Parse the birth date properly using UTC to avoid timezone issues
      const date = new Date(birthDate);
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const year = date.getUTCFullYear();
      
      console.log(`🔢 Parsed date - Month: ${month}, Day: ${day}, Year: ${year}`);
      
      // Method for Master Numbers: Add all digits from the full birth date
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const fullDateStr = `${monthStr}${dayStr}${year}`;
      
      console.log(`🔢 Full date string: ${fullDateStr}`);
      
      // Add all digits together
      let sum = 0;
      for (let digit of fullDateStr) {
        const digitVal = parseInt(digit);
        sum += digitVal;
        console.log(`🔢 Adding digit ${digit} = ${digitVal}, running sum: ${sum}`);
      }
      
      console.log(`🔢 Initial sum: ${sum}`);
      
      // Check for Master Numbers first
      if (sum === 11 || sum === 22 || sum === 33 || sum === 44) {
        console.log(`🔢 Found Master Number: ${sum}`);
        return sum;
      }
      
      // Reduce to single digit if not a Master Number
      while (sum > 9) {
        const oldSum = sum;
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
        console.log(`🔢 Reducing ${oldSum} to ${sum}`);
        
        // Check again for Master Numbers after reduction
        if (sum === 11 || sum === 22 || sum === 33) {
          console.log(`🔢 Found Master Number after reduction: ${sum}`);
          return sum;
        }
      }
      
      console.log(`🔢 Final result: ${sum}`);
      return sum;
    } catch (error) {
      console.error('Error calculating life path number:', error);
      return 1; // Default fallback
    }
  }

  // For backward compatibility, alias the traditional function
  const calculateLifePathNumber = calculateLifePathNumberTraditional;

  function calculateDestinyNumber(fullName) {
    if (!fullName) return 7;
    
    const letterValues = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
      'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
    };
    
    try {
      // Calculate sum of all letters
      let sum = 0;
      const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '');
      
      for (let char of cleanName) {
        if (letterValues[char]) {
          sum += letterValues[char];
        }
      }
      
      // Reduce to single digit (except master numbers)
      while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
      }
      
      return sum || 7; // Default to 7 if calculation fails
    } catch (error) {
      console.error('Error calculating destiny number:', error);
      return 7; // Default fallback
    }
  }

  function calculateSoulUrgeNumber(fullName) {
    if (!fullName) return 3;
    
    const vowelValues = {
      'A': 1, 'E': 5, 'I': 9, 'O': 6, 'U': 3, 'Y': 7
    };
    
    try {
      let sum = 0;
      const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '');
      
      for (let char of cleanName) {
        if (vowelValues[char]) {
          sum += vowelValues[char];
        }
      }
      
      // Reduce to single digit (except master numbers)
      while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
        sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
      }
      
      return sum || 3; // Default to 3 if calculation fails
    } catch (error) {
      console.error('Error calculating soul urge number:', error);
      return 3; // Default fallback
    }
  }

  function calculatePersonalYear(birthDate) {
    const currentYear = new Date().getFullYear();
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Personal Year = Birth Month + Birth Day + Current Year
    let sum = month + day + currentYear;
    
    // Reduce to single digit
    while (sum > 9) {
      sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    
    return sum;
  }

  function generateNumerologyInsights(lifePathNumber, destinyNumber, soulUrge, personalYear) {
    const lifePathMeanings = {
      1: "Natural leader with strong independence and pioneering spirit",
      2: "Diplomatic peacemaker with intuitive and cooperative nature", 
      3: "Creative communicator with artistic talents and social charm",
      4: "Practical builder with strong work ethic and organizational skills",
      5: "Free spirit with adventurous nature and love of change",
      6: "Nurturing caretaker with deep sense of responsibility and love",
      7: "Spiritual seeker with analytical mind and mystical insights",
      8: "Ambitious achiever with business acumen and material success",
      9: "Humanitarian with compassionate heart and universal wisdom",
      11: "Intuitive master with spiritual gifts and inspirational leadership",
      22: "Master builder with ability to manifest grand visions",
      33: "Master teacher with advanced spiritual understanding"
    };

    const destinyMeanings = {
      1: "Destined to lead and inspire others through innovation",
      2: "Called to bring harmony and cooperation to relationships",
      3: "Meant to express creativity and bring joy to the world",
      4: "Purpose involves building solid foundations for others",
      5: "Destined to explore and experience life's adventures",
      6: "Called to serve and nurture family and community",
      7: "Purpose involves seeking truth and sharing wisdom",
      8: "Destined for material success and business leadership",
      9: "Called to serve humanity through compassion and healing",
      11: "Meant to inspire others through spiritual insight",
      22: "Destined to create lasting impact through grand projects",
      33: "Called to teach and heal on a global scale"
    };

    const soulUrgeMeanings = {
      1: "Deep need for independence and leadership in love",
      2: "Craves partnership and emotional harmony",
      3: "Desires creative expression and joyful connection",
      4: "Needs stability and practical partnership",
      5: "Yearns for freedom and adventure in relationships",
      6: "Seeks nurturing and family-oriented love",
      7: "Desires spiritual and intellectual connection",
      8: "Needs successful and ambitious partnership",
      9: "Craves compassionate and humanitarian love",
      11: "Seeks inspirational and spiritually gifted partner",
      22: "Desires partnership that builds lasting legacy",
      33: "Needs healing and teaching-oriented relationship"
    };

    return {
      lifePath: {
        number: lifePathNumber,
        meaning: lifePathMeanings[lifePathNumber]
      },
      destiny: {
        number: destinyNumber,
        meaning: destinyMeanings[destinyNumber]
      },
      soulUrge: {
        number: soulUrge,
        meaning: soulUrgeMeanings[soulUrge]
      },
      personalYear: {
        number: personalYear,
        meaning: `Currently in a ${personalYear} Personal Year - ${personalYear === 1 ? 'new beginnings and fresh starts' : personalYear === 2 ? 'cooperation and partnership focus' : personalYear === 3 ? 'creative expansion and joy' : personalYear === 4 ? 'building foundations and hard work' : personalYear === 5 ? 'freedom and adventure' : personalYear === 6 ? 'love and family responsibilities' : personalYear === 7 ? 'spiritual growth and introspection' : personalYear === 8 ? 'material success and recognition' : 'completion and humanitarian service'}`
      }
    };
  }

  function generateLocationPredictions(numerologyData, astrologyData, userLocation, interests) {
    // Enhanced city predictions where soulmate likely resides (not current user location)
    const lifePathLocations = {
      1: ["New York City, NY - 94%", "Los Angeles, CA - 91%", "London, UK - 88%", "Singapore - 85%", "Dubai, UAE - 82%"],
      2: ["Portland, OR - 93%", "Amsterdam, Netherlands - 89%", "Kyoto, Japan - 86%", "Copenhagen, Denmark - 83%", "Austin, TX - 80%"],
      3: ["Miami, FL - 92%", "Paris, France - 90%", "Barcelona, Spain - 88%", "Nashville, TN - 85%", "Rio de Janeiro, Brazil - 82%"],
      4: ["Denver, CO - 91%", "Toronto, Canada - 88%", "Minneapolis, MN - 85%", "Munich, Germany - 82%", "Zurich, Switzerland - 79%"],
      5: ["Bangkok, Thailand - 95%", "Barcelona, Spain - 92%", "Sydney, Australia - 89%", "San Francisco, CA - 86%", "Berlin, Germany - 83%"],
      6: ["Asheville, NC - 90%", "Boulder, CO - 87%", "Burlington, VT - 84%", "Portland, ME - 81%", "Santa Barbara, CA - 78%"],
      7: ["San Francisco, CA - 93%", "Boston, MA - 90%", "Sedona, AZ - 87%", "Edinburgh, Scotland - 84%", "Dharamshala, India - 81%"],
      8: ["New York City, NY - 96%", "Dubai, UAE - 93%", "Singapore - 90%", "Hong Kong - 87%", "Frankfurt, Germany - 84%"],
      9: ["Geneva, Switzerland - 92%", "San Francisco, CA - 89%", "Copenhagen, Denmark - 86%", "Vancouver, Canada - 83%", "Melbourne, Australia - 80%"],
      11: ["Sedona, AZ - 97%", "Mount Shasta, CA - 94%", "Glastonbury, UK - 91%", "Rishikesh, India - 88%", "Santa Fe, NM - 85%"],
      22: ["London, UK - 95%", "Tokyo, Japan - 92%", "Washington DC - 89%", "Geneva, Switzerland - 86%", "Sydney, Australia - 83%"],
      33: ["San Francisco, CA - 93%", "Copenhagen, Denmark - 90%", "Vancouver, Canada - 87%", "Amsterdam, Netherlands - 84%", "Melbourne, Australia - 81%"]
    };

    const elementLocations = {
      'Fire': ["Phoenix, AZ", "Miami, FL", "Los Angeles, CA", "Barcelona, Spain", "Tel Aviv, Israel"],
      'Earth': ["Boulder, CO", "Portland, OR", "Vancouver, Canada", "Munich, Germany", "Wellington, New Zealand"],
      'Air': ["Boston, MA", "Seattle, WA", "Edinburgh, Scotland", "Vienna, Austria", "Cambridge, MA"],
      'Water': ["San Diego, CA", "Venice, Italy", "Vancouver, Canada", "Seattle, WA", "Honolulu, HI"]
    };

    const interestLocations = {
      'travel': ["International hubs like London, Tokyo, or Singapore",],
      'music': ["Nashville, Austin, or Berlin for vibrant music scenes"],
      'art': ["Paris, New York, or Florence for artistic communities"],
      'nature': ["Boulder, Portland, or Vancouver near natural beauty"],
      'fitness': ["Los Angeles, Miami, or Sydney with active lifestyles"],
      'technology': ["San Francisco, Seattle, or Boston in tech corridors"],
      'food': ["New York, Paris, or Tokyo for culinary excellence"]
    };

    const lifePathNumber = numerologyData?.lifePath?.number || 1;
    const element = astrologyData?.element || 'Water';
    
    let predictions = {
      primaryLocations: lifePathLocations[lifePathNumber] || lifePathLocations[1],
      elementalRegions: elementLocations[element] || elementLocations['Water'],
      interestBased: [],
      spiritualVortexes: ["Sedona, AZ", "Mount Shasta, CA", "Glastonbury, UK", "Machu Picchu, Peru"],
      meetingTiming: `Your Personal Year ${numerologyData?.personalYear?.number || 1} indicates ${numerologyData?.personalYear?.number === 1 || numerologyData?.personalYear?.number === 5 ? 'high potential for new encounters' : numerologyData?.personalYear?.number === 2 || numerologyData?.personalYear?.number === 6 ? 'relationship-focused opportunities' : 'steady relationship development'}`
    };

    // Add interest-based locations
    if (interests) {
      for (let interest in interestLocations) {
        if (interests.toLowerCase().includes(interest)) {
          predictions.interestBased.push(...interestLocations[interest]);
        }
      }
    }

    return predictions;
  }

  // ASTROLOGY CALCULATIONS
  function getZodiacSign(birthDate) {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1; // JavaScript months are 0-based
    const day = date.getDate();

    const zodiacSigns = [
      { sign: "Capricorn", start: [12, 22], end: [1, 19], element: "Earth", quality: "Cardinal" },
      { sign: "Aquarius", start: [1, 20], end: [2, 18], element: "Air", quality: "Fixed" },
      { sign: "Pisces", start: [2, 19], end: [3, 20], element: "Water", quality: "Mutable" },
      { sign: "Aries", start: [3, 21], end: [4, 19], element: "Fire", quality: "Cardinal" },
      { sign: "Taurus", start: [4, 20], end: [5, 20], element: "Earth", quality: "Fixed" },
      { sign: "Gemini", start: [5, 21], end: [6, 20], element: "Air", quality: "Mutable" },
      { sign: "Cancer", start: [6, 21], end: [7, 22], element: "Water", quality: "Cardinal" },
      { sign: "Leo", start: [7, 23], end: [8, 22], element: "Fire", quality: "Fixed" },
      { sign: "Virgo", start: [8, 23], end: [9, 22], element: "Earth", quality: "Mutable" },
      { sign: "Libra", start: [9, 23], end: [10, 22], element: "Air", quality: "Cardinal" },
      { sign: "Scorpio", start: [10, 23], end: [11, 21], element: "Water", quality: "Fixed" },
      { sign: "Sagittarius", start: [11, 22], end: [12, 21], element: "Fire", quality: "Mutable" }
    ];

    for (let zodiac of zodiacSigns) {
      const [startMonth, startDay] = zodiac.start;
      const [endMonth, endDay] = zodiac.end;
      
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return zodiac;
      }
    }
    
    return zodiacSigns[0]; // Default to Capricorn if something goes wrong
  }

  function generateAstrologyInsights(zodiacSign, birthTime, birthCity) {
    const signTraits = {
      "Aries": { personality: "Bold, energetic, pioneering", compatibility: ["Leo", "Sagittarius", "Gemini", "Aquarius"] },
      "Taurus": { personality: "Stable, sensual, determined", compatibility: ["Virgo", "Capricorn", "Cancer", "Pisces"] },
      "Gemini": { personality: "Curious, adaptable, communicative", compatibility: ["Libra", "Aquarius", "Aries", "Leo"] },
      "Cancer": { personality: "Nurturing, intuitive, emotional", compatibility: ["Scorpio", "Pisces", "Taurus", "Virgo"] },
      "Leo": { personality: "Confident, generous, dramatic", compatibility: ["Aries", "Sagittarius", "Gemini", "Libra"] },
      "Virgo": { personality: "Analytical, practical, perfectionist", compatibility: ["Taurus", "Capricorn", "Cancer", "Scorpio"] },
      "Libra": { personality: "Harmonious, diplomatic, aesthetic", compatibility: ["Gemini", "Aquarius", "Leo", "Sagittarius"] },
      "Scorpio": { personality: "Intense, mysterious, transformative", compatibility: ["Cancer", "Pisces", "Virgo", "Capricorn"] },
      "Sagittarius": { personality: "Adventurous, philosophical, optimistic", compatibility: ["Aries", "Leo", "Libra", "Aquarius"] },
      "Capricorn": { personality: "Ambitious, disciplined, responsible", compatibility: ["Taurus", "Virgo", "Scorpio", "Pisces"] },
      "Aquarius": { personality: "Independent, innovative, humanitarian", compatibility: ["Gemini", "Libra", "Aries", "Sagittarius"] },
      "Pisces": { personality: "Compassionate, artistic, intuitive", compatibility: ["Cancer", "Scorpio", "Taurus", "Capricorn"] }
    };

    return {
      sign: zodiacSign.sign,
      element: zodiacSign.element,
      quality: zodiacSign.quality,
      personality: signTraits[zodiacSign.sign]?.personality || "Unique and special",
      compatibility: signTraits[zodiacSign.sign]?.compatibility || ["All signs"],
      soulmatePrediction: `Your ideal soulmate likely shares your ${zodiacSign.element} element energy or complements it with ${getComplementaryElement(zodiacSign.element)} traits.`
    };
  }

  function getComplementaryElement(element) {
    const complements = {
      "Fire": "Air", 
      "Air": "Fire",
      "Water": "Earth",
      "Earth": "Water"
    };
    return complements[element] || "balanced";
  }

  // AGE CALCULATION
  function calculateSoulmateAge(userBirthDate) {
    const userDate = new Date(userBirthDate);
    const currentDate = new Date();
    let userAge = currentDate.getFullYear() - userDate.getFullYear();
    
    // Adjust for birthday not yet occurred this year
    if (currentDate.getMonth() < userDate.getMonth() || 
        (currentDate.getMonth() === userDate.getMonth() && currentDate.getDate() < userDate.getDate())) {
      userAge--;
    }
    
    // Soulmate is 5 years younger
    return Math.max(18, userAge - 5);
  }

  // OPENAI INTEGRATION
  async function generateSoulmateImage(userPrefs, numerologyData, astrologyData, soulmateAge) {
    console.log('Starting DALL-E image generation...');
    console.log('API Key check:', {
      exists: !!OPENAI_API_KEY,
      type: typeof OPENAI_API_KEY,
      length: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0
    });
    
    // Always use OpenAI DALL-E for production
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-api-key-here') {
      console.error('OpenAI API key not configured - using temporary fallback');
      // Temporary fallback only for missing API key
      const filename = `soulmate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const sourcePath = path.join('public', 'images', 'home', 'pencil-generated.jpg');
      const destPath = path.join('uploads', filename);
      
      try {
        await fs.promises.copyFile(sourcePath, destPath);
        return { imagePath: `uploads/${filename}`, isPlaceholder: true };
      } catch (error) {
        return { imagePath: 'images/home/pencil-generated.jpg', isPlaceholder: true };
      }
    }
    
    try {
      const prompt = createImagePrompt(userPrefs, numerologyData, astrologyData, soulmateAge);
      console.log('DALL-E Prompt:', prompt);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      });
      
      const imageUrl = response.data[0].url;
      console.log('DALL-E image generated successfully:', imageUrl);
      
      // Download and save the image
      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.arrayBuffer();
      const filename = `soulmate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const imagePath = path.join('uploads', filename);
      
      await fs.promises.writeFile(imagePath, Buffer.from(buffer));
      console.log('Image saved to:', imagePath);
      
      return { imagePath: `uploads/${filename}`, isPlaceholder: false };
    } catch (error) {
      console.error('DALL-E generation error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Emergency fallback only if API fails
      const filename = `soulmate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const sourcePath = path.join('public', 'images', 'home', 'pencil-generated.jpg');
      const destPath = path.join('uploads', filename);
      
      try {
        await fs.promises.copyFile(sourcePath, destPath);
        return { imagePath: `uploads/${filename}`, isPlaceholder: true };
      } catch (copyError) {
        return { imagePath: 'images/home/pencil-generated.jpg', isPlaceholder: true };
      }
    }
  }

  function createImagePrompt(userPrefs, numerologyData, astrologyData, soulmateAge) {
    // CRITICAL: Map user's INTEREST to the gender they want to see
    // If user is male interested in females, generate a female image
    // If user is female interested in males, generate a male image
    // Map quiz options to image generation terms
    // Quiz allows: "men", "woman", "either"
    const genderMap = {
      // Primary quiz options
      'men': 'handsome man',
      'woman': 'beautiful woman', 
      'either': 'attractive person',
      
      // Alternative forms for robustness
      'male': 'handsome man',
      'female': 'beautiful woman',
      'man': 'handsome man',
      'women': 'beautiful woman',
      'any': 'attractive person',
      'both': 'attractive person',
      'prefer-not-to-say': 'attractive person',
      'other': 'attractive person'
    };
    
    // Use preferred_gender or determine from user's quiz data
    let targetGender = userPrefs.preferred_gender || userPrefs.interestedIn || 'any';
    
    // Handle quiz data format
    if (userPrefs.preferences?.gender) {
      targetGender = userPrefs.preferences.gender;
    }
    if (userPrefs.user?.interestedIn) {
      targetGender = userPrefs.user.interestedIn;
    }
    
    const baseGender = genderMap[targetGender.toLowerCase()] || genderMap['any'];
    
    // Build comprehensive numerology-based traits
    let numerologyTraits = '';
    if (numerologyData?.lifePath?.number) {
      const lifePathTraits = {
        1: 'natural leadership qualities, strong jawline, confident posture',
        2: 'gentle features, harmonious appearance, diplomatic smile',
        3: 'expressive face, creative energy, youthful appearance',
        4: 'grounded presence, practical style, reliable appearance',
        5: 'adventurous spirit visible in eyes, dynamic energy',
        6: 'nurturing expression, warm smile, approachable demeanor',
        7: 'mysterious depth in eyes, intellectual appearance, spiritual aura',
        8: 'powerful presence, ambitious expression, executive style',
        9: 'compassionate eyes, humanitarian spirit, wise appearance',
        11: 'intuitive gaze, visionary expression, ethereal quality',
        22: 'master builder presence, practical visionary appearance',
        33: 'master teacher aura, enlightened expression'
      };
      numerologyTraits = lifePathTraits[numerologyData.lifePath.number] || '';
    }
    
    // Build astrological appearance traits
    let astroTraits = '';
    if (astrologyData) {
      const elementStyles = {
        'Fire': 'warm glowing skin, confident radiant smile, passionate eyes, athletic or energetic build',
        'Earth': 'natural beauty, earthy tones, grounded presence, strong bone structure, practical elegance',
        'Air': 'intellectual charm, bright alert eyes, refined features, graceful movements, modern style',
        'Water': 'deep emotional eyes, intuitive expression, soft features, flowing hair, magnetic presence'
      };
      
      const signStyles = {
        'Aries': 'bold features, athletic build, confident stance',
        'Taurus': 'sensual beauty, strong neck, luxurious appearance',
        'Gemini': 'youthful appearance, expressive hands, quick smile',
        'Cancer': 'soft round features, nurturing expression, emotional depth',
        'Leo': 'regal bearing, luxurious hair, commanding presence',
        'Virgo': 'refined features, neat appearance, intelligent eyes',
        'Libra': 'balanced features, charming smile, elegant style',
        'Scorpio': 'intense gaze, magnetic presence, mysterious aura',
        'Sagittarius': 'adventurous spirit, athletic build, optimistic expression',
        'Capricorn': 'classic features, mature appearance, professional style',
        'Aquarius': 'unique features, progressive style, friendly eyes',
        'Pisces': 'dreamy eyes, artistic appearance, gentle presence'
      };
      
      astroTraits = (elementStyles[astrologyData.element] || '') + ', ' + 
                    (signStyles[astrologyData.sign] || '');
    }
    
    // Build prompt with all comprehensive data
    let prompt = `Ultra-realistic professional portrait photograph of a ${baseGender}, `;
    prompt += `exactly ${soulmateAge} years old, `;
    
    // Add numerology-based appearance
    if (numerologyTraits) {
      prompt += numerologyTraits + ', ';
    }
    
    // Add astrology-based appearance
    if (astroTraits) {
      prompt += astroTraits + ', ';
    }
    
    // Add user's specific physical preferences
    if (userPrefs.hair_color || userPrefs.preferences?.hair_color) {
      const hairColor = userPrefs.hair_color || userPrefs.preferences.hair_color;
      prompt += `${hairColor} hair styled beautifully, `;
    }
    
    if (userPrefs.eye_color || userPrefs.preferences?.eye_color) {
      const eyeColor = userPrefs.eye_color || userPrefs.preferences.eye_color;
      prompt += `captivating ${eyeColor} eyes with depth and warmth, `;
    }
    
    // Add personality-based physical traits
    if (userPrefs.personality_traits || userPrefs.preferences?.personality) {
      const traits = userPrefs.personality_traits || userPrefs.preferences.personality;
      const personalityMap = {
        'adventurous': 'athletic physique, sun-kissed skin, energetic stance',
        'artistic': 'creative fashion sense, expressive features, unique style',
        'intellectual': 'intelligent eyes behind stylish glasses (optional), thoughtful expression',
        'spiritual': 'serene peaceful expression, meditation-inspired calmness, inner light',
        'ambitious': 'power stance, determined expression, success-oriented appearance',
        'romantic': 'soft romantic features, gentle smile, loving eyes',
        'humorous': 'laugh lines, playful expression, warm engaging smile',
        'caring': 'nurturing presence, kind eyes, comforting demeanor'
      };
      
      for (let trait in personalityMap) {
        if (traits.toLowerCase().includes(trait)) {
          prompt += personalityMap[trait] + ', ';
        }
      }
    }
    
    // Add lifestyle/interest-based appearance
    if (userPrefs.hobbies || userPrefs.interests) {
      const interests = userPrefs.hobbies || userPrefs.interests || '';
      if (interests.includes('fitness')) prompt += 'fit athletic body, ';
      if (interests.includes('travel')) prompt += 'worldly sophisticated appearance, ';
      if (interests.includes('music')) prompt += 'artistic creative vibe, ';
      if (interests.includes('nature')) prompt += 'natural organic style, ';
      if (interests.includes('tech')) prompt += 'modern contemporary appearance, ';
    }
    
    // Add celebrity inspiration if provided
    if (userPrefs.celeb || userPrefs.preferences?.celebrity) {
      const celeb = userPrefs.celeb || userPrefs.preferences.celebrity;
      prompt += `subtle resemblance to ${celeb} but unique individual, `;
    }
    
    // HYPERREALISTIC PHOTOGRAPHY REQUIREMENTS - NO ANIMATION
    prompt += 'HYPERREALISTIC PHOTOGRAPH ONLY, REAL HUMAN PERSON, NOT anime, NOT cartoon, NOT illustration, NOT digital art, NOT painting, ';
    prompt += 'professional DSLR portrait photography, visible skin texture, natural skin pores, individual hair strands, realistic facial features, ';
    prompt += 'shot with Canon EOS R5, 85mm f/1.2 lens, studio lighting, soft bokeh background, ';
    prompt += 'warm natural skin tones, genuine authentic smile, direct eye contact with camera, natural lighting, ';
    prompt += 'Annie Leibovitz portrait style, National Geographic quality, Vogue magazine realism, professional headshot, ';
    prompt += 'extremely detailed photorealism, lifelike human features, 8k resolution, award-winning real portrait photography, looks like actual person';
    
    return prompt;
  }

  // AI-POWERED PERSONALIZED PREDICTIONS GENERATION
  async function generatePersonalizedPredictions(orderData, numerologyData, astrologyData, packageLevel) {
    console.log('Generating AI-powered personalized predictions with GPT-4...');
    
    // Always use OpenAI GPT for production
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-api-key-here') {
      console.error('OpenAI API key not configured - using basic predictions');
      return {
        basicPredictions: [
          `<strong>A complementary life path</strong> that enhances your spiritual journey`,
          `<strong>Magnetic attraction</strong> based on your astrological compatibility`,
          `<strong>Shared values</strong> that align with your numerological destiny`,
          `<strong>Perfect timing</strong> orchestrated by the universe`,
          `<strong>Deep understanding</strong> of your authentic self`
        ],
        premiumInsight: `Your soulmate connection transcends the physical realm. The universe has been preparing this meeting through multiple lifetimes.`
      };
    }
    
    try {
      // Build comprehensive context for AI with ALL user data
      const userName = orderData.name || 'Seeker';
      const birthDate = orderData.birth_date || orderData.birthdate || '';
      const userGender = orderData.gender || orderData.user?.gender || '';
      const seekingGender = orderData.preferred_gender || orderData.interestedIn || orderData.preferences?.gender || 'any';
      const personality = orderData.personality_traits || orderData.preferences?.personality || '';
      const interests = orderData.hobbies || orderData.interests || orderData.preferences?.interests || '';
      const location = orderData.birth_city || orderData.preferences?.location || '';
      const relationshipGoals = orderData.preferences?.relationship_goals || orderData.relationship_type || 'deep lasting connection';
      
      const context = `
        CRITICAL CONTEXT FOR PERSONALIZED SOULMATE READING:
        
        User Profile:
        - Name: ${userName}
        - Birth Date: ${birthDate}
        - Gender: ${userGender}
        - Seeking: ${seekingGender} partner
        - Location/Birth City: ${location}
        - Personality Traits: ${personality}
        - Interests/Hobbies: ${interests}
        - Relationship Goals: ${relationshipGoals}
        - Age Range Preference: ${orderData.age_range || 'similar age'}
        - Physical Preferences: Hair: ${orderData.hair_color || 'any'}, Eyes: ${orderData.eye_color || 'any'}
        
        Numerology Deep Analysis:
        - Life Path Number: ${numerologyData?.lifePath?.number || 1}
        - Life Path Meaning: ${numerologyData?.lifePath?.meaning || 'Natural leader and pioneer'}
        - Life Path Traits: ${numerologyData?.lifePath?.traits || 'Independent, ambitious, innovative'}
        - Destiny Number: ${numerologyData?.destiny?.number || 7}
        - Destiny Meaning: ${numerologyData?.destiny?.meaning || 'Seeker of truth and wisdom'}
        - Destiny Traits: ${numerologyData?.destiny?.traits || 'Analytical, spiritual, introspective'}
        - Compatibility Numbers: Best matches with Life Path ${numerologyData?.lifePath?.compatibility || '3, 5, 7'}
        
        Astrology Deep Analysis:
        - Sun Sign: ${astrologyData?.sign || 'Pisces'}
        - Element: ${astrologyData?.element || 'Water'}
        - Quality: ${astrologyData?.quality || 'Mutable'}
        - Ruling Planet: ${astrologyData?.rulingPlanet || 'Neptune'}
        - Key Traits: ${astrologyData?.personality || 'Intuitive, compassionate, creative'}
        - Compatible Signs: ${astrologyData?.compatibility?.join(', ') || 'Cancer, Scorpio, Taurus, Capricorn'}
        - Love Style: ${astrologyData?.loveStyle || 'Deep emotional connection, romantic, devoted'}
        
        Package Level: ${packageLevel}
        
        Package Level: ${packageLevel}
      `;
      
      let systemPrompt = `You are an elite mystical soulmate advisor with deep expertise in numerology, astrology, and human psychology. 
        You create ULTRA-PERSONALIZED predictions that incorporate EVERY SINGLE piece of user data provided.
        
        🚫 ABSOLUTE PROHIBITIONS - NEVER USE THESE PHRASES:
        - "limited information" or "general insights" 
        - "based on what I know" or "given the information"
        - "typically" or "generally" or "usually"
        - "most people" or "many individuals"
        - Any generic or templated language
        
        ✅ MANDATORY REQUIREMENTS - EVERY RESPONSE MUST:
        - Use their EXACT name: ${userName} multiple times
        - Reference their SPECIFIC interests: ${interests}
        - Mention their EXACT personality traits: ${personality}
        - Include their PRECISE location: ${location}
        - State their Life Path ${numerologyData?.lifePath?.number} and Destiny ${numerologyData?.destiny?.number}
        - Reference their ${astrologyData?.sign} sign and ${astrologyData?.element} element
        - Acknowledge they seek ${seekingGender} partners
        - Include physical preferences: ${orderData.hair_color} hair, ${orderData.eye_color} eyes
        - Reference their age preference: ${orderData.age_range}
        
        🎯 VALIDATION CHECK: Before sending your response, verify it contains:
        1. Their name (${userName}) at least 3 times
        2. At least 3 of their specific interests from: ${interests}
        3. Their personality traits: ${personality}
        4. Their numerology numbers AND astrology sign
        5. Zero generic phrases
        
        You have COMPLETE, COMPREHENSIVE data about ${userName}. Use EVERY detail to create content that could ONLY be for them.`;
      
      let userPrompt = '';
      
      if (packageLevel === 'basic') {
        userPrompt = `Create 5 ULTRA-SPECIFIC soulmate predictions for ${userName} that prove you know them intimately:
          
          🎯 MANDATORY PERSONAL REFERENCES (ALL must be included):
          - ${userName}'s name mentioned in EVERY prediction
          - Their interests "${interests}" woven into romantic scenarios
          - Their "${personality}" personality traits as relationship strengths
          - Their Life Path ${numerologyData?.lifePath?.number} destiny connection
          - Their ${astrologyData?.sign} (${astrologyData?.element} element) romantic nature
          - Their search for ${seekingGender} partners with ${orderData.hair_color} hair, ${orderData.eye_color} eyes
          - Their ${location} location as a meeting place influence
          - Their age preference ${orderData.age_range} as compatibility factor
          
          🔥 EACH PREDICTION MUST:
          - Start with "${userName}, based on your [specific trait/interest]..."
          - Include 2-3 of their personal details within the prediction
          - Connect their numerology AND astrology to their love life
          - Feel like ONLY ${userName} could have received this prediction
          
          Format: 1. ${userName}, based on your... 2. ${userName}, your... etc.
          
          ${context}`;
      } else if (packageLevel === 'plus') {
        const locationPredictions = generateLocationPredictions(numerologyData, astrologyData, location, interests);
        
        userPrompt = `Create comprehensive soulmate analysis with ENHANCED LOCATION INTELLIGENCE for ${userName}:
          
          🎯 SECTION 1: PERSONALIZED PREDICTIONS (5 unique predictions - NO REPETITION)
          Each must start: "${userName}, your [specific trait]..." and include different aspects:
          1. ${userName}'s ${interests} interests and romantic connection
          2. ${userName}'s Life Path ${numerologyData?.lifePath?.number} soulmate magnetism  
          3. ${userName}'s ${astrologyData?.sign} romantic compatibility patterns
          4. ${userName}'s Soul Urge ${numerologyData?.soulUrge?.number} deep desires
          5. ${userName}'s Personal Year ${numerologyData?.personalYear?.number} meeting timing
          
          🌍 SECTION 2: PREMIUM LOCATION INTELLIGENCE (Minimum 300 words)
          
          **IMPORTANT: Make specific predictions about WHERE ${userName}'s soulmate currently LIVES/RESIDES, not where they might meet. Remember that people move from their birth cities, so predict their current residence based on ${userName}'s spiritual energy.**
          
          **${userName}'s Soulmate's Current City Prediction:**
          Based on ${userName}'s Life Path ${numerologyData?.lifePath?.number} and ${astrologyData?.sign} energy, predict the SPECIFIC CITY where ${userName}'s soulmate most likely resides NOW. Choose ONE primary city from: ${locationPredictions.primaryLocations.join(', ')} and explain WHY this is where they live (not where they were born).
          
          **Secondary Residence Possibilities:**
          List 2-3 additional cities where ${userName}'s soulmate might currently live, with specific percentages and reasons related to ${userName}'s numerological and astrological profile.
          
          **${userName}'s Soulmate's Lifestyle Location Alignment:**
          Based on ${userName}'s interests in ${interests}, predict what TYPE of location environment ${userName}'s soulmate chooses to live in and WHY they were drawn to move there.
          
          **${astrologyData?.element} Element Regional Energy:**
          Explain how ${userName}'s ${astrologyData?.element} element creates magnetic attraction to people living in: ${locationPredictions.elementalRegions.join(', ')}
          
          **Sacred Meeting Timing & Places:** ${locationPredictions.meetingTiming}
          
          **CRITICAL: Explain WHY ${userName}'s soulmate chose to LIVE in their predicted city - consider career, lifestyle, spiritual calling, family moves, or life circumstances that drew them there. This should feel like a genuine prediction about WHERE they currently reside.**
          
          🔮 SECTION 3: ENHANCED COMPATIBILITY ANALYSIS
          - ${userName}'s ${astrologyData?.element} element romantic magnetism
          - How ${userName}'s Soul Urge ${numerologyData?.soulUrge?.number} affects partner selection
          - ${userName}'s Personal Year ${numerologyData?.personalYear?.number} relationship opportunities
          
          MANDATORY: Use ${userName}'s name 10+ times, reference ALL their data.
          ${context}`;
      } else if (packageLevel === 'premium') {
        const locationPredictions = generateLocationPredictions(numerologyData, astrologyData, location, interests);
        
        userPrompt = `Create the ULTIMATE personalized soulmate reading for ${userName} - prove you know EVERYTHING about them:
          
          📋 DATA VERIFICATION - YOUR RESPONSE MUST INCLUDE ALL OF THESE:
          ✅ Name: ${userName} (use 15+ times throughout)
          ✅ Interests: ${interests} (reference at least 6 specific ones)
          ✅ Personality: ${personality} (mention each trait multiple times)
          ✅ Location: ${location} (as meeting place factor)
          ✅ Seeking: ${seekingGender} partners aged ${orderData.age_range}
          ✅ Physical: ${orderData.hair_color} hair, ${orderData.eye_color} eyes
          ✅ ALL Numerology: Life Path ${numerologyData?.lifePath?.number}, Destiny ${numerologyData?.destiny?.number}, Soul Urge ${numerologyData?.soulUrge?.number}, Personal Year ${numerologyData?.personalYear?.number}
          ✅ Astrology: ${astrologyData?.sign} (${astrologyData?.element} element)
          
          🎯 SECTION 1: HYPER-PERSONALIZED PREDICTIONS (5 completely unique predictions - ZERO overlap)
          1. "${userName}'s ${interests} passion creates soulmate magnetism through [specific scenario]"
          2. "${userName}'s Life Path ${numerologyData?.lifePath?.number} destiny attracts [specific partner type]"  
          3. "${userName}'s ${astrologyData?.sign} nature draws ${seekingGender} partners who [specific quality]"
          4. "${userName}'s Soul Urge ${numerologyData?.soulUrge?.number} creates deep connection through [specific way]"
          5. "${userName}'s Personal Year ${numerologyData?.personalYear?.number} timing brings [specific opportunity]"
          
          🧬 SECTION 2: ${userName}'S COMPLETE SOUL BLUEPRINT (400+ words, 3 detailed paragraphs)
          Paragraph 1: How ${userName}'s Life Path ${numerologyData?.lifePath?.number} + ${personality} creates irresistible magnetic attraction
          Paragraph 2: Why ${userName}'s ${astrologyData?.sign} ${astrologyData?.element} energy + ${interests} draws perfect ${seekingGender} matches
          Paragraph 3: Specific karmic soul recognition ${userName} will experience in ${location} through ${interests} activities
          
          🎯 SECTION 3: ${userName}'S ULTIMATE MEETING STRATEGY (500+ words)
          **WHEN - Optimal Timing for ${userName}:**
          - Personal Year ${numerologyData?.personalYear?.number} peak months
          - ${astrologyData?.sign} season energy alignments  
          - Best days/times based on ${userName}'s numerology
          
          **WHERE - Premium Location Intelligence:**
          ${locationPredictions.primaryLocations.join(' | ')}
          Sacred timing: ${locationPredictions.meetingTiming}
          Specific venues for ${userName}'s ${interests} interests
          
          **HOW - Recognition & Approach:**
          - Physical signs ${userName} will notice (based on their ${seekingGender} preference)
          - Energy recognition specific to Life Path ${numerologyData?.lifePath?.number}
          - Conversation starters honoring ${userName}'s ${personality} nature
          
          **RELATIONSHIP MASTERY:**
          - First date recommendations for ${userName} in ${location}
          - Communication style for ${userName}'s ${astrologyData?.sign} nature
          - Long-term compatibility based on Soul Urge ${numerologyData?.soulUrge?.number}
          
          🔥 VALIDATION REQUIREMENT: Every section must mention ${userName} by name 3+ times and include their specific data!
          ${context}`;
      }
      
      console.log('🔍 DEBUG - Sending to OpenAI:');
      console.log('📊 User Data:', { userName, personality, interests, location, seekingGender });
      console.log('🧮 Enhanced Numerology:', {
        lifePath: numerologyData?.lifePath,
        destiny: numerologyData?.destiny,
        soulUrge: numerologyData?.soulUrge,
        personalYear: numerologyData?.personalYear
      });
      console.log('⭐ Astrology:', astrologyData);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: packageLevel === 'premium' ? 3000 : packageLevel === 'plus' ? 2000 : 1000
      });
      
      const aiResponse = completion.choices[0].message.content;
      console.log('AI predictions generated successfully');
      
      // Parse the AI response into structured format
      const lines = aiResponse.split('\n').filter(line => line.trim());
      
      // Extract predictions (first 5 bullet points or numbered items)
      const basicPredictions = [];
      let premiumInsight = '';
      let locationInsight = '';
      let enhancedAstrology = '';
      let strategyGuide = '';
      
      let section = 'predictions';
      for (const line of lines) {
        if (line.toLowerCase().includes('location') && packageLevel !== 'basic') {
          section = 'location';
        } else if (line.toLowerCase().includes('astrolog') && packageLevel !== 'basic') {
          section = 'astrology';
        } else if (line.toLowerCase().includes('spiritual') && packageLevel === 'premium') {
          section = 'spiritual';
        } else if (line.toLowerCase().includes('strategy') && packageLevel === 'premium') {
          section = 'strategy';
        }
        
        if (section === 'predictions' && basicPredictions.length < 5) {
          if (line.match(/^[1-5]\.|^[•\-\*]/)) {
            basicPredictions.push(line.replace(/^[1-5]\.|^[•\-\*]/, '').trim());
          }
        } else if (section === 'location') {
          locationInsight += line + ' ';
        } else if (section === 'astrology') {
          enhancedAstrology += line + ' ';
        } else if (section === 'spiritual') {
          premiumInsight += line + ' ';
        } else if (section === 'strategy') {
          strategyGuide += line + ' ';
        }
      }
      
      // Create diverse and meaningful predictions if we don't have enough
      const defaultPredictions = [
        `<strong>Spiritual alignment</strong> through your Life Path ${numerologyData?.lifePath?.number || 1} energy`,
        `<strong>Deep emotional compatibility</strong> with someone who appreciates your ${astrologyData?.personality?.toLowerCase() || 'unique'} nature`,
        `<strong>Intellectual connection</strong> through shared ${astrologyData?.element?.toLowerCase() || 'elemental'} energy and values`,
        `<strong>Karmic recognition</strong> - you'll feel an instant, familiar connection upon meeting`,
        `<strong>Complementary life goals</strong> that support your spiritual growth and personal development`
      ];
      
      while (basicPredictions.length < 5) {
        const remainingIndex = basicPredictions.length;
        if (remainingIndex < defaultPredictions.length) {
          basicPredictions.push(defaultPredictions[remainingIndex]);
        } else {
          basicPredictions.push(`<strong>Sacred partnership</strong> aligned with your Life Path ${numerologyData?.lifePath?.number || 1}`);
        }
      }
      
      return {
        basicPredictions: basicPredictions.slice(0, 5),
        premiumInsight: premiumInsight || aiResponse,
        locationInsight: locationInsight,
        enhancedAstrology: enhancedAstrology,
        strategyGuide: strategyGuide
      };
      
    } catch (error) {
      console.error('GPT prediction error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Fallback predictions if API fails
      return {
        basicPredictions: [
          `<strong>Life Path ${numerologyData?.lifePath?.number || 1} Connection</strong>: Your soulmate shares complementary numerological vibrations`,
          `<strong>${astrologyData.sunSign} Magnetic Pull</strong>: The stars align to bring ${astrologyData.compatibleSigns?.[0] || 'compatible'} energy into your life`,
          `<strong>Destiny Number ${numerologyData?.destiny?.number || 7} Alignment</strong>: Your paths are destined to cross at the perfect moment`,
          `<strong>${astrologyData.element} Element Harmony</strong>: Your soulmate brings balance through elemental compatibility`,
          `<strong>Universal Timing</strong>: The cosmos has orchestrated your meeting for maximum spiritual growth`
        ],
        premiumInsight: `As a Life Path ${numerologyData?.lifePath?.number || 1} ${astrologyData?.sunSign || 'soul'}, your soulmate journey is uniquely yours. The universe has been aligning circumstances, preparing both you and your destined partner for the moment of recognition. Your ${astrologyData?.element || 'spiritual'} energy will harmonize perfectly with their complementary vibration, creating a connection that transcends the physical realm.`,
        locationInsight: `Based on your ${astrologyData.element} element, your soulmate likely resides in locations that resonate with ${astrologyData.element.toLowerCase()} energy.`,
        enhancedAstrology: `Your ${astrologyData.sunSign} nature seeks deep compatibility with ${astrologyData.compatibleSigns?.join(', ') || 'aligned signs'}.`,
        strategyGuide: `Trust your Life Path ${numerologyData?.lifePath?.number || 1} intuition when recognizing your soulmate.`
      };
    }
  }

  // Format AI premium insight content into proper HTML structure
  function formatPremiumInsight(rawContent) {
    if (!rawContent) return '';
    
    let formattedContent = rawContent.trim();
    
    // Clean up improper numbering and formatting issues
    formattedContent = formattedContent.replace(/^\s*[2-9]\.\s+/gm, '');
    formattedContent = formattedContent.replace(/\s+[2-9]\.\s+/g, ' ');
    
    // Fix spacing and punctuation issues
    formattedContent = formattedContent.replace(/\.\s*\.\s*/g, '. ');
    formattedContent = formattedContent.replace(/\s+/g, ' ');
    
    // Create structured content with proper separations like other sections
    let htmlContent = '<div style="line-height: 1.8;">';
    
    // Split into sentences and create proper paragraph structure
    const sentences = formattedContent.split(/(?<=[.!?])\s+(?=[A-Z])/);
    let currentSection = '';
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      // Detect major concept starts for section breaks
      if (sentence.includes('Life Path') && sentence.includes('signifies')) {
        if (currentSection) {
          htmlContent += `<p style="margin-bottom: 20px;">${currentSection}</p>`;
        }
        htmlContent += `<div style="margin: 25px 0;">
          <h5 style="color: #ff9ff3; margin: 0 0 10px 0; font-weight: bold;">🌟 Life Path Spiritual Understanding</h5>
          <p style="margin: 0 0 20px 0;">${sentence}</p>
        </div>`;
        currentSection = '';
        continue;
      }
      
      if (sentence.includes('Gemini') && sentence.includes('communicative nature')) {
        if (currentSection) {
          htmlContent += `<p style="margin-bottom: 20px;">${currentSection}</p>`;
        }
        htmlContent += `<div style="margin: 25px 0;">
          <h5 style="color: #4ecdc4; margin: 0 0 10px 0; font-weight: bold;">♊ Gemini Magnetic Charm</h5>
          <p style="margin: 0 0 20px 0;">${sentence}</p>
        </div>`;
        currentSection = '';
        continue;
      }
      
      if (sentence.includes('Soul Urge') && sentence.includes('signifies')) {
        if (currentSection) {
          htmlContent += `<p style="margin-bottom: 20px;">${currentSection}</p>`;
        }
        htmlContent += `<div style="margin: 25px 0;">
          <h5 style="color: #95e1d3; margin: 0 0 10px 0; font-weight: bold;">💫 Soul Urge Harmony</h5>
          <p style="margin: 0 0 20px 0;">${sentence}</p>
        </div>`;
        currentSection = '';
        continue;
      }
      
      if (sentence.includes('Personal Year') && sentence.includes('time of')) {
        if (currentSection) {
          htmlContent += `<p style="margin-bottom: 20px;">${currentSection}</p>`;
        }
        htmlContent += `<div style="margin: 25px 0;">
          <h5 style="color: #fce38a; margin: 0 0 10px 0; font-weight: bold;">⏰ Personal Year Timing</h5>
          <p style="margin: 0 0 20px 0;">${sentence}</p>
        </div>`;
        currentSection = '';
        continue;
      }
      
      if (sentence.includes('Now, let\'s delve') || sentence.includes('complete soul blueprint')) {
        if (currentSection) {
          htmlContent += `<p style="margin-bottom: 20px;">${currentSection}</p>`;
        }
        htmlContent += `<div style="margin: 30px 0;">
          <h4 style="color: #ff9ff3; margin: 0 0 15px 0; font-size: 1.2em; font-weight: bold;">🎭 Your Complete Soul Blueprint</h4>
          <p style="margin: 0 0 20px 0;">${sentence}</p>
        </div>`;
        currentSection = '';
        continue;
      }
      
      if (sentence.includes('karmic soul recognition')) {
        if (currentSection) {
          htmlContent += `<p style="margin-bottom: 20px;">${currentSection}</p>`;
        }
        htmlContent += `<div style="margin: 25px 0;">
          <h5 style="color: #a8e6cf; margin: 0 0 10px 0; font-weight: bold;">🔮 Karmic Soul Recognition</h5>
          <p style="margin: 0 0 20px 0;">${sentence}</p>
        </div>`;
        currentSection = '';
        continue;
      }
      
      // Add to current section
      currentSection += (currentSection ? ' ' : '') + sentence;
    }
    
    // Add any remaining content
    if (currentSection) {
      htmlContent += `<p style="margin-bottom: 20px;">${currentSection}</p>`;
    }
    
    htmlContent += '</div>';
    
    // Format remaining bold text markers
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffd700; font-weight: bold;">$1</strong>');
    
    return htmlContent;
  }

  // PDF REPORT GENERATION
  async function generatePDFReport(orderData, numerologyData, astrologyData, imagePath, packageLevel) {
    // Generate AI-powered personalized predictions
    const personalizedPredictions = await generatePersonalizedPredictions(orderData, numerologyData, astrologyData, packageLevel);
    const reportContent = createReportContent(orderData, numerologyData, astrologyData, packageLevel, personalizedPredictions);
    const filename = `soulmate-report-${orderData.id}-${Date.now()}.pdf`;
    const pdfPath = path.join('uploads', filename);
    
    // For now, create a text file (in production, use a PDF library like puppeteer)
    await fs.promises.writeFile(pdfPath.replace('.pdf', '.txt'), reportContent);
    
    return `uploads/${filename.replace('.pdf', '.txt')}`;
  }

  function createReportContent(orderData, numerologyData, astrologyData, packageLevel, personalizedPredictions) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your SoulSketch Mystical Report</title>
    <style>
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.7;
            color: #2d3748;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        p {
            margin-bottom: 18px;
            line-height: 1.8;
        }
        strong {
            font-weight: 700;
        }
        .report-container {
            background: white;
            border-radius: 20px;
            padding: 60px 50px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        .report-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
        }
        .header {
            text-align: center;
            margin-bottom: 50px;
            border-bottom: 2px solid #edf2f7;
            padding-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5em;
            color: #667eea;
            margin: 0 0 10px 0;
            font-weight: 300;
            text-shadow: 0 2px 4px rgba(102,126,234,0.1);
        }
        .header .subtitle {
            color: #718096;
            font-size: 1.1em;
            font-style: italic;
        }
        .section {
            margin-bottom: 40px;
            padding: 30px;
            background: #f7fafc;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        .section h2 {
            color: #4a5568;
            font-size: 1.6em;
            font-weight: 800;
            margin-bottom: 25px;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            letter-spacing: 0.5px;
        }
        .section h2::before {
            content: '✨';
            font-size: 1.2em;
        }
        .profile-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .profile-item {
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
        }
        .profile-item strong {
            color: #667eea;
            display: block;
            margin-bottom: 5px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .number-highlight {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            text-align: center;
            margin: 20px 0;
            text-shadow: 0 2px 4px rgba(102,126,234,0.2);
        }
        .insight-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
            position: relative;
            line-height: 1.7;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 700px;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            hyphens: auto;
            white-space: normal;
        }
        .insight-box::before {
            content: '"';
            font-size: 4em;
            position: absolute;
            top: -10px;
            left: 15px;
            opacity: 0.3;
            font-family: serif;
        }
        .insight-box h3 {
            font-weight: 700;
            font-size: 1.3em;
            margin-top: 0;
            margin-bottom: 20px;
            color: #ffd700;
        }
        .insight-box p {
            margin-bottom: 15px;
            line-height: 1.8;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
            hyphens: auto;
            white-space: normal;
        }
        .insight-box strong {
            font-weight: 700;
            color: #ffd700;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .insight-box h3, .insight-box h4, .insight-box h5 {
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 100%;
            hyphens: auto;
            white-space: normal;
        }
        .prediction-list {
            list-style: none;
            padding: 0;
            margin: 25px 0;
        }
        .prediction-list li {
            background: white;
            margin: 15px 0;
            padding: 20px 25px;
            border-radius: 10px;
            border-left: 5px solid #667eea;
            position: relative;
            line-height: 1.7;
            word-wrap: break-word;
            overflow-wrap: break-word;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .prediction-list li::before {
            content: '💫';
            margin-right: 12px;
            font-size: 1.1em;
        }
        .prediction-list li strong {
            font-weight: 700;
            color: #667eea;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #edf2f7;
            color: #718096;
            font-style: italic;
        }
        .premium-badge {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #1a202c;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>Your SoulSketch Mystical Report</h1>
            <div class="subtitle">A Personalized Journey to Your Destined Love</div>
            <div style="margin-top: 15px; color: #a0aec0; font-size: 0.9em;">Generated on ${currentDate}</div>
            ${packageLevel === 'premium' ? '<div class="premium-badge">✨ Premium Report ✨</div>' : 
              packageLevel === 'plus' ? '<div class="premium-badge" style="background: linear-gradient(135deg, #667eea, #764ba2);">✨ Plus Report ✨</div>' : 
              '<div class="premium-badge" style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white;">✨ Basic Report ✨</div>'}
        </div>

        <div class="section">
            <h2>Understanding Life Path Numbers</h2>
            <p style="color: #4a5568; margin-bottom: 20px;">Life Path Numbers are calculated by adding all digits of your birth date and reducing to a single digit, except for Master Numbers (11, 22, 33, 44) which are not reduced further. These numbers reveal your soul's purpose and natural compatibility with others.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 25px 0;">
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 1</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Leaders & Innovators</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 2</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Peacemakers & Partners</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 3</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Creatives & Communicators</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 4</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Builders & Organizers</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 5</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Adventurers & Free Spirits</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 6</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Nurturers & Healers</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 7</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Seekers & Mystics</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 8</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Achievers & Executives</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                    <strong style="color: #667eea; display: block; margin-bottom: 8px;">Life Path 9</strong>
                    <div style="font-size: 0.85em; color: #4a5568;">Humanitarians & Visionaries</div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #ffd700, #ffed4e); padding: 20px; border-radius: 12px; margin: 20px 0; color: #1a202c;">
                <h3 style="margin-top: 0; color: #1a202c;">✨ Master Numbers - The Most Powerful Life Paths</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: rgba(255,255,255,0.3); padding: 15px; border-radius: 8px;">
                        <strong style="display: block; margin-bottom: 5px;">Life Path 11</strong>
                        <div style="font-size: 0.9em;">The Intuitive Illuminator</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.3); padding: 15px; border-radius: 8px;">
                        <strong style="display: block; margin-bottom: 5px;">Life Path 22</strong>
                        <div style="font-size: 0.9em;">The Master Builder</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.3); padding: 15px; border-radius: 8px;">
                        <strong style="display: block; margin-bottom: 5px;">Life Path 33</strong>
                        <div style="font-size: 0.9em;">The Master Teacher</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.3); padding: 15px; border-radius: 8px;">
                        <strong style="display: block; margin-bottom: 5px;">Life Path 44</strong>
                        <div style="font-size: 0.9em;">The Master Healer</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Your Personal Profile</h2>
            <div class="profile-grid">
                <div class="profile-item">
                    <strong>Name</strong>
                    ${orderData.name || 'Spiritual Seeker'}
                </div>
                <div class="profile-item">
                    <strong>Birth Date</strong>
                    ${orderData.birth_date || 'Not provided'}
                </div>
                <div class="profile-item">
                    <strong>Seeking</strong>
                    ${orderData.preferred_gender || 'Soul Connection'}
                </div>
                <div class="profile-item">
                    <strong>Age Preference</strong>
                    ${orderData.age_range || 'Open to destiny'}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Numerology Insights</h2>
            ${numerologyData?.lifePath?.number ? `
                <div class="number-highlight">Life Path ${numerologyData.lifePath.number}</div>
                <div class="insight-box">
                    ${numerologyData.lifePath.meaning}
                </div>
            ` : '<p style="text-align: center; color: #a0aec0; font-style: italic;">Birth date required for numerology calculation</p>'}
            
            ${numerologyData?.destiny?.number ? `
                <div class="number-highlight">Destiny ${numerologyData.destiny.number}</div>
                <div class="insight-box">
                    ${numerologyData.destiny.meaning}
                </div>
            ` : ''}
        </div>

        <div class="section">
            <h2>Astrological Profile</h2>
            ${astrologyData?.sign ? `
                <div class="profile-grid">
                    <div class="profile-item">
                        <strong>Sun Sign</strong>
                        ${astrologyData.sign}
                    </div>
                    <div class="profile-item">
                        <strong>Element</strong>
                        ${astrologyData.element || 'N/A'}
                    </div>
                </div>
                <div class="insight-box">
                    ${astrologyData.personality || 'Your astrological essence guides your romantic destiny.'}
                </div>
                ${astrologyData.compatibility ? `
                    <div style="margin-top: 20px;">
                        <strong style="color: #667eea;">Most Compatible Signs:</strong>
                        <p style="font-size: 1.1em; color: #4a5568;">${astrologyData.compatibility.join(', ')}</p>
                    </div>
                ` : ''}
            ` : '<p style="text-align: center; color: #a0aec0; font-style: italic;">Birth date required for astrological analysis</p>'}
        </div>

        <div class="section">
            <h2>Soulmate Predictions</h2>
            <p style="font-size: 1.1em; margin-bottom: 25px; color: #4a5568;">Based on your unique numerological and astrological profile, your destined soulmate likely possesses:</p>
            
            <ul class="prediction-list">
                ${personalizedPredictions && personalizedPredictions.basicPredictions 
                  ? personalizedPredictions.basicPredictions.map(prediction => `<li>${prediction}</li>`).join('\n                ')
                  : `<li><strong>A complementary life path</strong> that enhances your spiritual journey</li>
                <li><strong>Magnetic attraction</strong> based on your astrological compatibility</li>
                <li><strong>Shared values</strong> that align with your numerological destiny</li>
                <li><strong>Perfect timing</strong> orchestrated by the universe</li>
                <li><strong>Deep understanding</strong> of your authentic self</li>`
                }
            </ul>
            
            ${(packageLevel === 'plus' || packageLevel === 'premium') ? `
                <div class="insight-box" style="margin-top: 30px;">
                    <h3 style="margin-top: 0; color: #ffd700;">✨ Plus Insight: Location & Enhanced Analysis</h3>
                    <p><strong>Location Insights:</strong> ${personalizedPredictions?.locationInsight || `Your soulmate likely resides in a location that complements your energy - potentially in ${astrologyData?.element === 'Water' ? 'coastal areas or near water bodies' : astrologyData?.element === 'Fire' ? 'vibrant cities or sunny climates' : astrologyData?.element === 'Earth' ? 'grounded communities or nature-rich environments' : astrologyData?.element === 'Air' ? 'intellectual hubs or elevated locations' : 'places that resonate with your soul\'s calling'}.`}</p>
                    <p><strong>Enhanced Astrological Analysis:</strong> ${personalizedPredictions?.enhancedAstrology || (astrologyData?.sign ? `As a ${astrologyData.sign}, your ruling planetary influences suggest your soulmate will have strong ${astrologyData.element} energy characteristics, bringing ${astrologyData.element === 'Fire' ? 'passion and inspiration' : astrologyData.element === 'Earth' ? 'stability and grounding' : astrologyData.element === 'Air' ? 'intellectual stimulation and communication' : 'emotional depth and intuition'} to your connection.` : 'Deep astrological connections will guide you to your perfect match.')}</p>
                </div>
            ` : ''}
            
            ${packageLevel === 'premium' ? `
                <div class="insight-box" style="margin-top: 30px;">
                    <h3 style="margin-top: 0; color: #ffd700;">✨ Premium: Full AI Analysis & Strategy Guide</h3>
                    <div style="line-height: 1.8; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; width: 100%; box-sizing: border-box;">${personalizedPredictions && personalizedPredictions.premiumInsight 
                      ? formatPremiumInsight(personalizedPredictions.premiumInsight)
                      : '<p style="margin-bottom: 15px; word-wrap: break-word; overflow-wrap: break-word;">Your soulmate connection transcends the physical realm. The universe has been preparing this meeting through multiple lifetimes, aligning your energetic frequencies for the perfect moment of recognition. Trust in divine timing and remain open to unexpected encounters.</p>'
                    }</div>
                    
                    ${personalizedPredictions?.strategyGuide ? `
                    <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 8px; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; width: 100%; box-sizing: border-box;">
                        <h4 style="color: #ffd700; margin-top: 0; word-wrap: break-word; overflow-wrap: break-word;">Personal Relationship Strategy Guide:</h4>
                        <div style="color: white; line-height: 1.8; word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; width: 100%; box-sizing: border-box;">${formatPremiumInsight(personalizedPredictions.strategyGuide)}</div>
                    </div>
                    ` : `
                    <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                        <h4 style="color: #ffd700; margin-top: 0;">Personal Relationship Strategy Guide:</h4>
                        <ul style="color: white; margin: 0; padding-left: 20px;">
                            <li><strong>Optimal Meeting Times:</strong> ${astrologyData?.sign ? `During ${astrologyData.sign === 'Aries' || astrologyData.sign === 'Leo' || astrologyData.sign === 'Sagittarius' ? 'summer months and fire season celebrations' : astrologyData.sign === 'Taurus' || astrologyData.sign === 'Virgo' || astrologyData.sign === 'Capricorn' ? 'spring and harvest seasons' : astrologyData.sign === 'Gemini' || astrologyData.sign === 'Libra' || astrologyData.sign === 'Aquarius' ? 'intellectual gatherings and social events' : 'emotional full moons and water-related activities'}` : 'during spiritually significant times aligned with your energy'}</li>
                            <li><strong>Recognition Signs:</strong> You'll feel an immediate sense of "coming home" and notice synchronized life patterns</li>
                            <li><strong>Approach Strategy:</strong> Lead with authenticity and trust your intuitive first impressions</li>
                            <li><strong>Relationship Development:</strong> Focus on spiritual growth together and embrace your complementary life paths</li>
                        </ul>
                    </div>
                    `}
                </div>
            ` : ''}
        </div>

        ${packageLevel === 'premium' ? `
        <div class="section">
            <h2>Complete Cosmic Profile</h2>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #ffd700;">✨ Your Complete Cosmic Blueprint</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                        <h4 style="color: #ffd700; margin-top: 0;">Soul Contract</h4>
                        <p style="margin: 0;">You've incarnated to ${numerologyData?.lifePath?.number ? `fulfill a Life Path ${numerologyData.lifePath.number} destiny` : 'discover your true spiritual purpose'}, which directly influences your soulmate selection.</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                        <h4 style="color: #ffd700; margin-top: 0;">Karmic Connections</h4>
                        <p style="margin: 0;">${astrologyData?.sign ? `Your ${astrologyData.sign} energy` : 'Your soul signature'} indicates past-life connections that will feel instantly familiar and deeply meaningful.</p>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="color: #ffd700; margin-top: 0;">Divine Timeline Activation</h4>
                    <p>The cosmos has perfectly orchestrated your paths to intersect. Your soulmate is currently experiencing their own spiritual awakening that will align them with your frequency. Trust that divine timing is already in motion.</p>
                    
                    <div style="margin-top: 15px;">
                        <strong style="color: #ffd700;">Key Activation Periods:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>During major life transitions and personal growth phases</li>
                            <li>When you're authentically expressing your true self</li>
                            <li>In moments of spiritual practice and higher consciousness</li>
                            <li>${astrologyData?.sign ? `During ${astrologyData.sign} season and related astrological events` : 'During spiritually significant celestial alignments'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>✨ May this reading guide you to your destined love ✨</p>
            <p>Order ID: ${orderData.id}</p>
        </div>
    </div>
</body>
</html>`;

    return content;
  }

  // Basic health check endpoint
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create order
  router.post('/orders', (req, res) => {
    try {
      const { email, name, gender, preferred_gender, age_range, hair_color, eye_color, 
              personality_traits, hobbies, birth_date, birth_time, birth_city, package: packageType } = req.body;

      const orderId = `order_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
      
      const order = {
        id: orderId,
        email: email || '',
        name: name || '',
        gender: gender || '',
        preferred_gender: preferred_gender || 'any',
        age_range,
        hair_color,
        eye_color, 
        personality_traits,
        hobbies,
        birth_date: birth_date || '',
        birth_time: birth_time || '',
        birth_city: birth_city || '',
        package: packageType || 'premium',
        status: 'created',
        created_at: new Date().toISOString()
      };

      orders.set(orderId, order);
      
      console.log('Order created:', order);
      
      res.json({ 
        id: orderId,
        status: 'created',
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Submit intake data
  router.post('/orders/:orderId/intake', upload.single('photo'), (req, res) => {
    try {
      const { orderId } = req.params;
      const order = orders.get(orderId);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Parse quiz data
      let quizData = {};
      if (req.body.quiz) {
        try {
          quizData = typeof req.body.quiz === 'string' ? JSON.parse(req.body.quiz) : req.body.quiz;
        } catch (e) {
          quizData = req.body; // Fallback to direct body parsing
        }
      } else {
        quizData = req.body;
      }

      // Update order with quiz data
      Object.assign(order, {
        ...quizData,
        photo_path: req.file ? req.file.path : null,
        intake_submitted: true,
        updated_at: new Date().toISOString()
      });

      orders.set(orderId, order);
      
      console.log('📋 Intake submitted for order:', orderId);
      console.log('📊 Quiz data captured:', {
        personality_traits: quizData.personality_traits,
        hobbies: quizData.hobbies,
        interests: quizData.interests,
        preferences: quizData.preferences,
        totalKeys: Object.keys(quizData).length
      });
      console.log('✅ Final order data keys:', Object.keys(order));
      
      res.json({ 
        status: 'intake_received',
        message: 'Quiz data and photo received successfully'
      });
    } catch (error) {
      console.error('Error processing intake:', error);
      res.status(500).json({ error: 'Failed to process intake data' });
    }
  });

  // Generate soulmate
  router.post('/orders/:orderId/generate', async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = orders.get(orderId);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log('Generation requested for order:', orderId);

      // Calculate numerology if birth data available
      let numerologyData = null;
      if (order.birth_date) {
        console.log(`🔢 Starting Life Path calculation for ${order.name} with birth date: ${order.birth_date}`);
        
        // Use traditional calculation as primary method (now fixed and accurate)
        const traditionalResult = calculateLifePathNumberTraditional(order.birth_date);
        console.log(`🔢 Traditional Life Path result: ${traditionalResult}`);
        
        // Use traditional result as it's now correctly handling Master Numbers
        let lifePathNumber = traditionalResult;
        console.log(`✅ Using traditional calculation result: ${lifePathNumber}`);
        
        // Optional: Use AI for verification in the future if needed
        // For now, traditional method is reliable and faster
        
        const destinyNumber = calculateDestinyNumber(order.name || 'Unknown');
        const soulUrgeNumber = calculateSoulUrgeNumber(order.name || 'Unknown');
        const personalYear = calculatePersonalYear(order.birth_date);
        numerologyData = generateNumerologyInsights(lifePathNumber, destinyNumber, soulUrgeNumber, personalYear);
        
        // Log the final result for verification
        console.log(`✅ Final Life Path calculation for ${order.name}: ${lifePathNumber} (birth: ${order.birth_date})`);
      }

      // Calculate astrology if birth data available
      let astrologyData = null;
      if (order.birth_date) {
        const zodiacSign = getZodiacSign(order.birth_date);
        astrologyData = generateAstrologyInsights(zodiacSign, order.birth_time, order.birth_city);
      }

      // Calculate soulmate age
      const soulmateAge = order.birth_date ? calculateSoulmateAge(order.birth_date) : 25;

      // Generate AI image
      const imageResult = await generateSoulmateImage(order, numerologyData, astrologyData, soulmateAge);

      // Generate PDF report
      const pdfPath = await generatePDFReport(order, numerologyData, astrologyData, imageResult.imagePath, order.package);

      // Create profile text
      let profileText = `Your Soulmate Profile:\n\n`;
      
      if (numerologyData) {
        profileText += `Numerology reveals your life path number ${numerologyData.lifePath.number}, indicating ${numerologyData.lifePath.meaning.toLowerCase()}.\n\n`;
      }
      
      if (astrologyData) {
        profileText += `As a ${astrologyData.sign}, your ideal match shares ${astrologyData.element} element compatibility and resonates with your ${astrologyData.personality.toLowerCase()}.\n\n`;
      }
      
      profileText += `Your soulmate is approximately ${soulmateAge} years old and embodies the perfect complement to your spiritual journey.`;

      // Update order
      order.status = 'completed';
      order.generation_completed = true;
      order.image_path = imageResult.imagePath;
      order.pdf_path = pdfPath;
      order.profile_text = profileText;
      order.numerology_data = numerologyData;
      order.astrology_data = astrologyData;
      order.completed_at = new Date().toISOString();
      
      orders.set(orderId, order);

      // Convert image path to API URL
      const imageFilename = path.basename(imageResult.imagePath);
      const imageApiUrl = `/api/images/${imageFilename}`;

      res.json({
        success: true,
        message: 'Generation completed',
        result: {
          sketch_url: imageApiUrl,
          story_url: pdfPath
        },
        status: 'completed',
        imagePath: imageApiUrl,
        pdfPath: pdfPath,
        profileText: profileText,
        numerologyInsights: numerologyData,
        astrologyInsights: astrologyData
      });

    } catch (error) {
      console.error('Error generating soulmate:', error);
      res.status(500).json({ 
        error: 'Failed to generate soulmate sketch',
        details: error.message 
      });
    }
  });

  // Get order status
  router.get('/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  });

  // Get PDF report for an order
  router.get('/orders/:orderId/report', async (req, res) => {
    console.log('Report endpoint hit for orderId:', req.params.orderId);
    try {
      const { orderId } = req.params;
      const order = orders.get(orderId);
      
      console.log('Order found:', !!order);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Handle case where pdf_path doesn't exist or file is missing
      let shouldRegenerate = false;
      let reportPath = order.pdf_path;
      
      if (!order.pdf_path) {
        shouldRegenerate = true;
      } else {
        const fullPath = path.join(process.cwd(), order.pdf_path);
        const fileExists = await fs.promises.access(fullPath).then(() => true).catch(() => false);
        if (!fileExists) {
          shouldRegenerate = true;
        }
      }
      
      if (shouldRegenerate) {
        console.log('Regenerating report with AI predictions for order:', orderId);
        
        // Regenerate the report with AI predictions
        const numerologyData = order.numerology_data || calculateNumerology(order.birth_date);
        const astrologyData = order.astrology_data || calculateAstrology(order.birth_date);
        
        // Generate new report with AI predictions
        const newReportPath = await generatePDFReport(order, numerologyData, astrologyData, order.image_path, order.package);
        
        // Update the order with the new report path
        order.pdf_path = newReportPath;
        reportPath = newReportPath;
      }
      
      
      // Serve the HTML report
      const finalPath = path.join(process.cwd(), reportPath);
      const content = await fs.promises.readFile(finalPath, 'utf8');
      
      // Set appropriate headers for HTML rendering
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="soulmate-report-${orderId}.html"`);
      
      res.send(content);
    } catch (error) {
      console.error('Error serving report:', error);
      res.status(500).json({ error: 'Failed to serve report' });
    }
  });

  // Serve generated images
  router.get('/images/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const imagePath = path.join(process.cwd(), 'uploads', filename);
      
      // Check if file exists and is safe to serve
      if (!await fs.promises.access(imagePath).then(() => true).catch(() => false)) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Serve the image
      res.sendFile(path.resolve(imagePath));
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ error: 'Failed to serve image' });
    }
  });

  // Create payment intent endpoint
  router.post('/payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'usd', metadata } = req.body;
      
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        metadata
      });
      
      res.json(paymentIntent);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });
  
  return router;
}