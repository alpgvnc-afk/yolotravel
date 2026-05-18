import { Destination } from './types';

export type Category = 'All' | 'Beach' | 'City' | 'Adventure' | 'Romantic' | 'Budget';
export const CATEGORIES: Category[] = ['All', 'Beach', 'City', 'Adventure', 'Romantic', 'Budget'];

// Picsum.photos seeded — her şehir için sabit ve garantili çalışan görsel.
// Format: https://picsum.photos/seed/{şehir}/1200/750
// Aynı seed her zaman aynı resmi döner.
const img = (seed: string) => `https://picsum.photos/seed/${seed}/1200/750`;

export const DESTINATIONS: Destination[] = [
  // BEACH
  { id: 'bali', name: 'Bali', location: 'Indonesia', price: 35000, duration: '7 nights', rating: 4.8, reviews: 250, image: img('bali-beach'), description: 'Tropikal cennet, sörf, pirinç tarlaları ve manevi atmosfer.', tags: ['Beach', 'Adventure'] },
  { id: 'maldives', name: 'Maldives', location: 'Maldives', price: 80000, duration: '5 nights', rating: 4.9, reviews: 500, image: img('maldives-ocean'), description: 'Su üstü bungalovlar ve berrak okyanus.', tags: ['Beach', 'Romantic'] },
  { id: 'antalya', name: 'Antalya', location: 'Türkiye', price: 12000, duration: '7 nights', rating: 4.6, reviews: 320, image: img('antalya-sea'), description: 'Akdeniz sahili, antik kentler ve all-inclusive resort cenneti.', tags: ['Beach', 'Budget'] },
  { id: 'phuket', name: 'Phuket', location: 'Thailand', price: 28000, duration: '7 nights', rating: 4.7, reviews: 410, image: img('phuket-island'), description: 'Tayland\'ın en popüler adası, plajlar ve gece hayatı.', tags: ['Beach', 'Adventure'] },
  { id: 'mykonos', name: 'Mykonos', location: 'Greece', price: 32000, duration: '5 nights', rating: 4.7, reviews: 280, image: img('mykonos-blue'), description: 'Beyaz evler, mavi kubbeler ve dünyaca ünlü beach club\'lar.', tags: ['Beach', 'Romantic'] },
  { id: 'santorini', name: 'Santorini', location: 'Greece', price: 35000, duration: '7 nights', rating: 4.8, reviews: 380, image: img('santorini-sunset'), description: 'Etkileyici gün batımları ve uçurum üstündeki tatlı kasabalar.', tags: ['Beach', 'Romantic'] },

  // CITY
  { id: 'tokyo', name: 'Tokyo', location: 'Japan', price: 50000, duration: '6 nights', rating: 4.9, reviews: 600, image: img('tokyo-night'), description: 'Geleneksel ve modern\'in mükemmel buluşması.', tags: ['City'] },
  { id: 'paris', name: 'Paris', location: 'France', price: 40000, duration: '5 nights', rating: 4.7, reviews: 720, image: img('paris-eiffel'), description: 'Aşk şehri, sanat, gastronomi ve mimari.', tags: ['City', 'Romantic'] },
  { id: 'rome', name: 'Rome', location: 'Italy', price: 32000, duration: '5 nights', rating: 4.6, reviews: 540, image: img('rome-colosseum'), description: 'Antik harabeler, lezzetli mutfak ve bitmeyen tarih.', tags: ['City'] },
  { id: 'barcelona', name: 'Barcelona', location: 'Spain', price: 30000, duration: '5 nights', rating: 4.7, reviews: 480, image: img('barcelona-gaudi'), description: 'Gaudi mimarisi, tapas ve canlı plaj kültürü.', tags: ['City', 'Beach'] },
  { id: 'newyork', name: 'New York', location: 'USA', price: 55000, duration: '5 nights', rating: 4.8, reviews: 890, image: img('newyork-skyline'), description: 'Hiç durmayan şehir, müzeler, Broadway ve sokak yemekleri.', tags: ['City'] },
  { id: 'istanbul', name: 'Istanbul', location: 'Türkiye', price: 8000, duration: '4 nights', rating: 4.7, reviews: 650, image: img('istanbul-bosphorus'), description: 'İki kıtanın buluştuğu efsane şehir, tarih ve gastronomi.', tags: ['City', 'Budget'] },

  // ADVENTURE
  { id: 'iceland', name: 'Reykjavik', location: 'Iceland', price: 60000, duration: '6 nights', rating: 4.8, reviews: 320, image: img('iceland-aurora'), description: 'Kuzey ışıkları, buzullar, şelaleler ve sıcak su kaynakları.', tags: ['Adventure'] },
  { id: 'kapadokya', name: 'Kapadokya', location: 'Türkiye', price: 10000, duration: '3 nights', rating: 4.8, reviews: 450, image: img('cappadocia-balloon'), description: 'Sıcak hava balonları, peri bacaları ve mağara otelleri.', tags: ['Adventure', 'Romantic'] },
  { id: 'nepal', name: 'Kathmandu', location: 'Nepal', price: 25000, duration: '10 nights', rating: 4.6, reviews: 220, image: img('nepal-himalaya'), description: 'Himalaya\'ların kapısı, trekking ve manevi keşif.', tags: ['Adventure', 'Budget'] },
  { id: 'swiss', name: 'Zermatt', location: 'Switzerland', price: 70000, duration: '5 nights', rating: 4.9, reviews: 380, image: img('swiss-alps'), description: 'Matterhorn manzarası, kayak ve dağ yürüyüşleri.', tags: ['Adventure'] },

  // ROMANTIC
  { id: 'venice', name: 'Venice', location: 'Italy', price: 35000, duration: '4 nights', rating: 4.7, reviews: 410, image: img('venice-gondola'), description: 'Gondollar, kanallar ve dünyanın en romantik şehirlerinden biri.', tags: ['Romantic', 'City'] },
  { id: 'prague', name: 'Prague', location: 'Czech Republic', price: 22000, duration: '4 nights', rating: 4.7, reviews: 390, image: img('prague-castle'), description: 'Masal şehri, tarihi köprüler ve uygun bira fiyatları.', tags: ['Romantic', 'Budget', 'City'] },

  // BUDGET
  { id: 'fethiye', name: 'Fethiye', location: 'Türkiye', price: 9000, duration: '5 nights', rating: 4.6, reviews: 280, image: img('fethiye-oludeniz'), description: 'Ölüdeniz, Kelebekler Vadisi ve yamaç paraşütü.', tags: ['Budget', 'Beach', 'Adventure'] },
  { id: 'lisbon', name: 'Lisbon', location: 'Portugal', price: 22000, duration: '5 nights', rating: 4.7, reviews: 410, image: img('lisbon-tram'), description: 'Renkli mahalleler, fado müziği ve uygun fiyatlar.', tags: ['Budget', 'City'] }
];

