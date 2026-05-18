import { Send, Mic, ArrowLeft, Settings, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Message, Destination } from '../types';
import { generateRecommendations } from '../services/claudeService';
import { t, CHAT_OPTIONS } from '../i18n';

interface ChatScreenProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  hasRecommendations: boolean;
  onBack: () => void;
  onRecommendations: (destinations: Destination[]) => void;
  onShowRecommendations: () => void;
}

const timestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface Question {
  key: string;
  textKey: 'qOrigin' | 'qScope' | 'qVisa' | 'qPeople' | 'qWhen' | 'qBudget' | 'qVibe' | 'qInterests';
  optionsKey: keyof typeof CHAT_OPTIONS;
}

const QUESTIONS: Question[] = [
  { key: 'origin', textKey: 'qOrigin', optionsKey: 'origin' },
  { key: 'scope', textKey: 'qScope', optionsKey: 'scope' },
  { key: 'visa', textKey: 'qVisa', optionsKey: 'visa' },
  { key: 'people', textKey: 'qPeople', optionsKey: 'people' },
  { key: 'when', textKey: 'qWhen', optionsKey: 'when' },
  { key: 'budget', textKey: 'qBudget', optionsKey: 'budget' },
  { key: 'vibe', textKey: 'qVibe', optionsKey: 'vibe' },
  { key: 'interests', textKey: 'qInterests', optionsKey: 'interests' }
];

export default function ChatScreen({
  messages,
  setMessages,
  answers,
  setAnswers,
  hasRecommendations,
  onBack,
  onRecommendations,
  onShowRecommendations
}: ChatScreenProps) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedOptions, setDismissedOptions] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(() => {
    // Hangi soruda olduğumuzu cevap sayısına göre çıkar
    return Object.keys(answers).length;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // İlk açılışta ilk soruyu ekle (eğer hiç mesaj yoksa)
  useEffect(() => {
    if (messages.length === 0 && step === 0) {
      const firstQ = QUESTIONS[0];
      setMessages([{
        id: 'q-0',
        text: `${t('welcomeTitle')} 🌍\n\n${t(firstQ.textKey)}`,
        sender: 'ai',
        timestamp: timestamp(),
        options: CHAT_OPTIONS[firstQ.optionsKey]
      }]);
    }
  }, []);

  const askNextQuestion = (currentStep: number) => {
    if (currentStep < QUESTIONS.length) {
      const q = QUESTIONS[currentStep];
      setMessages(prev => [...prev, {
        id: `q-${currentStep}`,
        text: t(q.textKey),
        sender: 'ai',
        timestamp: timestamp(),
        options: CHAT_OPTIONS[q.optionsKey]
      }]);
    } else {
      callClaudeForRecommendations();
    }
  };

  const callClaudeForRecommendations = async () => {
    setLoading(true);
    setError(null);
    setMessages(prev => [...prev, {
      id: `thinking-${Date.now()}`,
      text: t('thinking'),
      sender: 'ai',
      timestamp: timestamp()
    }]);

    try {
      const destinations = await generateRecommendations(answers);
      setMessages(prev => [...prev, {
        id: `done-${Date.now()}`,
        text: t('recommendationsReady'),
        sender: 'ai',
        timestamp: timestamp()
      }]);
      setTimeout(() => onRecommendations(destinations), 700);
    } catch (err: any) {
      setError(err?.message ?? t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    setInputValue('');
    setError(null);

    // Kullanıcı mesajını ekle
    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`,
      text: userText,
      sender: 'user',
      timestamp: timestamp()
    }]);

    // Şu anki sorunun cevabını kaydet
    if (step < QUESTIONS.length) {
      const currentKey = QUESTIONS[step].key;
      const newAnswers = { ...answers, [currentKey]: userText };
      setAnswers(newAnswers);
      const nextStep = step + 1;
      setStep(nextStep);

      // 500ms sonra bir sonraki soruyu sor (doğal his)
      setTimeout(() => askNextQuestion(nextStep), 500);
    } else {
      // Öneriler verildikten sonra ek konuşma — şimdilik sadece buton göster
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        text: 'Önerileri görmek için yukarıdaki "Önerileri Görüntüle" butonuna basabilirsin, ya da yeni bir arama yapmak istersen yeniden başlat.',
        sender: 'ai',
        timestamp: timestamp()
      }]);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 pt-12">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">{t('chatTitle')}</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-gray-100">
          <Settings className="h-6 w-6 text-black" />
        </button>
      </div>

      {hasRecommendations && (
        <button
          onClick={onShowRecommendations}
          className="mx-6 mt-4 flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3 text-sm font-bold text-black shadow-md active:scale-[0.98] transition-transform"
        >
          <MapPin className="h-4 w-4" />
          {t('showRecommendations')}
        </button>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 flex flex-col no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-amber-400 text-xs font-black">
                  YO<br />LO
                </div>
              )}
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className={`rounded-2xl px-4 py-3 text-base whitespace-pre-line ${
                  msg.sender === 'ai'
                    ? 'bg-gray-100 text-black rounded-tl-none'
                    : 'bg-blue-400 text-white rounded-tr-none'
                }`}>
                  {msg.text}
                </div>
                <span className={`text-[10px] text-gray-400 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp}
                </span>

                {msg.sender === 'ai' && msg.options && !loading && !dismissedOptions.has(msg.id) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSend(opt)}
                        className="rounded-xl border border-amber-400 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400/20 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setDismissedOptions(prev => new Set(prev).add(msg.id));
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      ✏️ {t('customAnswer').replace('✏️ ', '')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-amber-400 text-xs font-black">
                YO<br />LO
              </div>
              <div className="rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3">
                <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-center rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 max-w-[90%]">
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 pb-24 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 rounded-full bg-gray-50 border border-gray-200 px-4 py-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
            placeholder={t('typeMessage')}
            disabled={loading}
            className="flex-1 py-2 bg-transparent text-black outline-none placeholder:text-gray-400 disabled:opacity-50"
          />
          <Mic className="h-5 w-5 text-gray-400 cursor-pointer" />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={loading || !inputValue.trim()}
            className="flex h-10 w-10 items-center justify-center -mr-2 disabled:opacity-40"
          >
            <Send className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
