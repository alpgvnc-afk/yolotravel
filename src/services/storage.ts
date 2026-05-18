import { UserPreferences, RecentTrip } from '../types';

const PREFS_KEY = 'yolo.userPrefs.v1';
const RECENT_TRIPS_KEY = 'yolo.recentTrips.v1';
const MAX_RECENT_TRIPS = 5;

// ====== USER PREFERENCES ======

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return {};
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* full or disabled, ignore */
  }
}

export function updatePreferences(patch: Partial<UserPreferences>): UserPreferences {
  const current = loadPreferences();
  const next = { ...current, ...patch };
  savePreferences(next);
  return next;
}

export function clearPreferences(): void {
  try { localStorage.removeItem(PREFS_KEY); } catch {}
}

// ====== RECENT TRIPS ======

export function loadRecentTrips(): RecentTrip[] {
  try {
    const raw = localStorage.getItem(RECENT_TRIPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentTrip[];
  } catch {
    return [];
  }
}

export function addRecentTrip(trip: RecentTrip): void {
  try {
    const existing = loadRecentTrips().filter(t => t.cardId !== trip.cardId);
    const updated = [trip, ...existing].slice(0, MAX_RECENT_TRIPS);
    localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function getLastTrip(): RecentTrip | null {
  const trips = loadRecentTrips();
  return trips.length > 0 ? trips[0] : null;
}

// Kullanıcı yeni mi, dönüş mü?
export function isReturningUser(): boolean {
  const trips = loadRecentTrips();
  const prefs = loadPreferences();
  return trips.length > 0 || Object.keys(prefs).length > 0;
}
