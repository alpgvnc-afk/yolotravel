import { useState, ReactNode } from 'react';
import {
  Instagram, Twitter, Facebook, MessageCircle, Music2, Link2, Download, Check, Loader2, Images,
} from 'lucide-react';
import { LANG } from '../i18n';

interface ShareSocialBarProps {
  city: string;
  shareCode: string;
  shareUrl: string;
  onDownloadPng: () => void;
  onDownloadAll?: () => void;
  downloading?: boolean;
  multiPage?: boolean;
}

/**
 * Sticky social share bar shown under the ShareCard carousel.
 * Web platforms that don't expose a share API (Instagram, TikTok) fall back to
 * "download the PNG + copy the link" so the user can paste it into the app.
 */
export default function ShareSocialBar({
  city, shareCode, shareUrl, onDownloadPng, onDownloadAll, downloading, multiPage,
}: ShareSocialBarProps) {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const text = LANG === 'tr'
    ? `${city} gezimi YoloTravel'da planladım ✈️ Kod: ${shareCode}`
    : `Just planned my ${city} trip on YoloTravel ✈️ Code: ${shareCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  };

  const flash = (msg: string) => {
    setHint(msg);
    setTimeout(() => setHint(null), 2600);
  };

  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  // Instagram / TikTok have no web share intent → download + copy link, then nudge.
  const downloadAndCopy = async (label: string) => {
    onDownloadPng();
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* ignore */ }
    flash(LANG === 'tr'
      ? `Görsel indirildi + link kopyalandı. ${label}'da paylaş!`
      : `Image saved + link copied. Share it on ${label}!`);
  };

  const Btn = ({ icon, label, onClick, hover }: {
    icon: ReactNode; label: string; onClick: () => void; hover: string;
  }) => (
    <button onClick={onClick} className="group flex flex-shrink-0 flex-col items-center gap-1.5">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition-colors"
        style={{ ['--hc' as any]: hover }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = hover;
          (e.currentTarget as HTMLElement).style.borderColor = hover + '99';
          (e.currentTarget as HTMLElement).style.background = hover + '1a';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = '';
          (e.currentTarget as HTMLElement).style.borderColor = '';
          (e.currentTarget as HTMLElement).style.background = '';
        }}
      >
        {icon}
      </span>
      <span className="text-[10px] font-medium text-white/50">{label}</span>
    </button>
  );

  return (
    <div className="mt-4">
      {hint && (
        <div className="mb-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-center text-[11px] font-medium text-amber-200">
          {hint}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <Btn
            icon={<Instagram className="h-5 w-5" />} label="Instagram" hover="#E1306C"
            onClick={() => downloadAndCopy('Instagram')}
          />
          <Btn
            icon={<Twitter className="h-5 w-5" />} label="X" hover="#1d9bf0"
            onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`)}
          />
          <Btn
            icon={<Facebook className="h-5 w-5" />} label="Facebook" hover="#1877F2"
            onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
          />
          <Btn
            icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp" hover="#25D366"
            onClick={() => open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + shareUrl)}`)}
          />
          <Btn
            icon={<Music2 className="h-5 w-5" />} label="TikTok" hover="#fe2c55"
            onClick={() => downloadAndCopy('TikTok')}
          />
          <Btn
            icon={copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Link2 className="h-5 w-5" />}
            label={copied ? (LANG === 'tr' ? 'Kopyalandı' : 'Copied') : (LANG === 'tr' ? 'Link' : 'Copy Link')}
            hover="#fbbf24" onClick={copyLink}
          />
          <Btn
            icon={downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            label="PNG" hover="#fbbf24" onClick={onDownloadPng}
          />
          {multiPage && onDownloadAll && (
            <Btn
              icon={downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Images className="h-5 w-5" />}
              label={LANG === 'tr' ? 'Tümü (zip)' : 'All (zip)'} hover="#fbbf24" onClick={onDownloadAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}
