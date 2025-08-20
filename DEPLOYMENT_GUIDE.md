# SolarERP Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Backup & Recovery](#backup--recovery)
9. [Security Checklist](#security-checklist)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: v18.x or higher
- **PostgreSQL**: v13 or higher
- **Redis**: v6 or higher (optional but recommended)
- **RAM**: Minimum 4GB, recommended 8GB
- **Storage**: Minimum 20GB free space
- **OS**: Ubuntu 20.04 LTS, macOS, or Windows Server 2019+

### Required Tools
```bash
# Check versions
node --version  # Should be >= 18.x
npm --version   # Should be >= 8.x
psql --version  # Should be >= 13.x
redis-cli --version  # Should be >= 6.x
docker --version  # Should be >= 20.x (if using Docker)
```

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/solarerp.git
cd solarerp
```

### 2. Install Dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client-new
npm install
cd ..
```

### 3. Environment Variables
Create `.env` file in root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solarerp
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA=/path/to/ca-cert.pem  # For production

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your-very-secure-random-string-minimum-32-chars
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# Server Configuration
NODE_ENV=production
PORT=5002
CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@solarerp.com

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Admin Account
ADMIN_EMAIL=admin@solarerp.com
ADMIN_PASSWORD=SecurePassword123!
ADMIN_NAME=System Administrator
```

## Database Setup

### 1. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE solarerp;
CREATE DATABASE solarerp_test;  # For testing

# Create user (optional)
CREATE USER solarerp_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE solarerp TO solarerp_user;
\q
```

### 2. Run Migrations
```bash
# Run migrations
npm run db:migrate

# Verify migration status
npm run db:migrate:status
```

### 3. Create Admin User
```bash
npm run create-admin
```

### 4. Seed Data (Optional)
```bash
npm run db:seed
```

## Application Deployment

### Development Environment
```bash
# Start backend (with hot reload)
npm run dev

# Start frontend (in new terminal)
cd client-new
npm start
```

### Production Build
```bash
# Build frontend
cd client-new
npm run build
cd ..

# Start production server
npm start
```

### Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Monitor application
pm2 monit

# View logs
pm2 logs

# Save PM2 configuration
pm2 save
pm2 startup
```

#### PM2 Ecosystem File (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'solarerp',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5002
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

## Docker Deployment

### 1. Build Docker Image
```bash
# Build image
docker build -t solarerp:latest .

# Or use docker-compose
docker-compose build
```

### 2. Run with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Docker Compose Configuration
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5002:5002"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: solarerp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Cloud Deployment

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up

# Add environment variables
railway variables set KEY=value
```

### AWS EC2 Deployment
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install dependencies
sudo apt update
sudo apt install nodejs npm postgresql redis-server nginx

# Clone repository
git clone https://github.com/your-org/solarerp.git
cd solarerp

# Install and build
npm install
cd client-new && npm install && npm run build && cd ..

# Configure Nginx
sudo nano /etc/nginx/sites-available/solarerp

# Nginx configuration
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        root /home/ubuntu/solarerp/client-new/build;
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/solarerp /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx

# Start with PM2
pm2 start ecosystem.config.js --env production
```

### Heroku Deployment
```bash
# Create Heroku app
heroku create solarerp-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate
```

## Monitoring & Maintenance

### 1. Application Monitoring
```javascript
// Sentry Configuration (already integrated)
// View errors at: https://sentry.io/organizations/your-org/issues/

// Custom health check endpoint
GET /health/detailed

// Metrics endpoint
GET /api/metrics
```

### 2. Database Monitoring
```sql
-- Check database size
SELECT pg_database_size('solarerp');

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan;
```

### 3. Redis Monitoring
```bash
# Redis CLI monitoring
redis-cli -a your_password
> INFO
> MONITOR
> CLIENT LIST
```

### 4. Log Management
```bash
# Application logs
tail -f logs/app.log
tail -f logs/error.log
tail -f logs/security.log

# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f app
```

## Backup & Recovery

### 1. Database Backup
```bash
# Manual backup
pg_dump -U postgres -d solarerp > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U postgres -d solarerp | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables
pg_dump -U postgres -d solarerp -t users -t customers > users_customers_backup.sql
```

### 2. Automated Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="solarerp"
DB_USER="postgres"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz s3://your-bucket/backups/
```

### 3. Restore from Backup
```bash
# Restore from SQL file
psql -U postgres -d solarerp < backup.sql

# Restore from compressed file
gunzip -c backup.sql.gz | psql -U postgres -d solarerp
```

### 4. File Backup
```bash
# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Restore files
tar -xzf uploads_backup_20240120.tar.gz
```

## Security Checklist

### Pre-Deployment
- [ ] Change all default passwords
- [ ] Generate strong JWT secret (minimum 32 characters)
- [ ] Configure SSL certificates
- [ ] Enable database SSL
- [ ] Set up firewall rules
- [ ] Configure CORS properly
- [ ] Remove demo endpoints
- [ ] Disable debug mode
- [ ] Set secure cookie flags
- [ ] Configure rate limiting

### Post-Deployment
- [ ] Run security audit: `npm audit`
- [ ] Check OWASP compliance
- [ ] Perform penetration testing
- [ ] Set up monitoring alerts
- [ ] Configure backup automation
- [ ] Review access logs regularly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection parameters
psql -h localhost -U postgres -d solarerp

# Check firewall
sudo ufw status
```

#### 2. Redis Connection Failed
```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

#### 3. Port Already in Use
```bash
# Find process using port
lsof -i :5002

# Kill process
kill -9 [PID]
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h

# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

#### 5. Permission Errors
```bash
# Fix file permissions
chmod -R 755 .
chmod -R 777 uploads/ logs/

# Fix npm permissions
npm cache clean --force
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Analyze tables
ANALYZE;

-- Reindex
REINDEX DATABASE solarerp;

-- Vacuum
VACUUM FULL;
```

#### 2. Application Optimization
```bash
# Enable Node.js clustering
pm2 start -i max

# Enable compression
# Already configured in server.js

# Use CDN for static assets
# Configure in nginx or CloudFlare
```

## Support

For additional support:
- Documentation: `/docs`
- API Documentation: `https://yourdomain.com/api-docs`
- GitHub Issues: https://github.com/your-org/solarerp/issues
- Email: support@solarerp.com

## License

Copyright (c) 2024 SolarERP. All rights reserved.