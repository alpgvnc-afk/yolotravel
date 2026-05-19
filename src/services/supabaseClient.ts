import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the YoloTravel shareable-plans backend.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * RUN THIS SQL IN THE SUPABASE SQL EDITOR (Project → SQL Editor → New query):
 * ────────────────────────────────────────────────────────────────────────────
 *
 *   -- Shareable AI-generated travel plans
 *   create table if not exists public.trip_plans (
 *     id          uuid        primary key default gen_random_uuid(),
 *     share_code  text        not null unique,         -- 6-char alnum, e.g. "X7K4M2"
 *     city        text        not null,
 *     country     text        not null,
 *     days        int         not null,
 *     vibe        text        not null,
 *     plan_data   jsonb       not null,                -- full TripPlan payload
 *     created_by  text,                                -- optional display name
 *     created_at  timestamptz not null default now()
 *   );
 *
 *   create index if not exists trip_plans_share_code_idx
 *     on public.trip_plans (share_code);
 *   create index if not exists trip_plans_created_at_idx
 *     on public.trip_plans (created_at desc);
 *
 *   alter table public.trip_plans enable row level security;
 *
 *   create policy "trip_plans_anon_read"
 *     on public.trip_plans for select to anon using (true);
 *
 *   create policy "trip_plans_anon_insert"
 *     on public.trip_plans for insert to anon with check (true);
 *
 *   -- If you previously created the legacy `plans` table from an earlier version,
 *   -- drop it after backfilling: drop table if exists public.plans;
 * ────────────────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client: SupabaseClient | null = null;

/**
 * Lazy singleton — only instantiated if env vars are present.
 * Callers should check `isSupabaseConfigured()` first or handle a null return
 * gracefully so the rest of the app keeps working offline.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — share features disabled.'
      );
    }
    return null;
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
  }
  return _client;
};

export const TRIP_PLANS_TABLE = 'trip_plans';

// Re-export the convenient alias too — there's a singleton; calling sites can use either.
export { getSupabase as supabase };
