import { useRef, useState, useEffect, CSSProperties } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { LANG } from '../i18n';

/**
 * Cinematic, luxury, shareable 9:16 story card.
 *
 *   ┌───────────────────────────┐
 *   │  HERO  (blurred landmark) │ 40%   gold dividers + serif title
 *   ├───────────────────────────┤
 *   │  NAVY  photo bubbles      │ 45%   real Places photos in circles
 *   │        neon route map     │       + abstract glowing route SVG
 *   ├───────────────────────────┤
 *   │  GLASS  YOLO CODE · COPY  │ 15%   backdrop-blur code pill
 *   └───────────────────────────┘
 *
 * Rendered at a fixed 1080×1920 (Instagram Story) and visually scaled to fit
 * its container.  "Download as image" exports the full-resolution node as PNG.
 * Theme colours switch on the `vibe` prop.
 */

export interface ShareCardProps {
  city: string;
  country: string;
  days: number;
  vibe: string;
  shareCode: string;
  /** Places API results — only the first 3 are used for bubbles / route. */
  places: { name: string; photoUrl: string }[];
}

/* ────────────────────────────────────────────────────────────── themes ── */

interface Theme {
  navyTop: string;     // middle-section gradient (top)
  navyBottom: string;  // middle-section gradient (bottom)
  heroTint: string;    // hero overlay base colour (rgb triplet)
  route: string;       // neon route stroke
  glow: string;        // route / pin glow (rgba)
  pin: string;         // pin fill
  bubbleRing: string;  // secondary accent on bubble borders (rgba)
  pill: string;        // glass-pill border (rgba)
  accent: string;      // small label accent text
  titleFrom: string;   // title gradient start
  titleTo: string;     // title gradient end
  snow?: boolean;      // render snow-particle overlay
}

const ADVENTUROUS: Theme = {
  navyTop: '#0a1428', navyBottom: '#0a0a0a',
  heroTint: '10, 20, 40',
  route: '#10b981', glow: 'rgba(16,185,129,0.75)', pin: '#10b981',
  bubbleRing: 'rgba(56,189,248,0.55)', pill: 'rgba(251,191,36,0.3)',
  accent: '#5eead4', titleFrom: '#fbbf24', titleTo: '#f59e0b',
};

const CHILL: Theme = {
  navyTop: '#2a1626', navyBottom: '#0a0a0a',
  heroTint: '42, 22, 38',
  route: '#fb923c', glow: 'rgba(249,168,212,0.7)', pin: '#fb923c',
  bubbleRing: 'rgba(249,168,212,0.55)', pill: 'rgba(249,168,212,0.35)',
  accent: '#fda4af', titleFrom: '#fde68a', titleTo: '#fb923c',
};

const WINTER: Theme = {
  navyTop: '#0c1a2e', navyBottom: '#06121f',
  heroTint: '12, 26, 46',
  route: '#7dd3fc', glow: 'rgba(186,230,253,0.85)', pin: '#7dd3fc',
  bubbleRing: 'rgba(224,242,254,0.65)', pill: 'rgba(186,230,253,0.35)',
  accent: '#bae6fd', titleFrom: '#e0f2fe', titleTo: '#7dd3fc',
  snow: true,
};

const ROMANTIC: Theme = {
  navyTop: '#2a0a16', navyBottom: '#0a0508',
  heroTint: '42, 10, 22',
  route: '#fb7185', glow: 'rgba(244,63,94,0.7)', pin: '#fb7185',
  bubbleRing: 'rgba(251,113,133,0.55)', pill: 'rgba(251,113,133,0.35)',
  accent: '#fda4af', titleFrom: '#fecdd3', titleTo: '#fb7185',
};

const FOODIE: Theme = {
  navyTop: '#2a1a08', navyBottom: '#0a0a0a',
  heroTint: '42, 26, 8',
  route: '#f59e0b', glow: 'rgba(251,191,36,0.7)', pin: '#f59e0b',
  bubbleRing: 'rgba(251,191,36,0.55)', pill: 'rgba(251,191,36,0.35)',
  accent: '#fcd34d', titleFrom: '#fbbf24', titleTo: '#f59e0b',
};

function themeFor(vibe: string): Theme {
  const v = (vibe || '').toLowerCase();
  if (/(romanti|romance|honeymoon|love|couple)/.test(v)) return ROMANTIC;
  if (/(food|foodie|culinary|gastro|cuisine|wine)/.test(v)) return FOODIE;
  if (/(winter|ski|snow|ice|alpine|arctic)/.test(v)) return WINTER;
  if (/(chill|relax|calm|zen|beach|leisure|slow)/.test(v)) return CHILL;
  return ADVENTUROUS; // adventurous / city / culture / budget / nature → default
}

/* ───────────────────────────────────────────────────────────── geometry ── */

