import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Check, Trash2 } from 'lucide-react';
import { UserPreferences } from '../types';
import { loadPreferences, savePreferences, clearPreferences, loadRecentTrips } from '../services/storage';
import { LANG } from '../i18n';

const TRAVEL_STYLES: { value: UserPreferences['travelStyle']; label: string; labelEn: string; emoji: string }[] = [
  { value: 'luxury', label: 'Lüks', labelEn: 'Luxury', emoji: '✨' },
  { value: 'midrange', label: 'Orta', labelEn: 'Midrange', emoji: '🏨' },
  { value: 'budget', label: 'Ekonomik', labelEn: 'Budget', emoji: '💰' },
  { value: 'backpacker', label: 'Sırt çantalı', labelEn: 'Backpacker', emoji: '🎒' },
  { value: 'family', label: 'Aile dostu', labelEn: 'Family', emoji: '👨‍👩‍👧' }
];

const GROUP_TYPES: { value: UserPreferences['groupType']; label: string; labelEn: string }[] = [
  { value: 'solo', label: 'Tek başıma', labelEn: 'Solo' },
  { value: 'couple', label: '2 kişi', labelEn: 'Couple' },
  { value: 'family', label: 'Ailem', labelEn: 'Family' },
  { value: 'friends', label: 'Arkadaşlarım', labelEn: 'Friends' }
];

const INTEREST_OPTIONS = LANG === 'tr'
  ? ['Plaj', 'Kültür', 'Yemek', 'Doğa', 'Macera', 'Gece hayatı', 'Alışveriş', 'Sanat', 'Spor']
  : ['Beach', 'Culture', 'Food', 'Nature', 'Adventure', 'Nightlife', 'Shopping', 'Art', 'Sports'];

export default function ProfileScreen() {
  const [prefs, setPrefs] = useState<UserPreferences>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const update = (patch: Partial<UserPreferences>) => {
    setPrefs(p => ({ ...p, ...patch }));
  };

  const handleSave = () => {
    savePreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = () => {
    if (confirm(LANG === 'tr' ? 'Tüm tercihler silinsin mi?' : 'Clear all preferences?')) {
      clearPreferences();
      setPrefs({});
    }
  };

  const toggleInterest = (interest: string) => {
    const current = prefs.interests || [];
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    update({ interests: updated });
  };

  const recentTrips = loadRecentTrips();

  return (
    <div className="h-screen overflow-y-auto bg-white pb-32">
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-black">
          {LANG === 'tr' ? 'Profil' : 'Profile'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {LANG === 'tr' ? 'Tercihlerini ekle, AI seni tanısın' : 'Add your preferences so AI knows you'}
        </p>
      </div>

      <div className="px-6 space-y-6">
        {/* Name */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
            {LANG === 'tr' ? 'Adın' : 'Name'}
          </label>
          <input
            type="text"
            value={prefs.name || ''}
            onChange={e => update({ name: e.target.value })}
            placeholder={LANG === 'tr' ? 'Alp' : 'Your name'}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-black outline-none focus:border-amber-400"
          />
        </div>

        {/* Home city */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
            {LANG === 'tr' ? 'Yaşadığın şehir' : 'Home city'}
          </label>
          <input
            type="text"
            value={prefs.homeCity || ''}
            onChange={e => update({ homeCity: e.target.value })}
            placeholder={LANG === 'tr' ? 'Ankara' : 'London'}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-black outline-none focus:border-amber-400"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            {LANG === 'tr' ? 'AI buradan uçuş mesafesini hesaplar' : 'AI uses this for flight distance'}
          </p>
        </div>

        {/* Travel style */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
            {LANG === 'tr' ? 'Seyahat tarzın' : 'Travel style'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TRAVEL_STYLES.map(style => (
              <button
                key={style.value}
                onClick={() => update({ travelStyle: style.value })}
                className={`rounded-2xl py-3 px-3 text-sm font-bold transition-all text-left ${
                  prefs.travelStyle === style.value
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-gray-50 border border-gray-100 text-gray-600'
                }`}
              >
                <span className="mr-2">{style.emoji}</span>
                {LANG === 'tr' ? style.label : style.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Group type */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
            {LANG === 'tr' ? 'Genelde nasıl gezersin?' : 'Usually travel as?'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GROUP_TYPES.map(g => (
              <button
                key={g.value}
                onClick={() => update({ groupType: g.value })}
                className={`rounded-2xl py-3 px-3 text-sm font-bold transition-all ${
                  prefs.groupType === g.value
                    ? 'bg-amber-400 text-black'
                    : 'bg-gray-50 border border-gray-100 text-gray-600'
                }`}
              >
                {LANG === 'tr' ? g.label : g.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Has kids */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.hasKids || false}
              onChange={e => update({ hasKids: e.target.checked })}
              className="h-5 w-5 rounded accent-amber-500"
            />
            <span className="text-sm text-black font-medium">
              {LANG === 'tr' ? 'Çocuklu seyahat ediyorum' : 'I travel with kids'}
            </span>
          </label>
        </div>

        {/* Interests */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
            {LANG === 'tr' ? 'İlgi alanların' : 'Your interests'}
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => {
              const active = (prefs.interests || []).includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-black text-amber-400'
                      : 'bg-gray-50 border border-gray-100 text-gray-600'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
            {LANG === 'tr' ? 'Tipik bütçen (kişi başı, USD)' : 'Typical budget (per person, USD)'}
          </label>
          <input
            type="number"
            value={prefs.defaultBudgetUSD || ''}
            onChange={e => update({ defaultBudgetUSD: parseInt(e.target.value) || undefined })}
            placeholder="1500"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-black outline-none focus:border-amber-400"
          />
        </div>

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">
              {LANG === 'tr' ? 'Son baktıkların' : 'Recent trips'}
            </h3>
            <div className="space-y-2">
              {recentTrips.map(trip => (
                <div key={trip.cardId} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-black">{trip.city}</div>
                    <div className="text-xs text-gray-500">{trip.country}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="sticky bottom-24 bg-white pt-4 pb-2">
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-4 text-base font-bold text-black shadow-xl"
          >
            {saved ? (
              <>
                <Check className="h-5 w-5" />
                {LANG === 'tr' ? 'Kaydedildi!' : 'Saved!'}
              </>
            ) : (
              LANG === 'tr' ? 'Tercihleri Kaydet' : 'Save Preferences'
            )}
          </motion.button>

          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 text-xs font-semibold text-red-600 opacity-70 hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {LANG === 'tr' ? 'Tüm verileri temizle' : 'Clear all data'}
          </button>
        </div>
      </div>
    </div>
  );
}
