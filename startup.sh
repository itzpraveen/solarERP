#!/bin/bash

echo "🚀 Starting SolarERP Application..."

# Detect environment
if [ "$RAILWAY_ENVIRONMENT" = "production" ] || [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production environment detected"
    
    # Wait for database to be ready
    echo "⏳ Waiting for database connection..."
    sleep 5
    
    # Run migrations
    echo "🔄 Running database migrations..."
    npx sequelize-cli db:migrate --env production
    
    # Create admin user if not exists
    echo "👤 Setting up admin user..."
    node src/scripts/createAdminUser.js || true
    
    # Start production server
    echo "✅ Starting production server..."
    node src/index.js
else
    echo "🛠️  Development environment detected"
    
    # Check if PostgreSQL is running locally
    if command -v docker &> /dev/null; then
        echo "🐳 Checking Docker PostgreSQL..."
        docker ps | grep postgres || docker-compose up -d postgres
    fi
    
    # Wait for database
    sleep 3
    
    # Run migrations
    echo "🔄 Running database migrations..."
    npx sequelize-cli db:migrate
    
    # Create admin user if not exists
    echo "👤 Setting up admin user..."
    node src/scripts/createAdminUser.js || true
    
    # Start development server
    echo "✅ Starting development server..."
    npm run dev
fi