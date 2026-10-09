import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle2, Shield, Share2, Clock, X, ArrowRight, AlertTriangle, Banknote, MapPin, Navigation } from 'lucide-react';
import { Language, JobState, LiveTrackingSession, CashAgreement, ThemeMode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { playSound, triggerHaptic, speakText } from '../utils/audio';
import { SafetyTrackerModal } from './SafetyTrackerModal';
import { CashAgreementModal } from './CashAgreementModal';

interface Screen6BookingStatusProps {
  lang: Language;
  job: JobState;
  onJobStatusChange: (status: 'sent' | 'accepted' | 'done') => void;
  onProceedToRating: () => void;
  onCancel: () => void;
  onUpdateJobTracking?: (tracking: LiveTrackingSession) => void;
  onSaveCashAgreement?: (agreement: CashAgreement) => void;
  theme?: ThemeMode;
}

export const Screen6BookingStatus: React.FC<Screen6BookingStatusProps> = ({
  lang,
  job,
  onJobStatusChange,
  onProceedToRating,
  onCancel,
  onUpdateJobTracking,
  onSaveCashAgreement,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [timeLeft, setTimeLeft] = useState(180);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  const defaultTracking: LiveTrackingSession = job.tracking || {
    job_id: job.id,
    lat: 12.8698,
    lon: 74.8430,
    locality: job.area,
    active: true,
    sos_triggered: false,
    emergency_contact: '+91 98450 99887',
    last_ping_time: 'Just now',
    eta_minutes: 8,
  };

  useEffect(() => {
    if (job.status === 'accepted') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const acceptTimer = setTimeout(() => {
      if (job.status === 'sent') {
        playSound('success');
        triggerHaptic([150, 100, 200]);
        speakText(`${job.worker.name} accepted your request. Phone number is now visible.`, lang);
        onJobStatusChange('accepted');
      }
    }, 4500);

    return () => {
      clearInterval(timer);
      clearTimeout(acceptTimer);
    };
  }, [job.status]);

  const handleShareWhatsApp = () => {
    const text = `Hello Job Safety Broadcast: ${job.task} with ${job.worker.name} in ${job.area}. Status: ${job.status.toUpperCase()}. Live Geofence active on Hello.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className={`flex flex-col min-h-full justify-between space-y-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="space-y-4">
        {/* 3-Step Live Timeline Header (iOS Dark Frosted Glass) */}
        <div className={`rounded-3xl p-4 border shadow-md backdrop-blur-[12px] transition-all duration-200 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-emerald-800/80 text-white'
            : 'bg-white/80 border-emerald-200/90 text-slate-900 shadow-emerald-900/5'
        }`}>
          <div className="flex items-center justify-between relative px-4">
            <div className={`absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 -z-0 ${isDark ? 'bg-[#051C18]' : 'bg-slate-200'}`} />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#F59E0B] transition-all duration-500 -z-0"
              style={{
                width: job.status === 'sent' ? '30%' : job.status === 'accepted' ? '80%' : '100%',
              }}
            />
            {/* Step 1: Sent */}
            <div className={`flex flex-col items-center gap-1 z-10 px-2 ${isDark ? 'bg-[#0A2E27]' : 'bg-white'}`}>
              <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#062420] flex items-center justify-center text-xs font-black shadow-sm">
                1
              </div>
              <span className={`text-[11px] font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{t.status_sent}</span>
            </div>
            {/* Step 2: Accepted */}
            <div className={`flex flex-col items-center gap-1 z-10 px-2 ${isDark ? 'bg-[#0A2E27]' : 'bg-white'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors shadow-sm ${
                  job.status === 'accepted' || job.status === 'done'
                    ? 'bg-[#10B981] text-[#062420]'
                    : isDark ? 'bg-[#051C18] text-slate-400 border border-emerald-900' : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                2
              </div>
              <span
                className={`text-[11px] font-bold ${
                  job.status === 'accepted' || job.status === 'done'
                    ? isDark ? 'text-emerald-400' : 'text-emerald-700'
                    : 'text-slate-500'
                }`}
              >
                {t.status_accepted}
              </span>
            </div>
            {/* Step 3: Done */}
            <div className={`flex flex-col items-center gap-1 z-10 px-2 ${isDark ? 'bg-[#0A2E27]' : 'bg-white'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors shadow-sm ${
                  job.status === 'done'
                    ? 'bg-[#10B981] text-[#062420]'
                    : isDark ? 'bg-[#051C18] text-slate-400 border border-emerald-900' : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                3
              </div>
              <span
                className={`text-[11px] font-bold ${
                  job.status === 'done' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : 'text-slate-500'
                }`}
              >
                {t.status_done}
              </span>
            </div>
          </div>
        </div>

        {/* Status Center Card */}
        <div className={`rounded-3xl p-6 border shadow-lg text-center space-y-4 backdrop-blur-[12px] transition-all duration-200 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-emerald-800/80 text-white'
            : 'bg-white/85 border-emerald-200/90 text-slate-900 shadow-emerald-900/5'
        }`}>
          {job.status === 'accepted' ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
              </div>
              <div>
                <h2 className={`font-display font-black text-2xl ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
                  {t.accepted}
                </h2>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                  {job.worker.name} confirmed your task and is on the way.
                </p>
              </div>

              {/* Revealed Phone Number */}
              <div className={`p-4 rounded-2xl border space-y-1 ${
                isDark ? 'bg-[#051C18] border-emerald-700/60' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className={`text-[11px] font-extrabold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  Direct Verified Phone
                </p>
                <p className={`font-display font-black text-2xl sm:text-3xl tracking-wider ${isDark ? 'text-amber-300' : 'text-emerald-950'}`}>
                  {job.phone_revealed || job.worker.phone}
                </p>
              </div>

              <a
                href={`tel:${(job.phone_revealed || job.worker.phone).replace(/\s/g, '')}`}
                onClick={() => playSound('start')}
                className="w-full min-h-[52px] rounded-2xl bg-[#F59E0B] text-[#062420] font-display font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#F59E0B]/20 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <Phone className="w-5 h-5 fill-current" />
                <span>{t.call} {job.worker.name.split(' ')[0]}</span>
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Circular Countdown Progress */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke={isDark ? '#051C18' : '#E2E8F0'}
                    strokeWidth="7"
                    fill="none"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="#F59E0B"
                    strokeWidth="7"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - timeLeft / 180)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <Clock className="w-4 h-4 text-[#F59E0B] mb-0.5" />
                  <span className={`font-display font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {minutes}:{seconds}
                  </span>
                </div>
              </div>

              <div>
                <h3 className={`font-display font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t.sent} {job.worker.name}
                </h3>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                  {t.waiting} • {t.time_limit}
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1 ${
                isDark ? 'bg-[#051C18] border-emerald-900/80' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-slate-700'}`}>
                  <Shield className="w-4 h-4 text-[#F59E0B]" />
                  <span>Number Protected: +91 98••• ••345</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.hidden}</p>
              </div>
            </div>
          )}
        </div>

        {/* TWO HACKATHON FEATURES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Feature 1: Live Job Safety & SOS Geofence Tracker */}
          <button
            type="button"
            onClick={() => {
              playSound('start');
              setShowSafetyModal(true);
            }}
            className={`p-4 rounded-3xl border backdrop-blur-[12px] text-left transition-all active:scale-[0.98] shadow-md flex items-start gap-3 group ${
              isDark
                ? 'bg-gradient-to-br from-[#0B352D]/80 to-[#06241E]/80 border-emerald-700/80 hover:border-emerald-400 text-white'
                : 'bg-white/85 border-emerald-200/90 hover:border-emerald-400 text-slate-900 shadow-emerald-900/5'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className={`font-display font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Live Safety Tracker</p>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                Geofence active • SOS emergency & WhatsApp live map
              </p>
            </div>
          </button>

          {/* Feature 2: Voice-Logged Cash Agreement Note */}
          <button
            type="button"
            onClick={() => {
              playSound('start');
              setShowCashModal(true);
            }}
            className={`p-4 rounded-3xl border backdrop-blur-[12px] text-left transition-all active:scale-[0.98] shadow-md flex items-start gap-3 group ${
              isDark
                ? 'bg-gradient-to-br from-[#12392F]/80 to-[#0A2620]/80 border-amber-600/70 hover:border-amber-400 text-white'
                : 'bg-white/85 border-amber-300/80 hover:border-amber-400 text-slate-900 shadow-emerald-900/5'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <Banknote className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className={`font-display font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Voice Cash Agreement</p>
                {job.cash_agreement && (
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 rounded font-bold">
                    ₹{job.cash_agreement.agreed_price}
                  </span>
                )}
              </div>
              <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                AI voice handshake • Locks agreed inspection price
              </p>
            </div>
          </button>
        </div>

        {/* Job Details Card */}
        <div className={`rounded-3xl p-4.5 border shadow-md space-y-1.5 backdrop-blur-[12px] transition-all duration-200 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-emerald-800/80 text-white'
            : 'bg-white/80 border-emerald-200/90 text-slate-900 shadow-emerald-900/5'
        }`}>
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-emerald-300/80' : 'text-slate-500'}`}>
            <span className={`font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>Task Summary</span>
            <span className={`font-mono font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>JOB #{job.id}</span>
          </div>
          <p className={`font-display font-bold text-lg leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {job.task}
          </p>
          <div className={`text-xs font-medium ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
            {job.when} • {job.area}
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2.5 pt-2">
        {job.status === 'accepted' ? (
          <button
            type="button"
            onClick={() => {
              playSound('start');
              onProceedToRating();
            }}
            className="w-full min-h-[56px] rounded-2xl bg-[#F59E0B] text-[#062420] font-display font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#F59E0B]/25 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <span>{t.done_job}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              playSound('success');
              onJobStatusChange('accepted');
            }}
            className="w-full py-2.5 text-xs font-black text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 rounded-xl transition-colors border border-amber-400/30"
          >
            ⚡ Demo Shortcut: Simulate Worker Accept Now
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 rounded-2xl text-emerald-300/70 hover:text-white font-bold text-xs transition-colors text-center"
        >
          {t.cancel}
        </button>
      </div>

      {/* Modals for Feature 1 and Feature 2 */}
      {showSafetyModal && (
        <SafetyTrackerModal
          lang={lang}
          jobId={job.id}
          workerName={job.worker.name}
          destinationArea={job.area}
          tracking={defaultTracking}
          onUpdateTracking={(updated) => {
            if (onUpdateJobTracking) onUpdateJobTracking(updated);
          }}
          onClose={() => setShowSafetyModal(false)}
        />
      )}

      {showCashModal && (
        <CashAgreementModal
          lang={lang}
          jobId={job.id}
          initialTask={job.task}
          existingAgreement={job.cash_agreement}
          onSaveAgreement={(agreement) => {
            if (onSaveCashAgreement) onSaveCashAgreement(agreement);
          }}
          onClose={() => setShowCashModal(false)}
        />
      )}
    </div>
  );
};
