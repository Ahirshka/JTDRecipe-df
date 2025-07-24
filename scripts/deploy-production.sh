#!/bin/bash

# Production Deployment Script for Just The Damn Recipe
# This script handles the complete deployment process to Vercel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}🍳 Just The Damn Recipe - Production Deployment${NC}"
echo "=============================================="

# Check prerequisites
echo -e "\n${BLUE}🔍 Checking prerequisites...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel${NC}"
    echo "Please run: vercel login"
    exit 1
fi

VERCEL_USER=$(vercel whoami)
echo -e "${GREEN}✅ Logged in as: ${VERCEL_USER}${NC}"

# Show project information
echo -e "\n${BLUE}📋 Project Information:${NC}"
echo "  Name: Just The Damn Recipe"
echo "  Framework: Next.js"
echo "  Target URL: https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"
echo "  Database: Stack Auth JWKS Endpoint"

# Environment variables reminder
echo -e "\n${YELLOW}⚠️  Required Environment Variables:${NC}"
echo "  • DATABASE_URL (Stack Auth JWKS endpoint)"
echo "  • RESEND_API_KEY (Email service)"
echo "  • FROM_EMAIL (Email sender)"
echo "  • NEXT_PUBLIC_APP_URL (App URL)"
echo "  • JWT_SECRET (Authentication)"

echo -e "\n${BLUE}💡 Make sure these are configured in your Vercel dashboard:${NC}"
echo "  https://vercel.com/dashboard → Your Project → Settings → Environment Variables"

# Confirmation prompt
echo -e "\n${YELLOW}🚀 Ready to deploy to production?${NC}"
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Pre-deployment checks
echo -e "\n${BLUE}🔧 Running pre-deployment checks...${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ package.json found${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"

# Run build test
echo -e "${BLUE}🏗️  Testing build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build test successful${NC}"
else
    echo -e "${RED}❌ Build test failed${NC}"
    echo -e "${YELLOW}Please fix build errors before deploying${NC}"
    exit 1
fi

# Deploy to production
echo -e "\n${BLUE}🚀 Deploying to production...${NC}"
echo "This may take a few minutes..."

if vercel --prod; then
    echo -e "\n${GREEN}🎉 Deployment successful!${NC}"
    
    # Post-deployment information
    echo -e "\n${BLUE}📋 Post-Deployment Checklist:${NC}"
    echo "  1. ✅ Visit your app: https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"
    echo "  2. 🔍 Check deployment status: /deployment-status"
    echo "  3. ⚙️  Verify environment setup: /setup-environment"
    echo "  4. 🧪 Test user registration and login"
    echo "  5. 📝 Submit a test recipe"
    echo "  6. 📧 Test email functionality"
    
    echo -e "\n${BLUE}🔗 Useful Links:${NC}"
    echo "  • App: https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"
    echo "  • Status: https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app/deployment-status"
    echo "  • Setup: https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app/setup-environment"
    echo "  • Vercel Dashboard: https://vercel.com/dashboard"
    
    echo -e "\n${GREEN}🎊 Your recipe site is now live!${NC}"
    
else
    echo -e "\n${RED}❌ Deployment failed${NC}"
    echo -e "\n${YELLOW}🔧 Troubleshooting steps:${NC}"
    echo "  1. Check Vercel deployment logs"
    echo "  2. Verify all environment variables are set"
    echo "  3. Ensure build passes locally: npm run build"
    echo "  4. Check for any TypeScript errors"
    echo "  5. Run: ./scripts/fix-build-error.sh"
    
    echo -e "\n${BLUE}📖 For help:${NC}"
    echo "  • Vercel Docs: https://vercel.com/docs"
    echo "  • Check logs: vercel logs"
    echo "  • Environment setup: /setup-environment"
    
    exit 1
fi
