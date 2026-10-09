import React, { useState } from 'react';
import { Star, CheckCircle2, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Language, RatingSubmission, ThemeMode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { playSound, triggerHaptic } from '../utils/audio';

interface Screen8RatingProps {
  lang: Language;
  workerName: string;
  workerId: number;
  jobId: number;
  onSubmitRating: (submission: RatingSubmission) => void;
  theme?: ThemeMode;
}

export const Screen8Rating: React.FC<Screen8RatingProps> = ({
  lang,
  workerName,
  workerId,
  jobId,
  onSubmitRating,
  theme = 'dark',
}) => {
  const t = TRANSLATIONS[lang];
  const isDark = theme === 'dark';
  const [stars, setStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([t.t_time, t.t_neat]);
  const [wouldRehire, setWouldRehire] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tagsList = [t.t_time, t.t_neat, t.t_fair];

  const handleStarClick = (rating: number) => {
    setStars(rating);
    playSound('star');
    triggerHaptic([80]);
  };

  const toggleTag = (tag: string) => {
    playSound('start');
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((x) => x !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    playSound('success');
    triggerHaptic([100, 80, 150]);
    setTimeout(() => {
      onSubmitRating({
        job_id: jobId,
        worker_id: workerId,
        stars,
        rehire: wouldRehire,
        tags: selectedTags,
      });
    }, 400);
  };

  return (
    <div className={`flex flex-col min-h-full justify-between space-y-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className="space-y-4">
        <div className="text-center pt-1">
          <h2 className={`font-display font-black text-2xl sm:text-3xl ${isDark ? 'text-white' : 'text-[#06332A]'}`}>
            {t.how}
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>
            Your honest rating builds <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{workerName}'s</strong> verified reputation.
          </p>
        </div>

        {/* 5 Big 52px Interactive Stars */}
        <div className="flex items-center justify-center gap-2 my-2">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleStarClick(val)}
              className="p-1.5 transition-transform active:scale-90 hover:scale-110 focus:outline-none"
            >
              <Star
                className={`w-12 h-12 transition-all duration-200 ${
                  val <= stars
                    ? 'fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]'
                    : isDark
                      ? 'text-emerald-950 fill-[#031512]'
                      : 'text-slate-200 fill-slate-100'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-xs font-black text-[#F59E0B] uppercase tracking-wider">
          {stars} of 5 Stars Selected
        </p>

        {/* Impact on Trust Score Banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs backdrop-blur-[12px] ${
          isDark ? 'bg-[#0A2E27]/80 border-emerald-800/80' : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Direct Impact:</span>
          </div>
          <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
            Boosts {workerName}'s Trust Score (+4 pts)
          </span>
        </div>

        {/* Feedback Tag Chips */}
        <div className="space-y-2">
          <span className={`text-xs font-bold uppercase tracking-wider block text-center ${isDark ? 'text-emerald-300/80' : 'text-slate-500'}`}>
            What went best?
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tagsList.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-[12px] transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#F59E0B] text-[#062420] shadow-sm scale-105 font-black'
                      : isDark
                        ? 'bg-[#0A2E27]/80 text-emerald-200 border border-emerald-800/80 hover:bg-emerald-900/50'
                        : 'bg-white/80 text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && '✓ '}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Would Hire Again Switch */}
        <div className={`p-4 rounded-3xl border shadow-md flex items-center justify-between backdrop-blur-[12px] transition-all duration-200 ${
          isDark ? 'bg-[#0A2E27]/80 border-emerald-800/80 text-white' : 'bg-white/80 border-emerald-200 text-slate-900 shadow-emerald-900/5'
        }`}>
          <div>
            <p className={`font-display font-bold text-base leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.again}
            </p>
            <p className={`text-xs font-medium ${isDark ? 'text-emerald-200/80' : 'text-slate-600'}`}>Adds worker to your private trusted list</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setWouldRehire(!wouldRehire);
              playSound('start');
            }}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              wouldRehire ? 'bg-[#0F766E]' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                wouldRehire ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Primary Action */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={stars === 0 || isSubmitting}
          className="w-full min-h-[56px] rounded-2xl bg-[#F59E0B] text-[#062420] font-display font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#F59E0B]/25 hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <span>{t.submit}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
        <p className="text-center text-xs text-emerald-300/70 font-medium">Takes 5 seconds</p>
      </div>
    </div>
  );
};
