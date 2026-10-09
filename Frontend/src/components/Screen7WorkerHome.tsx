import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, Shield, ArrowRight, Zap, Briefcase, Sparkles, MapPin,
  Award, Banknote, AlertTriangle, Building2, Coins, ChevronRight
} from 'lucide-react';
import { Language, WorkerProfile, JobState, LiveTrackingSession, CashAgreement, ThemeMode, WorkerTab } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { playSound, triggerHaptic, speakText } from '../utils/audio';
import { SafetyTrackerModal } from './SafetyTrackerModal';
import { CashAgreementModal } from './CashAgreementModal';

interface Screen7WorkerHomeProps {
  lang: Language;
  profile: WorkerProfile;
  pendingJob: JobState | null;
  onAcceptJob: (jobId: number) => void;
  onDeclineJob: (jobId: number) => void;
  onViewWorkCard: () => void;
  onNavigateTab?: (tab: WorkerTab) => void;
  onUpdateJobTracking?: (tracking: LiveTrackingSession) => void;
  onSaveCashAgreement?: (agreement: CashAgreement) => void;
  theme?: ThemeMode;
}

export const Screen7WorkerHome: React.FC<Screen7WorkerHomeProps> = ({
  lang,
  profile,
  pendingJob,
  onAcceptJob,
  onDeclineJob,
  onViewWorkCard,
  onNavigateTab,
  onUpdateJobTracking,
  onSaveCashAgreement,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [isFreeToday, setIsFreeToday] = useState(true);
  const [acceptedJobs, setAcceptedJobs] = useState<JobState[]>([]);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  useEffect(() => {
    if (pendingJob && pendingJob.status === 'sent') {
      playSound('alert');
      triggerHaptic([200, 100, 200, 100, 300]);
      speakText(`${t.newjob}. ${pendingJob.task}, 0.8 km, ${pendingJob.when}`, lang);
    }
  }, [pendingJob]);

  const handleAccept = (job: JobState) => {
    playSound('success');
    triggerHaptic([150, 100, 150]);
    setAcceptedJobs((prev) => [job, ...prev]);
    onAcceptJob(job.id);
  };

  const handleDecline = (job: JobState) => {
    playSound('stop');
    onDeclineJob(job.id);
  };

  const activeJob = pendingJob?.status === 'accepted' ? pendingJob : acceptedJobs[0];
  const defaultTracking: LiveTrackingSession = activeJob?.tracking || {
    job_id: activeJob?.id || 102,
    lat: 12.8698,
    lon: 74.8430,
    locality: activeJob?.area || 'Kankanady',
    active: true,
    sos_triggered: false,
    emergency_contact: '+91 98450 99887',
    last_ping_time: 'Just now',
    eta_minutes: 8,
  };

  return (
    <div className={`flex flex-col min-h-full justify-between space-y-6 ${isDark ? 'text-white' : 'text-slate-900'} pb-6`}>
      <div className="space-y-6">
        {/* Worker Header & Profile Summary */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-[#F59E0B] border border-amber-400/30">
                Grade-A Master Mason (राज मिस्त्री)
              </span>
            </div>
            <h2 className={`font-display font-black text-2xl sm:text-3xl mt-1 ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
              Namaste, {profile.name || 'Ravi Kumar'}
            </h2>
            <div className={`text-xs font-semibold flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
              <span className="font-bold text-[#F59E0B]">
                Mason & Concrete Specialist
              </span>
              <span aria-hidden="true" className={isDark ? 'text-emerald-700' : 'text-slate-300'}>•</span>
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Trust {profile.trust_score || 84}/100
              </span>
              <span aria-hidden="true" className={isDark ? 'text-emerald-700' : 'text-slate-300'}>•</span>
              <span>{profile.jobs_done || 54} shifts verified</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] via-amber-400 to-amber-600 text-[#062420] font-display font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300 shrink-0">
            {(profile.name || 'R')[0]}
          </div>
        </div>

        {/* Big Tactile "I am free today" Availability Toggle */}
        <div className={`p-4 rounded-3xl border shadow-md flex items-center justify-between backdrop-blur-[12px] transition-all duration-200 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-emerald-800/80'
            : 'bg-white/80 border-emerald-200/90 shadow-emerald-900/5'
        }`}>
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                isFreeToday ? 'bg-emerald-400 shadow-[0_0_10px_#10B981]' : 'bg-slate-600'
              }`}
            />
            <div>
              <p className={`font-display font-extrabold text-lg leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.free} (Mason Daily Shift)
              </p>
              <p className={`text-xs font-medium ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                {isFreeToday ? 'Broadcasting live availability to active site contractors' : 'Shift availability paused'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFreeToday(!isFreeToday);
              playSound('start');
              triggerHaptic([80]);
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              isFreeToday ? 'bg-[#0F766E]' : 'bg-slate-700'
            }`}
            title="Toggle daily shift availability"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                isFreeToday ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Quick Portal Switcher Cards for Contracts & Credits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              playSound('start');
              if (onNavigateTab) onNavigateTab('contracts');
            }}
            className={`p-4 rounded-3xl border text-left flex items-center justify-between transition-all active:scale-[0.98] shadow-sm hover:border-amber-400 ${
              isDark ? 'bg-[#093028]/80 border-emerald-700/60' : 'bg-white/90 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-[#F59E0B] flex items-center justify-center border border-amber-400/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-display font-extrabold text-sm block">Contractor Tenders</span>
                <span className="text-[11px] text-slate-400 font-medium">4 Open Site Contracts →</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('start');
              if (onNavigateTab) onNavigateTab('credits');
            }}
            className={`p-4 rounded-3xl border text-left flex items-center justify-between transition-all active:scale-[0.98] shadow-sm hover:border-emerald-400 ${
              isDark ? 'bg-[#093028]/80 border-emerald-700/60' : 'bg-white/90 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="font-display font-extrabold text-sm block">Rewards & Credits</span>
                <span className="text-[11px] text-emerald-400 font-bold">1,450 Pts (₹725) →</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Live Incoming Job Alert Card (if any pending dispatch) */}
        {pendingJob && pendingJob.status === 'sent' && (
          <div className={`p-5 rounded-3xl shadow-2xl border-2 border-[#F59E0B] backdrop-blur-[12px] animate-alert-strobe space-y-3 ${
            isDark ? 'bg-[#082823]/85 text-white' : 'bg-amber-50/90 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-[#F59E0B] uppercase tracking-wider">
                <Bell className="w-4 h-4 animate-bounce" />
                {t.newjob} (Masonry Urgent)
              </span>
              <span className="text-[11px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                Direct Contractor Call
              </span>
            </div>
            <div>
              <h3 className={`font-display font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {pendingJob.task}
              </h3>
              <p className={`text-xs mt-1 flex items-center gap-2 ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
                <span>📍 0.8 km ({pendingJob.area})</span>
                <span>•</span>
                <span>⏰ {pendingJob.when}</span>
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAccept(pendingJob)}
                className="flex-1 min-h-[50px] rounded-2xl bg-[#F59E0B] text-[#062420] font-display font-black text-base hover:brightness-105 active:scale-95 transition-all shadow-md shadow-[#F59E0B]/20"
              >
                {t.accept}
              </button>
              <button
                type="button"
                onClick={() => handleDecline(pendingJob)}
                className={`px-5 min-h-[50px] rounded-2xl font-display font-bold text-sm active:scale-95 transition-all ${
                  isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                {t.notnow}
              </button>
            </div>
          </div>
        )}

        {/* WORKER SAFETY & CASH TOOLS */}
        {activeJob && (
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
                  ? 'bg-[#0B352D]/80 border-emerald-700/80 hover:border-emerald-400 text-white'
                  : 'bg-white/85 border-emerald-200/90 hover:border-emerald-400 text-slate-900 shadow-emerald-900/5'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`font-display font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Solo Worker Safety Net</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                  Share live location with family & panic SOS trigger
                </p>
              </div>
            </button>

            {/* Feature 2: Voice Cash Agreement Note */}
            <button
              type="button"
              onClick={() => {
                playSound('start');
                setShowCashModal(true);
              }}
              className={`p-4 rounded-3xl border backdrop-blur-[12px] text-left transition-all active:scale-[0.98] shadow-md flex items-start gap-3 group ${
                isDark
                  ? 'bg-[#12392F]/80 border-amber-600/70 hover:border-amber-400 text-white'
                  : 'bg-white/85 border-amber-300/80 hover:border-amber-400 text-slate-900 shadow-emerald-900/5'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Banknote className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`font-display font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Log Wage Agreement</p>
                  {activeJob.cash_agreement && (
                    <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 rounded font-bold">
                      ₹{activeJob.cash_agreement.agreed_price}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                  Speak agreed daily wage to lock dispute-free receipt
                </p>
              </div>
            </button>
          </div>
        )}

        {/* My Active Jobs & Confirmed Schedule */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.myjobs} & Confirmed Sites
            </h3>
            <span className={`text-xs font-bold ${isDark ? 'text-emerald-300/70' : 'text-slate-500'}`}>
              Active Schedule
            </span>
          </div>
          {acceptedJobs.length === 0 && (!pendingJob || pendingJob.status !== 'accepted') ? (
            <div className={`p-5 rounded-3xl border backdrop-blur-[12px] shadow-sm text-sm ${
              isDark ? 'bg-[#0A2E27]/80 border-emerald-800/80 text-emerald-200/70' : 'bg-white/80 border-emerald-200/90 text-slate-600'
            }`}>
              {t.nojobs}
            </div>
          ) : (
            <div className="space-y-2.5">
              {(pendingJob?.status === 'accepted' ? [pendingJob, ...acceptedJobs] : acceptedJobs).map(
                (j, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-3xl border backdrop-blur-[12px] shadow-md space-y-1.5 ${
                      isDark ? 'bg-[#0A2E27]/80 border-emerald-600/60' : 'bg-white/85 border-emerald-200/90 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {j.task}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Site Dispatched
                      </span>
                    </div>
                    <p className={`text-xs font-medium ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                      {j.area} • {j.when}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Action: View Work Card */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            playSound('start');
            onViewWorkCard();
          }}
          className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-emerald-600 via-[#0F766E] to-emerald-700 hover:brightness-105 text-white font-display font-black text-lg border border-emerald-400/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/20"
        >
          <Award className="w-5 h-5 text-[#F59E0B]" />
          <span>View Verified Mason Work Card (QR Pass)</span>
        </button>
      </div>

      {/* Modals for Feature 1 and Feature 2 */}
      {showSafetyModal && (
        <SafetyTrackerModal
          lang={lang}
          jobId={defaultTracking.job_id}
          workerName={profile.name}
          destinationArea={defaultTracking.locality}
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
          jobId={defaultTracking.job_id}
          initialTask={activeJob?.task || 'Masonry brickwork & wall plastering'}
          existingAgreement={activeJob?.cash_agreement}
          onSaveAgreement={(agreement) => {
            if (onSaveCashAgreement) onSaveCashAgreement(agreement);
          }}
          onClose={() => setShowCashModal(false)}
        />
      )}
    </div>
  );
};
