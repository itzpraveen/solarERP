# Railway Environment Variables Setup

To properly deploy SolarERP on Railway, you need to configure the following environment variables:

## Required Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/solarerp` |
| `JWT_SECRET` | Secret key for JWT token signing | `your-secure-jwt-secret-value` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `PORT` | Application port (Railway sets this automatically) | `5002` |

## Optional Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `ADMIN_EMAIL` | Default admin email | `admin@solarerp.com` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@123` |
| `ADMIN_FIRST_NAME` | Default admin first name | `Admin` |
| `ADMIN_LAST_NAME` | Default admin last name | `User` |
| `EMAIL_HOST` | SMTP host for sending emails | `smtp.example.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USERNAME` | SMTP username | `your_email@example.com` |
| `EMAIL_PASSWORD` | SMTP password | `your-email-password` |
| `REDIS_URL` | Redis connection string (if used) | `redis://localhost:6379` |

## How to Configure Environment Variables in Railway

1. Go to your project in the Railway dashboard
2. Navigate to the "Variables" tab
3. Add each environment variable with its corresponding value
4. Click "Save Changes"
5. Railway will automatically redeploy your application with the new environment variables

## Note About JWT_SECRET

The JWT_SECRET is crucial for authentication. We've added a fallback in the code, but it's recommended to set this explicitly in Railway for security purposes.
