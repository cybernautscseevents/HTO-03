import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Share2, MapPin, Navigation, Phone, CheckCircle2, X, Radio, Battery, Signal, Clock } from 'lucide-react';
import { Language, LiveTrackingSession } from '../types';
import { playSound, triggerHaptic, speakText } from '../utils/audio';

interface SafetyTrackerModalProps {
  lang: Language;
  jobId: number;
  workerName: string;
  destinationArea: string;
  tracking: LiveTrackingSession;
  onUpdateTracking: (updated: LiveTrackingSession) => void;
  onClose: () => void;
}

export const SafetyTrackerModal: React.FC<SafetyTrackerModalProps> = ({
  lang,
  jobId,
  workerName,
  destinationArea,
  tracking,
  onUpdateTracking,
  onClose,
}) => {
  const [sosActive, setSosActive] = useState(tracking.sos_triggered);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [eta, setEta] = useState(tracking.eta_minutes || 8);
  const [currentCoords, setCurrentCoords] = useState({ lat: tracking.lat || 12.8698, lon: tracking.lon || 74.8430 });
  const [lastPing, setLastPing] = useState('Just now');

  // Background pinging: Watch native browser geolocation or fallback simulation every 30 seconds
  useEffect(() => {
    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(5));
            const lon = Number(pos.coords.longitude.toFixed(5));
            setCurrentCoords({ lat, lon });
            setLastPing(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            onUpdateTracking({
              ...tracking,
              lat,
              lon,
              last_ping_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          },
          (err) => {
            console.log('GPS satellite acquisition fallback:', err.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );
      } catch (e) {
        console.warn('Geolocation sensor error', e);
      }
    }

    const interval = setInterval(() => {
      // Simulate micro-movement telemetry update
      setCurrentCoords((prev) => {
        const nextLat = Number((prev.lat + (Math.random() - 0.5) * 0.0003).toFixed(5));
        const nextLon = Number((prev.lon + (Math.random() - 0.5) * 0.0003).toFixed(5));
        onUpdateTracking({
          ...tracking,
          lat: nextLat,
          lon: nextLon,
          last_ping_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        return { lat: nextLat, lon: nextLon };
      });
      setLastPing(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setEta((prev) => Math.max(1, prev - 1));
    }, 15000);

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(interval);
    };
  }, []);

  const handleShareWhatsApp = () => {
    playSound('start');
    const trackingUrl = `${window.location.origin}/track/${jobId}`;
    const shareText = `I am on a Hello job here: ${trackingUrl}. Location: ${destinationArea} (${currentCoords.lat}, ${currentCoords.lon}) with ${workerName}. If I don't check in within 30 minutes, call me!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTriggerSos = () => {
    triggerHaptic([300, 100, 300, 100, 400]);
    playSound('alert');
    setSosCountdown(3);
    const timer = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setSosCountdown(null);
          setSosActive(true);
          onUpdateTracking({
            ...tracking,
            sos_triggered: true,
          });
          speakText('Emergency SOS initiated. Alert sent to emergency contacts.', lang);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSos = () => {
    setSosActive(false);
    setSosCountdown(null);
    playSound('stop');
    onUpdateTracking({
      ...tracking,
      sos_triggered: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#07241F]/85 backdrop-blur-[12px] text-white rounded-[32px] border border-emerald-700/70 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* iOS-grade Modal Header */}
        <div className="px-5 py-4 border-b border-emerald-900/80 flex items-center justify-between bg-[#051C18]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white">Live Job Safety Net</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                Geofence Active • Tokenized Session #{jobId}
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
          {/* Emergency Alert Banner if SOS Active */}
          {sosActive && (
            <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-100 flex items-start gap-3 shadow-lg animate-pulse">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-white">EMERGENCY SOS ALERT TRANSMITTED</p>
                <p className="text-xs text-rose-200 leading-relaxed">
                  GPS coordinates broadcast to your emergency contact ({tracking.emergency_contact}) and local police dispatch.
                </p>
                <div className="pt-2 flex gap-2">
                  <a
                    href="tel:112"
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Police (112)</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCancelSos}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold text-xs"
                  >
                    I am Safe (Dismiss)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Live Map Radar Canvas */}
          <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-[#031512] border border-emerald-900/80 shadow-inner flex flex-col justify-between p-3.5">
            {/* Ambient Grid Lines representing street layout */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Simulated Live Route Vector */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 60 140 Q 150 70, 260 110 T 380 60"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray="6 4"
                fill="none"
                className="opacity-70"
              />
              {/* Geofence Safety Bubble */}
              <circle cx="260" cy="110" r="54" fill="rgba(16, 185, 129, 0.08)" stroke="#10B981" strokeWidth="1" />
            </svg>

            {/* Top Telemetry Overlay */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-emerald-300/90 bg-[#051C18]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-800/60">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{currentCoords.lat}° N, {currentCoords.lon}° E</span>
              </span>
              <span>Ping: {lastPing}</span>
            </div>

            {/* Worker Location Pin (Animated) */}
            <div className="relative z-10 self-center flex flex-col items-center animate-bounce">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F59E0B] to-amber-300 text-[#062420] flex items-center justify-center font-display font-black text-sm shadow-[0_0_18px_rgba(245,158,11,0.6)] border-2 border-white">
                {workerName[0]}
              </div>
              <span className="text-[10px] font-bold bg-[#062420] text-amber-300 px-2 py-0.5 rounded-full mt-1 border border-amber-400/40">
                {workerName} • {eta} min away
              </span>
            </div>

            {/* Bottom Status bar */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-emerald-200 bg-[#051C18]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-800/60 font-semibold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Destination: {destinationArea}</span>
              </span>
              <span className="text-emerald-400 font-bold">500m Safe Radius</span>
            </div>
          </div>

          {/* Device Telemetry info */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
              <p className="text-[10px] text-emerald-300/70 uppercase tracking-wider">Device Battery</p>
              <p className="font-bold text-white mt-0.5 flex items-center justify-center gap-1">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                <span>88% Stable</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
              <p className="text-[10px] text-emerald-300/70 uppercase tracking-wider">Cellular GPS</p>
              <p className="font-bold text-white mt-0.5 flex items-center justify-center gap-1">
                <Signal className="w-3.5 h-3.5 text-emerald-400" />
                <span>5G High-Acc</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60">
              <p className="text-[10px] text-emerald-300/70 uppercase tracking-wider">Emergency Contact</p>
              <p className="font-bold text-white mt-0.5 truncate">{tracking.emergency_contact}</p>
            </div>
          </div>

          {/* Action 1: One-Tap WhatsApp Live Link Share */}
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-[#F59E0B]" />
                  <span>Share Live Safety Link</span>
                </p>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Sends live tracking map link directly to your family or emergency contact.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full min-h-[46px] rounded-xl bg-[#25D366] hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              <span>Broadcast Safety Link via WhatsApp</span>
            </button>
          </div>

          {/* Action 2: Panic / SOS Emergency Button */}
          <div className="pt-1">
            {sosCountdown !== null ? (
              <div className="w-full p-4 rounded-2xl bg-rose-600 text-white text-center space-y-2 shadow-xl animate-pulse">
                <p className="font-black text-base">TRANSMITTING SOS IN {sosCountdown}s...</p>
                <button
                  type="button"
                  onClick={() => setSosCountdown(null)}
                  className="px-4 py-1.5 rounded-xl bg-white text-rose-950 font-black text-xs uppercase tracking-wider"
                >
                  Cancel Abort
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriggerSos}
                className="w-full min-h-[50px] rounded-2xl bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-600 text-rose-200 font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
                <span>Panic / Emergency SOS Trigger</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
