# SolarERP Development Standards & Guidelines

## Table of Contents
1. [Code Quality Standards](#code-quality-standards)
2. [Backend Development Standards](#backend-development-standards)
3. [Frontend Development Standards](#frontend-development-standards)
4. [Database Standards](#database-standards)
5. [API Design Standards](#api-design-standards)
6. [Security Standards](#security-standards)
7. [Testing Standards](#testing-standards)
8. [Documentation Standards](#documentation-standards)
9. [Git Workflow](#git-workflow)
10. [Code Review Guidelines](#code-review-guidelines)

## Code Quality Standards

### General Principles
- **DRY (Don't Repeat Yourself):** Avoid code duplication
- **KISS (Keep It Simple, Stupid):** Prefer simple, readable solutions
- **YAGNI (You Aren't Gonna Need It):** Don't add functionality until needed
- **SOLID Principles:** Follow object-oriented design principles
- **Clean Code:** Self-documenting, meaningful names, small functions

### Code Formatting

#### Prettier Configuration (.prettierrc)
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### ESLint Configuration (essential rules)
```javascript
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-unused-vars": "error",
    "no-duplicate-imports": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  }
}
```

## Backend Development Standards

### Node.js/Express Best Practices

#### File Structure
```
src/
├── api/
│   ├── controllers/   # Request handlers
│   ├── routes/        # Route definitions
│   └── middleware/    # Custom middleware
├── models/           # Database models
├── services/         # Business logic
├── utils/           # Helper functions
├── config/          # Configuration files
├── validators/      # Input validation schemas
└── __tests__/       # Test files
```

#### Controller Pattern
```javascript
// Good: Thin controller, fat service
const customerService = require('../services/customer.service');

exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.findById(req.params.id);
    res.json({ status: 'success', data: customer });
  } catch (error) {
    next(error);
  }
};

// Bad: Business logic in controller
exports.getCustomer = async (req, res, next) => {
  try {
    // Don't put business logic here
    const customer = await Customer.findById(req.params.id);
    customer.lastAccessed = new Date();
    await customer.save();
    // Complex calculations...
    res.json(customer);
  } catch (error) {
    next(error);
  }
};
```

#### Service Layer Pattern
```javascript
// services/customer.service.js
class CustomerService {
  async findById(id) {
    const customer = await Customer.findByPk(id, {
      include: ['projects', 'documents']
    });
    
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    
    return customer;
  }

  async createCustomer(data) {
    // Validation
    const validated = await customerSchema.validate(data);
    
    // Business logic
    const customer = await sequelize.transaction(async (t) => {
      const customer = await Customer.create(validated, { transaction: t });
      await this.sendWelcomeEmail(customer);
      await this.createInitialProject(customer, t);
      return customer;
    });
    
    return customer;
  }
}

module.exports = new CustomerService();
```

#### Error Handling
```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}
```

#### Async Error Handling
```javascript
// utils/catchAsync.js
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Usage in routes
router.get('/:id', catchAsync(async (req, res) => {
  const data = await service.getData(req.params.id);
  res.json(data);
}));
```

### Database Query Patterns

#### Sequelize Best Practices
```javascript
// Good: Use scopes for common queries
const Project = sequelize.define('Project', {
  // fields...
}, {
  scopes: {
    active: {
      where: { status: 'active' }
    },
    withCustomer: {
      include: ['customer']
    }
  }
});

// Usage
const activeProjects = await Project.scope('active', 'withCustomer').findAll();

// Good: Use transactions for multiple operations
await sequelize.transaction(async (t) => {
  const project = await Project.create(data, { transaction: t });
  await ProjectDocument.create({ projectId: project.id }, { transaction: t });
  await CustomerNote.create({ note: 'Project created' }, { transaction: t });
});

// Good: Optimize queries with proper includes
const projects = await Project.findAll({
  include: [
    {
      model: Customer,
      attributes: ['id', 'name'], // Only select needed fields
    },
    {
      model: Document,
      where: { status: 'active' },
      required: false // LEFT JOIN
    }
  ],
  limit: 20,
  offset: 0
});
```

## Frontend Development Standards

### React/TypeScript Best Practices

#### Component Structure
```typescript
// Good: Functional component with proper typing
interface CustomerCardProps {
  customer: Customer;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleEdit = useCallback(() => {
    onEdit(customer.id);
  }, [customer.id, onEdit]);

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <Card>
      {/* Component JSX */}
    </Card>
  );
};
```

#### Custom Hooks Pattern
```typescript
// hooks/useCustomer.ts
export const useCustomer = (customerId: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const data = await customerService.getById(customerId);
        setCustomer(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  return { customer, loading, error, refetch: fetchCustomer };
};
```

#### State Management Patterns
```typescript
// Context pattern for global state
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Component state patterns
const [state, setState] = useState<ComponentState>({
  data: null,
  loading: false,
  error: null
});

// Avoid multiple useState calls for related data
// Good
const [formState, setFormState] = useState({
  name: '',
  email: '',
  phone: ''
});

// Bad
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [phone, setPhone] = useState('');
```

#### Performance Optimization
```typescript
// Memoization for expensive computations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Callback memoization to prevent re-renders
const handleSubmit = useCallback((formData: FormData) => {
  submitForm(formData);
}, [submitForm]);

// Component memoization
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* Complex rendering */}</div>;
});

// Lazy loading for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

## Database Standards

### Naming Conventions

#### Tables
- Use plural, snake_case: `customers`, `project_documents`
- Junction tables: `customer_projects`, `user_roles`

#### Columns
- Use snake_case: `created_at`, `customer_id`
- Boolean fields: prefix with `is_` or `has_`: `is_active`, `has_warranty`
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Foreign keys: `<table>_id`: `customer_id`, `project_id`

### Schema Design Principles

```sql
-- Good: Proper constraints and indexes
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_dates CHECK (end_date >= start_date),
  CONSTRAINT check_status CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled'))
);

CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
```

### Migration Best Practices

```javascript
// migrations/20250820123456-add-projects-table.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      // columns...
    });
    
    // Add indexes
    await queryInterface.addIndex('projects', ['customer_id']);
    await queryInterface.addIndex('projects', ['status', 'created_at']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
  }
};
```

## API Design Standards

### RESTful Endpoint Conventions

```
GET    /api/v1/customers              # List all (paginated)
GET    /api/v1/customers/:id          # Get single
POST   /api/v1/customers              # Create new
PUT    /api/v1/customers/:id          # Full update
PATCH  /api/v1/customers/:id          # Partial update
DELETE /api/v1/customers/:id          # Delete

# Nested resources
GET    /api/v1/customers/:id/projects # Get customer's projects
POST   /api/v1/projects/:id/documents # Add document to project

# Actions
POST   /api/v1/leads/:id/convert      # Convert lead to customer
POST   /api/v1/projects/:id/complete  # Mark project complete
```

### Request/Response Standards

#### Successful Response
```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2025-08-20T10:30:00Z"
  }
}
```

#### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-08-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Pagination Response
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Input Validation

```javascript
// validators/customer.validator.js
const Joi = require('joi');

const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().length(2).required(),
    zip: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required()
  }).required()
});

// Middleware usage
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    req.body = value;
    next();
  };
};
```

## Security Standards

### Authentication & Authorization

```javascript
// JWT token generation
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
      issuer: 'solarerp',
      audience: 'solarerp-api'
    }
  );
};

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }
    next();
  };
};
```

### Input Sanitization

```javascript
// Sanitize user input
const sanitizeInput = (input) => {
  // Remove HTML tags
  input = input.replace(/<[^>]*>/g, '');
  // Escape special characters
  input = input.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
  return input.trim();
};
```

### Security Headers

```javascript
// Security middleware configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Testing Standards

