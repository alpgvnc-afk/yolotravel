import { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Layers, Check, Square } from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { TripPlan } from '../types';
import { getDaySpots } from '../utils/planSpots';
import { buildShareUrl } from '../services/plansService';
import ShareCardPage, { themeFor, CARD_W, CARD_H, DaySpotSummary } from './ShareCardPage';
import ShareSocialBar from './ShareSocialBar';
import { LANG } from '../i18n';

export interface ShareCardProps {
  city: string;
  country: string;
  days: number;
  vibe: string;
  shareCode: string;
  places: { name: string; photoUrl: string }[];
  /** Full plan — enables the per-day pages. */
  plan?: TripPlan;
}

interface Page {
  key: string;
  label: string;
  kind: 'overview' | 'day';
  dayNumber?: number;
  spots?: DaySpotSummary[];
}

/**
 * Multi-page shareable card carousel.
 *   • Page 0  — cinematic overview (hero + bubbles + neon route + code)
 *   • Page N  — one per day (Strava-style schedule)
 * Pick which pages to share, flip through them, then export the visible page as
 * PNG (or all selected pages as a zip) and fire off to social.
 */
export default function ShareCard({ city, country, days, vibe, shareCode, places, plan }: ShareCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scale, setScale] = useState(0.32);
  const [current, setCurrent] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const theme = themeFor(vibe);
  const shareUrl = buildShareUrl(shareCode);

  const pages = useMemo<Page[]>(() => {
    const out: Page[] = [{
      key: 'overview',
      label: LANG === 'tr' ? 'Genel' : 'Overview',
      kind: 'overview',
    }];
    (plan?.days_plan || []).forEach(d => {
      const spots: DaySpotSummary[] = getDaySpots(d).map(s => ({
        time: s.time,
        title: s.title,
        type: s.type,
        rating: s.placeDetails?.rating ?? null,
        duration: s.duration,
        photoUrl: s.placeDetails?.photoUrl ?? null,
      }));
      out.push({
        key: `day-${d.day}`,
        label: `${LANG === 'tr' ? 'Gün' : 'Day'} ${d.day}`,
        kind: 'day',
        dayNumber: d.day,
        spots,
      });
    });
    return out;
  }, [plan]);

  const visiblePages = pickMode ? pages.filter(p => selected.has(p.key)) : pages;

  // keep `current` in range as the visible set changes
  useEffect(() => {
    if (current > visiblePages.length - 1) setCurrent(Math.max(0, visiblePages.length - 1));
  }, [visiblePages.length, current]);

  // responsive scale
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => { const w = el.clientWidth; if (w > 0) setScale(w / CARD_W); };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  const enablePick = (on: boolean) => {
    if (on && selected.size === 0) setSelected(new Set(pages.map(p => p.key)));
    setPickMode(on);
    setCurrent(0);
  };

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  };

  const exportNode = async (key: string): Promise<string | null> => {
    const node = nodeRefs.current[key];
    if (!node) return null;
    return toPng(node, {
      width: CARD_W, height: CARD_H, pixelRatio: 2, cacheBust: true,
      backgroundColor: theme.navyBottom, style: { transform: 'none', margin: '0' },
    });
  };

  const downloadCurrent = async () => {
    const page = visiblePages[current];
    if (!page) return;
    setDownloading(true);
    try {
      const dataUrl = await exportNode(page.key);
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.download = `yolo-${shareCode}-${page.key}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('[ShareCard] export failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadAll = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      for (const page of visiblePages) {
        const dataUrl = await exportNode(page.key);
        if (!dataUrl) continue;
        zip.file(`yolo-${shareCode}-${page.key}.png`, dataUrl.split(',')[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.download = `yolo-${shareCode}.png.zip`;
      a.href = URL.createObjectURL(blob);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) {
      console.error('[ShareCard] zip export failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const atFirst = current <= 0;
  const atLast = current >= visiblePages.length - 1;

  return (
    <div className="mx-6 mt-6">
      {/* heading + share-scope toggle */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: theme.titleFrom, boxShadow: `0 0 10px ${theme.glow}` }} />
          <h3 className="text-base font-bold text-white">{LANG === 'tr' ? 'Paylaşılabilir Kartlar' : 'Shareable Cards'}</h3>
        </div>
        {pages.length > 1 && (
          <div className="flex rounded-full border border-white/10 bg-[#141414] p-0.5 text-[11px] font-bold">
            <button
              onClick={() => enablePick(false)}
              className={`rounded-full px-3 py-1 transition ${!pickMode ? 'bg-amber-400 text-black' : 'text-white/60'}`}
            >
              {LANG === 'tr' ? 'Tümü' : 'All days'}
            </button>
            <button
              onClick={() => enablePick(true)}
              className={`rounded-full px-3 py-1 transition ${pickMode ? 'bg-amber-400 text-black' : 'text-white/60'}`}
            >
              {LANG === 'tr' ? 'Seç' : 'Pick days'}
            </button>
          </div>
        )}
      </div>

      {/* pick-days checkbox grid */}
      {pickMode && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {pages.map(p => {
            const on = selected.has(p.key);
            return (
              <button
                key={p.key}
                onClick={() => toggleSelect(p.key)}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                  on ? 'border-amber-400/50 bg-amber-400/10 text-white' : 'border-white/10 bg-[#141414] text-white/50'
                }`}
              >
                {on ? <Check className="h-3.5 w-3.5 text-amber-400" /> : <Square className="h-3.5 w-3.5" />}
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* page indicator + nav */}
      <div className="mb-2 flex items-center justify-center gap-3">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={atFirst}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-white/80 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {visiblePages.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setCurrent(i)}
              aria-label={p.label}
              className={`h-2 rounded-full transition-all ${i === current ? 'w-5 bg-amber-400' : 'w-2 bg-white/25'}`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrent(c => Math.min(visiblePages.length - 1, c + 1))}
          disabled={atLast}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#141414] text-white/80 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-2 text-center text-[11px] font-medium text-white/40">
        {visiblePages[current]?.label} · {current + 1}/{visiblePages.length}
      </div>

      {/* carousel — all visible pages mounted (so any can be exported), current on top */}
      <div ref={wrapRef} className="relative w-full overflow-hidden rounded-[28px] shadow-2xl" style={{ height: CARD_H * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
          <div style={{ position: 'relative', width: CARD_W, height: CARD_H }}>
            {visiblePages.map((p, i) => (
              <div
                key={p.key}
                style={{
                  position: 'absolute', inset: 0,
                  opacity: i === current ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                  pointerEvents: i === current ? 'auto' : 'none',
                  zIndex: i === current ? 2 : 1,
                }}
              >
                <ShareCardPage
                  kind={p.kind}
                  theme={theme}
                  city={city}
                  country={country}
                  vibe={vibe}
                  days={days}
                  shareCode={shareCode}
                  places={places}
                  dayNumber={p.dayNumber}
                  spots={p.spots}
                  onCopy={handleCopy}
                  copied={copied}
                  innerRef={(el) => { nodeRefs.current[p.key] = el; }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* social share bar */}
      <ShareSocialBar
        city={city}
        shareCode={shareCode}
        shareUrl={shareUrl}
        onDownloadPng={downloadCurrent}
        onDownloadAll={downloadAll}
        downloading={downloading}
        multiPage={visiblePages.length > 1}
      />

      <p className="mt-2 text-center text-[11px] text-neutral-500">
        {LANG === 'tr'
          ? 'Arkadaşların bu kodu girerek planını görebilir.'
          : 'Friends can view your plan by entering this code.'}
      </p>
    </div>
  );
}
