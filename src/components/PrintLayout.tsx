import React, { useState } from 'react';
import { AcademicWeek, Schedule, Classroom, TimeSlot, DayOfWeek } from '../types';
import { getColomboDateString, getColomboTimeString, getColomboDayOfWeek } from '../utils/colomboTime';
import { Printer, X, ArrowLeft } from 'lucide-react';

interface PrintLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  academicWeeks: AcademicWeek[];
  currentWeek: AcademicWeek;
  schedules: Schedule[];
  classrooms: Classroom[];
  timeSlots: TimeSlot[];
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({
  isOpen,
  onClose,
  academicWeeks,
  currentWeek,
  schedules,
  classrooms,
  timeSlots,
}) => {
  const [printMode, setPrintMode] = useState<'day' | 'week' | 'room'>('day');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getColomboDayOfWeek());
  const [selectedWeekId, setSelectedWeekId] = useState<string>(currentWeek.id);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(classrooms[0]?.id || '');

  if (!isOpen) return null;

  const targetWeek = academicWeeks.find((w) => w.id === selectedWeekId) || currentWeek;
  const isWeekend = selectedDay === 'Saturday' || selectedDay === 'Sunday';

  const relevantSlots = timeSlots
    .filter((ts) => ts.type === (isWeekend ? 'weekend' : 'weekday') && ts.active)
    .sort((a, b) => a.slotNumber - b.slotNumber);

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handlePrint = () => {
    window.print();
  };

  const selectedRoom = classrooms.find((c) => c.id === selectedRoomId);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Non-printing Control Bar */}
      <div className="sticky top-0 z-10 bg-[#102A56] text-white p-4 shadow-md flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to App</span>
          </button>
          <span className="text-sm font-bold">Print Preview / PDF Export</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Scope Selector */}
          <select
            value={printMode}
            onChange={(e) => setPrintMode(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
          >
            <option value="day" className="text-slate-900">Current Day Schedule</option>
            <option value="week" className="text-slate-900">Full Academic Week</option>
            <option value="room" className="text-slate-900">Individual Hall Schedule</option>
          </select>

          {printMode === 'day' && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
            >
              {days.map((d) => (
                <option key={d} value={d} className="text-slate-900">{d}</option>
              ))}
            </select>
          )}

          {printMode === 'room' && (
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.name} ({c.facilityId})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#D62828] hover:bg-red-700 text-white font-bold text-xs shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 Format) */}
      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-6 text-slate-900 print:p-0 print:m-0 print:max-w-none">
        {/* Institutional Header */}
        <div className="border-b-2 border-[#102A56] pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#102A56] rounded-xl flex items-center justify-center font-black text-white text-base">
              BCAS
            </div>
            <div>
              <h1 className="text-xl font-black text-[#102A56] tracking-tight uppercase">
                BCAS Colombo City Campus
              </h1>
              <p className="text-xs font-semibold text-[#D62828] tracking-wider uppercase">
                British College of Applied Studies · Academic Registry
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-slate-800">
              {printMode === 'day' && `Daily Timetable: ${selectedDay}`}
              {printMode === 'week' && `Weekly Timetable: ${targetWeek.label}`}
              {printMode === 'room' && `Lecture Hall Schedule: ${selectedRoom?.name}`}
            </div>
            <div className="text-slate-500 font-mono text-[11px] mt-0.5">
              Generated: {getColomboDateString()} {getColomboTimeString()} (Asia/Colombo)
            </div>
          </div>
        </div>

        {/* Content Mode 1: Daily Timetable Table */}
        {printMode === 'day' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span>Academic Day: <strong>{selectedDay}</strong></span>
              <span>Academic Week: <strong>{targetWeek.label}</strong></span>
              <span>Format: <strong>{isWeekend ? 'Weekend Block' : 'Weekday 9-Slot'}</strong></span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-[#102A56] text-white">
                    <th className="border border-slate-400 p-2 text-left font-bold min-w-[140px]">
                      Lecture Hall
                    </th>
                    {relevantSlots.map((slot) => (
                      <th key={slot.id} className="border border-slate-400 p-2 text-center font-semibold min-w-[100px]">
                        {slot.displayTime}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classrooms.map((cr) => (
                    <tr key={cr.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 font-bold bg-slate-50">
                        <div>{cr.name}</div>
                        <div className="text-[9px] text-slate-500 font-normal">{cr.category}</div>
                      </td>
                      {relevantSlots.map((slot) => {
                        if (slot.isBreak) {
                          return (
                            <td key={slot.id} className="border border-slate-300 p-1 text-center bg-slate-100 text-slate-400 italic">
                              BREAK
                            </td>
                          );
                        }

                        const match = schedules.find(
                          (s) =>
                            s.day === selectedDay &&
                            (s.classroomName === cr.name || s.classroomId === cr.id) &&
                            s.timeSlotId === slot.id
                        );

                        if (match) {
                          return (
                            <td key={slot.id} className="border border-slate-300 p-1.5 bg-blue-50 text-slate-900 leading-tight">
                              <div className="font-bold text-[#102A56]">{match.moduleName}</div>
                              <div className="text-[9px] text-slate-600">{match.batchName}</div>
                              <div className="text-[8px] text-slate-500">{match.lecturerName}</div>
                            </td>
                          );
                        }

                        return (
                          <td key={slot.id} className="border border-slate-300 p-1 text-center text-slate-400">
                            Available
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Mode 2: Room Specific Schedule */}
        {printMode === 'room' && selectedRoom && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedRoom.name}</h3>
                <p className="text-slate-500">
                  {selectedRoom.category} · {selectedRoom.capacity} Seats · {selectedRoom.wing} ({selectedRoom.floor})
                </p>
              </div>
              <span className="font-bold uppercase px-2.5 py-1 rounded bg-blue-100 text-[#102A56]">
                Weekly Master Timetable
              </span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-[#102A56] text-white">
                  <th className="border border-slate-400 p-2.5 text-left font-bold">Academic Day</th>
                  <th className="border border-slate-400 p-2.5 text-left font-bold">Time Period</th>
                  <th className="border border-slate-400 p-2.5 text-left font-bold">Module &amp; Program</th>
                  <th className="border border-slate-400 p-2.5 text-left font-bold">Intake Batch</th>
                  <th className="border border-slate-400 p-2.5 text-left font-bold">Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const roomDaySchedules = schedules.filter(
                    (s) =>
                      s.day === day &&
                      (s.classroomName === selectedRoom.name || s.classroomId === selectedRoom.id)
                  );

                  if (roomDaySchedules.length === 0) {
                    return (
                      <tr key={day}>
                        <td className="border border-slate-300 p-2 font-bold bg-slate-50">{day}</td>
                        <td colSpan={4} className="border border-slate-300 p-2 text-slate-400 italic">
                          No scheduled lectures. Hall available for self-study / bookings.
                        </td>
                      </tr>
                    );
                  }

                  return roomDaySchedules.map((sch, idx) => (
                    <tr key={`${day}-${idx}`}>
                      {idx === 0 && (
                        <td
                          rowSpan={roomDaySchedules.length}
                          className="border border-slate-300 p-2 font-bold bg-slate-50 align-top"
                        >
                          {day}
                        </td>
                      )}
                      <td className="border border-slate-300 p-2 font-mono text-[11px]">
                        {sch.startTime} – {sch.endTime}
                      </td>
                      <td className="border border-slate-300 p-2 font-semibold">
                        <div>{sch.moduleName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{sch.programName}</div>
                      </td>
                      <td className="border border-slate-300 p-2">{sch.batchName}</td>
                      <td className="border border-slate-300 p-2">{sch.lecturerName}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Content Mode 3: Full Weekly Summary Grid */}
        {printMode === 'week' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Complete weekly schedule allocation for {targetWeek.label}.
            </p>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-[#102A56] text-white">
                  <th className="border border-slate-400 p-2 text-left">Academic Day</th>
                  <th className="border border-slate-400 p-2 text-left">Hall</th>
                  <th className="border border-slate-400 p-2 text-left">Time</th>
                  <th className="border border-slate-400 p-2 text-left">Module</th>
                  <th className="border border-slate-400 p-2 text-left">Department</th>
                  <th className="border border-slate-400 p-2 text-left">Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-bold">{sch.day}</td>
                    <td className="border border-slate-300 p-2 font-mono font-semibold">{sch.classroomName}</td>
                    <td className="border border-slate-300 p-2 font-mono text-[11px]">{sch.startTime} – {sch.endTime}</td>
                    <td className="border border-slate-300 p-2 font-semibold">{sch.moduleName}</td>
                    <td className="border border-slate-300 p-2">{sch.departmentName}</td>
                    <td className="border border-slate-300 p-2">{sch.lecturerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Footer Note */}
        <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div className="font-semibold text-slate-700">BCAS Colombo City Campus · Academic Timetable System</div>
          </div>
          <div className="text-right">
            <div className="border-t border-slate-400 w-44 mb-1"></div>
            <div>Academic Registrar Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};
