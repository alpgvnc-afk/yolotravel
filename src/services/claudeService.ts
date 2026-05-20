import { Destination, Hotel } from '../types';
import { LANG } from '../i18n';
import { withAffiliate } from './affiliate';

// Sosyal kanıt + aciliyet içeren satış metni üretir
function buildSalesCopy(h: any): string {
  const rating = h.review_score;
  const reviews = h.review_nr || 0;
  const free = h.is_free_cancellable === 1;
  const urgency = h.urgency_room_msg;

  if (LANG === 'tr') {
    let copy = '';
    if (rating >= 9) {
      copy += `🌟 Booking'de ${rating}/10 puan (${reviews.toLocaleString()} değerlendirme) — istisnai bir seçim. `;
    } else if (rating >= 8) {
      copy += `⭐ Booking'de ${rating}/10 puan (${reviews.toLocaleString()} misafir değerlendirmesi). `;
    } else if (rating) {
      copy += `Booking puanı ${rating}/10 (${reviews.toLocaleString()} değerlendirme). `;
    }
    if (urgency) {
      copy += `${urgency} `;
    } else if (rating >= 8) {
      copy += `Bu sezon hızla doluyor, müsaitlik için hemen kontrol et. `;
    }
    if (free) {
      copy += `Ücretsiz iptal var, riski sıfır.`;
    }
    return copy.trim();
  } else {
    let copy = '';
    if (rating >= 9) {
      copy += `🌟 Rated ${rating}/10 on Booking by ${reviews.toLocaleString()} guests — exceptional choice. `;
    } else if (rating >= 8) {
      copy += `⭐ ${rating}/10 on Booking (${reviews.toLocaleString()} reviews). `;
    } else if (rating) {
      copy += `Booking rating ${rating}/10 (${reviews.toLocaleString()} reviews). `;
    }
    if (urgency) {
      copy += `${urgency} `;
    } else if (rating >= 8) {
      copy += `Rooms are filling up fast this season — check availability now. `;
    }
    if (free) {
      copy += `Free cancellation, zero risk.`;
    }
    return copy.trim();
  }
}

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatTurnResult {
  type: 'question';
  text: string;
  options?: string[];
}

export interface RecommendationsResult {
  type: 'recommendations';
  intro: string;
  destinations: Destination[];
}

export type ClaudeResponse = ChatTurnResult | RecommendationsResult;

