import { MessageSquare, Globe, Briefcase, User } from 'lucide-react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const tabs = [
    { id: 'explore', icon: Globe, label: 'Explore' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'my-trips', icon: Briefcase, label: 'My Trips' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-white/90 border-t border-gray-100 px-8 py-4 backdrop-blur-lg">
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.id || (tab.id === 'explore' && ['recommendations', 'hotels', 'detail'].includes(currentScreen));
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onNavigate(tab.id as Screen)}
            className="flex flex-col items-center group relative h-10 w-10 justify-center"
          >
            <tab.icon 
              className={`h-6 w-6 transition-colors ${
                isActive ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-600'
              }`} 
            />
            <span className={`text-[10px] font-bold mt-1 transition-colors ${
              isActive ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-600'
            }`}>
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute -top-1 w-1 h-1 rounded-full bg-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
