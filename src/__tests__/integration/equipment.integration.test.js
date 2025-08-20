'use strict';

const request = require('supertest');
const db = require('../../models');
const { initTestApp, createAndLoginUser } = require('./helpers');

describe('Equipment Integration', () => {
  let app;
  let auth;

  beforeAll(async () => {
    app = await initTestApp();
    auth = await createAndLoginUser(app);
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('create equipment, update stock, add supplier and compatibility', async () => {
    const createRes = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        type: 'panel',
        name: 'Panel X',
        manufacturer: 'SolarCo',
        model: 'PX-400',
        purchaseCost: 120
      })
      .expect(201);

    const eqId = createRes.body.data.equipment.id;

    await request(app)
      .patch(`/api/equipment/${eqId}/inventory`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ operation: 'add', quantity: 10 })
      .expect(200);

    await request(app)
      .post(`/api/equipment/${eqId}/suppliers`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ name: 'SupplyCo', preferredSupplier: true })
      .expect(201);

    // create another equipment to be compatible with first
    const eq2 = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ type: 'inverter', name: 'Inverter Y', manufacturer: 'WattCorp', model: 'INV-5K', purchaseCost: 300 })
      .expect(201);

    await request(app)
      .post(`/api/equipment/${eqId}/compatible-products`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ compatibleProductId: eq2.body.data.equipment.id })
      .expect(201);
  });
});

