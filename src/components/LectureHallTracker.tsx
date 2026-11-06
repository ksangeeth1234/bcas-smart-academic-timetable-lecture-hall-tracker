import React, { useState, useEffect } from 'react';
import { Classroom, Schedule, TimeSlot } from '../types';
import {
  getColomboDateString,
  getColomboTimeString,
  getColomboDayOfWeek,
  getColomboHourMinute,
  getRemainingMinutes,
} from '../utils/colomboTime';
import {
  Compass,
  Clock,
  MapPin,
  User,
  BookOpen,
  Layers,
  CheckCircle,
  AlertOctagon,
  Search,
  Filter,
  Flame,
  DoorOpen,
  ArrowRight,
} from 'lucide-react';

interface LectureHallTrackerProps {
  classrooms: Classroom[];
  schedules: Schedule[];
  timeSlots: TimeSlot[];
  onScheduleClick: (schedule: Schedule) => void;
}

export const LectureHallTracker: React.FC<LectureHallTrackerProps> = ({
  classrooms,
  schedules,
  timeSlots,
  onScheduleClick,
}) => {
  // Live tick to keep countdown fresh every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'available' | 'maintenance'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const todayStr = getColomboDateString();
  const currentHM = getColomboHourMinute(); // "HH:mm"
  const currentDay = getColomboDayOfWeek();
  const currentTimeDisplay = getColomboTimeString();

  // Find all schedules occurring TODAY
  const todaySchedules = schedules.filter(
    (s) => s.date === todayStr || s.day === currentDay
  );

  // Classify each classroom right now
  interface RoomState {
    classroom: Classroom;
    isOccupied: boolean;
    activeSchedule?: Schedule;
    remainingMinutes?: number;
    upcomingSchedule?: Schedule;
    isMaintenance: boolean;
  }

  const roomStates: RoomState[] = classrooms.map((cr) => {
    const isMaintenance = cr.operationalStatus !== 'Operational';

    // Find active schedule in this room where currentHM is between startTime and endTime
    const activeSchedule = todaySchedules.find(
      (s) =>
        (s.classroomName === cr.name || s.classroomId === cr.id) &&
        currentHM >= s.startTime &&
        currentHM < s.endTime
    );

    const isOccupied = !isMaintenance && !!activeSchedule;

    // Remaining minutes
    const remainingMinutes = activeSchedule
      ? getRemainingMinutes(activeSchedule.endTime)
      : undefined;

    // Next upcoming schedule today
    const upcomingSchedule = todaySchedules
      .filter(
        (s) =>
          (s.classroomName === cr.name || s.classroomId === cr.id) &&
          s.startTime > currentHM
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

    return {
      classroom: cr,
      isOccupied,
      activeSchedule,
      remainingMinutes,
      upcomingSchedule,
      isMaintenance,
    };
  });

  // Filter lists
  const filtered = roomStates.filter((item) => {
    const matchesSearch =
      item.classroom.name.toLowerCase().includes(search.toLowerCase()) ||
      item.classroom.facilityId.toLowerCase().includes(search.toLowerCase()) ||
      item.activeSchedule?.moduleName.toLowerCase().includes(search.toLowerCase()) ||
      item.activeSchedule?.lecturerName.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || item.classroom.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'occupied') matchesStatus = item.isOccupied;
    if (statusFilter === 'available') matchesStatus = !item.isOccupied && !item.isMaintenance;
    if (statusFilter === 'maintenance') matchesStatus = item.isMaintenance;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const occupiedRooms = filtered.filter((r) => r.isOccupied);
  const availableRooms = filtered.filter((r) => !r.isOccupied && !r.isMaintenance);
  const maintenanceRooms = filtered.filter((r) => r.isMaintenance);

  const totalOccupiedCount = roomStates.filter((r) => r.isOccupied).length;
  const totalAvailableCount = roomStates.filter((r) => !r.isOccupied && !r.isMaintenance).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Live Status Overview */}
      <div className="bg-gradient-to-r from-[#102A56] via-[#1D4E89] to-[#102A56] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-amber-300 text-xs font-semibold border border-white/15">
              <Compass className="w-3.5 h-3.5 animate-spin" />
              <span>Real-Time Campus Availability Engine</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Live Lecture Hall Occupancy Tracker
            </h2>
            <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
              Synchronized to Asia/Colombo time ({currentTimeDisplay}). Visual indicators automatically refresh as lecture periods transition throughout the campus.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3">
            <div className="px-5 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px]">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-bold mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Available</span>
              </div>
              <div className="text-3xl font-black text-white">{totalAvailableCount}</div>
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Halls Free</div>
            </div>

            <div className="px-5 py-3.5 rounded-2xl bg-[#D62828]/30 backdrop-blur-md border border-red-400/40 text-center min-w-[110px]">
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-300 font-bold mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D62828] animate-ping" />
                <span>Occupied</span>
              </div>
              <div className="text-3xl font-black text-white">{totalOccupiedCount}</div>
              <div className="text-[10px] text-red-200 uppercase font-semibold">Lectures In Session</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl font-bold transition ${
              statusFilter === 'all'
                ? 'bg-[#102A56] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Facilities ({classrooms.length})
          </button>

          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
              statusFilter === 'occupied'
                ? 'bg-[#D62828] text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Currently Occupied ({totalOccupiedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Currently Available ({totalAvailableCount})</span>
          </button>
        </div>

        {/* Search & Category */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter hall, module, or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#102A56] focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="Lecture Hall">Lecture Halls</option>
            <option value="Computer Lab">Computer Labs</option>
            <option value="Science Lab">Science Labs</option>
            <option value="Specialized Facility">Specialized</option>
            <option value="Auditorium">Auditoriums</option>
          </select>
        </div>
      </div>

      {/* Category 1: Currently Occupied Section */}
      {(statusFilter === 'all' || statusFilter === 'occupied') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D62828] animate-pulse" />
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Currently Occupied Lecture Halls ({occupiedRooms.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Lectures in progress right now</span>
          </div>

          {occupiedRooms.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <DoorOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Lectures Currently in Session</h4>
              <p className="text-xs text-slate-500">
                All operational lecture halls are presently vacant or campus is between scheduled time slots.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {occupiedRooms.map(({ classroom, activeSchedule, remainingMinutes }) => {
                if (!activeSchedule) return null;

                return (
                  <div
                    key={classroom.id}
                    onClick={() => onScheduleClick(activeSchedule)}
                    className="bg-white rounded-2xl shadow-xs border-2 border-red-200 p-5 hover:shadow-md hover:border-red-400 transition cursor-pointer relative overflow-hidden group"
                  >
                    {/* Top colored stripe */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D62828]" />

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-lg group-hover:text-blue-900 transition">
                            {classroom.name}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                            Occupied
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {classroom.facilityId} · {classroom.category}
                        </div>
                      </div>

                      {/* Remaining Time Pill */}
                      {remainingMinutes !== undefined && (
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-bold text-xs border border-red-200">
                            <Clock className="w-3.5 h-3.5 text-red-600 animate-spin" />
                            <span>{remainingMinutes}m left</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Ends {activeSchedule.endTime}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lecture Info Card */}
                    <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#102A56] text-white">
                          {activeSchedule.departmentName}
                        </span>
                        <div className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                          {activeSchedule.moduleName}
                        </div>
                        <div className="text-slate-600 font-medium text-[11px]">
                          {activeSchedule.programName}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 space-y-1 text-slate-700">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold truncate">{activeSchedule.lecturerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate">{activeSchedule.batchName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {activeSchedule.startTime} – {activeSchedule.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Category 2: Currently Available Section */}
      {(statusFilter === 'all' || statusFilter === 'available') && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Currently Available Lecture Halls ({availableRooms.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Free for study or immediate allocation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableRooms.map(({ classroom, upcomingSchedule }) => (
              <div
                key={classroom.id}
                className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 hover:shadow-md hover:border-emerald-300 transition relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

                <div className="flex items-start justify-between gap-1 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{classroom.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {classroom.facilityId}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    <span>Free</span>
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <div>
                    <span className="text-slate-400">Category: </span>
                    <span className="font-medium text-slate-800">{classroom.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Capacity: </span>
                    <span className="font-medium text-slate-800">{classroom.capacity} seats</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Wing / Floor: </span>
                    <span className="font-medium text-slate-800">{classroom.wing} ({classroom.floor})</span>
                  </div>
                </div>

                {/* Upcoming session hint */}
                <div className="pt-2 border-t border-slate-100 text-[11px]">
                  {upcomingSchedule ? (
                    <div className="text-amber-700 bg-amber-50 p-2 rounded-lg leading-tight">
                      <div className="font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Next: {upcomingSchedule.startTime}</span>
                      </div>
                      <div className="text-[10px] truncate mt-0.5">
                        {upcomingSchedule.moduleName}
                      </div>
                    </div>
                  ) : (
                    <div className="text-emerald-700 text-[10px] font-medium py-1">
                      No further lectures scheduled today
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category 3: Maintenance / Inactive Section */}
      {(statusFilter === 'all' || statusFilter === 'maintenance') && maintenanceRooms.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-400" />
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              Maintenance / Inactive Facilities ({maintenanceRooms.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {maintenanceRooms.map(({ classroom }) => (
              <div
                key={classroom.id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs opacity-75"
              >
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{classroom.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                    {classroom.operationalStatus}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {classroom.facilityId} · {classroom.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
