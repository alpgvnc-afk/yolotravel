import { ActivityBlock, DayPlan } from '../types';

/* Stable id generator for editor list keys & drag/drop. */
let _seq = 0;
export function spotId(): string {
  _seq += 1;
  return `spot_${Date.now().toString(36)}_${_seq.toString(36)}`;
}

export const TYPE_EMOJI: Record<string, string> = {
  sight: '🏛️', food: '🍽️', activity: '🎯', transport: '🚗', rest: '🌿',
};
export const emojiForType = (type?: string): string => TYPE_EMOJI[type || ''] || '📍';

const FALLBACK_TIMES = ['09:00', '13:00', '19:00'];

/** Ensure a block has a stable id + a sensible default time. */
function ensureId(b: ActivityBlock, fallbackTime?: string): ActivityBlock {
  return { ...b, id: b.id || spotId(), time: b.time || fallbackTime };
}

/**
 * Canonical, ordered list of spots for a day.
 * Prefers the flexible `spots` array (set after editing); otherwise derives it
 * from the legacy morning/afternoon/evening triple.
 */
export function getDaySpots(day: DayPlan): ActivityBlock[] {
  if (day.spots && day.spots.length) {
    return day.spots.map((s, i) => ensureId(s, s.time || FALLBACK_TIMES[i] || ''));
  }
  const triple = [day.morning, day.afternoon, day.evening].filter(Boolean) as ActivityBlock[];
  return triple.map((b, i) => ensureId(b, b.time || FALLBACK_TIMES[i] || ''));
}

/** Return a new DayPlan whose `spots` is set to the given list. */
export function withDaySpots(day: DayPlan, spots: ActivityBlock[]): DayPlan {
  return { ...day, spots };
}

/** Build a brand-new spot, e.g. from a Places pick or AI suggestion. */
export function makeSpot(partial: Partial<ActivityBlock>): ActivityBlock {
  return {
    id: spotId(),
    title: partial.title || 'New stop',
    description: partial.description || '',
    type: (partial.type as ActivityBlock['type']) || 'activity',
    time: partial.time,
    duration: partial.duration,
    cost: partial.cost,
    lat: partial.lat,
    lng: partial.lng,
    placeDetails: partial.placeDetails ?? null,
  };
}

/** Earliest / latest times across a day's spots (for the per-day card footer). */
export function dayTimeRange(spots: ActivityBlock[]): { start: string; end: string } {
  const times = spots.map(s => s.time).filter(Boolean) as string[];
  if (!times.length) return { start: '', end: '' };
  const sorted = [...times].sort();
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}
