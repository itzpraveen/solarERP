# 🚂 Railway Deployment Checklist

Use this checklist to ensure successful deployment to Railway.

## Pre-Deployment

### Repository Preparation
- [ ] All code committed to Git
- [ ] Pushed to GitHub repository
- [ ] Branch is clean (no uncommitted changes)
- [ ] Tests passing locally
- [ ] `.env.example` file updated with all required variables

### Configuration Files
- [ ] `railway.json` exists and configured
- [ ] `package.json` has Railway scripts
- [ ] `Dockerfile.railway` created (optional)
- [ ] Database migrations are up to date

## Railway Setup

### Account & Project
- [ ] Railway account created
- [ ] New project created in Railway
- [ ] GitHub repository connected
- [ ] Auto-deploy enabled for main branch

### Services
- [ ] PostgreSQL database added
- [ ] Redis cache added
- [ ] Services linked properly

### Environment Variables
- [ ] `NODE_ENV` set to `production`
- [ ] `JWT_SECRET` generated (32+ characters)
- [ ] `SESSION_SECRET` generated (32+ characters)
- [ ] `DATABASE_URL` linked from PostgreSQL
- [ ] `REDIS_URL` linked from Redis
- [ ] `ADMIN_EMAIL` configured
- [ ] `ADMIN_PASSWORD` set securely
- [ ] `CORS_ORIGIN` will be updated after deployment
- [ ] `CLIENT_URL` will be updated after deployment
- [ ] Email configuration (optional)
- [ ] Sentry DSN (optional)

## Deployment

### Initial Deploy
- [ ] Deployment triggered
- [ ] Build logs checked for errors
- [ ] Build completed successfully
- [ ] Database migrations ran
- [ ] Application started

### Post-Deployment Configuration
- [ ] Railway URL obtained (your-app.up.railway.app)
- [ ] `CORS_ORIGIN` updated with Railway URL
- [ ] `CLIENT_URL` updated with Railway URL
- [ ] Environment variables redeployed

## Verification

### Health Checks
- [ ] `/health` endpoint returns 200 OK
- [ ] `/health/detailed` shows all services connected
- [ ] Database connection verified
- [ ] Redis connection verified

### Application Testing
- [ ] Homepage loads
- [ ] Login page accessible
- [ ] Admin account can login
- [ ] Dashboard displays correctly
- [ ] API documentation at `/api-docs` works

### Feature Testing
- [ ] Create a test lead
- [ ] Convert lead to customer
- [ ] Create a project
- [ ] Upload a document
- [ ] Generate a report

## Security

### Credentials
- [ ] Default admin password changed
- [ ] JWT secret is unique and secure
- [ ] Session secret is unique and secure
- [ ] Database has strong password
- [ ] No secrets in code repository

### Configuration
- [ ] SSL/HTTPS enabled (automatic on Railway)
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Security headers verified

## Monitoring

### Logs
- [ ] Application logs accessible
- [ ] No critical errors in logs
- [ ] Performance metrics normal

### Alerts
- [ ] Uptime monitoring configured
- [ ] Error alerts set up (if using Sentry)
- [ ] Resource usage monitored

## Backup

### Database
- [ ] Automatic backups enabled
- [ ] Backup retention configured
- [ ] Manual backup tested
- [ ] Restore process documented

### Files
- [ ] Upload directory backed up
- [ ] Configuration backed up

## Documentation

### Internal
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Admin credentials stored securely
- [ ] Team members have access

### External
- [ ] API documentation accessible
- [ ] User guide updated
- [ ] Support contact configured

## Performance

### Optimization
- [ ] Caching enabled
- [ ] Compression active
- [ ] Static assets cached
- [ ] Database indexes created

### Scaling
- [ ] Resource limits appropriate
- [ ] Scaling strategy defined
- [ ] Load testing performed (optional)

## Custom Domain (Optional)

- [ ] Domain purchased
- [ ] DNS configured
- [ ] CNAME record added
- [ ] SSL certificate active
- [ ] Environment variables updated

## Final Checks

- [ ] All checklist items completed
- [ ] Application fully functional
- [ ] Stakeholders notified
- [ ] Monitoring active
- [ ] Documentation complete

## Rollback Plan

In case of issues:
1. [ ] Previous version identified
2. [ ] Rollback procedure documented
3. [ ] Database backup available
4. [ ] Team members informed

## Sign-off

- [ ] Technical Lead approval
- [ ] Security review completed
- [ ] Production ready confirmed

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
**Railway URL**: _______________

## Notes

_Add any deployment-specific notes here:_

---

## Quick Commands Reference

```bash
# View logs
railway logs -f

# Run migrations
railway run npm run db:migrate

# Create admin
railway run npm run create-admin

# Connect to database
railway connect postgres

# Restart service
railway restart

# Check status
railway status
```

## Troubleshooting Contacts

- Railway Support: [discord.gg/railway](https://discord.gg/railway)
- Technical Lead: _______________
- Database Admin: _______________
- Security Team: _______________