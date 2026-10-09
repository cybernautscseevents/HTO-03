import React, { useState } from 'react';
import {
  Building2, MapPin, Star, Calendar, Clock, CheckCircle2, ChevronRight,
  ShieldCheck, HardHat, Check, X, Award, AlertCircle
} from 'lucide-react';
import { Language, WorkerProfile, ThemeMode, MasonJobListing } from '../types';
import { playSound, triggerHaptic } from '../utils/audio';

export const MASON_JOB_LISTINGS: MasonJobListing[] = [
  {
    id: 'mj-101',
    contractorName: 'Shree Ram Builders & Infra',
    contractorRating: 4.9,
    contractorVerification: 'A-Grade Civil',
    title: 'High-Rise Red-Brick Masonry & Internal Plastering',
    location: 'Kadri Hills Site A, Mangalore',
    distanceKm: 1.2,
    contractTerm: '15-Day Contract',
    dailyWage: 950,
    wageNote: '₹950 / daily shift + Lunch provided (Overtime 1.5x rate)',
    shifts: '8:00 AM - 5:00 PM (1 Hr Lunch)',
    crewNeeded: '2 Master Masons + 2 Helpers',
    skillsRequired: ['Red Brickwork', 'Internal Plastering', 'Wall Plumb Line'],
    perks: ['Daily Chai & Lunch', 'Safety Gear Provided', 'Weekly Advance'],
    startDate: 'Tomorrow morning',
  },
  {
    id: 'mj-102',
    contractorName: 'Coastal Horizon Infra Projects',
    contractorRating: 4.8,
    contractorVerification: 'Verified Builder',
    title: 'Luxury Villa Granite Slab & Interlock Tile Masonry',
    location: 'Bejai Commercial Layout',
    distanceKm: 2.1,
    contractTerm: '5-Day Milestone',
    dailyWage: 1050,
    wageNote: '₹1,050 / daily shift (Direct UPI / Cash payout at 5:30 PM)',
    shifts: '8:30 AM - 5:30 PM',
    crewNeeded: '1 Solo Master Mason',
    skillsRequired: ['Granite Fitting', 'Interlock Pavers', 'Tile Leveling'],
    perks: ['Instant Cash Daily', 'Travel Allowance ₹100/day'],
    startDate: 'Immediate start',
  },
  {
    id: 'mj-103',
    contractorName: 'Fernandes Civil Works',
    contractorRating: 4.7,
    contractorVerification: 'A-Grade Civil',
    title: 'Compound Wall Red-Brick Masonry & Boundary Coping',
    location: 'Kankanady Junction Bypass',
    distanceKm: 0.6,
    contractTerm: 'Daily Wage',
    dailyWage: 850,
    wageNote: '₹850 / daily wage (Direct cash payment upon shift sign-off)',
    shifts: '9:00 AM - 5:00 PM',
    crewNeeded: '1 Mason (Helper on site)',
    skillsRequired: ['Brick Masonry', 'Cement Mortar', 'Coping'],
    perks: ['Nearest Site (0.6 km)', 'Prompt Daily Sign-off'],
    startDate: 'Today or Tomorrow',
  },
  {
    id: 'mj-104',
    contractorName: 'Mangalore Metro Housing Consortium',
    contractorRating: 4.9,
    contractorVerification: 'Govt Empanelled',
    title: 'Reinforced Concrete Foundation & Column Shuttering',
    location: 'Hampankatta Station Road Site',
    distanceKm: 3.4,
    contractTerm: '1-Month Project',
    dailyWage: 950,
    wageNote: '₹28,500 / month (₹950/shift) + ESI Medical Insurance',
    shifts: '8:00 AM - 4:30 PM',
    crewNeeded: '4 Masons Team',
    skillsRequired: ['Foundation Shuttering', 'Concrete Casting', 'Vibrator Compaction'],
    perks: ['ESI & Accident Coverage', 'Tools Allowance', 'Overtime Bonus'],
    startDate: 'Starting Monday',
  },
];

interface ScreenWorkerContractsProps {
  lang: Language;
  profile: WorkerProfile;
  acceptedListingIds: string[];
  onAcceptListing: (listing: MasonJobListing) => void;
  theme?: ThemeMode;
}

