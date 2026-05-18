// Travelpayouts affiliate ID
export const TRAVELPAYOUTS_AID = '530101';

/**
 * Booking.com arama URL'i — affiliate id ile.
 * @param query - şehir/otel/aktivite adı
 */
export function bookingSearchUrl(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://www.booking.com/searchresults.html?ss=${q}&aid=${TRAVELPAYOUTS_AID}`;
}

/**
 * Var olan bir Booking.com URL'ine affiliate id ekler.
 * Booking'in kendi search'ünden gelen URL'lerde aid yoksa ekler.
 */
export function withAffiliate(url: string): string {
  if (!url) return url;
  if (url.includes('aid=')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}aid=${TRAVELPAYOUTS_AID}`;
}
