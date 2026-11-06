import React, { useState, useEffect } from 'react';
import { getColomboDateString, getColomboDayOfWeek, getColomboTimeString } from '../utils/colomboTime';
import { Clock } from 'lucide-react';

export const LiveClock: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = getColomboTimeString();
  const dateStr = getColomboDateString();
  const dayStr = getColomboDayOfWeek();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-200 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-xs font-mono">
        <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>{timeStr}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white backdrop-blur-xs shadow-xs">
      <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
      <div className="leading-tight">
        <div className="text-xs font-bold font-mono tracking-wider flex items-center gap-1.5">
          <span>{timeStr}</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans font-semibold">
            Colombo (GMT+5:30)
          </span>
        </div>
        <div className="text-[11px] text-slate-300 font-medium">
          {dayStr}, {dateStr}
        </div>
      </div>
    </div>
  );
};
