import React, { useState } from 'react';
import { AcademicWeek, Schedule } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Copy, ArrowRight, AlertTriangle, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface CopyWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicWeeks: AcademicWeek[];
  allSchedules: Schedule[];
  onCopySuccess: () => void;
}

export const CopyWeekModal: React.FC<CopyWeekModalProps> = ({
  isOpen,
  onClose,
  academicWeeks,
  allSchedules,
  onCopySuccess,
}) => {
  const { currentUser } = useAuth();

  const [sourceWeekId, setSourceWeekId] = useState<string>(
    academicWeeks[0]?.id || ''
  );
  const [targetWeekId, setTargetWeekId] = useState<string>(
    academicWeeks[1]?.id || ''
  );

  const [isCopying, setIsCopying] = useState(false);
  const [result, setResult] = useState<{ copiedCount: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const sourceWeek = academicWeeks.find((w) => w.id === sourceWeekId);
  const targetWeek = academicWeeks.find((w) => w.id === targetWeekId);

  const sourceSchedules = allSchedules.filter((s) => s.academicWeekId === sourceWeekId);
  const targetExisting = allSchedules.filter((s) => s.academicWeekId === targetWeekId);

  const handleCopy = async () => {
    if (!sourceWeek || !targetWeek) return;
    if (sourceWeekId === targetWeekId) {
      alert('Source and target academic weeks cannot be identical.');
      return;
    }

    setIsCopying(true);
    setResult(null);

    const res = await DataService.copyWeeklyTimetable(
      sourceWeek,
      targetWeek,
      allSchedules,
      currentUser?.username || 'admin',
      currentUser?.role || 'admin'
    );

    setIsCopying(false);
    setResult(res);

    if (res.copiedCount > 0) {
      onCopySuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Banner */}
        <div className="bg-[#102A56] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Copy Weekly Academic Timetable</h3>
              <p className="text-xs text-blue-200">
                Safely duplicate complete room and slot allocations across weeks
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Week Selection Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Source Week */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Source Week (Copy From)
              </label>
              <select
                value={sourceWeekId}
                onChange={(e) => setSourceWeekId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#102A56]"
              >
                {academicWeeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} {w.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 font-medium">
                Contains <strong>{sourceSchedules.length}</strong> scheduled lectures
              </div>
            </div>

            {/* Target Week */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Target Week (Copy Into)
              </label>
              <select
                value={targetWeekId}
                onChange={(e) => setTargetWeekId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#102A56]"
              >
                {academicWeeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} {w.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-500 font-medium">
                Already has <strong>{targetExisting.length}</strong> bookings
              </div>
            </div>
          </div>

          {/* Conflict Guard Notice */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Intelligent Duplication &amp; Conflict Guarantee</span>
            </div>
            <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
              <li>Preserves original weekday mapping (Monday to Monday, Saturday to Saturday).</li>
              <li>Preserves exact classroom, batch, module, and lecturer assignments.</li>
              <li>Skips already populated cells to prevent duplicate record collisions.</li>
              <li>The copied week becomes an independent historical record; modifying either week will not affect the other.</li>
            </ul>
          </div>

          {/* Results Feedback */}
          {result && (
            <div
              className={`p-4 rounded-xl text-xs ${
                result.copiedCount > 0
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {result.copiedCount > 0 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span>
                  {result.copiedCount > 0
                    ? `Successfully synchronized ${result.copiedCount} lectures into ${targetWeek?.label}`
                    : 'No new schedules copied.'}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-1 text-[11px] text-slate-600">
                  {result.errors.join(' ')}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              disabled={isCopying || sourceSchedules.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#102A56] hover:bg-[#1D4E89] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Copy className="w-4 h-4 text-purple-300" />
              <span>{isCopying ? 'Processing Copy...' : 'Confirm & Copy Timetable'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
