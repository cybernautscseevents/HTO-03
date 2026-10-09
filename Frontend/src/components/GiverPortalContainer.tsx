import React, { useState } from 'react';
import { ArrowLeft, Volume2, PlusCircle, Search, Star, Home } from 'lucide-react';
import { Language, CustomerProfile, CustomerRequest, JobState, MatchedWorker, RatingSubmission, GiverTab, LiveTrackingSession, CashAgreement, ThemeMode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { playSound, speakText } from '../utils/audio';
import { GiverPortalNav } from './GiverPortalNav';
import { Screen4CustomerRequest } from './Screen4CustomerRequest';
import { ScreenContractorVacancies } from './ScreenContractorVacancies';
import { Screen5Matches } from './Screen5Matches';
import { Screen6BookingStatus } from './Screen6BookingStatus';
import { Screen8Rating } from './Screen8Rating';
import { ThemeToggle } from './ThemeToggle';

interface GiverPortalContainerProps {
  lang: Language;
  giverProfile: CustomerProfile;
  customerRequest: CustomerRequest;
  setCustomerRequest: (req: CustomerRequest) => void;
  currentJob: JobState | null;
  onBookWorker: (worker: MatchedWorker) => void;
  onJobStatusChange: (status: 'sent' | 'accepted' | 'done') => void;
  onSubmitRating: (sub: RatingSubmission) => void;
  onCancelJob: () => void;
  onExitPortal: () => void;
  onGoBack: () => void;
  onUpdateJobTracking?: (tracking: LiveTrackingSession) => void;
  onSaveCashAgreement?: (agreement: CashAgreement) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const GiverPortalContainer: React.FC<GiverPortalContainerProps> = ({
  lang,
  giverProfile,
  customerRequest,
  setCustomerRequest,
  currentJob,
  onBookWorker,
  onJobStatusChange,
  onSubmitRating,
  onCancelJob,
  onExitPortal,
  onGoBack,
  onUpdateJobTracking,
  onSaveCashAgreement,
  theme = 'dark',
  onToggleTheme,
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [currentTab, setCurrentTab] = useState<GiverTab>('request');

  const handleBack = () => {
    playSound('start');
    if (currentTab === 'history') {
      setCurrentTab('matches');
    } else if (currentTab === 'matches') {
      setCurrentTab('vacancies');
    } else if (currentTab === 'vacancies') {
      setCurrentTab('request');
    } else {
      onGoBack();
    }
  };

  const handleReadAloud = () => {
    if (currentTab === 'request') {
      speakText('Contractor Client Registration. Specify your company and labour requirements.', lang);
    } else if (currentTab === 'vacancies') {
      speakText('Site vacancies and labour applicants. Review worker profiles and accept daily shifts.', lang);
    } else if (currentTab === 'matches') {
      if (currentJob?.status === 'accepted') {
        speakText(`${t.accepted}. Call ${currentJob.worker.name}.`, lang);
      } else if (currentJob) {
        speakText(`${t.sent} ${currentJob.worker.name}. ${t.waiting}.`, lang);
      } else {
        speakText(`Verified workers near ${customerRequest.area}. ${t.typical} price shown.`, lang);
      }
    } else {
      speakText(`${t.how}. ${t.tap_stars}.`, lang);
    }
  };

  const handleRequestSubmitted = (req: CustomerRequest) => {
    setCustomerRequest(req);
    setCurrentTab('vacancies');
  };

  return (
    <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-200 ${
      isDark
        ? 'bg-gradient-to-b from-[#062420] via-[#09322c] to-[#041a17] text-white'
        : 'bg-gradient-to-b from-[#EBF5F1] via-[#F3F8F5] to-[#E9F3EE] text-slate-900'
    }`}>
      {/* Work-Giver Portal Header - Responsive width */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-[12px] border-b transition-colors duration-200 ${
        isDark ? 'bg-[#062420]/80 border-emerald-900/60' : 'bg-white/80 border-emerald-100/90 shadow-2xs'
      }`}>
        <div className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Back Arrow Option (goes to previous page / step) */}
            <button
              type="button"
              onClick={handleBack}
              className={`text-xs sm:text-sm font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 ${
                isDark
                  ? 'text-teal-200 hover:text-white bg-white/5 hover:bg-white/10'
                  : 'text-slate-700 hover:text-slate-900 bg-emerald-50 hover:bg-emerald-100'
              }`}
              title="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>{t.back}</span>
            </button>
            {/* Overview Link */}
            <button
              type="button"
              onClick={onExitPortal}
              className={`text-xs font-semibold flex items-center gap-1 px-2 py-1.5 rounded-xl transition-colors ${
                isDark
                  ? 'text-emerald-300/70 hover:text-emerald-200 hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Go to main overview"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <div className="flex items-baseline gap-1 select-none">
              <span className={`font-display font-black text-xl sm:text-2xl tracking-tight lowercase ${
                isDark ? 'text-white' : 'text-[#06332A]'
              }`}>
                hello<span className="text-[#0F766E]">.contractor</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} compact />
            )}
            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full hidden sm:inline-block ${
              isDark ? 'text-teal-300 bg-teal-950/80 border border-teal-800/80' : 'text-teal-900 bg-teal-100'
            }`}>
              Contractor Portal
            </span>
            <button
              type="button"
              onClick={handleReadAloud}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900 border-emerald-800'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
              }`}
              title="Read Aloud"
            >
              <Volume2 className="w-4 h-4 text-[#F59E0B]" />
            </button>
          </div>
        </div>
      </header>

      {/* Internal Portal Content - Responsive centered container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          {currentTab === 'request' ? (
            <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-[12px] transition-all duration-200 ${
              isDark
                ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
                : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
            }`}>
              <Screen4CustomerRequest
                lang={lang}
                onRequestSubmitted={handleRequestSubmitted}
                theme={theme}
              />
            </div>
          ) : currentTab === 'vacancies' ? (
            <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-[12px] transition-all duration-200 ${
              isDark
                ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
                : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
            }`}>
              <ScreenContractorVacancies
                lang={lang}
                theme={theme}
              />
            </div>
          ) : currentTab === 'matches' ? (
            currentJob ? (
              <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-[12px] transition-all duration-200 ${
                isDark
                  ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
                  : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
              }`}>
                <Screen6BookingStatus
                  lang={lang}
                  job={currentJob}
                  onJobStatusChange={onJobStatusChange}
                  onProceedToRating={() => setCurrentTab('history')}
                  onCancel={onCancelJob}
                  onUpdateJobTracking={onUpdateJobTracking}
                  onSaveCashAgreement={onSaveCashAgreement}
                  theme={theme}
                />
              </div>
            ) : (
              <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-[12px] transition-all duration-200 ${
                isDark
                  ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
                  : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
              }`}>
                <Screen5Matches
                  lang={lang}
                  request={customerRequest}
                  onBookWorker={onBookWorker}
                  theme={theme}
                />
              </div>
            )
          ) : (
            <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-[12px] transition-all duration-200 ${
              isDark
                ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
                : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
            }`}>
              <Screen8Rating
                workerName={currentJob?.worker.name || 'Ravi Kumar'}
                workerId={currentJob?.worker.id || 7}
                jobId={currentJob?.id || 101}
                onSubmitRating={(sub) => {
                  onSubmitRating(sub);
                  setCurrentTab('vacancies');
                }}
                lang={lang}
                theme={theme}
              />
            </div>
          )}
        </div>
      </main>

      {/* Portal Bottom Navigation */}
      <div className="sticky bottom-0 z-40 w-full">
        <div className="w-full max-w-4xl mx-auto">
          <GiverPortalNav
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            lang={lang}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};
