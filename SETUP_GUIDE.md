# SolarERP Setup Guide

Complete setup instructions for running SolarERP locally and deploying to Railway.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Railway Deployment](#railway-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js 16+ and npm
- PostgreSQL 15+ (or Docker)
- Git
- Railway CLI (for deployment)

### Optional Software
- Docker & Docker Compose (recommended)
- pgAdmin or DBeaver (database GUI)
- Postman or Insomnia (API testing)

---

## Local Development Setup

### Method 1: Using Docker (Recommended)

This is the easiest way to get started with all dependencies configured.

#### Step 1: Clone the Repository
```bash
git clone https://github.com/itzpraveen/solarERP.git
cd solarERP
```

#### Step 2: Create Environment File
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solarerp_dev
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Application
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Frontend URL
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Admin User (for initial setup)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=AdminPass123!
ADMIN_NAME=System Administrator

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@solarerp.com
```

#### Step 3: Start PostgreSQL with Docker
```bash
# Start only PostgreSQL service
docker-compose up -d postgres

# Verify it's running
docker ps

# Check PostgreSQL logs
docker-compose logs postgres
```

#### Step 4: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client-new
npm install
cd ..
```

#### Step 5: Setup Database
```bash
# Create databases
docker exec solarerp-postgres-1 psql -U postgres -c "CREATE DATABASE solarerp_dev;"
docker exec solarerp-postgres-1 psql -U postgres -c "CREATE DATABASE solarerp_test;"

# Run migrations
npx sequelize-cli db:migrate

# Create admin user
npm run create-admin
```

#### Step 6: Start the Application
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd client-new
npm start
```

#### Step 7: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Login with admin credentials from `.env`

---

### Method 2: Using Local PostgreSQL

If you have PostgreSQL installed locally.

#### Step 1: Setup PostgreSQL
```bash
# Access PostgreSQL
psql -U postgres

# Create databases
CREATE DATABASE solarerp_dev;
CREATE DATABASE solarerp_test;
\q
```

#### Step 2: Configure Environment
```bash
# Copy and edit .env file
cp .env.example .env
nano .env  # or use your preferred editor
```

Update database credentials to match your local PostgreSQL:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solarerp_dev
DB_USERNAME=postgres
DB_PASSWORD=your-postgres-password
```

#### Step 3: Install & Setup
```bash
# Install dependencies
npm install
cd client-new && npm install && cd ..

# Run migrations
npx sequelize-cli db:migrate

# Create admin user
npm run create-admin

# Start application
npm run dev  # Backend
# In new terminal:
cd client-new && npm start  # Frontend
```

---

### Method 3: Full Docker Setup

Run the entire application with Docker.

#### Step 1: Build and Start All Services
```bash
# Build and start all containers
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

#### Step 2: Access the Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5002
- PostgreSQL: localhost:5432

#### Step 3: View Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
```

#### Step 4: Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

---

## Railway Deployment

### Step 1: Prepare Your Repository

Ensure your repository has:
- ✅ `package.json` with start script
- ✅ `.env.example` file
- ✅ `Procfile` (optional)
- ✅ Database migrations

### Step 2: Create Railway Account
1. Sign up at [railway.app](https://railway.app)
2. Install Railway CLI:
```bash
# macOS
brew install railway

# Windows
scoop install railway

# Linux
curl -fsSL https://railway.app/install.sh | sh
```

### Step 3: Initialize Railway Project
```bash
# Login to Railway
railway login

# Initialize new project
railway init

# Link to existing project (if already created)
railway link
```

### Step 4: Add PostgreSQL Database
```bash
# Add PostgreSQL plugin
railway add

# Select PostgreSQL from the list
# This creates a PostgreSQL instance with connection details
```

### Step 5: Configure Environment Variables

#### Option A: Using Railway CLI
```bash
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET="your-production-secret-minimum-32-chars"
railway variables set JWT_EXPIRES_IN=7d
railway variables set CORS_ORIGIN="https://your-frontend-domain.com"
railway variables set CLIENT_URL="https://your-frontend-domain.com"
railway variables set ADMIN_EMAIL="admin@yourcompany.com"
railway variables set ADMIN_PASSWORD="SecureAdminPass123!"
railway variables set ADMIN_NAME="System Administrator"
```

#### Option B: Using Railway Dashboard
1. Go to your project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add all required environment variables

#### Database Variables (Auto-configured by Railway)
Railway automatically provides these variables when you add PostgreSQL:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port
- `PGDATABASE` - Database name
- `PGUSER` - Database username
- `PGPASSWORD` - Database password

Update your code to use Railway's variables:
```javascript
// In src/config/database.js
production: {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
}
```

### Step 6: Update package.json for Railway
```json
{
  "scripts": {
    "start": "node src/index.js",
    "build": "cd client-new && npm install && npm run build",
    "railway-build": "npm run build && npx sequelize-cli db:migrate",
    "postinstall": "npm run railway-build"
  }
}
```

### Step 7: Create railway.json (Optional)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run railway-build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 8: Deploy to Railway
```bash
# Deploy current branch
railway up

# Deploy specific branch
railway up --branch main

# Monitor deployment
railway logs
```

### Step 9: Run Migrations on Railway
```bash
# Execute migration command on Railway
railway run npx sequelize-cli db:migrate

# Create admin user
railway run npm run create-admin
```

### Step 10: Setup Custom Domain (Optional)
1. Go to Railway dashboard
2. Select your service
3. Go to "Settings" tab
4. Click "Generate Domain" or "Add Custom Domain"
5. Update your DNS records if using custom domain

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development`, `production` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `solarerp_dev` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your-password` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-secret-key...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_SSL` | Enable SSL for database | `false` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `CLIENT_URL` | Frontend URL | `http://localhost:3000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` |
| `EMAIL_HOST` | SMTP host | - |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USERNAME` | SMTP username | - |
| `EMAIL_PASSWORD` | SMTP password | - |
| `EMAIL_FROM` | Default from email | `noreply@solarerp.com` |
| `ADMIN_EMAIL` | Initial admin email | - |
| `ADMIN_PASSWORD` | Initial admin password | - |
| `ADMIN_NAME` | Initial admin name | `System Administrator` |

### Railway-Specific Variables

Railway automatically provides:
- `DATABASE_URL` - Full PostgreSQL connection string
- `RAILWAY_ENVIRONMENT` - Current environment
- `RAILWAY_SERVICE_NAME` - Service name
- `RAILWAY_PROJECT_ID` - Project ID

---

## Verification Steps

### 1. Test Database Connection
```bash
# Local
node -e "
const db = require('./src/models');
db.sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Connection failed:', err));
"

# Railway
railway run node -e "/* same code */"
```

### 2. Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Create user (replace with your URL)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 3. Check Migrations Status
```bash
# Local
npx sequelize-cli db:migrate:status

# Railway
railway run npx sequelize-cli db:migrate:status
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U postgres -d solarerp_dev

# Check environment variables
node -e "console.log(process.env.DB_HOST, process.env.DB_NAME)"
```

#### 2. Migration Errors
```bash
# Reset database (CAUTION: Deletes all data)
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo
```

#### 3. Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

#### 4. Railway Deployment Issues
```bash
# Check logs
railway logs

# Restart service
railway restart

# Redeploy
railway up --detach

# Check environment variables
railway variables
```

#### 5. Docker Issues
```bash
# Clean up Docker
docker-compose down -v
docker system prune -a

# Rebuild containers
docker-compose build --no-cache
docker-compose up
```

---

## Development Workflow

### Daily Development
```bash
# 1. Start services
docker-compose up -d postgres
npm run dev

# 2. Make changes
# ... edit code ...

# 3. Run tests
npm test

# 4. Commit changes
git add .
git commit -m "Your changes"
git push
```

### Before Deployment
```bash
# 1. Run all tests
npm test

# 2. Build frontend
cd client-new && npm run build

# 3. Test production build
NODE_ENV=production npm start

# 4. Deploy to Railway
railway up
```

---

## Useful Commands

### Database Commands
```bash
# Create migration
npx sequelize-cli migration:generate --name your-migration-name

# Run migrations
npx sequelize-cli db:migrate

# Undo migration
npx sequelize-cli db:migrate:undo

# Create seeder
npx sequelize-cli seed:generate --name demo-users

# Run seeders
npx sequelize-cli db:seed:all
```

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute command in container
docker exec -it solarerp-postgres-1 psql -U postgres

# Clean everything
docker-compose down -v
docker system prune -a
```

### Railway Commands
```bash
# Deploy
railway up

# View logs
railway logs

# Run command
railway run <command>

# Open dashboard
railway open

# Link project
railway link

# Environment variables
railway variables set KEY=value
railway variables
```

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [GitHub Issues](https://github.com/itzpraveen/solarERP/issues)
3. Create a new issue with details

---

## Next Steps

After successful setup:
1. ✅ Access the application
2. ✅ Login with admin credentials
3. ✅ Create test data
4. ✅ Configure email settings
5. ✅ Set up backup strategy
6. ✅ Configure monitoring

---

Last Updated: August 2025