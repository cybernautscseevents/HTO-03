import React, { useState } from 'react';
import { Language, ThemeMode, ScreenId, PortalMode, WorkerProfile, CustomerProfile, CustomerRequest, JobState, MatchedWorker, RatingSubmission } from './types';
import { TRANSLATIONS } from './data/translations';
import { SEEDED_WORKERS, calculateTrustScore } from './data/taxonomy';
import { playSound, speakText, triggerHaptic } from './utils/audio';
import { ScreenOverview } from './components/ScreenOverview';
import { ScreenWorkerAuth } from './components/ScreenWorkerAuth';
import { ScreenGiverAuth } from './components/ScreenGiverAuth';
import { WorkerPortalContainer } from './components/WorkerPortalContainer';
import { GiverPortalContainer } from './components/GiverPortalContainer';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('hello_lang') as Language) || 'en';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('hello_theme') as ThemeMode) || 'dark';
  });

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('hello_theme', next);
  };
  const isDark = theme === 'dark';

  // Portal routing state: 'overview' | 'worker-auth' | 'worker' | 'giver-auth' | 'giver'
  const [route, setRoute] = useState<'overview' | 'worker-auth' | 'worker' | 'giver-auth' | 'giver'>('overview');
  const [workerInitialMode, setWorkerInitialMode] = useState<'hub' | 'signup'>('hub');

  // Saved worker profile
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile>(() => {
    const saved = localStorage.getItem('hello_worker_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.trade === 'electrician') {
          p.trade = 'mason';
          p.skills = ['Brickwork', 'Wall Plastering', 'Tile Laying', 'Foundation Casting', 'Level Alignment'];
          p.rate_note = '₹850 - ₹1,100 per day / shift';
        }
        return p;
      } catch {}
    }
    return {
      id: 7,
      name: 'Ravi Kumar',
      trade: 'mason',
      experience_years: 8,
      areas: ['Kankanady', 'Bejai'],
      skills: ['Brickwork', 'Wall Plastering', 'Tile Laying', 'Foundation Casting', 'Level Alignment'],
      rate_note: '₹850 - ₹1,100 per day / shift',
      phone: '+91 98450 12345',
      trust_score: 84,
      jobs_done: 54,
      stars: 4.8,
      rehire_pct: 94,
      verified: true,
      free_today: true,
      missing: [],
      created_at: '2026-09-15',
    };
  });

  // Saved contractor client profile
  const [giverProfile, setGiverProfile] = useState<CustomerProfile>(() => {
    const saved = localStorage.getItem('hello_giver_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.name && (p.name.includes('Site In-Charge') || p.name.includes('Household') || !p.name.includes('Shenoy Infra'))) {
          p.name = 'Priya Shenoy (Civil Contractor - Shenoy Infra)';
          p.company_name = 'Shenoy Infra & Civil Projects';
          p.license_number = 'MNG/CIVIL/2024/782';
        }
        return p;
      } catch {}
    }
    return {
      id: 101,
      name: 'Priya Shenoy (Civil Contractor - Shenoy Infra)',
      phone: '+91 98459 88776',
      area: 'Kadri',
      company_name: 'Shenoy Infra & Civil Projects',
      license_number: 'MNG/CIVIL/2024/782',
      bookings_count: 5,
      saved_at: '2026-10-01',
    };
  });

  const [customerRequest, setCustomerRequest] = useState<CustomerRequest>({
    request_id: 101,
    trade: 'mason',
    task: 'Compound wall brickwork & exterior plastering',
    urgency: 'today',
    when: 'Tomorrow 8 AM - 5 PM Shift',
    area: 'Kankanady',
    transcript: 'Need 2 experienced masons for compound wall brickwork and plastering at Kadri site',
  });

  const [currentJob, setCurrentJob] = useState<JobState | null>(null);
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null);

  const handleSelectLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('hello_lang', newLang);
    document.documentElement.lang = newLang;
  };

  const showToast = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const handleBookWorker = (worker: MatchedWorker) => {
    const jobId = Math.floor(Math.random() * 800) + 200;
    const newJob: JobState = {
      id: jobId,
      request_id: customerRequest.request_id,
      task: customerRequest.task,
      trade: customerRequest.trade,
      area: customerRequest.area,
      when: customerRequest.when,
      urgency: customerRequest.urgency,
      worker,
      status: 'sent',
      phone_revealed: null,
      created_at: Date.now(),
      shared_with_contact: false,
      tracking: {
        job_id: jobId,
        lat: 12.8698,
        lon: 74.8430,
        locality: customerRequest.area || 'Kankanady',
        active: true,
        sos_triggered: false,
        emergency_contact: '+91 98450 99887',
        last_ping_time: 'Just now',
        eta_minutes: 8,
      },
    };
    setCurrentJob(newJob);
    playSound('start');
  };

  const handleWorkerAcceptJob = (jobId: number) => {
    if (currentJob && currentJob.id === jobId) {
      const updatedTracking = {
        ...(currentJob.tracking || {
          job_id: jobId,
          lat: 12.8698,
          lon: 74.8430,
          locality: currentJob.area,
          sos_triggered: false,
          emergency_contact: '+91 98450 99887',
          eta_minutes: 8,
        }),
        active: true,
        last_ping_time: 'Session Activated',
      };
      setCurrentJob({
        ...currentJob,
        status: 'accepted',
        phone_revealed: currentJob.worker.phone,
        tracking: updatedTracking,
      });
      showToast('Job confirmed! Live safety tracker & agreement session initiated.');
    }
  };

  const handleUpdateJobTracking = (updatedTracking: any) => {
    if (currentJob) {
      setCurrentJob({
        ...currentJob,
        tracking: updatedTracking,
      });
      if (updatedTracking.sos_triggered) {
        showToast('SOS Incident Alert Triggered! Emergency contact alerted.', true);
      } else {
        showToast('Live GPS safety telemetry updated.');
      }
    }
  };

  const handleSaveCashAgreement = (agreement: any) => {
    if (currentJob) {
      setCurrentJob({
        ...currentJob,
        cash_agreement: agreement,
      });
      showToast(`Verified Cash Agreement locked for ₹${agreement.agreed_price}!`);
    }
  };

  const handleSubmitRating = (submission: RatingSubmission) => {
    const newScore = calculateTrustScore({
      phoneVerified: true,
      partnerVerified: false,
      stars: submission.stars,
      ratingsCount: 4,
      repeatHireRate: submission.rehire ? 0.95 : 0.8,
      noShows: 0,
      hasPhoto: true,
      hasSkills: true,
      hasArea: true,
      hasRateNote: true,
    });
    const updated = {
      ...workerProfile,
      trust_score: newScore,
      jobs_done: workerProfile.jobs_done + 1,
      stars: Number(((workerProfile.stars * 4 + submission.stars) / 5).toFixed(1)),
    };
    setWorkerProfile(updated);
    localStorage.setItem('hello_worker_profile', JSON.stringify(updated));
    showToast(TRANSLATIONS[lang].thanks);
  };

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-[#031512] text-white' : 'bg-[#F3F7F5] text-slate-900'
    } flex flex-col font-sans selection:bg-[#F59E0B]/30 antialiased transition-colors duration-200`}>
      {/* Main Viewport Container */}
      <div className="flex-1 w-full flex flex-col">
        {/* 1. Overview Landing Screen */}
        {route === 'overview' && (
          <div className={`flex-1 w-full ${
            isDark
              ? 'bg-gradient-to-b from-[#062420] via-[#09322c] to-[#041a17]'
              : 'bg-gradient-to-b from-[#EBF5F1] via-[#F3F8F5] to-[#E9F3EE]'
          }`}>
            <ScreenOverview
              lang={lang}
              onSelectLang={handleSelectLang}
              onEnterWorkerPortal={() => setRoute('worker-auth')}
              onEnterGiverPortal={() => setRoute('giver-auth')}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />
          </div>
        )}

        {/* 2. Worker Portal Entry / Login Screen */}
        {route === 'worker-auth' && (
          <div className={`flex-1 w-full p-4 sm:p-8 flex items-center justify-center ${
            isDark
              ? 'bg-gradient-to-b from-[#062420] via-[#09322c] to-[#041a17]'
              : 'bg-gradient-to-b from-[#EBF5F1] via-[#F3F8F5] to-[#E9F3EE]'
          }`}>
            <ScreenWorkerAuth
              lang={lang}
              onSelectLang={handleSelectLang}
              savedProfile={workerProfile}
              onResumeProfile={(profile) => {
                setWorkerProfile(profile);
                setWorkerInitialMode('hub');
                setRoute('worker');
              }}
              onRegisterNew={() => {
                setWorkerInitialMode('signup');
                setRoute('worker');
              }}
              onGoBack={() => setRoute('overview')}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />
          </div>
        )}

        {/* 3. Work-Giver Portal Entry / Login Screen */}
        {route === 'giver-auth' && (
          <div className={`flex-1 w-full p-4 sm:p-8 flex items-center justify-center ${
            isDark
              ? 'bg-gradient-to-b from-[#062420] via-[#09322c] to-[#041a17]'
              : 'bg-gradient-to-b from-[#EBF5F1] via-[#F3F8F5] to-[#E9F3EE]'
          }`}>
            <ScreenGiverAuth
              lang={lang}
              onSelectLang={handleSelectLang}
              savedGiver={giverProfile}
              onResumeGiver={(giver) => {
                setGiverProfile(giver);
                setRoute('giver');
              }}
              onStartNewRequest={() => setRoute('giver')}
              onGoBack={() => setRoute('overview')}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />
          </div>
        )}

        {/* 4. Worker Portal Environment */}
        {route === 'worker' && (
          <WorkerPortalContainer
            lang={lang}
            workerProfile={workerProfile}
            setWorkerProfile={setWorkerProfile}
            pendingJob={currentJob}
            onAcceptJob={handleWorkerAcceptJob}
            onDeclineJob={() => setCurrentJob(null)}
            onExitPortal={() => setRoute('overview')}
            onGoBack={() => setRoute('worker-auth')}
            initialMode={workerInitialMode}
            onUpdateJobTracking={handleUpdateJobTracking}
            onSaveCashAgreement={handleSaveCashAgreement}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* 5. Work-Giver Portal Environment */}
        {route === 'giver' && (
          <GiverPortalContainer
            lang={lang}
            giverProfile={giverProfile}
            customerRequest={customerRequest}
            setCustomerRequest={setCustomerRequest}
            currentJob={currentJob}
            onBookWorker={handleBookWorker}
            onJobStatusChange={(newStatus) => {
              if (currentJob) {
                setCurrentJob({
                  ...currentJob,
                  status: newStatus,
                  phone_revealed: currentJob.worker.phone,
                });
              }
            }}
            onSubmitRating={handleSubmitRating}
            onCancelJob={() => setCurrentJob(null)}
            onExitPortal={() => setRoute('overview')}
            onGoBack={() => setRoute('giver-auth')}
            onUpdateJobTracking={handleUpdateJobTracking}
            onSaveCashAgreement={handleSaveCashAgreement}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}
      </div>

      {/* Floating System Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white font-black text-sm shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            toast.isError ? 'bg-rose-600' : 'bg-emerald-700'
          }`}
        >
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
