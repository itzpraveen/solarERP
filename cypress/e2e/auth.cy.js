describe('Authentication Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Flow', () => {
    it('should display login form', () => {
      cy.visit('/login');
      cy.get('form').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Login');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Invalid credentials').should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('admin@solarerp.com');
      cy.get('input[name="password"]').type('SecurePassword123!');
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should redirect to login when accessing protected route', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('Signup Flow', () => {
    it('should display signup form', () => {
      cy.visit('/signup');
      cy.get('form').should('be.visible');
      cy.get('input[name="firstName"]').should('be.visible');
      cy.get('input[name="lastName"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
    });

    it('should validate password requirements', () => {
      cy.visit('/signup');
      cy.get('input[name="password"]').type('weak');
      cy.get('input[name="confirmPassword"]').click();
      
      cy.contains('Password must be at least 8 characters').should('be.visible');
    });

    it('should check password match', () => {
      cy.visit('/signup');
      cy.get('input[name="password"]').type('StrongPass123!');
      cy.get('input[name="confirmPassword"]').type('DifferentPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Passwords do not match').should('be.visible');
    });

    it('should successfully create new account', () => {
      const timestamp = Date.now();
      const email = `test${timestamp}@example.com`;
      
      cy.visit('/signup');
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type('TestPass123!');
      cy.get('input[name="confirmPassword"]').type('TestPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Login first
      cy.login('admin@solarerp.com', 'SecurePassword123!');
    });

    it('should successfully logout', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      cy.url().should('include', '/login');
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('Password Reset Flow', () => {
    it('should display forgot password form', () => {
      cy.visit('/forgot-password');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Reset Password');
    });

    it('should send reset email', () => {
      cy.visit('/forgot-password');
      cy.get('input[name="email"]').type('user@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Password reset email sent').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page reloads', () => {
      cy.login('admin@solarerp.com', 'SecurePassword123!');
      cy.reload();
      cy.url().should('include', '/dashboard');
    });

    it('should handle expired token gracefully', () => {
      cy.login('admin@solarerp.com', 'SecurePassword123!');
      
      // Simulate expired token
      cy.window().then((win) => {
        win.localStorage.setItem('token', 'expired.token.here');
      });
      
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
});