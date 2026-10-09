import React, { useState } from 'react';
import { ArrowLeft, Home, Volume2 } from 'lucide-react';
import { Language, WorkerProfile, JobState, LiveTrackingSession, CashAgreement, ThemeMode, WorkerTab, MasonJobListing, CreditHistoryItem } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { playSound, speakText } from '../utils/audio';
import { Screen2WorkerSignup } from './Screen2WorkerSignup';
import { Screen3ConfirmProfile } from './Screen3ConfirmProfile';
import { Screen7WorkerHome } from './Screen7WorkerHome';
import { ScreenWorkerContracts } from './ScreenWorkerContracts';
import { ScreenWorkerCredits, INITIAL_CREDIT_HISTORY } from './ScreenWorkerCredits';
import { Screen9WorkCard } from './Screen9WorkCard';
import { WorkerPortalNav } from './WorkerPortalNav';
import { ThemeToggle } from './ThemeToggle';

interface WorkerPortalContainerProps {
  lang: Language;
  workerProfile: WorkerProfile;
  setWorkerProfile: (profile: WorkerProfile) => void;
  pendingJob: JobState | null;
  onAcceptJob: (jobId: number) => void;
  onDeclineJob: () => void;
  onExitPortal: () => void;
  onGoBack: () => void;
  initialMode?: 'hub' | 'signup';
  onUpdateJobTracking?: (tracking: LiveTrackingSession) => void;
  onSaveCashAgreement?: (agreement: CashAgreement) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const WorkerPortalContainer: React.FC<WorkerPortalContainerProps> = ({
  lang,
  workerProfile,
  setWorkerProfile,
  pendingJob,
  onAcceptJob,
  onDeclineJob,
  onExitPortal,
  onGoBack,
  initialMode = 'hub',
  onUpdateJobTracking,
  onSaveCashAgreement,
  theme = 'dark',
  onToggleTheme,
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [currentTab, setCurrentTab] = useState<WorkerTab>('jobs');
  const [isSigningUp, setIsSigningUp] = useState(initialMode === 'signup');
  const [isConfirmingSignup, setIsConfirmingSignup] = useState(false);

  // Shared state for contracts and credit rewards
  const [acceptedListingIds, setAcceptedListingIds] = useState<string[]>([]);
  const [creditPoints, setCreditPoints] = useState<number>(1450);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryItem[]>(INITIAL_CREDIT_HISTORY);
  const [claimedReward, setClaimedReward] = useState<string | null>(null);

  const handleBack = () => {
    playSound('start');
    if (isConfirmingSignup) {
      setIsConfirmingSignup(false);
      setIsSigningUp(true);
    } else if (isSigningUp) {
      setIsSigningUp(false);
      setCurrentTab('jobs');
    } else if (currentTab !== 'jobs') {
      setCurrentTab('jobs');
    } else {
      onGoBack();
    }
  };

  const handleAcceptListing = (listing: MasonJobListing) => {
    playSound('success');
    setAcceptedListingIds((prev) => [...prev, listing.id]);
    // Create a new active job
    const newJobId = Math.floor(Math.random() * 800) + 100;
    onAcceptJob(newJobId);
    // Award bonus credit points
    const bonus = 50;
    setCreditPoints((prev) => prev + bonus);
    setCreditHistory((prev) => [
      {
        id: `ch-listing-${Date.now()}`,
        points: bonus,
        reason: `Earned for accepting direct tender with ${listing.contractorName}`,
        category: 'milestone',
        date: 'Just now',
        badge: 'Contract Sign-on',
      },
      ...prev,
    ]);
  };

  const handleClaimReward = (rewardName: string, requiredPts: number) => {
    if (creditPoints >= requiredPts) {
      playSound('success');
      setClaimedReward(rewardName);
      setCreditPoints((prev) => prev - requiredPts);
      setCreditHistory((prev) => [
        {
          id: `ch-claim-${Date.now()}`,
          points: -requiredPts,
          reason: `Redeemed reward: ${rewardName}`,
          category: 'milestone',
          date: 'Just now',
          badge: 'Reward Redeemed',
        },
        ...prev,
      ]);
    }
  };

  const handleReadAloud = () => {
    if (isSigningUp) {
      speakText(`${t.tell}. ${t.say20}`, lang);
    } else if (currentTab === 'jobs') {
      speakText(`Namaste, ${workerProfile.name}. ${t.free}. ${t.myjobs}.`, lang);
    } else if (currentTab === 'contracts') {
      speakText(`Contractor tenders. 4 open site contracts available for masonry.`, lang);
    } else if (currentTab === 'credits') {
      speakText(`Total trust credits: ${creditPoints}. Redeem for cash bonus and tool kit.`, lang);
    } else if (currentTab === 'card') {
      speakText(`${t.mycard}. ${workerProfile.name}, ${workerProfile.trade}. Trust ${workerProfile.trust_score} out of 100.`, lang);
    } else {
      speakText(`${workerProfile.name}. ${workerProfile.trade}. ${workerProfile.experience_years} years.`, lang);
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-h-screen transition-colors duration-200 ${
      isDark
        ? 'bg-gradient-to-b from-[#062420] via-[#09322c] to-[#041a17] text-white'
        : 'bg-gradient-to-b from-[#EBF5F1] via-[#F3F8F5] to-[#E9F3EE] text-slate-900'
    }`}>
      {/* Worker Portal Header - Responsive width */}
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
                  ? 'text-emerald-200 hover:text-white bg-white/5 hover:bg-white/10'
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
                hello<span className="text-[#F59E0B]">.worker</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} compact />
            )}
            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 bg-amber-400 px-3 py-1 rounded-full hidden sm:inline-block">
              Labourer Hub
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
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Internal Portal Content - Responsive centered container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col overflow-y-auto">
        {isSigningUp ? (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto w-full border backdrop-blur-[12px] transition-all duration-200 ${
            isDark
              ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
              : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
          }`}>
            <Screen2WorkerSignup
              lang={lang}
              theme={theme}
              onProfileCreated={(profile) => {
                setWorkerProfile(profile);
                setIsSigningUp(false);
                setIsConfirmingSignup(true);
              }}
            />
          </div>
        ) : isConfirmingSignup ? (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto w-full border backdrop-blur-[12px] transition-all duration-200 ${
            isDark
              ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
              : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
          }`}>
            <Screen3ConfirmProfile
              lang={lang}
              profile={workerProfile}
              theme={theme}
              onConfirm={() => {
                setIsConfirmingSignup(false);
                setCurrentTab('jobs');
              }}
              onEditVoice={() => {
                setIsConfirmingSignup(false);
                setIsSigningUp(true);
              }}
            />
          </div>
        ) : currentTab === 'jobs' ? (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto w-full border backdrop-blur-[12px] transition-all duration-200 ${
            isDark
              ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
              : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
          }`}>
            <Screen7WorkerHome
              lang={lang}
              profile={workerProfile}
              pendingJob={pendingJob}
              onAcceptJob={onAcceptJob}
              onDeclineJob={onDeclineJob}
              onViewWorkCard={() => setCurrentTab('card')}
              onNavigateTab={setCurrentTab}
              onUpdateJobTracking={onUpdateJobTracking}
              onSaveCashAgreement={onSaveCashAgreement}
              theme={theme}
            />
          </div>
        ) : currentTab === 'contracts' ? (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto w-full border backdrop-blur-[12px] transition-all duration-200 ${
            isDark
              ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
              : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
          }`}>
            <ScreenWorkerContracts
              lang={lang}
              profile={workerProfile}
              acceptedListingIds={acceptedListingIds}
              onAcceptListing={handleAcceptListing}
              theme={theme}
            />
          </div>
        ) : currentTab === 'credits' ? (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl max-w-3xl mx-auto w-full border backdrop-blur-[12px] transition-all duration-200 ${
            isDark
              ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
              : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
          }`}>
            <ScreenWorkerCredits
              lang={lang}
              profile={workerProfile}
              creditPoints={creditPoints}
              creditHistory={creditHistory}
              onClaimReward={handleClaimReward}
              claimedReward={claimedReward}
              onDismissClaimToast={() => setClaimedReward(null)}
              theme={theme}
            />
          </div>
        ) : currentTab === 'card' ? (
          <div className="max-w-md mx-auto w-full py-2">
            <Screen9WorkCard
              lang={lang}
              worker={workerProfile}
              onDone={() => setCurrentTab('jobs')}
              theme={theme}
            />
          </div>
        ) : (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto w-full border backdrop-blur-[12px] transition-all duration-200 ${
            isDark
              ? 'bg-[#07241F]/80 text-white border-emerald-700/60 shadow-emerald-950/40'
              : 'bg-white/80 text-slate-900 border-emerald-100/90 shadow-xl shadow-emerald-900/5'
          }`}>
            <Screen3ConfirmProfile
              lang={lang}
              profile={workerProfile}
              theme={theme}
              onConfirm={() => setCurrentTab('jobs')}
              onEditVoice={() => setIsSigningUp(true)}
            />
          </div>
        )}
      </main>

      {/* Portal Bottom Navigation with 5 Distinct Sections */}
      {!isSigningUp && !isConfirmingSignup && (
        <div className="sticky bottom-0 z-40 w-full">
          <div className="w-full max-w-4xl mx-auto">
            <WorkerPortalNav
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              lang={lang}
              theme={theme}
            />
          </div>
        </div>
      )}
    </div>
  );
};
