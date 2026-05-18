import { motion } from 'motion/react';
import { t } from '../i18n';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: 'url("https://picsum.photos/seed/yolo-hero/2000/1200")' }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/20 to-black/60" />

      <div className="relative z-20 flex h-full flex-col items-center justify-end px-8 pb-20 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-bold tracking-tight text-white mb-4"
        >
          Yolo
        </motion.h1>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-bold text-white mb-4"
        >
          {t('welcomeTitle')}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/80 mb-12 max-w-xs"
        >
          {t('welcomeSub')}
        </motion.p>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onStart}
          className="w-full rounded-3xl bg-amber-400 py-5 text-xl font-bold text-black"
        >
          {t('getStarted')}
        </motion.button>
      </div>
    </div>
  );
}
