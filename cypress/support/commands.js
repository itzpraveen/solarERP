// Custom Cypress commands

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', `${Cypress.env('API_URL')}/auth/login`, {
    email,
    password
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
    cy.visit('/dashboard');
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  cy.visit('/login');
});

// Create lead command
Cypress.Commands.add('createLead', (leadData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/leads`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: leadData
  });
});

// Create customer command
Cypress.Commands.add('createCustomer', (customerData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/customers`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: customerData
  });
});

// Create project command
Cypress.Commands.add('createProject', (projectData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/projects`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: projectData
  });
});

// Check API health
Cypress.Commands.add('checkApiHealth', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('API_URL').replace('/api', '')}/health`,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.status).to.eq('ok');
  });
});

// Wait for element with retry
Cypress.Commands.add('waitForElement', (selector, options = {}) => {
  const defaultOptions = {
    timeout: 10000,
    interval: 500,
    ...options
  };
  
  cy.get(selector, { timeout: defaultOptions.timeout })
    .should('exist')
    .should('be.visible');
});

// Upload file command
Cypress.Commands.add('uploadFile', (selector, fileName, mimeType = 'application/pdf') => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    cy.get(selector).attachFile({
      fileContent,
      fileName,
      mimeType,
      encoding: 'base64'
    });
  });
});

// Clear all data (for test cleanup)
Cypress.Commands.add('clearTestData', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  cy.clearCookies();
});

// Intercept and wait for API calls
Cypress.Commands.add('interceptApi', (method, path, alias) => {
  cy.intercept(method, `${Cypress.env('API_URL')}${path}`, (req) => {
    req.headers['Authorization'] = `Bearer ${window.localStorage.getItem('token')}`;
  }).as(alias);
});

// Check toast message
Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get(`.toast-${type}`).should('be.visible').and('contain', message);
});

// Navigate via sidebar
Cypress.Commands.add('navigateViaMenu', (menuItem) => {
  cy.get('[data-testid="sidebar"]').within(() => {
    cy.contains(menuItem).click();
  });
});

// Fill form field
Cypress.Commands.add('fillField', (fieldName, value) => {
  cy.get(`[name="${fieldName}"]`).clear().type(value);
});

// Select dropdown option
Cypress.Commands.add('selectOption', (fieldName, optionText) => {
  cy.get(`[name="${fieldName}"]`).click();
  cy.contains(optionText).click();
});

// Date picker selection
Cypress.Commands.add('selectDate', (fieldName, date) => {
  cy.get(`[name="${fieldName}"]`).click();
  cy.get('.date-picker').within(() => {
    cy.contains(date).click();
  });
});

// Check table row
Cypress.Commands.add('checkTableRow', (searchText, shouldExist = true) => {
  if (shouldExist) {
    cy.get('table tbody').should('contain', searchText);
  } else {
    cy.get('table tbody').should('not.contain', searchText);
  }
});

// Pagination commands
Cypress.Commands.add('goToNextPage', () => {
  cy.get('[data-testid="next-page"]').click();
});

Cypress.Commands.add('goToPreviousPage', () => {
  cy.get('[data-testid="previous-page"]').click();
});

// Search command
Cypress.Commands.add('search', (searchTerm) => {
  cy.get('[data-testid="search-input"]').clear().type(searchTerm);
  cy.get('[data-testid="search-button"]').click();
});

// Sort table command
Cypress.Commands.add('sortTable', (columnName, direction = 'asc') => {
  cy.get(`[data-testid="sort-${columnName}"]`).click();
  if (direction === 'desc') {
    cy.get(`[data-testid="sort-${columnName}"]`).click();
  }
});

// Check form validation
Cypress.Commands.add('checkValidation', (fieldName, errorMessage) => {
  cy.get(`[name="${fieldName}"]`).parent().within(() => {
    cy.contains(errorMessage).should('be.visible');
  });
});

// Mock API response
Cypress.Commands.add('mockApiResponse', (method, path, response, statusCode = 200) => {
  cy.intercept(method, `${Cypress.env('API_URL')}${path}`, {
    statusCode,
    body: response
  });
});