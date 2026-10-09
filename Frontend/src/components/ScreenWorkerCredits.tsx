import React, { useState } from 'react';
import {
  Coins, Gift, History, Award, CheckCircle2, Star, Sparkles, X,
  TrendingUp, Users, Clock, ShieldCheck, Flame
} from 'lucide-react';
import { Language, WorkerProfile, ThemeMode, CreditHistoryItem } from '../types';
import { playSound, triggerHaptic } from '../utils/audio';

export const INITIAL_CREDIT_HISTORY: CreditHistoryItem[] = [
  {
    id: 'ch-1',
    points: 100,
    reason: 'Earned for referring fellow worker Ramesh Babu (Mason)',
    category: 'referral',
    date: 'Yesterday, 4:20 PM',
    badge: 'Referral Bonus',
  },
  {
    id: 'ch-2',
    points: 250,
    reason: 'Earned for doing work on time without leaves (14-day zero absent streak)',
    category: 'attendance',
    date: '3 days ago',
    badge: 'Zero Leave Streak',
  },
  {
    id: 'ch-3',
    points: 150,
    reason: 'Earned for 5-star site safety & quality rating from Shree Ram Builders',
    category: 'quality',
    date: 'Last week',
    badge: '5-Star Quality',
  },
  {
    id: 'ch-4',
    points: 200,
    reason: 'Earned for 10 consecutive on-time morning site arrivals (Before 8:00 AM)',
    category: 'punctuality',
    date: '2 weeks ago',
    badge: 'Punctuality Hero',
  },
  {
    id: 'ch-5',
    points: 750,
    reason: 'Earned for completing 1-month commercial foundation casting contract',
    category: 'milestone',
    date: 'Last month',
    badge: 'Contract Milestone',
  },
];

interface ScreenWorkerCreditsProps {
  lang: Language;
  profile: WorkerProfile;
  creditPoints: number;
  creditHistory: CreditHistoryItem[];
  onClaimReward: (rewardName: string, requiredPts: number) => void;
  claimedReward: string | null;
  onDismissClaimToast: () => void;
  theme?: ThemeMode;
}

