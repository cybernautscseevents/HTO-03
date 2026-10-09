import React from 'react';
import { Home, Search, Briefcase, Award } from 'lucide-react';
import { ScreenId, Language } from '../types';
import { playSound } from '../utils/audio';

interface BottomTabBarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  lang: Language;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentScreen,
  onNavigate,
  lang,
}) => {
  const tabs = [
    {
      id: 'overview' as ScreenId,
      label: lang === 'hi' ? 'अवलोकन' : lang === 'kn' ? 'ಅವಲೋಕನ' : 'Overview',
      icon: Home,
      isActive: currentScreen === 'overview',
    },
    {
      id: 'giver-auth' as ScreenId,
      label: lang === 'hi' ? 'ठेकेदार' : lang === 'kn' ? 'ಗುತ್ತಿಗೆದಾರ' : 'Work Giver',
      icon: Search,
      isActive: ['giver-auth', 's4', 's5', 's6'].includes(currentScreen),
    },
    {
      id: 'worker-auth' as ScreenId,
      label: lang === 'hi' ? 'कारीगर' : lang === 'kn' ? 'ಕಾರ್ಮಿಕ' : 'Worker Hub',
      icon: Briefcase,
      isActive: ['worker-auth', 's2', 's3', 's7'].includes(currentScreen),
    },
    {
      id: 's9' as ScreenId,
      label: lang === 'hi' ? 'वर्क कार्ड' : lang === 'kn' ? 'ವರ್ಕ್ ಕಾರ್ಡ್' : 'Work Card',
      icon: Award,
      isActive: ['s8', 's9'].includes(currentScreen),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 max-w-[440px] mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-8px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      aria-label="Bottom Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (currentScreen !== tab.id) {
                playSound('start');
                onNavigate(tab.id);
              }
            }}
            className={`flex flex-col items-center justify-center min-w-[68px] min-h-[46px] rounded-xl transition-all duration-200 active:scale-95 ${
              active
                ? 'text-[#0F766E] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#F59E0B] rounded-full shadow-sm" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1 leading-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
