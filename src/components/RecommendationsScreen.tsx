import { DESTINATIONS } from '../constants';
import { Destination } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { t, LANG } from '../i18n';

interface RecommendationsScreenProps {
  onBack: () => void;
  onSelect: (d: Destination) => void;
  onOpenChat: () => void;
  destinations?: Destination[] | null;
}

export default function RecommendationsScreen({
  onBack,
  onSelect,
  onOpenChat,
  destinations
}: RecommendationsScreenProps) {
  // Claude'dan gelen öneriler varsa onları, yoksa fallback
  const recommendations = destinations && destinations.length > 0
    ? destinations
    : DESTINATIONS.slice(0, 3);

  const isFromChat = destinations && destinations.length > 0;

  return (
    <div className="relative h-screen overflow-y-auto bg-[#0a0a0a] text-neutral-100 pb-32">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5">
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">{t('recTitle')}</h1>
        </div>

        <div className="grid gap-8">
          {recommendations.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="overflow-hidden rounded-3xl border border-white/5 bg-[#141414] shadow-xl shadow-black/40"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#0a0a0a]">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white">{dest.name}</h3>
                <p className="mt-1 text-lg font-medium text-neutral-400">
                  {LANG === 'tr' ? `Tahmini fiyat: ₺${dest.price.toLocaleString()}` : `Estimated: $${Math.round(dest.price / 35).toLocaleString()}`}
                </p>

                <div className="mt-4">
                  <p className="text-sm font-bold text-amber-400">{t('matchReason')}:</p>
                  <p className="mt-1 text-sm text-neutral-300 leading-relaxed">
                    {dest.matchReason}
                  </p>
                </div>

                <button
                  onClick={() => onSelect(dest)}
                  className="mt-6 w-full rounded-2xl bg-amber-400 py-4 text-lg font-bold text-black active:scale-[0.98] transition-transform glow-amber"
                >
                  {t('viewHotels')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sticky chat button — sadece chat'ten gelmişse göster */}
      {isFromChat && (
        <div className="sticky bottom-28 w-full flex justify-end pr-6 pointer-events-none -mt-12">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            onClick={onOpenChat}
            className="pointer-events-auto flex h-14 items-center gap-2 rounded-full bg-amber-400 px-5 text-black shadow-lg glow-amber-strong active:scale-95 transition-transform"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-bold">{t('continueChat')}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
