import { ProfileRepository, profileRepository } from './profile.repository.js';
import { ProfileRecord, UpdateProfileInput } from './profile.schema.js';
import { AppError } from '../../middleware/error.middleware.js';

/**
 * Profile Service (Business Logic Layer)
 * 
 * DESIGN PRINCIPLE:
 * Controllers handle HTTP semantics (request parsing, status codes).
 * Repositories handle Database queries.
 * Services own the BUSINESS RULES.
 */
export class ProfileService {
  constructor(private repo: ProfileRepository = profileRepository) {}

  /**
   * Retrieve the profile for the authenticated user.
   * If the user record was just created and the database trigger did not complete,
   * this provides lazy bootstrapping so the UI never breaks.
   */
  async getProfile(userId: string, email?: string, metadata?: Record<string, any>): Promise<ProfileRecord> {
    let profile = await this.repo.findById(userId);

    if (!profile) {
      // Lazy initialization fallback
      const initialName = metadata?.full_name || metadata?.name || email?.split('@')[0] || 'User';
      profile = await this.repo.create({
        id: userId,
        display_name: initialName,
        avatar_url: metadata?.avatar_url || metadata?.picture || '',
        bio: 'Hello! I am using the full-stack synced platform.',
        gender: 'unspecified',
        hobbies: ['Coding', 'Reading'],
        strengths: ['Curiosity', 'Communication'],
      });
    }

    return profile;
  }

  /**
   * Update the authenticated user's profile with validated changes.
   */
  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<ProfileRecord> {
    // Check if profile exists first
    const existing = await this.repo.findById(userId);
    if (!existing) {
      throw new AppError('Profile not found for this authenticated user.', 404, 'PROFILE_NOT_FOUND');
    }

    // Apply the update
    const updated = await this.repo.update(userId, updates);
    console.log(`✅ [ProfileService] User ${userId} updated profile fields: ${Object.keys(updates).join(', ')}`);
    return updated;
  }

  /**
   * Update the user's avatar image URL.
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<ProfileRecord> {
    return this.updateProfile(userId, { avatar_url: avatarUrl });
  }

  /**
   * Retrieve recent audit logs for the user.
   */
  async getAuditLogs(userId: string): Promise<any[]> {
    return this.repo.getAuditLogs(userId);
  }
}

export const profileService = new ProfileService();
