#!/bin/bash

# Test production database and order creation

echo "🧪 Testing SoulmateSketch Production Server..."
echo "============================================"

# Test database health
echo -e "\n1️⃣ Checking database health..."
curl -s https://soulsketch-final.onrender.com/api/db-health | jq . 2>/dev/null || echo "Database health check not available yet"

# Test database write
echo -e "\n2️⃣ Testing database write/read..."
curl -s -X POST https://soulsketch-final.onrender.com/api/test-db-write | jq . 2>/dev/null || echo "Database write test not available yet"

# Create a test order
echo -e "\n3️⃣ Creating test order..."
TEST_ORDER=$(curl -s -X POST https://soulsketch-final.onrender.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{"email":"production-test@example.com","tier":"premium","addons":[]}')

echo $TEST_ORDER | jq . 2>/dev/null || echo $TEST_ORDER

# Extract order ID if successful
ORDER_ID=$(echo $TEST_ORDER | jq -r '.id' 2>/dev/null)

if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  echo -e "\n✅ Order created with ID: $ORDER_ID"
  
  # Check if order exists
  echo -e "\n4️⃣ Verifying order exists..."
  curl -s https://soulsketch-final.onrender.com/api/orders/$ORDER_ID | jq . 2>/dev/null
else
  echo -e "\n❌ Failed to create test order"
fi

echo -e "\n============================================"
echo "Test complete. Check results above."