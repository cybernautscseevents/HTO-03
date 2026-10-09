import React from 'react';
import { Wrench, UserPlus, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, Volume2, Award, ChevronLeft, ArrowLeft } from 'lucide-react';
import { Language, WorkerProfile, ThemeMode } from '../types';
import { TRANSLATIONS, LANG_NAMES } from '../data/translations';
import { playSound, speakText, triggerHaptic } from '../utils/audio';
import { ThemeToggle } from './ThemeToggle';

interface ScreenWorkerAuthProps {
  lang: Language;
  onSelectLang: (lang: Language) => void;
  savedProfile: WorkerProfile | null;
  onResumeProfile: (profile: WorkerProfile) => void;
  onRegisterNew: () => void;
  onGoBack: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const ScreenWorkerAuth: React.FC<ScreenWorkerAuthProps> = ({
  lang,
  onSelectLang,
  savedProfile,
  onResumeProfile,
  onRegisterNew,
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
      en: 'Worker and daily wage labourer portal. Speak in your language.',
      hi: 'कामगार और दैनिक वेतन भोगी पोर्टल। अपनी भाषा में बोलें।',
      kn: 'ಕಾರ್ಮಿಕ ಮತ್ತು ದಿನಗೂಲಿ ಪೋರ್ಟಲ್. ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ.',
    };
    speakText(greetings[l], l);
  };

  return (
    <div className={`w-full max-w-xl mx-auto my-auto p-5 sm:p-8 rounded-3xl shadow-2xl border backdrop-blur-[12px] transition-all duration-200 ${
      isDark
        ? 'bg-[#07241F]/80 border-emerald-700/60 text-white shadow-emerald-950/40'
        : 'bg-white/80 border-emerald-100/90 text-slate-900 shadow-xl shadow-emerald-900/5'
    } space-y-6`}>
      {/* Navigation, Back Arrow, Portal Badge & Theme Toggle */}
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
              ? 'text-[#F59E0B] bg-emerald-950/80 border-emerald-800/80'
              : 'text-emerald-800 bg-emerald-50 border-emerald-200'
          }`}>
            Labourer Access
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className={`font-display font-black text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
          {t.worker_auth_title}
        </h2>
        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
          {t.worker_auth_sub}
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
                    ? 'bg-[#F59E0B] text-[#062420] shadow-sm scale-[1.02]'
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

      {/* Register New Worker Option */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            playSound('start');
            onRegisterNew();
          }}
          className="w-full min-h-[58px] rounded-2xl bg-[#0F766E] text-white font-display font-extrabold text-base flex items-center justify-between px-6 shadow-lg shadow-[#0F766E]/20 hover:bg-[#115E59] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5" />
            <span>{t.register_new_worker}</span>
          </div>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
        <p className={`text-xs text-center font-medium ${isDark ? 'text-emerald-300/60' : 'text-slate-500'}`}>
          Speak for 20 seconds • No resume or typing needed
        </p>
      </div>

      {/* Down Popup / Bottom Card: Previous Saved Profile (if available) */}
      {savedProfile && (
        <div className={`p-5 rounded-3xl border-2 shadow-md space-y-3.5 backdrop-blur-[12px] animate-in slide-in-from-bottom duration-300 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-amber-400/70 text-white'
            : 'bg-amber-50/80 border-amber-300 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <span>{t.saved_profile_label}</span>
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isDark ? 'text-emerald-200 bg-emerald-900/80 border border-emerald-700' : 'text-emerald-800 bg-emerald-100'
            }`}>
              Verified
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] via-amber-400 to-amber-600 text-[#062420] font-display font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
              {savedProfile.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`font-display font-extrabold text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {savedProfile.name}
              </h3>
              <p className={`text-xs font-semibold capitalize mt-0.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                {savedProfile.trade.replace('_', ' ')} • {savedProfile.experience_years || 8} yrs exp
              </p>
              <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                Trust Score: {savedProfile.trust_score}/100 • {savedProfile.jobs_done} jobs completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('success');
              triggerHaptic([100]);
              onResumeProfile(savedProfile);
            }}
            className="w-full min-h-[50px] rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#062420] font-display font-black text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <span>{t.saved_profile_resume} {savedProfile.name}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};
