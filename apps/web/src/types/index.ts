export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  gender: 'male' | 'female' | 'non-binary' | 'other' | 'unspecified';
  hobbies: string[];
  strengths: string[];
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'other' | 'unspecified';
  hobbies?: string[];
  strengths?: string[];
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  performed_at: string;
}

export type SyncState = 'idle' | 'syncing' | 'saved' | 'error';
