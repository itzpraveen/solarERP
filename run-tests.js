const db = require('./src/models');
const bcrypt = require('bcryptjs');

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive PostgreSQL Tests\n');
  console.log('==========================================\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  let adminUser;

  try {
    // Test 1: Database Connection
    console.log('1️⃣  Testing Database Connection...');
    await db.sequelize.authenticate();
    console.log('   ✅ PostgreSQL connection successful\n');
    testsPassed++;

    // Test 2: Sync Database Schema
    console.log('2️⃣  Syncing Database Schema...');
    await db.sequelize.sync({ alter: true });
    console.log('   ✅ Database schema synchronized\n');
    testsPassed++;

    // Test 3: Create Admin User
    console.log('3️⃣  Testing User Creation...');
    const timestamp = Date.now();
    adminUser = await db.User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: `testadmin_${timestamp}@example.com`,
      password: 'AdminPass123!',
      role: 'admin',
      isVerified: true
    });
    console.log('   ✅ Admin user created successfully');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}\n`);
    testsPassed++;

    // Test 4: Password Hashing
    console.log('4️⃣  Testing Password Hashing...');
    const isPasswordHashed = adminUser.password !== 'AdminPass123!';
    if (isPasswordHashed) {
      console.log('   ✅ Password properly hashed\n');
      testsPassed++;
    } else {
      console.log('   ❌ Password not hashed!\n');
      testsFailed++;
    }

    // Test 5: Create Lead with all required fields
    console.log('5️⃣  Testing Lead Creation...');
    const lead = await db.Lead.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-1234',
      street: '123 Main St',
      city: 'Springfield',
      state: 'CA',
      zipCode: '90210',
      source: 'website',
      status: 'new',
      category: 'hot',
      propertyType: 'residential_single',
      estimatedBudget: 50000,
      createdById: adminUser.id
    });
    console.log('   ✅ Lead created successfully');
    console.log(`   ID: ${lead.id}`);
    console.log(`   Name: ${lead.firstName} ${lead.lastName}\n`);
    testsPassed++;

    // Test 6: Create Customer
    console.log('6️⃣  Testing Customer Creation...');
    const customer = await db.Customer.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-5678',
      street: '456 Oak Ave',
      city: 'Springfield',
      state: 'CA',
      zipCode: '90211',
      customerType: 'individual',
      originalLeadId: lead.id,
      createdById: adminUser.id
    });
    console.log('   ✅ Customer created successfully');
    console.log(`   ID: ${customer.id}\n`);
    testsPassed++;

    // Test 7: Create Proposal
    console.log('7️⃣  Testing Proposal Creation...');
    const proposal = await db.Proposal.create({
      proposalNumber: 'PROP-2025-001',
      leadId: lead.id,
      customerId: customer.id,
      status: 'draft',
      systemSize: 10.5,
      panelQuantity: 28,
      panelWattage: 375,
      inverterType: 'string',
      inverterCapacity: 10,
      batteryIncluded: false,
      estimatedProduction: 15000,
      systemCost: 35000,
      federalTaxCredit: 10500,
      stateTaxCredit: 2000,
      utilityRebate: 1000,
      netCost: 21500,
      estimatedSavingsYear1: 2400,
      estimatedSavings20Years: 65000,
      paybackPeriod: 8.5,
      createdBy: adminUser.id
    });
    console.log('   ✅ Proposal created successfully');
    console.log(`   Number: ${proposal.proposalNumber}\n`);
    testsPassed++;

    // Test 8: Create Project
    console.log('8️⃣  Testing Project Creation...');
    const project = await db.Project.create({
      projectName: 'Smith Solar Installation',
      customerId: customer.id,
      proposalId: proposal.id,
      projectType: 'residential',
      status: 'planning',
      stage: 'initial_consultation',
      systemSize: 10.5,
      installationAddress: '456 Oak Ave',
      installationCity: 'Springfield',
      installationState: 'CA',
      installationZipCode: '90211',
      estimatedCost: 35000,
      actualCost: 0,
      projectManager: adminUser.id
    });
    console.log('   ✅ Project created successfully');
    console.log(`   Name: ${project.projectName}\n`);
    testsPassed++;

    // Test 9: Create Equipment
    console.log('9️⃣  Testing Equipment Creation...');
    const equipment = await db.Equipment.create({
      name: 'Solar Panel 375W',
      category: 'panel',
      manufacturer: 'SunPower',
      model: 'SP375',
      specifications: {
        wattage: 375,
        efficiency: 22.5,
        dimensions: '65x39x1.5',
        weight: 40
      },
      costPrice: 200,
      sellingPrice: 350,
      markupPercentage: 75,
      quantityInStock: 100,
      quantityReserved: 0,
      reorderLevel: 20,
      reorderQuantity: 50,
      unitOfMeasure: 'unit'
    });
    console.log('   ✅ Equipment created successfully');
    console.log(`   Model: ${equipment.manufacturer} ${equipment.model}\n`);
    testsPassed++;

    // Test 10: Create Service Request
    console.log('🔟 Testing Service Request Creation...');
    const serviceRequest = await db.ServiceRequest.create({
      requestNumber: 'SR-2025-001',
      customerId: customer.id,
      projectId: project.id,
      requestType: 'maintenance',
      priority: 'medium',
      status: 'open',
      description: 'Annual maintenance check',
      reportedIssue: 'Routine maintenance',
      requestedDate: new Date(),
      createdBy: adminUser.id
    });
    console.log('   ✅ Service Request created successfully');
    console.log(`   Number: ${serviceRequest.requestNumber}\n`);
    testsPassed++;

    // Test 11: Test Associations
    console.log('1️⃣1️⃣ Testing Model Associations...');
    const projectWithCustomer = await db.Project.findByPk(project.id, {
      include: [{ model: db.Customer, as: 'customer' }]
    });
    if (projectWithCustomer.customer) {
      console.log('   ✅ Project-Customer association working\n');
      testsPassed++;
    } else {
      console.log('   ❌ Project-Customer association failed\n');
      testsFailed++;
    }

    // Test 12: Test Validation
    console.log('1️⃣2️⃣ Testing Data Validation...');
    try {
      await db.User.create({
        firstName: 'Invalid',
        lastName: 'User',
        email: 'not-an-email',
        password: 'short'
      });
      console.log('   ❌ Validation failed - invalid data accepted\n');
      testsFailed++;
    } catch (error) {
      console.log('   ✅ Validation working - invalid data rejected\n');
      testsPassed++;
    }

    // Test 13: Test Unique Constraints
    console.log('1️⃣3️⃣ Testing Unique Constraints...');
    try {
      await db.User.create({
        firstName: 'Duplicate',
        lastName: 'User',
        email: adminUser.email, // Duplicate email
        password: 'ValidPass123!'
      });
      console.log('   ❌ Unique constraint failed - duplicate accepted\n');
      testsFailed++;
    } catch (error) {
      console.log('   ✅ Unique constraint working - duplicate rejected\n');
      testsPassed++;
    }

    // Test 14: Test Soft Delete
    console.log('1️⃣4️⃣ Testing Soft Delete...');
    lead.active = false;
    await lead.save();
    const deletedLead = await db.Lead.findByPk(lead.id);
    if (!deletedLead) {
      console.log('   ✅ Soft delete working - inactive record hidden\n');
      testsPassed++;
    } else {
      console.log('   ⚠️  Soft delete may not be working with default scope\n');
      testsFailed++;
    }

    // Test 15: Test Transaction
    console.log('1️⃣5️⃣ Testing Database Transactions...');
    const t = await db.sequelize.transaction();
    try {
      const testUser = await db.User.create({
        firstName: 'Transaction',
        lastName: 'Test',
        email: 'transaction@example.com',
        password: 'TransPass123!'
      }, { transaction: t });

      // Force an error
      await db.User.create({
        firstName: 'Duplicate',
        lastName: 'Email',
        email: 'transaction@example.com', // Duplicate
        password: 'DupPass123!'
      }, { transaction: t });

      await t.commit();
      console.log('   ❌ Transaction should have failed\n');
      testsFailed++;
    } catch (error) {
      await t.rollback();
      const users = await db.User.findAll({
        where: { email: 'transaction@example.com' }
      });
      if (users.length === 0) {
        console.log('   ✅ Transaction rollback successful\n');
        testsPassed++;
      } else {
        console.log('   ❌ Transaction rollback failed\n');
        testsFailed++;
      }
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    testsFailed++;
  } finally {
    // Print Summary
    console.log('\n==========================================');
    console.log('📊 TEST SUMMARY');
    console.log('==========================================');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The application is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }

    // Close database connection
    await db.sequelize.close();
    console.log('\n✅ Database connection closed.');
    
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
runComprehensiveTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});