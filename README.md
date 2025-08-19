# SolarERP - Solar Installation Management System

A comprehensive ERP solution for managing solar installation projects, customer relationships, and business operations. Built with security-first approach and modern web technologies.

## Features

### Lead Management
- Track potential customers from initial contact through qualification
- Manage lead details, interactions, and status changes
- Convert qualified leads to proposals and customers

### Proposal & Design
- Create detailed solar system proposals with accurate pricing
- Calculate system costs, capacity, and ROI
- Generate professional proposals for customers

### Customer Management
- Convert leads to customers
- Track customer details and communication preferences
- Manage multiple projects per customer

### Project Management
- Track projects through every stage of solar installation
- Manage project timelines, documents, and team assignments
- Monitor project finances including expenses and payments

### Equipment & Inventory
- Track inventory levels of panels, inverters, and other components
- Manage equipment specifications and compatibility
- Get alerts for low stock items

### Document Management
- Store and organize project-related documents securely
- Share documents with customers via secure links
- Track document versions and signatures

### Reporting & Analytics
- View sales pipeline metrics and conversion rates
- Track project performance and financial metrics
- Generate custom reports for business insights

## Tech Stack

### Backend
- **Runtime**: Node.js 16+ with Express.js framework
- **Database**: MongoDB 5.0+ with Mongoose ODM
- **Authentication**: JWT with account locking and brute force protection
- **Security**: Helmet, CORS, rate limiting, input validation & sanitization
- **File Storage**: Multer with size validation (configurable for cloud storage)

### Frontend
- **Framework**: React 19 with TypeScript
- **UI Components**: Material-UI (MUI)
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v7
- **Charts**: Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MongoDB 5.0+ (local or cloud instance)
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/itzpraveen/solarERP.git
cd solarERP
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URI=mongodb://localhost:27017/solarerp

# Security (Generate a secure 32+ character string)
JWT_SECRET=your-very-secure-random-string-minimum-32-chars
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=5000

# Client
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Admin Account (for initial setup)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=SecurePassword123!
ADMIN_NAME=System Administrator

# Email (Optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@solarerp.com
```

4. Install frontend dependencies:
```bash
cd client-new
npm install
cd ..
```

5. Create admin user:
```bash
npm run create-admin
```

6. Start the development servers:
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client-new
npm start
```

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Deployment

#### Railway Deployment

This application is configured for deployment on Railway:

1. Connect your GitHub repository to Railway
2. Add the required environment variables in Railway settings
3. The application will automatically build and deploy

#### Docker Deployment

The application includes PostgreSQL database in Docker:

```bash
# Start the application with PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will automatically:
- Create the PostgreSQL database
- Run migrations to set up tables
- Create an admin user (if configured)

#### Security Features

- **JWT Authentication**: Secure token-based authentication with issuer/audience validation
- **Password Security**: Minimum 8 characters with complexity requirements (uppercase, lowercase, number)
- **Account Locking**: Automatic lock after 5 failed login attempts (2-hour lockout)
- **Rate Limiting**: Protection against brute force attacks (5 attempts per 15 minutes for auth endpoints)
- **Input Validation**: All inputs validated and sanitized to prevent XSS and injection attacks
- **CORS Protection**: Configurable CORS with strict origin validation
- **NoSQL Injection Prevention**: Query sanitization and parameterized queries
- **File Upload Security**: Size limits (5MB default) and type validation
- **CSP Headers**: Content Security Policy to prevent XSS attacks
- **HTTPS Enforcement**: Secure cookie flags and HSTS headers in production

### API Documentation

API endpoints are organized by resource:

- **Auth**: `/api/auth` - User authentication and account management
- **Leads**: `/api/leads` - Lead management endpoints
- **Proposals**: `/api/proposals` - Proposal creation and management
- **Customers**: `/api/customers` - Customer data management
- **Projects**: `/api/projects` - Project management throughout the installation lifecycle
- **Equipment**: `/api/equipment` - Equipment and inventory management
- **Documents**: `/api/documents` - Document storage and sharing
- **Reports**: `/api/reports` - Analytics and reporting

## Production Deployment

### Environment Variables for Production

Ensure all sensitive variables are properly set:
- Use strong, unique JWT_SECRET (minimum 32 characters)
- Set NODE_ENV=production
- Configure proper CORS_ORIGIN for your domain
- Use secure database connection strings with authentication
- Enable SSL/TLS for database connections
- Configure email service for password resets

### Health Check Endpoints

- `GET /` - Basic health check
- `GET /api/health` - Detailed health status (if implemented)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
   - Check connection string format
   - Verify network access to MongoDB

2. **JWT Secret Error**
   - Ensure JWT_SECRET is set in environment variables
   - Secret must be at least 32 characters long

3. **CORS Errors**
   - Update CORS_ORIGIN in .env to match your frontend URL
   - Ensure credentials are included in requests

4. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   cd client-new
   rm -rf node_modules package-lock.json
   npm install
   ```

## Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client-new
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### v1.1.0 - Security & Performance Update
- Enhanced JWT security with issuer/audience validation
- Added account locking after failed login attempts
- Implemented comprehensive input validation and sanitization
- Added rate limiting on sensitive endpoints
- Fixed NoSQL injection vulnerabilities
- Added pagination limits to prevent DoS
- Implemented proper CORS configuration
- Added file upload size validation
- Enhanced password complexity requirements
- Improved error handling without information leakage
- Added database indexes for better performance
- Fixed all critical security vulnerabilities identified in code review

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- This project was built to address the specific needs of solar installation businesses
- Special thanks to all contributors and supporters