import { Sparkles, ArrowRight, Clock, DollarSign, Ticket, Loader2 } from 'lucide-react';
import { TRIP_CARDS } from '../constants';
import { TripCard } from '../types';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { t, LANG } from '../i18n';
import { loadPreferences, getLastTrip } from '../services/storage';
import { normalizeShareCode, sharingEnabled } from '../services/plansService';

interface ExploreScreenProps {
  onSelectTrip: (card: TripCard) => void;
  onStartChat: () => void;
  onOpenSharedPlan?: (planId: string) => void;
}

const VIBES = ['All', 'Romantic', 'Adventure', 'Foodie', 'Budget', 'Relax', 'City', 'Culture'];

export default function ExploreScreen({ onSelectTrip, onStartChat, onOpenSharedPlan }: ExploreScreenProps) {
  const [activeVibe, setActiveVibe] = useState<string>('All');
  const [userName, setUserName] = useState<string>('');
  const [lastTrip, setLastTrip] = useState<{ cardId: string; city: string; image?: string } | null>(null);
  const [planCodeInput, setPlanCodeInput] = useState<string>('');
  const [planCodeError, setPlanCodeError] = useState<string | null>(null);
  const [planCodeLoading, setPlanCodeLoading] = useState<boolean>(false);

  const handleOpenCode = () => {
    setPlanCodeError(null);
    const normalized = normalizeShareCode(planCodeInput);
    if (!normalized) {
      setPlanCodeError(
        LANG === 'tr'
          ? 'Geçersiz kod. 6 karakter, örn: X7K4M2'
          : 'Invalid code. 6 characters, e.g. X7K4M2'
      );
      return;
    }
    if (!sharingEnabled()) {
      setPlanCodeError(
        LANG === 'tr'
          ? 'Paylaşım özelliği kapalı. .env içine Supabase anahtarlarını ekle.'
          : 'Sharing is disabled. Add Supabase keys to .env.'
      );
      return;
    }
    setPlanCodeLoading(true);
    onOpenSharedPlan?.(normalized);
    // The viewer screen will do the actual fetch — we just navigate.
    // Reset spinner shortly after so the field is ready for next time.
    setTimeout(() => setPlanCodeLoading(false), 600);
  };

  useEffect(() => {
    const prefs = loadPreferences();
    setUserName(prefs.name || 'Alp');
    const last = getLastTrip();
    setLastTrip(last);
  }, []);

  const filtered = activeVibe === 'All'
    ? TRIP_CARDS
    : TRIP_CARDS.filter(c => c.vibe === activeVibe);

  const formatPrice = (priceUSD: number): string => {
    if (LANG === 'tr') {
      return `₺${(priceUSD * 35).toLocaleString()}`;
    }
    return `$${priceUSD.toLocaleString()}`;
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-neutral-100 pb-32">
      {/* HERO */}
      <div className="relative px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 glow-amber">
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Yolo</h2>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-amber-400">
            <img src="https://picsum.photos/seed/avatar/200/200" alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-white leading-tight"
        >
          {LANG === 'tr' ? `Merhaba ${userName.split(' ')[0]},` : `Hi ${userName.split(' ')[0]},`}<br />
          <span className="text-amber-400">{LANG === 'tr' ? 'nereye gidelim?' : 'where to next?'}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-sm text-neutral-400 leading-relaxed"
        >
          {LANG === 'tr'
            ? 'Saniyeler içinde kişiselleştirilmiş rotalar, oteller ve günlük planlar.'
            : 'Get personalized itineraries, hotels and routes in seconds.'}
        </motion.p>

        {/* Welcome back: son baktığı planı tekrar göster */}
        {lastTrip && (() => {
          const lastCard = TRIP_CARDS.find(c => c.id === lastTrip.cardId);
          if (!lastCard) return null;
          return (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => onSelectTrip(lastCard)}
              className="mt-4 w-full flex items-center gap-3 rounded-2xl bg-[#141414] border border-amber-400/30 p-3 text-left hover:border-amber-400/60 transition-colors"
            >
              <img src={lastTrip.image || lastCard.image} alt={lastTrip.city} className="h-12 w-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {LANG === 'tr' ? 'Kaldığın yerden devam et' : 'Pick up where you left off'}
                </div>
                <div className="text-sm font-bold text-white mt-0.5">{lastTrip.city} — {lastCard.title}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </motion.button>
          );
        })()}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onStartChat}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400 text-black py-4 text-base font-bold shadow-xl glow-amber active:scale-[0.98] transition-transform"
        >
          <Sparkles className="h-5 w-5" />
          {LANG === 'tr' ? 'AI ile Yeni Plan Oluştur' : 'Create a New Trip with AI'}
          <ArrowRight className="h-5 w-5" />
        </motion.button>

        {/* Enter Plan Code — open a friend's shared plan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-3"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141414] px-3 py-2 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
            <Ticket className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <input
              type="text"
              value={planCodeInput}
              onChange={(e) => {
                setPlanCodeInput(e.target.value);
                if (planCodeError) setPlanCodeError(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleOpenCode(); }}
              placeholder={LANG === 'tr' ? 'Plan Kodu Gir (X7K4M2)' : 'Have a code? (X7K4M2)'}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 min-w-0 bg-transparent text-sm font-mono text-white placeholder:text-neutral-500 placeholder:font-sans outline-none"
            />
            <button
              onClick={handleOpenCode}
              disabled={planCodeLoading || !planCodeInput.trim()}
              className="flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-black active:scale-95 transition-transform disabled:opacity-30 disabled:active:scale-100"
            >
              {planCodeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              {LANG === 'tr' ? 'Aç' : 'Open'}
            </button>
          </div>
          {planCodeError && (
            <p className="mt-1.5 ml-1 text-[11px] text-red-400">{planCodeError}</p>
          )}
        </motion.div>
      </div>

      {/* SECTION TITLE */}
      <div className="px-6 mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          {LANG === 'tr' ? 'Hazır AI Planları' : 'AI-Curated Trips'}
        </h3>
        <span className="text-xs text-neutral-500">{filtered.length} {LANG === 'tr' ? 'plan' : 'trips'}</span>
      </div>

      {/* VIBE FILTERS */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-3 no-scrollbar">
        {VIBES.map(v => (
          <button
            key={v}
            onClick={() => setActiveVibe(v)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeVibe === v
                ? 'bg-amber-400 text-black glow-amber'
                : 'bg-[#141414] text-neutral-300 border border-white/10 hover:border-white/20'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* TRIP CARDS */}
      <div className="px-6 py-4 space-y-4">
        {filtered.map((trip, i) => (
          <motion.div
            key={trip.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelectTrip(trip)}
            className="group relative overflow-hidden rounded-3xl bg-[#141414] border border-white/5 shadow-xl shadow-black/40 cursor-pointer"
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100 relative">
              <img
                src={trip.image}
                alt={trip.city}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Vibe badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-black">
                <Sparkles className="h-3 w-3" />
                {trip.vibe}
              </div>

              {/* Bottom info on image */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 text-xs font-medium opacity-90">
                  <span>{trip.countryFlag}</span>
                  <span>{trip.country}</span>
                </div>
                <h4 className="text-2xl font-bold mt-1">{trip.city}</h4>
              </div>
            </div>

            <div className="p-5">
              <h5 className="text-base font-bold text-white">{trip.title}</h5>

              <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {trip.days} {LANG === 'tr' ? 'gün' : 'days'}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  ~{formatPrice(trip.estimatedCost)}
                </div>
              </div>

              <ul className="mt-3 space-y-1">
                {trip.highlights.slice(0, 3).map((h, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-neutral-300">
                    <span className="text-amber-400 mt-0.5">✦</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">
                  {LANG === 'tr' ? 'Planı incele' : 'See full plan'} →
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
