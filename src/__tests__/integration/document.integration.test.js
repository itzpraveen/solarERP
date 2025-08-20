'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const db = require('../../models');
const { initTestApp, createAndLoginUser } = require('./helpers');

describe('Document Integration', () => {
  let app;
  let auth;
  let user;

  beforeAll(async () => {
    app = await initTestApp();
    const authRes = await createAndLoginUser(app);
    auth = authRes;
    user = authRes.user;
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  test('upload, get, update (new version), share, sign, download', async () => {
    const tmpFile = path.join(__dirname, 'tmp.txt');
    fs.writeFileSync(tmpFile, 'Hello World');

    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${auth.token}`)
      .field('name', 'Test Doc')
      .field('type', 'other')
      .field('category', 'other')
      .field('relatedEntityType', 'user')
      .field('relatedEntityId', user.id)
      .attach('file', tmpFile)
      .expect(201);

    const docId = createRes.body.data.document.id;
    expect(docId).toBeDefined();

    await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .expect(200);

    // Update with new version
    fs.writeFileSync(tmpFile, 'Hello World v2');
    await request(app)
      .patch(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .attach('file', tmpFile)
      .expect(200);

    // Share and sign
    await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ expiresInMinutes: 60 })
      .expect(200);

    await request(app)
      .post(`/api/documents/${docId}/sign`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ signatureData: 'signed-by-admin' })
      .expect(201);

    await request(app)
      .get(`/api/documents/${docId}/download`)
      .set('Authorization', `Bearer ${auth.token}`)
      .expect(200);

    fs.unlinkSync(tmpFile);
  });
});

