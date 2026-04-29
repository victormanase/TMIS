/**
 * RBAC TESTS
 * Verifies every protected route enforces authentication and
 * that lower-privileged roles cannot access admin-only endpoints.
 */

import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';

// ─── Token factories ──────────────────────────────────────────────────────────

const token = (role: string) =>
  generateAccessToken({ userId: `test-${role}`, email: `${role}@test.com`, role });

const adminToken     = token('ADMIN');
const managerToken   = token('MANAGER');
const accountantToken = token('ACCOUNTANT');
const viewerToken    = token('VIEWER');

// ─── Unauthenticated access ───────────────────────────────────────────────────

describe('Unauthenticated requests are rejected with 401', () => {
  const protectedRoutes = [
    ['GET',   '/api/users'],
    ['GET',   '/api/properties'],
    ['GET',   '/api/units'],
    ['GET',   '/api/tenants'],
    ['GET',   '/api/payments'],
    ['GET',   '/api/bookings'],
    ['GET',   '/api/reports/dashboard'],
    ['GET',   '/api/reports/rental'],
    ['GET',   '/api/reports/airbnb'],
    ['GET',   '/api/audit-logs'],
  ] as const;

  for (const [method, path] of protectedRoutes) {
    it(`${method} ${path} → 401 without token`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path);
      expect(res.status).toBe(401);
    });
  }
});

// ─── Invalid / expired token ──────────────────────────────────────────────────

describe('Invalid token is rejected with 401', () => {
  it('random string as Bearer token → 401', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('empty Bearer value → 401', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  it('no Bearer prefix → 401', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', adminToken);    // token without "Bearer " prefix
    expect(res.status).toBe(401);
  });
});

// ─── Admin-only routes ────────────────────────────────────────────────────────

describe('Admin-only routes reject non-admin roles', () => {
  const adminOnlyRoutes = [
    ['GET',   '/api/users'],
    ['POST',  '/api/users'],
    ['GET',   '/api/audit-logs'],
  ] as const;

  for (const [method, path] of adminOnlyRoutes) {
    it(`${method} ${path} → 403 for MANAGER`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });

    it(`${method} ${path} → 403 for ACCOUNTANT`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${accountantToken}`);
      expect(res.status).toBe(403);
    });

    it(`${method} ${path} → 403 for VIEWER`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it(`${method} ${path} → not 403 for ADMIN`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).not.toBe(403);
    });
  }
});

// ─── Manager/Admin routes ─────────────────────────────────────────────────────

describe('Manager-only mutations reject ACCOUNTANT and VIEWER', () => {
  const managerRoutes = [
    ['POST', '/api/properties'],
    ['POST', '/api/units'],
    ['POST', '/api/tenants'],
    ['POST', '/api/assignments'],
    ['POST', '/api/bookings'],
  ] as const;

  for (const [method, path] of managerRoutes) {
    it(`${method} ${path} → 403 for ACCOUNTANT`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it(`${method} ${path} → 403 for VIEWER`, async () => {
      const res = await (request(app) as any)[method.toLowerCase()](path)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({});
      expect(res.status).toBe(403);
    });
  }
});

// ─── Accountant access ────────────────────────────────────────────────────────

describe('ACCOUNTANT can access financial read routes', () => {
  it('GET /api/payments → not 403', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${accountantToken}`);
    expect(res.status).not.toBe(403);
  });

  it('GET /api/reports/rental → not 403', async () => {
    const res = await request(app)
      .get('/api/reports/rental')
      .set('Authorization', `Bearer ${accountantToken}`);
    expect(res.status).not.toBe(403);
  });

  it('GET /api/reports/airbnb → not 403', async () => {
    const res = await request(app)
      .get('/api/reports/airbnb')
      .set('Authorization', `Bearer ${accountantToken}`);
    expect(res.status).not.toBe(403);
  });
});

// ─── VIEWER access ────────────────────────────────────────────────────────────

describe('VIEWER can only access dashboard', () => {
  it('GET /api/reports/dashboard → not 403 for VIEWER', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).not.toBe(403);
  });

  it('GET /api/payments → 403 for VIEWER', async () => {
    const res = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/reports/rental → 403 for VIEWER', async () => {
    const res = await request(app)
      .get('/api/reports/rental')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});
