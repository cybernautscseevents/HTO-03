import React, { useState, useEffect } from 'react';
import {
  Share2, CheckCircle2, ShieldCheck, QrCode, Download, Copy,
  Sparkles, Volume2, HardHat, Building2, Star, Award, Check
} from 'lucide-react';
import { Language, WorkerProfile, ThemeMode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { playSound, triggerHaptic, speakText } from '../utils/audio';

interface Screen9WorkCardProps {
  lang: Language;
  worker: WorkerProfile;
  onDone: () => void;
  theme?: ThemeMode;
}

export const Screen9WorkCard: React.FC<Screen9WorkCardProps> = ({
  lang,
  worker,
  onDone,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const trustScore = Math.min(100, Math.max(0, worker.trust_score || 84));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(trustScore);
    }, 200);
    return () => clearTimeout(timer);
  }, [trustScore]);

  const handleShareWhatsApp = () => {
    playSound('start');
    triggerHaptic([100]);
    const cardUrl = `${window.location.origin}/card/${worker.id || 7}`;
    const text = `Verified Mason Work Card: ${worker.name}, Master Mason (Raj Mistri). ${worker.jobs_done || 54} shifts, 4.8 ★ rating, Trust Score ${trustScore}/100. Contractor Endorsements verified. View digital card: ${cardUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    playSound('start');
    const cardUrl = `${window.location.origin}/card/${worker.id || 7}`;
    navigator.clipboard?.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakCredentials = () => {
    playSound('start');
    setIsPlayingAudio(true);
    const speech = {
      en: `Verified Master Mason Work Card. ${worker.name}. Experience 8 years. Trust score ${trustScore} out of 100. 54 shifts completed with 4.8 stars. Certified in brickwork, plastering, and foundation casting. Endorsed by Shree Ram Builders and Coastal Horizon.`,
      hi: `सत्यापित राज मिस्त्री वर्क कार्ड। ${worker.name}। 100 में से ${trustScore} ट्रस्ट स्कोर। 4.8 रेटिंग के साथ 54 काम पूरे।`,
      kn: `ಪರಿಶೀಲಿಸಿದ ರಾಜ ಮೇಸ್ತ್ರಿ ವರ್ಕ್ ಕಾರ್ಡ್. ${worker.name}. 8 ವರ್ಷ ಅನುಭವ. 100 ರಲ್ಲಿ ${trustScore} ಟ್ರಸ್ಟ್ ಸ್ಕೋರ್. 54 ಶಿಫ್ಟ್ ಪೂರ್ಣ.`,
    };
    speakText(speech[lang] || speech.en, lang);
    setTimeout(() => setIsPlayingAudio(false), 6000);
  };

  return (
    <div className={`flex flex-col min-h-full justify-between px-1 py-1 space-y-4 ${isDark ? 'text-white' : 'text-slate-900'} pb-8`}>
      <div className="space-y-3">
        {/* Header Badge */}
        <div className="text-center pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-bold text-emerald-300 tracking-wide uppercase">
            <Sparkles className="w-3 pupil text-[#F59E0B]" />
            <span>Portable Mason Work Pass</span>
          </div>
          <h2 className={`font-display font-black text-2xl sm:text-3xl mt-1 ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
            {t.mycard}
          </h2>
          <p className={`text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
            QR-verified portable work identity recognized across construction sites & contractors
          </p>
        </div>

        {/* Physical Lanyard ID Card Simulation */}
        <div className="relative mx-auto w-full max-w-[390px] bg-white text-slate-900 rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.4)] overflow-hidden border border-slate-200/90">
          {/* Lanyard Top Strap & Hole Punch */}
          <div className="w-20 h-3 rounded-full bg-[#082622] mx-auto mt-3.5 mb-1 shadow-inner opacity-80" />

          {/* Card Top Branding Header */}
          <div className="bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#F59E0B] px-5 py-3 flex items-center justify-between text-[#062420]">
            <div className="flex items-center gap-1.5">
              <HardHat className="w-5 h-5 stroke-[2.5]" />
              <span className="font-display font-black text-lg tracking-tight lowercase">
                hello<span className="font-extrabold">.mason</span>
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#062420]/15 px-2.5 py-0.5 rounded-full">
              Grade-A Master Mason
            </span>
          </div>

          <div className="p-5 space-y-4 relative">
            {/* Holographic Security Stamp */}
            <div className="absolute right-4 top-4 w-12 h-12 rounded-full hologram-foil border border-white/60 shadow-inner flex items-center justify-center opacity-85 pointer-events-none">
              <ShieldCheck className="w-6 h-6 text-emerald-900/70" />
            </div>

            {/* Worker Avatar & Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F59E0B] via-amber-400 to-amber-600 text-[#062420] font-display font-black text-3xl flex items-center justify-center shadow-md shrink-0">
                {(worker.name || 'R')[0]}
              </div>
              <div className="min-w-0 flex-1 pr-10">
                <h3 className="font-display font-extrabold text-xl text-slate-900 leading-tight truncate">
                  {worker.name || 'Ravi Kumar'}
                </h3>
                <p className="text-xs font-black text-[#0F766E] uppercase tracking-wider mt-0.5">
                  Master Mason / Raj Mistri (राज मिस्त्री)
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aadhar & Phone KYC</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-bold text-amber-700">
                    8 Yrs Experience
                  </span>
                </div>
              </div>
            </div>

            {/* Animated Radial Trust Dial */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-1">
              <svg className="w-36 h-36 -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="#0F766E"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - animatedProgress / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display font-black text-4xl text-slate-900 leading-none">
                  {trustScore}
                </span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">
                  {t.trust_score}
                </span>
                <span className="text-[9px] font-bold text-emerald-600">
                  Top 5% in Locality
                </span>
              </div>
            </div>

            {/* Verified Quantitative Stats */}
            <div className="grid grid-cols-4 divide-x divide-dashed divide-slate-200 border-y border-dashed border-slate-200 py-2.5 text-center">
              <div>
                <p className="font-display font-black text-lg text-slate-900 leading-none">
                  {worker.jobs_done || 54}
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Shifts Done
                </p>
              </div>
              <div>
                <p className="font-display font-black text-lg text-slate-900 leading-none flex items-center justify-center">
                  <span>{worker.stars || 4.8}</span>
                  <span className="text-amber-500 text-xs">★</span>
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Site Rating
                </p>
              </div>
              <div>
                <p className="font-display font-black text-lg text-slate-900 leading-none">
                  {worker.rehire_pct || 94}%
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Rehire Rate
                </p>
              </div>
              <div>
                <p className="font-display font-black text-lg text-emerald-700 leading-none">
                  98.4%
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Punctuality
                </p>
              </div>
            </div>

            {/* Daily Wage Benchmark */}
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Standard Daily Shift Wage:</span>
              <span className="font-display font-black text-amber-800 text-sm">
                ₹850 - ₹1,100 / day
              </span>
            </div>

            {/* Certified Mason Skills */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Certified Mason Skills:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  'Red Brickwork',
                  'Wall Plastering',
                  'Interlock Tile Laying',
                  'Foundation Casting',
                  'Plumb Alignment',
                ].map((sk, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200"
                  >
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Verified Contractor Endorsements */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Verified Contractor Endorsements:
              </span>
              <div className="space-y-1">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span className="font-bold text-slate-800">Shree Ram Builders & Infra</span>
                  </div>
                  <span className="font-bold text-emerald-700">4.9 ★ (24 Shifts)</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span className="font-bold text-slate-800">Coastal Horizon Infra</span>
                  </div>
                  <span className="font-bold text-emerald-700">4.8 ★ (18 Shifts)</span>
                </div>
              </div>
            </div>

            {/* QR Code Identification Footer */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 font-semibold">
                <QrCode className="w-4.5 h-4.5 text-[#0F766E]" />
                <span>MASON-KC-79845</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">
                ✓ Mangalore Locality Verified
              </span>
            </div>
          </div>
        </div>

        {/* Audio Readout Feature for Low-Literacy Labourers */}
        <div className="max-w-[390px] mx-auto w-full pt-1">
          <button
            type="button"
            onClick={handleSpeakCredentials}
            className={`w-full py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              isPlayingAudio
                ? 'bg-amber-400 text-emerald-950 border-amber-300 animate-pulse'
                : isDark
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-[#F59E0B]" />
            <span>{isPlayingAudio ? 'Speaking Card Credentials…' : '🔊 Listen to Work Card Verification (Voice)'}</span>
          </button>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2.5 pt-2 max-w-[390px] mx-auto w-full">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="w-full min-h-[52px] rounded-2xl bg-[#F59E0B] text-[#062420] font-display font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#F59E0B]/30 hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <Share2 className="w-5 h-5 stroke-[2.5]" />
          <span>Share Verified Work Card on WhatsApp</span>
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex-1 py-3 rounded-2xl font-display font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
              isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied Link!' : 'Copy Card Link'}</span>
          </button>
          <button
            type="button"
            onClick={onDone}
            className={`flex-1 py-3 rounded-2xl font-display font-bold text-xs transition-colors text-center ${
              isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
