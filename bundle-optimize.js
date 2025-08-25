#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

/**
 * Simple CSS/JS Bundle and Optimization Script
 * Creates optimized bundles for better performance
 */

const PUBLIC_DIR = './public';
const CSS_DIR = path.join(PUBLIC_DIR, 'css');
const JS_DIR = path.join(PUBLIC_DIR, 'js');

// Critical CSS files in load order
const CRITICAL_CSS = [
  'bootstrap.min.css',
  'all.min.css',
  'animate.css',
  'swiper-bundle.min.css',
  'magnific-popup.css',
  'slicknav.min.css',
  'mousecursor.css'
];

// Critical JS files in load order
const CRITICAL_JS = [
  'jquery-3.7.1.min.js',
  'bootstrap.min.js',
  'validator.min.js',
  'jquery.slicknav.js',
  'swiper-bundle.min.js',
  'jquery.waypoints.min.js',
  'jquery.counterup.min.js',
  'jquery.magnific-popup.min.js',
  'parallaxie.js',
  'magiccursor.js'
];

// Non-critical (deferred) JS files
const DEFERRED_JS = [
  'gsap.min.js',
  'ScrollTrigger.min.js',
  'SplitText.js',
  'SmoothScroll.js',
  'wow.min.js',
  'function.js',
  'custom.js'
];

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/;\s*}/g, '}') // Remove semicolon before }
    .replace(/\s*{\s*/g, '{') // Clean up around {
    .replace(/;\s*/g, ';') // Clean up around ;
    .replace(/:\s*/g, ':') // Clean up around :
    .replace(/,\s*/g, ',') // Clean up around ,
    .trim();
}

function minifyJS(js) {
  // Basic minification - remove comments and unnecessary whitespace
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/;\s*}/g, ';}') // Clean up around ;}
    .replace(/\s*{\s*/g, '{') // Clean up around {
    .replace(/\s*}\s*/g, '}') // Clean up around }
    .replace(/;\s*/g, ';') // Clean up around ;
    .trim();
}

async function bundleFiles(files, sourceDir, outputPath, minifier) {
  console.log(`📦 Creating bundle: ${outputPath}`);
  
  let combinedContent = '';
  let totalOriginalSize = 0;
  let foundFiles = 0;
  
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      totalOriginalSize += content.length;
      combinedContent += `\n/* === ${file} === */\n`;
      combinedContent += content;
      foundFiles++;
      console.log(`  ✅ Added: ${file} (${(content.length / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`  ⚠️  Not found: ${file}`);
    }
  }
  
  if (combinedContent) {
    // Minify combined content
    const minifiedContent = minifier ? minifier(combinedContent) : combinedContent;
    
    // Write bundle
    fs.writeFileSync(outputPath, minifiedContent);
    
    const finalSize = minifiedContent.length;
    const savings = ((totalOriginalSize - finalSize) / totalOriginalSize) * 100;
    
    console.log(`  📊 Bundle created: ${(finalSize / 1024).toFixed(1)}KB`);
    console.log(`  💾 Size reduction: ${savings.toFixed(1)}% (${foundFiles} files)`);
    
    return { originalSize: totalOriginalSize, finalSize, files: foundFiles };
  }
  
  return null;
}

async function createBundles() {
  console.log('🚀 Starting CSS/JS optimization...\n');
  
  try {
    // Create bundles directory
    const bundleDir = path.join(PUBLIC_DIR, 'bundles');
    fs.mkdirSync(bundleDir, { recursive: true });
    
    // Bundle critical CSS
    const cssResult = await bundleFiles(
      CRITICAL_CSS,
      CSS_DIR,
      path.join(bundleDir, 'critical.min.css'),
      minifyCSS
    );
    
    console.log();
    
    // Bundle critical JS
    const jsResult = await bundleFiles(
      CRITICAL_JS,
      JS_DIR,
      path.join(bundleDir, 'critical.min.js'),
      minifyJS
    );
    
    console.log();
    
    // Bundle deferred JS
    const deferredResult = await bundleFiles(
      DEFERRED_JS,
      JS_DIR,
      path.join(bundleDir, 'deferred.min.js'),
      minifyJS
    );
    
    console.log('\n📊 Optimization Summary:');
    
    if (cssResult) {
      console.log(`CSS Bundle: ${(cssResult.finalSize / 1024).toFixed(1)}KB (${cssResult.files} files)`);
    }
    
    if (jsResult) {
      console.log(`Critical JS: ${(jsResult.finalSize / 1024).toFixed(1)}KB (${jsResult.files} files)`);
    }
    
    if (deferredResult) {
      console.log(`Deferred JS: ${(deferredResult.finalSize / 1024).toFixed(1)}KB (${deferredResult.files} files)`);
    }
    
    const totalOriginal = (cssResult?.originalSize || 0) + (jsResult?.originalSize || 0) + (deferredResult?.originalSize || 0);
    const totalFinal = (cssResult?.finalSize || 0) + (jsResult?.finalSize || 0) + (deferredResult?.finalSize || 0);
    const totalSavings = ((totalOriginal - totalFinal) / totalOriginal) * 100;
    
    console.log(`\nTotal: ${(totalFinal / 1024).toFixed(1)}KB (was ${(totalOriginal / 1024).toFixed(1)}KB)`);
    console.log(`Savings: ${totalSavings.toFixed(1)}%`);
    
    // Create sample HTML usage
    const sampleHTML = `
<!-- Replace multiple CSS files with single bundle -->
<link href="bundles/critical.min.css" rel="stylesheet" media="screen" />

<!-- Replace multiple JS files with bundles -->
<script src="bundles/critical.min.js"></script>
<script src="bundles/deferred.min.js" defer></script>

<!-- Keep custom CSS last -->
<link href="css/custom.css" rel="stylesheet" media="screen" />
<script src="js/custom.js" defer></script>
    `.trim();
    
    fs.writeFileSync(path.join(bundleDir, 'usage-example.html'), sampleHTML);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Update HTML files to use bundles instead of individual files');
    console.log('2. Test functionality with bundled files');
    console.log('3. Set up proper cache headers for bundle files');
    console.log('4. See bundles/usage-example.html for implementation');
    
  } catch (error) {
    console.error('❌ Bundle creation failed:', error);
    process.exit(1);
  }
}

// Add gzip estimation
function estimateGzipSize(content) {
  // Rough estimation: gzip typically reduces text by 60-80%
  return content.length * 0.3;
}

// Run bundling
main().catch(console.error);

async function main() {
  await createBundles();
  
  // Show gzip estimates
  console.log('\n🗜️  Estimated Gzipped Sizes:');
  
  const bundleDir = path.join(PUBLIC_DIR, 'bundles');
  
  ['critical.min.css', 'critical.min.js', 'deferred.min.js'].forEach(file => {
    const filePath = path.join(bundleDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const gzipEstimate = estimateGzipSize(content);
      console.log(`${file}: ~${(gzipEstimate / 1024).toFixed(1)}KB gzipped`);
    }
  });
}