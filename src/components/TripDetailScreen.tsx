import { ArrowLeft, Star, Plane } from 'lucide-react';
import { Destination, Hotel } from '../types';
import { motion } from 'motion/react';

interface TripDetailScreenProps {
  destination: Destination;
  hotel: Hotel | null;
  onBack: () => void;
}

export default function TripDetailScreen({ destination, hotel, onBack }: TripDetailScreenProps) {
  // Hotel yoksa fallback
  const selectedHotel: Hotel = hotel ?? {
    id: 'default',
    name: 'Luxury Resort',
    stars: 5,
    rating: 5.0,
    pricePerNight: 1300,
    image: destination.image,
    description: 'Seçilen otel detayı.',
    amenities: ['Havuz', 'Plaj', 'Kahvaltı'],
    matchReason: 'Premium konaklama seçeneği.'
  };

  const flightPrice = 4500;
  const nightCount = 7;
  const totalPrice = flightPrice + selectedHotel.pricePerNight * nightCount;
  const bookingPrice = Math.round(totalPrice * 1.14);
  const expediaPrice = Math.round(totalPrice * 1.08);

  return (
    <div className="h-screen overflow-y-auto bg-white pb-32">
      {/* Hero Image */}
      <div className="relative h-80 w-full">
        <img 
          src={destination.image} 
          alt={destination.name} 
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-12 left-6 right-6 flex items-center justify-between">
          <button 
            id="detail-back-btn"
            onClick={onBack} 
            className="rounded-full bg-white/20 p-2 text-white backdrop-blur-md"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="rounded-2xl bg-white/40 px-4 py-2 backdrop-blur-md">
            <span className="text-lg font-bold text-white">Yolo</span>
          </div>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="relative z-10 -mt-8 flex-1 rounded-t-[40px] bg-white px-6 pt-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black">{destination.name}</h1>
          <p className="mt-2 text-lg text-gray-500">{destination.duration}</p>
          <p className="mt-2 text-xl font-bold text-black">Toplam Paket: ₺{totalPrice.toLocaleString()}</p>
        </div>

        {/* Flight Details */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-black mb-5">Uçuş Bilgileri</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <Plane className="h-6 w-6 text-red-500 rotate-45" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black">Turkish Airlines - Gidiş/Dönüş</span>
                <span className="font-bold text-black">₺{flightPrice.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-400">IST - {destination.name.slice(0, 3).toUpperCase()} | yaklaşık 4s</p>
            </div>
          </div>
        </div>

        {/* Hotel Details */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-black mb-5">Seçilen Otel</h2>
          <div className="rounded-3xl border border-gray-100 p-4 flex gap-4 shadow-sm">
            <img
              src={selectedHotel.image}
              className="h-20 w-20 rounded-2xl object-cover shrink-0"
              alt="hotel"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <h4 className="font-bold text-black">{selectedHotel.name}</h4>
              <div className="flex gap-0.5 mt-1">
                {[...Array(selectedHotel.stars)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-[10px] font-bold text-black ml-1">{selectedHotel.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{selectedHotel.description}</p>
              <p className="text-sm font-bold text-black mt-1">₺{selectedHotel.pricePerNight.toLocaleString()} / gece × {nightCount}</p>
            </div>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="mt-10 mb-8">
          <h2 className="text-xl font-bold text-black mb-5">Fiyat Karşılaştırma</h2>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-black">Yolo:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-black">₺{totalPrice.toLocaleString()}</span>
                  <span className="text-xs font-bold text-green-500">En uygun!</span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  className="h-full bg-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Booking.com:</span>
                <span className="text-sm font-bold text-black">₺{bookingPrice.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden text-gray-300">
                <div className="h-full bg-current w-[85%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Expedia:</span>
                <span className="text-sm font-bold text-black">₺{expediaPrice.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden text-gray-300">
                <div className="h-full bg-current w-[80%]" />
              </div>
            </div>
          </div>
        </div>

        <button
          id="book-now-final"
          className="w-full rounded-2xl bg-amber-400 py-5 text-xl font-bold text-black shadow-lg active:scale-[0.98] transition-transform"
        >
          Rezervasyon Yap
        </button>
      </div>
    </div>
  );
}
