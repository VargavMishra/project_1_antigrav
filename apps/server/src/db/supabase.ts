import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

/**
 * Server-Side Supabase Client (Admin / Service Role).
 * 
 * WHY USE THE SERVICE ROLE KEY ON THE BACKEND?
 * The backend is a trusted, server-side environment. By using the service_role key,
 * our Express API has full administrative authority to query and manage rows.
 * However, we NEVER expose this key to the browser or mobile app.
 * Authorization is strictly enforced in our Express middleware (requireAuth),
 * ensuring users can only read and write their OWN profile data.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Client-Side Authenticated Supabase Client (Anon Key).
 * Used for verifying auth tokens via Supabase Auth API.
 */
export const supabaseAnon: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper function to verify database connectivity.
 * Used by the /api/health endpoint.
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      // If table doesn't exist yet or connection fails
      return { connected: false, latencyMs, error: error.message };
    }
    return { connected: true, latencyMs };
  } catch (err: any) {
    return { connected: false, latencyMs: Date.now() - start, error: err.message };
  }
}
