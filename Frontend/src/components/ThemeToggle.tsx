import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../types';
import { playSound, triggerHaptic } from '../utils/audio';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  className?: string;
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggleTheme,
  className = '',
  compact = false,
}) => {
  const isDark = theme === 'dark';
  const handleClick = () => {
    playSound('start');
    triggerHaptic([40]);
    onToggleTheme();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl transition-all duration-300 select-none active:scale-95 border ${
        isDark
          ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-200 border-emerald-800/80 shadow-xs'
          : 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-900 border-emerald-200 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#F59E0B] transition-transform duration-300 rotate-0" />
        ) : (
          <Sun className="w-4 h-4 text-amber-600 transition-transform duration-300 rotate-0" />
        )}
      </div>
      {!compact && (
        <span className="text-xs font-black tracking-tight uppercase">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
