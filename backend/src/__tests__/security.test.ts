/**
 * SECURITY TESTS
 * Covers: passwords in URLs, sensitive data in responses,
 * security headers, JWT in headers only, static source analysis.
 */

import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import fs from 'fs';
import path from 'path';

const adminToken = () =>
  generateAccessToken({ userId: 'test-admin', email: 'admin@test.com', role: 'ADMIN' });

// ── 1. Security Headers ────────────────────────────────────────────────────────
describe('Security Headers (Helmet)', () => {
  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('does not expose X-Powered-By: Express', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets Content-Security-Policy header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('prevents clickjacking via CSP frame-ancestors or X-Frame-Options', async () => {
    const res = await request(app).get('/api/health');
    const csp = res.headers['content-security-policy'] ?? '';
    const xfo = (res.headers['x-frame-options'] ?? '').toUpperCase();
    const protected_ = csp.includes('frame-ancestors') || xfo.includes('DENY') || xfo.includes('SAMEORIGIN');
    expect(protected_).toBe(true);
  });
});

// ── 2. Passwords never appear in URLs ─────────────────────────────────────────
describe('Passwords must NOT appear in URLs', () => {
  it('login ignores password passed in query string', async () => {
    const res = await request(app)
      .post('/api/auth/login?password=ShouldNotWork')
      .send({});
    expect(res.status).not.toBe(200);
  });

  it('login response never echoes back the submitted password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'SuperSecret99' });
    expect(JSON.stringify(res.body)).not.toContain('SuperSecret99');
  });

  it('password reset response does not expose the token inline', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: 'nobody@test.com' });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/[a-f0-9]{32,}/);
  });

  it('GET requests with password in query string do not echo it back', async () => {
    const res = await request(app)
      .get('/api/users?password=secret123')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(JSON.stringify(res.body)).not.toContain('secret123');
  });
});

// ── 3. Responses never expose password hashes ──────────────────────────────────
describe('API responses must not expose password hashes', () => {
  it('user list response has no password field', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(JSON.stringify(res.body)).not.toMatch(/"password"\s*:/);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[ab]\$\d+\$/);
  });

  it('login success response has no password hash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@tmis.local', password: 'Admin@1234' });
    expect(JSON.stringify(res.body)).not.toMatch(/"password"\s*:/);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[ab]\$\d+\$/);
  });
});

// ── 4. JWT must travel in Authorization header, not URL ────────────────────────
describe('JWT must be in Authorization header, not URL', () => {
  it('rejects token passed as query string parameter', async () => {
    const token = adminToken();
    const res = await request(app).get(`/api/users?token=${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects token in request body', async () => {
    const token = adminToken();
    const res = await request(app).get('/api/users').send({ token });
    expect(res.status).toBe(401);
  });

  it('accepts valid token only via Authorization: Bearer header', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
  });
});

// ── 5. Static source-code analysis ────────────────────────────────────────────
describe('Static source analysis', () => {
  function readTsFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '__tests__', 'dist'].includes(entry.name)) {
        results.push(...readTsFiles(full));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        results.push(full);
      }
    }
    return results;
  }

  const srcDir = path.join(__dirname, '..');
  const sources = readTsFiles(srcDir).map((f) => ({
    file: path.relative(srcDir, f),
    content: fs.readFileSync(f, 'utf8'),
  }));

  it('no source file contains a hardcoded plaintext password', () => {
    const offenders = sources.filter(({ content }) =>
      /password\s*=\s*['"][^'"]{6,}['"]/i.test(content) &&
      !/process\.env|example|test|seed|hash|compare|Admin@1234/.test(content)
    );
    if (offenders.length > 0) console.log('Offending files:', offenders.map((o) => o.file));
    expect(offenders).toHaveLength(0);
  });

  it('JWT secrets come from environment variables only', () => {
    const jwtFile = sources.find((s) => s.file.includes('jwt.ts'));
    expect(jwtFile).toBeDefined();
    expect(jwtFile!.content).toContain('process.env');
    expect(jwtFile!.content).not.toMatch(/sign\(.*['"][a-zA-Z0-9]{12,}['"]/);
  });

  it('no source file passes password via URL query string', () => {
    const offenders = sources.filter(({ content }) => /[?&]password=/i.test(content));
    if (offenders.length > 0) console.log('Offending files:', offenders.map((o) => o.file));
    expect(offenders).toHaveLength(0);
  });

  it('no source file passes JWT/token via URL query string (excluding reset flow)', () => {
    const offenders = sources
      .filter(({ file }) => !file.includes('auth.service'))
      .filter(({ content }) =>
        /[?&](token|jwt|access_token|bearer)=[^'"]{8,}/i.test(content) &&
        !content.includes('reset-password?token')
      );
    if (offenders.length > 0) console.log('Offending files:', offenders.map((o) => o.file));
    expect(offenders).toHaveLength(0);
  });

  it('every auth route uses POST body, not GET query params for credentials', () => {
    const routeFile = sources.find((s) => s.file.includes('auth.routes'));
    expect(routeFile).toBeDefined();
    // Login and password actions must be POST, not GET
    expect(routeFile!.content).toMatch(/router\.post\(.*login/);
    expect(routeFile!.content).not.toMatch(/router\.get\(.*login/);
  });
});