export const ScreenWorkerContracts: React.FC<ScreenWorkerContractsProps> = ({
  lang,
  profile,
  acceptedListingIds,
  onAcceptListing,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');
  const [activeJobModal, setActiveJobModal] = useState<MasonJobListing | null>(null);

  const filteredListings = MASON_JOB_LISTINGS.filter((job) => {
    if (selectedTermFilter === 'all') return true;
    return job.contractTerm.toLowerCase().includes(selectedTermFilter.toLowerCase());
  });

  return (
    <div className={`space-y-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-emerald-800/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-[#F59E0B] flex items-center justify-center border border-amber-400/30">
              <Building2 className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h2 className={`font-display font-black text-2xl ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
                Contractor Masonry Tenders
              </h2>
              <p className={`text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                Civil contract jobs for masons • Transparent daily wages & verified terms
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className={`p-1 rounded-2xl border flex gap-1 self-start sm:self-auto overflow-x-auto max-w-full ${
          isDark ? 'bg-[#07241F] border-emerald-800' : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          {[
            { id: 'all', label: 'All Terms' },
            { id: 'daily', label: 'Daily Wage' },
            { id: '15-day', label: '15-Day' },
            { id: '5-day', label: 'Milestone' },
            { id: '1-month', label: 'Monthly' },
          ].map((term) => (
            <button
              key={term.id}
              type="button"
              onClick={() => {
                playSound('start');
                setSelectedTermFilter(term.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedTermFilter === term.id
                  ? isDark
                    ? 'bg-[#F59E0B] text-[#062420] shadow-xs'
                    : 'bg-[#0F766E] text-white shadow-xs'
                  : isDark
                    ? 'text-emerald-200/70 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {term.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accepted Contracts Summary (if any) */}
      {acceptedListingIds.length > 0 && (
        <div className="p-4 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-emerald-300">
                You have {acceptedListingIds.length} active site contract(s) locked.
              </span>
              <p className="text-[11px] text-emerald-200/80">Site arrival status is shared with contractor dispatch.</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-emerald-400 text-emerald-950">
            Confirmed
          </span>
        </div>
      )}

      {/* Mason Job Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredListings.map((job) => {
          const isAccepted = acceptedListingIds.includes(job.id);
          return (
            <div
              key={job.id}
              className={`p-5 rounded-3xl border backdrop-blur-[12px] shadow-lg flex flex-col justify-between space-y-3.5 transition-all duration-200 hover:shadow-xl ${
                isDark
                  ? 'bg-[#0A3029]/85 border-emerald-700/60 hover:border-amber-400/80'
                  : 'bg-white/85 border-emerald-200/90 hover:border-emerald-400 shadow-emerald-950/5'
              }`}
            >
              {/* Top info */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold text-xs ${isDark ? 'text-amber-400' : 'text-emerald-800'}`}>
                        {job.contractorName}
                      </span>
                      <span className="text-[10px] flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 inline mr-0.5" />
                        {job.contractorRating}
                      </span>
                    </div>
                    <h4 className={`font-display font-extrabold text-base sm:text-lg mt-1 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {job.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 border ${
                    job.contractTerm === 'Daily Wage'
                      ? 'bg-amber-400/20 text-[#F59E0B] border-amber-400/30'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  }`}>
                    {job.contractTerm}
                  </span>
                </div>

                <div className={`flex items-center gap-2 text-xs mt-2 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{job.location} ({job.distanceKm} km)</span>
                  </span>
                </div>
              </div>

              {/* Wage & Terms Breakdown Box */}
              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                isDark ? 'bg-[#062420]/80 border-emerald-800/80' : 'bg-emerald-50/70 border-emerald-100'
              }`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-400">Daily Wage:</span>
                  <span className="font-display font-black text-xl text-[#F59E0B]">
                    ₹{job.dailyWage} <span className="text-xs font-medium text-slate-400">/ shift</span>
                  </span>
                </div>
                <p className={`text-[11px] leading-tight ${isDark ? 'text-emerald-200/90' : 'text-slate-700'}`}>
                  {job.wageNote}
                </p>
                <div className="flex items-center justify-between text-[11px] pt-1.5 text-slate-400 border-t border-dashed border-emerald-800/50">
                  <span>Crew: {job.crewNeeded}</span>
                  <span className="font-semibold text-emerald-400">{job.startDate}</span>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5">
                {job.skillsRequired.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      isDark
                        ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    • {skill}
                  </span>
                ))}
              </div>

              {/* Choose Action */}
              <div className="pt-1">
                {isAccepted ? (
                  <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Contract Locked • Site Dispatched</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('start');
                      setActiveJobModal(job);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-amber-500 text-[#062420] font-display font-black text-xs hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View Contract & Choose Job</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contract Detail & Locking Modal */}
      {activeJobModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#07241F] border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between border-b pb-3 border-emerald-800/50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B] bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  {activeJobModal.contractTerm} Tender
                </span>
                <h3 className="font-display font-black text-xl mt-1">
                  {activeJobModal.title}
                </h3>
                <p className="text-xs text-slate-400">
                  By {activeJobModal.contractorName} ({activeJobModal.contractorVerification})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveJobModal(null)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Structure Details */}
            <div className="space-y-3 text-xs">
              <div className={`p-3.5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#041A17] border-emerald-800' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Contract Daily Wage:</span>
                  <span className="font-display font-black text-2xl text-[#F59E0B]">
                    ₹{activeJobModal.dailyWage} / shift
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-200/90 font-medium">
                  {activeJobModal.wageNote}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Site Location:</span>
                  <span className="font-bold">{activeJobModal.location}</span>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-emerald-900' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Shift Hours:</span>
                  <span className="font-bold">{activeJobModal.shifts}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Crew Requirement:</span>
                <p className="font-semibold">{activeJobModal.crewNeeded}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Provided Site Perks:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {activeJobModal.perks.map((p, idx) => (
                    <li key={idx} className="font-medium text-emerald-300/90">{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onAcceptListing(activeJobModal);
                  setActiveJobModal(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-[#F59E0B] text-[#062420] font-display font-black text-sm hover:brightness-105 active:scale-95 transition-all shadow-md shadow-[#F59E0B]/20 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm & Accept Contract (+50 Pts)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveJobModal(null)}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
