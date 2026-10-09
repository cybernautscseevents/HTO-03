import React from 'react';
import { HardHat, Building2, ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { TRANSLATIONS, LANG_NAMES } from '../data/translations';
import { playSound, speakText } from '../utils/audio';
import { ThemeToggle } from './ThemeToggle';

interface ScreenOverviewProps {
  lang: Language;
  onSelectLang: (lang: Language) => void;
  onEnterWorkerPortal: () => void;
  onEnterGiverPortal: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const ScreenOverview: React.FC<ScreenOverviewProps> = ({
  lang,
  onSelectLang,
  onEnterWorkerPortal,
  onEnterGiverPortal,
  theme,
  onToggleTheme,
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';

  const handleLanguageChange = (l: Language) => {
    onSelectLang(l);
    playSound('start');
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 transition-colors duration-200 ${isDark ? 'text-white' : 'text-slate-900'} space-y-8 sm:space-y-12`}>
      {/* Top Brand Navigation */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${isDark ? 'border-emerald-900/60' : 'border-emerald-200/80'}`}>
        <div className="flex items-center gap-3 select-none">
          <span className={`font-display font-black text-3xl sm:text-4xl tracking-tight lowercase ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
            hello<span className="text-[#F59E0B]">.</span>
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
            isDark
              ? 'text-emerald-300/90 bg-emerald-950/90 border-emerald-800/80'
              : 'text-emerald-800 bg-emerald-100/90 border-emerald-300/80'
          }`}>
            Open Work Exchange
          </span>
        </div>

        {/* Clean Language Segmented Control & Dark/Light Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          <div className={`p-1 rounded-2xl flex gap-1 border shadow-xs ${
            isDark
              ? 'bg-emerald-950/80 border-emerald-800/80'
              : 'bg-emerald-50/90 border-emerald-200'
          }`}>
            {(['en', 'hi', 'kn'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLanguageChange(l)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  lang === l
                    ? isDark
                      ? 'bg-[#F59E0B] text-[#062420] shadow-sm'
                      : 'bg-[#0F766E] text-white shadow-sm'
                    : isDark
                      ? 'text-emerald-200/80 hover:text-white'
                      : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                {LANG_NAMES[l].native}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section: Centered & Spacious for PC, Tight for Mobile */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-2 sm:pt-4">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
          isDark
            ? 'bg-emerald-950/90 border-emerald-800/90 text-emerald-300'
            : 'bg-emerald-100/90 border-emerald-300 text-emerald-900'
        }`}>
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
          <span>DIRECT WORK • ZERO MIDDLEMEN • VOICE FIRST</span>
        </div>
        <h1 className={`font-display font-black text-4xl sm:text-6xl tracking-tight leading-[1.08] ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
          {t.tagline}
        </h1>
        <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium ${isDark ? 'text-emerald-100/90' : 'text-slate-700'}`}>
          {t.subTagline}
        </p>
      </div>

      {/* The Two Distinct Portals: 2 Columns on PC, 1 Column on Mobile */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-1">
          <span className={`text-xs sm:text-sm font-black uppercase tracking-widest ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
            {t.portal_select_title}
          </span>
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Mangalore Locality Active</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Portal 1: Daily Wage Worker & Labourer Portal */}
          <div
            onClick={() => {
              playSound('start');
              onEnterWorkerPortal();
            }}
            className={`group relative rounded-3xl p-6 sm:p-8 border shadow-xl cursor-pointer backdrop-blur-[12px] transition-all duration-200 active:scale-[0.99] flex flex-col justify-between space-y-6 ${
              isDark
                ? 'bg-gradient-to-br from-[#0A332C]/85 via-[#0D3F37]/85 to-[#072B25]/85 border-emerald-700/60 hover:border-amber-400 hover:shadow-amber-500/10'
                : 'bg-white/80 border-emerald-200/90 hover:border-emerald-400 hover:shadow-emerald-600/10 shadow-emerald-900/5'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-[#F59E0B] flex items-center justify-center border border-amber-400/30 group-hover:scale-105 transition-transform">
                  <HardHat className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="text-xs font-black text-[#F59E0B] bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  For Daily Wage Labourers
                </span>
              </div>
              <div>
                <h2 className={`font-display font-black text-2xl sm:text-3xl transition-colors ${
                  isDark ? 'text-white group-hover:text-amber-300' : 'text-[#06332A] group-hover:text-[#0F766E]'
                }`}>
                  {t.portal_worker_title}
                </h2>
                <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-emerald-100/80' : 'text-slate-600'}`}>
                  {t.portal_worker_desc}
                </p>
              </div>
              <ul className={`text-xs sm:text-sm space-y-1.5 pt-2 ${isDark ? 'text-emerald-200/90' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <span className="text-[#F59E0B] font-bold">•</span>
                  <span>Speak for 20 seconds to get your digital work profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#F59E0B] font-bold">•</span>
                  <span>Direct daily site & wage work in your local area</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#F59E0B] font-bold">•</span>
                  <span>Portable verified Work Card with QR code & trust score</span>
                </li>
              </ul>
            </div>
            <div className={`pt-4 flex items-center justify-between text-sm sm:text-base font-black text-[#F59E0B] border-t ${
              isDark ? 'border-emerald-800/60' : 'border-emerald-100'
            }`}>
              <span>{t.portal_worker_cta}</span>
              <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Portal 2: Contractor Portal */}
          <div
            onClick={() => {
              playSound('start');
              onEnterGiverPortal();
            }}
            className={`group relative rounded-3xl p-6 sm:p-8 border shadow-xl cursor-pointer backdrop-blur-[12px] transition-all duration-200 active:scale-[0.99] flex flex-col justify-between space-y-6 ${
              isDark
                ? 'bg-gradient-to-br from-[#0F4A40]/85 via-[#115448]/85 to-[#0B3931]/85 border-teal-600/60 hover:border-teal-300 hover:shadow-teal-500/10'
                : 'bg-white/80 border-teal-200/90 hover:border-teal-400 hover:shadow-teal-600/10 shadow-emerald-900/5'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-teal-400/20 text-teal-400 flex items-center justify-center border border-teal-400/30 group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="text-xs font-black text-teal-400 bg-teal-400/10 border border-teal-400/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  For Contractors
                </span>
              </div>
              <div>
                <h2 className={`font-display font-black text-2xl sm:text-3xl transition-colors ${
                  isDark ? 'text-white group-hover:text-teal-200' : 'text-[#06332A] group-hover:text-teal-700'
                }`}>
                  {t.portal_giver_title}
                </h2>
                <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-emerald-100/80' : 'text-slate-600'}`}>
                  {t.portal_giver_desc}
                </p>
              </div>
              <ul className={`text-xs sm:text-sm space-y-1.5 pt-2 ${isDark ? 'text-emerald-200/90' : 'text-slate-700'}`}>
                <li className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>Speak or post site requirements for instant labour availability</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>Standard fair daily wage benchmark before hiring</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>Direct attendance tracking & zero middleman commission</span>
                </li>
              </ul>
            </div>
            <div className={`pt-4 flex items-center justify-between text-sm sm:text-base font-black text-teal-400 border-t ${
              isDark ? 'border-teal-800/60' : 'border-teal-100'
            }`}>
              <span>{t.portal_giver_cta}</span>
              <div className="w-9 h-9 rounded-full bg-teal-400/20 flex items-center justify-center group-hover:translate-x-1.5 transition-transform">
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Ethics Guarantee Footer */}
      <div className={`max-w-3xl mx-auto pt-6 text-center space-y-2 border-t ${isDark ? 'border-emerald-900/60' : 'border-emerald-200/80'}`}>
        <div className={`flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>Fair Price Guide</span>
          </span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>Masked Phone Numbers</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>Verified Work Card</span>
          <span className="hidden sm:inline" aria-hidden="true">•</span>
          <span>Zero Commission</span>
        </div>
        <p className={`text-xs ${isDark ? 'text-emerald-400/60' : 'text-slate-500'}`}>
          Hello Initiative • Open Innovation Track
        </p>
      </div>
    </div>
  );
};
