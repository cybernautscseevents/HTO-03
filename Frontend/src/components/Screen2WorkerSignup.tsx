import React, { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle2, ShieldCheck, Sparkles, Volume2, RotateCcw, AlertCircle } from 'lucide-react';
import { Language, WorkerProfile, ThemeMode } from '../types';
import { TRANSLATIONS, LANG_CODES } from '../data/translations';
import { parseWorkerVoice, SAMPLE_UTTERANCES } from '../data/taxonomy';
import { playSound, speakText, triggerHaptic } from '../utils/audio';

interface Screen2WorkerSignupProps {
  lang: Language;
  onProfileCreated: (profile: WorkerProfile) => void;
  theme?: ThemeMode;
}

export const Screen2WorkerSignup: React.FC<Screen2WorkerSignupProps> = ({
  lang,
  onProfileCreated,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const parsed = parseWorkerVoice(transcript);
  const wordsCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const isReady = wordsCount >= 4;

  const detectedFields = {
    name: !!parsed.name && !parsed.missing.includes('name'),
    trade: !!parsed.trade && !parsed.missing.includes('trade'),
    years: parsed.experience_years !== null && !parsed.missing.includes('years'),
    area: parsed.areas.length > 0 && !parsed.missing.includes('area'),
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      playSound('start');
      const sample = SAMPLE_UTTERANCES.find((u) => u.lang === lang && u.role === 'worker');
      if (sample) setTranscript(sample.text);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      const recognition = new SpeechRecognition();
      recognition.lang = LANG_CODES[lang] || 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsListening(true);
        setCountdown(20);
        playSound('start');
        triggerHaptic([100]);

        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              stopListening();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      };

      recognition.onresult = (e: any) => {
        const text = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join(' ');
        setTranscript(text);
      };

      recognition.onerror = () => {
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      stopListening();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    playSound('stop');
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleApplyPreset = (text: string) => {
    setTranscript(text);
    playSound('start');
    triggerHaptic([60]);
  };

  const handleDone = () => {
    setIsProcessing(true);
    playSound('start');
    setTimeout(() => {
      const profile = parseWorkerVoice(transcript);
      setIsProcessing(false);
      onProfileCreated(profile);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return (
    <div className={`flex flex-col min-h-full justify-between px-1 py-1 space-y-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <div className="space-y-4">
        <div>
          <h2 className={`font-display font-extrabold text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-[#0F2824]'}`}>
            {t.tell}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>{t.say20}</p>
        </div>

        {/* 96px Tactile Mic with Animated Visualizer */}
        <div className="flex flex-col items-center justify-center my-3">
          <div className="relative flex items-center justify-center">
            {/* Countdown SVG Ring */}
            {isListening && (
              <svg className="absolute w-36 h-36 -rotate-90 pointer-events-none">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke={isDark ? '#07241F' : '#E2E8F0'}
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="#F59E0B"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - countdown / 20)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            )}

            <button
              type="button"
              onClick={toggleMic}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 shadow-xl active:scale-95 ${
                isListening
                  ? 'bg-rose-600 shadow-rose-600/30 scale-105'
                  : 'bg-gradient-to-tr from-[#0F766E] to-teal-500 shadow-[#0F766E]/30 hover:brightness-105'
              }`}
              title={isListening ? 'Stop recording' : 'Start speaking'}
            >
              {isListening ? (
                <div className="flex items-center gap-1.5 h-7">
                  <span className="w-1.5 bg-white rounded-full animate-eq-1" />
                  <span className="w-1.5 bg-white rounded-full animate-eq-2" />
                  <span className="w-1.5 bg-white rounded-full animate-eq-3" />
                  <span className="w-1.5 bg-white rounded-full animate-eq-1" />
                </div>
              ) : (
                <Mic className="w-10 h-10 stroke-[2.2]" />
              )}
            </button>
          </div>
          <p className={`mt-3 text-sm font-extrabold min-h-[22px] ${isDark ? 'text-[#F59E0B]' : 'text-[#0F766E]'}`}>
            {isListening ? `${t.listening} (${countdown}s)` : t.hold}
          </p>
        </div>

        {/* Dynamic Checklist Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
              detectedFields.name
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isDark
                  ? 'bg-[#041E19] text-emerald-300/50 border-emerald-900'
                  : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            {detectedFields.name && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{t.c_name}</span>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
              detectedFields.trade
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isDark
                  ? 'bg-[#041E19] text-emerald-300/50 border-emerald-900'
                  : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            {detectedFields.trade && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{t.c_trade}</span>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
              detectedFields.years
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isDark
                  ? 'bg-[#041E19] text-emerald-300/50 border-emerald-900'
                  : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            {detectedFields.years && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{t.c_years}</span>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
              detectedFields.area
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : isDark
                  ? 'bg-[#041E19] text-emerald-300/50 border-emerald-900'
                  : 'bg-white text-slate-500 border-slate-300'
            }`}
          >
            {detectedFields.area && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{t.c_area}</span>
          </div>
        </div>

        {/* Live Transcript / Fallback text area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300/80' : 'text-slate-500'}`}>
              {t.type_instead}:
            </label>
            {wordsCount > 0 && (
              <span className={`text-[11px] font-semibold ${isDark ? 'text-emerald-400' : 'text-slate-400'}`}>
                {wordsCount} words captured
              </span>
            )}
          </div>
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t.ex1}
            className={`w-full p-3.5 rounded-2xl border-2 text-base transition-colors shadow-sm focus:outline-none ${
              isDark
                ? 'border-emerald-900 bg-[#041E19] text-white placeholder:text-emerald-400/40 focus:border-[#F59E0B]'
                : 'border-slate-200 bg-white text-slate-900 focus:border-[#0F766E]'
            }`}
          />
        </div>

        {/* Quick sample voice presets for instant click */}
        <div className={`space-y-1.5 p-3 rounded-2xl border ${
          isDark ? 'bg-[#0A2E27]/80 border-emerald-800/80' : 'bg-emerald-50/80 border-emerald-200/80'
        }`}>
          <div className={`text-xs font-extrabold flex items-center gap-1 ${isDark ? 'text-[#F59E0B]' : 'text-[#0F766E]'}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.quick_sample}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SAMPLE_UTTERANCES.filter((u) => u.role === 'worker').map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(sample.text)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold active:scale-95 transition-all text-left shadow-2xs ${
                  isDark
                    ? 'bg-[#07241F] border-emerald-700/60 text-emerald-200 hover:bg-emerald-900/60'
                    : 'bg-white border-emerald-300/80 text-emerald-950 hover:bg-emerald-100/60'
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Consent Notice */}
        <div className={`flex items-start gap-2 p-3 rounded-2xl text-xs ${
          isDark ? 'bg-[#041E19] text-emerald-200/70 border border-emerald-900' : 'bg-slate-100 text-slate-600'
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>{t.consent}</span>
        </div>
      </div>

      {/* Done Speaking Primary Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleDone}
          disabled={!isReady || isProcessing}
          className={`w-full min-h-[56px] rounded-2xl font-display font-bold text-lg flex items-center justify-center transition-all ${
            isReady && !isProcessing
              ? 'bg-[#0F766E] text-white shadow-lg shadow-[#0F766E]/20 hover:bg-[#115E59] active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? t.making : t.done}
        </button>
      </div>
    </div>
  );
};
