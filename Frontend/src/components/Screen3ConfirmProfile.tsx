import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Volume2, Shield, Award, MapPin } from 'lucide-react';
import { Language, WorkerProfile, ThemeMode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { playSound, speakText, triggerHaptic } from '../utils/audio';

interface Screen3ConfirmProfileProps {
  lang: Language;
  profile: WorkerProfile;
  onConfirm: () => void;
  onEditVoice: () => void;
  theme?: ThemeMode;
}

export const Screen3ConfirmProfile: React.FC<Screen3ConfirmProfileProps> = ({
  lang,
  profile,
  onConfirm,
  onEditVoice,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [showOtpSheet, setShowOtpSheet] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['1', '2', '3', '4']);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    const speech = `${profile.name}. ${profile.trade}. ${profile.experience_years || ''} years. ${profile.areas.join(', ')}. ${t.correct}`;
    speakText(speech, lang);
  }, []);

  const profileStrength = Math.max(35, 100 - (profile.missing?.length || 0) * 25);

  const handleVerifyOtp = () => {
    const fullCode = otpDigits.join('');
    if (fullCode !== '1234') {
      triggerHaptic([200, 100, 200]);
      setOtpError('Wrong code. Demo code is 1234.');
      return;
    }
    playSound('success');
    triggerHaptic([100, 80, 100]);
    setShowOtpSheet(false);
    onConfirm();
  };

  return (
    <div className={`flex flex-col min-h-full justify-between px-1 py-1 space-y-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className={`font-display font-extrabold text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-[#0F2824]'}`}>
              {t.correct}
            </h2>
            <button
              onClick={() => {
                const speech = `${profile.name}. ${profile.trade}. ${profile.experience_years || ''} years. ${profile.areas.join(', ')}.`;
                speakText(speech, lang);
              }}
              className={`text-xs font-bold flex items-center gap-1 hover:underline p-1 ${isDark ? 'text-[#F59E0B]' : 'text-[#0F766E]'}`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Hear again</span>
            </button>
          </div>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
            Your portable identity card will look like this to customers.
          </p>
        </div>

        {/* High-Trust Artisan Card */}
        <div className={`rounded-3xl p-5 border space-y-4 relative overflow-hidden shadow-sm backdrop-blur-[12px] transition-all duration-200 ${
          isDark
            ? 'bg-[#0A2E27]/80 border-emerald-700/80 text-white'
            : 'bg-white/80 border-slate-200/90 text-slate-900 shadow-emerald-900/5'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F59E0B] via-amber-400 to-amber-600 text-[#062420] font-display font-black text-2xl flex items-center justify-center shadow-md">
                {(profile.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className={`font-display font-extrabold text-xl leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {profile.name || 'Worker'}
                  </h3>
                  <Award className="w-4 h-4 text-[#F59E0B]" />
                </div>
                {/* Zero-Pill Unboxed Metadata */}
                <div className={`text-xs font-semibold mt-1 flex items-center gap-1.5 ${isDark ? 'text-emerald-200/90' : 'text-slate-600'}`}>
                  <span className={`capitalize font-bold ${isDark ? 'text-[#F59E0B]' : 'text-[#0F766E]'}`}>
                    {profile.trade.replace('_', ' ')}
                  </span>
                  <span aria-hidden="true" className={isDark ? 'text-emerald-500/50' : 'text-slate-300'}>•</span>
                  <span>{profile.experience_years || 5} yrs exp</span>
                </div>
                <div className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-emerald-300/70' : 'text-slate-500'}`}>
                  <MapPin className="w-3 h-3 text-[#F59E0B]" />
                  <span>{profile.areas.join(', ') || 'Mangalore'}</span>
                </div>
              </div>
            </div>
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
              isDark
                ? 'text-emerald-200 bg-emerald-900/80 border-emerald-700'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200'
            }`}>
              Verified
            </span>
          </div>

          {/* Certified Skills - Zero-Pill Unboxed Text */}
          <div className={`space-y-1.5 pt-1 border-t ${isDark ? 'border-emerald-800/80' : 'border-slate-100'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-400/80' : 'text-slate-400'}`}>
              Core Skills
            </span>
            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {profile.skills.join(' • ')}
            </div>
          </div>

          {/* Standard Visit Rate */}
          <div className={`p-3.5 rounded-2xl flex items-center justify-between border backdrop-blur-[12px] ${
            isDark
              ? 'bg-[#041E19]/80 border-emerald-800 text-white'
              : 'bg-emerald-50/80 border-emerald-100 text-slate-900'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-[#0F766E]'}`}>
              Standard Visit Rate
            </span>
            <span className={`font-display font-black text-base ${isDark ? 'text-[#F59E0B]' : 'text-slate-900'}`}>
              {profile.rate_note || '₹250 - ₹450 per visit'}
            </span>
          </div>

          {/* Profile Strength Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>{t.profile_strength}</span>
              <span className="text-[#0F766E]">{profileStrength}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0F766E] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
          </div>

          {/* Missing fields alert if any */}
          {profile.missing && profile.missing.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {t.missing}:{' '}
                <strong className="capitalize">{profile.missing.join(', ')}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => {
            playSound('start');
            setShowOtpSheet(true);
          }}
          className="w-full min-h-[56px] rounded-2xl bg-[#0F766E] text-white font-display font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#0F766E]/20 hover:bg-[#115E59] active:scale-[0.98] transition-all"
        >
          <span>{t.golive}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={onEditVoice}
          className={`w-full min-h-[50px] rounded-2xl font-display font-bold text-base border-2 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
            isDark
              ? 'bg-[#041E19] text-[#F59E0B] border-emerald-700 hover:bg-emerald-900/40'
              : 'bg-white text-[#0F766E] border-[#0F766E] hover:bg-emerald-50'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.edit}</span>
        </button>
      </div>

      {/* OTP Verification Bottom Sheet */}
      {showOtpSheet && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center">
          <div className={`w-full max-w-[440px] rounded-t-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 border-t ${
            isDark
              ? 'bg-[#07241F] text-white border-emerald-800/80'
              : 'bg-white text-slate-900 border-slate-200'
          }`}>
            <div className={`w-10 h-1.5 rounded-full mx-auto ${isDark ? 'bg-emerald-900' : 'bg-slate-300'}`} />
            <div className="text-center space-y-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-1 ${
                isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-[#0F766E]'
              }`}>
                <Shield className="w-6 h-6" />
              </div>
              <h3 className={`font-display font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t.otp}
              </h3>
              <p className={`text-xs font-medium ${isDark ? 'text-emerald-300/70' : 'text-slate-500'}`}>{t.demo_otp_hint}</p>
            </div>

            {/* 4 Digit Discrete Input Boxes */}
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={otpDigits[idx]}
                  onChange={(e) => {
                    const newDigits = [...otpDigits];
                    newDigits[idx] = e.target.value;
                    setOtpDigits(newDigits);
                    setOtpError('');
                  }}
                  className={`w-12 h-14 text-center font-display font-black text-2xl rounded-2xl border-2 focus:outline-none transition-colors ${
                    isDark
                      ? 'border-emerald-800 bg-[#041E19] text-white focus:border-[#F59E0B]'
                      : 'border-slate-200 bg-white text-slate-900 focus:border-[#0F766E]'
                  }`}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs font-bold text-rose-600 text-center">{otpError}</p>
            )}

            <button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full min-h-[52px] rounded-2xl bg-[#0F766E] text-white font-display font-bold text-lg hover:bg-[#115E59] active:scale-[0.98] transition-all shadow-md shadow-[#0F766E]/20"
            >
              {t.verify}
            </button>
            <button
              type="button"
              onClick={() => setShowOtpSheet(false)}
              className="w-full py-2 text-xs text-slate-500 font-semibold hover:text-slate-800"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
