import express from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { getDb } from './db.js';
import { getPriceCentsForTier } from './payments.js';
import { generateProfileText, generateImage, generatePdf } from './ai.js';

const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

export function createRouter() {
  const router = express.Router();
  const db = getDb();

  router.post('/orders', (req, res) => {
    const { email, tier = 'premium', addons = [] } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const id = randomUUID();
    const now = new Date().toISOString();
    const price = getPriceCentsForTier(tier);
    db.prepare(`INSERT INTO orders (id, email, tier, addons, status, created_at, updated_at, price_cents, currency) VALUES (?, ?, ?, ?, 'created', ?, ?, ?, 'usd')`)
      .run(id, email, tier, JSON.stringify(addons), now, now, price);
    res.json({ id, price_cents: price, currency: 'usd' });
  });

  router.post('/orders/:id/intake', upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'not found' });

    let photoPath = order.photo_path;
    if (req.file) {
      photoPath = path.join('uploads', `${id}_photo${path.extname(req.file.originalname) || ''}`);
      fs.renameSync(req.file.path, path.join(process.cwd(), photoPath));
    }

    const quiz = JSON.parse(req.body.quiz || '{}');
    db.prepare('UPDATE orders SET photo_path = ?, quiz_answers = ?, updated_at = ? WHERE id = ?')
      .run(photoPath, JSON.stringify(quiz), new Date().toISOString(), id);

    res.json({ ok: true });
  });

  router.post('/orders/:id/generate', async (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'not found' });

    try {
      const quiz = JSON.parse(order.quiz_answers || '{}');
      const addons = JSON.parse(order.addons || '[]');

      const [text] = await Promise.all([
        generateProfileText({ quiz, tier: order.tier, addons })
      ]);

      const { filePath, sharePath } = await generateImage({ style: quiz.style || 'ethereal', quiz, addons });

      const pdfPath = path.join(process.cwd(), 'uploads', `${id}_report.pdf`);
      await generatePdf({ text, imagePath: filePath, outPath: pdfPath, addons });

      db.prepare('UPDATE orders SET result_image_path = ?, result_pdf_path = ?, status = ?, updated_at = ? WHERE id = ?')
        .run(filePath, pdfPath, 'delivered', new Date().toISOString(), id);

      res.json({ 
        imagePath: `uploads/${path.basename(filePath)}`, 
        sharePath: sharePath ? `uploads/${path.basename(sharePath)}` : null, 
        pdfPath: `uploads/${path.basename(pdfPath)}`,
        profileText: text
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'generation_failed' });
    }
  });

  router.get('/orders/:id', (req, res) => {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'not found' });
    res.json(order);
  });

  return router;
}