const SYSTEM_PROMPT = `Sen Yolo adlı bir seyahat planlama asistanısın. Türkçe konuşuyorsun, samimi ve enerjik bir dilin var.

Görevin: Kullanıcıyla sohbet ederek hayalindeki tatil için gerekli bilgileri topla, sonra 3 destinasyon öner. Öneriler verdikten sonra da kullanıcıyla konuşmaya devam et.

İlk turda sırasıyla topla (her seferinde TEK soru):

1. **Nerede yaşıyor / nereden uçacak** (Örn. "İstanbul'dan", "Ankara'dan") — bu hem uçuş mesafesi hem de pasaport ülkesi için önemli
2. **Aklında bir destinasyon var mı?** Eğer varsa direkt onunla devam et. Yoksa şu soruları sor:
   - **Yurt içi mi yurt dışı mı?** ("Sadece Türkiye", "Avrupa olur", "Uzak Doğu olur", "Fark etmez")
   - **Pasaport / vize durumu** ("Pasaportum var, vize istemiyorum" / "Vize alabilirim" / "Sadece vizesiz ülkeler")
3. **Kaç kişi gidecek**
4. **Ne zaman gitmek istiyor** (yaklaşık tarih veya ay)
5. **Bütçesi ne kadar** (kişi başı, hangi para biriminde olduğunu da öğren)
6. **Tatil tarzı** (dinlenme, macera, romantik, eğlence vb.)
7. **Özel ilgi alanları** (plaj, kültür, yemek, doğa vb.)

KRİTİK KURALLAR:
- Her mesajında SADECE TEK soru sor.
- Soruların kısa ve net olsun (1-2 cümle).
- "ask_question" tool'unu kullan, kullanıcıya 3-4 hızlı seçenek sun. Seçenekler kısa olsun.
- Kullanıcı serbest metin yazarsa (örn. "İstanbul'dan, pasaportum var, Avrupa olur") tüm bilgiyi al, sonraki konuya geç.
- Destinasyon önerirken kullanıcının kalkış noktasını, pasaport durumunu ve mesafe tercihini MUTLAKA dikkate al. Vizesiz isteyene Schengen önerme!
- Mevsim/tarihe uygun yer öner (kış ortasında plaj önerme, yaz ortasında Karayipler önerme).
- Bütçe gerçekçi olsun. 5000 TL ile Maldivler önerme.

ÖNEMLİ - DESTINATION ADLARı:
- recommend_destinations'da "name" alanına SADECE şehir adını yaz (örn. "Paris", "Antalya", "Bali", "Bodrum"). "Antalya & Bolu" gibi birleşik ad kullanma.
- "location" alanına ülke veya bölgeyi yaz (örn. "France", "Türkiye", "Indonesia").

ÖNERİLERDEN SONRA: Kullanıcı yorum/soru sorarsa "ask_question" ile cevap ver, sohbete devam et. "Başka öner", "bütçe değişti" gibi durumda tekrar "recommend_destinations" çağır.

- Fiyatları kullanıcının para biriminde ver (TL veya USD, sorduğunda öğren).
- matchReason kişiselleştirilmiş olsun — kullanıcının kalkış noktasına, bütçesine, tarzına referans versin.`;

const TOOLS = [
  {
    name: 'ask_question',
    description: 'Kullanıcıya bir soru sor ve isteğe bağlı olarak hızlı yanıt seçenekleri sun.',
    input_schema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Kullanıcıya sorulacak soru (Türkçe, kısa ve net).'
        },
        options: {
          type: 'array',
          items: { type: 'string' },
          description: '3-4 hızlı yanıt seçeneği (her biri kısa, 1-3 kelime). İsteğe bağlı.'
        }
      },
      required: ['question']
    }
  },
  {
    name: 'recommend_destinations',
    description: 'Yeterli bilgi toplandığında 3 destinasyon önerisi üret.',
    input_schema: {
      type: 'object',
      properties: {
        intro: {
          type: 'string',
          description: 'Önerilerden önce kısa bir giriş mesajı (Türkçe, 1 cümle).'
        },
        destinations: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Şehir/destinasyon adı' },
              location: { type: 'string', description: 'Ülke veya bölge' },
              price: { type: 'number', description: 'Kişi başı tahmini toplam fiyat (Türk Lirası)' },
              duration: { type: 'string', description: 'Önerilen süre, örn. "7 gece"' },
              description: { type: 'string', description: 'Destinasyon hakkında 1-2 cümle açıklama' },
              matchReason: { type: 'string', description: 'Bu destinasyonun neden kullanıcıya uygun olduğu — kullanıcının söylediklerine referans veren kişiselleştirilmiş açıklama (2-3 cümle)' },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Destinasyonun etiketleri, örn. ["Romantik", "Plaj"]'
              }
            },
            required: ['name', 'location', 'price', 'duration', 'description', 'matchReason', 'tags']
          }
        }
      },
      required: ['intro', 'destinations']
    }
  }
];

// Unsplash arka plan görselleri için keyword bazlı eşleştirme
const getImageForDestination = (name: string, tags: string[]): string => {
  const query = encodeURIComponent(`${name} travel`);
  return `https://source.unsplash.com/800x600/?${query}`;
};

