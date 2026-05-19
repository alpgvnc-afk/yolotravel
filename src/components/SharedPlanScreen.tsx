import { useEffect, useState, ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Loader2, MapPin, DollarSign, Sun, Sunset, Moon,
  Calendar, Star, ExternalLink, Wallet, Utensils, Landmark,
  Activity, Bus, Leaf, BedDouble
} from 'lucide-react';
import { TripPlan, TripCard, ActivityBlock } from '../types';
import { fetchPlan, normalizeShareCode } from '../services/plansService';
import { calculateBudget, BudgetBreakdown } from '../services/budgetService';
import ShareButton from './ShareButton';
import { LANG } from '../i18n';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

interface SharedPlanScreenProps {
  planId: string;
  onBack: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  sight: '🏛️',
  food: '🍽️',
  activity: '🎯',
  transport: '🚗',
  rest: '🌿'
};

const TYPE_COLORS: Record<string, string> = {
  sight:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  food:      'bg-orange-500/15 text-orange-300 border-orange-500/30',
  activity:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  transport: 'bg-white/5 text-neutral-300 border-white/10',
  rest:      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
};

const MARKER_COLORS: Record<string, string> = {
  sight: '#3b82f6',
  food: '#f97316',
  activity: '#a855f7',
  transport: '#6b7280',
  rest: '#22c55e'
};

