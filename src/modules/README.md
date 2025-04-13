# Modules Directory

This directory contains feature-based modules for the Solar ERP application. Each module is a self-contained unit that follows the clean architecture pattern.

## Architecture

Each module follows a clean architecture pattern with the following components:

1. **Controller**: Handles HTTP requests and responses
2. **Service**: Contains business logic
3. **Repository**: Abstracts database operations
4. **Routes**: Defines API endpoints
5. **Validation**: Validates input data
6. **Model**: Defines the data structure (shared across modules)

```
modules/
├── auth/
│   ├── auth.controller.js
│   ├── auth.service.js
│   ├── auth.repository.js
│   ├── auth.routes.js
│   ├── auth.validation.js
│   └── README.md
├── customers/
│   ├── customer.controller.js
│   ├── customer.service.js
│   ├── customer.repository.js
│   ├── customer.routes.js
│   ├── customer.validation.js
│   └── README.md
└── ...
```

## Creating a New Module

To create a new module, follow these steps:

1. Create a new directory in the `modules` directory with the name of your module (e.g., `payments`).
2. Create the following files in the new directory:
   - `<module>.controller.js`: Handles HTTP requests and responses
   - `<module>.service.js`: Contains business logic
   - `<module>.repository.js`: Abstracts database operations
   - `<module>.routes.js`: Defines API endpoints
   - `<module>.validation.js`: Validates input data
   - `README.md`: Documents the module

### Controller Template

```javascript
/**
 * Module Controller
 * This module handles HTTP requests and responses
 */

const moduleService = require('./module.service');
const catchAsync = require('../../common/utils/catchAsync');
const { ValidationError } = require('../../common/utils/errors');
const { validationResult } = require('express-validator');

class ModuleController {
  // Controller methods
}

module.exports = new ModuleController();
```

### Service Template

```javascript
/**
 * Module Service
 * This module handles business logic
 */

const moduleRepository = require('./module.repository');
const { NotFoundError } = require('../../common/utils/errors');

class ModuleService {
  // Service methods
}

module.exports = new ModuleService();
```

### Repository Template

```javascript
/**
 * Module Repository
 * This module abstracts database operations
 */

const Model = require('../../api/models/model.model');
const { NotFoundError } = require('../../common/utils/errors');

class ModuleRepository {
  // Repository methods
}

module.exports = new ModuleRepository();
```

### Routes Template

```javascript
/**
 * Module Routes
 * This module defines API endpoints
 */

const express = require('express');
const moduleController = require('./module.controller');
const moduleValidation = require('./module.validation');
const { protect } = require('../auth/auth.controller');

const router = express.Router();

// Define routes

module.exports = router;
```

### Validation Template

```javascript
/**
 * Module Validation
 * This module contains validation schemas
 */

const { check } = require('express-validator');

const moduleValidation = {
  // Validation schemas
};

module.exports = moduleValidation;
```

## Best Practices

1. **Separation of Concerns**: Each component should have a single responsibility.
   - Controllers handle HTTP requests and responses
   - Services handle business logic
   - Repositories handle database operations

2. **Error Handling**: Use the common error classes for consistent error handling.
   - Throw specific error types (e.g., `NotFoundError`, `ValidationError`)
   - Use the `catchAsync` utility to handle errors in controllers

3. **Validation**: Validate all input data using express-validator.
   - Define validation schemas in the validation file
   - Check validation results in the controller

4. **Documentation**: Document each module with a README file.
   - Explain the purpose of the module
   - List the API endpoints
   - Provide usage examples

5. **Testing**: Write tests for each component.
   - Unit tests for services and repositories
   - Integration tests for controllers and routes

## Existing Modules

- **Auth**: Handles authentication and authorization
- (More modules will be added as they are implemented)