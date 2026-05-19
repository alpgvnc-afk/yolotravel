import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2, Link2, Copy, Check, MessageCircle, Twitter, Loader2
} from 'lucide-react';
import { buildShareUrl } from '../services/plansService';
import { LANG } from '../i18n';

interface ShareButtonProps {
  /** 6-char share_code; if null/undefined the button shows a spinner. */
  shareCode: string | null;
  /** City name used in the prefilled tweet / whatsapp text. */
  city: string;
  /** Show as a compact pill on dark hero overlays. */
  variant?: 'pill' | 'block';
}

/**
 * Floating Share button — opens a small menu with:
 *   - Copy share code
 *   - Copy link (origin/p/<code>)
 *   - Open on WhatsApp
 *   - Open on Twitter / X
 *
 * Lives at the top of the itinerary screen.
 */
export default function ShareButton({ shareCode, city, variant = 'pill' }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const url = shareCode ? buildShareUrl(shareCode) : '';
  const shareText =
    LANG === 'tr'
      ? `${city} için bir YoloTravel planı! 🌍✨\nKod: ${shareCode}\n${url}`
      : `Check out my YoloTravel plan for ${city}! 🌍✨\nCode: ${shareCode}\n${url}`;

  const handleCopy = async (kind: 'code' | 'url') => {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(kind === 'code' ? shareCode : url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard may be blocked — fail silent */
    }
  };

  const openWhatsApp = () => {
    if (!shareCode) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const openTwitter = () => {
    if (!shareCode) return;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const trigger =
    variant === 'pill' ? (
      <button
        onClick={() => setOpen(o => !o)}
        disabled={!shareCode}
        aria-label={LANG === 'tr' ? 'Planı Paylaş' : 'Share plan'}
        className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-2 shadow-lg active:scale-95 transition-transform disabled:opacity-50"
      >
        {shareCode ? (
          <>
            <Share2 className="h-4 w-4 text-black" />
            <span className="text-xs font-bold text-black">
              {LANG === 'tr' ? 'Paylaş' : 'Share'}
            </span>
          </>
        ) : (
          <Loader2 className="h-4 w-4 text-black animate-spin" />
        )}
      </button>
    ) : (
      <button
        onClick={() => setOpen(o => !o)}
        disabled={!shareCode}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-black active:scale-[0.98] transition-transform disabled:opacity-50"
      >
        {shareCode ? <Share2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
        {LANG === 'tr' ? 'Planı Paylaş' : 'Share Plan'}
      </button>
    );

  return (
    <div ref={ref} className="relative">
      {trigger}

      <AnimatePresence>
        {open && shareCode && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-[#141414] shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Code header */}
            <div className="border-b border-white/10 p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                {LANG === 'tr' ? 'Plan Kodu' : 'Plan Code'}
              </div>
              <div className="mt-0.5 font-mono text-lg font-bold tracking-wider text-amber-400">
                {shareCode}
              </div>
            </div>

            <ShareMenuItem
              icon={copied === 'code' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              label={copied === 'code'
                ? (LANG === 'tr' ? 'Kopyalandı!' : 'Copied!')
                : (LANG === 'tr' ? 'Kodu Kopyala' : 'Copy Code')}
              onClick={() => handleCopy('code')}
            />
            <ShareMenuItem
              icon={copied === 'url' ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
              label={copied === 'url'
                ? (LANG === 'tr' ? 'Link kopyalandı!' : 'Link copied!')
                : (LANG === 'tr' ? 'Linki Kopyala' : 'Copy Link')}
              onClick={() => handleCopy('url')}
            />
            <ShareMenuItem
              icon={<MessageCircle className="h-4 w-4 text-emerald-400" />}
              label="WhatsApp"
              onClick={openWhatsApp}
            />
            <ShareMenuItem
              icon={<Twitter className="h-4 w-4 text-sky-400" />}
              label="X / Twitter"
              onClick={openTwitter}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareMenuItem({
  icon, label, onClick
}: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/5 active:bg-white/10 transition-colors"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
        {icon}
      </span>
      {label}
    </button>
  );
}