const CARD_W = 1080;
const CARD_H = 1920;
const SERIF = '"Playfair Display", "Cormorant Garamond", Georgia, serif';

// route-map pin anchors (in the route SVG's 1080×320 viewBox)
const PIN_POS: { x: number; y: number }[] = [
  { x: 150, y: 215 },
  { x: 430, y: 95 },
  { x: 715, y: 220 },
  { x: 945, y: 100 },
];

// deterministic snow-flake field (winter theme only)
const SNOW = Array.from({ length: 46 }, (_, i) => {
  const a = ((i * 99173) % 1000) / 1000;
  const b = ((i * 56009) % 1000) / 1000;
  const c = ((i * 12347) % 1000) / 1000;
  return { left: a * 100, top: b * 100, r: 2 + c * 5, o: 0.25 + c * 0.5 };
});

const trim = (s: string, n = 18) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '');

/* ─────────────────────────────────────────────────────────── component ── */

export default function ShareCard({ city, country, days, vibe, shareCode, places }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const theme = themeFor(vibe);
  const trio = (places || []).filter(Boolean).slice(0, 3);
  const hero = (places || []).find(p => p && p.photoUrl)?.photoUrl || '';
  const pins = (places || []).slice(0, 4);

  // responsive scale: fit the fixed 1080-wide card into its container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / CARD_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSave = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: CARD_W,
        height: CARD_H,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: theme.navyBottom,
        style: { transform: 'none', margin: '0' },
      });
      const link = document.createElement('a');
      link.download = `yolo-${(city || 'trip').toLowerCase().replace(/\s+/g, '-')}-${shareCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[ShareCard] export failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked — fail silent */
    }
  };

  const goldText: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${theme.titleFrom} 0%, ${theme.titleTo} 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  };

  const goldDivider = (w: number): CSSProperties => ({
    width: w,
    height: 2,
    background: `linear-gradient(90deg, transparent, ${theme.titleFrom}, transparent)`,
    boxShadow: `0 0 12px ${theme.glow}`,
  });

  return (
    <div className="mx-6 mt-6">
      {/* section heading (not exported) */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: theme.titleFrom, boxShadow: `0 0 10px ${theme.glow}` }}
        />
        <h3 className="text-base font-bold text-white">
          {LANG === 'tr' ? 'Paylaşılabilir Kart' : 'Shareable Card'}
        </h3>
      </div>

      {/* responsive scaling wrapper — reserves the scaled height */}
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-[28px] shadow-2xl"
        style={{ height: CARD_H * scale }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {/* ===== THE EXPORTED NODE — fixed 1080×1920 ===== */}
          <div
            ref={cardRef}
            style={{
              position: 'relative',
              width: CARD_W,
              height: CARD_H,
              overflow: 'hidden',
              background: theme.navyBottom,
              fontFamily: SERIF,
            }}
          >
            {/* ───────────── TOP 40% — HERO ───────────── */}
            <div style={{ position: 'relative', width: '100%', height: '40%', overflow: 'hidden' }}>
              {/* fallback gradient sits behind the photo */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, ${theme.navyTop} 0%, ${theme.navyBottom} 100%)`,
                }}
              />
              {hero && (
                <img
                  src={hero}
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', filter: 'blur(3px) brightness(0.72) saturate(1.1)',
                    transform: 'scale(1.12)',
                  }}
                />
              )}
              {/* cinematic navy gradient overlay → blends into the middle */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background:
                    `linear-gradient(180deg, rgba(${theme.heroTint},0.45) 0%, rgba(${theme.heroTint},0.55) 45%, ${theme.navyTop} 100%)`,
                }}
              />

              {/* hero content */}
              <div
                style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 80px',
                }}
              >
                <div style={goldDivider(220)} />
                <div
                  style={{
                    marginTop: 34, fontSize: 30, letterSpacing: '0.42em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.82)', fontFamily: 'Inter, sans-serif', fontWeight: 600,
                    paddingLeft: '0.42em',
                  }}
                >
                  {country}
                </div>
                <h1
                  style={{
                    ...goldText, margin: '14px 0 0', fontSize: 132, fontWeight: 800, lineHeight: 1,
                    letterSpacing: '0.01em', textTransform: 'uppercase',
                  }}
                >
                  {city}
                </h1>
                <div
                  style={{
                    marginTop: 18, fontSize: 44, fontStyle: 'italic', fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)', letterSpacing: '0.02em',
                  }}
                >
                  {vibe} · {days} {LANG === 'tr' ? 'Gün' : 'Days'}
                </div>
                <div style={{ ...goldDivider(220), marginTop: 34 }} />
              </div>
            </div>

            {/* ───────────── MIDDLE 45% — BUBBLES + ROUTE ───────────── */}
            <div
              style={{
                position: 'relative', width: '100%', height: '45%',
                background: `linear-gradient(180deg, ${theme.navyTop} 0%, ${theme.navyBottom} 100%)`,
              }}
            >
              {/* photo bubbles */}
              <Bubble place={trio[0]} theme={theme} size={300} top={60} left={86} z={3} />
              <Bubble place={trio[1]} theme={theme} size={236} top={44} left={604} z={2} />
              <Bubble place={trio[2]} theme={theme} size={262} top={296} left={380} z={4} />

              {/* neon route map */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 360 }}>
                <RouteMap pins={pins} theme={theme} />
              </div>
            </div>

            {/* ───────────── BOTTOM 15% — GLASS CODE PILL ───────────── */}
            <div
              style={{
                position: 'relative', width: '100%', height: '15%',
                background: theme.navyBottom, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 24, width: 860, padding: '28px 36px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${theme.pill}`,
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: 22, letterSpacing: '0.3em', textTransform: 'uppercase',
                      color: theme.accent, fontFamily: 'Inter, sans-serif', fontWeight: 700,
                    }}
                  >
                    YOLO Code
                  </span>
                  <span
                    style={{
                      marginTop: 4, fontSize: 52, fontWeight: 700, color: '#fff',
                      letterSpacing: '0.1em', fontFamily: SERIF,
                    }}
                  >
                    {shareCode}
                  </span>
                </div>

                {/* COPY capsule (functional in-app) */}
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '20px 34px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700,
                    fontSize: 26, letterSpacing: '0.12em', cursor: 'pointer',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  {copied
                    ? <Check style={{ width: 28, height: 28, color: theme.route }} />
                    : <Copy style={{ width: 28, height: 28 }} />}
                  {copied ? (LANG === 'tr' ? 'KOPYALANDI' : 'COPIED') : 'COPY'}
                </button>
              </div>
            </div>

            {/* winter snow overlay (covers the whole card) */}
            {theme.snow && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {SNOW.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute', left: `${f.left}%`, top: `${f.top}%`,
                      width: f.r, height: f.r, borderRadius: '50%',
                      background: '#fff', opacity: f.o,
                      boxShadow: '0 0 6px rgba(255,255,255,0.8)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* actions (outside the exported card) */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141414] py-3 text-sm font-bold text-white transition-transform hover:border-white/20 active:scale-[0.98]"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied
            ? (LANG === 'tr' ? 'Kopyalandı' : 'Copied')
            : (LANG === 'tr' ? 'Kodu Kopyala' : 'Copy Code')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="glow-amber flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3 text-sm font-bold text-black transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {saving
            ? (LANG === 'tr' ? 'İndiriliyor…' : 'Saving…')
            : (LANG === 'tr' ? 'Görsel İndir' : 'Download Image')}
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

/* ──────────────────────────────────────────────────────── sub-components ── */

function Bubble({
  place, theme, size, top, left, z,
}: {
  place?: { name: string; photoUrl: string };
  theme: Theme;
  size: number; top: number; left: number; z: number;
}) {
  if (!place) return null;
  return (
    <div
      style={{
        position: 'absolute', top, left, width: size, height: size, zIndex: z,
        borderRadius: '50%', overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.4)',
        boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 0 6px rgba(255,255,255,0.04), 0 0 28px ${theme.bubbleRing}`,
        background: `linear-gradient(135deg, ${theme.navyTop}, ${theme.navyBottom})`,
      }}
    >
      {place.photoUrl && (
        <img
          src={place.photoUrl}
          alt={place.name}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

function RouteMap({
  pins, theme,
}: {
  pins: { name: string; photoUrl: string }[];
  theme: Theme;
}) {
  const path =
    'M 120 225 C 250 295, 320 120, 430 95 C 545 70, 600 240, 715 220 C 815 200, 860 115, 945 100';
  return (
    <svg viewBox="0 0 1080 320" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
      <defs>
        <filter id="yoloNeon" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="yoloTxt" x="-20%" y="-30%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.85" />
        </filter>
      </defs>

      {/* soft glow underlay + crisp route line */}
      <path
        d={path} fill="none" stroke={theme.route} strokeWidth={11}
        strokeLinecap="round" opacity={0.35} filter="url(#yoloNeon)"
      />
      <path
        d={path} fill="none" stroke={theme.route} strokeWidth={4}
        strokeLinecap="round" strokeDasharray="2 16" opacity={0.95}
      />

      {/* pins + labels */}
      {pins.map((p, i) => {
        const pos = PIN_POS[i];
        if (!pos) return null;
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r={13} fill={theme.pin} filter="url(#yoloNeon)" />
            <circle cx={pos.x} cy={pos.y} r={5} fill="#ffffff" />
            <text
              x={pos.x} y={pos.y - 30} textAnchor="middle"
              fontFamily={SERIF} fontSize={28} fontWeight={600}
              fill="#ffffff" filter="url(#yoloTxt)"
            >
              {trim(p.name, 16)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