export const ScreenWorkerCredits: React.FC<ScreenWorkerCreditsProps> = ({
  lang,
  profile,
  creditPoints,
  creditHistory,
  onClaimReward,
  claimedReward,
  onDismissClaimToast,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Balance Hero Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl backdrop-blur-[12px] relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#0B352D] via-[#072B24] to-[#041A17] border-emerald-700/60'
          : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border-emerald-200 shadow-emerald-950/5'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-[#F59E0B] border border-amber-400/30 text-[11px] font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>Tier 2: Gold Mason Member</span>
            </div>
            <h2 className={`font-display font-black text-2xl sm:text-3xl mt-1 ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
              Labourer Trust Credits & Bonuses
            </h2>
            <p className={`text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
              Earn points for on-time work, zero absent streaks, referrals & contractor endorsements
            </p>
          </div>

          {/* Big Points Badge */}
          <div className={`p-4 rounded-2xl border text-center sm:text-right shrink-0 ${
            isDark ? 'bg-[#062420]/90 border-emerald-700/80' : 'bg-white border-emerald-200 shadow-sm'
          }`}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F59E0B] block">
              Available Credits
            </span>
            <div className="font-display font-black text-3xl sm:text-4xl text-emerald-400 leading-none mt-1">
              {creditPoints.toLocaleString()} <span className="text-sm font-sans font-bold text-slate-400">Pts</span>
            </div>
            <span className={`text-[11px] font-bold block mt-1 ${isDark ? 'text-emerald-300' : 'text-slate-600'}`}>
              ₹{(creditPoints * 0.5).toFixed(0)} Redeemable Value
            </span>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="mt-6 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={isDark ? 'text-emerald-200' : 'text-slate-700'}>
              Progress to 2,000 Pts Tool Kit Milestone:
            </span>
            <span className="text-[#F59E0B] font-mono font-black">
              {creditPoints} / 2,000 Pts ({Math.min(100, Math.round((creditPoints / 2000) * 100))}%)
            </span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-black/40 overflow-hidden p-0.5 border border-emerald-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#F59E0B] to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.min(100, (creditPoints / 2000) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Claim Toast Banner */}
      {claimedReward && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✓ Successfully claimed: {claimedReward}! Payout initiated directly to your UPI/bank.</span>
          </div>
          <button type="button" onClick={onDismissClaimToast} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unlockable Rewards Grid */}
      <div className="space-y-3">
        <h3 className={`font-display font-black text-lg ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
          Redeemable Rewards & Gear Vouchers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Reward 1 */}
          <div className={`p-4 rounded-3xl border flex flex-col justify-between space-y-3 backdrop-blur-[12px] shadow-sm ${
            isDark ? 'bg-[#07241F]/80 border-emerald-800' : 'bg-white border-emerald-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                  Unlocked!
                </span>
                <Gift className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <h4 className="font-display font-bold text-base mt-1">₹250 Cash / UPI Voucher</h4>
              <p className={`text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                Instant bank transfer upon redemption
              </p>
              <p className="text-[11px] font-mono text-[#F59E0B] font-bold">Cost: 1,000 Credits</p>
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('success');
                onClaimReward('₹250 Cash / UPI Voucher', 1000);
              }}
              disabled={creditPoints < 1000}
              className={`w-full py-2.5 rounded-xl font-display font-black text-xs transition-all ${
                creditPoints >= 1000
                  ? 'bg-emerald-500 text-[#062420] hover:brightness-105 active:scale-95 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
              }`}
            >
              {creditPoints >= 1000 ? 'Claim ₹250 Voucher Now' : 'Requires 1,000 Pts'}
            </button>
          </div>

          {/* Reward 2 */}
          <div className={`p-4 rounded-3xl border flex flex-col justify-between space-y-3 backdrop-blur-[12px] shadow-sm ${
            isDark ? 'bg-[#07241F]/80 border-emerald-800' : 'bg-white border-emerald-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/30">
                  In Progress
                </span>
                <Award className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <h4 className="font-display font-bold text-base mt-1">ISI Steel Boots & Trowel Kit</h4>
              <p className={`text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                Delivered free to your site or home
              </p>
              <p className="text-[11px] font-mono text-slate-400 font-bold">Cost: 2,000 Credits ({Math.max(0, 2000 - creditPoints)} pts left)</p>
            </div>
            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-xl font-display font-black text-xs bg-slate-700/50 text-slate-400 cursor-not-allowed"
            >
              Locked (Unlock at 2,000 Pts)
            </button>
          </div>

          {/* Reward 3 */}
          <div className={`p-4 rounded-3xl border flex flex-col justify-between space-y-3 backdrop-blur-[12px] shadow-sm ${
            isDark ? 'bg-[#07241F]/80 border-emerald-800' : 'bg-white border-emerald-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  Milestone 3
                </span>
                <Coins className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-display font-bold text-base mt-1">₹1,000 Festival Bonus</h4>
              <p className={`text-xs ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
                Diwali / Eid festive lump-sum payout
              </p>
              <p className="text-[11px] font-mono text-slate-400 font-bold">Cost: 3,500 Credits</p>
            </div>
            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-xl font-display font-black text-xs bg-slate-700/50 text-slate-400 cursor-not-allowed"
            >
              Locked (Unlock at 3,500 Pts)
            </button>
          </div>
        </div>
      </div>

      {/* Credit Point History Log */}
      <div className={`p-5 sm:p-6 rounded-3xl border backdrop-blur-[12px] shadow-sm space-y-4 ${
        isDark ? 'bg-[#062420]/80 border-emerald-800/80' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-emerald-800/40">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#F59E0B]" />
            <h3 className={`font-display font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Credit Point History & Activity Log
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {creditHistory.length} Transactions
          </span>
        </div>

        <div className="space-y-2.5">
          {creditHistory.map((item) => {
            const isPositive = item.points > 0;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                  isDark ? 'bg-[#041A17] border-emerald-800/50' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    isPositive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {isPositive ? '+' : '-'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.reason}
                      </p>
                      {item.badge && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.date}</span>
                  </div>
                </div>
                <span className={`font-mono font-black text-sm shrink-0 ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isPositive ? `+${item.points}` : item.points} Pts
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to Earn More Credits Guide */}
      <div className={`p-4 rounded-3xl border text-xs space-y-2.5 ${
        isDark ? 'bg-[#0A2E27]/50 border-emerald-800/60' : 'bg-emerald-50/60 border-emerald-200'
      }`}>
        <span className="font-black uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ways to Earn More Credit Points</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="p-2 rounded-xl bg-black/10 border border-emerald-800/30">
            <span className="font-bold block text-emerald-300">+100 Credits</span>
            <p className="text-slate-400 mt-0.5">Refer a fellow mason who completes their first verified site shift.</p>
          </div>
          <div className="p-2 rounded-xl bg-black/10 border border-emerald-800/30">
            <span className="font-bold block text-emerald-300">+250 Credits</span>
            <p className="text-slate-400 mt-0.5">Maintain 14 consecutive shifts without unnotified leaves.</p>
          </div>
          <div className="p-2 rounded-xl bg-black/10 border border-emerald-800/30">
            <span className="font-bold block text-emerald-300">+150 Credits</span>
            <p className="text-slate-400 mt-0.5">Receive a 5-star site safety and quality rating from your contractor.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
