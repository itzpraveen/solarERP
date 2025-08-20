# 🚂 Railway Deployment Guide for SolarERP

This guide will walk you through deploying SolarERP to Railway step by step.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Railway CLI** (Optional): Install with `npm install -g @railway/cli`

## Step 1: Prepare Your Repository

### 1.1 Push Latest Changes to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 1.2 Verify Required Files
Ensure these files exist in your repository:
- ✅ `railway.json` (Railway configuration)
- ✅ `package.json` with Railway scripts
- ✅ `.env.example` as template for environment variables
- ✅ `Dockerfile.railway` (optional, for Docker deployment)

## Step 2: Create New Railway Project

### Option A: Using Railway Dashboard (Recommended)

1. **Login to Railway Dashboard**
   - Go to [railway.app/dashboard](https://railway.app/dashboard)
   - Click "New Project"

2. **Choose Deployment Method**
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub account
   - Select your `solarERP` repository
   - Choose the `main` branch (or your preferred branch)

3. **Railway will automatically detect:**
   - Node.js application
   - Build commands from `railway.json`
   - Required services (PostgreSQL, Redis)

### Option B: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Link to your GitHub repo
railway link
```

## Step 3: Add Required Services

### 3.1 Add PostgreSQL Database

In Railway Dashboard:
1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway creates a PostgreSQL instance automatically
3. Note the connection variables created:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`
   - `DATABASE_URL`

### 3.2 Add Redis Cache

1. Click "New" → "Database" → "Add Redis"
2. Railway creates a Redis instance
3. Note the connection variable:
   - `REDIS_URL`

## Step 4: Configure Environment Variables

### 4.1 In Railway Dashboard

Navigate to your service → "Variables" tab and add:

```env
# Application Settings
NODE_ENV=production
PORT=5002
ENABLE_NONAUTH_ROUTES=true

# Database (Auto-populated by Railway PostgreSQL)
DATABASE_URL=${{PGDATABASE.DATABASE_URL}}
DB_HOST=${{PGDATABASE.PGHOST}}
DB_PORT=${{PGDATABASE.PGPORT}}
DB_NAME=${{PGDATABASE.PGDATABASE}}
DB_USERNAME=${{PGDATABASE.PGUSER}}
DB_PASSWORD=${{PGDATABASE.PGPASSWORD}}
DB_SSL=true

# Redis (Auto-populated by Railway Redis)
REDIS_URL=${{REDIS.REDIS_URL}}

# Security (IMPORTANT: Generate secure values!)
JWT_SECRET=your-very-secure-random-string-minimum-32-characters-change-this
JWT_EXPIRES_IN=7d
SESSION_SECRET=another-secure-random-string-change-this

# CORS
CORS_ORIGIN=https://your-app-name.up.railway.app
CLIENT_URL=https://your-app-name.up.railway.app

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@solarerp.com

# Admin Account (for initial setup)
ADMIN_EMAIL=admin@solarerp.com
ADMIN_PASSWORD=ChangeThisImmediately123!
ADMIN_NAME=System Administrator

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn-if-you-have-one

# API Configuration
API_VERSION=v1
API_PREFIX=/api
```

### 4.2 Generate Secure Secrets

Use this command to generate secure secrets:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Deploy Application

### 5.1 Automatic Deployment

Once connected to GitHub, Railway will:
1. Automatically detect pushes to your repository
2. Run the build command: `npm install && cd client-new && npm install && npm run build`
3. Run database migrations: `npm run db:migrate`
4. Start the application: `npm run railway:start`

### 5.2 Manual Deployment (CLI)

```bash
# Deploy current code
railway up

# Deploy with specific environment
railway up --environment production

# View deployment logs
railway logs
```

## Step 6: Database Setup

### 6.1 Run Migrations

Railway should automatically run migrations, but you can manually run them:

```bash
# Using Railway CLI
railway run npm run db:migrate

# Or in Railway Dashboard
# Navigate to your service → "Settings" → "Deploy" → "Run Command"
# Enter: npm run db:migrate
```

### 6.2 Create Admin User

```bash
# Using Railway CLI
railway run npm run create-admin

# This uses the ADMIN_EMAIL and ADMIN_PASSWORD from environment variables
```

### 6.3 Seed Data (Optional)

```bash
railway run npm run db:seed
```

## Step 7: Configure Custom Domain (Optional)

### 7.1 In Railway Dashboard

1. Go to your service → "Settings" → "Domains"
2. Click "Add Custom Domain"
3. Enter your domain: `app.yourdomain.com`
4. Railway provides DNS records to add to your domain provider

### 7.2 Update DNS Records

Add to your domain's DNS:
```
Type: CNAME
Name: app (or your subdomain)
Value: your-app.up.railway.app
```

### 7.3 Update Environment Variables

After domain is configured:
```env
CORS_ORIGIN=https://app.yourdomain.com
CLIENT_URL=https://app.yourdomain.com
```

## Step 8: Verify Deployment

### 8.1 Check Application Health

```bash
# Visit your Railway URL
https://your-app-name.up.railway.app/health

# Should return:
{
  "status": "ok",
  "timestamp": "2024-01-20T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### 8.2 Check Detailed Health

```bash
https://your-app-name.up.railway.app/health/detailed

# Returns database and Redis connection status
```

### 8.3 Access API Documentation

```bash
https://your-app-name.up.railway.app/api-docs
```

### 8.4 Test Login

1. Navigate to: `https://your-app-name.up.railway.app`
2. Login with admin credentials
3. Verify dashboard loads correctly

## Step 9: Monitoring & Logs

### 9.1 View Logs in Railway

- Dashboard → Your Service → "Logs" tab
- Real-time log streaming
- Filter by deployment or time range

### 9.2 Using Railway CLI

```bash
# View recent logs
railway logs

# Follow logs in real-time
railway logs -f

# View last 100 lines
railway logs --lines 100
```

### 9.3 Monitor Resources

- Dashboard → Your Service → "Metrics" tab
- Monitor CPU, Memory, Network usage
- Set up alerting (Railway Pro feature)

## Step 10: Troubleshooting

### Common Issues and Solutions

#### Issue 1: Build Fails
```bash
# Check build logs
railway logs --build

# Common fixes:
# 1. Ensure all dependencies are in package.json
# 2. Check Node version compatibility
# 3. Verify build command in railway.json
```

#### Issue 2: Database Connection Failed
```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run node -e "
  const { Sequelize } = require('sequelize');
  const sequelize = new Sequelize(process.env.DATABASE_URL);
  sequelize.authenticate()
    .then(() => console.log('Connected'))
    .catch(err => console.error('Failed:', err));
"
```

#### Issue 3: Application Crashes
```bash
# Check error logs
railway logs --filter error

# Common fixes:
# 1. Verify all environment variables are set
# 2. Check JWT_SECRET is at least 32 characters
# 3. Ensure migrations have run
# 4. Verify Node version matches local development
```

#### Issue 4: Redis Connection Failed
```bash
# Verify REDIS_URL
railway variables | grep REDIS

# Test Redis connection
railway run node -e "
  const redis = require('ioredis');
  const client = new redis(process.env.REDIS_URL);
  client.ping().then(() => {
    console.log('Redis connected');
    client.quit();
  });
"
```

## Step 11: Backup Configuration

### 11.1 Enable Automatic Backups

Railway automatically backs up PostgreSQL databases. To configure:
1. Dashboard → PostgreSQL Service → "Settings"
2. Enable "Point-in-time Recovery"
3. Set backup retention period

### 11.2 Manual Backup

```bash
# Create manual backup
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Download backup locally
railway run pg_dump $DATABASE_URL | gzip > solarerp_backup_$(date +%Y%m%d).sql.gz
```

## Step 12: Scaling & Performance

### 12.1 Horizontal Scaling

In Railway Dashboard:
1. Service → "Settings" → "Scaling"
2. Increase "Replicas" count
3. Railway automatically load balances

### 12.2 Vertical Scaling

1. Service → "Settings" → "Resources"
2. Adjust CPU and Memory limits
3. Changes apply on next deployment

### 12.3 Enable Caching Headers

Already configured in the application:
- Static assets: 1 year cache
- API responses: 5 minute cache (for GET requests)
- HTML: No cache

## Step 13: Continuous Deployment

### 13.1 Setup GitHub Actions

The repository includes `.github/workflows/ci.yml` for:
- Running tests on push
- Building Docker images
- Deploying to Railway

### 13.2 Enable Auto-Deploy

1. Dashboard → Service → "Settings" → "Deploy"
2. Enable "Auto Deploy"
3. Select branch to track (usually `main`)

### 13.3 Deployment Environments

Create multiple environments:
```bash
# Create staging environment
railway environment create staging

# Deploy to staging
railway up --environment staging

# Promote to production
railway environment promote staging
```

## Security Checklist for Railway

- [ ] Changed default JWT_SECRET
- [ ] Changed default admin password
- [ ] Set secure SESSION_SECRET
- [ ] Configured CORS_ORIGIN correctly
- [ ] Enabled SSL (automatic on Railway)
- [ ] Set NODE_ENV=production
- [ ] Removed demo endpoints
- [ ] Configured rate limiting
- [ ] Set up monitoring (Sentry)
- [ ] Enabled backup strategy

## Useful Railway Commands

```bash
# View project info
railway status

# List environments
railway environment list

# Switch environment
railway environment checkout staging

# Run one-off commands
railway run npm run db:migrate
railway run node src/scripts/createAdminUser.js

# Connect to database
railway connect postgres

# View resource usage
railway usage

# Restart service
railway restart

# Remove deployment
railway down
```

## Support Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **SolarERP Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Application Logs**: `railway logs -f`
- **API Documentation**: `https://your-app.up.railway.app/api-docs`

## Cost Estimation

Railway Pricing (as of 2024):
- **Starter**: $5/month (includes $5 usage)
- **Pro**: $20/month (includes $20 usage)

Typical SolarERP usage:
- Application: ~$5-10/month
- PostgreSQL: ~$5-10/month
- Redis: ~$5/month
- **Total**: ~$15-25/month

## Final Notes

1. **Monitor First 24 Hours**: Watch logs closely after deployment
2. **Test All Features**: Verify all endpoints work correctly
3. **Set Up Alerts**: Configure uptime monitoring
4. **Document Changes**: Keep track of any production-specific configurations
5. **Regular Backups**: Set up automated backup schedule

---

🎉 **Congratulations!** Your SolarERP application is now deployed on Railway!

For any issues, check the logs first: `railway logs -f`