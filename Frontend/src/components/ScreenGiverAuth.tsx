import React from 'react';
import { Home, PlusCircle, ArrowRight, ShieldCheck, MapPin, ArrowLeft, History } from 'lucide-react';
import { Language, CustomerProfile, ThemeMode } from '../types';
import { TRANSLATIONS, LANG_NAMES } from '../data/translations';
import { playSound, speakText, triggerHaptic } from '../utils/audio';
import { ThemeToggle } from './ThemeToggle';

interface ScreenGiverAuthProps {
  lang: Language;
  onSelectLang: (lang: Language) => void;
  savedGiver: CustomerProfile | null;
  onResumeGiver: (giver: CustomerProfile) => void;
  onStartNewRequest: () => void;
  onGoBack: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const ScreenGiverAuth: React.FC<ScreenGiverAuthProps> = ({
  lang,
  onSelectLang,
  savedGiver,
  onResumeGiver,
  onStartNewRequest,
  onGoBack,
  theme,
  onToggleTheme,
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';

  const handleLanguageChange = (l: Language) => {
    onSelectLang(l);
    playSound('start');
    const greetings: Record<Language, string> = {
      en: 'Contractor portal. What daily wage labour team do you need today?',
      hi: 'ठेकेदार पोर्टल। आज आपको किस प्रकार के कामगारों की आवश्यकता है?',
      kn: 'ಗುತ್ತಿಗೆದಾರ ಪೋರ್ಟಲ್. ಇಂದು ನಿಮಗೆ ಯಾವ ಕಾರ್ಮಿಕ ತಂಡ ಬೇಕು?',
    };
    speakText(greetings[l], l);
  };

  return (
    <div className={`w-full max-w-xl mx-auto my-auto p-5 sm:p-8 rounded-3xl shadow-2xl border backdrop-blur-[12px] transition-all duration-200 ${
      isDark
        ? 'bg-[#07241F]/80 border-emerald-700/60 text-white shadow-emerald-950/40'
        : 'bg-white/80 border-emerald-100/90 text-slate-900 shadow-xl shadow-emerald-900/5'
    } space-y-6`}>
      {/* Navigation & Portal Badge with Theme Toggle */}
      <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-emerald-900/60' : 'border-emerald-100'}`}>
        <button
          type="button"
          onClick={() => {
            playSound('start');
            onGoBack();
          }}
          className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors active:scale-95 ${
            isDark
              ? 'text-emerald-300 hover:text-white bg-white/5 hover:bg-white/10'
              : 'text-slate-700 hover:text-slate-900 bg-emerald-50 hover:bg-emerald-100'
          }`}
          title="Go back to previous page"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t.back}</span>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} compact />
          <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
            isDark
              ? 'text-teal-300 bg-emerald-950/80 border-emerald-800/80'
              : 'text-teal-800 bg-teal-50 border-teal-200'
          }`}>
            Contractor Access
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className={`font-display font-black text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
          {t.giver_auth_title}
        </h2>
        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
          {t.giver_auth_sub}
        </p>
      </div>

      {/* Spoken Language Picker */}
      <div className={`space-y-2 p-4 rounded-2xl border ${
        isDark ? 'bg-[#041E19] border-emerald-900' : 'bg-emerald-50/60 border-emerald-200'
      }`}>
        <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-300/80' : 'text-slate-600'}`}>
          {t.spoken_lang_label}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['en', 'hi', 'kn'] as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLanguageChange(l)}
              className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                lang === l
                  ? isDark
                    ? 'bg-teal-500 text-[#062420] shadow-sm scale-[1.02]'
                    : 'bg-[#0F766E] text-white shadow-sm scale-[1.02]'
                  : isDark
                    ? 'bg-[#07241F] text-emerald-200/80 border border-emerald-800/80 hover:text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {LANG_NAMES[l].native}
            </button>
          ))}
        </div>
      </div>

      {/* Start New Work Request */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            playSound('start');
            onStartNewRequest();
          }}
          className="w-full min-h-[58px] rounded-2xl bg-[#0F766E] text-white font-display font-extrabold text-base flex items-center justify-between px-6 shadow-lg shadow-[#0F766E]/20 hover:bg-[#115E59] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5" />
            <span>{t.new_request_giver || 'Register Client & Post Site Requirement'}</span>
          </div>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
        <p className={`text-xs text-center font-medium ${isDark ? 'text-emerald-300/60' : 'text-slate-500'}`}>
          Register company details • Specify labour count, shift duration & wages
        </p>
      </div>

      {/* Down Popup / Bottom Card: Previous Saved Profile (if available) */}
      {savedGiver && (
        <div className={`p-5 rounded-3xl border-2 shadow-md space-y-3.5 backdrop-blur-[12px] animate-in slide-in-from-bottom duration-300 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-teal-400/70 text-white'
            : 'bg-teal-50/80 border-teal-300 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-teal-300' : 'text-teal-900'}`}>
              <History className="w-4 h-4 text-teal-400" />
              <span>{t.saved_profile_label}</span>
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isDark ? 'text-emerald-200 bg-emerald-900/80 border border-emerald-700' : 'text-teal-800 bg-teal-100'
            }`}>
              A-Grade Civil Contractor
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-display font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
              {savedGiver.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`font-display font-extrabold text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {savedGiver.name}
              </h3>
              <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{savedGiver.area}, Mangalore • Reg: MNG-CIVIL-2024</span>
              </p>
              <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-emerald-300' : 'text-teal-800'}`}>
                {savedGiver.bookings_count} completed site contracts on record
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('success');
              triggerHaptic([100]);
              onResumeGiver(savedGiver);
            }}
            className="w-full min-h-[50px] rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white font-display font-black text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <span>{t.saved_giver_resume} {savedGiver.name}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};
