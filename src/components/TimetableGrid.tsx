import React, { useState } from 'react';
import {
  Classroom,
  TimeSlot,
  Schedule,
  AcademicWeek,
  Department,
  Lecturer,
  DayOfWeek,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Info,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface TimetableGridProps {
  currentWeek: AcademicWeek;
  academicWeeks: AcademicWeek[];
  onSelectWeek: (week: AcademicWeek) => void;
  schedules: Schedule[];
  classrooms: Classroom[];
  timeSlots: TimeSlot[];
  departments: Department[];
  lecturers: Lecturer[];
  onCellClick: (room: Classroom, slot: TimeSlot, day: DayOfWeek, dateStr: string) => void;
  onScheduleClick: (schedule: Schedule) => void;
  sundayEnabled?: boolean;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  currentWeek,
  academicWeeks,
  onSelectWeek,
  schedules,
  classrooms,
  timeSlots,
  departments,
  lecturers,
  onCellClick,
  onScheduleClick,
  sundayEnabled = true,
}) => {
  const { isAdmin } = useAuth();

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWing, setSelectedWing] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

  // Compute date string for the selected day in currentWeek
  const dayOffsetMap: Record<DayOfWeek, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const getDayDateString = (day: DayOfWeek): string => {
    const startDate = new Date(currentWeek.startDate);
    const offset = dayOffsetMap[day] ?? 0;
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const currentDateStr = getDayDateString(selectedDay);
  const isWeekend = selectedDay === 'Saturday' || selectedDay === 'Sunday';

  // Filter time slots for day type
  const relevantTimeSlots = timeSlots
    .filter((ts) => ts.type === (isWeekend ? 'weekend' : 'weekday') && ts.active)
    .sort((a, b) => a.slotNumber - b.slotNumber);

  // Filter classrooms by search, category, and wing
  const filteredClassrooms = classrooms.filter((cr) => {
    const matchesSearch =
      cr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.facilityId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || cr.category === selectedCategory;
    const matchesWing = selectedWing === 'all' || cr.wing === selectedWing;
    return matchesSearch && matchesCategory && matchesWing;
  });

  // Week navigation
  const currentIndex = academicWeeks.findIndex((w) => w.id === currentWeek.id);
  const prevWeek = currentIndex > 0 ? academicWeeks[currentIndex - 1] : null;
  const nextWeek = currentIndex < academicWeeks.length - 1 ? academicWeeks[currentIndex + 1] : null;

  // Department color helper
  const getDeptColor = (deptName: string) => {
    const d = departments.find((dept) => dept.name === deptName);
    return d?.color || '#2563EB';
  };

  return (
    <div className="space-y-4">
      {/* Week Selector & Day Tabs Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Week Navigator */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
            <button
              onClick={() => prevWeek && onSelectWeek(prevWeek)}
              disabled={!prevWeek}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Academic Week"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>

            <div className="text-center px-3">
              <div className="flex items-center justify-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm md:text-base">
                  {currentWeek.label}
                </span>
                {currentWeek.isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Current Week
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {currentWeek.startDate} to {currentWeek.endDate} · {currentWeek.academicYear}
              </div>
            </div>

            <button
              onClick={() => nextWeek && onSelectWeek(nextWeek)}
              disabled={!nextWeek}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Academic Week"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* Day of Week Selector */}
          <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
            {days.map((day) => {
              const isSelected = selectedDay === day;
              const dateForDay = getDayDateString(day);
              const daySchedules = schedules.filter(
                (s) => s.academicWeekId === currentWeek.id && s.day === day
              );

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-[#102A56] text-white border-[#102A56] shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-bold">{day}</span>
                  <span
                    className={`text-[10px] font-mono mt-0.5 ${
                      isSelected ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {dateForDay.slice(5)} · {daySchedules.length} classes
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search lecture hall..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#102A56] focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="all">All Facilities ({classrooms.length})</option>
              <option value="Lecture Hall">Lecture Halls</option>
              <option value="Computer Lab">Computer Labs</option>
              <option value="Science Lab">Science Labs</option>
              <option value="Specialized Facility">Specialized Facilities</option>
              <option value="Auditorium">Auditoriums</option>
            </select>

            {/* Wing Filter */}
            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="all">All Wings</option>
              <option value="West Wing">West Wing</option>
              <option value="East Wing">East Wing</option>
              <option value="Tech Wing">Tech Wing</option>
              <option value="Main Building">Main Building</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing {filteredClassrooms.length} of {classrooms.length} rooms
            </span>

            {/* Mobile View Toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden md:hidden">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-2.5 py-1 text-xs font-semibold ${
                  viewMode === 'matrix' ? 'bg-[#102A56] text-white' : 'bg-white text-slate-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-xs font-semibold ${
                  viewMode === 'cards' ? 'bg-[#102A56] text-white' : 'bg-white text-slate-600'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Table (Responsive Grid) */}
      <div className={`bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden ${viewMode === 'cards' ? 'hidden md:block' : 'block'}`}>
        <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full border-collapse text-left text-xs min-w-[900px]">
            {/* Header: Classrooms | Time Slots */}
            <thead className="sticky top-0 z-20 bg-[#102A56] text-white shadow-xs">
              <tr>
                <th className="sticky left-0 z-30 bg-[#102A56] p-3 font-bold border-r border-[#1D4E89] min-w-[190px] shadow-sm">
                  <div className="flex items-center gap-2">
                    <span>Lecture Hall / Facility</span>
                    <span className="text-[10px] font-normal text-blue-200">
                      ({filteredClassrooms.length})
                    </span>
                  </div>
                </th>
                {relevantTimeSlots.map((slot) => (
                  <th
                    key={slot.id}
                    className={`p-3 font-semibold text-center border-r border-[#1D4E89] whitespace-nowrap min-w-[170px] ${
                      slot.isBreak ? 'bg-[#0D2144] text-amber-300 italic' : ''
                    }`}
                  >
                    <div className="font-bold text-xs">{slot.displayTime}</div>
                    <div className="text-[10px] font-mono text-blue-200 mt-0.5">
                      {slot.isBreak ? 'Lunch Break' : `Slot #${slot.slotNumber}`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Matrix Body: Rows = Classrooms, Cells = Time Slots */}
            <tbody className="divide-y divide-slate-200">
              {filteredClassrooms.map((cr) => {
                const isUnderMaintenance = cr.operationalStatus !== 'Operational';

                return (
                  <tr key={cr.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Leftmost Column: Classroom Name & Badges */}
                    <td className="sticky left-0 z-10 bg-white hover:bg-slate-50 p-3 font-medium border-r border-slate-200 shadow-xs">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm tracking-tight">
                            {cr.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {cr.category} · {cr.capacity} seats
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {cr.wing} · {cr.floor}
                          </div>
                        </div>

                        {cr.operationalStatus !== 'Operational' && (
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              cr.operationalStatus === 'Maintenance'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cr.operationalStatus}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Time Slot Columns */}
                    {relevantTimeSlots.map((slot) => {
                      if (slot.isBreak) {
                        return (
                          <td
                            key={slot.id}
                            className="bg-slate-100/80 p-2 text-center text-[11px] font-medium text-slate-500 border-r border-slate-200 italic select-none"
                          >
                            LUNCH BREAK
                          </td>
                        );
                      }

                      if (isUnderMaintenance) {
                        return (
                          <td
                            key={slot.id}
                            className="bg-slate-50 p-2 text-center text-[10px] font-semibold text-slate-400 border-r border-slate-200"
                          >
                            Unavailable ({cr.operationalStatus})
                          </td>
                        );
                      }

                      // Find schedule matching this classroom and time slot
                      const schedule = schedules.find(
                        (s) =>
                          s.academicWeekId === currentWeek.id &&
                          s.day === selectedDay &&
                          (s.classroomName === cr.name || s.classroomId === cr.id) &&
                          s.timeSlotId === slot.id
                      );

                      if (schedule) {
                        const deptColor = getDeptColor(schedule.departmentName);

                        return (
                          <td
                            key={slot.id}
                            onClick={() => onScheduleClick(schedule)}
                            className="p-1.5 border-r border-slate-200 cursor-pointer align-top"
                          >
                            <div
                              className="h-full min-h-[92px] p-2.5 rounded-xl border transition-all duration-150 hover:shadow-md hover:scale-[1.01] flex flex-col justify-between"
                              style={{
                                backgroundColor: `${deptColor}10`,
                                borderColor: `${deptColor}40`,
                              }}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded text-white truncate max-w-[120px]"
                                    style={{ backgroundColor: deptColor }}
                                  >
                                    {schedule.departmentName.split(' ')[0]}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {schedule.startTime}
                                  </span>
                                </div>

                                <div className="font-bold text-slate-900 text-xs leading-tight line-clamp-2">
                                  {schedule.moduleName}
                                </div>
                                <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
                                  {schedule.batchName}
                                </div>
                              </div>

                              <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-700">
                                <span className="font-medium truncate max-w-[130px]">
                                  {schedule.lecturerName}
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Empty / Available cell
                      return (
                        <td
                          key={slot.id}
                          onClick={() => {
                            if (isAdmin) {
                              onCellClick(cr, slot, selectedDay, currentDateStr);
                            }
                          }}
                          className={`p-2 border-r border-slate-200 text-center transition-colors align-middle ${
                            isAdmin
                              ? 'cursor-pointer hover:bg-emerald-50/60 group'
                              : 'bg-emerald-50/20'
                          }`}
                        >
                          <div className="py-4 px-2 rounded-lg border border-dashed border-emerald-200 group-hover:border-emerald-400 group-hover:bg-white transition flex flex-col items-center justify-center">
                            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Available</span>
                            </span>
                            {isAdmin && (
                              <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition">
                                <Plus className="w-3 h-3" />
                                <span>Book</span>
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View (Optimized for handheld smartphones) */}
      <div className={`space-y-4 md:hidden ${viewMode === 'cards' ? 'block' : 'hidden'}`}>
        <div className="text-xs font-semibold text-slate-500 px-1">
          Showing lecture halls on {selectedDay}, {currentDateStr}:
        </div>

        {filteredClassrooms.map((cr) => {
          const roomSchedules = schedules.filter(
            (s) =>
              s.academicWeekId === currentWeek.id &&
              s.day === selectedDay &&
              (s.classroomName === cr.name || s.classroomId === cr.id)
          );

          return (
            <div
              key={cr.id}
              className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{cr.name}</h4>
                  <p className="text-xs text-slate-500">
                    {cr.category} · {cr.capacity} seats · {cr.wing}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cr.operationalStatus === 'Operational'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {cr.operationalStatus}
                </span>
              </div>

              {/* Schedules in this room */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {relevantTimeSlots.map((slot) => {
                  if (slot.isBreak) return null;

                  const match = roomSchedules.find((s) => s.timeSlotId === slot.id);

                  if (match) {
                    return (
                      <div
                        key={slot.id}
                        onClick={() => onScheduleClick(match)}
                        className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 mb-1">
                          <span>{slot.displayTime}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                            {match.departmentName}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{match.moduleName}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{match.programName} · {match.batchName}</div>
                        <div className="text-xs text-slate-700 font-medium mt-1">Lecturer: {match.lecturerName}</div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isAdmin && cr.operationalStatus === 'Operational') {
                          onCellClick(cr, slot, selectedDay, currentDateStr);
                        }
                      }}
                      className={`p-2 rounded-lg border border-dashed border-emerald-200 flex items-center justify-between text-xs ${
                        isAdmin && cr.operationalStatus === 'Operational'
                          ? 'cursor-pointer hover:bg-emerald-50'
                          : 'bg-emerald-50/30'
                      }`}
                    >
                      <span className="font-mono text-slate-600">{slot.displayTime}</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Available</span>
                        {isAdmin && cr.operationalStatus === 'Operational' && (
                          <Plus className="w-3 h-3 ml-1 text-slate-400" />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
