#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

/**
 * Mobile Performance Optimization Script
 * Analyzes and optimizes mobile experience
 */

const PUBLIC_DIR = './public';

// Mobile optimization recommendations
const MOBILE_OPTIMIZATIONS = {
  // Critical mobile viewport fixes
  viewport: {
    recommended: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
    current: 'width=device-width, initial-scale=1.0, maximum-scale=1'
  },
  
  // Mobile-first CSS
  criticalCSS: [
    '/* Mobile-first critical styles */',
    '.mobile-optimized {',
    '  /* Faster animations on mobile */',
    '  animation-duration: 0.2s !important;',
    '  transition-duration: 0.2s !important;',
    '}',
    '',
    '/* Reduce motion for better performance */',
    '@media (prefers-reduced-motion: reduce) {',
    '  * {',
    '    animation-duration: 0.01ms !important;',
    '    animation-iteration-count: 1 !important;',
    '    transition-duration: 0.01ms !important;',
    '  }',
    '}',
    '',
    '/* Touch-friendly buttons */',
    '.btn, button, [role="button"] {',
    '  min-height: 44px;',
    '  min-width: 44px;',
    '  touch-action: manipulation;',
    '}',
    '',
    '/* Optimize tap targets */',
    '@media (max-width: 768px) {',
    '  .btn {',
    '    padding: 12px 24px;',
    '    font-size: 16px; /* Prevents zoom on iOS */',
    '  }',
    '  ',
    '  input, select, textarea {',
    '    font-size: 16px; /* Prevents zoom on iOS */',
    '  }',
    '}',
    '',
    '/* Improve scroll performance */',
    '* {',
    '  -webkit-overflow-scrolling: touch;',
    '}',
    '',
    '/* GPU acceleration for animations */',
    '.animate, .wow {',
    '  transform: translateZ(0);',
    '  backface-visibility: hidden;',
    '  perspective: 1000px;',
    '}',
    '',
    '/* Hide decorative elements on small screens */',
    '@media (max-width: 480px) {',
    '  .parallax-bg, .decorative-element {',
    '    display: none !important;',
    '  }',
    '}',
    ''
  ].join('\n'),
  
  // Performance improvements
  prefetch: [
    '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
    '<link rel="dns-prefetch" href="//js.stripe.com">',
    '<link rel="preconnect" href="https://js.stripe.com" crossorigin>'
  ]
};

// Apple Pay configuration
const APPLE_PAY_CONFIG = {
  merchantIdentifier: 'merchant.com.soulmatesketch', // Replace with actual merchant ID
  supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
  merchantCapabilities: ['supports3DS'],
  supportedCountries: ['US', 'CA', 'GB', 'AU']
};

function analyzePagePerformance(htmlPath) {
  console.log(`📱 Analyzing mobile performance: ${path.basename(htmlPath)}`);
  
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const issues = [];
  const suggestions = [];
  
  // Check viewport
  const viewportMatch = content.match(/<meta[^>]*name="viewport"[^>]*content="([^"]*)"[^>]*>/);
  if (!viewportMatch) {
    issues.push('❌ Missing viewport meta tag');
  } else if (!viewportMatch[1].includes('viewport-fit=cover')) {
    suggestions.push('💡 Add viewport-fit=cover for iPhone X+ support');
  }
  
  // Check for mobile-unfriendly patterns
  if (content.includes('maximum-scale=1')) {
    suggestions.push('💡 Consider removing maximum-scale to improve accessibility');
  }
  
  // Count resource links
  const cssLinks = (content.match(/<link[^>]*\.css/g) || []).length;
  const jsScripts = (content.match(/<script[^>]*\.js/g) || []).length;
  
  if (cssLinks > 5) {
    issues.push(`⚠️  Too many CSS files (${cssLinks}) - consider bundling`);
  }
  if (jsScripts > 10) {
    issues.push(`⚠️  Too many JS files (${jsScripts}) - consider bundling`);
  }
  
  // Check for preload/prefetch
  if (!content.includes('dns-prefetch')) {
    suggestions.push('💡 Add DNS prefetch for external resources');
  }
  
  return { issues, suggestions, cssLinks, jsScripts };
}

function createMobileOptimizedCSS() {
  const cssPath = path.join(PUBLIC_DIR, 'css', 'mobile-optimized.css');
  
  console.log('📱 Creating mobile-optimized CSS...');
  
  fs.writeFileSync(cssPath, MOBILE_OPTIMIZATIONS.criticalCSS);
  
  console.log(`✅ Created: ${cssPath}`);
  
  return cssPath;
}

