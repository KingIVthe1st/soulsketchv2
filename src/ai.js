import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-replace-me');
const openai = hasOpenAIKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateProfileText({ quiz, tier, addons }) {
	const prompt = `You are "Soulmate Sketch" AI. Create a polished, production-ready soulmate profile grounded in the user's answers. Write in clear sections with short headings and skimmable formatting. Avoid medical or deterministic claims. Length ~400–550 words.

Required sections (use these headings exactly):
- Overview
- Personality & Vibe
- Attachment Style & Love Languages
- First Meeting Scenario
- What They're Looking For Now
- Numerology/Astro Notes (only if relevant)

Tone: warm, contemporary, romantic-but-grounded. Output plain text (no markdown symbols like # or *).

Context:
User Answers: ${JSON.stringify(quiz)}
Tier: ${tier}
Addons: ${JSON.stringify(addons)}

Additional guidance:
- Subtly reflect the user's vibe keywords in the way you describe setting, style, and energy.
- Keep names plausible and culturally neutral unless the user's answers suggest otherwise.
- Keep it uplifting and specific, but never absolute. Include an ethical, reflective framing.

If Add-ons include any of the following, add corresponding sections with actionable, specific but gentle insights:
- If contains "aura": include a section titled "Aura Reading" describing color impressions and what they symbolize for connection dynamics (avoid medical language).
- If contains "twin_flame": include a section titled "Twin Flame Insight" focusing on mirroring lessons and growth, not guarantees.
- If contains "past_life": include a section titled "Past Life Glimpse" offering an evocative narrative thread that complements, not predicts.
When add-ons are not selected, do not include those sections.`;
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
  const styleMap = {
		realistic: 'hyper-realistic portrait photography, natural skin texture, studio-grade lighting, 85mm lens, shallow depth of field, precise color grading',
		ethereal: 'ethereal but realistic portrait, soft glow, celestial accents, pastel tones, natural skin texture, subtle bokeh',
		anime: 'anime style character portrait, clean lines, studio quality, detailed eyes',
		mystical: 'mystical but realistic portrait, arcane accents, cinematic light, painterly color grading'
  };
	const stylePrompt = styleMap[style] || styleMap.ethereal;
	const gender = (quiz && quiz.interest) ? (quiz.interest === 'male' ? 'male adult' : (quiz.interest === 'female' ? 'female adult' : 'adult person')) : 'adult person';
	const vibe = (quiz && quiz.vibes) ? `Reflect these vibe cues: ${quiz.vibes}.` : '';
	const setting = (quiz && quiz.vibes) ? 'Place the subject in a subtle, context-appropriate setting inspired by those vibes (e.g., cozy cafe, golden-hour park, artful studio), without clutter.' : 'Use a tasteful, softly lit studio or natural background.';
	const celeb = (quiz && quiz.celeb) ? `Inspiration: channel general aesthetic energy similar to ${quiz.celeb}, but avoid resemblance.` : '';
	const auraHint = Array.isArray(addons) && addons.includes('aura') ? 'Add a very subtle, realistic aura-like rim light in a complementary color around the hair/shoulders (barely noticeable, tasteful).' : '';
	const twinFlameHint = Array.isArray(addons) && addons.includes('twin_flame') ? 'Optionally, include a faint twin-bokeh highlight in the background that gently suggests duality (keep it photographic and unobtrusive).' : '';
	const basePrompt = `Create a single portrait image of a ${gender} as the user's ideal soulmate derived from their answers. ${vibe} ${setting} ${celeb}

Image goals:
- Hyper-realism: photorealistic skin, pores, flyaway hairs, realistic eyes and lighting.
- Attractive but natural: symmetrical features, flattering angles, genuine warmth.
- Skin tone: choose a realistic tone that fits the context; avoid bias or defaulting to one complexion. Do not lighten or darken unnaturally.
- Composition: waist-up portrait, cinematic framing, soft depth of field, gentle rim light.
- Lighting: soft natural or studio key light; avoid harsh flash.
- Background: clean and tasteful; add subtle environmental hints from the vibes.
 - Camera: 85mm portrait lens look, f/2.0 depth of field, high dynamic range, RAW-like fidelity, sRGB color space, color science by Kodak Portra 400.
 - Detail: photoreal skin shading and subsurface scattering, catchlights in the eyes, accurate hair strands, soft imperfect texture.
 - Composition rules: rule of thirds, gentle head tilt, shoulders slightly turned, subject fills frame without cropping the crown.

Strictly avoid: cartoonish looks, plastic skin, heavy airbrushing, distorted anatomy, exaggerated features, fantasy species, minors, weapons, text overlays, logos, watermarks, signatures.
 Negative prompt: disfigured, blurry, extra fingers, deformed, cloned face, watermark, lowres, oversaturated skin, plastic sheen, waxy texture, uncanny valley, text artifacts.

${auraHint} ${twinFlameHint}
${stylePrompt}`;
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
        model: 'gpt-image-1',
        prompt: basePrompt,
        size: '1024x1024'
      });
      const b64 = image.data[0].b64_json;
      buffer = Buffer.from(b64, 'base64');
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
		'Numerology/Astro Notes': ''
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

	// Add-on sections, only if selected
	if (Array.isArray(addons) && addons.includes('aura')) {
		writeSection('Aura Reading', 'Your aura presents as a complementary color field around your connection: balanced, inviting, and warm. Expect chemistry that feels calming yet energizing.');
	}
	if (Array.isArray(addons) && addons.includes('twin_flame')) {
		writeSection('Twin Flame Insight', 'There is a mirror dynamic that encourages growth through gentle reflection. Lean into clear communication and shared rituals to harmonize intensity.');
	}
	if (Array.isArray(addons) && addons.includes('past_life')) {
		writeSection('Past Life Glimpse', 'An echo suggests a prior bond shaped by loyalty and unfinished conversation. In this life, the lesson is to openly voice needs and celebrate progress, not perfection.');
	}

  // Disclaimer
	doc.moveDown(1);
	doc.fontSize(9).fillColor('#666').text('This experience is for inspiration and reflection. It does not promise outcomes or provide medical or professional advice.', { align: 'left' });

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
}
