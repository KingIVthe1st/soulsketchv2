#!/bin/bash

# SoulmateSketch Production Deployment Verification Script
# This script verifies the system is ready for production deployment

echo "🚀 SoulmateSketch Production Deployment Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "1. Project Structure Verification"
echo "--------------------------------"

# Check essential files exist
if [ -f "package.json" ]; then
    check_pass "package.json exists"
else
    check_fail "package.json missing"
fi

if [ -f "vercel.json" ]; then
    check_pass "vercel.json configuration exists"
else
    check_fail "vercel.json missing"
fi

if [ -f "src/server.js" ]; then
    check_pass "Server entry point exists"
else
    check_fail "Server entry point missing"
fi

if [ -f ".env.example" ]; then
    check_pass "Environment example file exists"
else
    check_warn "Environment example file missing"
fi

if [ -d "public" ]; then
    check_pass "Public directory exists"
else
    check_fail "Public directory missing"
fi

if [ -d "src" ]; then
    check_pass "Source directory exists"
else
    check_fail "Source directory missing"
fi

echo ""
echo "2. Package Configuration"
echo "----------------------"

# Check Node.js version requirement
if grep -q '"node": ">=20"' package.json; then
    check_pass "Node.js version requirement specified (>=20)"
else
    check_warn "Node.js version requirement not specified"
fi

# Check if start script exists
if grep -q '"start"' package.json; then
    check_pass "Start script defined"
else
    check_fail "Start script missing"
fi

# Check for production script
if grep -q '"production"' package.json; then
    check_pass "Production script defined"
else
    check_warn "Production script not defined"
fi

echo ""
echo "3. Dependencies Verification"
echo "---------------------------"

# Check critical dependencies
CRITICAL_DEPS=("express" "cors" "helmet" "better-sqlite3" "openai" "stripe" "pdfkit" "zod" "express-rate-limit")

for dep in "${CRITICAL_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        check_pass "$dep dependency found"
    else
        check_fail "$dep dependency missing"
    fi
done

echo ""
echo "4. Security Configuration"
echo "------------------------"

# Check for security-related files
if grep -q "rate-limit" src/routes.js 2>/dev/null; then
    check_pass "Rate limiting implementation found"
else
    check_fail "Rate limiting not implemented"
fi

if grep -q "helmet" src/server.js 2>/dev/null; then
    check_pass "Security headers (helmet) configured"
else
    check_fail "Security headers not configured"
fi

if grep -q "fileFilter" src/routes.js 2>/dev/null; then
    check_pass "File upload security filters found"
else
    check_warn "File upload security not verified"
fi

echo ""
echo "5. Database Configuration"
echo "------------------------"

if [ -f "src/db.js" ]; then
    check_pass "Database configuration exists"
else
    check_fail "Database configuration missing"
fi

if [ -d "db" ]; then
    check_pass "Database directory exists"
else
    check_warn "Database directory missing (will be created on startup)"
fi

echo ""
echo "6. API Endpoints Verification"
echo "-----------------------------"

if grep -q "'/orders'" src/routes.js 2>/dev/null; then
    check_pass "Orders API endpoint found"
else
    check_fail "Orders API endpoint missing"
fi

if grep -q "create-payment-intent" src/routes.js 2>/dev/null; then
    check_pass "Payment intent API endpoint found"
else
    check_fail "Payment intent API endpoint missing"
fi

if grep -q "health" src/routes.js 2>/dev/null; then
    check_pass "Health check endpoints found"
else
    check_warn "Health check endpoints not found"
fi

echo ""
echo "7. Frontend Assets"
echo "-----------------"

if [ -f "public/index.html" ]; then
    check_pass "Landing page exists"
else
    check_fail "Landing page missing"
fi

if [ -f "public/order.html" ]; then
    check_pass "Order page exists"
else
    check_fail "Order page missing"
fi

if [ -d "public/css" ]; then
    check_pass "CSS assets directory exists"
else
    check_fail "CSS assets missing"
fi

if [ -d "public/js" ]; then
    check_pass "JavaScript assets directory exists"
else
    check_fail "JavaScript assets missing"
fi

if [ -d "public/images" ]; then
    check_pass "Image assets directory exists"
else
    check_fail "Image assets missing"
fi

echo ""
echo "8. Git Repository Status"
echo "-----------------------"

if [ -d ".git" ]; then
    check_pass "Git repository initialized"
    
    # Check if there are uncommitted changes
    if git diff-index --quiet HEAD --; then
        check_pass "No uncommitted changes"
    else
        check_warn "Uncommitted changes detected"
    fi
    
    # Check remote origin
    if git remote get-url origin >/dev/null 2>&1; then
        REMOTE_URL=$(git remote get-url origin)
        check_pass "Git remote configured: $REMOTE_URL"
    else
        check_warn "Git remote not configured"
    fi
else
    check_warn "Not a git repository"
fi

echo ""
echo "9. Deployment Platform Configuration"
echo "----------------------------------"

# Check Vercel configuration
if [ -f "vercel.json" ]; then
    if grep -q "@vercel/node" vercel.json; then
        check_pass "Vercel Node.js runtime configured"
    else
        check_warn "Vercel runtime not specified"
    fi
    
    if grep -q "src/server.js" vercel.json; then
        check_pass "Vercel build source configured correctly"
    else
        check_fail "Vercel build source misconfigured"
    fi
else
    check_warn "Vercel configuration not found (required for Vercel deployment)"
fi

echo ""
echo "10. Environment Variables Check"
echo "------------------------------"

check_info "Environment variables should be configured in your deployment platform:"
check_info "- NODE_ENV=production"
check_info "- OPENAI_API_KEY (required for AI generation)"
check_info "- STRIPE_SECRET_KEY (required for payments)"
check_info "- ADMIN_API_KEY (required for monitoring)"
check_info "- Email service configuration (SMTP/SendGrid/Mailgun)"

if [ -f ".env" ]; then
    check_warn ".env file found (ensure production uses platform environment variables)"
else
    check_pass "No local .env file (good for production)"
fi

echo ""
echo "==============================================="
echo "🎯 DEPLOYMENT READINESS SUMMARY"
echo "==============================================="
echo -e "✅ ${GREEN}Passed:${NC} $PASSED"
echo -e "⚠️  ${YELLOW}Warnings:${NC} $WARNINGS" 
echo -e "❌ ${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🚀 READY FOR DEPLOYMENT${NC}"
        echo "All checks passed! The system is ready for production deployment."
    else
        echo -e "${YELLOW}⚠️  READY WITH WARNINGS${NC}"
        echo "The system is ready for deployment but has some warnings to review."
    fi
else
    echo -e "${RED}❌ NOT READY FOR DEPLOYMENT${NC}"
    echo "Fix the failed checks before deploying to production."
fi

echo ""
echo "📚 Next Steps:"
echo "1. Review and fix any failed checks"
echo "2. Configure environment variables in your deployment platform"
echo "3. Deploy using your chosen platform (Vercel recommended)"
echo "4. Test all functionality in production environment"
echo ""
echo "📖 For complete deployment instructions, see:"
echo "   - PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "   - ENVIRONMENT_VARIABLES.md"
echo ""

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi