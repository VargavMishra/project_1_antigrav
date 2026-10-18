import { supabaseAdmin } from '../../db/supabase.js';
import { ProfileRecord, UpdateProfileInput } from './profile.schema.js';
import { AppError } from '../../middleware/error.middleware.js';

/**
 * Profile Repository (Data Access Layer)
 * 
 * DESIGN PRINCIPLE: Separation of Concerns
 * The repository is the ONLY place in the backend that speaks directly to the database.
 * If we ever switch from Supabase to raw PostgreSQL with pg-promise, Prisma, or Drizzle,
 * only this file needs to change. The controller and service logic remain completely untouched.
 */
export class ProfileRepository {
  /**
   * Find a profile by its primary key (User ID)
   */
  async findById(userId: string): Promise<ProfileRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[ProfileRepository.findById] DB Error for user ${userId}:`, error);
      throw new AppError(`Database error querying profile: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return data as ProfileRecord | null;
  }

  /**
   * Insert a new profile record (used during registration or lazy initialization)
   */
  async create(profile: Partial<ProfileRecord> & { id: string }): Promise<ProfileRecord> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([profile])
      .select()
      .single();

    if (error) {
      console.error(`[ProfileRepository.create] DB Error for user ${profile.id}:`, error);
      throw new AppError(`Database error creating profile: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return data as ProfileRecord;
  }

  /**
   * Update an existing profile record
   * Note: The updated_at column is handled automatically by our PostgreSQL trigger!
   */
  async update(userId: string, updates: UpdateProfileInput): Promise<ProfileRecord> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[ProfileRepository.update] DB Error updating user ${userId}:`, error);
      throw new AppError(`Database error updating profile: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return data as ProfileRecord;
  }

  /**
   * Fetch recent audit logs for a specific user
   */
  async getAuditLogs(userId: string, limit = 10): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('profile_audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[ProfileRepository.getAuditLogs] DB Error for user ${userId}:`, error);
      return []; // Non-fatal for the profile UI
    }

    return data || [];
  }
}

export const profileRepository = new ProfileRepository();
