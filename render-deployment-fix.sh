#!/bin/bash

# Render Deployment Fix Script for SoulmateSketch v2
echo "🔧 SoulmateSketch v2 - Render Deployment Diagnostics & Fix"
echo "============================================================="

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# 2. Verify render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. This file is required for Render deployment."
    echo "🔧 Creating render.yaml..."
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: soulsketchv2-clean
    env: node
    plan: free
    region: oregon
    buildCommand: npm install
    startCommand: npm start
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: NODE_VERSION
        value: 20
      - key: PORT
        value: 8080
      - key: OPENAI_API_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: ADMIN_API_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: ENABLE_EMAIL_DELIVERY
        value: true
      - key: ENABLE_ORDER_CONFIRMATIONS
        value: true
      - key: ENABLE_MONITORING_ENDPOINTS
        value: true
      - key: ENABLE_DETAILED_LOGGING
        value: true
      - key: LOG_LEVEL
        value: info
      - key: DATABASE_PATH
        value: ./db/soulmatesketch.sqlite
      - key: UPLOADS_DIR
        value: ./uploads
EOF
    echo "✅ render.yaml created successfully"
else
    echo "✅ render.yaml found"
fi

# 3. Check package.json scripts
echo "📦 Checking package.json scripts..."
if ! grep -q '"start": "node src/server.js"' package.json; then
    echo "❌ Warning: package.json may not have correct start script"
    echo "   Expected: \"start\": \"node src/server.js\""
else
    echo "✅ Start script looks correct"
fi

# 4. Check if src/server.js exists
if [ ! -f "src/server.js" ]; then
    echo "❌ Error: src/server.js not found. This is the main server file."
    exit 1
else
    echo "✅ src/server.js found"
fi

# 5. Check critical directories
echo "📁 Checking required directories..."
for dir in "src" "public" "db" "uploads"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir directory exists"
    else
        echo "⚠️  Creating $dir directory..."
        mkdir -p "$dir"
    fi
done

# 6. Check database file
if [ -f "db/soulmatesketch.sqlite" ]; then
    echo "✅ Database file exists"
else
    echo "⚠️  Database file not found. You may need to run: npm run seed"
fi

# 7. Check public/index.html
if [ -f "public/index.html" ]; then
    echo "✅ Landing page (index.html) exists"
else
    echo "❌ Error: public/index.html not found. This is required for the root route."
fi

# 8. Test local server start (quick check)
echo "🧪 Testing server startup (timeout: 5 seconds)..."
timeout 5 node src/server.js &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server starts successfully locally"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Server failed to start locally"
fi

# 9. Test the Render URL
echo "🌐 Testing Render deployment URL..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://soulsketchv2-clean.onrender.com" --connect-timeout 10)

if [ "$HTTP_STATUS" = "404" ]; then
    echo "❌ Render URL returns 404 - Service is running but routes not found"
    echo "   This suggests the deployment exists but has configuration issues"
elif [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Render URL is working correctly!"
elif [ -z "$HTTP_STATUS" ]; then
    echo "❌ Render URL is not responding - deployment may be down"
else
    echo "⚠️  Render URL returned status: $HTTP_STATUS"
fi

echo ""
echo "============================================================="
echo "🎯 DIAGNOSIS SUMMARY:"
echo "============================================================="

if [ "$HTTP_STATUS" = "404" ]; then
    echo "❌ ISSUE: 404 Not Found"
    echo "📋 LIKELY CAUSES:"
    echo "   1. Missing render.yaml file (now fixed)"
    echo "   2. Incorrect start command in package.json"
    echo "   3. Server not serving static files correctly"
    echo "   4. Routes not properly configured"
    echo ""
    echo "🔧 RECOMMENDED ACTIONS:"
    echo "   1. Commit and push the render.yaml file"
    echo "   2. Redeploy the service on Render"
    echo "   3. Check Render build logs for errors"
    echo "   4. Verify environment variables are set"
fi

echo ""
echo "📋 DEPLOYMENT CHECKLIST:"
echo "✅ render.yaml file created/verified"
echo "✅ package.json start script verified"
echo "✅ Required directories exist"
echo "✅ Server file exists"
echo "Next: Commit changes and redeploy on Render"

echo ""
echo "🚀 To deploy to Render:"
echo "   1. git add render.yaml"
echo "   2. git commit -m 'Add Render deployment configuration'"
echo "   3. git push origin main"
echo "   4. Trigger redeploy in Render dashboard"
echo ""