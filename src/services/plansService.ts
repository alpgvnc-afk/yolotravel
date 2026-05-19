import { TripPlan, TripCard } from '../types';
import {
  getSupabase,
  TRIP_PLANS_TABLE,
  isSupabaseConfigured
} from './supabaseClient';

/**
 * Shape persisted in Supabase under `trip_plans.plan_data` (jsonb).
 * Keeps the source TripCard alongside the generated TripPlan so the viewer
 * can reconstruct the screen exactly as the original creator saw it.
 */
export interface SharedPlanPayload {
  card: TripCard;
  plan: TripPlan;
}

export interface TripPlanRow {
  id: string;                 // uuid
  share_code: string;         // 6-char alnum
  city: string;
  country: string;
  days: number;
  vibe: string;
  plan_data: SharedPlanPayload;
  created_by: string | null;
  created_at: string;
}

// 32-char alphabet, no 0/O/1/I — easier to read aloud and share verbally.
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SHARE_CODE_LEN = 6;

/** Produces a code like "X7K4M2" — 6 chars from an unambiguous alphabet. */
export const generateShareCode = (): string => {
  let s = '';
  for (let i = 0; i < SHARE_CODE_LEN; i++) {
    s += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return s;
};

/**
 * Accepts loose user input ("x7k4 m2", " X7K4M2 ", "yolo X7K4M2") and produces
 * a canonical 6-char uppercase code, or null if it can't be normalized.
 */
export const normalizeShareCode = (input: string): string | null => {
  if (!input) return null;
  // Strip everything that isn't alnum, then uppercase.
  let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Drop a leading YOLO if someone pasted "YOLO-X7K4M2"
  if (cleaned.startsWith('YOLO')) cleaned = cleaned.slice(4);
  if (cleaned.length !== SHARE_CODE_LEN) return null;
  // Must use the unambiguous alphabet (reject 0/O/1/I confusion early).
  for (const ch of cleaned) {
    if (!ID_ALPHABET.includes(ch)) return null;
  }
  return cleaned;
};

interface SavePlanOptions {
  card: TripCard;
  plan: TripPlan;
  createdBy?: string | null;
}

/**
 * Save a freshly generated plan. Retries on the rare share_code collision
 * (32^6 ≈ 1B codes, but cheap insurance).
 * Returns the share_code written to the database.
 */
export const savePlan = async (opts: SavePlanOptions): Promise<string> => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to .env'
    );
  }
  const { card, plan, createdBy } = opts;
  const payload: SharedPlanPayload = { card, plan };

  for (let attempt = 0; attempt < 5; attempt++) {
    const share_code = generateShareCode();
    const { error } = await supabase
      .from(TRIP_PLANS_TABLE)
      .insert({
        share_code,
        city:       plan.city ?? card.city,
        country:    plan.country ?? card.country,
        days:       plan.days ?? card.days,
        vibe:       card.vibe,
        plan_data:  payload,
        created_by: createdBy ?? null
      });

    if (!error) return share_code;

    // 23505 = unique_violation in Postgres
    const isCollision =
      error.code === '23505' || /duplicate key/i.test(error.message);
    if (!isCollision) {
      throw new Error(`Could not save plan: ${error.message}`);
    }
  }
  throw new Error('Could not generate a unique share code after 5 attempts.');
};

/** Fetch a shared plan by its 6-char code. Returns null if not found. */
export const fetchPlan = async (rawCode: string): Promise<SharedPlanPayload | null> => {
  const share_code = normalizeShareCode(rawCode);
  if (!share_code) {
    throw new Error('Invalid share code. Expected 6 letters/numbers, e.g. X7K4M2.');
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to .env'
    );
  }

  const { data, error } = await supabase
    .from(TRIP_PLANS_TABLE)
    .select('share_code, plan_data, created_at')
    .eq('share_code', share_code)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return (data as Pick<TripPlanRow, 'share_code' | 'plan_data' | 'created_at'>).plan_data;
};

/** Build the canonical share URL for a given share code. */
export const buildShareUrl = (shareCode: string): string => {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://yolotravel.app';
  return `${origin}/p/${shareCode}`;
};

export const sharingEnabled = isSupabaseConfigured;

// ────────────────────────────────────────────────────────────────────────────
// Backward-compat shims so older callers don't break during the refactor.
// (Internal — prefer the new names above.)
// ────────────────────────────────────────────────────────────────────────────
export const generatePlanId = generateShareCode;
export const normalizePlanId = normalizeShareCode;
