import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the YoloTravel shareable-plans backend.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * RUN THIS SQL IN THE SUPABASE SQL EDITOR (Project → SQL Editor → New query):
 * ────────────────────────────────────────────────────────────────────────────
 *
 *   -- Shareable AI-generated travel plans
 *   create table if not exists public.plans (
 *     id          text        primary key,           -- short share code, e.g. "YOLO-1A2B"
 *     itinerary   jsonb       not null,              -- full TripPlan JSON (+ source card)
 *     created_at  timestamptz not null default now()
 *   );
 *
 *   create index if not exists plans_created_at_idx
 *     on public.plans (created_at desc);
 *
 *   -- Allow anonymous read + insert for the share-link flow.
 *   -- (Lock this down later if you add accounts.)
 *   alter table public.plans enable row level security;
 *
 *   create policy "plans_anon_read"
 *     on public.plans for select
 *     to anon using (true);
 *
 *   create policy "plans_anon_insert"
 *     on public.plans for insert
 *     to anon with check (true);
 *
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

export const PLANS_TABLE = 'plans';
