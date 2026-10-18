import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health and System Routes', () => {
  it('GET / should return service metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'active');
    expect(res.body).toHaveProperty('documentation', '/api-docs');
    expect(res.body).toHaveProperty('health', '/api/health');
  });

  it('GET /api/health should return 200 or 503 with operational status', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body.services).toHaveProperty('api', 'operational');
  });

  it('GET /api/nonexistent should return 404 with standardized error JSON', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
  });
});
