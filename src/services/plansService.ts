import { TripPlan, TripCard } from '../types';
import { getSupabase, PLANS_TABLE, isSupabaseConfigured } from './supabaseClient';

/**
 * Shape persisted in Supabase under `plans.itinerary` (jsonb).
 * Keeps the source TripCard alongside the generated TripPlan so the viewer
 * can reconstruct the screen exactly as the original creator saw it.
 */
export interface SharedPlanPayload {
  card: TripCard;
  plan: TripPlan;
}

export interface SharedPlanRow {
  id: string;
  itinerary: SharedPlanPayload;
  created_at: string;
}

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easier to read aloud
const ID_LEN = 4;

/** "YOLO-1A2B" — 4 chars from an unambiguous alphabet. */
export const generatePlanId = (): string => {
  let suffix = '';
  for (let i = 0; i < ID_LEN; i++) {
    suffix += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return `YOLO-${suffix}`;
};

/** Accepts "yolo 1a2b", "YOLO-1A2B", " 1a2b " → "YOLO-1A2B". null if invalid. */
export const normalizePlanId = (input: string): string | null => {
  if (!input) return null;
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const code = cleaned.startsWith('YOLO') ? cleaned.slice(4) : cleaned;
  if (code.length !== ID_LEN) return null;
  return `YOLO-${code}`;
};

/**
 * Save a freshly generated plan. Retries on the rare ID collision (P2002 / 23505).
 * Returns the final ID written to the database.
 */
export const savePlan = async (payload: SharedPlanPayload): Promise<string> => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to .env');
  }

  // up to 5 attempts to dodge collisions (extremely unlikely with 32^4 = ~1M codes,
  // but cheap insurance)
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generatePlanId();
    const { error } = await supabase
      .from(PLANS_TABLE)
      .insert({ id, itinerary: payload });

    if (!error) return id;

    // 23505 = unique_violation in Postgres
    const isCollision = error.code === '23505' || /duplicate key/i.test(error.message);
    if (!isCollision) {
      throw new Error(`Could not save plan: ${error.message}`);
    }
  }
  throw new Error('Could not generate a unique plan ID after 5 attempts.');
};

/** Fetch a shared plan by its YOLO-XXXX code. Returns null if not found. */
export const fetchPlan = async (rawId: string): Promise<SharedPlanPayload | null> => {
  const id = normalizePlanId(rawId);
  if (!id) throw new Error('Invalid plan code. Expected format: YOLO-XXXX');

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to .env');
  }

  const { data, error } = await supabase
    .from(PLANS_TABLE)
    .select('id, itinerary, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return (data as SharedPlanRow).itinerary;
};

export const sharingEnabled = isSupabaseConfigured;
