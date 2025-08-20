#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}     SolarERP Local Development Setup${NC}"
echo -e "${GREEN}================================================${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null
}

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm found: $(npm -v)${NC}"

if ! command_exists docker; then
    echo -e "${YELLOW}⚠️  Docker not found. You'll need PostgreSQL installed locally${NC}"
    USE_DOCKER=false
else
    echo -e "${GREEN}✅ Docker found${NC}"
    USE_DOCKER=true
fi

# Step 2: Check environment file
echo -e "\n${YELLOW}Step 2: Checking environment configuration...${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please edit it with your settings${NC}"
    echo -e "${YELLOW}Opening .env for editing...${NC}"
    ${EDITOR:-nano} .env
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Step 3: Setup PostgreSQL
echo -e "\n${YELLOW}Step 3: Setting up PostgreSQL...${NC}"

if [ "$USE_DOCKER" = true ]; then
    # Check if PostgreSQL container is running
    if docker ps | grep -q "solarerp-postgres"; then
        echo -e "${GREEN}✅ PostgreSQL container is already running${NC}"
    else
        echo -e "${YELLOW}Starting PostgreSQL with Docker...${NC}"
        docker-compose up -d postgres
        
        # Wait for PostgreSQL to be ready
        echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
        sleep 5
        
        # Create databases
        echo -e "${YELLOW}Creating databases...${NC}"
        docker exec solarerp-postgres-1 psql -U postgres -c "CREATE DATABASE solarerp_dev;" 2>/dev/null || true
        docker exec solarerp-postgres-1 psql -U postgres -c "CREATE DATABASE solarerp_test;" 2>/dev/null || true
        
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    fi
else
    # Check if PostgreSQL is running locally
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is running locally${NC}"
        
        # Create databases
        echo -e "${YELLOW}Creating databases if not exists...${NC}"
        psql -U postgres -c "CREATE DATABASE solarerp_dev;" 2>/dev/null || true
        psql -U postgres -c "CREATE DATABASE solarerp_test;" 2>/dev/null || true
    else
        echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL first${NC}"
        echo -e "${YELLOW}Install PostgreSQL or use Docker: docker-compose up -d postgres${NC}"
        exit 1
    fi
fi

# Step 4: Install dependencies
echo -e "\n${YELLOW}Step 4: Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

if [ ! -d "client-new/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd client-new && npm install && cd ..
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Step 5: Run migrations
echo -e "\n${YELLOW}Step 5: Running database migrations...${NC}"
npx sequelize-cli db:migrate
echo -e "${GREEN}✅ Migrations completed${NC}"

# Step 6: Create admin user
echo -e "\n${YELLOW}Step 6: Creating admin user...${NC}"
node src/scripts/createAdminUser.js || true

# Step 7: Check port availability
echo -e "\n${YELLOW}Step 7: Checking port availability...${NC}"

BACKEND_PORT=${PORT:-5000}
FRONTEND_PORT=3000

if port_in_use $BACKEND_PORT; then
    echo -e "${RED}❌ Port $BACKEND_PORT is already in use${NC}"
    echo -e "${YELLOW}Kill the process or use a different port in .env${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend port $BACKEND_PORT is available${NC}"

if port_in_use $FRONTEND_PORT; then
    echo -e "${YELLOW}⚠️  Frontend port $FRONTEND_PORT is in use${NC}"
fi

# Step 8: Start the application
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}       Starting SolarERP Application${NC}"
echo -e "${GREEN}================================================${NC}\n"

echo -e "${GREEN}Backend API will run on: http://localhost:$BACKEND_PORT${NC}"
echo -e "${GREEN}Frontend will run on: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${YELLOW}\nPress Ctrl+C to stop all services${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    
    if [ "$USE_DOCKER" = true ]; then
        read -p "Stop PostgreSQL container? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down
            echo -e "${GREEN}✅ PostgreSQL stopped${NC}"
        fi
    fi
    
    echo -e "${GREEN}✅ Application stopped${NC}"
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Start backend
echo -e "${YELLOW}Starting backend server...${NC}"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo -e "${YELLOW}Starting frontend development server...${NC}"
cd client-new && npm start &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID