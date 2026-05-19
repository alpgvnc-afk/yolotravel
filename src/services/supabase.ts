/**
 * Convenience re-export of the Supabase client.
 * Real implementation lives in ./supabaseClient.ts (kept separate so the SQL
 * schema doc-comment doesn't pollute every import site).
 */
export {
  getSupabase as supabase,
  getSupabase,
  isSupabaseConfigured,
  TRIP_PLANS_TABLE
} from './supabaseClient';
