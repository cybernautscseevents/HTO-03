import React from 'react';
import { Briefcase, Award, UserCheck, Building2, Coins } from 'lucide-react';
import { WorkerTab, Language, ThemeMode } from '../types';
import { playSound } from '../utils/audio';

interface WorkerPortalNavProps {
  currentTab: WorkerTab;
  onSelectTab: (tab: WorkerTab) => void;
  lang: Language;
  theme?: ThemeMode;
}

export const WorkerPortalNav: React.FC<WorkerPortalNavProps> = ({
  currentTab,
  onSelectTab,
  lang,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const tabs = [
    {
      id: 'jobs' as WorkerTab,
      label: lang === 'hi' ? 'लाइव काम' : lang === 'kn' ? 'ಲೈವ್ ಕೆಲಸ' : 'Live Jobs',
      icon: Briefcase,
    },
    {
      id: 'contracts' as WorkerTab,
      label: lang === 'hi' ? 'ठेके' : lang === 'kn' ? 'ಗುತ್ತಿಗೆಗಳು' : 'Contracts',
      icon: Building2,
    },
    {
      id: 'credits' as WorkerTab,
      label: lang === 'hi' ? 'इनाम' : lang === 'kn' ? 'ಬಹುಮಾನ' : 'Rewards',
      icon: Coins,
    },
    {
      id: 'card' as WorkerTab,
      label: lang === 'hi' ? 'वर्क कार्ड' : lang === 'kn' ? 'ವರ್ಕ್ ಕಾರ್ಡ್' : 'Work Card',
      icon: Award,
    },
    {
      id: 'profile' as WorkerTab,
      label: lang === 'hi' ? 'प्रोफ़ाइल' : lang === 'kn' ? 'ಪ್ರೊಫೈಲ್' : 'Profile',
      icon: UserCheck,
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
      aria-label="Worker Portal Navigation"
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
            className={`flex flex-col items-center justify-center flex-1 min-w-0 max-w-[90px] min-h-[46px] rounded-xl transition-all duration-200 active:scale-95 ${
              active
                ? isDark
                  ? 'text-[#F59E0B] font-extrabold'
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
                    isDark ? 'bg-[#F59E0B]' : 'bg-[#0F766E]'
                  }`}
                />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1 leading-tight truncate">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
