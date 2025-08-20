#!/bin/bash

# SolarERP Development Environment Setup Script
# This script sets up a complete development environment

set -e  # Exit on error

echo "=================================="
echo "SolarERP Development Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check for required tools
echo "Checking required tools..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    else
        print_status "$1 is installed"
    fi
}

check_command node
check_command npm
check_command git

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
else
    print_status "Node.js version: $(node -v)"
fi

# Check for PostgreSQL
if command -v psql &> /dev/null; then
    print_status "PostgreSQL is installed"
else
    print_warning "PostgreSQL is not installed. You'll need it for local development or use Docker."
fi

# Check for Docker (optional)
if command -v docker &> /dev/null; then
    print_status "Docker is installed (optional)"
else
    print_warning "Docker is not installed (optional for containerized development)"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
print_status "Installing backend dependencies..."
npm install

print_status "Installing frontend dependencies..."
cd client-new && npm install && cd ..

# Setup environment file
echo ""
echo "Setting up environment configuration..."

if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cat > .env << 'EOF'
# Environment
NODE_ENV=development
PORT=5002

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solarerp_dev
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_SSL=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Client URL
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@solarerp.com

# Admin User (for initial setup)
ADMIN_EMAIL=admin@solarerp.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=System Administrator

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Logging
LOG_LEVEL=debug
LOG_FILE=server.log
EOF
    print_status ".env file created. Please update with your actual values."
else
    print_status ".env file already exists"
fi

# Create frontend .env file
if [ ! -f client-new/.env ]; then
    print_status "Creating frontend .env file..."
    cat > client-new/.env << 'EOF'
REACT_APP_API_URL=http://localhost:5002
REACT_APP_ENV=development
GENERATE_SOURCEMAP=true
EOF
    print_status "Frontend .env file created"
else
    print_status "Frontend .env file already exists"
fi

# Setup Git hooks
echo ""
echo "Setting up Git hooks..."
npx husky install
print_status "Git hooks installed"

# Setup database
echo ""
echo "Database setup..."

if command -v psql &> /dev/null; then
    read -p "Do you want to set up the PostgreSQL database now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Creating database..."
        npm run db:create || print_warning "Database might already exist"
        
        print_status "Running migrations..."
        npm run db:migrate
        
        print_status "Database setup complete"
    else
        print_warning "Skipping database setup. Run 'npm run db:setup' later."
    fi
else
    print_warning "PostgreSQL not found. Use Docker or install PostgreSQL manually."
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp
print_status "Directories created"

# Run initial checks
echo ""
echo "Running initial checks..."

print_status "Checking code style..."
npm run format:check || npm run format

print_status "Running linter..."
npm run lint:fix

# Final instructions
echo ""
echo "=================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start the development server:"
echo "   - Full stack: npm run dev:full"
echo "   - Backend only: npm run dev"
echo "   - Frontend only: cd client-new && npm start"
echo ""
echo "Useful commands:"
echo "  make help     - Show all available commands"
echo "  make dev      - Start development environment"
echo "  make test     - Run tests"
echo "  make lint-fix - Fix linting issues"
echo ""
echo "Happy coding!"