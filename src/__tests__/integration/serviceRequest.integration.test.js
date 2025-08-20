'use strict';

const request = require('supertest');
const db = require('../../models');
const { initTestApp, createAndLoginUser } = require('./helpers');

describe('Service Request Integration', () => {
  let app;
  let auth;
  let lead;
  let customer;
  let project;

  beforeAll(async () => {
    app = await initTestApp();
    auth = await createAndLoginUser(app);

    lead = await db.Lead.create({
      firstName: 'SR',
      lastName: 'Lead',
      email: 'srlead@example.com',
      phone: '555-1112',
      street: '1 A',
      city: 'B',
      state: 'C',
      zipCode: '00000',
      country: 'USA',
      source: 'website',
      status: 'qualified',
      createdById: auth.user.id
    });

    customer = await db.Customer.create({
      firstName: 'Service',
      lastName: 'Customer',
      email: 'sc@example.com',
      phone: '555-2223',
      street: '20 Broad',
      city: 'NY',
      state: 'NY',
      zipCode: '10005',
      country: 'USA',
      originalLeadId: lead.id,
      createdById: auth.user.id
    });

    project = await db.Project.create({
      name: 'SR Project',
      customerId: customer.id,
      status: 'active',
      stage: 'planning',
      installStreet: '20 Broad',
      installCity: 'NY',
      installState: 'NY',
      installZipCode: '10005',
      installCountry: 'USA',
      systemSize: 5.25,
      panelCount: 14,
      panelType: 'Mono',
      inverterType: 'Micro',
      totalContractValue: 15000
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('create, assign, update status and add note', async () => {
    const createRes = await request(app)
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        title: 'Inverter fault',
        description: 'Microinverter failure on string 1',
        requestType: 'repair',
        priority: 'high',
        customerId: customer.id,
        projectId: project.id,
        assignedToId: auth.user.id
      })
      .expect(201);

    const id = createRes.body.data.serviceRequest.id;

    await request(app)
      .put(`/api/service-requests/${id}/assign`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ assignedToId: auth.user.id })
      .expect(200);

    await request(app)
      .put(`/api/service-requests/${id}/status`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ status: 'in_progress' })
      .expect(200);

    await request(app)
      .post(`/api/service-requests/${id}/notes`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ text: 'Tech dispatched' })
      .expect(201);
  });
});

