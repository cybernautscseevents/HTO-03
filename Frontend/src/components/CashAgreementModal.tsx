import React, { useState } from 'react';
import { Mic, CheckCircle2, ShieldCheck, X, Sparkles, FileText, Banknote, ArrowRight, Check } from 'lucide-react';
import { Language, CashAgreement } from '../types';
import { playSound, triggerHaptic, speakText } from '../utils/audio';

interface CashAgreementModalProps {
  lang: Language;
  jobId: number;
  initialTask: string;
  existingAgreement?: CashAgreement;
  onSaveAgreement: (agreement: CashAgreement) => void;
  onClose: () => void;
}

export const CashAgreementModal: React.FC<CashAgreementModalProps> = ({
  lang,
  jobId,
  initialTask,
  existingAgreement,
  onSaveAgreement,
  onClose,
}) => {
  const [transcript, setTranscript] = useState(
    existingAgreement?.recorded_transcript ||
    'Fan winding replaced and switch checked, agreed price four hundred rupees cash.'
  );
  const [isListening, setIsListening] = useState(false);
  const [price, setPrice] = useState<number>(existingAgreement?.agreed_price || 400);
  const [scope, setScope] = useState<string>(existingAgreement?.task_scope || initialTask || 'Fan winding repair');
  const [workerConfirmed, setWorkerConfirmed] = useState(existingAgreement?.confirmed_by_worker ?? true);
  const [customerConfirmed, setCustomerConfirmed] = useState(existingAgreement?.confirmed_by_customer ?? true);
  const [isLocked, setIsLocked] = useState(!!existingAgreement);

  const sampleVoiceNotes = [
    { text: 'Fan winding repaired and switch checked, agreed price four hundred rupees cash.', price: 400, scope: 'Fan winding & switch check' },
    { text: 'Leaking pipe joint sealed with new washer, agreed price three hundred fifty rupees cash.', price: 350, scope: 'Pipe joint & washer replacement' },
    { text: 'AC filter washed and gas pressure checked, agreed price seven hundred rupees cash.', price: 700, scope: 'AC filter wash & gas inspection' },
  ];

  const extractAgreementFromText = (text: string) => {
    let extractedPrice = price;
    let extractedScope = scope;

    // Price extraction logic: numeric digits or words in English / Hindi / Kannada
    const numMatch = text.match(/(\d{2,5})/);
    if (numMatch) {
      extractedPrice = parseInt(numMatch[1], 10);
    } else if (/four hundred|चार सौ|ನಾಲ್ಕು ನೂರು/i.test(text)) {
      extractedPrice = 400;
    } else if (/three hundred fifty|साढ़े तीन सौ|ಮೂರೂವರೆ ನೂರು/i.test(text)) {
      extractedPrice = 350;
    } else if (/five hundred|पाँच सौ|ಐದು ನೂರು/i.test(text)) {
      extractedPrice = 500;
    } else if (/seven hundred|सात सौ|ಏಳು ನೂರು/i.test(text)) {
      extractedPrice = 700;
    } else if (/two hundred fifty|ढाई सौ|ಎರಡು ನೂರು/i.test(text)) {
      extractedPrice = 250;
    }

    // Scope extraction
    if (/fan|पंखा|ಫ್ಯಾನ್/i.test(text)) {
      extractedScope = 'Fan winding & switch check';
    } else if (/pipe|leak|पाइप|ಲೀಕ್/i.test(text)) {
      extractedScope = 'Pipe joint & washer replacement';
    } else if (/ac|filter|एसी/i.test(text)) {
      extractedScope = 'AC filter wash & gas inspection';
    } else if (/switch|board|स्विच/i.test(text)) {
      extractedScope = 'Switchboard replacement & wiring';
    } else if (text.length > 5 && !extractedScope) {
      extractedScope = text.slice(0, 40);
    }

    setPrice(extractedPrice);
    setScope(extractedScope);
  };

  const handleApplyPreset = (item: typeof sampleVoiceNotes[0]) => {
    setTranscript(item.text);
    setPrice(item.price);
    setScope(item.scope);
    playSound('start');
    triggerHaptic([60]);
  };

  const handleToggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      handleApplyPreset(sampleVoiceNotes[0]);
      return;
    }

    if (isListening) {
      setIsListening(false);
      playSound('stop');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.onstart = () => {
        setIsListening(true);
        playSound('start');
        triggerHaptic([100]);
      };
      recognition.onresult = (e: any) => {
        const text = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join(' ');
        setTranscript(text);
        extractAgreementFromText(text);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
      handleApplyPreset(sampleVoiceNotes[0]);
    }
  };

  const handleLockAgreement = () => {
    playSound('success');
    triggerHaptic([150, 100, 200]);
    setIsLocked(true);

    const agreement: CashAgreement = {
      job_id: jobId,
      agreed_price: price,
      task_scope: scope,
      recorded_transcript: transcript,
      confirmed_by_worker: workerConfirmed,
      confirmed_by_customer: customerConfirmed,
      locked_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      payment_mode: 'cash',
    };

    onSaveAgreement(agreement);
    speakText(`Cash agreement locked for ₹${price}. Mutual handshake confirmed.`, lang);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#07241F]/85 backdrop-blur-[12px] text-white rounded-[32px] border border-emerald-700/70 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-emerald-900/80 flex items-center justify-between bg-[#051C18]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Banknote className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white">Voice Cash Agreement</h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/60">
                  Zero-Fintech Escrow
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                AI Voice Handshake • Prevents Price Disputes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Confirmed Immutable Receipt Banner */}
          {isLocked ? (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-100 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Cash Agreement Locked</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-300">RECEIPT #{jobId}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-emerald-200/90 font-medium">Final Agreed Cash Amount:</span>
                <span className="font-display font-black text-3xl text-amber-300">₹{price}</span>
              </div>
              <p className="text-xs text-emerald-200 border-t border-emerald-800/80 pt-2 font-medium">
                Scope: <strong className="text-white">{scope}</strong>
              </p>
              <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1">
                <span>✓ Worker Confirmed</span>
                <span>✓ Customer Confirmed</span>
                <span>Payment: Direct Cash</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Spoken Voice Capture Box */}
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Speak 5-sec Agreement:
                  </span>
                  <span className="text-[11px] text-slate-400">e.g. "Agreed price ₹400 cash"</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleListening}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 shadow-md ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse scale-105'
                        : 'bg-[#0F766E] hover:bg-teal-600 text-white'
                    }`}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <p className="text-xs text-emerald-100 font-medium leading-relaxed italic bg-[#031512] p-2.5 rounded-xl border border-emerald-900/80 flex-1">
                    "{transcript}"
                  </p>
                </div>
              </div>

              {/* Quick Sample Voice Notes */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Try Sample Voice Agreements:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {sampleVoiceNotes.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(sample)}
                      className="text-left p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/70 hover:bg-emerald-900/60 text-xs text-emerald-100 font-medium transition-colors"
                    >
                      <p className="font-extrabold text-[#F59E0B]">₹{sample.price} Cash</p>
                      <p className="text-[10px] text-emerald-300 truncate">{sample.scope}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extracted Values (Editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 space-y-1">
                  <label className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">
                    Agreed Cash Price (₹)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#031512] text-amber-300 font-display font-black text-2xl p-2 rounded-xl border border-emerald-800 focus:outline-none"
                  />
                </div>
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 space-y-1">
                  <label className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">
                    Agreed Task Scope
                  </label>
                  <input
                    type="text"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="w-full bg-[#031512] text-white font-medium text-xs p-3 rounded-xl border border-emerald-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Two-Party Digital Handshake Checkboxes */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Mutual Digital Handshake Confirmation
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkerConfirmed(!workerConfirmed);
                      playSound('start');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      workerConfirmed
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-[#031512] border-emerald-900 text-slate-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Worker Confirmed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerConfirmed(!customerConfirmed);
                      playSound('start');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      customerConfirmed
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-[#031512] border-emerald-900 text-slate-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Customer Confirmed</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom CTA */}
        <div className="p-4 bg-[#051C18]/90 border-t border-emerald-900/80">
          {!isLocked ? (
            <button
              type="button"
              onClick={handleLockAgreement}
              disabled={!price || !workerConfirmed || !customerConfirmed}
              className="w-full min-h-[50px] rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#062420] font-display font-black text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>Lock Agreement Note (₹{price})</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[46px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
            >
              Close Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
