'use strict';

const request = require('supertest');
const db = require('../../models');

const initTestApp = async () => {
  process.env.ENABLE_NONAUTH_ROUTES = 'true';
  const app = require('../../server');
  await db.sequelize.sync({ force: true });
  return app;
};

const createAndLoginUser = async (app, overrides = {}) => {
  const email = overrides.email || 'admin@example.com';
  const password = overrides.password || 'Admin12345!';
  const user = await db.User.create({
    firstName: 'Admin',
    lastName: 'User',
    email,
    password,
    role: 'admin',
    active: true,
    isVerified: true
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  return { token: res.body.token, user };
};

module.exports = { initTestApp, createAndLoginUser };

