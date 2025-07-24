#!/bin/bash

# Fix Build Error Script for Just The Damn Recipe
# This script helps diagnose and fix common build errors

set -e

echo "🔧 Just The Damn Recipe - Build Error Fix"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking for common build issues...${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ package.json found${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found, installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check for TypeScript errors
echo -e "${BLUE}🔍 Checking TypeScript...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ No TypeScript errors${NC}"
else
    echo -e "${RED}❌ TypeScript errors found${NC}"
    echo "Please fix the TypeScript errors above before deploying."
    exit 1
fi

# Check for Next.js build
echo -e "${BLUE}🔍 Testing Next.js build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Common build fixes:${NC}"
    echo "  1. Missing environment variables:"
    echo "     • DATABASE_URL (Stack Auth JWKS endpoint)"
    echo "     • RESEND_API_KEY"
    echo "     • FROM_EMAIL"
    echo "     • NEXT_PUBLIC_APP_URL"
    echo "     • JWT_SECRET"
    echo ""
    echo "  2. Add these to your Vercel project:"
    echo "     vercel env add DATABASE_URL"
    echo "     vercel env add RESEND_API_KEY"
    echo "     vercel env add FROM_EMAIL"
    echo "     vercel env add NEXT_PUBLIC_APP_URL"
    echo "     vercel env add JWT_SECRET"
    echo ""
    echo "  3. Or add them via Vercel Dashboard:"
    echo "     https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
    echo ""
    echo -e "${BLUE}📋 Required Values:${NC}"
    echo "  DATABASE_URL: https://api.stack-auth.com/api/v1/projects/85e14859-fd35-4179-a43f-ee56cfea6f7e/.well-known/jwks.json"
    echo "  RESEND_API_KEY: re_your_actual_api_key_here"
    echo "  FROM_EMAIL: contact@justthedamnrecipe.net"
    echo "  NEXT_PUBLIC_APP_URL: https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"
    echo "  JWT_SECRET: your_super_secret_jwt_key_minimum_32_characters_long_random_string_here"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All checks passed! Ready to deploy.${NC}"
echo ""
echo -e "${BLUE}🚀 To deploy to production:${NC}"
echo "  vercel --prod"
echo ""
echo -e "${BLUE}🔗 Or use the deployment script:${NC}"
echo "  ./scripts/deploy-production.sh"