export default function SharedPlanScreen({ planId, onBack }: SharedPlanScreenProps) {
  const [card, setCard] = useState<TripCard | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlan(null);
    setCard(null);
    setBudget(null);

    fetchPlan(planId)
      .then(payload => {
        if (cancelled) return;
        if (!payload) {
          setError(
            LANG === 'tr'
              ? `Bu kodla bir plan bulunamadı: ${normalizeShareCode(planId) ?? planId}`
              : `No plan found with code: ${normalizeShareCode(planId) ?? planId}`
          );
          setLoading(false);
          return;
        }
        setCard(payload.card);
        setPlan(payload.plan);
        // Live budget — recomputed on the viewer's device every time.
        setBudget(calculateBudget(payload.plan));
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err?.message ?? 'Failed to load shared plan.');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [planId]);

  const formatCost = (cost: number): string => {
    if (LANG === 'tr') return `₺${Math.round(cost * 35).toLocaleString()}`;
    return `$${Math.round(cost).toLocaleString()}`;
  };

  const renderActivity = (block: ActivityBlock, icon: ReactNode, label: string) => {
    const pd = block.placeDetails;
    return (
      <div className="relative pl-8">
        <div className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-black z-10">
          {icon}
        </div>
        <div className="ml-2 pb-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            {label} {block.duration && `• ${block.duration}`}
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#141414] shadow-lg shadow-black/30">
            {pd?.photoUrl && (
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#0a0a0a]">
                <img src={pd.photoUrl} alt={block.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer" loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div className="p-4">
              <h4 className="text-base font-bold text-white flex items-start gap-2">
                <span>{TYPE_ICONS[block.type] || '📍'}</span>
                <span className="flex-1">{block.title}</span>
              </h4>
              {pd?.rating && (
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">{pd.rating.toFixed(1)}</span>
                  {pd.reviewCount ? (
                    <span className="text-neutral-500">({pd.reviewCount.toLocaleString()})</span>
                  ) : null}
                </div>
              )}
              <p className="mt-2 text-sm text-neutral-300 leading-relaxed">{block.description}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${TYPE_COLORS[block.type] || ''}`}>
                  {block.type}
                </span>
                {block.cost ? (
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />~{formatCost(block.cost)}
                  </span>
                ) : null}
                {pd?.googleMapsUrl && (
                  <a href={pd.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
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

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm text-neutral-400">
          {LANG === 'tr' ? 'Plan yükleniyor…' : 'Loading shared plan…'}
        </p>
        <p className="mt-1 font-mono text-xs text-neutral-500">{normalizeShareCode(planId) ?? planId}</p>
      </div>
    );
  }

  if (error || !plan || !card) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
        <button onClick={onBack} className="absolute top-12 left-4 p-2 rounded-full bg-white/5">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="text-5xl mb-3">🤷</div>
        <h2 className="text-lg font-bold text-white">
          {LANG === 'tr' ? 'Plan bulunamadı' : 'Plan not found'}
        </h2>
        <p className="mt-2 text-sm text-neutral-400">{error}</p>
        <button onClick={onBack} className="mt-6 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-black glow-amber">
          {LANG === 'tr' ? 'Geri Dön' : 'Go Back'}
        </button>
      </div>
    );
  }

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
          <div className="absolute top-12 right-4 flex items-center gap-2">
            <div className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-black font-mono shadow-lg">
              {normalizeShareCode(planId)}
            </div>
            <ShareButton
              shareCode={normalizeShareCode(planId)}
              city={card.city}
              variant="pill"
            />
          </div>
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 text-sm font-medium opacity-90">
              <span>{card.countryFlag}</span>
              <span>{card.country}</span>
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                {LANG === 'tr' ? 'Paylaşılan Plan' : 'Shared Plan'}
              </span>
            </div>
            <h1 className="text-4xl font-bold mt-1">{card.city}</h1>
            <p className="text-sm opacity-90 mt-1">{card.title}</p>
          </div>
        </div>
      </div>

      {/* LIVE BUDGET — recomputed for the viewer */}
      {budget && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-5 rounded-3xl bg-gradient-to-br from-zinc-900 to-black p-5 text-white shadow-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400">
              <Wallet className="h-4 w-4 text-black" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {LANG === 'tr' ? 'Canlı Bütçe Tahmini' : 'Live Budget Estimate'}
              </div>
              <div className="text-xs text-white/60">
                {LANG === 'tr'
                  ? `${budget.countedBlocks}/${budget.totalBlocks} aktiviteden hesaplandı`
                  : `Calculated from ${budget.countedBlocks}/${budget.totalBlocks} activities`}
              </div>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight">{formatCost(budget.grandTotal)}</span>
            <span className="mb-1 text-xs text-white/60">
              ≈ {formatCost(budget.perDay)} {LANG === 'tr' ? '/gün' : '/day'}
            </span>
          </div>

          {/* Category breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <BudgetRow icon={<BedDouble className="h-3.5 w-3.5" />} label={LANG === 'tr' ? 'Konaklama' : 'Stay'} value={formatCost(budget.accommodationEstimate)} />
            <BudgetRow icon={<Utensils className="h-3.5 w-3.5" />} label={LANG === 'tr' ? 'Yemek' : 'Food'} value={formatCost(budget.food)} />
            <BudgetRow icon={<Landmark className="h-3.5 w-3.5" />} label={LANG === 'tr' ? 'Gezilecek' : 'Sights'} value={formatCost(budget.sights)} />
            <BudgetRow icon={<Activity className="h-3.5 w-3.5" />} label={LANG === 'tr' ? 'Aktivite' : 'Activities'} value={formatCost(budget.activities)} />
            <BudgetRow icon={<Bus className="h-3.5 w-3.5" />} label={LANG === 'tr' ? 'Ulaşım' : 'Transport'} value={formatCost(budget.transport)} />
            <BudgetRow icon={<Leaf className="h-3.5 w-3.5" />} label={LANG === 'tr' ? 'Dinlenme' : 'Rest'} value={formatCost(budget.rest)} />
          </div>

          <p className="mt-3 text-[10px] text-white/50 leading-snug">
            {LANG === 'tr'
              ? 'Tahminler kişi başınadır. Konaklama varsayılan olarak gece ~$120 alınmıştır.'
              : 'Per-person estimate. Accommodation defaults to ~$120/night.'}
          </p>
        </motion.div>
      )}

      {/* Quick stats */}
      <div className="px-6 mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[#141414] border border-white/5 p-3 text-center shadow-sm">
          <Calendar className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">{card.days}</div>
          <div className="text-[10px] text-neutral-500">{LANG === 'tr' ? 'gün' : 'days'}</div>
        </div>
        <div className="rounded-2xl bg-[#141414] border border-white/5 p-3 text-center shadow-sm">
          <MapPin className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">{card.vibe}</div>
          <div className="text-[10px] text-neutral-500">{LANG === 'tr' ? 'tarz' : 'vibe'}</div>
        </div>
        <div className="rounded-2xl bg-[#141414] border border-white/5 p-3 text-center shadow-sm">
          <DollarSign className="h-4 w-4 text-amber-400 mx-auto mb-1" />
          <div className="text-base font-bold text-white">{budget ? formatCost(budget.perDay) : '—'}</div>
          <div className="text-[10px] text-neutral-500">{LANG === 'tr' ? '/gün' : '/day'}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="mx-6 mt-4 rounded-2xl bg-[#141414] border border-amber-400/20 p-4">
        <p className="text-sm text-neutral-200 leading-relaxed">{plan.summary}</p>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto px-6 py-4 mt-2 no-scrollbar">
        {plan.days_plan.map(d => (
          <button key={d.day} onClick={() => setActiveDay(d.day)}
            className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeDay === d.day ? 'bg-amber-400 text-black shadow-lg glow-amber'
                : 'bg-[#141414] border border-white/10 text-neutral-300'
            }`}>
            {LANG === 'tr' ? `Gün ${d.day}` : `Day ${d.day}`}
          </button>
        ))}
      </div>

      {/* Map */}
      {(() => {
        const currentDay = plan.days_plan.find(d => d.day === activeDay);
        if (!currentDay || !mapsLoaded) return null;
        const blocks = [currentDay.morning, currentDay.afternoon, currentDay.evening]
          .filter(b => b.lat && b.lng);
        if (blocks.length === 0) return null;
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
                styles: [{ featureType: 'poi', stylers: [{ visibility: 'simplified' }] }]
              }}
            >
              {blocks.map((b, i) => (
                <Marker key={i} position={{ lat: b.lat!, lng: b.lng! }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: MARKER_COLORS[b.type] || '#f59e0b',
                    fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3, scale: 12
                  }}
                  label={{ text: String(i + 1), color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
                />
              ))}
              <Polyline path={blocks.map(b => ({ lat: b.lat!, lng: b.lng! }))}
                options={{ strokeColor: '#ef4444', strokeOpacity: 0.85, strokeWeight: 3, geodesic: true }} />
            </GoogleMap>
          </div>
        );
      })()}

      {/* Active day timeline */}
      {plan.days_plan.filter(d => d.day === activeDay).map(day => (
        <motion.div key={day.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-2 relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-300 to-transparent" />
          {renderActivity(day.morning, <Sun className="h-4 w-4" />, LANG === 'tr' ? 'Sabah' : 'Morning')}
          {renderActivity(day.afternoon, <Sunset className="h-4 w-4" />, LANG === 'tr' ? 'Öğleden Sonra' : 'Afternoon')}
          {renderActivity(day.evening, <Moon className="h-4 w-4" />, LANG === 'tr' ? 'Akşam' : 'Evening')}
        </motion.div>
      ))}
    </div>
  );
}

function BudgetRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
      <span className="flex items-center gap-1.5 text-white/70">
        {icon}{label}
      </span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
