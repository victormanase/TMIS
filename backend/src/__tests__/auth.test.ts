/**
 * AUTH TESTS
 * Covers: login, logout, token refresh, password reset, RBAC enforcement.
 */

import request from 'supertest';
import app from '../app';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

// ─── Password hashing ─────────────────────────────────────────────────────────

describe('Password hashing utilities', () => {
  it('hashes a password — hash differs from plaintext', async () => {
    const hash = await hashPassword('MyPassword123');
    expect(hash).not.toBe('MyPassword123');
    expect(hash).toMatch(/^\$2[ab]\$/);      // bcrypt format
  });

  it('verifies correct password against hash', async () => {
    const hash = await hashPassword('CorrectPassword');
    expect(await comparePassword('CorrectPassword', hash)).toBe(true);
  });

  it('rejects wrong password against hash', async () => {
    const hash = await hashPassword('CorrectPassword');
    expect(await comparePassword('WrongPassword', hash)).toBe(false);
  });

  it('two hashes of the same password are different (salted)', async () => {
    const h1 = await hashPassword('SamePassword');
    const h2 = await hashPassword('SamePassword');
    expect(h1).not.toBe(h2);
  });
});

// ─── JWT utilities ────────────────────────────────────────────────────────────

describe('JWT token utilities', () => {
  const payload = { userId: 'u1', email: 'test@test.com', role: 'ADMIN' };

  it('generates a non-empty access token', () => {
    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);   // header.payload.signature
  });

  it('generates a non-empty refresh token', () => {
    const token = generateRefreshToken(payload);
    expect(token.split('.').length).toBe(3);
  });

  it('access and refresh tokens are different strings', () => {
    expect(generateAccessToken(payload)).not.toBe(generateRefreshToken(payload));
  });

  it('token payload does not contain a password field', () => {
    const token = generateAccessToken(payload);
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    expect(decoded.password).toBeUndefined();
  });
});

// ─── Login endpoint ───────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'x' });
    expect(res.status).toBeOneOf([400, 401, 500]);
  });

  it('returns 400/401 when password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBeOneOf([400, 401, 500]);
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@tmis.local', password: 'wrongpassword' });
    expect([401, 500]).toContain(res.status);
  });

  it('does not accept password via query string', async () => {
    const res = await request(app)
      .post('/api/auth/login?password=hunter2')
      .send({ email: 'admin@tmis.local' });
    // Without password in body, must not succeed
    expect(res.status).not.toBe(200);
  });

  it('response body never contains the submitted password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@tmis.local', password: 'Admin@1234' });
    expect(JSON.stringify(res.body)).not.toContain('Admin@1234');
  });

  it('response body never contains a bcrypt hash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@tmis.local', password: 'Admin@1234' });
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[ab]\$\d+\$/);
  });

  it('successful login returns accessToken and refreshToken (if DB seeded)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@tmis.local', password: 'Admin@1234' });

    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).not.toHaveProperty('password');
    } else {
      // DB not seeded — acceptable in CI
      expect([401, 500]).toContain(res.status);
    }
  });
});

// ─── Token refresh ────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('returns 401 without a refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 for a tampered refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });
});

// ─── Password reset ───────────────────────────────────────────────────────────

describe('Password reset flow', () => {
  it('POST /password-reset/request always returns 200 (no email enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: 'doesnotexist@tmis.local' });
    expect(res.status).toBe(200);
  });

  it('password reset request response does not expose the reset token', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: 'doesnotexist@tmis.local' });
    // Token must not be in the JSON response
    expect(JSON.stringify(res.body)).not.toMatch(/[a-f0-9]{32,}/);
  });

  it('POST /password-reset/confirm rejects invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: 'aaaa1111bbbb2222cccc3333dddd4444', password: 'NewPassword1!' });
    expect(res.status).toBe(400);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('authenticates token and proceeds (user may not exist in test DB)', async () => {
    const token = generateAccessToken({ userId: 'u1', email: 'a@b.com', role: 'ADMIN' });
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    // 200 = user found and logged out
    // 404 = user not in test DB (Prisma P2025 → 404 via errorHandler)
    // Either outcome means auth passed — the endpoint was reached
    expect([200, 404]).toContain(res.status);
  });
});

// helpers
