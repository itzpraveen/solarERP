#!/bin/bash

# Health Check Script
# Checks the health of all services

set -e

echo "🏥 System Health Check"
echo "====================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

FAILED=0

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Function to check port
check_port() {
    local name=$1
    local host=$2
    local port=$3
    
    echo -n "Checking $name (port $port)... "
    
    if nc -z "$host" "$port" 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Function to check database
check_database() {
    echo -n "Checking PostgreSQL connection... "
    
    if PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USERNAME:-postgres} -d ${DB_NAME:-solarerp} -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Function to check Redis
check_redis() {
    echo -n "Checking Redis connection... "
    
    if redis-cli -h ${REDIS_HOST:-localhost} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${YELLOW}⚠ Not available (optional)${NC}"
    fi
}

echo -e "${BLUE}Service Checks:${NC}"
echo "---------------"

# Check backend
check_service "Backend API" "http://localhost:${PORT:-5002}/health"

# Check frontend
check_service "Frontend" "http://localhost:3000"

echo ""
echo -e "${BLUE}Port Checks:${NC}"
echo "------------"

# Check ports
check_port "Backend" "localhost" "${PORT:-5002}"
check_port "Frontend" "localhost" "3000"
check_port "PostgreSQL" "${DB_HOST:-localhost}" "${DB_PORT:-5432}"

echo ""
echo -e "${BLUE}Database Checks:${NC}"
echo "---------------"

# Check database
check_database

# Check Redis (optional)
check_redis

echo ""
echo -e "${BLUE}System Information:${NC}"
echo "------------------"

# Node version
echo -n "Node.js version: "
node --version

# NPM version
echo -n "NPM version: "
npm --version

# Disk usage
echo -n "Disk usage: "
df -h . | tail -1 | awk '{print $5 " used"}'

# Memory usage
echo -n "Memory usage: "
if [[ "$OSTYPE" == "darwin"* ]]; then
    vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.$//'
else
    free -h | grep Mem | awk '{print $3 "/" $2}'
fi

echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All health checks passed!${NC}"
else
    echo -e "${RED}❌ $FAILED health check(s) failed${NC}"
    exit 1
fi