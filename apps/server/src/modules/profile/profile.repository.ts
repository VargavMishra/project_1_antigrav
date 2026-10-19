import { supabaseAdmin } from '../../db/supabase.js';
import { ProfileRecord, UpdateProfileInput } from './profile.schema.js';
import { AppError } from '../../middleware/error.middleware.js';

/**
 * Profile Repository (Data Access Layer)
 * 
 * Handles all database communication with PostgreSQL via Supabase.
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
   * Insert a new profile record
   */
  async create(profile: Partial<ProfileRecord> & { id: string }): Promise<ProfileRecord> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert([profile])
      .select()
      .single();

    if (error) {
      console.error(`[ProfileRepository.create] DB Error for user ${profile.id}:`, error);
      throw new AppError(`Database error creating profile: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return data as ProfileRecord;
  }

  /**
   * Update or upsert a profile record.
   * PostgreSQL trigger handles updated_at automatically!
   */
  async update(userId: string, updates: UpdateProfileInput): Promise<ProfileRecord> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, ...updates })
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
      return [];
    }

    return data || [];
  }
}

export const profileRepository = new ProfileRepository();
