import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, CheckCircle, Zap, Star, AlertCircle, ArrowRight, Info, X } from 'lucide-react';
import { Language, CustomerRequest, MatchedWorker, ThemeMode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { SEEDED_WORKERS, TRADES } from '../data/taxonomy';
import { playSound } from '../utils/audio';

interface Screen5MatchesProps {
  lang: Language;
  request: CustomerRequest;
  onBookWorker: (worker: MatchedWorker) => void;
  theme?: ThemeMode;
}

export const Screen5Matches: React.FC<Screen5MatchesProps> = ({
  lang,
  request,
  onBookWorker,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<MatchedWorker[]>([]);
  const [isWidened, setIsWidened] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const tradeDef = TRADES.find((tr) => tr.id === request.trade) || TRADES[0];
  const priceMultiplier = request.urgency === 'now' ? 1 + tradeDef.priceRange[2] : 1;
  const priceLow = Math.round(tradeDef.priceRange[0] * priceMultiplier);
  const priceHigh = Math.round(tradeDef.priceRange[1] * priceMultiplier);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const list = SEEDED_WORKERS[request.trade] || SEEDED_WORKERS.mason || SEEDED_WORKERS.electrician;
      setWorkers(list);
      setLoading(false);
      playSound('success');
    }, 500);
    return () => clearTimeout(timer);
  }, [request.trade]);

  const handleWiden = () => {
    setIsWidened(true);
    playSound('start');
  };

  return (
    <div className={`flex flex-col min-h-full justify-between space-y-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="space-y-4">
        {/* Fair Price & Summary Card (iOS Dark Emerald Glass) */}
        <div className={`rounded-3xl p-5 border shadow-md space-y-3 backdrop-blur-[12px] transition-all duration-200 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-emerald-800/80 text-white'
            : 'bg-white/80 border-emerald-200/90 text-slate-900 shadow-emerald-900/5'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`font-display font-black text-2xl capitalize ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
                {tradeDef.label}s near {request.area}
              </h2>
              <p className={`text-xs font-medium ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                Task: {request.task}
              </p>
            </div>
            {request.urgency === 'now' && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-[#F59E0B] border border-amber-400/30 flex items-center gap-1 shrink-0">
                <Zap className="w-3.5 h-3.5" />
                Urgent
              </span>
            )}
          </div>

          {/* Typical Fair Price Banner */}
          <div className={`flex items-center justify-between p-4 rounded-2xl border ${
            isDark ? 'bg-[#051C18]/90 border-emerald-700/60' : 'bg-emerald-50/90 border-emerald-200'
          }`}>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                {t.typical}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Seed benchmark rate</span>
            </div>
            <div className="text-right">
              <span className={`font-display font-black text-3xl ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                ₹{priceLow} - ₹{priceHigh}
              </span>
            </div>
          </div>
        </div>

        {/* Explainability formula link button */}
        <div className="flex items-center justify-between px-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300/80' : 'text-slate-500'}`}>
            Ranked by Smart Trust Engine
          </span>
          <button
            type="button"
            onClick={() => setShowFormulaModal(true)}
            className="text-xs font-bold text-[#F59E0B] hover:underline flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Why #1 ranked?</span>
          </button>
        </div>

        {/* Worker Cards or Skeleton Loader */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`rounded-3xl p-5 border shadow-md space-y-3 animate-pulse backdrop-blur-[12px] ${
                  isDark ? 'bg-[#0A2E27]/50 border-emerald-800/40' : 'bg-white/60 border-emerald-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-emerald-950' : 'bg-slate-200'}`} />
                  <div className="space-y-2 flex-1">
                    <div className={`h-4 rounded w-1/2 ${isDark ? 'bg-emerald-950' : 'bg-slate-200'}`} />
                    <div className={`h-3 rounded w-1/3 ${isDark ? 'bg-emerald-950' : 'bg-slate-200'}`} />
                  </div>
                  <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-emerald-950' : 'bg-slate-200'}`} />
                </div>
                <div className={`h-10 rounded-2xl w-full ${isDark ? 'bg-emerald-950' : 'bg-slate-200'}`} />
              </div>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className={`rounded-3xl p-6 border text-center space-y-4 backdrop-blur-[12px] ${
            isDark ? 'bg-[#0A2E27]/80 border-emerald-800 text-white' : 'bg-white/80 border-emerald-200 text-slate-800'
          }`}>
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="font-bold">{t.nomatch}</p>
            <button
              type="button"
              onClick={handleWiden}
              className="px-5 py-3 rounded-2xl bg-[#0F766E] text-white font-bold text-sm"
            >
              {t.widen}
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {workers.map((worker, index) => {
              const isBest = index === 0;
              return (
                <div
                  key={worker.id}
                  className={`relative rounded-3xl p-5 border backdrop-blur-[12px] transition-all duration-200 shadow-md ${
                    isDark ? 'bg-[#0A2E27]/80' : 'bg-white/85 shadow-emerald-900/5'
                  } ${
                    isBest
                      ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/30 shadow-amber-500/10'
                      : isDark ? 'border-emerald-800/80' : 'border-emerald-200/90'
                  }`}
                >
                  {isBest && (
                    <div className="absolute top-0 right-0 bg-[#F59E0B] text-[#062420] font-display font-black text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-bl-2xl rounded-tr-3xl shadow-sm">
                      {t.best}
                    </div>
                  )}

                  {/* Worker Row */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] via-amber-400 to-amber-600 text-[#062420] font-display font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                      {worker.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-display font-black text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {worker.name}
                      </h3>
                      {/* Zero-Pill Unboxed Metadata */}
                      <div className={`text-xs font-medium flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                        <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {worker.stars}
                        </span>
                        <span aria-hidden="true" className={isDark ? 'text-emerald-700' : 'text-slate-300'}>•</span>
                        <span>{worker.jobs} jobs</span>
                        <span aria-hidden="true" className={isDark ? 'text-emerald-700' : 'text-slate-300'}>•</span>
                        <span>{worker.distance_km} km away</span>
                      </div>
                    </div>

                    {/* Circular Trust Score Ring */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-12 h-12 -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="#051C18"
                          strokeWidth="3.5"
                          fill="none"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="#10B981"
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 * (1 - worker.trust / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="font-display font-black text-xs text-emerald-300 leading-none">
                          {worker.trust}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reasons & Availability - Clean unboxed text with bullets */}
                  <div className="text-xs text-emerald-200/80 font-medium my-3 flex items-center flex-wrap gap-1.5">
                    <span className="text-[#F59E0B] font-bold">• {worker.free}</span>
                    <span aria-hidden="true" className="text-emerald-700">•</span>
                    <span>{worker.reasons.join(' • ')}</span>
                  </div>

                  {/* Book & Masked Call CTAs */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onBookWorker(worker)}
                      className="flex-1 min-h-[48px] rounded-2xl bg-[#0F766E] hover:bg-teal-600 text-white font-display font-black text-base active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#0F766E]/20"
                    >
                      <span>{t.book} {worker.name.split(' ')[0]}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('start');
                        alert('Phone number stays masked until booking is accepted.');
                      }}
                      className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center shrink-0 transition-colors border border-white/10"
                      title={t.hidden}
                    >
                      <Phone className="w-5 h-5 text-emerald-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formula Transparency Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#07241F] rounded-3xl p-6 border border-emerald-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-lg text-white">
                Transparent Smart Match
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Every worker is ranked by a published, explainable formula no black-box bias.
            </p>
            <div className="bg-[#031512] p-4 rounded-2xl border border-emerald-900 text-xs font-mono space-y-2 text-emerald-100">
              <p className="font-bold text-[#F59E0B]">Score = 0.926 (Rank #1)</p>
              <div className="border-t border-emerald-900/80 pt-2 space-y-1 text-[11px] text-emerald-300/80">
                <p>• Skill Match (35%): 1.00 × 0.35 = 0.350</p>
                <p>• Proximity (20%): 0.90 × 0.20 = 0.180</p>
                <p>• Trust Score (20%): 0.78 × 0.20 = 0.156</p>
                <p>• Availability (15%): 1.00 × 0.15 = 0.150</p>
                <p>• Responsiveness (10%): 0.90 × 0.10 = 0.090</p>
              </div>
            </div>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#F59E0B] text-[#062420] font-black text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
