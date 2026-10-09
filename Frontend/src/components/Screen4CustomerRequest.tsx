import React, { useState } from 'react';
import {
  Building2, MapPin, Users, Calendar, Clock, Banknote, ShieldCheck,
  CheckCircle2, ArrowRight, HardHat, FileText, Sparkles, Check
} from 'lucide-react';
import { Language, CustomerRequest, ThemeMode, ContractorRegistration } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { AREAS } from '../data/taxonomy';
import { playSound, triggerHaptic } from '../utils/audio';

interface Screen4CustomerRequestProps {
  lang: Language;
  onRequestSubmitted: (req: CustomerRequest, contractorData?: ContractorRegistration) => void;
  theme?: ThemeMode;
}

export const Screen4CustomerRequest: React.FC<Screen4CustomerRequestProps> = ({
  lang,
  onRequestSubmitted,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';

  // Contractor Personal & Company Details
  const [contractorName, setContractorName] = useState('Priya Shenoy');
  const [companyName, setCompanyName] = useState('Shenoy Infra & Civil Projects');
  const [phone, setPhone] = useState('+91 98459 88776');
  const [licenseNumber, setLicenseNumber] = useState('MNG/CIVIL/2024/782');

  // Contract & Site Details
  const [projectTitle, setProjectTitle] = useState('Compound wall red-brickwork & exterior plastering');
  const [selectedArea, setSelectedArea] = useState('Kadri');
  const [siteAddress, setSiteAddress] = useState('Site 4B, Kadri Hills Bypass Road, Near Temple Arch');

  // Labour Requirements
  const [labourTrade, setLabourTrade] = useState('mason');
  const [labourersCount, setLabourersCount] = useState<number>(3);
  const [contractDuration, setContractDuration] = useState('15-Day Contract');
  const [shiftHours, setShiftHours] = useState('8:00 AM - 5:00 PM (1 Hr Lunch)');
  const [dailyWageOffered, setDailyWageOffered] = useState<number>(950);

  // Site Perks & Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Daily Chai & Lunch',
    'Safety Gear & Helmets Provided',
    'Weekly Advance Payout',
  ]);

  const [additionalNotes, setAdditionalNotes] = useState(
    'Need experienced master masons with plumb line and level accuracy for boundary wall and facade plastering.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const tradesList = [
    { id: 'mason', label: 'Mason / Raj Mistri', desc: 'Brickwork, Plastering, Tiles' },
    { id: 'shuttering', label: 'Bar Bender & Concrete', desc: 'Foundation, Shuttering, Casting' },
    { id: 'electrician', label: 'Site Electrician', desc: 'Wiring, Distribution Board, Conduit' },
    { id: 'plumber', label: 'Site Plumber', desc: 'Piping, Drainage, Sanitary Line' },
    { id: 'painter', label: 'Painter & Putty', desc: 'Exterior Coat, Wall Putty' },
    { id: 'carpenter', label: 'Carpenter', desc: 'Formwork, Centering, Doors' },
    { id: 'helper', label: 'General Site Labour', desc: 'Loading, Mixing, Mortar Helper' },
  ];

  const durationOptions = [
    'Daily Wage (1-3 Days)',
    '5-Day Milestone',
    '15-Day Contract',
    '1-Month Project',
    '3-Month Long Tender',
  ];

  const shiftOptions = [
    '8:00 AM - 5:00 PM (1 Hr Lunch)',
    '8:30 AM - 5:30 PM',
    '9:00 AM - 6:00 PM',
    'Night Shift (8:00 PM - 5:00 AM)',
  ];

  const amenityOptions = [
    'Daily Chai & Lunch',
    'Safety Gear & Helmets Provided',
    'Weekly Advance Payout',
    'Overtime Pay 1.5x Rate',
    'Travel Allowance (₹100/day)',
    'ESI / Medical Accident Coverage',
  ];

  const toggleAmenity = (amenity: string) => {
    playSound('start');
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleRegisterContractor = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    playSound('success');
    triggerHaptic([100, 80, 120]);

    const registrationData: ContractorRegistration = {
      contractorName,
      companyName,
      phone,
      licenseNumber,
      projectTitle,
      area: selectedArea,
      siteAddress,
      contractDuration,
      labourTrade,
      labourersCount,
      shiftHours,
      dailyWageOffered,
      amenities: selectedAmenities,
      additionalNotes,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onRequestSubmitted(
        {
          request_id: Date.now() % 10000,
          trade: labourTrade,
          task: `${projectTitle} (${labourersCount} workers needed)`,
          urgency: 'today',
          when: `${contractDuration} • ${shiftHours}`,
          area: selectedArea,
          transcript: `${companyName} (${contractorName}): Need ${labourersCount} ${labourTrade} workers at ${selectedArea}. Rate ₹${dailyWageOffered}/day. ${additionalNotes}`,
        },
        registrationData
      );
    }, 600);
  };

  return (
    <div className={`flex flex-col min-h-full space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header Banner */}
      <div className="border-b pb-4 border-emerald-800/40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
            <Building2 className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-display font-black text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
                Contractor Client Registration
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Official Client Form
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
              Register your company as a hiring client and specify your site labour requirements
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleRegisterContractor} className="space-y-6">
        {/* Section 1: Contractor & Company Identity */}
        <div className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#051C18]/80 border-emerald-800/80' : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-teal-400">
              1. Contractor & Company Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Contractor Name *
              </label>
              <input
                type="text"
                required
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                placeholder="e.g. Priya Shenoy"
                className={`w-full p-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
                  isDark
                    ? 'border-emerald-800 bg-[#031512] text-white focus:border-teal-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Company / Firm Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Shenoy Infra & Civil Projects"
                className={`w-full p-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
                  isDark
                    ? 'border-emerald-800 bg-[#031512] text-white focus:border-teal-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Contact Phone (+91) *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98459 88776"
                className={`w-full p-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
                  isDark
                    ? 'border-emerald-800 bg-[#031512] text-white focus:border-teal-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Civil License / GST Reg No.
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. MNG/CIVIL/2024/782"
                className={`w-full p-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
                  isDark
                    ? 'border-emerald-800 bg-[#031512] text-white focus:border-teal-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Project & Site Locality */}
        <div className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#051C18]/80 border-emerald-800/80' : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-[#F59E0B]">
              2. Site Location & Project Details
            </h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Project / Site Title *
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Compound wall brickwork & exterior plastering"
                className={`w-full p-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
                  isDark
                    ? 'border-emerald-800 bg-[#031512] text-white focus:border-[#F59E0B]'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                }`}
              />
            </div>

            {/* Selecting Locality Chips (Retained as requested) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Work Locality (Mangalore Hub) *
              </label>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => {
                      setSelectedArea(area);
                      playSound('start');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedArea === area
                        ? 'bg-[#F59E0B] text-[#062420] shadow-sm font-black scale-105'
                        : isDark
                          ? 'bg-[#031512] text-emerald-200 border border-emerald-800 hover:bg-emerald-900/60'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    📍 {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Site Physical Address & Landmark
              </label>
              <input
                type="text"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="e.g. Site 4B, Kadri Hills Bypass Road, Near Temple Arch"
                className={`w-full p-3 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
                  isDark
                    ? 'border-emerald-800 bg-[#031512] text-white focus:border-emerald-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Labour Requirements & Terms */}
        <div className={`p-4 sm:p-5 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#051C18]/80 border-emerald-800/80' : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-emerald-400">
              3. Labour Trade, Headcount & Contract Duration
            </h3>
          </div>

          <div className="space-y-4">
            {/* Trade Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Select Labour Trade Required *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tradesList.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => {
                      setLabourTrade(tr.id);
                      playSound('start');
                    }}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                      labourTrade === tr.id
                        ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-400'
                        : isDark
                          ? 'bg-[#031512] border-emerald-800/80 text-emerald-200/80 hover:bg-emerald-900/40'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{tr.label}</span>
                      {labourTrade === tr.id && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{tr.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Headcount, Duration & Shift */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Workers Count */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Labourers Needed
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={labourersCount}
                    onChange={(e) => setLabourersCount(Number(e.target.value))}
                    className={`w-full p-3 rounded-xl border text-base font-black font-mono transition-colors focus:outline-none ${
                      isDark
                        ? 'border-emerald-800 bg-[#031512] text-amber-400 focus:border-amber-400'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-400">Workers</span>
                </div>
              </div>

              {/* Contract Term */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Contract Duration
                </label>
                <select
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs font-bold transition-colors focus:outline-none ${
                    isDark
                      ? 'border-emerald-800 bg-[#031512] text-white focus:border-emerald-400'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                  }`}
                >
                  {durationOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900 text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Wage Offered */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Daily Wage (₹ / Shift)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-400 text-base">₹</span>
                  <input
                    type="number"
                    step={50}
                    value={dailyWageOffered}
                    onChange={(e) => setDailyWageOffered(Number(e.target.value))}
                    className={`w-full p-3 rounded-xl border text-base font-black font-mono transition-colors focus:outline-none ${
                      isDark
                        ? 'border-emerald-800 bg-[#031512] text-amber-400 focus:border-amber-400'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Shift Hours */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Shift Working Hours
              </label>
              <select
                value={shiftHours}
                onChange={(e) => setShiftHours(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs font-bold transition-colors focus:outline-none ${
                  isDark
                    ? 'border-emerald-800 bg-[#031512] text-white focus:border-emerald-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E]'
                }`}
              >
                {shiftOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-slate-900 text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Site Perks & Amenities Provided */}
        <div className={`p-4 sm:p-5 rounded-3xl border space-y-3 ${
          isDark ? 'bg-[#051C18]/80 border-emerald-800/80' : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Site Perks & Facilities Provided to Labourers
            </span>
            <span className="text-[11px] text-teal-400 font-bold">Attracts Top Rated Crews</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {amenityOptions.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-400/20 border-[#F59E0B] text-amber-300'
                      : isDark
                        ? 'bg-[#031512] border-emerald-900 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{amenity}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Specific Instructions / Requirements */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Specific Job Instructions & Technical Criteria
          </label>
          <textarea
            rows={3}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="e.g. Master masons needed for exterior 9-inch brick wall and water-proofing mortar application."
            className={`w-full p-3.5 rounded-2xl border text-sm font-medium transition-colors focus:outline-none ${
              isDark
                ? 'border-emerald-800 bg-[#041E19] text-white focus:border-teal-400 placeholder:text-slate-500'
                : 'border-slate-300 bg-white text-slate-900 focus:border-[#0F766E] placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Primary Action Button: "Register" */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[58px] rounded-2xl bg-gradient-to-r from-[#0F766E] via-teal-600 to-emerald-600 hover:brightness-105 text-white font-display font-black text-lg flex items-center justify-center gap-2.5 shadow-xl shadow-[#0F766E]/25 active:scale-[0.98] transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Registering Client Account...</span>
              </span>
            ) : (
              <>
                <span>Register as Client & Post Requirement</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>
          <p className="text-xs text-center text-slate-400 font-medium">
            Company account registered with direct access to local verified labour teams.
          </p>
        </div>
      </form>
    </div>
  );
};