import { TripCard } from './types';

// Anasayfada gösterilen hazır AI Trip Cards
const tripImg = (seed: string) => `https://picsum.photos/seed/${seed}/1200/750`;

export const TRIP_CARDS: TripCard[] = [
  {
    id: 'paris-romantic',
    city: 'Paris',
    country: 'France',
    countryFlag: '🇫🇷',
    days: 3,
    title: '3 Day Romantic Escape',
    vibe: 'Romantic',
    image: tripImg('paris-eiffel-romance'),
    estimatedCost: 1200,
    highlights: ['Eiffel Tower at sunset', 'Seine river dinner cruise', 'Wine tasting in Le Marais']
  },
  {
    id: 'tokyo-discovery',
    city: 'Tokyo',
    country: 'Japan',
    countryFlag: '🇯🇵',
    days: 5,
    title: '5 Day Discovery Route',
    vibe: 'Adventure',
    image: tripImg('tokyo-shibuya'),
    estimatedCost: 2200,
    highlights: ['Shibuya crossing', 'Tsukiji food tour', 'Mt. Fuji day trip']
  },
  {
    id: 'bangkok-budget',
    city: 'Bangkok',
    country: 'Thailand',
    countryFlag: '🇹🇭',
    days: 5,
    title: 'Budget Traveler Guide',
    vibe: 'Budget',
    image: tripImg('bangkok-temple'),
    estimatedCost: 600,
    highlights: ['Street food markets', 'Grand Palace', 'Floating markets']
  },
  {
    id: 'rome-food',
    city: 'Rome',
    country: 'Italy',
    countryFlag: '🇮🇹',
    days: 4,
    title: 'Food & History Tour',
    vibe: 'Foodie',
    image: tripImg('rome-vatican'),
    estimatedCost: 1400,
    highlights: ['Colosseum tour', 'Pasta making class', 'Vatican Museums']
  },
  {
    id: 'bali-wellness',
    city: 'Bali',
    country: 'Indonesia',
    countryFlag: '🇮🇩',
    days: 7,
    title: 'Wellness & Beach Retreat',
    vibe: 'Relax',
    image: tripImg('bali-ricefields'),
    estimatedCost: 1100,
    highlights: ['Ubud yoga retreat', 'Surfing in Canggu', 'Tegalalang rice terraces']
  },
  {
    id: 'nyc-weekend',
    city: 'New York',
    country: 'USA',
    countryFlag: '🇺🇸',
    days: 3,
    title: '3 Day City Weekend',
    vibe: 'City',
    image: tripImg('nyc-times-square'),
    estimatedCost: 1800,
    highlights: ['Broadway show', 'Central Park bike tour', 'Brooklyn food scene']
  },
  {
    id: 'istanbul-culture',
    city: 'Istanbul',
    country: 'Türkiye',
    countryFlag: '🇹🇷',
    days: 4,
    title: 'Culture & Bosphorus',
    vibe: 'Culture',
    image: tripImg('istanbul-galata'),
    estimatedCost: 700,
    highlights: ['Hagia Sophia & Blue Mosque', 'Bosphorus dinner cruise', 'Grand Bazaar shopping']
  },
  {
    id: 'santorini-luxe',
    city: 'Santorini',
    country: 'Greece',
    countryFlag: '🇬🇷',
    days: 5,
    title: 'Aegean Luxury Escape',
    vibe: 'Romantic',
    image: tripImg('santorini-blue'),
    estimatedCost: 2500,
    highlights: ['Oia sunset', 'Caldera wine tour', 'Private catamaran trip']
  }
];
