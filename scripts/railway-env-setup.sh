#!/bin/bash

# Railway Environment Variables Setup Script
# This script helps you set up all required environment variables for Railway deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚂 Railway Environment Setup for SolarERP${NC}"
echo "========================================"
echo ""

# Function to generate secure random strings
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Railway CLI is not installed!${NC}"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Railway first${NC}"
    railway login
fi

echo -e "${GREEN}Setting up environment variables...${NC}"
echo ""

# Generate secrets
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)

echo -e "${GREEN}Generated secure secrets:${NC}"
echo "JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "SESSION_SECRET: ${SESSION_SECRET:0:20}..."
echo ""

# Get user input for configuration
read -p "Enter admin email [admin@solarerp.com]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@solarerp.com}

read -p "Enter admin password [auto-generate]: " ADMIN_PASSWORD
if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD=$(generate_secret | cut -c1-16)
    echo -e "${YELLOW}Generated admin password: $ADMIN_PASSWORD${NC}"
    echo -e "${RED}⚠️  SAVE THIS PASSWORD - YOU'LL NEED IT TO LOGIN${NC}"
fi

read -p "Enter your email service (gmail/outlook/custom) [gmail]: " EMAIL_SERVICE
EMAIL_SERVICE=${EMAIL_SERVICE:-gmail}

if [ "$EMAIL_SERVICE" != "none" ]; then
    read -p "Enter email address for sending: " EMAIL_USERNAME
    read -sp "Enter email password/app-specific password: " EMAIL_PASSWORD
    echo ""
fi

# Set Railway environment variables
echo ""
echo -e "${GREEN}Setting Railway environment variables...${NC}"

# Core configuration
railway variables set NODE_ENV=production
railway variables set PORT=5002
railway variables set ENABLE_NONAUTH_ROUTES=true

# Security
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_EXPIRES_IN=7d
railway variables set SESSION_SECRET="$SESSION_SECRET"

# Admin
railway variables set ADMIN_EMAIL="$ADMIN_EMAIL"
railway variables set ADMIN_PASSWORD="$ADMIN_PASSWORD"
railway variables set ADMIN_NAME="System Administrator"

# Database (will be auto-linked when PostgreSQL is added)
railway variables set DB_SSL=true

# Email (if configured)
if [ "$EMAIL_SERVICE" != "none" ] && [ -n "$EMAIL_USERNAME" ]; then
    case $EMAIL_SERVICE in
        gmail)
            railway variables set EMAIL_HOST=smtp.gmail.com
            railway variables set EMAIL_PORT=587
            ;;
        outlook)
            railway variables set EMAIL_HOST=smtp-mail.outlook.com
            railway variables set EMAIL_PORT=587
            ;;
        *)
            read -p "Enter SMTP host: " EMAIL_HOST
            read -p "Enter SMTP port: " EMAIL_PORT
            railway variables set EMAIL_HOST="$EMAIL_HOST"
            railway variables set EMAIL_PORT="$EMAIL_PORT"
            ;;
    esac
    
    railway variables set EMAIL_USERNAME="$EMAIL_USERNAME"
    railway variables set EMAIL_PASSWORD="$EMAIL_PASSWORD"
    railway variables set EMAIL_FROM="noreply@solarerp.com"
fi

# Rate limiting
railway variables set RATE_LIMIT_MAX=100
railway variables set RATE_LIMIT_WINDOW_MS=900000

# File upload
railway variables set MAX_FILE_SIZE=5242880
railway variables set UPLOAD_DIR=uploads

# API Configuration
railway variables set API_VERSION=v1
railway variables set API_PREFIX=/api

echo ""
echo -e "${GREEN}✅ Environment variables set successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Add PostgreSQL service in Railway dashboard"
echo "2. Add Redis service in Railway dashboard"
echo "3. Deploy your application"
echo "4. Update CORS_ORIGIN and CLIENT_URL with your Railway URL"
echo ""
echo -e "${YELLOW}Important: After deployment, update these variables:${NC}"
echo "  CORS_ORIGIN=https://your-app.up.railway.app"
echo "  CLIENT_URL=https://your-app.up.railway.app"
echo ""
echo -e "${GREEN}Admin Credentials:${NC}"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo -e "${RED}⚠️  Keep these credentials secure!${NC}"
echo ""

# Save credentials to local file (optional)
read -p "Save credentials to local file? (y/n): " SAVE_CREDS
if [ "$SAVE_CREDS" = "y" ]; then
    CREDS_FILE="railway-credentials-$(date +%Y%m%d-%H%M%S).txt"
    {
        echo "Railway Deployment Credentials"
        echo "=============================="
        echo "Generated: $(date)"
        echo ""
        echo "Admin Email: $ADMIN_EMAIL"
        echo "Admin Password: $ADMIN_PASSWORD"
        echo ""
        echo "JWT_SECRET: $JWT_SECRET"
        echo "SESSION_SECRET: $SESSION_SECRET"
        echo ""
        echo "⚠️  DELETE THIS FILE AFTER SAVING CREDENTIALS SECURELY"
    } > "$CREDS_FILE"
    
    chmod 600 "$CREDS_FILE"
    echo -e "${GREEN}Credentials saved to: $CREDS_FILE${NC}"
    echo -e "${RED}⚠️  Remember to delete this file after saving the credentials securely!${NC}"
fi

echo ""
echo -e "${GREEN}🚂 Railway setup complete!${NC}"