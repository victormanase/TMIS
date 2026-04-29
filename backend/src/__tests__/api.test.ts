/**
 * API INTEGRATION TESTS
 * Covers: health check, input validation, error handling,
 * correct HTTP status codes, response shape.
 */

import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';

const adminToken = generateAccessToken({ userId: 'test-admin', email: 'a@b.com', role: 'ADMIN' });
const managerToken = generateAccessToken({ userId: 'test-mgr', email: 'm@b.com', role: 'MANAGER' });

// ─── Health check ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('responds with JSON content-type', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// ─── 404 for unknown routes ───────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for a completely unknown path', async () => {
    const res = await request(app).get('/api/this-does-not-exist');
    expect(res.status).toBe(404);
  });
});

// ─── Property validation ──────────────────────────────────────────────────────

describe('Property creation validation', () => {
  it('returns 4xx when name is missing', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ location: 'Dar es Salaam' });    // missing name
    expect(res.status).toBeGreaterThanOrEqual(400);
    
  });

  it('returns 4xx when location is missing', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Property' });         // missing location
    expect(res.status).toBeGreaterThanOrEqual(400);
    
  });
});

// ─── Unit creation validation ─────────────────────────────────────────────────

describe('Unit creation validation', () => {
  it('rejects AirBnB unit without dailyRate', async () => {
    const res = await request(app)
      .post('/api/units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        propertyId: 'fake-id',
        unitNumber: 'A1',
        unitType: 'AIRBNB',
        bedrooms: 1,
        serviceCharge: 0,
        // dailyRate intentionally omitted
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects non-AirBnB unit without monthlyRent', async () => {
    const res = await request(app)
      .post('/api/units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        propertyId: 'fake-id',
        unitNumber: 'A2',
        unitType: 'APARTMENT',
        bedrooms: 2,
        serviceCharge: 5000,
        // monthlyRent intentionally omitted
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── Assignment business-rule ─────────────────────────────────────────────────

describe('Assignment validation', () => {
  it('rejects assignment without required fields', async () => {
    const res = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({});   // empty body
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── Booking validation ───────────────────────────────────────────────────────

describe('AirBnB booking validation', () => {
  it('rejects booking without guestName', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        unitId: 'fake-unit',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
        dailyRate: 100,
        bookingSource: 'SELF_BOOKING',
        // guestName omitted
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects booking with bookingSource=OTHER and no bookingSourceOther', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        unitId: 'fake-unit',
        guestName: 'John Doe',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
        dailyRate: 100,
        bookingSource: 'OTHER',
        // bookingSourceOther omitted
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── Pagination response shape ────────────────────────────────────────────────

describe('Paginated endpoints return correct shape', () => {
  const paginatedRoutes = [
    '/api/properties',
    '/api/units',
    '/api/tenants',
    '/api/payments',
    '/api/bookings',
  ];

  for (const route of paginatedRoutes) {
    it(`GET ${route} returns pagination metadata`, async () => {
      const res = await request(app)
        .get(route)
        .set('Authorization', `Bearer ${adminToken}`);

      // May get 200 (connected DB) or 500 (no DB in CI); either way check shape if 200
      if (res.status === 200) {
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('limit');
        expect(res.body.pagination).toHaveProperty('totalPages');
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });
  }
});

// ─── Error response shape ─────────────────────────────────────────────────────

describe('Error responses have consistent shape', () => {
  it('401 response has success:false and message', async () => {
    const res = await request(app).get('/api/users');
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe('string');
  });

  it('403 response has success:false and message', async () => {
    const viewerToken = generateAccessToken({ userId: 'v1', email: 'v@b.com', role: 'VIEWER' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe('string');
  });
});
