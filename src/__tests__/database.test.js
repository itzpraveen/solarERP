const db = require('../models');

describe('PostgreSQL Database Tests', () => {
  beforeAll(async () => {
    // Ensure test database is clean
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('Database Connection', () => {
    test('should connect to PostgreSQL successfully', async () => {
      await expect(db.sequelize.authenticate()).resolves.not.toThrow();
    });

    test('should have all models loaded', () => {
      expect(db.User).toBeDefined();
      expect(db.Customer).toBeDefined();
      expect(db.Lead).toBeDefined();
      expect(db.Project).toBeDefined();
      expect(db.Proposal).toBeDefined();
      expect(db.Equipment).toBeDefined();
      expect(db.Document).toBeDefined();
      expect(db.ServiceRequest).toBeDefined();
    });
  });

  describe('User Model Tests', () => {
    test('should create a user with valid data', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'TestPass123!',
        role: 'user'
      };

      const user = await db.User.create(userData);
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('Test');
      expect(user.password).not.toBe('TestPass123!'); // Should be hashed
    });

    test('should not create user with duplicate email', async () => {
      const userData = {
        firstName: 'Another',
        lastName: 'User',
        email: 'test@example.com',
        password: 'AnotherPass123!'
      };

      await expect(db.User.create(userData)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = {
        firstName: 'Invalid',
        lastName: 'Email',
        email: 'notanemail',
        password: 'ValidPass123!'
      };

      await expect(db.User.create(userData)).rejects.toThrow();
    });

    test('should enforce password minimum length', async () => {
      const userData = {
        firstName: 'Short',
        lastName: 'Pass',
        email: 'short@example.com',
        password: 'short'
      };

      await expect(db.User.create(userData)).rejects.toThrow();
    });
  });

  describe('Lead Model Tests', () => {
    test('should create a lead with valid data', async () => {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        street: '1 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        source: 'website',
        status: 'new'
      };

      const lead = await db.Lead.create(leadData);
      
      expect(lead.id).toBeDefined();
      expect(lead.status).toBe('new');
      expect(lead.city).toBe('Springfield');
    });

    test('should validate status enum values', async () => {
      const leadData = {
        firstName: 'Invalid',
        lastName: 'Status',
        email: 'invalid@example.com',
        phone: '555-0000',
        street: '2 Oak St',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        status: 'invalid_status',
        source: 'website'
      };

      await expect(db.Lead.create(leadData)).rejects.toThrow();
    });
  });

  describe('Customer Model Tests', () => {
    test('should create customer linked to lead', async () => {
      const lead = await db.Lead.create({
        firstName: 'Customer',
        lastName: 'Lead',
        email: 'customer@example.com',
        phone: '555-1000',
        street: '7 Elm St',
        city: 'Denver',
        state: 'CO',
        zipCode: '80014',
        source: 'website',
        status: 'qualified'
      });

      const customerData = {
        firstName: 'Customer',
        lastName: 'Name',
        email: 'customer@example.com',
        phone: '555-5678',
        street: '7 Elm St',
        city: 'Denver',
        state: 'CO',
        zipCode: '80014',
        country: 'USA',
        originalLeadId: lead.id
      };

      const customer = await db.Customer.create(customerData);
      
      expect(customer.id).toBeDefined();
      expect(customer.originalLeadId).toBe(lead.id);
    });
  });

  describe('Project Model Tests', () => {
    test('should create project with valid data', async () => {
      const customer = await db.Customer.create({
        firstName: 'Project',
        lastName: 'Customer',
        email: 'project@example.com',
        phone: '555-2000',
        street: '10 State St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02108',
        country: 'USA',
        originalLeadId: (await db.Lead.create({ firstName:'Tmp', lastName:'Lead', email:'tmp@e.com', phone:'555-0001', street:'1', city:'c', state:'s', zipCode:'z', source:'website' })).id
      });

      const projectData = {
        name: 'Solar Installation Project',
        customerId: customer.id,
        status: 'active',
        stage: 'planning',
        installStreet: '10 State St',
        installCity: 'Boston',
        installState: 'MA',
        installZipCode: '02108',
        installCountry: 'USA',
        systemSize: 10.5,
        panelCount: 20,
        panelType: 'Mono PERC',
        inverterType: 'String Inverter',
        totalContractValue: 25000
      };

      const project = await db.Project.create(projectData);
      
      expect(project.id).toBeDefined();
      expect(project.systemSize).toBe('10.50');
      expect(project.status).toBe('active');
    });

    test('should update to next valid stage', async () => {
      const customer = await db.Customer.findOne();
      const project = await db.Project.create({
        name: 'Stage Test Project',
        customerId: customer.id,
        status: 'active',
        stage: 'planning',
        installStreet: '10 State St',
        installCity: 'Boston',
        installState: 'MA',
        installZipCode: '02108',
        installCountry: 'USA',
        systemSize: 5.5,
        panelCount: 10,
        panelType: 'Poly',
        inverterType: 'Microinverter',
        totalContractValue: 12000
      });
      project.stage = 'permitting';
      await expect(project.save()).resolves.not.toThrow();
    });
  });

  describe('Associations Tests', () => {
    test('should correctly associate User with Lead', async () => {
      const user = await db.User.create({
        firstName: 'Sales',
        lastName: 'Rep',
        email: 'sales@example.com',
        password: 'SalesPass123!',
        role: 'sales'
      });

      const lead = await db.Lead.create({
        firstName: 'Associated',
        lastName: 'Lead',
        email: 'associated@example.com',
        phone: '555-2222',
        street: '1 A',
        city: 'B',
        state: 'C',
        zipCode: '00000',
        source: 'website',
        assignedToId: user.id,
        status: 'new'
      });

      const foundLead = await db.Lead.findByPk(lead.id, {
        include: [{ model: db.User, as: 'assignedTo' }]
      });

      expect(foundLead.assignedTo).toBeDefined();
      expect(foundLead.assignedTo.id).toBe(user.id);
    });

    test('should cascade delete related records', async () => {
      const lead = await db.Lead.create({
        firstName: 'Cascade',
        lastName: 'Test',
        email: 'cascade@example.com',
        phone: '555-3333',
        street: '1 A',
        city: 'B',
        state: 'C',
        zipCode: '00000',
        source: 'website',
        status: 'new'
      });

      await db.LeadNote.create({
        leadId: lead.id,
        text: 'Test note',
        createdById: (await db.User.create({ firstName:'Note', lastName:'Maker', email:'noter@example.com', password:'Pass12345!' })).id
      });

      // Delete lead should cascade delete notes
      await lead.destroy();

      const notes = await db.LeadNote.findAll({ where: { leadId: lead.id } });
      expect(notes.length).toBe(0);
    });
  });

  describe('Data Validation Tests', () => {
    test('should validate email uniqueness', async () => {
      const email = 'unique@example.com';
      
      await db.User.create({
        firstName: 'First',
        lastName: 'User',
        email: email,
        password: 'Password123!'
      });

      await expect(db.User.create({
        firstName: 'Second',
        lastName: 'User',
        email: email,
        password: 'Password456!'
      })).rejects.toThrow();
    });

    test('should validate roofAge numeric range', async () => {
      const lead = await db.Lead.create({
        firstName: 'Roof',
        lastName: 'Age',
        email: 'roof@example.com',
        phone: '555-4444',
        street: '1 A',
        city: 'B',
        state: 'C',
        zipCode: '00000',
        source: 'website',
        status: 'new',
        roofAge: 10
      });

      expect(lead.roofAge).toBe(10);

      lead.roofAge = -1; // Invalid: < 0
      await expect(lead.save()).rejects.toThrow();
    });

    test('should handle soft deletes', async () => {
      const lead = await db.Lead.create({
        firstName: 'Soft',
        lastName: 'Delete',
        email: 'soft@example.com',
        phone: '555-5555',
        street: '1 A',
        city: 'B',
        state: 'C',
        zipCode: '00000',
        source: 'website',
        status: 'new'
      });

      lead.active = false;
      await lead.save();

      // Should not find with default scope
      const found = await db.Lead.findByPk(lead.id);
      expect(found).toBeNull();

      // Should find when including inactive
      const foundWithInactive = await db.Lead.unscoped().findByPk(lead.id);
      expect(foundWithInactive).toBeDefined();
      expect(foundWithInactive.active).toBe(false);
    });
  });

  describe('Transaction Tests', () => {
    test('should rollback transaction on error', async () => {
      const t = await db.sequelize.transaction();

      try {
        const user = await db.User.create({
          firstName: 'Transaction',
          lastName: 'Test',
          email: 'transaction@example.com',
          password: 'TransPass123!'
        }, { transaction: t });

        // This should fail due to duplicate email
        await db.User.create({
          firstName: 'Duplicate',
          lastName: 'Email',
          email: 'transaction@example.com',
          password: 'DupPass123!'
        }, { transaction: t });

        await t.commit();
      } catch (error) {
        await t.rollback();
      }

      // User should not exist due to rollback
      const users = await db.User.findAll({
        where: { email: 'transaction@example.com' }
      });

      expect(users.length).toBe(0);
    });
  });
});