function createApplePayIntegration() {
  console.log('🍎 Creating Apple Pay integration...');
  
  const applePayJS = `
/**
 * Apple Pay Integration for SoulmateSketch
 * Integrates with Stripe for seamless mobile payments
 */

class ApplePayService {
  constructor(stripeKey) {
    this.stripe = Stripe(stripeKey);
    this.config = ${JSON.stringify(APPLE_PAY_CONFIG, null, 2)};
  }

  /**
   * Check if Apple Pay is available
   */
  isApplePayAvailable() {
    return window.ApplePaySession && 
           ApplePaySession.canMakePayments() &&
           ApplePaySession.supportsVersion(3);
  }

  /**
   * Initialize Apple Pay button
   */
  initApplePayButton(containerId) {
    if (!this.isApplePayAvailable()) {
      console.log('Apple Pay not available on this device');
      return false;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Apple Pay container not found:', containerId);
      return false;
    }

    // Create Apple Pay button
    const button = document.createElement('button');
    button.className = 'apple-pay-button apple-pay-button-black';
    button.style.cssText = \`
      -webkit-appearance: -apple-pay-button;
      -apple-pay-button-type: buy;
      -apple-pay-button-style: black;
      width: 100%;
      height: 50px;
      margin: 10px 0;
      border-radius: 8px;
      cursor: pointer;
      border: none;
    \`;
    
    button.addEventListener('click', (e) => this.handleApplePayClick(e));
    
    container.appendChild(button);
    
    console.log('✅ Apple Pay button initialized');
    return true;
  }

  /**
   * Handle Apple Pay button click
   */
  async handleApplePayClick(event) {
    event.preventDefault();
    
    try {
      // Get current order details
      const orderData = this.getOrderData();
      
      if (!orderData) {
        throw new Error('Order data not available');
      }

      // Create payment request
      const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: this.config.supportedNetworks,
        merchantCapabilities: this.config.merchantCapabilities,
        total: {
          label: \`SoulmateSketch - \${orderData.tierDisplayName}\`,
          amount: (orderData.price / 100).toFixed(2)
        },
        lineItems: [
          {
            label: \`\${orderData.tierDisplayName} Soulmate Sketch\`,
            amount: (orderData.price / 100).toFixed(2)
          }
        ]
      };

      // Start Apple Pay session
      const session = new ApplePaySession(3, paymentRequest);
      
      session.onvalidatemerchant = (event) => {
        this.validateMerchant(event, session);
      };
      
      session.onpaymentauthorized = (event) => {
        this.processPayment(event, session, orderData);
      };
      
      session.oncancel = (event) => {
        console.log('Apple Pay cancelled');
      };
      
      session.begin();
      
    } catch (error) {
      console.error('Apple Pay error:', error);
      this.showError('Apple Pay is temporarily unavailable. Please try the regular checkout.');
    }
  }

  /**
   * Validate merchant with Apple
   */
  async validateMerchant(event, session) {
    try {
      // This validation happens on your server
      const response = await fetch('/api/applepay/validate-merchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validationURL: event.validationURL,
          displayName: 'SoulmateSketch'
        })
      });
      
      const merchantSession = await response.json();
      session.completeMerchantValidation(merchantSession);
      
    } catch (error) {
      console.error('Merchant validation failed:', error);
      session.abort();
    }
  }

  /**
   * Process the Apple Pay payment
   */
  async processPayment(event, session, orderData) {
    try {
      // Create Stripe PaymentMethod from Apple Pay token
      const {paymentMethod, error} = await this.stripe.createPaymentMethod({
        type: 'card',
        card: {
          token: event.payment.token
        }
      });

      if (error) {
        throw error;
      }

      // Process payment on server
      const response = await fetch('/api/process-apple-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          orderData: orderData,
          billingContact: event.payment.billingContact,
          shippingContact: event.payment.shippingContact
        })
      });

      const result = await response.json();

      if (result.success) {
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        
        // Redirect to success page
        window.location.href = \`/order-success?id=\${result.orderId}\`;
        
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      session.completePayment(ApplePaySession.STATUS_FAILURE);
      this.showError('Payment failed. Please try again.');
    }
  }

  /**
   * Get current order data from the page
   */
  getOrderData() {
    // Extract order data from form or page context
    const tierSelect = document.querySelector('input[name="tier"]:checked');
    const emailInput = document.querySelector('input[name="email"]');
    
    if (!tierSelect || !emailInput?.value) {
      return null;
    }

    const tier = tierSelect.value;
    const prices = {
      basic: 1999,   // $19.99
      plus: 2999,    // $29.99
      premium: 4999  // $49.99
    };

    const tierNames = {
      basic: 'Essential',
      plus: 'Plus', 
      premium: 'Premium'
    };

    return {
      tier,
      price: prices[tier],
      tierDisplayName: tierNames[tier],
      email: emailInput.value,
      // Add other form data as needed
    };
  }

  /**
   * Show error message to user
   */
  showError(message) {
    // You can customize this to match your UI
    alert(message);
  }
}

// Auto-initialize Apple Pay when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Replace with your actual Stripe publishable key
  const stripeKey = 'pk_test_your-stripe-key-here';
  
  if (typeof Stripe !== 'undefined') {
    window.applePayService = new ApplePayService(stripeKey);
    
    // Initialize Apple Pay button if container exists
    const container = document.getElementById('apple-pay-button');
    if (container) {
      window.applePayService.initApplePayButton('apple-pay-button');
    }
  }
});
`;

  const jsPath = path.join(PUBLIC_DIR, 'js', 'apple-pay.js');
  fs.writeFileSync(jsPath, applePayJS);
  
  console.log(`✅ Created: ${jsPath}`);
  
  return jsPath;
}

