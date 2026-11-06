import React from 'react';

export const Footer: React.FC<{ onNavigate?: (view: string) => void }> = () => {
  return (
    <footer className="bg-[#102A56] text-slate-400 border-t border-[#1D4E89] py-4 print:hidden text-center text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="font-medium text-slate-300">
          BCAS Colombo City Campus · Academic Timetable System
        </div>
        <div className="text-slate-400">
          &copy; {new Date().getFullYear()} BCAS. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
