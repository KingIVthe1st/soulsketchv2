#!/usr/bin/env node

/**
 * Security Test Script for SoulmateSketch API
 * Tests all implemented security fixes
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api`;

console.log('🔒 SoulmateSketch Security Validation Suite');
console.log(`Testing against: ${API_BASE}`);
console.log('=' .repeat(50));

/**
 * Test Suite: Security Fixes Validation
 */

// Test 1: Rate Limiting
async function testRateLimiting() {
  console.log('\n1. Testing Rate Limiting...');
  
  try {
    const requests = [];
    // Send 102 requests rapidly (should hit 100 request limit)
    for (let i = 0; i < 102; i++) {
      requests.push(
        fetch(`${API_BASE}/orders/test-uuid-${i}`)
          .then(res => ({ status: res.status, attempt: i + 1 }))
          .catch(err => ({ error: err.message, attempt: i + 1 }))
      );
    }
    
    const results = await Promise.all(requests);
    const rateLimited = results.filter(r => r.status === 429);
    
    if (rateLimited.length > 0) {
      console.log(`✅ Rate limiting working: ${rateLimited.length} requests blocked`);
    } else {
      console.log('❌ Rate limiting not activated or limit too high');
    }
  } catch (error) {
    console.log('⚠️  Rate limiting test failed:', error.message);
  }
}

// Test 2: File Upload Security
async function testFileUploadSecurity() {
  console.log('\n2. Testing File Upload Security...');
  
  // Test invalid file types
  const testCases = [
    { name: 'malicious.php', type: 'application/php', expected: 400 },
    { name: 'script.js', type: 'application/javascript', expected: 400 },
    { name: 'valid.jpg', type: 'image/jpeg', expected: 404 }, // 404 because order doesn't exist
  ];
  
  for (const testCase of testCases) {
    try {
      const formData = new FormData();
      const blob = new Blob(['test content'], { type: testCase.type });
      formData.append('photo', blob, testCase.name);
      formData.append('quiz', '{"test": true}');
      
      const response = await fetch(`${API_BASE}/orders/test-order/intake`, {
        method: 'POST',
        body: formData
      });
      
      if (response.status === testCase.expected) {
        console.log(`✅ File type validation working for ${testCase.name}`);
      } else {
        console.log(`❌ Unexpected response for ${testCase.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  File upload test failed for ${testCase.name}:`, error.message);
    }
  }
}

// Test 3: Input Validation
async function testInputValidation() {
  console.log('\n3. Testing Input Validation...');
  
  const testCases = [
    {
      name: 'Invalid email',
      data: { email: 'invalid-email', tier: 'premium' },
      expected: 400
    },
    {
      name: 'Missing email',
      data: { tier: 'premium' },
      expected: 400
    },
    {
      name: 'Invalid tier',
      data: { email: 'test@example.com', tier: 'invalid' },
      expected: 400
    },
    {
      name: 'Valid data',
      data: { email: 'test@example.com', tier: 'premium' },
      expected: 200
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });
      
      if (response.status === testCase.expected) {
        console.log(`✅ Input validation working for: ${testCase.name}`);
      } else {
        console.log(`❌ Unexpected response for ${testCase.name}: ${response.status} (expected ${testCase.expected})`);
      }
    } catch (error) {
      console.log(`⚠️  Input validation test failed for ${testCase.name}:`, error.message);
    }
  }
}

// Test 4: Admin Endpoint Security
async function testAdminEndpointSecurity() {
  console.log('\n4. Testing Admin Endpoint Security...');
  
  const adminEndpoints = [
    '/health/deliverables',
    '/stats/deliveries',
    '/validate/pdf/test-uuid'
  ];
  
  for (const endpoint of adminEndpoints) {
    try {
      // Test without auth
      const unauthorizedResponse = await fetch(`${API_BASE}${endpoint}`);
      
      if (unauthorizedResponse.status === 401 || unauthorizedResponse.status === 503) {
        console.log(`✅ Admin endpoint protected: ${endpoint}`);
      } else {
        console.log(`❌ Admin endpoint not protected: ${endpoint} (status: ${unauthorizedResponse.status})`);
      }
    } catch (error) {
      console.log(`⚠️  Admin endpoint test failed for ${endpoint}:`, error.message);
    }
  }
}

// Test 5: Error Response Sanitization
async function testErrorSanitization() {
  console.log('\n5. Testing Error Response Sanitization...');
  
  try {
    // Test with invalid UUID to trigger error
    const response = await fetch(`${API_BASE}/orders/invalid-uuid-format`, {
      method: 'GET'
    });
    
    const errorData = await response.json();
    
    // Check if sensitive information is leaked
    if (errorData.stack || errorData.technicalDetails) {
      console.log('❌ Error response contains sensitive information');
    } else if (errorData.error && errorData.code) {
      console.log('✅ Error responses properly sanitized');
    } else {
      console.log('⚠️  Error response format unexpected:', errorData);
    }
  } catch (error) {
    console.log('⚠️  Error sanitization test failed:', error.message);
  }
}

// Test 6: UUID Validation
async function testUUIDValidation() {
  console.log('\n6. Testing UUID Validation...');
  
  const testCases = [
    { uuid: 'invalid-uuid', expected: 400 },
    { uuid: '12345', expected: 400 },
    { uuid: 'aaaa-bbbb-cccc-dddd-eeee', expected: 400 },
    { uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', expected: 404 } // Valid format, but order doesn't exist
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_BASE}/orders/${testCase.uuid}`);
      
      if (response.status === testCase.expected) {
        console.log(`✅ UUID validation working for: ${testCase.uuid.substring(0, 20)}...`);
      } else {
        console.log(`❌ Unexpected response for UUID ${testCase.uuid}: ${response.status} (expected ${testCase.expected})`);
      }
    } catch (error) {
      console.log(`⚠️  UUID validation test failed:`, error.message);
    }
  }
}

// Run all tests
async function runSecurityTests() {
  try {
    await testRateLimiting();
    await testFileUploadSecurity();
    await testInputValidation();
    await testAdminEndpointSecurity();
    await testErrorSanitization();
    await testUUIDValidation();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🔒 Security validation complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set ADMIN_API_KEY environment variable for admin endpoints');
    console.log('2. Test with NODE_ENV=production for production error handling');
    console.log('3. Monitor rate limiting in production logs');
    console.log('4. Verify file uploads work with valid images');
    
  } catch (error) {
    console.error('❌ Security test suite failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    if (response.status === 200) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.log(`❌ Server returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not accessible:', error.message);
    console.log('\n🚀 Start the server first:');
    console.log('   npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runSecurityTests();
  }
}

main();