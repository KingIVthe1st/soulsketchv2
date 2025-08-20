#!/bin/bash

# Security Deployment Checklist for SoulmateSketch
# Run this script before deploying to production

echo "🔒 SoulmateSketch Security Deployment Checklist"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counters
PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo -e "\n1. Checking Dependencies..."
echo "----------------------------"

# Check if express-rate-limit is installed
if npm list express-rate-limit >/dev/null 2>&1; then
    check_pass "express-rate-limit dependency installed"
else
    check_fail "express-rate-limit dependency missing"
fi

# Check if all required packages are installed
if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_fail "node_modules directory missing - run npm install"
fi

echo -e "\n2. Checking Source Code Security..."
echo "------------------------------------"

# Check if security fixes are in routes.js
if grep -q "express-rate-limit" src/routes.js; then
    check_pass "Rate limiting import found in routes.js"
else
    check_fail "Rate limiting import missing from routes.js"
fi

if grep -q "requireAuth" src/routes.js; then
    check_pass "Admin authentication middleware found"
else
    check_fail "Admin authentication middleware missing"
fi

if grep -q "fileFilter" src/routes.js; then
    check_pass "File upload security filters found"
else
    check_fail "File upload security filters missing"
fi

if grep -q "sanitizeError" src/routes.js; then
    check_pass "Error sanitization function found"
else
    check_fail "Error sanitization function missing"
fi

if grep -q "z.object" src/routes.js; then
    check_pass "Zod validation schemas found"
else
    check_fail "Zod validation schemas missing"
fi

echo -e "\n3. Checking Environment Configuration..."
echo "----------------------------------------"

# Check NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    check_pass "NODE_ENV set to production"
else
    check_warn "NODE_ENV not set to production (current: ${NODE_ENV:-'undefined'})"
fi

# Check ADMIN_API_KEY
if [ -n "$ADMIN_API_KEY" ]; then
    if [ ${#ADMIN_API_KEY} -ge 32 ]; then
        check_pass "ADMIN_API_KEY is set and sufficiently long"
    else
        check_warn "ADMIN_API_KEY is set but should be at least 32 characters"
    fi
else
    check_fail "ADMIN_API_KEY environment variable not set"
fi

# Check STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
    check_pass "STRIPE_SECRET_KEY is set"
else
    check_warn "STRIPE_SECRET_KEY not set (payments will be disabled)"
fi

echo -e "\n4. Checking File Structure..."
echo "------------------------------"

# Check critical directories exist
if [ -d "uploads" ]; then
    check_pass "uploads directory exists"
else
    check_warn "uploads directory missing (will be created automatically)"
fi

if [ -f "src/routes.js" ]; then
    check_pass "src/routes.js exists"
else
    check_fail "src/routes.js missing"
fi

if [ -f "src/server.js" ]; then
    check_pass "src/server.js exists"
else
    check_fail "src/server.js missing"
fi

echo -e "\n5. Security Configuration Validation..."
echo "---------------------------------------"

# Check for security-related configurations in routes.js
RATE_LIMIT_CONFIG=$(grep -c "windowMs.*15.*60.*1000" src/routes.js)
if [ "$RATE_LIMIT_CONFIG" -gt 0 ]; then
    check_pass "Rate limiting configuration found"
else
    check_warn "Rate limiting configuration not found or modified"
fi

FILE_SIZE_LIMIT=$(grep -c "5.*1024.*1024" src/routes.js)
if [ "$FILE_SIZE_LIMIT" -gt 0 ]; then
    check_pass "File size limits configured"
else
    check_warn "File size limits not found or modified"
fi

MIME_TYPE_CHECK=$(grep -c "image/jpeg\|image/png" src/routes.js)
if [ "$MIME_TYPE_CHECK" -gt 0 ]; then
    check_pass "File type restrictions configured"
else
    check_warn "File type restrictions not found or modified"
fi

echo -e "\n6. Testing Server Startup..."
echo "-----------------------------"

# Test if server can start (timeout after 10 seconds)
echo "Starting server for validation..."
timeout 10s npm start >/dev/null 2>&1 &
SERVER_PID=$!

sleep 5

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    check_pass "Server starts successfully"
    kill $SERVER_PID 2>/dev/null
else
    check_fail "Server failed to start"
fi

echo -e "\n7. Final Security Checklist..."
echo "-------------------------------"

# Manual checklist items
echo -e "${YELLOW}Manual Verification Required:${NC}"
echo "□ All environment variables are set in production environment"
echo "□ Database is properly secured and accessible"
echo "□ HTTPS is configured in production"
echo "□ Firewall rules allow only necessary traffic"
echo "□ Log monitoring is configured"
echo "□ Backup procedures are in place"

echo -e "\n" + "="*50
echo -e "SECURITY DEPLOYMENT SUMMARY"
echo -e "="*50

echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n${GREEN}✓ READY FOR PRODUCTION DEPLOYMENT${NC}"
        echo "All security checks passed!"
    else
        echo -e "\n${YELLOW}⚠ READY WITH WARNINGS${NC}"
        echo "Address warnings before deployment for optimal security."
    fi
else
    echo -e "\n${RED}✗ NOT READY FOR DEPLOYMENT${NC}"
    echo "Fix failed checks before deploying to production."
    exit 1
fi

echo -e "\n📋 Next Steps:"
echo "1. Run: node test-security-fixes.js (to test API endpoints)"
echo "2. Set missing environment variables if any"
echo "3. Deploy to production environment"
echo "4. Monitor logs for rate limiting and security events"

echo -e "\n📚 Documentation:"
echo "- Security fixes: SECURITY_FIXES_IMPLEMENTED.md"
echo "- API testing: test-security-fixes.js"