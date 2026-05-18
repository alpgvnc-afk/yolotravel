// Basit i18n: tarayıcı dili TR ise Türkçe, yoksa İngilizce default
// Para birimi: TR ise TRY, diğer hepsi USD

type Lang = 'en' | 'tr';

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('tr')) return 'tr';
  return 'en';
}

export const LANG: Lang = detectLang();
export const CURRENCY = LANG === 'tr' ? 'TRY' : 'USD';
export const CURRENCY_SYMBOL = LANG === 'tr' ? '₺' : '$';

// Çeviriler
const TRANSLATIONS = {
  en: {
    // Welcome
    welcomeTitle: 'Plan your dream trip with AI',
    welcomeSub: 'Talk to our AI assistant and discover destinations tailored just for you',
    getStarted: 'Get Started',

    // Explore
    helloUser: 'Hello',
    whereGo: 'Where do you want to go?',
    searchPlaceholder: 'Search city or country...',
    popularDestinations: 'Popular Destinations',
    locations: 'places',
    noResults: 'No results in this category.',
    planWithAI: 'Plan with AI',
    startingFrom: 'starting from',

    // Categories
    catAll: 'All',
    catBeach: 'Beach',
    catCity: 'City',
    catAdventure: 'Adventure',
    catRomantic: 'Romantic',
    catBudget: 'Budget',

    // Chat
    chatTitle: 'Yolo Chat',
    typeMessage: 'Type your answer or pick one above...',
    customAnswer: '✏️ Write my own',
    showRecommendations: 'View Recommendations',
    thinking: 'Preparing the best 3 destinations for you... 🔍',
    recommendationsReady: 'Here are my 3 picks for you! (Tap the button above 👇)',

    // Questions
    qOrigin: 'First, which city will you fly from?',
    qScope: 'Domestic or international?',
    qVisa: 'How is your passport / visa situation?',
    qPeople: 'How many people?',
    qWhen: 'When do you want to go?',
    qBudget: 'Budget per person (USD)?',
    qVibe: 'What\'s your vibe?',
    qInterests: 'Any special interests?',

    // Recommendations
    recTitle: 'Our top 3 picks for you',
    matchReason: 'Why it fits',
    viewHotels: 'View Hotels',
    continueChat: 'Back to chat',

    // Hotels
    hotelTitle: 'Hotel options',
    preparing: 'Preparing personalized hotels for you...',
    perNight: 'per night',
    detail: 'Details',
    openOnBooking: 'Open on Booking',

    // Errors
    errorGeneric: 'Something went wrong.',
    locationNotFound: 'Location not found for',
    noHotels: 'No hotels found for these criteria.'
  },
  tr: {
    welcomeTitle: 'AI ile hayalindeki tatili planla',
    welcomeSub: 'AI asistanımızla konuş, sana özel destinasyonları keşfet',
    getStarted: 'Başla',

    helloUser: 'Merhaba',
    whereGo: 'Nereye gitmek istersin?',
    searchPlaceholder: 'Şehir veya ülke ara...',
    popularDestinations: 'Popüler Destinasyonlar',
    locations: 'yer',
    noResults: 'Bu kategoride sonuç yok.',
    planWithAI: 'AI ile Planla',
    startingFrom: 'başlangıç',

    catAll: 'Hepsi',
    catBeach: 'Sahil',
    catCity: 'Şehir',
    catAdventure: 'Macera',
    catRomantic: 'Romantik',
    catBudget: 'Ekonomik',

    chatTitle: 'Yolo Chat',
    typeMessage: 'Cevabını yaz veya yukarıdan seç...',
    customAnswer: '✏️ Kendim yazayım',
    showRecommendations: 'Önerileri Görüntüle',
    thinking: 'Senin için en uygun 3 destinasyonu hazırlıyorum... 🔍',
    recommendationsReady: 'İşte senin için seçtiğim 3 öneri! (Yukarıdaki butona bas 👇)',

    qOrigin: 'Önce, hangi şehirden uçacaksın?',
    qScope: 'Yurt içi mi, yurt dışı mı?',
    qVisa: 'Pasaport / vize durumun?',
    qPeople: 'Kaç kişi?',
    qWhen: 'Ne zaman gitmek istiyorsun?',
    qBudget: 'Kişi başı bütçe (TL)?',
    qVibe: 'Tatil tarzın?',
    qInterests: 'Özel ilgi alanın?',

    recTitle: 'Senin için seçtiğimiz 3 rota',
    matchReason: 'Neden uygun',
    viewHotels: 'Otelleri Gör',
    continueChat: 'Sohbete devam',

    hotelTitle: 'Otel seçenekleri',
    preparing: 'Sana özel oteller hazırlanıyor...',
    perNight: 'gece başı',
    detail: 'Detay',
    openOnBooking: 'Booking\'de Aç',

    errorGeneric: 'Bir şeyler ters gitti.',
    locationNotFound: 'Lokasyon bulunamadı:',
    noHotels: 'Bu kriterler için otel bulunamadı.'
  }
};

export const t = (key: keyof typeof TRANSLATIONS.en): string => {
  return TRANSLATIONS[LANG][key] || TRANSLATIONS.en[key] || key;
};

// Common option arrays (translated)
export const CHAT_OPTIONS = LANG === 'tr' ? {
  origin: ['İstanbul', 'Ankara', 'İzmir', 'Başka şehir'],
  scope: ['Sadece Türkiye', 'Avrupa', 'Uzak Doğu', 'Fark etmez'],
  visa: ['Sadece vizesiz ülkeler', 'Vize alabilirim', 'Pasaportum yok', 'Sadece TR'],
  people: ['Tek başıma', '2 kişi', 'Ailemle', 'Arkadaşlarımla'],
  when: ['Bu ay', 'Önümüzdeki ay', 'Yaz', 'Net tarih gireyim'],
  budget: ['10.000 TL', '25.000 TL', '50.000 TL', '100.000+ TL'],
  vibe: ['Dinlenme', 'Macera', 'Romantik', 'Eğlence'],
  interests: ['Plaj', 'Kültür/tarih', 'Doğa', 'Yemek']
} : {
  origin: ['New York', 'London', 'Los Angeles', 'Other city'],
  scope: ['Domestic only', 'Europe', 'Asia', 'Anywhere'],
  visa: ['Visa-free only', 'I can get visa', 'No passport', 'Domestic only'],
  people: ['Solo', '2 people', 'Family', 'With friends'],
  when: ['This month', 'Next month', 'Summer', 'Specific date'],
  budget: ['$500', '$1500', '$3000', '$5000+'],
  vibe: ['Relax', 'Adventure', 'Romantic', 'Party'],
  interests: ['Beach', 'Culture/history', 'Nature', 'Food']
};
