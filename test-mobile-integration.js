#!/usr/bin/env node

/**
 * Mobile Integration Testing Script
 * Tests Apple Pay and mobile optimization functionality
 */

import fs from 'fs';
import path from 'path';

console.log('🔄 Testing Mobile Integration & Apple Pay Setup...\n');

const testResults = {
  mobileCSS: false,
  applePay: false,
  viewport: false,
  touchTargets: false,
  performance: false
};

// Test 1: Mobile CSS Integration
console.log('1️⃣ Testing Mobile CSS Integration...');
try {
  const orderHtml = fs.readFileSync('./public/order.html', 'utf8');
  
  if (orderHtml.includes('mobile-optimized.css')) {
    console.log('   ✅ Mobile CSS properly linked');
    testResults.mobileCSS = true;
  } else {
    console.log('   ❌ Mobile CSS not found');
  }
  
  if (orderHtml.includes('viewport-fit=cover')) {
    console.log('   ✅ Enhanced viewport configured for iPhone X+');
    testResults.viewport = true;
  } else {
    console.log('   ❌ Enhanced viewport not configured');
  }
} catch (error) {
  console.log('   ❌ Error reading order.html:', error.message);
}

// Test 2: Apple Pay Integration
console.log('\n2️⃣ Testing Apple Pay Integration...');
try {
  const applePayJs = fs.readFileSync('./public/js/apple-pay.js', 'utf8');
  const orderHtml = fs.readFileSync('./public/order.html', 'utf8');
  
  if (orderHtml.includes('apple-pay-button') && applePayJs.includes('ApplePayService')) {
    console.log('   ✅ Apple Pay service properly integrated');
    testResults.applePay = true;
  } else {
    console.log('   ❌ Apple Pay integration incomplete');
  }
  
  if (applePayJs.includes('merchant.com.soulmatesketch')) {
    console.log('   ✅ Merchant identifier configured');
  } else {
    console.log('   ❌ Merchant identifier not configured');
  }
} catch (error) {
  console.log('   ❌ Error reading Apple Pay files:', error.message);
}

// Test 3: Touch Target Optimization
console.log('\n3️⃣ Testing Touch Target Optimization...');
try {
  const mobileCSS = fs.readFileSync('./public/css/mobile-optimized.css', 'utf8');
  
  if (mobileCSS.includes('min-height: 44px') && mobileCSS.includes('touch-action: manipulation')) {
    console.log('   ✅ Touch targets optimized (44px minimum)');
    testResults.touchTargets = true;
  } else {
    console.log('   ❌ Touch targets not properly optimized');
  }
  
  if (mobileCSS.includes('font-size: 16px') && mobileCSS.includes('Prevents zoom on iOS')) {
    console.log('   ✅ iOS zoom prevention configured');
  } else {
    console.log('   ❌ iOS zoom prevention not configured');
  }
} catch (error) {
  console.log('   ❌ Error reading mobile CSS:', error.message);
}

// Test 4: Performance Optimizations
console.log('\n4️⃣ Testing Performance Optimizations...');
try {
  const orderHtml = fs.readFileSync('./public/order.html', 'utf8');
  
  if (orderHtml.includes('dns-prefetch') && orderHtml.includes('preconnect')) {
    console.log('   ✅ DNS prefetch and preconnect configured');
    testResults.performance = true;
  } else {
    console.log('   ❌ Performance optimizations not configured');
  }
  
  if (orderHtml.includes('js.stripe.com')) {
    console.log('   ✅ Stripe resources preloaded');
  } else {
    console.log('   ❌ Stripe resources not preloaded');
  }
} catch (error) {
  console.log('   ❌ Error checking performance optimizations:', error.message);
}

// Test 5: Backend API Integration
console.log('\n5️⃣ Testing Backend API Integration...');
try {
  const routesJs = fs.readFileSync('./src/routes.js', 'utf8');
  
  if (routesJs.includes('/api/applepay/validate-merchant') && routesJs.includes('/api/process-apple-pay')) {
    console.log('   ✅ Apple Pay API endpoints configured');
  } else {
    console.log('   ❌ Apple Pay API endpoints missing');
  }
} catch (error) {
  console.log('   ❌ Error reading routes.js:', error.message);
}

// Summary
console.log('\n📊 MOBILE INTEGRATION TEST RESULTS');
console.log('=====================================');

const passed = Object.values(testResults).filter(Boolean).length;
const total = Object.keys(testResults).length;
const percentage = Math.round((passed / total) * 100);

console.log(`✅ Tests Passed: ${passed}/${total} (${percentage}%)`);

if (percentage >= 80) {
  console.log('🎉 EXCELLENT: Mobile integration is ready for testing!');
} else if (percentage >= 60) {
  console.log('⚠️  GOOD: Mobile integration needs minor adjustments');
} else {
  console.log('❌ NEEDS WORK: Mobile integration requires attention');
}

console.log('\n🚀 NEXT STEPS:');
console.log('1. Test on actual iOS device with Safari');
console.log('2. Verify Apple Pay button appears (requires iOS device)');
console.log('3. Test touch interactions and responsiveness');
console.log('4. Complete Stripe Apple Pay setup in production');
console.log('5. Configure Apple Developer merchant ID');

console.log('\n📱 MOBILE TEST SUITE: http://localhost:50733/mobile-test.html');
console.log('📋 APPLE PAY SETUP GUIDE: ./APPLE_PAY_SETUP_GUIDE.md\n');