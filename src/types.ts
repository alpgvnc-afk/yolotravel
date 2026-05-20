export type Screen = 'welcome' | 'explore' | 'chat' | 'recommendations' | 'hotels' | 'detail' | 'my-trips' | 'profile' | 'itinerary' | 'shared';

export interface Destination {
  id: string;
  name: string;
  location: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  tags: string[];
  matchReason?: string;
}

// Anasayfada gösterilen hazır AI plan kartı
export interface TripCard {
  id: string;
  city: string;
  country: string;
  countryFlag: string;
  days: number;
  title: string;        // "3 Gün Romantik Plan"
  vibe: string;         // "Romantic", "Foodie", "Adventure"
  image: string;
  estimatedCost: number; // USD
  highlights: string[]; // ["Eiffel Tower at sunset", "Wine tasting in Marais"]
}

// Bir günün planı
export interface DayPlan {
  day: number;
  date?: string;
  morning: ActivityBlock;
  afternoon: ActivityBlock;
  evening: ActivityBlock;
  // When the user edits a plan we switch to a flexible, ordered list of spots.
  // Read paths fall back to morning/afternoon/evening when this is absent.
  spots?: ActivityBlock[];
  order?: number;
}

export interface UserPreferences {
  // Kullanıcı tarafından doldurulan tercihler (Profile sayfası)
  name?: string;
  homeCity?: string;          // "Istanbul", "London"
  travelStyle?: 'luxury' | 'midrange' | 'budget' | 'backpacker' | 'family';
  defaultBudgetUSD?: number;  // kişi başı tahmini
  groupType?: 'solo' | 'couple' | 'family' | 'friends';
  hasKids?: boolean;
  interests?: string[];       // ['food', 'culture', 'beach', 'adventure']
  language?: 'tr' | 'en';
  currency?: 'TRY' | 'USD';
}

// localStorage'da tutulan: son baktığı trip card
export interface RecentTrip {
  cardId: string;
  city: string;
  country: string;
  timestamp: number;
  image?: string;
}

export interface PlaceDetails {
  id?: string;
  name: string;
  address?: string;
  rating?: number | null;
  reviewCount?: number;
  priceLevel?: string | null;
  photoUrl?: string | null;
  googleMapsUrl?: string;
  summary?: string | null;
  types?: string[];
}

export interface ActivityBlock {
  id?: string;            // stable id for editor drag/drop & list keys
  time?: string;          // "09:30" — editable per-spot start time
  order?: number;         // explicit ordering within a day's spots
  title: string;
  description: string;
  type: 'sight' | 'food' | 'activity' | 'transport' | 'rest';
  duration?: string;
  cost?: number;
  bookingLink?: string;
  lat?: number;
  lng?: number;
  placeDetails?: PlaceDetails | null;
}

// Tam tatil planı (Claude'dan gelen)
export interface TripPlan {
  city: string;
  country: string;
  days: number;
  estimatedCost: number;
  summary: string;
  days_plan: DayPlan[];
  recommendedHotelArea: string; // "Stay in Le Marais"
  tips: string[];
  editedAt?: string;            // ISO timestamp set when a plan is edited & saved
}

export interface Hotel {
  id: string;
  name: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  image: string;
  description: string;
  amenities: string[];
  matchReason: string;
  bookingUrl?: string;
  currency?: string;
  currencySymbol?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: string;
  options?: string[];
}

export interface TripDetail {
  id: string;
  destination: Destination;
  flight: {
    airline: string;
    route: string;
    duration: string;
    price: number;
  };
  hotel: {
    name: string;
    stars: number;
    rating: number;
    pricePerNight: number;
    image: string;
  };
  priceComparison: {
    yolo: number;
    booking: number;
    expedia: number;
  };
}
