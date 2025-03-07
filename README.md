# SolarERP - Solar Business Management System

A comprehensive ERP system designed specifically for solar installation companies to manage leads, proposals, customers, projects, equipment, and documents.

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

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with role-based access control
- **File Storage**: Local file storage with multer (configurable for cloud storage)
- **Security**: Implemented with helmet, rate limiting, and input validation

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/solarERP.git
cd solarERP
```

2. Install dependencies
```bash
npm install
```

3. Create a .env file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5002
MONGODB_URI=mongodb+srv://itzvellodan:mVRHqdTyBU8Q5igL@solarerp.nb5ij.mongodb.net/?retryWrites=true&w=majority&appName=solarerp
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
EMAIL_HOST=your_email_smtp_host
EMAIL_PORT=587
EMAIL_USERNAME=your_email@example.com
EMAIL_PASSWORD=your_email_password
REDIS_URL=redis://localhost:6379
```

4. Start the development server
```bash
npm run dev
```

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was built to address the specific needs of solar installation businesses
- Special thanks to all contributors and supporters