export async function callClaude(conversation: ClaudeMessage[]): Promise<ClaudeResponse> {
  if (!API_KEY) {
    throw new Error('VITE_CLAUDE_API_KEY tanımlı değil. .env dosyasını kontrol edin.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      tool_choice: { type: 'any' },
      messages: conversation
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API hatası (${response.status}): ${errText}`);
  }

  const data = await response.json();

  // Tool use bloğunu bul
  const toolUse = data.content?.find((block: any) => block.type === 'tool_use');

  if (!toolUse) {
    // Fallback: text varsa onu soru olarak göster
    const textBlock = data.content?.find((block: any) => block.type === 'text');
    return {
      type: 'question',
      text: textBlock?.text ?? 'Bana biraz daha bilgi verir misin?'
    };
  }

  if (toolUse.name === 'ask_question') {
    return {
      type: 'question',
      text: toolUse.input.question,
      options: toolUse.input.options
    };
  }

  if (toolUse.name === 'recommend_destinations') {
    const destinations: Destination[] = toolUse.input.destinations.map((d: any, i: number) => ({
      id: `claude-${Date.now()}-${i}`,
      name: d.name,
      location: d.location,
      price: d.price,
      duration: d.duration,
      rating: 4.5 + Math.random() * 0.4,
      reviews: Math.floor(100 + Math.random() * 400),
      image: getImageForDestination(d.name, d.tags),
      description: d.description,
      tags: d.tags,
      matchReason: d.matchReason
    }));

    return {
      type: 'recommendations',
      intro: toolUse.input.intro,
      destinations
    };
  }

  throw new Error(`Bilinmeyen tool: ${toolUse.name}`);
}

// ============ GERÇEK OTEL ARAMA (Booking.com via RapidAPI) ============

// Lokal geliştirmede Vite proxy ile API'ye gider, prod'da aynı domain
const API_BASE = ''; // boş = aynı origin

export async function fetchHotels(destination: Destination, userBudget?: string): Promise<Hotel[]> {
  // Adın temizlenmiş versiyonları — Booking'in bulabilmesi için
  // "Abant Gölü & Bolu" → ["Abant Gölü & Bolu", "Abant Gölü", "Bolu", "Abant"]
  const rawName = destination.name;
  const variants = new Set<string>();
  variants.add(rawName);
  // Ayraçlardan böl: , & / | -
  rawName.split(/[,&/|]/).forEach(part => {
    const cleaned = part.trim();
    if (cleaned) variants.add(cleaned);
  });
  // Parantez içini at
  variants.add(rawName.split('(')[0].trim());
  // İlk kelime (en geniş arama)
  const firstWord = rawName.split(/[\s,&/|]/)[0].trim();
  if (firstWord) variants.add(firstWord);

  let city: any = null;
  for (const variant of Array.from(variants)) {
    if (!variant) continue;
    try {
      const locRes = await fetch(`${API_BASE}/api/hotels-locations?name=${encodeURIComponent(variant)}`);
      if (!locRes.ok) continue;
      const locData = await locRes.json();
      city = (locData.locations || []).find((l: any) => l.dest_type === 'city') || locData.locations?.[0];
      if (city) break;
    } catch {
      continue;
    }
  }

  if (!city) {
    throw new Error(`"${destination.name}" için lokasyon bulunamadı. Lütfen başka bir destinasyon deneyin.`);
  }

  // 2. Tarihler — 30 gün sonra için 7 gece (default)
  const today = new Date();
  const checkin = new Date(today);
  checkin.setDate(today.getDate() + 30);
  const checkout = new Date(checkin);
  checkout.setDate(checkin.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  // 3. Otelleri ara (dile göre para birimi)
  const searchParams = new URLSearchParams({
    dest_id: String(city.dest_id),
    dest_type: city.dest_type,
    checkin_date: fmt(checkin),
    checkout_date: fmt(checkout),
    adults_number: '2',
    room_number: '1',
    currency: LANG === 'tr' ? 'TRY' : 'USD',
    order_by: 'popularity'
  });

  const hotelRes = await fetch(`${API_BASE}/api/hotels-search?${searchParams.toString()}`);
  if (!hotelRes.ok) {
    throw new Error(`Otel araması başarısız (${hotelRes.status})`);
  }
  const hotelData = await hotelRes.json();

  // 4. Hotel tipine map et (3 nokta atışı öneri)
  const hotels: Hotel[] = (hotelData.hotels || []).slice(0, 3).map((h: any) => {
    const totalNights = 7;
    const pricePerNight = h.price_per_night || (h.price_total / totalNights);
    const currency = h.currency || 'USD';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'TRY' ? '₺' : currency + ' ';

    return {
      id: `hotel-${h.hotel_id}`,
      name: h.name,
      stars: h.stars || 3,
      rating: h.review_score || 0,
      pricePerNight: Math.round(pricePerNight),
      image: h.image,
      description: `${h.type || 'Hotel'} • ${h.district || h.city} • ${h.distance_to_center || ''}`,
      amenities: [
        h.free_cancellation ? 'Ücretsiz iptal' : null,
        h.breakfast_included ? 'Kahvaltı dahil' : null,
        h.review_score_word,
        h.distance_to_center ? `Merkeze ${h.distance_to_center}` : null
      ].filter(Boolean) as string[],
      matchReason: buildSalesCopy(h),
      bookingUrl: withAffiliate(h.booking_url),
      currency,
      currencySymbol
    } as Hotel & { currency: string; currencySymbol: string };
  });

  if (hotels.length === 0) {
    throw new Error('Bu kriterler için otel bulunamadı.');
  }

  return hotels;
}

// ============ DESTINATION RECOMMENDATIONS (yeni - sabit cevaplara göre) ============

const RECOMMEND_TOOL = {
  name: 'recommend_destinations',
  description: '3 destinasyon öner.',
  input_schema: {
    type: 'object',
    properties: {
      destinations: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'SADECE şehir adı (örn. "Antalya", "Paris", "Bali"). Birleşik veya ülke adı yazma.' },
            location: { type: 'string', description: 'Ülke veya bölge' },
            price: { type: 'number', description: 'Kişi başı tahmini toplam fiyat (TL)' },
            duration: { type: 'string', description: 'Önerilen süre, örn. "7 gece"' },
            description: { type: 'string', description: '1-2 cümle açıklama' },
            matchReason: { type: 'string', description: 'Kullanıcının cevaplarına neden uygun olduğu - kişiselleştirilmiş 2-3 cümle' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['name', 'location', 'price', 'duration', 'description', 'matchReason', 'tags']
        }
      }
    },
    required: ['destinations']
  }
};

export async function generateRecommendations(answers: Record<string, string>): Promise<Destination[]> {
  if (!API_KEY) {
    throw new Error('VITE_CLAUDE_API_KEY tanımlı değil.');
  }

  const userPrompt = LANG === 'tr'
    ? `Kullanıcı bilgileri:
- Kalkış: ${answers.origin || 'Belirtilmedi'}
- Yurt içi/dışı: ${answers.scope || 'Belirtilmedi'}
- Pasaport/vize: ${answers.visa || 'Belirtilmedi'}
- Kişi sayısı: ${answers.people || 'Belirtilmedi'}
- Tarih: ${answers.when || 'Belirtilmedi'}
- Bütçe (kişi başı): ${answers.budget || 'Belirtilmedi'}
- Tarz: ${answers.vibe || 'Belirtilmedi'}
- İlgi: ${answers.interests || 'Belirtilmedi'}

Bu kullanıcı için en uygun 3 destinasyon öner. Türkçe yaz. Fiyatları TL olarak ver.
- Vizesiz isteyene Schengen önerme
- Bütçeye uygun ol
- name alanına SADECE şehir adı yaz
- matchReason'da kullanıcı cevaplarına referans ver`
    : `User info:
- Departure: ${answers.origin || 'Not specified'}
- Domestic/International: ${answers.scope || 'Not specified'}
- Passport/visa: ${answers.visa || 'Not specified'}
- People: ${answers.people || 'Not specified'}
- When: ${answers.when || 'Not specified'}
- Budget (per person): ${answers.budget || 'Not specified'}
- Vibe: ${answers.vibe || 'Not specified'}
- Interests: ${answers.interests || 'Not specified'}

Suggest 3 best destinations for this user. Write in English. Give prices in USD.
- Don't suggest Schengen to someone wanting visa-free
- Match the budget
- Use ONLY city name in name field
- Reference user answers in matchReason`;

  const systemPrompt = LANG === 'tr'
    ? 'Sen Yolo seyahat asistanısın. Verilen kullanıcı bilgilerine göre 3 destinasyon öner. Türkçe ve gerçekçi ol.'
    : 'You are Yolo, a travel assistant. Suggest 3 destinations based on user info. English and realistic.';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      tools: [RECOMMEND_TOOL],
      tool_choice: { type: 'tool', name: 'recommend_destinations' },
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API hatası (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const toolUse = data.content?.find((b: any) => b.type === 'tool_use');
  if (!toolUse) throw new Error('Öneri alınamadı.');

  return toolUse.input.destinations.map((d: any, i: number) => ({
    id: `claude-${Date.now()}-${i}`,
    name: d.name,
    location: d.location,
    price: d.price,
    duration: d.duration,
    rating: 4.5 + Math.random() * 0.4,
    reviews: Math.floor(100 + Math.random() * 400),
    image: `https://picsum.photos/seed/${encodeURIComponent(d.name.toLowerCase().replace(/\s+/g, '-'))}/1200/750`,
    description: d.description,
    tags: d.tags,
    matchReason: d.matchReason
  }));
}

// ============ ITINERARY GENERATION ============

const ITINERARY_TOOL = {
  name: 'generate_itinerary',
  description: 'Generate a day-by-day travel itinerary.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: '1-2 sentence overview of the trip' },
      recommendedHotelArea: { type: 'string', description: 'Best neighborhood to stay (e.g. "Le Marais")' },
      tips: {
        type: 'array',
        items: { type: 'string' },
        description: '3-4 short practical tips (transportation, money, culture)'
      },
      days_plan: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day: { type: 'number' },
            morning: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'e.g. "Eiffel Tower & Trocadéro"' },
                description: { type: 'string', description: '1-2 sentences' },
                type: { type: 'string', enum: ['sight', 'food', 'activity', 'transport', 'rest'] },
                duration: { type: 'string', description: 'e.g. "2 hours"' },
                cost: { type: 'number', description: 'Estimated USD' },
                lat: { type: 'number', description: 'Latitude of the place (e.g. 48.8584)' },
                lng: { type: 'number', description: 'Longitude of the place (e.g. 2.2945)' }
              },
              required: ['title', 'description', 'type', 'lat', 'lng']
            },
            afternoon: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['sight', 'food', 'activity', 'transport', 'rest'] },
                duration: { type: 'string' },
                cost: { type: 'number' },
                lat: { type: 'number' },
                lng: { type: 'number' }
              },
              required: ['title', 'description', 'type', 'lat', 'lng']
            },
            evening: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['sight', 'food', 'activity', 'transport', 'rest'] },
                duration: { type: 'string' },
                cost: { type: 'number' },
                lat: { type: 'number' },
                lng: { type: 'number' }
              },
              required: ['title', 'description', 'type', 'lat', 'lng']
            }
          },
          required: ['day', 'morning', 'afternoon', 'evening']
        }
      }
    },
    required: ['summary', 'recommendedHotelArea', 'tips', 'days_plan']
  }
};

