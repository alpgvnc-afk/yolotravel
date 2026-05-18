import { Briefcase, Plane, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface MyTripsScreenProps {
  onStartPlanning: () => void;
}

export default function MyTripsScreen({ onStartPlanning }: MyTripsScreenProps) {
  // Placeholder örnek seyahatler
  const upcomingTrips = [
    {
      id: '1',
      destination: 'Santorini, Yunanistan',
      dates: '15 - 22 Haziran 2026',
      status: 'Onaylandı',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5fe?q=80&w=800&auto=format&fit=crop'
    }
  ];

  return (
    <div className="h-screen overflow-y-auto bg-white pb-32">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-black tracking-tight mb-2">Seyahatlerim</h1>
        <p className="text-gray-500 mb-8">Planlanmış ve geçmiş tatillerini buradan takip et.</p>

        {/* Upcoming */}
        <h2 className="text-lg font-bold text-black mb-4">Yaklaşan</h2>
        {upcomingTrips.length > 0 ? (
          <div className="space-y-4">
            {upcomingTrips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100">
                  <img src={trip.image} alt={trip.destination} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-black flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      {trip.destination}
                    </h3>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      {trip.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {trip.dates}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Plane className="h-10 w-10 text-amber-500" />
            </div>
            <p className="text-gray-500 mb-6">Henüz planlanmış bir tatilin yok.</p>
            <button
              onClick={onStartPlanning}
              className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-black active:scale-95 transition-transform"
            >
              Hemen Planla
            </button>
          </div>
        )}

        {/* Past trips */}
        <h2 className="text-lg font-bold text-black mt-10 mb-4">Geçmiş</h2>
        <div className="rounded-2xl bg-gray-50 p-8 text-center">
          <Briefcase className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Geçmiş seyahat kaydın yok.</p>
        </div>
      </div>
    </div>
  );
}
