import React from 'react';
import { Mic, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, MapPin, Users, Zap } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, LANG_NAMES } from '../data/translations';
import { playSound, speakText } from '../utils/audio';

interface Screen1HomeProps {
  lang: Language;
  onSelectLang: (lang: Language) => void;
  onNavigateCustomer: () => void;
  onNavigateWorker: () => void;
}

export const Screen1Home: React.FC<Screen1HomeProps> = ({
  lang,
  onSelectLang,
  onNavigateCustomer,
  onNavigateWorker,
}) => {
  const t = TRANSLATIONS[lang];

  const handleLanguageChange = (l: Language) => {
    onSelectLang(l);
    playSound('start');
    const greetings: Record<Language, string> = {
      en: 'Welcome to Hello. Find local work with trust. Speak, do not type.',
      hi: 'नमस्ते, हेलो में आपका स्वागत है। बोलकर काम पाएं।',
      kn: 'ನಮಸ್ಕಾರ, ಹೆಲೋಗೆ ಸುಸ್ವಾಗತ. ಮಾತನಾಡಿ ಕೆಲಸ ಪಡೆಯಿರಿ.',
    };
    speakText(greetings[l], l);
  };

  const handleVoiceOrbClick = () => {
    playSound('alert');
    speakText(`${t.h1a || 'Direct Work'} ${t.h1b || 'Real Trust'}. ${t.subTagline || t.sub || ''}`, lang);
  };

  return (
    <div className="flex flex-col min-h-full justify-between text-white px-1 py-2">
      {/* Top Header & Tagline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-bold text-emerald-300 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
            <span>LOCAL WORK, BUILT ON TRUST</span>
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300/80">
            <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Mangalore Hub</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <h1 className="font-display font-black text-4xl sm:text-5xl leading-[1.05] tracking-tight">
            <span>{t.tagline}</span>
            <br />
            <span className="text-[#F59E0B] drop-shadow-[0_2px_12px_rgba(245,158,11,0.3)]">
              {t.appName || 'KaamConnect'}
            </span>
          </h1>
          <p className="text-emerald-100/90 text-base font-medium leading-relaxed max-w-[32ch]">
            {t.subTagline}
          </p>
        </div>

        {/* Live Trust Metrics - Zero-Pill Typography */}
        <div className="flex items-center gap-3 text-xs text-emerald-200/80 font-medium py-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Verified Artisans</span>
          </span>
          <span aria-hidden="true" className="text-emerald-600">•</span>
          <span>Zero Middleman Cuts</span>
          <span aria-hidden="true" className="text-emerald-600">•</span>
          <span>100% Direct Pay</span>
        </div>
      </div>

      {/* Centerpiece: Glowing Acoustic Voice Orb */}
      <div className="my-8 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full border border-[#F59E0B]/30 animate-ring-pulse pointer-events-none" />
          <div className="absolute w-36 h-36 rounded-full border border-[#F59E0B]/20 animate-ring-pulse-delayed pointer-events-none" />
          <div className="absolute w-36 h-36 rounded-full border border-[#F59E0B]/10 animate-ring-pulse-delayed-2 pointer-events-none" />
          <button
            type="button"
            onClick={handleVoiceOrbClick}
            className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-[#F59E0B] via-amber-400 to-amber-600 text-[#062420] flex items-center justify-center shadow-[0_12px_36px_rgba(245,158,11,0.45)] transition-transform duration-200 active:scale-95 hover:scale-105 group"
            title="Tap to speak or listen to instructions"
          >
            <Mic className="w-12 h-12 stroke-[2.4] group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <p className="mt-4 text-xs font-bold text-emerald-200/90 tracking-wide uppercase">
          {t.hold}
        </p>
      </div>

      {/* Bottom Section: Language & Action Buttons */}
      <div className="space-y-4">
        {/* Language Switcher with Dual Labels */}
        <div className="bg-emerald-950/70 p-1 rounded-2xl flex gap-1 border border-emerald-800/70 backdrop-blur-md">
          {(['en', 'hi', 'kn'] as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => handleLanguageChange(l)}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                lang === l
                  ? 'bg-white text-[#062420] shadow-md scale-[1.02]'
                  : 'text-emerald-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {LANG_NAMES[l].native}
            </button>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => {
              playSound('start');
              onNavigateCustomer();
            }}
            className="w-full min-h-[58px] px-6 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-amber-400 text-[#062420] font-display font-extrabold text-lg flex items-center justify-between shadow-[0_10px_25px_rgba(245,158,11,0.3)] hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <span>{t.nav_giver_portal || 'Need Labour / Contractor'}</span>
            <div className="w-9 h-9 rounded-full bg-[#062420]/15 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('start');
              onNavigateWorker();
            }}
            className="w-full min-h-[58px] px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-display font-extrabold text-lg border border-white/20 flex items-center justify-between backdrop-blur-sm active:scale-[0.98] transition-all"
          >
            <span>{t.nav_worker_portal || 'I am a Worker / Labourer'}</span>
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Trust Bottom Stamp */}
        <p className="text-center text-[11px] text-emerald-300/70 pt-2 flex items-center justify-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>India Open Innovation • Mobile-First PWA</span>
        </p>
      </div>
    </div>
  );
};
