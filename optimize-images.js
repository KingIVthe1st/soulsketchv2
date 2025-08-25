#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Image Optimization Script for SoulSketch
 * Converts large images to WebP format and optimizes sizes
 */

const IMAGE_DIR = './public/images';
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const WEBP_QUALITY = 85;
const JPEG_QUALITY = 90;

async function optimizeImage(inputPath, outputPath, format = 'webp') {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    console.log(`📸 Processing: ${inputPath} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
    
    let pipeline = sharp(inputPath)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      });
    
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality: WEBP_QUALITY });
    } else if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9, progressive: true });
    }
    
    await pipeline.toFile(outputPath);
    
    const newStats = fs.statSync(outputPath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize) * 100;
    
    console.log(`✅ Optimized: ${outputPath} (${(newSize / 1024 / 1024).toFixed(2)}MB, ${savings.toFixed(1)}% smaller)`);
    
    return { originalSize, newSize, savings };
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
    return null;
  }
}

async function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let totalSavings = 0;
  let originalTotal = 0;
  let newTotal = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subResults = await processDirectory(fullPath);
      totalSavings += subResults.totalSavings;
      originalTotal += subResults.originalTotal;
      newTotal += subResults.newTotal;
      continue;
    }
    
    const ext = path.extname(file.name).toLowerCase();
    const name = path.basename(file.name, ext);
    
    // Skip if already optimized
    if (name.endsWith('-optimized') || name.endsWith('.webp')) {
      continue;
    }
    
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const stats = fs.statSync(fullPath);
      
      // Only optimize files larger than 500KB
      if (stats.size > 500 * 1024) {
        // Create WebP version
        const webpPath = path.join(dir, `${name}.webp`);
        const webpResult = await optimizeImage(fullPath, webpPath, 'webp');
        
        if (webpResult) {
          totalSavings += webpResult.originalSize - webpResult.newSize;
          originalTotal += webpResult.originalSize;
          newTotal += webpResult.newSize;
        }
        
        // Also create optimized original format
        const optimizedPath = path.join(dir, `${name}-optimized${ext}`);
        const originalResult = await optimizeImage(fullPath, optimizedPath, ext.substring(1));
        
        if (originalResult) {
          console.log(`💡 Consider replacing ${file.name} with ${name}-optimized${ext} or ${name}.webp`);
        }
      }
    }
  }
  
  return { totalSavings, originalTotal, newTotal };
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');
  
  try {
    const results = await processDirectory(IMAGE_DIR);
    
    console.log('\n📊 Optimization Summary:');
    console.log(`💾 Total space saved: ${(results.totalSavings / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📉 Size reduction: ${(results.totalSavings / results.originalTotal * 100).toFixed(1)}%`);
    console.log(`📁 Original total: ${(results.originalTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📁 New total: ${(results.newTotal / 1024 / 1024).toFixed(2)}MB`);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Update HTML/CSS to use .webp images with .jpg/.png fallbacks');
    console.log('2. Consider replacing large original files with optimized versions');
    console.log('3. Set up proper image lazy loading');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }
}

// Run optimization
main().catch(console.error);