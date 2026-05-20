import { useEffect, useRef, useState, ReactNode } from 'react';
import { MoreVertical, Trash2, Repeat, Sparkles } from 'lucide-react';
import { LANG } from '../i18n';

interface SpotEditMenuProps {
  onRemove: () => void;
  onReplace: () => void;
  onAskAI: () => void;
}

/** Three-dot (⋮) menu shown on each spot card while editing. */
export default function SpotEditMenu({ onRemove, onReplace, onAskAI }: SpotEditMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const Item = ({ icon, label, onClick, danger }: {
    icon: ReactNode; label: string; onClick: () => void; danger?: boolean;
  }) => (
    <button
      onClick={() => { setOpen(false); onClick(); }}
      className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 active:bg-white/10 ${
        danger ? 'text-red-400' : 'text-white/90'
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Edit spot"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 active:scale-95 transition"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl shadow-black/60">
          <Item
            icon={<Repeat className="h-4 w-4 text-amber-300" />}
            label={LANG === 'tr' ? 'Yerine başka mekan…' : 'Replace with…'}
            onClick={onReplace}
          />
          <Item
            icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
            label={LANG === 'tr' ? 'AI alternatif öner' : 'Ask AI for alternative'}
            onClick={onAskAI}
          />
          <div className="h-px bg-white/10" />
          <Item
            icon={<Trash2 className="h-4 w-4 text-red-400" />}
            label={LANG === 'tr' ? 'Kaldır' : 'Remove'}
            onClick={onRemove}
            danger
          />
        </div>
      )}
    </div>
  );
}
