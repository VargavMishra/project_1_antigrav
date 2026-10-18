import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { profileRepository } from '../src/modules/profile/profile.repository.js';

describe('Profile Endpoints (/api/v1/profile)', () => {
  const mockProfile = {
    id: '00000000-0000-0000-0000-000000000001',
    display_name: 'Original Name',
    avatar_url: 'https://example.com/pic.jpg',
    bio: 'Initial bio',
    gender: 'unspecified',
    hobbies: ['Coding'],
    strengths: ['Persistence'],
    created_at: '2026-10-18T10:00:00.000Z',
    updated_at: '2026-10-18T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/profile/me', () => {
    it('returns the authenticated user profile', async () => {
      vi.spyOn(profileRepository, 'findById').mockResolvedValueOnce(mockProfile);

      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', 'Bearer test-valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.display_name).toBe('Original Name');
      expect(res.body.data.hobbies).toEqual(['Coding']);
    });
  });

  describe('PATCH /api/v1/profile/me', () => {
    it('successfully updates valid fields and returns 200', async () => {
      vi.spyOn(profileRepository, 'findById').mockResolvedValueOnce(mockProfile);
      vi.spyOn(profileRepository, 'update').mockResolvedValueOnce({
        ...mockProfile,
        display_name: 'Updated Name',
        bio: 'Updated bio text',
        gender: 'female',
        hobbies: ['Coding', 'Cycling'],
        strengths: ['Architecture'],
        updated_at: '2026-10-18T12:00:00.000Z',
      });

      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', 'Bearer test-valid-token')
        .send({
          display_name: 'Updated Name',
          bio: 'Updated bio text',
          gender: 'female',
          hobbies: ['Coding', 'Cycling'],
          strengths: ['Architecture'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.display_name).toBe('Updated Name');
      expect(res.body.data.gender).toBe('female');
      expect(res.body.data.hobbies).toContain('Cycling');
    });

    it('returns 400 Bad Request when an empty body is sent', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', 'Bearer test-valid-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('returns 400 Validation Error when an invalid gender enum value is sent', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', 'Bearer test-valid-token')
        .send({
          gender: 'invalid-gender-option',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('gender');
    });

    it('returns 400 Validation Error when string exceeds max length', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', 'Bearer test-valid-token')
        .send({
          bio: 'x'.repeat(501), // Max is 500
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('bio');
    });
  });

  describe('POST /api/v1/profile/me/avatar', () => {
    it('successfully updates avatar URL and returns 200', async () => {
      vi.spyOn(profileRepository, 'findById').mockResolvedValueOnce(mockProfile);
      vi.spyOn(profileRepository, 'update').mockResolvedValueOnce({
        ...mockProfile,
        avatar_url: 'https://new-storage.com/new-avatar.png',
      });

      const res = await request(app)
        .post('/api/v1/profile/me/avatar')
        .set('Authorization', 'Bearer test-valid-token')
        .send({
          avatar_url: 'https://new-storage.com/new-avatar.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar_url).toBe('https://new-storage.com/new-avatar.png');
    });
  });

  describe('GET /api/v1/profile/me/audit-logs', () => {
    it('returns audit log list for authenticated user', async () => {
      vi.spyOn(profileRepository, 'getAuditLogs').mockResolvedValueOnce([
        {
          id: 'log-1',
          user_id: '00000000-0000-0000-0000-000000000001',
          action: 'UPDATE',
          old_data: { bio: 'old' },
          new_data: { bio: 'new' },
          performed_at: '2026-10-18T10:30:00.000Z',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/profile/me/audit-logs')
        .set('Authorization', 'Bearer test-valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe('UPDATE');
    });
  });
});
