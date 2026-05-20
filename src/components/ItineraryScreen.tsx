import { useEffect, useMemo, useState, ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, MapPin, Clock, DollarSign, Sun, Sunset, Moon, Hotel, Lightbulb, Calendar, Star, ExternalLink, BedDouble } from 'lucide-react';
import { TripCard, TripPlan, ActivityBlock } from '../types';
import { generateItinerary } from '../services/claudeService';
import { fetchPlaceDetails } from '../services/placesService';
import { bookingSearchUrl } from '../services/affiliate';
import { loadPreferences, addRecentTrip } from '../services/storage';
import { savePlan, sharingEnabled } from '../services/plansService';
import ShareCard from './ShareCard';
import ShareButton from './ShareButton';
import { t, LANG } from '../i18n';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

interface ItineraryScreenProps {
  card: TripCard;
  onBack: () => void;
  onViewHotels: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  sight: '🏛️',
  food: '🍽️',
  activity: '🎯',
  transport: '🚗',
  rest: '🌿'
};

const TYPE_COLORS: Record<string, string> = {
  sight: 'bg-blue-50 text-blue-700 border-blue-200',
  food: 'bg-orange-50 text-orange-700 border-orange-200',
  activity: 'bg-purple-50 text-purple-700 border-purple-200',
  transport: 'bg-gray-50 text-gray-700 border-gray-200',
  rest: 'bg-green-50 text-green-700 border-green-200'
};

// Dark-mode pill colors — same hues, deeper backgrounds, brighter text.
const TYPE_COLORS_DARK: Record<string, string> = {
  sight:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  food:      'bg-orange-500/15 text-orange-300 border-orange-500/30',
  activity:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  transport: 'bg-white/5 text-neutral-300 border-white/10',
  rest:      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
};

// Fallback gradient shown when a Google Places photo is missing / fails to load.
// Keeps the card from collapsing into a blank rectangle and gives a subtle
// vibe-appropriate hint per activity type.
const PLACEHOLDER_GRADIENT: Record<string, string> = {
  sight:     'linear-gradient(135deg, #1e3a8a 0%, #0a0a0a 100%)',
  food:      'linear-gradient(135deg, #7c2d12 0%, #0a0a0a 100%)',
  activity:  'linear-gradient(135deg, #581c87 0%, #0a0a0a 100%)',
  transport: 'linear-gradient(135deg, #374151 0%, #0a0a0a 100%)',
  rest:      'linear-gradient(135deg, #064e3b 0%, #0a0a0a 100%)'
};

const MARKER_COLORS: Record<string, string> = {
  sight: '#3b82f6',     // blue
  food: '#f97316',      // orange
  activity: '#a855f7',  // purple
  transport: '#6b7280', // gray
  rest: '#22c55e'       // green
};

