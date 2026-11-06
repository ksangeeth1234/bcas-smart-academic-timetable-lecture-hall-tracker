import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Hide if already running in standalone PWA window
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-xl font-bold transition shadow-xs cursor-pointer ${
          compact
            ? 'px-2.5 py-1.5 text-[11px] bg-[#D62828] text-white hover:bg-red-700'
            : 'px-3 py-1.5 text-xs bg-[#D62828] hover:bg-red-700 text-white'
        }`}
        title="Install BCAS Smart Timetable on your Home Screen"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>

      {/* Cross-Platform Mobile & Desktop Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#102A56] flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                BCAS
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Install BCAS Timetable
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant launch &amp; offline capability
                </p>
              </div>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div className="pt-0.5">
                    Tap the <strong className="text-blue-700">Share</strong> button in Safari (at the bottom of your screen).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div className="pt-0.5">
                    Scroll down and tap <strong className="text-emerald-700">&quot;Add to Home Screen&quot;</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div className="pt-0.5">
                    Tap <strong className="text-slate-900">&quot;Add&quot;</strong> in top-right to finish.
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Chrome / Edge / Desktop Instructions */
              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div className="pt-0.5">
                    Tap the <strong>three dots (⋮)</strong> or browser menu in your mobile browser.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div className="pt-0.5">
                    Select <strong className="text-emerald-700">&quot;Install app&quot;</strong> or <strong className="text-emerald-700">&quot;Add to Home screen&quot;</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div className="pt-0.5">
                    Confirm prompt to install directly to your device apps.
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Works offline with cached schedules &amp; halls</span>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#102A56] py-2.5 text-xs font-bold text-white hover:bg-[#1D4E89] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
