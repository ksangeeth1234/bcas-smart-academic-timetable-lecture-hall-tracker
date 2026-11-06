import React, { useState, useEffect } from 'react';
import {
  Schedule,
  Classroom,
  TimeSlot,
  Department,
  Lecturer,
  Program,
  Batch,
  Module,
  AcademicWeek,
} from '../types';
import { DataService, ScheduleValidationError } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Clock, MapPin, AlertCircle, Trash2, CheckCircle2, UserPlus } from 'lucide-react';
import { AddLecturerModal } from './AddLecturerModal';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSchedule?: Schedule | null;
  defaultDate?: string;
  defaultDay?: string;
  defaultTimeSlot?: TimeSlot | null;
  defaultClassroom?: Classroom | null;
  academicWeek: AcademicWeek;
  allSchedules: Schedule[];
  classrooms: Classroom[];
  timeSlots: TimeSlot[];
  departments: Department[];
  lecturers: Lecturer[];
  programs: Program[];
  batches: Batch[];
  modules: Module[];
  onSaveSuccess: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  existingSchedule,
  defaultDate,
  defaultDay,
  defaultTimeSlot,
  defaultClassroom,
  academicWeek,
  allSchedules,
  classrooms,
  timeSlots,
  departments,
  lecturers,
  programs,
  batches,
  modules,
  onSaveSuccess,
}) => {
  const { currentUser, role } = useAuth();

  const [date, setDate] = useState('');
  const [day, setDay] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [programName, setProgramName] = useState('');
  const [batchName, setBatchName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [notes, setNotes] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddLecturerOpen, setIsAddLecturerOpen] = useState(false);

  // Initialize form when opening
  useEffect(() => {
    if (existingSchedule) {
      setDate(existingSchedule.date);
      setDay(existingSchedule.day);
      setTimeSlotId(existingSchedule.timeSlotId);
      setClassroomId(existingSchedule.classroomId);
      setDepartmentName(existingSchedule.departmentName);
      setProgramName(existingSchedule.programName);
      setBatchName(existingSchedule.batchName);
      setModuleName(existingSchedule.moduleName);
      setLecturerName(existingSchedule.lecturerName);
      setNotes(existingSchedule.notes || '');
    } else {
      const initialDay = defaultDay || 'Monday';
      const isW = initialDay === 'Saturday' || initialDay === 'Sunday';
      const initialDaySlots = timeSlots.filter(
        (ts) => ts.type === (isW ? 'weekend' : 'weekday') && !ts.isBreak && ts.active
      );

      setDate(defaultDate || academicWeek.startDate);
      setDay(initialDay);
      setTimeSlotId(defaultTimeSlot?.id || initialDaySlots[0]?.id || timeSlots[0]?.id || '');
      setClassroomId(defaultClassroom?.id || classrooms[0]?.id || '');
      setDepartmentName(departments[0]?.name || '');
      setProgramName('');
      setBatchName('');
      setModuleName('');
      setLecturerName('');
      setNotes('');
    }
    setValidationError(null);
  }, [isOpen, existingSchedule, defaultDate, defaultDay, defaultTimeSlot, defaultClassroom, academicWeek, timeSlots, classrooms, departments]);

  if (!isOpen) return null;

  const dayOffsetMap: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const handleDayChange = (newDay: string) => {
    setDay(newDay);
    const offset = dayOffsetMap[newDay] ?? 0;
    const start = new Date(academicWeek.startDate);
    start.setDate(start.getDate() + offset);
    setDate(start.toISOString().split('T')[0]);

    // When switching between weekday and weekend, switch to appropriate slot
    const isW = newDay === 'Saturday' || newDay === 'Sunday';
    const slotsForDay = timeSlots.filter(
      (ts) => ts.type === (isW ? 'weekend' : 'weekday') && !ts.isBreak && ts.active
    );
    if (!slotsForDay.some((s) => s.id === timeSlotId) && slotsForDay.length > 0) {
      setTimeSlotId(slotsForDay[0].id);
    }
  };

  const isWeekendDay = day === 'Saturday' || day === 'Sunday';
  const relevantSlots = timeSlots
    .filter((ts) => ts.type === (isWeekendDay ? 'weekend' : 'weekday') && ts.active)
    .sort((a, b) => a.slotNumber - b.slotNumber);

  // Filtered lists based on selections
  const filteredLecturers = lecturers.filter(
    (l) => (!departmentName || l.department === departmentName) && l.status === 'Active'
  );

  const filteredPrograms = programs.filter(
    (p) => !departmentName || p.departmentName === departmentName
  );

  const filteredBatches = batches.filter(
    (b) =>
      (!departmentName || b.departmentName === departmentName) &&
      (!programName || b.programName === programName)
  );

  const filteredModules = modules.filter(
    (m) =>
      (!departmentName || m.departmentName === departmentName || !m.departmentName)
  );

  const handleDepartmentChange = (newDept: string) => {
    setDepartmentName(newDept);
    setLecturerName('');
  };

  const selectedSlot = timeSlots.find((t) => t.id === timeSlotId);
  const selectedRoom = classrooms.find((c) => c.id === classroomId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedSlot || !selectedRoom) {
      setValidationError('Please select a valid time slot and classroom.');
      return;
    }

    if (!programName || !batchName || !moduleName || !lecturerName) {
      setValidationError('Please fill in all required academic fields (Program, Batch, Module, Lecturer).');
      return;
    }

    // Prepare candidate schedule for validation
    const candidate: Partial<Schedule> = {
      ...(existingSchedule?.id ? { id: existingSchedule.id } : {}),
      academicWeekId: academicWeek.id,
      date,
      day: day as any,
      timeSlotId,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      classroomId: selectedRoom.id,
      classroomName: selectedRoom.name,
      departmentName,
      programName: programName.trim(),
      batchName: batchName.trim(),
      moduleName: moduleName.trim(),
      lecturerName,
      notes: notes || '',
    };

    // Run conflict validation engine
    const conflict = DataService.validateScheduleConflict(
      candidate,
      allSchedules,
      classrooms,
      lecturers
    );

    if (conflict) {
      setValidationError(conflict.message);
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingSchedule) {
        const { id, ...updatePayload } = candidate;
        await DataService.updateSchedule(
          existingSchedule.id,
          updatePayload,
          currentUser?.username || 'admin',
          currentUser?.role || 'admin'
        );
      } else {
        const { id, ...createPayload } = candidate;
        await DataService.addSchedule(
          createPayload as Omit<Schedule, 'id'>,
          currentUser?.username || 'admin',
          currentUser?.role || 'admin'
        );
      }
      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSchedule) return;
    if (!confirm('Are you sure you want to delete this lecture schedule entry?')) return;

    setIsSubmitting(true);
    try {
      await DataService.deleteSchedule(
        existingSchedule.id,
        existingSchedule,
        currentUser?.username || 'admin',
        currentUser?.role || 'admin'
      );
      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-[#102A56] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {existingSchedule ? 'Edit Timetable Schedule' : 'Schedule New Lecture'}
              </h3>
              <p className="text-xs text-blue-200">
                {academicWeek.label} · {day}, {date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="font-medium leading-relaxed">{validationError}</div>
            </div>
          )}

          {/* Day, Facility & Time Slot Context Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Academic Day <span className="text-red-500">*</span>
              </label>
              <select
                value={day}
                onChange={(e) => handleDayChange(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#102A56]"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                  <option key={d} value={d}>
                    {d} {d === 'Sunday' || d === 'Saturday' ? '(Weekend Format)' : '(Weekday Format)'}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">Date: {date}</div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Lecture Hall / Facility
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#102A56]"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.capacity} cap) {c.operationalStatus !== 'Operational' ? `[${c.operationalStatus}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Time Slot {isWeekendDay ? '(Weekend Format)' : '(Weekday Format)'}
              </label>
              <select
                value={timeSlotId}
                onChange={(e) => setTimeSlotId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#102A56]"
              >
                {relevantSlots.map((ts) => (
                  <option key={ts.id} value={ts.id} disabled={ts.isBreak}>
                    {ts.displayTime} {ts.isBreak ? '(LUNCH BREAK)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={departmentName}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56]"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Selecting a department automatically filters the list of available academic staff.
            </p>
          </div>

          {/* Program & Batch Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Program <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="programs-datalist"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Enter academic program"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56] font-medium"
              />
              <datalist id="programs-datalist">
                {(filteredPrograms.length > 0 ? filteredPrograms : programs).map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Batch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="batches-datalist"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Enter student batch"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56] font-medium"
              />
              <datalist id="batches-datalist">
                {(filteredBatches.length > 0 ? filteredBatches : batches).map((b) => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Module & Lecturer Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Curriculum Module <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="modules-datalist"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="Enter curriculum module"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56] font-medium"
              />
              <datalist id="modules-datalist">
                {(filteredModules.length > 0 ? filteredModules : modules).map((m) => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Lecturer Name (with Staff Code) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddLecturerOpen(true)}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  title="Add a new academic staff member to this department"
                >
                  <UserPlus className="w-3 h-3 text-blue-600" />
                  <span>+ Add Lecturer</span>
                </button>
              </div>
              <select
                value={lecturerName}
                onChange={(e) => setLecturerName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56]"
              >
                <option value="">-- Select Lecturer --</option>
                {filteredLecturers.map((l) => (
                  <option key={l.id} value={`${l.name} (${l.staffCode})`}>
                    {l.name} ({l.staffCode}) · {l.designation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AddLecturerModal
            isOpen={isAddLecturerOpen}
            onClose={() => setIsAddLecturerOpen(false)}
            departments={departments}
            existingLecturers={lecturers}
            preselectedDepartment={departmentName}
            onLecturerAdded={(newLec) => {
              setDepartmentName(newLec.department);
              setLecturerName(`${newLec.name} (${newLec.staffCode})`);
            }}
          />

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {existingSchedule ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs transition border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Entry</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#102A56] hover:bg-[#1D4E89] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? 'Saving...' : existingSchedule ? 'Update Schedule' : 'Confirm Booking'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