export async function generateItinerary(params: {
  city: string;
  country: string;
  days: number;
  vibe: string;
  budget: number;
  interests?: string;
  variantSeed?: number;
  userPreferences?: import('../types').UserPreferences;
}): Promise<import('../types').TripPlan> {
  if (!API_KEY) throw new Error('VITE_CLAUDE_API_KEY missing.');

  const variantHint = params.variantSeed && params.variantSeed > 0
    ? (LANG === 'tr'
        ? `\n\nÖNEMLİ: Bu kullanıcı önceki planı beğenmedi, BAŞKA bir plan öner. Farklı mekanlar, farklı yemekler, farklı rotalar. Yaratıcı ol. (varyant: ${params.variantSeed})`
        : `\n\nIMPORTANT: User didn't like the previous plan, suggest a DIFFERENT one. Different places, different food, different routes. Be creative. (variant: ${params.variantSeed})`)
    : '';

  // Kullanıcı tercihlerini context olarak ekle
  let prefsContext = '';
  const p = params.userPreferences;
  if (p && Object.keys(p).length > 0) {
    const lines: string[] = [];
    if (p.homeCity) lines.push(LANG === 'tr' ? `Yaşadığı şehir: ${p.homeCity}` : `Lives in: ${p.homeCity}`);
    if (p.travelStyle) lines.push(LANG === 'tr' ? `Seyahat stili: ${p.travelStyle}` : `Travel style: ${p.travelStyle}`);
    if (p.groupType) lines.push(LANG === 'tr' ? `Genelde şöyle gezer: ${p.groupType}` : `Usually travels: ${p.groupType}`);
    if (p.hasKids) lines.push(LANG === 'tr' ? `Çocuklu` : `Travels with kids`);
    if (p.interests && p.interests.length) lines.push(LANG === 'tr' ? `İlgi alanları: ${p.interests.join(', ')}` : `Interests: ${p.interests.join(', ')}`);
    if (p.defaultBudgetUSD) lines.push(LANG === 'tr' ? `Tipik bütçesi (kişi başı USD): ${p.defaultBudgetUSD}` : `Typical budget (per person USD): ${p.defaultBudgetUSD}`);

    if (lines.length > 0) {
      prefsContext = LANG === 'tr'
        ? `\n\n--- KULLANICI HAKKINDA ---\n${lines.join('\n')}\n\nBu kullanıcıyı tanıyorsun. Bu tercihleri planında dikkate al ve ona seslen.`
        : `\n\n--- ABOUT THE USER ---\n${lines.join('\n')}\n\nYou know this user. Use these preferences in your plan and address them personally.`;
    }
  }

  const userPrompt = LANG === 'tr'
    ? `Şehir: ${params.city}, ${params.country}
Gün sayısı: ${params.days}
Tarz: ${params.vibe}
Bütçe (USD): ${params.budget}
İlgi: ${params.interests || 'Genel'}

Bu kullanıcı için günlük detaylı bir itinerary hazırla. Her gün için sabah/öğle/akşam aktiviteleri olsun.
Türkçe yaz. Gerçek mekan adları kullan (örn. "Eiffel Kulesi", "Louvre Müzesi"). Tahminî maliyetleri USD olarak ver.
Yemek yerleri için gerçek restoran isimleri kullan. Sabah genelde turistik, öğle yemek, akşam aktivite veya yemek.
ÇOK ÖNEMLİ: Her aktivite için GERÇEK lat/lng koordinatları ver. Hayali koordinat verme. Mekanı tam olarak bildiğinden emin ol.${variantHint}${prefsContext}`
    : `City: ${params.city}, ${params.country}
Days: ${params.days}
Vibe: ${params.vibe}
Budget (USD): ${params.budget}
Interests: ${params.interests || 'General'}

Generate a detailed daily itinerary. Each day must have morning/afternoon/evening activities.
Write in English. Use real place names (e.g. "Eiffel Tower", "Louvre Museum"). Give estimated costs in USD.
For meals use real restaurant names where possible. Morning = sightseeing, afternoon = food + activity, evening = activity or dinner.
CRITICAL: Provide REAL lat/lng coordinates for every activity. Don't make up coordinates. Make sure you know the exact place.${variantHint}${prefsContext}`;

  const systemPrompt = LANG === 'tr'
    ? 'Sen deneyimli bir seyahat planlayıcısın. Verilen şehir için gün gün detaylı itinerary hazırlarsın. Gerçek mekan adları, gerçek fiyatlar.'
    : 'You are an expert travel planner. Generate detailed day-by-day itineraries with real place names and realistic prices.';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools: [ITINERARY_TOOL],
      tool_choice: { type: 'tool', name: 'generate_itinerary' },
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Itinerary API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const toolUse = data.content?.find((b: any) => b.type === 'tool_use');
  if (!toolUse) throw new Error('Itinerary not generated.');

  const input = toolUse.input;
  const totalCost = (input.days_plan || []).reduce((sum: number, day: any) => {
    return sum + (day.morning?.cost || 0) + (day.afternoon?.cost || 0) + (day.evening?.cost || 0);
  }, 0);

  return {
    city: params.city,
    country: params.country,
    days: params.days,
    estimatedCost: totalCost || params.budget,
    summary: input.summary,
    recommendedHotelArea: input.recommendedHotelArea,
    tips: input.tips || [],
    days_plan: input.days_plan || []
  };
}

