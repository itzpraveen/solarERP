# Contributing to SolarERP

Thank you for your interest in contributing to SolarERP! This guide will help you get started with the development process.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Development Setup

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/solarerp.git
   cd solarerp
   ```

2. **Run the setup script:**
   ```bash
   ./scripts/dev-setup.sh
   ```

3. **Start development:**
   ```bash
   make dev  # or npm run dev:full
   ```

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd client-new && npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database:**
   ```bash
   npm run db:create
   npm run db:migrate
   ```

4. **Install Git hooks:**
   ```bash
   npx husky install
   ```

## Code Standards

### General Guidelines

- Write clean, readable, and maintainable code
- Follow the DRY (Don't Repeat Yourself) principle
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic
- Handle errors appropriately

### JavaScript/TypeScript

- Use ES6+ features
- Prefer `const` over `let`, never use `var`
- Use async/await over callbacks
- Use template literals for string interpolation
- Destructure objects and arrays when appropriate

### React

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for type safety
- Follow the component structure:
  ```tsx
  import statements
  
  interface Props { }
  
  const Component: React.FC<Props> = () => {
    // hooks
    // handlers
    // render
  }
  
  export default Component;
  ```

### Formatting

Code is automatically formatted using Prettier. Run:
```bash
npm run format
```

### Linting

Code is linted using ESLint. Run:
```bash
npm run lint:fix
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Changes to build process or dependencies
- **ci**: CI/CD configuration changes
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit
- **wip**: Work in progress (should not be merged)
- **hotfix**: Critical bug fix for production

### Examples

```bash
feat(auth): add JWT authentication

Implement JWT-based authentication system with refresh tokens.
- Add login/logout endpoints
- Add middleware for protected routes
- Add token refresh mechanism

Closes #123
```

```bash
fix(api): resolve memory leak in database connections

The connection pool was not properly releasing connections
after queries completed, causing memory usage to grow over time.

BREAKING CHANGE: Database configuration now requires poolSize parameter
```

### Using the Commit Helper

Use our interactive commit helper:
```bash
./scripts/commit-helper.sh
```

## Pull Request Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes:**
   - Write code
   - Add tests
   - Update documentation

3. **Run quality checks:**
   ```bash
   make validate  # Runs linting, formatting, and tests
   ```

4. **Commit your changes:**
   ```bash
   ./scripts/commit-helper.sh
   ```

5. **Push to your fork:**
   ```bash
   git push origin feat/your-feature-name
   ```

6. **Create a Pull Request:**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Include screenshots for UI changes
   - Ensure all checks pass

### PR Title Format

Follow the same format as commit messages:
```
feat(scope): Brief description
```

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] No console.log statements left
- [ ] No commented-out code
- [ ] PR description is clear and complete

## Testing Guidelines

### Running Tests

```bash
# Run all tests
make test

# Run backend tests
npm run test

# Run frontend tests
cd client-new && npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

Example test:
```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: 'password123' };
      
      // Act
      const user = await UserService.createUser(userData);
      
      // Assert
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password);
    });
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for functions:
  ```javascript
  /**
   * Creates a new user in the database
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @returns {Promise<User>} Created user object
   * @throws {ValidationError} If user data is invalid
   */
  async function createUser(userData) {
    // ...
  }
  ```

- Add TypeScript interfaces:
  ```typescript
  interface UserData {
    email: string;
    password: string;
    name?: string;
  }
  ```

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error responses
- Update when making changes

### README Updates

Update README.md when:
- Adding new features
- Changing setup process
- Adding new dependencies
- Changing configuration

## Development Tips

### Useful Commands

```bash
# Start development
make dev

# Run linting and formatting
make lint-fix
make format

# Database operations
make db-reset
make db-migrate

# Docker operations
make docker-up
make docker-logs

# Health check
./scripts/health-check.sh

# Generate API docs
./scripts/generate-api-docs.sh
```

### Debugging

1. **Backend debugging:**
   - Use VS Code debugger (F5)
   - Or run: `npm run dev:debug`

2. **Frontend debugging:**
   - Use browser DevTools
   - React Developer Tools extension

3. **Database debugging:**
   - Use Adminer at http://localhost:8080
   - Check logs: `docker-compose logs postgres`

### Performance

- Profile before optimizing
- Use React DevTools Profiler
- Monitor bundle size
- Use lazy loading for large components
- Implement proper caching strategies

## Getting Help

- Check existing issues and PRs
- Read the documentation
- Ask in discussions
- Contact maintainers

## Code of Conduct

Please be respectful and professional in all interactions. We're all here to build something great together!

---

Thank you for contributing to SolarERP! 🚀