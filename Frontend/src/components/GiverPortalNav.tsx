import React from 'react';
import { PlusCircle, Search, Star, Building2, Users } from 'lucide-react';
import { GiverTab, Language, ThemeMode } from '../types';
import { playSound } from '../utils/audio';

interface GiverPortalNavProps {
  currentTab: GiverTab;
  onSelectTab: (tab: GiverTab) => void;
  lang: Language;
  theme?: ThemeMode;
}

export const GiverPortalNav: React.FC<GiverPortalNavProps> = ({
  currentTab,
  onSelectTab,
  lang,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const tabs = [
    {
      id: 'request' as GiverTab,
      label: lang === 'hi' ? 'क्लाइंट पंजीकरण' : lang === 'kn' ? 'ನೋಂದಣಿ' : 'Register Client',
      icon: PlusCircle,
    },
    {
      id: 'vacancies' as GiverTab,
      label: lang === 'hi' ? 'साइट रिक्तियां' : lang === 'kn' ? 'ಖಾಲಿ ಹುದ್ದೆಗಳು' : 'Site Vacancies',
      icon: Building2,
    },
    {
      id: 'matches' as GiverTab,
      label: lang === 'hi' ? 'लाइव बुकिंग' : lang === 'kn' ? 'ಲೈವ್ ಬುಕಿಂಗ್' : 'Live Bookings',
      icon: Search,
    },
    {
      id: 'history' as GiverTab,
      label: lang === 'hi' ? 'रेटिंग व इतिहास' : lang === 'kn' ? 'ರೇಟಿಂಗ್ & ಇತಿಹಾಸ' : 'Rate & History',
      icon: Star,
    },
  ];

  return (
    <nav
      className={`sticky bottom-0 left-0 right-0 z-40 w-full backdrop-blur-[12px] border-t px-3 py-2 flex items-center justify-around transition-colors duration-200 ${
        isDark
          ? 'bg-[#051E1A]/85 border-emerald-900/80 shadow-[0_-8px_20px_rgba(0,0,0,0.3)] text-white'
          : 'bg-white/85 border-emerald-100 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] text-slate-800'
      }`}
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      aria-label="Work-Giver Portal Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (currentTab !== tab.id) {
                playSound('start');
                onSelectTab(tab.id);
              }
            }}
            className={`flex flex-col items-center justify-center min-w-[80px] min-h-[46px] rounded-xl transition-all duration-200 active:scale-95 ${
              active
                ? isDark
                  ? 'text-teal-300 font-extrabold'
                  : 'text-[#0F766E] font-extrabold'
                : isDark
                  ? 'text-emerald-300/70 hover:text-white font-medium'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              {active && (
                <span
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm ${
                    isDark ? 'bg-teal-400' : 'bg-[#0F766E]'
                  }`}
                />
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