/* ── Plan-editor: ask Claude for alternative spots ──────────────────────── */

export interface AlternativeSpot {
  name: string;
  description: string;
  type: 'sight' | 'food' | 'activity' | 'transport' | 'rest';
  duration?: string;
}

const ALTERNATIVES_TOOL = {
  name: 'suggest_alternatives',
  description: 'Return 3 alternative places for a spot in a travel itinerary.',
  input_schema: {
    type: 'object',
    properties: {
      alternatives: {
        type: 'array',
        description: 'Exactly 3 alternative places.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Real, existing place name.' },
            description: { type: 'string', description: 'One short sentence on why it fits.' },
            type: { type: 'string', enum: ['sight', 'food', 'activity', 'transport', 'rest'] },
            duration: { type: 'string', description: 'e.g. "1 hour", "lunch" (optional).' }
          },
          required: ['name', 'description', 'type']
        }
      }
    },
    required: ['alternatives']
  }
};

/**
 * Ask Claude for 3 alternatives to a given spot, in the plan's vibe.
 * Used by the "Ask AI for alternative" action in the Plan Editor.
 */
export async function askForAlternative(params: {
  city: string;
  vibe: string;
  day: number;
  category: string;     // spot type/role, e.g. "food", "sight"
  currentSpot: string;  // name of the spot being replaced
}): Promise<AlternativeSpot[]> {
  if (!API_KEY) throw new Error('VITE_CLAUDE_API_KEY missing.');

  const userPrompt = LANG === 'tr'
    ? `${params.city} şehrinde, Gün ${params.day} için "${params.currentSpot}" yerine 3 alternatif öner. Kategori: ${params.category}. Tarz: ${params.vibe}. Sadece gerçek, var olan mekan adları kullan. Her biri için tek cümlelik kısa açıklama yaz.`
    : `Suggest 3 alternatives for "${params.currentSpot}" on Day ${params.day} in ${params.city}. Category: ${params.category}. Vibe: ${params.vibe}. Use only real, existing place names. One short sentence each.`;

  const systemPrompt = LANG === 'tr'
    ? 'Sen deneyimli bir yerel seyahat rehberisin. Gerçek mekan adları önerirsin.'
    : 'You are an expert local travel guide. You suggest real, specific places.';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [ALTERNATIVES_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_alternatives' },
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Alternatives API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const toolUse = data.content?.find((b: any) => b.type === 'tool_use');
  if (!toolUse) throw new Error('No alternatives generated.');
  const alts = (toolUse.input?.alternatives || []) as AlternativeSpot[];
  return alts.slice(0, 3);
}
