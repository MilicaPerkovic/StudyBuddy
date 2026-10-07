import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

/** Fresh app with an in-memory DB for every test file/test. */
export function setup() {
  const db = createDb(':memory:');
  const app = createApp(db);
  return { db, app, api: request(app) };
}

let counter = 0;

/** Registers a new user and returns an authenticated supertest helper. */
export async function registerUser(app, overrides = {}) {
  counter += 1;
  const body = {
    email: `user${counter}@test.si`,
    name: `User ${counter}`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  const auth = { Authorization: `Bearer ${res.body.token}` };
  const as = {
    get: (url) => request(app).get(url).set(auth),
    post: (url, data) => request(app).post(url).set(auth).send(data),
    put: (url, data) => request(app).put(url).set(auth).send(data),
    patch: (url, data) => request(app).patch(url).set(auth).send(data),
    delete: (url) => request(app).delete(url).set(auth),
  };
  return { ...res.body, as };
}