export default function ItineraryScreen({ card, onBack, onViewHotels }: ItineraryScreenProps) {
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
  });

  const [variantSeed, setVariantSeed] = useState(0);

  // Real Places photos (name + photoUrl) for the shareable card —
  // flattened from every day's activity blocks, deduped, first few only.
  const sharePlaces = useMemo(() => {
    if (!plan) return [] as { name: string; photoUrl: string }[];
    const seen = new Set<string>();
    const out: { name: string; photoUrl: string }[] = [];
    for (const day of plan.days_plan) {
      for (const block of [day.morning, day.afternoon, day.evening]) {
        const url = block.placeDetails?.photoUrl;
        if (!url) continue;
        const name = block.placeDetails?.name || block.title;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name, photoUrl: url });
        if (out.length >= 6) return out;
      }
    }
    return out;
  }, [plan]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlanId(null);     // a fresh generation gets a fresh share code
    setSaveError(null);

    // Tercihler localStorage'dan yükle, Claude'a geç
    const userPreferences = loadPreferences();

    // Son baktığı plana ekle
    addRecentTrip({
      cardId: card.id,
      city: card.city,
      country: card.country,
      timestamp: Date.now(),
      image: card.image
    });

    generateItinerary({
      city: card.city,
      country: card.country,
      days: card.days,
      vibe: card.vibe,
      budget: card.estimatedCost,
      interests: card.highlights.join(', '),
      variantSeed,
      userPreferences
    })
      .then(async result => {
        if (cancelled) return;
        setPlan(result);
        setLoading(false);

        // Plan geldi, her aktivite için paralel olarak Google Places'tan detay çek
        const enrichedDays = await Promise.all(
          result.days_plan.map(async (day) => {
            const [morning, afternoon, evening] = await Promise.all([
              fetchPlaceDetails(`${day.morning.title}, ${card.city}`, day.morning.lat, day.morning.lng).then(pd => ({ ...day.morning, placeDetails: pd })),
              fetchPlaceDetails(`${day.afternoon.title}, ${card.city}`, day.afternoon.lat, day.afternoon.lng).then(pd => ({ ...day.afternoon, placeDetails: pd })),
              fetchPlaceDetails(`${day.evening.title}, ${card.city}`, day.evening.lat, day.evening.lng).then(pd => ({ ...day.evening, placeDetails: pd }))
            ]);
            return { ...day, morning, afternoon, evening };
          })
        );
        if (cancelled) return;
        const enrichedPlan = { ...result, days_plan: enrichedDays };
        setPlan(enrichedPlan);

        // Plan is ready — stringify + persist + mint share code.
        // Wrapped so a Supabase outage never breaks the itinerary view.
        if (sharingEnabled()) {
          try {
            const code = await savePlan({
              card,
              plan: enrichedPlan,
              createdBy: userPreferences?.name ?? null
            });
            if (!cancelled) setPlanId(code);
          } catch (e: any) {
            if (!cancelled) {
              console.error('[ItineraryScreen] savePlan failed', e);
              setSaveError(e?.message ?? 'Could not save plan.');
            }
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err?.message ?? 'Failed.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [card.id, variantSeed]);

  const regeneratePlan = () => {
    setVariantSeed(s => s + 1);
  };

  const formatCost = (cost: number): string => {
    if (LANG === 'tr') return `₺${Math.round(cost * 35).toLocaleString()}`;
    return `$${cost.toLocaleString()}`;
  };

  const renderActivity = (block: ActivityBlock, icon: ReactNode, label: string) => {
    const pd = block.placeDetails;
    return (
      <div className="relative pl-8">
        <div className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-black z-10">
          {icon}
        </div>
        <div className="ml-2 pb-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            {label} {block.duration && `• ${block.duration}`}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#141414] shadow-lg shadow-black/30">
            <div className="aspect-[16/9] w-full overflow-hidden relative">
              {/* Placeholder gradient — always renders, image overlays it.
                  If the image fails or is missing, the gradient stays visible. */}
              <div
                className="absolute inset-0 flex items-center justify-center text-3xl opacity-60"
                style={{ background: PLACEHOLDER_GRADIENT[block.type] || PLACEHOLDER_GRADIENT.sight }}
                aria-hidden="true"
              >
                {TYPE_ICONS[block.type] || '📍'}
              </div>
              {pd?.photoUrl && (
                <img
                  src={pd.photoUrl}
                  alt={block.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="p-4">
              <h4 className="text-base font-bold text-white flex items-start gap-2">
                <span>{TYPE_ICONS[block.type] || '📍'}</span>
                <span className="flex-1">{block.title}</span>
              </h4>

              {pd?.rating && (
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-white">{pd.rating.toFixed(1)}</span>
                  </div>
                  {pd.reviewCount ? (
                    <span className="text-neutral-500">({pd.reviewCount.toLocaleString()} {LANG === 'tr' ? 'değerlendirme' : 'reviews'})</span>
                  ) : null}
                </div>
              )}

              <p className="mt-2 text-sm text-neutral-300 leading-relaxed">{block.description}</p>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${TYPE_COLORS_DARK[block.type] || ''}`}>
                  {block.type}
                </span>
                {block.cost ? (
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ~{formatCost(block.cost)}
                  </span>
                ) : null}
                {pd?.googleMapsUrl && (
                  <a
                    href={pd.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-neutral-100 pb-32">
      {/* Hero */}
      <div className="relative">
        <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 relative">
          <img src={card.image} alt={card.city} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <button onClick={onBack} className="absolute top-12 left-4 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>

          {/* Top-right Share button (shown once Supabase has minted a code) */}
          {sharingEnabled() && (
            <div className="absolute top-12 right-4">
              <ShareButton shareCode={planId} city={card.city} variant="pill" />
            </div>
          )}

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 text-sm font-medium opacity-90">
              <span>{card.countryFlag}</span>
              <span>{card.country}</span>
            </div>
            <h1 className="text-4xl font-bold mt-1">{card.city}</h1>
            <p className="text-sm opacity-90 mt-1">{card.title}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-6 mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[#141414] border border-white/5 p-3 text-center shadow-sm">
          <Calendar className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">{card.days}</div>
          <div className="text-[10px] text-neutral-500">{LANG === 'tr' ? 'gün' : 'days'}</div>
        </div>
        <div className="rounded-2xl bg-[#141414] border border-white/5 p-3 text-center shadow-sm">
          <DollarSign className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">{formatCost(card.estimatedCost)}</div>
          <div className="text-[10px] text-neutral-500">{LANG === 'tr' ? 'tahmini' : 'estimated'}</div>
        </div>
        <div className="rounded-2xl bg-[#141414] border border-white/5 p-3 text-center shadow-sm">
          <MapPin className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">{card.vibe}</div>
          <div className="text-[10px] text-neutral-500">{LANG === 'tr' ? 'tarz' : 'vibe'}</div>
        </div>
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-6 mt-4 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-6 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{
                background: [
                  'radial-gradient(circle at 0% 0%, #fbbf24 0%, transparent 50%)',
                  'radial-gradient(circle at 100% 100%, #fbbf24 0%, transparent 50%)',
                  'radial-gradient(circle at 0% 100%, #fbbf24 0%, transparent 50%)',
                  'radial-gradient(circle at 100% 0%, #fbbf24 0%, transparent 50%)',
                  'radial-gradient(circle at 0% 0%, #fbbf24 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-black">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor" />
                </svg>
              </motion.div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">AI Travel Agent</div>
                <div className="text-sm font-bold mt-0.5">
                  {LANG === 'tr' ? 'Senin için çalışıyor' : 'Working for you'}
                </div>
              </div>
            </div>

            <LoadingMessages />

            {/* Progress bar */}
            <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="px-6 mt-4 space-y-3 opacity-60">
          <div className="rounded-2xl bg-[#141414] animate-pulse h-64" />
          <div className="space-y-3 mt-4">
            <div className="rounded-xl bg-[#141414] animate-pulse h-32" />
            <div className="rounded-xl bg-[#141414] animate-pulse h-32" />
            <div className="rounded-xl bg-[#141414] animate-pulse h-32" />
          </div>
        </div>
      )}

      {error && (
        <div className="m-6 rounded-xl bg-red-950/40 border border-red-500/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {plan && (
        <>
          {/* Summary */}
          <div className="mx-6 mt-4 rounded-2xl bg-[#141414] border border-amber-400/20 p-4">
            <p className="text-sm text-neutral-200 leading-relaxed">{plan.summary}</p>
            <button
              onClick={regeneratePlan}
              className="mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 active:scale-95 transition-transform flex items-center gap-1"
            >
              🔄 {LANG === 'tr' ? 'Yeni plan öner' : 'Suggest a different plan'}
            </button>
          </div>

          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto px-6 py-4 mt-2 no-scrollbar">
            {plan.days_plan.map(d => (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  activeDay === d.day
                    ? 'bg-amber-400 text-black shadow-lg glow-amber'
                    : 'bg-[#141414] border border-white/10 text-neutral-300'
                }`}
              >
                {LANG === 'tr' ? `Gün ${d.day}` : `Day ${d.day}`}
              </button>
            ))}
          </div>

          {/* MAP — gün için yerler */}
          {(() => {
            const currentDay = plan.days_plan.find(d => d.day === activeDay);
            if (!currentDay || !mapsLoaded) return null;

            const blocks = [
              { ...currentDay.morning, label: LANG === 'tr' ? 'Sabah' : 'Morning' },
              { ...currentDay.afternoon, label: LANG === 'tr' ? 'Öğleden Sonra' : 'Afternoon' },
              { ...currentDay.evening, label: LANG === 'tr' ? 'Akşam' : 'Evening' }
            ].filter(b => b.lat && b.lng);

            if (blocks.length === 0) return null;

            // Ortalamayı bul (merkez)
            const avgLat = blocks.reduce((s, b) => s + (b.lat || 0), 0) / blocks.length;
            const avgLng = blocks.reduce((s, b) => s + (b.lng || 0), 0) / blocks.length;

            return (
              <div className="mx-6 mb-4 rounded-2xl overflow-hidden shadow-xl border border-gray-100" style={{ height: 280 }}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: avgLat, lng: avgLng }}
                  zoom={13}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: [
                      { featureType: 'poi', stylers: [{ visibility: 'simplified' }] }
                    ]
                  }}
                >
                  {/* Markers */}
                  {blocks.map((b, i) => (
                    <Marker
                      key={i}
                      position={{ lat: b.lat!, lng: b.lng! }}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: MARKER_COLORS[b.type] || '#f59e0b',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 3,
                        scale: 12
                      }}
                      label={{
                        text: String(i + 1),
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                      onClick={() => setActiveMarker(`day${activeDay}-${i}`)}
                    >
                      {activeMarker === `day${activeDay}-${i}` && (
                        <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                          <div style={{ minWidth: 150, padding: 4 }}>
                            <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: 700 }}>{b.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{b.title}</div>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  ))}

                  {/* Connecting line — kırmızı */}
                  <Polyline
                    path={blocks.map(b => ({ lat: b.lat!, lng: b.lng! }))}
                    options={{
                      strokeColor: '#ef4444',
                      strokeOpacity: 0.85,
                      strokeWeight: 3,
                      geodesic: true
                    }}
                  />
                </GoogleMap>
              </div>
            );
          })()}

          {/* Active day timeline */}
          {plan.days_plan.filter(d => d.day === activeDay).map(day => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mt-2 relative"
            >
              {/* Vertical line */}
              <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-300 to-transparent" />

              {renderActivity(day.morning, <Sun className="h-4 w-4" />, LANG === 'tr' ? 'Sabah' : 'Morning')}
              {renderActivity(day.afternoon, <Sunset className="h-4 w-4" />, LANG === 'tr' ? 'Öğleden Sonra' : 'Afternoon')}
              {renderActivity(day.evening, <Moon className="h-4 w-4" />, LANG === 'tr' ? 'Akşam' : 'Evening')}

              {/* Bu gün için otel ara mini buton */}
              <a
                href={bookingSearchUrl(card.city)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-10 mt-1 inline-flex items-center gap-2 rounded-xl bg-[#141414] border border-amber-400/30 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:bg-[#1c1c1c] transition-colors"
              >
                <BedDouble className="h-3.5 w-3.5" />
                {LANG === 'tr'
                  ? `${card.city} için otel ara`
                  : `Find hotels in ${card.city}`}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </motion.div>
          ))}

          {/* Hotel suggestion → direkt Booking affiliate'a */}
          <div className="mx-6 mt-6 rounded-2xl bg-[#141414] border border-white/5 p-5 text-white">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400">
                <Hotel className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">
                  {LANG === 'tr' ? 'Nerede kalmalı?' : 'Where to stay?'}
                </h3>
                <p className="text-xs text-white/70 mt-1">{plan.recommendedHotelArea}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onViewHotels}
                className="rounded-xl bg-white/10 border border-white/20 py-3 text-xs font-bold text-white active:scale-[0.98] transition-transform"
              >
                {LANG === 'tr' ? 'Yolo Otelleri' : 'Yolo Hotels'}
              </button>
              <a
                href={bookingSearchUrl(`${plan.recommendedHotelArea}, ${card.city}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-amber-400 py-3 text-xs font-bold text-black text-center active:scale-[0.98] transition-transform flex items-center justify-center gap-1 glow-amber"
              >
                Booking.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Shareable plan card — only shown after Supabase save succeeds */}
          {planId && (
            <ShareCard
              city={card.city}
              country={card.country}
              days={card.days}
              vibe={card.vibe}
              shareCode={planId}
              places={sharePlaces}
            />
          )}
          {saveError && !planId && (
            <div className="mx-6 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs text-amber-300">
              {LANG === 'tr'
                ? `Paylaşım kodu oluşturulamadı: ${saveError}`
                : `Could not create share code: ${saveError}`}
            </div>
          )}

          {/* Tips */}
          {plan.tips.length > 0 && (
            <div className="mx-6 mt-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-white mb-3">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                {LANG === 'tr' ? 'Pratik İpuçları' : 'Practical Tips'}
              </h3>
              <ul className="space-y-2">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="rounded-xl bg-[#141414] border border-white/5 px-4 py-3 text-sm text-neutral-300 flex gap-2">
                    <span className="text-amber-400">✦</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// LoadingMessages — rotates through "AI is doing X" messages
import { useEffect as useEffectRot, useState as useStateRot } from 'react';

const LOADING_MESSAGES_TR = [
  '🗺️ Şehrin en iyi mekanlarını araştırıyorum...',
  '🍽️ Yerel restoranları inceliyorum...',
  '⭐ Misafir yorumlarını okuyorum...',
  '📍 Rotanı optimize ediyorum...',
  '🏛️ Tarihi yerleri seçiyorum...',
  '🌅 Gün batımı noktalarını buluyorum...',
  '☕ Hidden gem kafeleri arıyorum...',
  '💎 Sana özel deneyimler hazırlıyorum...'
];

const LOADING_MESSAGES_EN = [
  '🗺️ Researching the best places in the city...',
  '🍽️ Reviewing local restaurants...',
  '⭐ Reading guest reviews...',
  '📍 Optimizing your route...',
  '🏛️ Selecting historical sites...',
  '🌅 Finding sunset spots...',
  '☕ Searching for hidden gem cafes...',
  '💎 Crafting personalized experiences for you...'
];

function LoadingMessages() {
  const messages = LANG === 'tr' ? LOADING_MESSAGES_TR : LOADING_MESSAGES_EN;
  const [idx, setIdx] = useStateRot(0);

  useEffectRot(() => {
    const interval = setInterval(() => {
      setIdx(i => (i + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[24px]">
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="text-sm text-white/90"
      >
        {messages[idx]}
      </motion.div>
    </div>
  );
}
