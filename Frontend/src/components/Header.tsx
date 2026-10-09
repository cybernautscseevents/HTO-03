import React from 'react';
import { ArrowLeft, Volume2, RotateCcw, Home } from 'lucide-react';
import { Language, ScreenId } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  currentScreen: ScreenId;
  lang: Language;
  onBack: () => void;
  canGoBack: boolean;
  onGoOverview: () => void;
  onReadAloud: () => void;
  onReset: () => void;
  isDark?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  lang,
  onBack,
  canGoBack,
  onGoOverview,
  onReadAloud,
  onReset,
  isDark,
}) => {
  const t = TRANSLATIONS[lang];
  return (
    <header
      className={`sticky top-0 z-40 w-full flex items-center justify-between px-4 py-2.5 transition-colors duration-200 border-b ${
        isDark
          ? 'bg-[#062420]/95 text-white backdrop-blur-md border-emerald-900/60'
          : 'bg-[#F8FAFC]/95 text-[#0F172A] backdrop-blur-md border-slate-200/80'
      }`}
    >
      <div className="flex items-center gap-2">
        {currentScreen !== 'overview' && (
          <button
            type="button"
            onClick={onBack}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-800'
            }`}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div
          onClick={onGoOverview}
          className="cursor-pointer select-none group flex items-baseline gap-1"
          title="hello · Return to Overview"
        >
          <span className="font-display font-black text-2xl tracking-tight lowercase">
            hello<span className="text-[#F59E0B]">.</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] group-hover:scale-125 transition-transform" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {currentScreen !== 'overview' && (
          <button
            type="button"
            onClick={onGoOverview}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
              isDark ? 'text-emerald-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-200'
            }`}
            title="Overview Home"
          >
            <Home className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onReadAloud}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
            isDark
              ? 'bg-emerald-950/90 text-emerald-200 hover:bg-emerald-900 border border-emerald-800/80 shadow-xs'
              : 'bg-emerald-50 text-[#0F766E] hover:bg-emerald-100 border border-emerald-200 shadow-xs'
          }`}
          title={t.read_aloud}
        >
          <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>{t.read_aloud}</span>
        </button>
      </div>
    </header>
  );
};