### Test Structure

```javascript
// __tests__/services/customer.service.test.js
describe('CustomerService', () => {
  describe('createCustomer', () => {
    it('should create a customer with valid data', async () => {
      // Arrange
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      // Act
      const customer = await customerService.createCustomer(customerData);

      // Assert
      expect(customer).toBeDefined();
      expect(customer.name).toBe(customerData.name);
      expect(customer.email).toBe(customerData.email);
    });

    it('should throw ValidationError with invalid email', async () => {
      // Arrange
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(customerService.createCustomer(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### Integration Testing

```javascript
// __tests__/api/customer.api.test.js
describe('Customer API', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await createTestApp();
    token = await getAuthToken();
  });

  describe('POST /api/v1/customers', () => {
    it('should create a customer', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Customer',
          email: 'test@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.name).toBe('Test Customer');
    });
  });
});
```

### Frontend Testing

```typescript
// __tests__/components/CustomerCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerCard } from '../CustomerCard';

describe('CustomerCard', () => {
  const mockCustomer = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  };

  it('should render customer information', () => {
    render(
      <CustomerCard 
        customer={mockCustomer}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(
      <CustomerCard 
        customer={mockCustomer}
        onEdit={onEdit}
        onDelete={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

## Documentation Standards

### Code Documentation

```javascript
/**
 * Creates a new customer in the system
 * @param {Object} customerData - The customer data
 * @param {string} customerData.name - Customer's full name
 * @param {string} customerData.email - Customer's email address
 * @param {string} customerData.phone - Customer's phone number
 * @returns {Promise<Customer>} The created customer object
 * @throws {ValidationError} If customer data is invalid
 * @throws {DuplicateError} If email already exists
 */
async function createCustomer(customerData) {
  // Implementation
}
```

### API Documentation

```yaml
# openapi.yaml
/api/v1/customers:
  post:
    summary: Create a new customer
    tags:
      - Customers
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateCustomer'
    responses:
      201:
        description: Customer created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CustomerResponse'
      400:
        description: Invalid input
      401:
        description: Unauthorized
```

## Git Workflow

### Branch Naming
```
feature/add-customer-search
bugfix/fix-login-error
hotfix/security-patch
release/v1.2.0
```

### Commit Messages
```
feat: add customer search functionality
fix: resolve login error for inactive users
docs: update API documentation
refactor: simplify customer service logic
test: add integration tests for projects
chore: update dependencies
```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
```

## Code Review Guidelines

### Review Checklist
- [ ] Code follows established patterns
- [ ] Proper error handling
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] No commented-out code
- [ ] No console.log statements

### Review Comments
```javascript
// Good review comment
// "Consider extracting this logic into a separate service method for reusability.
// This pattern is used in multiple controllers."

// Bad review comment
// "This is wrong"
```

## Performance Guidelines

### Database Optimization
- Always use pagination for lists
- Include only necessary fields in queries
- Use eager loading to prevent N+1 queries
- Add indexes for frequently queried columns
- Use database views for complex reports

### Frontend Optimization
- Lazy load routes and components
- Implement virtual scrolling for long lists
- Use React.memo for expensive components
- Optimize images (WebP, lazy loading)
- Minimize bundle size

### API Optimization
- Implement caching (Redis)
- Use compression (gzip)
- Minimize payload size
- Implement request batching where appropriate
- Use CDN for static assets

---

*These standards are living documents and should be updated as the team grows and learns. All developers are expected to follow these guidelines and contribute to their improvement.*

*Last Updated: 2025-08-20*
*Next Review: 2025-09-20*