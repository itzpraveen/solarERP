'use strict';

const request = require('supertest');
const db = require('../../models');
const { initTestApp, createAndLoginUser } = require('./helpers');

describe('Project Integration', () => {
  let app;
  let auth;
  let lead;
  let customer;

  beforeAll(async () => {
    app = await initTestApp();
    auth = await createAndLoginUser(app);

    lead = await db.Lead.create({
      firstName: 'Proj',
      lastName: 'Lead',
      email: 'projlead@example.com',
      phone: '555-1111',
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
      firstName: 'Project',
      lastName: 'Customer',
      email: 'pc@example.com',
      phone: '555-2222',
      street: '10 State',
      city: 'Boston',
      state: 'MA',
      zipCode: '02108',
      country: 'USA',
      originalLeadId: lead.id,
      createdById: auth.user.id
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('create project and add note', async () => {
    const projectPayload = {
      name: 'Residential PV',
      customerId: customer.id,
      status: 'active',
      stage: 'planning',
      installStreet: '10 State',
      installCity: 'Boston',
      installState: 'MA',
      installZipCode: '02108',
      installCountry: 'USA',
      systemSize: 7.5,
      panelCount: 18,
      panelType: 'Mono PERC',
      inverterType: 'String',
      totalContractValue: 18500
    };

    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${auth.token}`)
      .send(projectPayload)
      .expect(201);

    const projectId = createRes.body.data.project.id;
    expect(projectId).toBeDefined();

    const noteRes = await request(app)
      .post(`/api/projects/${projectId}/notes`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ text: 'Kickoff scheduled' })
      .expect(201);

    expect(noteRes.body.data.note.id).toBeDefined();
  });

  test('update status and stage', async () => {
    const project = await db.Project.findOne();
    await request(app)
      .patch(`/api/projects/${project.id}/status`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ status: 'on_hold', notes: 'Awaiting permit' })
      .expect(200);

    await request(app)
      .patch(`/api/projects/${project.id}/stage`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ stage: 'permitting', notes: 'Plan review' })
      .expect(200);
  });
});

