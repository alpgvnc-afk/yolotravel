import { useRef, useState } from 'react';
import { Download, Sparkles, MapPin, Calendar, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TripPlan, TripCard } from '../types';
import { LANG } from '../i18n';

interface ShareCardProps {
  card: TripCard;
  plan: TripPlan;
  planId: string;
}

/**
 * Premium, minimalist share card.
 * Renders the route summary, travel days, and the unique Plan ID — NO cost.
 * One button saves the card as a PNG; another copies the code.
 */
export default function ShareCard({ card, plan, planId }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: '#0a0a0a'
      });
      const link = document.createElement('a');
      link.download = `${planId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[ShareCard] could not export image', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(planId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard might be blocked — silently ignore */
    }
  };

  // Build the route summary string: "Day 1 · Sabah / Öğleden Sonra / Akşam"-style
  // but only highlight the headliners (first activity of each day).
  const routeSummary = plan.days_plan
    .map(d => d.morning.title)
    .filter(Boolean);

  return (
    <div className="mx-6 mt-6">
      {/* Section heading */}
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h3 className="text-base font-bold text-white">
          {LANG === 'tr' ? 'Planını Paylaş' : 'Share Your Plan'}
        </h3>
      </div>

      {/* THE CARD — this exact node is exported as PNG */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl p-7 text-white shadow-2xl"
        style={{
          background:
            'radial-gradient(circle at top right, #1f1f1f 0%, #0a0a0a 70%)'
        }}
      >
        {/* Top brand bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <span className="text-sm font-bold tracking-wide">Yolo</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            {LANG === 'tr' ? 'Seyahat Planı' : 'Travel Plan'}
          </span>
        </div>

        {/* Destination — route summary */}
        <div className="mt-8">
          <div className="flex items-center gap-2 text-xs font-medium text-white/60">
            <MapPin className="h-3.5 w-3.5" />
            <span>{card.countryFlag} {card.country}</span>
          </div>
          <h2 className="mt-2 text-4xl font-bold leading-tight tracking-tight">
            {card.city}
          </h2>
          <p className="mt-1 text-sm text-white/70">{card.title}</p>
        </div>

        {/* Route highlights — first activity of each day */}
        {routeSummary.length > 0 && (
          <div className="mt-6 space-y-1.5">
            {routeSummary.slice(0, 5).map((stop, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/85">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="leading-snug">{stop}</span>
              </div>
            ))}
          </div>
        )}

        {/* Days */}
        <div className="mt-7 flex items-center gap-2 text-sm font-medium text-white/80">
          <Calendar className="h-4 w-4 text-amber-400" />
          {card.days} {LANG === 'tr' ? 'gün seyahat' : 'travel days'}
        </div>

        {/* Divider */}
        <div className="mt-6 h-px w-full bg-white/10" />

        {/* Plan ID — the hero */}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              {LANG === 'tr' ? 'Plan Kodu' : 'Plan Code'}
            </div>
            <div className="mt-1 font-mono text-3xl font-bold tracking-tight text-amber-400">
              {planId}
            </div>
          </div>
          <div className="text-right text-[10px] uppercase tracking-wider text-white/40 leading-tight">
            {LANG === 'tr' ? 'yolotravel.app ile' : 'made with'}<br />
            {LANG === 'tr' ? 'oluşturuldu' : 'yolotravel.app'}
          </div>
        </div>
      </div>

      {/* Actions (outside the exported card) */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={handleCopy}
          className="rounded-2xl border border-white/10 bg-[#141414] py-3 text-sm font-bold text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:border-white/20"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied
            ? (LANG === 'tr' ? 'Kopyalandı' : 'Copied')
            : (LANG === 'tr' ? 'Kodu Kopyala' : 'Copy Code')}
        </button>
        <button
          onClick={handleSaveImage}
          disabled={saving}
          className="rounded-2xl bg-amber-400 py-3 text-sm font-bold text-black glow-amber active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {saving
            ? (LANG === 'tr' ? 'Kaydediliyor…' : 'Saving…')
            : (LANG === 'tr' ? 'Görsel Olarak Kaydet' : 'Save as Image')}
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-neutral-500">
        {LANG === 'tr'
          ? 'Arkadaşların bu kodu girerek planını görebilir.'
          : 'Friends can view your plan by entering this code.'}
      </p>
    </div>
  );
}
