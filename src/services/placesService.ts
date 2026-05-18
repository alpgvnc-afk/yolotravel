import { PlaceDetails } from '../types';

export async function fetchPlaceDetails(name: string, lat?: number, lng?: number): Promise<PlaceDetails | null> {
  try {
    const params = new URLSearchParams({ name });
    if (lat !== undefined) params.append('lat', String(lat));
    if (lng !== undefined) params.append('lng', String(lng));
    const res = await fetch(`/api/place-details?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.place || null;
  } catch {
    return null;
  }
}
