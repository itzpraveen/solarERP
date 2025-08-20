#!/bin/bash

# Database Reset Script
# Completely resets the database with fresh schema and optional seed data

set -e

echo "🗄️  Database Reset Script"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Confirm action
echo -e "${YELLOW}⚠️  WARNING: This will delete all data in the database!${NC}"
read -p "Are you sure you want to reset the database? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Database reset cancelled."
    exit 0
fi

echo -e "${YELLOW}Dropping existing database...${NC}"
npm run db:drop || echo "Database might not exist yet"

echo -e "${GREEN}Creating new database...${NC}"
npm run db:create

echo -e "${GREEN}Running migrations...${NC}"
npm run db:migrate

# Ask about seeding
read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Seeding database...${NC}"
    npm run db:seed || echo "No seeds available"
fi

# Create admin user
read -p "Do you want to create an admin user? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Creating admin user...${NC}"
    npm run create-admin
fi

echo -e "${GREEN}✅ Database reset complete!${NC}"