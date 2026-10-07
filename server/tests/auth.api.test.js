import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser, setup } from './helpers.js';

let ctx;
beforeEach(() => {
  ctx = setup();
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await ctx.api
      .post('/api/auth/register')
      .send({ email: 'Ana@Test.si', name: 'Ana', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({ email: 'ana@test.si', name: 'Ana' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects a duplicate email', async () => {
    const body = { email: 'ana@test.si', name: 'Ana', password: 'password123' };
    await ctx.api.post('/api/auth/register').send(body);
    const res = await ctx.api.post('/api/auth/register').send(body);
    expect(res.status).toBe(409);
  });

  it('validates the input', async () => {
    const res = await ctx.api
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: '', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['email', 'name', 'password']);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await ctx.api
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerUser(ctx.app, { email: 'login@test.si', password: 'password123' });
  });

  it('logs in with correct credentials', async () => {
    const res = await ctx.api
      .post('/api/auth/login')
      .send({ email: 'login@test.si', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
  });

  it('rejects a wrong password', async () => {
    const res = await ctx.api
      .post('/api/auth/login')
      .send({ email: 'login@test.si', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await ctx.api
      .post('/api/auth/login')
      .send({ email: 'nobody@test.si', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

describe('protected routes', () => {
  it('GET /api/auth/me returns the current user', async () => {
    const user = await registerUser(ctx.app, { name: 'Me' });
    const res = await user.as.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Me');
  });

  it('rejects requests without a token', async () => {
    const res = await ctx.api.get('/api/courses');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await ctx.api.get('/api/courses').set('Authorization', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await ctx.api.get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