function createMobileTestSuite() {
  console.log('📱 Creating mobile test suite...');
  
  const testHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Mobile Performance Test - SoulmateSketch</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .test-container {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .test-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    .test-pass { border-color: #4CAF50; background: #f8fff8; }
    .test-fail { border-color: #f44336; background: #fff8f8; }
    .test-warning { border-color: #ff9800; background: #fffdf8; }
    
    /* Apple Pay button styles */
    .apple-pay-button {
      -webkit-appearance: -apple-pay-button;
      -apple-pay-button-type: buy;
      -apple-pay-button-style: black;
      width: 100%;
      height: 50px;
      margin: 10px 0;
      border-radius: 8px;
      cursor: pointer;
      border: none;
    }
    
    .touch-test-button {
      min-height: 44px;
      min-width: 44px;
      padding: 12px 24px;
      font-size: 16px;
      background: #E91E63;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin: 5px;
      touch-action: manipulation;
    }
  </style>
</head>
<body>
  <div class="test-container">
    <h1>📱 Mobile Test Suite</h1>
    
    <div class="test-section" id="viewport-test">
      <h3>Viewport Test</h3>
      <p>Screen: <span id="screen-size"></span></p>
      <p>Viewport: <span id="viewport-size"></span></p>
      <p>Device Pixel Ratio: <span id="dpr"></span></p>
    </div>
    
    <div class="test-section" id="touch-test">
      <h3>Touch Target Test</h3>
      <p>Minimum 44px × 44px touch targets:</p>
      <button class="touch-test-button" onclick="touchTest(this)">Test Button 1</button>
      <button class="touch-test-button" onclick="touchTest(this)">Test Button 2</button>
      <div id="touch-results"></div>
    </div>
    
    <div class="test-section" id="apple-pay-test">
      <h3>Apple Pay Test</h3>
      <div id="apple-pay-status"></div>
      <div id="apple-pay-button"></div>
    </div>
    
    <div class="test-section" id="performance-test">
      <h3>Performance Test</h3>
      <button onclick="runPerformanceTest()">Run Performance Test</button>
      <div id="perf-results"></div>
    </div>
    
    <div class="test-section" id="network-test">
      <h3>Network Test</h3>
      <div id="connection-info"></div>
    </div>
  </div>

  <script>
    // Update viewport info
    document.getElementById('screen-size').textContent = 
      \`\${screen.width} × \${screen.height}\`;
    document.getElementById('viewport-size').textContent = 
      \`\${window.innerWidth} × \${window.innerHeight}\`;
    document.getElementById('dpr').textContent = window.devicePixelRatio;
    
    // Touch test
    function touchTest(button) {
      const rect = button.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const results = document.getElementById('touch-results');
      
      if (size >= 44) {
        results.innerHTML = '✅ Touch targets are appropriately sized';
        document.getElementById('touch-test').className = 'test-section test-pass';
      } else {
        results.innerHTML = '❌ Touch targets too small (< 44px)';
        document.getElementById('touch-test').className = 'test-section test-fail';
      }
    }
    
    // Apple Pay test
    function testApplePay() {
      const statusEl = document.getElementById('apple-pay-status');
      const buttonEl = document.getElementById('apple-pay-button');
      
      if (window.ApplePaySession) {
        if (ApplePaySession.canMakePayments()) {
          statusEl.innerHTML = '✅ Apple Pay Available';
          buttonEl.innerHTML = '<div class="apple-pay-button"></div>';
          document.getElementById('apple-pay-test').className = 'test-section test-pass';
        } else {
          statusEl.innerHTML = '⚠️ Apple Pay Supported but No Cards Setup';
          document.getElementById('apple-pay-test').className = 'test-section test-warning';
        }
      } else {
        statusEl.innerHTML = '❌ Apple Pay Not Supported';
        document.getElementById('apple-pay-test').className = 'test-section test-fail';
      }
    }
    
    // Performance test
    function runPerformanceTest() {
      const results = document.getElementById('perf-results');
      results.innerHTML = 'Running tests...';
      
      // Test animation performance
      const start = performance.now();
      let frameCount = 0;
      
      function countFrames() {
        frameCount++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          const fps = frameCount;
          let status = '';
          let className = '';
          
          if (fps >= 50) {
            status = '✅ Excellent performance';
            className = 'test-pass';
          } else if (fps >= 30) {
            status = '⚠️ Good performance';
            className = 'test-warning';
          } else {
            status = '❌ Poor performance';
            className = 'test-fail';
          }
          
          results.innerHTML = \`
            <p>FPS: \${fps}</p>
            <p>\${status}</p>
          \`;
          document.getElementById('performance-test').className = \`test-section \${className}\`;
        }
      }
      
      requestAnimationFrame(countFrames);
    }
    
    // Network info
    function updateNetworkInfo() {
      const connectionEl = document.getElementById('connection-info');
      
      if ('connection' in navigator) {
        const conn = navigator.connection;
        connectionEl.innerHTML = \`
          <p>Type: \${conn.effectiveType || 'unknown'}</p>
          <p>Downlink: \${conn.downlink || 'unknown'} Mbps</p>
          <p>RTT: \${conn.rtt || 'unknown'} ms</p>
        \`;
      } else {
        connectionEl.innerHTML = '<p>Network API not supported</p>';
      }
    }
    
    // Initialize tests
    document.addEventListener('DOMContentLoaded', () => {
      testApplePay();
      updateNetworkInfo();
      
      // Auto-run touch test
      setTimeout(() => {
        touchTest(document.querySelector('.touch-test-button'));
      }, 100);
    });
  </script>
</body>
</html>
  `;
  
  const testPath = path.join(PUBLIC_DIR, 'mobile-test.html');
  fs.writeFileSync(testPath, testHTML);
  
  console.log(`✅ Created: ${testPath}`);
  
  return testPath;
}

async function optimizeMobilePerformance() {
  console.log('🚀 Starting mobile optimization...\n');
  
  try {
    // Analyze all HTML pages
    const htmlFiles = fs.readdirSync(PUBLIC_DIR)
      .filter(file => file.endsWith('.html'))
      .map(file => path.join(PUBLIC_DIR, file));
    
    let totalIssues = 0;
    let totalSuggestions = 0;
    
    for (const htmlFile of htmlFiles) {
      const analysis = analyzePagePerformance(htmlFile);
      totalIssues += analysis.issues.length;
      totalSuggestions += analysis.suggestions.length;
      
      if (analysis.issues.length > 0) {
        console.log('Issues found:');
        analysis.issues.forEach(issue => console.log(`  ${issue}`));
      }
      
      if (analysis.suggestions.length > 0) {
        console.log('Suggestions:');
        analysis.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
      }
      
      console.log('');
    }
    
    // Create optimized files
    const mobileCSS = createMobileOptimizedCSS();
    const applePayJS = createApplePayIntegration();
    const testSuite = createMobileTestSuite();
    
    console.log('\n📊 Mobile Optimization Summary:');
    console.log(`🔍 Analyzed: ${htmlFiles.length} HTML files`);
    console.log(`⚠️  Issues found: ${totalIssues}`);
    console.log(`💡 Suggestions: ${totalSuggestions}`);
    console.log(`📱 Mobile CSS: ${path.basename(mobileCSS)}`);
    console.log(`🍎 Apple Pay JS: ${path.basename(applePayJS)}`);
    console.log(`🧪 Test Suite: ${path.basename(testSuite)}`);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Add mobile-optimized.css to all HTML pages');
    console.log('2. Add apple-pay.js to payment pages');
    console.log('3. Test mobile experience at /mobile-test.html');
    console.log('4. Configure Apple Pay merchant identifier');
    console.log('5. Add server-side Apple Pay validation endpoint');
    
  } catch (error) {
    console.error('❌ Mobile optimization failed:', error);
    process.exit(1);
  }
}

// Run optimization
optimizeMobilePerformance().catch(console.error);