import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { profileRepository } from '../src/modules/profile/profile.repository.js';

describe('Authentication Middleware (requireAuth)', () => {
  it('should return 401 UNAUTHORIZED if Authorization header is missing', async () => {
    const res = await request(app).get('/api/v1/profile/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toContain('Authorization header is missing');
  });

  it('should return 401 UNAUTHORIZED if header does not start with Bearer', async () => {
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', 'Basic 123456');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 UNAUTHORIZED if Bearer token is empty', async () => {
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 UNAUTHORIZED if token is invalid or expired', async () => {
    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', 'Bearer invalid-token-xyz');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should allow request through and return profile when valid test token is provided', async () => {
    // Mock the profile repository for the test user
    vi.spyOn(profileRepository, 'findById').mockResolvedValueOnce({
      id: '00000000-0000-0000-0000-000000000001',
      display_name: 'Test Runner',
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'Automated test profile bio',
      gender: 'other',
      hobbies: ['Testing', 'Coding'],
      strengths: ['Automation'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', 'Bearer test-valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('00000000-0000-0000-0000-000000000001');
    expect(res.body.data.display_name).toBe('Test Runner');
  });
});
