#!/bin/bash

# API Documentation Generator
# Generates API documentation from code comments

set -e

echo "📚 Generating API Documentation"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Install documentation tools if not present
if ! command -v jsdoc &> /dev/null; then
    echo -e "${YELLOW}Installing JSDoc...${NC}"
    npm install -g jsdoc
fi

# Create documentation directory
mkdir -p docs/api

# Generate backend API documentation
echo -e "${GREEN}Generating backend API documentation...${NC}"

cat > jsdoc.config.json << 'EOF'
{
  "source": {
    "include": ["src/"],
    "exclude": ["src/__tests__", "src/migrations"],
    "includePattern": ".+\\.js(doc|x)?$",
    "excludePattern": "(^|\\/|\\\\)_"
  },
  "opts": {
    "destination": "./docs/api/backend",
    "recurse": true,
    "template": "templates/default"
  },
  "plugins": ["plugins/markdown"],
  "templates": {
    "cleverLinks": false,
    "monospaceLinks": false
  }
}
EOF

jsdoc -c jsdoc.config.json

# Generate route documentation
echo -e "${GREEN}Generating route documentation...${NC}"

cat > docs/api/ROUTES.md << 'EOF'
# API Routes Documentation

## Authentication Routes

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

## Customer Routes

### GET /api/customers
Get all customers (paginated).

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search term

### GET /api/customers/:id
Get customer by ID.

### POST /api/customers
Create new customer.

### PUT /api/customers/:id
Update customer.

### DELETE /api/customers/:id
Delete customer.

## Lead Routes

### GET /api/leads
Get all leads (paginated).

### GET /api/leads/:id
Get lead by ID.

### POST /api/leads
Create new lead.

### PUT /api/leads/:id
Update lead.

### DELETE /api/leads/:id
Delete lead.

## Project Routes

### GET /api/projects
Get all projects.

### GET /api/projects/:id
Get project by ID.

### POST /api/projects
Create new project.

### PUT /api/projects/:id
Update project.

### DELETE /api/projects/:id
Delete project.

## Equipment Routes

### GET /api/equipment
Get all equipment.

### GET /api/equipment/:id
Get equipment by ID.

### POST /api/equipment
Create new equipment.

### PUT /api/equipment/:id
Update equipment.

### DELETE /api/equipment/:id
Delete equipment.

## Document Routes

### GET /api/documents
Get all documents.

### GET /api/documents/:id
Get document by ID.

### POST /api/documents/upload
Upload new document.

### DELETE /api/documents/:id
Delete document.

## Service Request Routes

### GET /api/service-requests
Get all service requests.

### GET /api/service-requests/:id
Get service request by ID.

### POST /api/service-requests
Create new service request.

### PUT /api/service-requests/:id
Update service request.

### DELETE /api/service-requests/:id
Delete service request.

## Report Routes

### GET /api/reports/dashboard
Get dashboard statistics.

### GET /api/reports/revenue
Get revenue reports.

### GET /api/reports/projects
Get project reports.

### GET /api/reports/export
Export reports (CSV/PDF).
EOF

# Generate TypeScript API client documentation
echo -e "${GREEN}Generating TypeScript API documentation...${NC}"

if command -v typedoc &> /dev/null; then
    cd client-new
    npx typedoc --out ../docs/api/frontend src/api
    cd ..
else
    echo -e "${YELLOW}TypeDoc not installed. Skipping TypeScript documentation.${NC}"
fi

# Clean up
rm -f jsdoc.config.json

echo -e "${GREEN}✅ API documentation generated in docs/api/${NC}"
echo "View documentation by opening docs/api/backend/index.html in a browser"