import React, { useState } from 'react';
import { AcademicWeek, Schedule, Classroom, TimeSlot, DayOfWeek } from '../types';
import { ExcelExporter } from '../utils/excelExporter';
import { getColomboDateString, getColomboDayOfWeek } from '../utils/colomboTime';
import { FileSpreadsheet, Download, X, Calendar, CheckCircle, BarChart3 } from 'lucide-react';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicWeeks: AcademicWeek[];
  currentWeek: AcademicWeek;
  schedules: Schedule[];
  classrooms: Classroom[];
  timeSlots: TimeSlot[];
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  academicWeeks,
  currentWeek,
  schedules,
  classrooms,
  timeSlots,
}) => {
  const [exportType, setExportType] = useState<'week' | 'day' | 'utilization'>('week');
  const [selectedWeekId, setSelectedWeekId] = useState<string>(currentWeek.id);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getColomboDayOfWeek());
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportType === 'week') {
        const targetWeek = academicWeeks.find((w) => w.id === selectedWeekId) || currentWeek;
        await ExcelExporter.exportWeeklyTimetable(targetWeek, schedules, classrooms, timeSlots);
      } else if (exportType === 'day') {
        const todayStr = getColomboDateString();
        await ExcelExporter.exportDayTimetable(selectedDay, todayStr, schedules, classrooms, timeSlots);
      } else if (exportType === 'utilization') {
        await ExcelExporter.exportUtilizationReport(schedules, classrooms, timeSlots);
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-[#102A56] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Export Timetable to Excel (.xlsx)</h3>
              <p className="text-xs text-blue-200">
                Official BCAS Colombo institutional workbook generation
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Export Mode Selection */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setExportType('week')}
              className={`p-3 rounded-xl border text-center transition ${
                exportType === 'week'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 mx-auto mb-1 text-blue-600" />
              <span>Full Weekly Timetable</span>
            </button>

            <button
              type="button"
              onClick={() => setExportType('day')}
              className={`p-3 rounded-xl border text-center transition ${
                exportType === 'day'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
              <span>Single Day Timetable</span>
            </button>

            <button
              type="button"
              onClick={() => setExportType('utilization')}
              className={`p-3 rounded-xl border text-center transition ${
                exportType === 'utilization'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 mx-auto mb-1 text-purple-600" />
              <span>Hall Utilization Report</span>
            </button>
          </div>

          {/* Conditional Options */}
          {exportType === 'week' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Select Academic Week to Export
              </label>
              <select
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#102A56]"
              >
                {academicWeeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} {w.isCurrent ? '(Current Week)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Generates a multi-sheet Excel file with an Overview Summary + Monday through Saturday day tabs.
              </p>
            </div>
          )}

          {exportType === 'day' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Select Academic Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#102A56]"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportType === 'utilization' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Compiles occupancy metrics, utilization percentages, and capacity ratings across all 39 BCAS classrooms and specialized facilities.
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Excel...' : 'Download Spreadsheet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
