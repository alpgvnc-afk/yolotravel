import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen, Destination, Hotel, Message, TripCard } from './types';
import { normalizeShareCode } from './services/plansService';
import WelcomeScreen from './components/WelcomeScreen';
import ExploreScreen from './components/ExploreScreen';
import ChatScreen from './components/ChatScreen';
import RecommendationsScreen from './components/RecommendationsScreen';
import HotelsScreen from './components/HotelsScreen';
import ItineraryScreen from './components/ItineraryScreen';
import TripDetailScreen from './components/TripDetailScreen';
import MyTripsScreen from './components/MyTripsScreen';
import ProfileScreen from './components/ProfileScreen';
import SharedPlanScreen from './components/SharedPlanScreen';
import Navigation from './components/Navigation';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [aiDestinations, setAiDestinations] = useState<Destination[] | null>(null);
  const [selectedTripCard, setSelectedTripCard] = useState<TripCard | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Shared-plan viewer state — set when user enters a YOLO-XXXX code.
  const [sharedPlanId, setSharedPlanId] = useState<string | null>(null);

  const handleOpenSharedPlan = (planId: string) => {
    setSharedPlanId(planId);
    setCurrentScreen('shared');
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    // When the user navigates away from a shared-plan deep link, restore the root
    // URL so refreshes don't keep dropping them back into the shared view.
    if (screen !== 'shared' && typeof window !== 'undefined' && window.location.pathname.startsWith('/p/')) {
      window.history.replaceState(null, '', '/');
    }
  };

  // Deep-link / share-URL parsing on first mount.
  // Supports: /p/X7K4M2 (canonical), ?p=X7K4M2 (query), #/p/X7K4M2 (hash fallback).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { pathname, search, hash } = window.location;
    let raw: string | null = null;

    const pathMatch = pathname.match(/^\/p\/([A-Za-z0-9-]+)/);
    if (pathMatch) raw = pathMatch[1];

    if (!raw) {
      const params = new URLSearchParams(search);
      const q = params.get('p');
      if (q) raw = q;
    }

    if (!raw && hash.startsWith('#/p/')) {
      raw = hash.slice('#/p/'.length);
    }

    if (raw) {
      const code = normalizeShareCode(raw);
      if (code) {
        setSharedPlanId(code);
        setCurrentScreen('shared');
      }
    }
  }, []);

  const handleDestinationSelect = (dest: Destination) => {
    setSelectedDestination(dest);
    navigateTo('hotels');
  };

  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    navigateTo('detail');
  };

  const handleChatRecommendations = (destinations: Destination[]) => {
    setAiDestinations(destinations);
    navigateTo('recommendations');
  };

  // TripCard tıklayınca itinerary ekranına git
  const handleTripCardSelect = (card: TripCard) => {
    setSelectedTripCard(card);
    navigateTo('itinerary');
  };

  // Itinerary'den otellere git
  const handleViewHotelsFromItinerary = () => {
    if (!selectedTripCard) return;
    const destFromCard: Destination = {
      id: selectedTripCard.id,
      name: selectedTripCard.city,
      location: selectedTripCard.country,
      price: selectedTripCard.estimatedCost,
      duration: `${selectedTripCard.days} nights`,
      rating: 4.7,
      reviews: 200,
      image: selectedTripCard.image,
      description: selectedTripCard.title,
      tags: [selectedTripCard.vibe],
      matchReason: ''
    };
    setSelectedDestination(destFromCard);
    navigateTo('hotels');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
            <WelcomeScreen onStart={() => navigateTo('explore')} />
          </motion.div>
        );
      case 'explore':
        return (
          <motion.div key="explore" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            <ExploreScreen
              onSelectTrip={handleTripCardSelect}
              onStartChat={() => navigateTo('chat')}
              onOpenSharedPlan={handleOpenSharedPlan}
            />
          </motion.div>
        );
      case 'chat':
        return (
          <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="h-full w-full">
            <ChatScreen
              messages={messages}
              setMessages={setMessages}
              answers={answers}
              setAnswers={setAnswers}
              hasRecommendations={!!aiDestinations}
              onBack={() => navigateTo('explore')}
              onRecommendations={handleChatRecommendations}
              onShowRecommendations={() => navigateTo('recommendations')}
            />
          </motion.div>
        );
      case 'recommendations':
        return (
          <motion.div key="recommendations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            <RecommendationsScreen
              onBack={() => navigateTo('chat')}
              onSelect={handleDestinationSelect}
              onOpenChat={() => navigateTo('chat')}
              destinations={aiDestinations}
            />
          </motion.div>
        );
      case 'hotels':
        return (
          <motion.div key="hotels" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            {selectedDestination && (
              <HotelsScreen
                destination={selectedDestination}
                onBack={() => navigateTo(selectedTripCard ? 'itinerary' : (aiDestinations ? 'recommendations' : 'explore'))}
                onSelect={handleHotelSelect}
              />
            )}
          </motion.div>
        );
      case 'itinerary':
        return (
          <motion.div key="itinerary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            {selectedTripCard && (
              <ItineraryScreen
                card={selectedTripCard}
                onBack={() => navigateTo('explore')}
                onViewHotels={handleViewHotelsFromItinerary}
              />
            )}
          </motion.div>
        );
      case 'detail':
        return (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            {selectedDestination && (
              <TripDetailScreen
                destination={selectedDestination}
                hotel={selectedHotel}
                onBack={() => navigateTo('hotels')}
              />
            )}
          </motion.div>
        );
      case 'my-trips':
        return (
          <motion.div key="my-trips" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            <MyTripsScreen onStartPlanning={() => navigateTo('chat')} />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            <ProfileScreen />
          </motion.div>
        );
      case 'shared':
        return (
          <motion.div key="shared" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
            {sharedPlanId && (
              <SharedPlanScreen
                planId={sharedPlanId}
                onBack={() => navigateTo('explore')}
              />
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative mx-auto max-w-md h-screen overflow-hidden bg-[#0a0a0a] text-neutral-100 shadow-[0_0_60px_rgba(251,191,36,0.08)]">
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>

      {currentScreen !== 'welcome' && (
        <Navigation
          currentScreen={currentScreen}
          onNavigate={navigateTo}
        />
      )}
    </div>
  );
}
