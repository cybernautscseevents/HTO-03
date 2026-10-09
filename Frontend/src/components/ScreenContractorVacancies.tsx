import React, { useState } from 'react';
import {
  Building2, Users, PlusCircle, CheckCircle2, Star, ShieldCheck,
  MapPin, Clock, Phone, Award, Check, X, ChevronDown, ChevronUp,
  AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { Language, ThemeMode, ContractorVacancy, ContractorVacancyApplicant } from '../types';
import { AREAS } from '../data/taxonomy';
import { playSound, triggerHaptic } from '../utils/audio';

export const INITIAL_VACANCIES: ContractorVacancy[] = [
  {
    id: 'vac-1',
    title: 'High-Rise Red-Brick Masonry & Compound Wall',
    location: 'Kadri Hills Site A, Mangalore',
    contractTerm: '15-Day Milestone',
    dailyWage: 950,
    labourersNeeded: 3,
    hiredCount: 1,
    skillsRequired: ['Red Brickwork', 'External Plastering', 'Plumb Alignment'],
    shifts: '8:00 AM - 5:00 PM (1 Hr Lunch)',
    perks: ['Daily Chai & Lunch', 'Safety Gear Provided', 'Weekly Advance'],
    createdAt: 'Posted 2 hours ago',
    status: 'active',
    applicants: [
      {
        id: 'app-1',
        name: 'Ravi Kumar',
        trade: 'Master Mason / Raj Mistri',
        experienceYears: 8,
        trustScore: 84,
        rating: 4.8,
        area: 'Kankanady (0.8 km)',
        wageExpectation: 950,
        skills: ['Brickwork', 'Wall Plastering', 'Tile Laying', 'Foundation Casting'],
        phone: '+91 98450 12345',
        status: 'accepted',
        appliedAt: '10 mins ago',
      },
      {
        id: 'app-2',
        name: 'Basavaraj M',
        trade: 'Mason Specialist',
        experienceYears: 6,
        trustScore: 76,
        rating: 4.6,
        area: 'Bejai (1.5 km)',
        wageExpectation: 900,
        skills: ['Exterior Plastering', 'Concrete Slab', 'Compound Wall'],
        phone: '+91 98451 98765',
        status: 'pending',
        appliedAt: '25 mins ago',
      },
      {
        id: 'app-3',
        name: 'Anand Gowda',
        trade: 'Mason Team Lead (2 Helpers)',
        experienceYears: 5,
        trustScore: 69,
        rating: 4.4,
        area: 'Kadri (0.4 km)',
        wageExpectation: 1000,
        skills: ['Granite & Tile Laying', 'Foundation Casting', 'Scaffolding'],
        phone: '+91 98452 45678',
        status: 'pending',
        appliedAt: '1 hour ago',
      },
    ],
  },
  {
    id: 'vac-2',
    title: 'Luxury Villa Granite Fitting & Interlock Paver Tiles',
    location: 'Bejai Commercial Layout, Mangalore',
    contractTerm: '5-Day Milestone',
    dailyWage: 1050,
    labourersNeeded: 2,
    hiredCount: 0,
    skillsRequired: ['Granite Fitting', 'Interlock Pavers', 'Tile Leveling'],
    shifts: '8:30 AM - 5:30 PM',
    perks: ['Instant Cash Daily', 'Travel Allowance ₹100/day'],
    createdAt: 'Posted yesterday',
    status: 'active',
    applicants: [
      {
        id: 'app-4',
        name: 'Suresh Nayak',
        trade: 'Master Tile & Granite Layer',
        experienceYears: 7,
        trustScore: 81,
        rating: 4.7,
        area: 'Bejai (0.6 km)',
        wageExpectation: 1050,
        skills: ['Interlock Pavers', 'Marble Cutting', 'Tile Leveling'],
        phone: '+91 98454 11223',
        status: 'pending',
        appliedAt: '3 hours ago',
      },
      {
        id: 'app-5',
        name: 'Kiran Poojary',
        trade: 'Floor & Wall Mason',
        experienceYears: 9,
        trustScore: 85,
        rating: 4.9,
        area: 'Kankanady (1.2 km)',
        wageExpectation: 1100,
        skills: ['Precision Tile Fitting', 'Grouting', 'Coping'],
        phone: '+91 98453 99887',
        status: 'pending',
        appliedAt: '4 hours ago',
      },
      {
        id: 'app-6',
        name: 'Salim Ahmed',
        trade: 'Ceramic & Paver Mason',
        experienceYears: 4,
        trustScore: 73,
        rating: 4.5,
        area: 'Hampankatta (2.1 km)',
        wageExpectation: 950,
        skills: ['Floor Leveling', 'Mortar Bedding', 'Tile Cutting'],
        phone: '+91 98455 33221',
        status: 'pending',
        appliedAt: '5 hours ago',
      },
    ],
  },
  {
    id: 'vac-3',
    title: 'Commercial Building Foundation Casting & Column Shuttering',
    location: 'Hampankatta Station Road Site, Mangalore',
    contractTerm: '1-Month Project',
    dailyWage: 950,
    labourersNeeded: 4,
    hiredCount: 2,
    skillsRequired: ['Foundation Shuttering', 'Concrete Casting', 'Vibrator Compaction'],
    shifts: '8:00 AM - 4:30 PM',
    perks: ['ESI & Accident Coverage', 'Tools Allowance', 'Overtime Bonus'],
    createdAt: 'Posted 2 days ago',
    status: 'active',
    applicants: [
      {
        id: 'app-7',
        name: 'Mahesh Shetty',
        trade: 'RCC & Shuttering Mason',
        experienceYears: 8,
        trustScore: 83,
        rating: 4.8,
        area: 'Hampankatta (0.9 km)',
        wageExpectation: 950,
        skills: ['Foundation Shuttering', 'Column Casting', 'Vibrator Compaction'],
        phone: '+91 98456 77889',
        status: 'accepted',
        appliedAt: 'Yesterday',
      },
      {
        id: 'app-8',
        name: 'Dinesh Kulal',
        trade: 'Concrete Casting Specialist',
        experienceYears: 6,
        trustScore: 77,
        rating: 4.6,
        area: 'Attavar (1.8 km)',
        wageExpectation: 900,
        skills: ['Slab Casting', 'Curing', 'Steel Binding'],
        phone: '+91 98458 44556',
        status: 'accepted',
        appliedAt: 'Yesterday',
      },
      {
        id: 'app-9',
        name: 'Ganesh Acharya',
        trade: 'Formwork & Centering Artisan',
        experienceYears: 10,
        trustScore: 88,
        rating: 4.9,
        area: 'Kadri (2.5 km)',
        wageExpectation: 1000,
        skills: ['Beam Centering', 'Scaffolding', 'Level Alignment'],
        phone: '+91 98459 22331',
        status: 'pending',
        appliedAt: '2 days ago',
      },
    ],
  },
];

interface ScreenContractorVacanciesProps {
  lang: Language;
  theme?: ThemeMode;
  onBookWorkerDirect?: (applicant: ContractorVacancyApplicant) => void;
}

export const ScreenContractorVacancies: React.FC<ScreenContractorVacanciesProps> = ({
  lang,
  theme = 'dark',
  onBookWorkerDirect,
}) => {
  const isDark = theme === 'dark';

  const [vacancies, setVacancies] = useState<ContractorVacancy[]>(INITIAL_VACANCIES);
  const [expandedVacancyId, setExpandedVacancyId] = useState<string>('vac-1');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Vacancy Form fields
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('Kadri');
  const [newTerm, setNewTerm] = useState('15-Day Milestone');
  const [newDailyWage, setNewDailyWage] = useState(950);
  const [newLabourersNeeded, setNewLabourersNeeded] = useState(2);
  const [newShifts, setNewShifts] = useState('8:00 AM - 5:00 PM');
  const [newSkills, setNewSkills] = useState('Red Brickwork, Plastering, Plumb Line');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleAcceptApplicant = (vacancyId: string, applicantId: string, applicantName: string) => {
    playSound('success');
    triggerHaptic([100, 80, 150]);

    setVacancies((prev) =>
      prev.map((vac) => {
        if (vac.id !== vacancyId) return vac;
        const updatedApplicants = vac.applicants.map((app) => {
          if (app.id === applicantId) {
            return { ...app, status: 'accepted' as const };
          }
          return app;
        });
        const newlyHiredCount = updatedApplicants.filter((a) => a.status === 'accepted').length;
        return {
          ...vac,
          hiredCount: newlyHiredCount,
          applicants: updatedApplicants,
        };
      })
    );

    triggerToast(`Labourer ${applicantName} accepted! Shift dispatch confirmed.`);
  };

  const handleDeclineApplicant = (vacancyId: string, applicantId: string) => {
    playSound('stop');
    triggerHaptic([60]);

    setVacancies((prev) =>
      prev.map((vac) => {
        if (vac.id !== vacancyId) return vac;
        return {
          ...vac,
          applicants: vac.applicants.map((app) =>
            app.id === applicantId ? { ...app, status: 'declined' as const } : app
          ),
        };
      })
    );
  };

  const handleCreateVacancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playSound('success');
    triggerHaptic([100, 80, 100]);

    const created: ContractorVacancy = {
      id: `vac-${Date.now()}`,
      title: newTitle.trim(),
      location: `${newLocation}, Mangalore`,
      contractTerm: newTerm,
      dailyWage: newDailyWage,
      labourersNeeded: newLabourersNeeded,
      hiredCount: 0,
      skillsRequired: newSkills.split(',').map((s) => s.trim()),
      shifts: newShifts,
      perks: ['Daily Chai & Lunch', 'Safety Gear Provided'],
      createdAt: 'Just now',
      status: 'active',
      applicants: [
        {
          id: `app-gen-${Date.now()}`,
          name: 'Ravi Kumar',
          trade: 'Master Mason',
          experienceYears: 8,
          trustScore: 84,
          rating: 4.8,
          area: `${newLocation} (0.8 km)`,
          wageExpectation: newDailyWage,
          skills: ['Brickwork', 'Plastering', 'Tile Laying'],
          phone: '+91 98450 12345',
          status: 'pending',
          appliedAt: 'Just now',
        },
      ],
    };

    setVacancies([created, ...vacancies]);
    setExpandedVacancyId(created.id);
    setShowUploadModal(false);
    setNewTitle('');
    triggerToast('New site vacancy posted! Labour crews notified.');
  };

  return (
    <div className={`space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header and Upload Vacancy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-emerald-800/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <Building2 className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h2 className={`font-display font-black text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
                Site Vacancies & Applicants
              </h2>
              <p className={`text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                Review incoming labour applicants, accept crews, or upload new site vacancies
              </p>
            </div>
          </div>
        </div>

        {/* Upload / Post New Vacancy Button */}
        <button
          type="button"
          onClick={() => {
            playSound('start');
            setShowUploadModal(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#062420] font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F59E0B]/20 active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Upload New Vacancy</span>
        </button>
      </div>

      {/* Vacancies List */}
      <div className="space-y-4">
        {vacancies.map((vac) => {
          const isExpanded = expandedVacancyId === vac.id;
          const pendingApplicants = vac.applicants.filter((a) => a.status === 'pending');
          const acceptedApplicants = vac.applicants.filter((a) => a.status === 'accepted');

          return (
            <div
              key={vac.id}
              className={`rounded-3xl border backdrop-blur-[12px] shadow-lg transition-all duration-200 overflow-hidden ${
                isDark
                  ? 'bg-[#07241F]/80 border-emerald-700/60'
                  : 'bg-white/90 border-emerald-200 shadow-emerald-950/5'
              }`}
            >
              {/* Vacancy Header Card */}
              <div
                onClick={() => {
                  playSound('start');
                  setExpandedVacancyId(isExpanded ? '' : vac.id);
                }}
                className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-[#F59E0B] border border-amber-400/30">
                        {vac.contractTerm}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {vac.createdAt}
                      </span>
                    </div>

                    <h3 className={`font-display font-extrabold text-lg sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {vac.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>{vac.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{vac.shifts}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Status Block */}
                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="font-display font-black text-xl text-[#F59E0B]">
                        ₹{vac.dailyWage} <span className="text-xs font-medium text-slate-400">/ shift</span>
                      </div>
                      <div className="text-xs font-bold mt-0.5">
                        <span className="text-emerald-400">{vac.hiredCount}</span>
                        <span className="text-slate-400"> / {vac.labourersNeeded} Hired</span>
                      </div>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                      isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Skills & Perks Chips */}
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {vac.skillsRequired.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        isDark ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      • {skill}
                    </span>
                  ))}
                  {vac.perks.map((perk, pIdx) => (
                    <span
                      key={pIdx}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/20 text-slate-300 border border-white/10"
                    >
                      ✓ {perk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Collapsible Applicants Section */}
              {isExpanded && (
                <div className={`border-t p-5 space-y-4 ${
                  isDark ? 'border-emerald-800/60 bg-[#041A17]/80' : 'border-emerald-100 bg-emerald-50/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-400" />
                      <h4 className="font-display font-bold text-sm uppercase tracking-wider text-teal-300">
                        Applicants for this Vacancy ({vac.applicants.length} candidates)
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Review & Accept to lock daily shift
                    </span>
                  </div>

                  {/* 3 People's Listings Under this Vacancy */}
                  <div className="space-y-3">
                    {vac.applicants.map((app) => {
                      const isAccepted = app.status === 'accepted';
                      const isDeclined = app.status === 'declined';

                      return (
                        <div
                          key={app.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isAccepted
                              ? 'bg-emerald-950/70 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                              : isDeclined
                                ? 'bg-black/20 border-slate-800 opacity-60'
                                : isDark
                                  ? 'bg-[#062420]/80 border-emerald-800/80 hover:border-emerald-600'
                                  : 'bg-white border-slate-200 hover:border-teal-400'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Candidate Identity */}
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] via-amber-400 to-amber-600 text-[#062420] font-display font-black text-xl flex items-center justify-center shadow-sm shrink-0">
                                {app.name[0]}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className={`font-display font-extrabold text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {app.name}
                                  </h5>
                                  <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>{app.rating}</span>
                                  </span>
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Trust {app.trustScore}/100
                                  </span>
                                </div>

                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                  {app.trade} • {app.experienceYears} yrs exp • {app.area}
                                </p>

                                {/* Candidate skills */}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {app.skills.map((sk, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/30 text-slate-300"
                                    >
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Wage & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wage Expectation</span>
                                <span className="font-display font-bold text-base text-amber-400">
                                  ₹{app.wageExpectation} / day
                                </span>
                              </div>

                              {/* Action Buttons: Accept / Decline */}
                              {isAccepted ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  <span>Accepted & Dispatched</span>
                                </div>
                              ) : isDeclined ? (
                                <span className="text-xs font-bold text-slate-500 px-3 py-1.5">
                                  Declined
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptApplicant(vac.id, app.id, app.name)}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#062420] font-display font-black text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Accept Labourer</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineApplicant(vac.id, app.id)}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                                    title="Decline applicant"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload New Vacancy Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#07241F] border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between border-b pb-3 border-emerald-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-[#F59E0B] flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl">Upload New Site Vacancy</h3>
                  <p className="text-xs text-slate-400">Post site labour requirements to local available worker pool</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVacancy} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider block text-slate-400">
                  Vacancy Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Kadri Commercial Complex 9-inch Brickwork"
                  className={`w-full p-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
                    isDark ? 'border-emerald-800 bg-[#031512] text-white focus:border-amber-400' : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider block text-slate-400">
                    Site Locality *
                  </label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold transition-colors focus:outline-none ${
                      isDark ? 'border-emerald-800 bg-[#031512] text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a} className="bg-slate-900 text-white">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider block text-slate-400">
                    Contract Term *
                  </label>
                  <select
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold transition-colors focus:outline-none ${
                      isDark ? 'border-emerald-800 bg-[#031512] text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="Daily Wage">Daily Wage</option>
                    <option value="5-Day Milestone">5-Day Milestone</option>
                    <option value="15-Day Milestone">15-Day Milestone</option>
                    <option value="1-Month Project">1-Month Project</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider block text-slate-400">
                    Daily Wage (₹ / shift) *
                  </label>
                  <input
                    type="number"
                    step={50}
                    value={newDailyWage}
                    onChange={(e) => setNewDailyWage(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-black text-amber-400 transition-colors focus:outline-none ${
                      isDark ? 'border-emerald-800 bg-[#031512]' : 'border-slate-300 bg-white'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider block text-slate-400">
                    Labourers Needed *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newLabourersNeeded}
                    onChange={(e) => setNewLabourersNeeded(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-black text-amber-400 transition-colors focus:outline-none ${
                      isDark ? 'border-emerald-800 bg-[#031512]' : 'border-slate-300 bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider block text-slate-400">
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  placeholder="Brickwork, Wall Plastering, Plumb Line"
                  className={`w-full p-2.5 rounded-xl border font-medium transition-colors focus:outline-none ${
                    isDark ? 'border-emerald-800 bg-[#031512] text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#F59E0B] text-[#062420] font-display font-black text-sm hover:brightness-105 active:scale-95 transition-all shadow-md shadow-[#F59E0B]/20"
                >
                  Publish Vacancy
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-black text-xs shadow-xl animate-in fade-in slide-in-from-bottom duration-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
