import { ArrowLeft, Star, Loader2, Check, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Destination, Hotel } from '../types';
import { fetchHotels } from '../services/claudeService';
import { bookingSearchUrl } from '../services/affiliate';
import { t, LANG } from '../i18n';

interface HotelsScreenProps {
  destination: Destination;
  onBack: () => void;
  onSelect: (hotel: Hotel) => void;
}

export default function HotelsScreen({ destination, onBack, onSelect }: HotelsScreenProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHotels(destination)
      .then(result => {
        if (!cancelled) setHotels(result);
      })
      .catch(err => {
        if (!cancelled) setError(err?.message ?? 'Oteller getirilemedi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [destination.id]);

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-neutral-100 pb-32">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5">
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{destination.name}</h1>
            <p className="text-sm text-neutral-400">{t('hotelTitle')}</p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
            <p className="text-sm text-neutral-400">{t('preparing')}</p>
          </div>
        )}

        {error && (
          <div className="space-y-3 my-4">
            <div className="rounded-xl bg-red-950/40 border border-red-500/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
            <a
              href={bookingSearchUrl(destination.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-4 text-base font-bold text-black active:scale-[0.98] transition-transform glow-amber"
            >
              {destination.name} — Booking.com
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-5 mt-4">
            {hotels.map((hotel, i) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="overflow-hidden rounded-3xl border border-white/5 bg-[#141414] shadow-lg shadow-black/40"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-[#0a0a0a]">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{hotel.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(hotel.stars)].map((_, idx) => (
                          <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-xs text-neutral-400 ml-1">{hotel.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">{t('perNight')}</p>
                      <p className="text-lg font-bold text-amber-400">{hotel.currencySymbol || '$'}{hotel.pricePerNight.toLocaleString()}</p>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-300 mt-3 leading-relaxed">{hotel.description}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {hotel.amenities.slice(0, 4).map(a => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-300"
                      >
                        <Check className="h-3 w-3" />
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl bg-white/5 border border-white/5 px-3 py-2">
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      <span className="font-semibold">💡 </span>
                      {hotel.matchReason}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => onSelect(hotel)} className="flex-1 rounded-2xl border border-amber-400/60 bg-transparent py-3 text-sm font-bold text-amber-400 active:scale-[0.98] transition-transform">
                      {t('detail')}
                    </button>
                    <a href={hotel.bookingUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-2xl bg-amber-400 py-3 text-sm font-bold text-black text-center active:scale-[0.98] transition-transform glow-amber">
                      {LANG === 'tr' ? 'Müsaitliği Kontrol Et →' : 'Check Availability →'}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
