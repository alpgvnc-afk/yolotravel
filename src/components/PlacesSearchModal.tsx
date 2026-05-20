import { useState } from 'react';
import { X, Search, Loader2, Star, Plus } from 'lucide-react';
import { fetchPlaceDetails } from '../services/placesService';
import { makeSpot, emojiForType } from '../utils/planSpots';
import { ActivityBlock, PlaceDetails } from '../types';
import { LANG } from '../i18n';

interface PlacesSearchModalProps {
  city: string;
  title?: string;
  onClose: () => void;
  onSelect: (spot: ActivityBlock) => void;
}

function guessType(types?: string[]): ActivityBlock['type'] {
  const t = (types || []).join(' ').toLowerCase();
  if (/(restaurant|cafe|bar|food|bakery|meal)/.test(t)) return 'food';
  if (/(museum|tourist|attraction|landmark|temple|church|park|art_gallery)/.test(t)) return 'sight';
  if (/(lodging|hotel)/.test(t)) return 'rest';
  if (/(transit|station|airport|bus|train)/.test(t)) return 'transport';
  return 'activity';
}

/**
 * Lightweight place lookup modal. Uses the existing /api/place-details proxy
 * (the same one the itinerary uses) to resolve a typed query into a real place
 * with photo + rating, then hands a ready-to-insert spot back to the caller.
 */
export default function PlacesSearchModal({ city, title, onClose, onSelect }: PlacesSearchModalProps) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<PlaceDetails | null>(null);

  const runSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const pd = await fetchPlaceDetails(`${q.trim()}, ${city}`);
    setResult(pd);
    setLoading(false);
  };

  const pick = () => {
    if (!result) return;
    onSelect(makeSpot({
      title: result.name,
      description: result.summary || '',
      type: guessType(result.types),
      placeDetails: result,
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0f0f0f] p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            {title || (LANG === 'tr' ? 'Mekan ara' : 'Search a place')}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141414] px-3 py-2 focus-within:border-amber-400">
          <Search className="h-4 w-4 text-amber-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
            placeholder={LANG === 'tr' ? `${city}'de bir mekan…` : `A place in ${city}…`}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
          />
          <button
            onClick={runSearch}
            disabled={!q.trim() || loading}
            className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (LANG === 'tr' ? 'Ara' : 'Search')}
          </button>
        </div>

        <div className="mt-4 min-h-[80px]">
          {loading && (
            <div className="flex items-center justify-center py-6 text-neutral-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {!loading && searched && !result && (
            <p className="py-6 text-center text-sm text-neutral-500">
              {LANG === 'tr' ? 'Sonuç bulunamadı. Adı netleştirmeyi dene.' : 'No match. Try a more specific name.'}
            </p>
          )}

          {!loading && result && (
            <button
              onClick={pick}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#141414] p-3 text-left transition hover:border-amber-400/50"
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                {result.photoUrl ? (
                  <img src={result.photoUrl} alt={result.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    {emojiForType(guessType(result.types))}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{result.name}</div>
                {result.rating ? (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-white">{result.rating.toFixed(1)}</span>
                    {result.reviewCount ? <span>· {result.reviewCount.toLocaleString()}</span> : null}
                  </div>
                ) : null}
                {result.address && <div className="mt-0.5 truncate text-xs text-neutral-500">{result.address}</div>}
              </div>
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-black">
                <Plus className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
