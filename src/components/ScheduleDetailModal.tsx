import React from 'react';
import { Schedule, Classroom } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Clock, MapPin, User, BookOpen, Layers, Edit3, Trash2 } from 'lucide-react';

interface ScheduleDetailModalProps {
  schedule: Schedule | null;
  classroom?: Classroom | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (schedule: Schedule) => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  schedule,
  classroom,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { isAdmin } = useAuth();

  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Banner */}
        <div className="bg-[#102A56] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-block px-2.5 py-1 rounded-md bg-[#D62828] text-white text-[10px] font-bold uppercase tracking-wider mb-2">
            {schedule.departmentName}
          </div>

          <h3 className="text-lg font-bold text-white">{schedule.moduleName}</h3>
          <p className="text-xs text-blue-200 mt-0.5">{schedule.programName}</p>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Lecture Hall</div>
                <div className="text-xs font-bold text-slate-900">{schedule.classroomName}</div>
                {classroom && (
                  <div className="text-[10px] text-slate-500">
                    {classroom.category} · {classroom.capacity} seats
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Allocated Time</div>
                <div className="text-xs font-bold text-slate-900">
                  {schedule.startTime} – {schedule.endTime}
                </div>
                <div className="text-[10px] text-slate-500">
                  {schedule.day}, {schedule.date}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 text-xs">
              <User className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-slate-500">Assigned Lecturer: </span>
                <span className="font-semibold text-slate-900">{schedule.lecturerName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Layers className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="text-slate-500">Student Intake / Batch: </span>
                <span className="font-semibold text-slate-900">{schedule.batchName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-slate-500">Academic Department: </span>
                <span className="font-semibold text-slate-900">{schedule.departmentName}</span>
              </div>
            </div>

            {schedule.notes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Session Notes: </span>
                {schedule.notes}
              </div>
            )}
          </div>

          {/* Admin Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 font-mono">
              Ref: {schedule.scheduleId || schedule.id}
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(schedule);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition border border-blue-200"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              {isAdmin && onDelete && (
                <button
                  onClick={() => {
                    onClose();
                    onDelete(schedule);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs transition border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
