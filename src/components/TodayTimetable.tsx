import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Classroom, Schedule, TimeSlot, Department } from '../types';
import {
  getColomboDateString,
  getColomboDayOfWeek,
  getColomboTimeString,
  getColomboHourMinute,
  getRemainingMinutes,
  getMinutesUntilStart,
} from '../utils/colomboTime';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Search,
  CheckCircle,
  Flame,
  Radio,
  Maximize2,
  Minimize2,
  Tv,
  ArrowRight,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Layers,
  X,
  Lock,
} from 'lucide-react';

interface TodayTimetableProps {
  classrooms: Classroom[];
  schedules: Schedule[];
  timeSlots: TimeSlot[];
  departments: Department[];
  onScheduleClick: (schedule: Schedule) => void;
  onNavigateToTracker?: () => void;
  onOpenLogin?: () => void;
}

export type LectureStatus = 'ongoing' | 'starting_soon' | 'upcoming' | 'concluded';

function normalizeTime(t: string | undefined): string {
  if (!t) return '00:00';
  const clean = t.trim();
  const parts = clean.split(':');
  if (parts.length === 2) {
    const h = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    return `${h}:${m}`;
  }
  return clean;
}

export function getLectureStatus(sch: Schedule, currentHM: string): LectureStatus {
  const normCurrent = normalizeTime(currentHM);
  const normStart = normalizeTime(sch.startTime);
  const normEnd = normalizeTime(sch.endTime);

  // Once current time reaches or passes end time, it is CONCLUDED
  if (normCurrent >= normEnd) {
    return 'concluded';
  }

  // If within the lecture slot window, it is ONGOING (In Session)
  if (normCurrent >= normStart && normCurrent < normEnd) {
    return 'ongoing';
  }

  // If before start time, check if starting soon (<= 25 minutes)
  const minutesUntilStart = getMinutesUntilStart(sch.startTime);
  if (minutesUntilStart > 0 && minutesUntilStart <= 25) {
    return 'starting_soon';
  }

  return 'upcoming';
}

export const TodayTimetable: React.FC<TodayTimetableProps> = ({
  classrooms,
  schedules,
  timeSlots,
  departments,
  onScheduleClick,
  onNavigateToTracker,
  onOpenLogin,
}) => {
  const { canAccessLobbyTv } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'starting_soon' | 'upcoming' | 'concluded'>('all');
  const [currentTimeStr, setCurrentTimeStr] = useState(getColomboTimeString());
  const [currentHM, setCurrentHM] = useState(getColomboHourMinute());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLobbyTvMode, setIsLobbyTvMode] = useState(false);

  // Auto-Rotating / Slide Transition state ("ekin eka maru wenna")
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(5); // 5 seconds per lecture
  const [progress, setProgress] = useState(0); // 0 to 100%

  const todayStr = getColomboDateString();
  const currentDay = getColomboDayOfWeek();

  // If user signs out or loses access, immediately drop TV mode
  useEffect(() => {
    if (!canAccessLobbyTv && isLobbyTvMode) {
      setIsLobbyTvMode(false);
    }
  }, [canAccessLobbyTv, isLobbyTvMode]);

  // Live ticking clock (updates state every second to ensure exact minute transition to concluded)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(getColomboTimeString());
      setCurrentHM(getColomboHourMinute());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsLobbyTvMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const enterLobbyTvMode = () => {
    if (!canAccessLobbyTv) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    setIsLobbyTvMode(true);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Ignored if browser blocks requestFullscreen
    }
  };

  const exitLobbyTvMode = () => {
    setIsLobbyTvMode(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignored
    }
  };

  // Keyboard shortcut: 'F' toggles TV mode, Space toggles play/pause, Arrows slide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        if (isLobbyTvMode || isFullscreen) {
          exitLobbyTvMode();
        } else if (canAccessLobbyTv) {
          enterLobbyTvMode();
        } else if (onOpenLogin) {
          onOpenLogin();
        }
      }
      if (e.key === 'Escape') {
        exitLobbyTvMode();
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoRotating((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLobbyTvMode, isFullscreen, canAccessLobbyTv, onOpenLogin]);

  // Schedules for today
  const todaySchedules = schedules
    .filter((s) => s.date === todayStr || s.day === currentDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Compute status counts dynamically against currentHM
  const ongoingList = todaySchedules.filter((s) => getLectureStatus(s, currentHM) === 'ongoing');
  const startingSoonList = todaySchedules.filter((s) => getLectureStatus(s, currentHM) === 'starting_soon');
  const upcomingList = todaySchedules.filter(
    (s) => getLectureStatus(s, currentHM) === 'upcoming' || getLectureStatus(s, currentHM) === 'starting_soon'
  );
  const concludedList = todaySchedules.filter((s) => getLectureStatus(s, currentHM) === 'concluded');

  // Occupied classrooms count (only rooms with active ongoing lectures)
  const occupiedHallsCount = new Set(ongoingList.map((s) => s.classroomName)).size;
  const operationalClassrooms = classrooms.filter((c) => c.operationalStatus === 'Operational');
  const availableHallsCount = Math.max(0, operationalClassrooms.length - occupiedHallsCount);

  // Filtered schedules for display
  const filteredSchedules = todaySchedules.filter((s) => {
    const status = getLectureStatus(s, currentHM);

    if (filterStatus === 'ongoing' && status !== 'ongoing') return false;
    if (filterStatus === 'starting_soon' && status !== 'starting_soon') return false;
    if (filterStatus === 'upcoming' && status !== 'upcoming' && status !== 'starting_soon') return false;
    if (filterStatus === 'concluded' && status !== 'concluded') return false;

    if (selectedDept !== 'all' && s.departmentName !== selectedDept) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        s.classroomName.toLowerCase().includes(q) ||
        s.moduleName.toLowerCase().includes(q) ||
        s.programName.toLowerCase().includes(q) ||
        s.lecturerName.toLowerCase().includes(q) ||
        s.batchName.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Ensure activeIndex is always within valid bounds
  const validActiveIndex = filteredSchedules.length > 0 ? activeIndex % filteredSchedules.length : 0;
  const activeSchedule = filteredSchedules[validActiveIndex] || null;

  // Auto-rotation timer effect ("ekin eka maru wenna")
  useEffect(() => {
    if (!isAutoRotating || filteredSchedules.length <= 1) {
      setProgress(0);
      return;
    }

    const intervalStepMs = 100;
    const totalSteps = (rotateSpeed * 1000) / intervalStepMs;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / totalSteps);
        if (next >= 100) {
          setActiveIndex((curr) => (curr + 1) % filteredSchedules.length);
          return 0;
        }
        return next;
      });
    }, intervalStepMs);

    return () => clearInterval(timer);
  }, [isAutoRotating, rotateSpeed, filteredSchedules.length]);

  // Reset index and progress whenever filter criteria change
  useEffect(() => {
    setActiveIndex(0);
    setProgress(0);
  }, [filterStatus, selectedDept, search]);

  const handlePrev = () => {
    if (filteredSchedules.length === 0) return;
    setActiveIndex((curr) => (curr - 1 + filteredSchedules.length) % filteredSchedules.length);
    setProgress(0);
  };

  const handleNext = () => {
    if (filteredSchedules.length === 0) return;
    setActiveIndex((curr) => (curr + 1) % filteredSchedules.length);
    setProgress(0);
  };

  const getDeptColor = (deptName: string) => {
    const d = departments.find((dept) => dept.name === deptName);
    return d?.color || '#102A56';
  };

  const isTvDisplayActive = isLobbyTvMode || isFullscreen;

  // Renders the interactive Slider Card with full controls
  const renderSliderCard = (isTvSize: boolean) => {
    if (filteredSchedules.length === 0 || !activeSchedule) {
      return (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-400 space-y-2">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">No Scheduled Sessions to Display</h4>
          <p className="text-xs text-slate-500">There are no academic classes scheduled matching your criteria.</p>
        </div>
      );
    }

    const status = getLectureStatus(activeSchedule, currentHM);
    const isOngoing = status === 'ongoing';
    const isStartingSoon = status === 'starting_soon';
    const isConcluded = status === 'concluded';
    const remMinutes = getRemainingMinutes(activeSchedule.endTime);
    const toStartMinutes = getMinutesUntilStart(activeSchedule.startTime);
    const deptColor = getDeptColor(activeSchedule.departmentName);
    const room = classrooms.find(
      (c) => c.name === activeSchedule.classroomName || c.id === activeSchedule.classroomId
    );

    return (
      <div className={`bg-white rounded-3xl border-2 border-blue-500/30 shadow-xl relative overflow-hidden transition-all duration-300 ${
        isTvSize ? 'p-6 sm:p-12' : 'p-4 sm:p-7'
      }`}>
        {/* Top Animated Progress Countdown Bar */}
        <div className="h-2 w-full bg-slate-100 absolute top-0 left-0">
          <div
            className={`h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 transition-all duration-100 ease-linear ${
              !isAutoRotating ? 'opacity-30' : ''
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-5 sm:space-y-6 pt-2">
          {/* Top Rotation Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full border ${
                isTvSize ? 'text-xs px-3.5 py-1 bg-blue-50 text-blue-900 border-blue-200' : 'text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-0.5 bg-blue-50 text-blue-900 border-blue-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isAutoRotating ? 'bg-blue-600 animate-ping' : 'bg-slate-400'}`} />
                <span>{isTvSize ? 'Ground Floor Display Stream' : 'Live Rotation Display'}</span>
              </span>
              <span className={`font-mono font-bold text-slate-500 ${isTvSize ? 'text-sm' : 'text-xs'}`}>
                {validActiveIndex + 1} of {filteredSchedules.length}
              </span>
            </div>

            {/* Slider Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Speed selector */}
              <div className="flex items-center gap-1 bg-slate-100 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold text-slate-600">
                <span className="text-[10px] text-slate-400 uppercase font-mono mr-0.5">Speed:</span>
                {[3, 5, 8].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRotateSpeed(s)}
                    className={`px-1.5 sm:px-2 py-0.5 rounded-md transition cursor-pointer text-[11px] sm:text-xs ${
                      rotateSpeed === s ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'hover:text-slate-900'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Auto-Play Toggle */}
                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isAutoRotating
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={isAutoRotating ? 'Pause Rotation (Space)' : 'Start Auto-Rotation (Space)'}
                >
                  {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                  <span className="text-[11px] sm:text-xs">{isAutoRotating ? 'Playing' : 'Paused'}</span>
                </button>

                {/* Prev / Next Arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                    title="Previous Class (Left Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                    title="Next Class (Right Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Featured Active Card Content */}
          <div
            onClick={() => onScheduleClick(activeSchedule)}
            className="cursor-pointer group animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Time & Hall Location */}
              <div className="lg:col-span-4 space-y-4">
                {/* Time Slot Display */}
                <div className={`inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-amber-300 font-mono font-bold shadow-sm ${
                  isTvSize ? 'px-5 py-2.5 text-base sm:text-lg' : 'px-3.5 py-1.5 text-sm sm:text-base'
                }`}>
                  <Clock className={isTvSize ? 'w-5 h-5 text-amber-400' : 'w-4 h-4 text-amber-400'} />
                  <span>{activeSchedule.startTime} – {activeSchedule.endTime}</span>
                  <span className="text-slate-400 text-xs font-sans">({activeSchedule.day})</span>
                </div>

                {/* Hall Code Badge */}
                <div>
                  <span className={`font-mono font-black text-slate-900 bg-slate-100 border border-slate-300 rounded-2xl shadow-xs inline-block ${
                    isTvSize ? 'text-3xl sm:text-4xl px-5 py-2' : 'text-xl sm:text-2xl px-3.5 py-1'
                  }`}>
                    {activeSchedule.classroomName}
                  </span>
                </div>

                {room && (
                  <div className={`flex items-center gap-2 text-slate-600 font-semibold ${isTvSize ? 'text-sm sm:text-base' : 'text-xs'}`}>
                    <MapPin className="w-4 h-4 text-[#D62828] shrink-0" />
                    <span>{room.wing || 'Main Building'} · {room.floor || 'Ground Floor'} ({room.capacity} Seats)</span>
                  </div>
                )}
              </div>

              {/* Middle Column: Curriculum Module, Program & Batch */}
              <div className="lg:col-span-5 space-y-3">
                <div className="inline-block">
                  <span
                    className={`font-extrabold uppercase rounded-full text-white ${
                      isTvSize ? 'text-xs px-3.5 py-1' : 'text-[10px] px-2.5 py-0.5'
                    }`}
                    style={{ backgroundColor: deptColor }}
                  >
                    {activeSchedule.departmentName}
                  </span>
                </div>

                <h3 className={`font-black text-slate-900 group-hover:text-blue-700 transition leading-tight tracking-tight ${
                  isTvSize ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'
                }`}>
                  {activeSchedule.moduleName}
                </h3>

                <div className={`text-slate-600 font-semibold ${isTvSize ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}>
                  <span>{activeSchedule.programName}</span>
                  <span className="font-bold text-blue-700 ml-2 font-mono">
                    [{activeSchedule.batchName}]
                  </span>
                </div>

                <div className={`flex items-center gap-2 pt-1 font-semibold text-slate-800 ${isTvSize ? 'text-sm sm:text-base' : 'text-xs'}`}>
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Lecturer: <strong className="text-slate-900 font-bold">{activeSchedule.lecturerName}</strong></span>
                </div>
              </div>

              {/* Right Column: Status Badge */}
              <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-center gap-2.5">
                {isOngoing ? (
                  <div className="space-y-1 text-left lg:text-right">
                    <div className={`inline-flex items-center gap-2 rounded-2xl bg-emerald-100 border-2 border-emerald-500 text-emerald-900 font-black uppercase tracking-wider animate-pulse shadow-sm ${
                      isTvSize ? 'px-5 py-2.5 text-base sm:text-lg' : 'px-4 py-2 text-sm'
                    }`}>
                      <span className="w-3 h-3 rounded-full bg-emerald-600" />
                      <span>IN SESSION NOW</span>
                    </div>
                    <div className={`font-mono font-bold text-emerald-700 ${isTvSize ? 'text-sm' : 'text-xs'}`}>
                      {remMinutes} minutes remaining
                    </div>
                  </div>
                ) : isStartingSoon ? (
                  <div className="space-y-1 text-left lg:text-right">
                    <div className={`inline-flex items-center gap-2 rounded-2xl bg-cyan-100 border-2 border-cyan-500 text-cyan-900 font-bold uppercase tracking-wider shadow-sm ${
                      isTvSize ? 'px-5 py-2.5 text-base sm:text-lg' : 'px-4 py-2 text-sm'
                    }`}>
                      <span className="w-3 h-3 rounded-full bg-cyan-600 animate-ping" />
                      <span>STARTING SOON</span>
                    </div>
                    <div className={`font-mono font-bold text-cyan-700 ${isTvSize ? 'text-sm' : 'text-xs'}`}>
                      Starts in {toStartMinutes} minutes
                    </div>
                  </div>
                ) : isConcluded ? (
                  <div className="space-y-1 text-left lg:text-right">
                    <div className={`inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-600 font-bold uppercase ${
                      isTvSize ? 'px-4 py-2 text-sm' : 'px-3.5 py-1.5 text-xs'
                    }`}>
                      <CheckCircle className="w-4 h-4 text-slate-400" />
                      <span>CONCLUDED</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Ended at {activeSchedule.endTime}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-left lg:text-right">
                    <div className={`inline-flex items-center rounded-2xl bg-blue-50 border border-blue-300 text-blue-800 font-bold uppercase ${
                      isTvSize ? 'px-4 py-2 text-sm' : 'px-3.5 py-1.5 text-xs'
                    }`}>
                      <span>ON SCHEDULE</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Scheduled at {activeSchedule.startTime}
                    </div>
                  </div>
                )}

                <span className="text-xs font-bold text-blue-600 group-hover:underline flex items-center gap-1 mt-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Slide Indicator Bullets */}
          {filteredSchedules.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-slate-100">
              {filteredSchedules.slice(0, 20).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => {
                    setActiveIndex(dotIdx);
                    setProgress(0);
                  }}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    dotIdx === validActiveIndex
                      ? 'w-8 bg-blue-600 shadow-xs'
                      : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Jump to class ${dotIdx + 1}`}
                />
              ))}
              {filteredSchedules.length > 20 && (
                <span className="text-[10px] text-slate-400 font-mono ml-1">
                  +{filteredSchedules.length - 20} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // DEDICATED LOBBY TV MODE: Only the Slider Controls Display!
  // -------------------------------------------------------------
  if (isTvDisplayActive) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F5F7FB] p-4 sm:p-8 flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
        {/* Top TV Screen Bar */}
        <div className="bg-white rounded-2xl px-6 py-4 shadow-xs border border-slate-200 flex items-center justify-between gap-4 shrink-0">
          {/* Campus Title & Live Concourse Tag */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#102A56] text-white flex items-center justify-center font-black text-sm tracking-wider shadow-xs">
              BCAS
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  BCAS Colombo City Campus
                </h1>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Ground Floor TV Display</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Academic Timetable &amp; Lecture Hall Live Occupancy
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
              Total Classes: <strong className="text-slate-900 font-mono">{todaySchedules.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-800 border border-emerald-200">
              In Session: <strong className="font-mono">{ongoingList.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-cyan-50 text-xs font-bold text-cyan-800 border border-cyan-200">
              Starting Soon: <strong className="font-mono">{startingSoonList.length}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
              Concluded: <strong className="font-mono">{concludedList.length}</strong>
            </div>
          </div>

          {/* Clock & Exit Button */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right font-mono shadow-xs">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                <Radio className="w-2.5 h-2.5 text-red-500 animate-pulse" />
                <span>Colombo</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {currentTimeStr}
              </div>
            </div>

            <button
              onClick={exitLobbyTvMode}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Exit Lobby TV Mode (Esc or F)"
            >
              <Minimize2 className="w-4 h-4 text-amber-300" />
              <span>Exit TV Mode</span>
            </button>
          </div>
        </div>

        {/* Center Stage: ONLY the Slider Controls Display Card! */}
        <div className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto my-auto py-4">
          {renderSliderCard(true)}
        </div>

        {/* Bottom Helpful Navigation Strip */}
        <div className="bg-white rounded-xl px-5 py-2.5 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between font-medium shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Auto-rotating all today&apos;s scheduled lectures for ground floor concourse.</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono mt-1 sm:mt-0">
            Keyboard controls: [Space] Pause/Play · [← / →] Prev/Next · [Esc] Exit
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // NORMAL VIEW: Top Hero Card, Summary KPIs, Slider, Filters & Table
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Banner: Institutional Colombo Campus Concourse Header on Clean White Background */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#102A56] text-[11px] font-extrabold uppercase tracking-wider">
                BCAS Colombo City Campus
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Public Concourse</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Today&apos;s Lecture Hall Schedule &amp; Departure Board
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-medium">
              Real-time academic lecture timetable and lecture hall availability for students and faculty.
              Ground floor concourse display auto-synchronizes in Asia/Colombo timezone.
            </p>
          </div>

          {/* Clock & Fullscreen Display Controller */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
            {/* Live Clock Card */}
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-left sm:text-right font-mono shadow-xs flex items-center justify-between sm:block">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center sm:justify-end gap-1.5">
                  <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                  <span>Colombo Time</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {currentTimeStr}
                </div>
              </div>
              <div className="text-[11px] text-slate-600 font-sans font-medium sm:mt-0.5">
                {currentDay}, {todayStr}
              </div>
            </div>

            {/* Launch Dedicated Lobby TV Mode Button (Restricted to 'viewer' / authorized accounts) */}
            {canAccessLobbyTv ? (
              <button
                onClick={enterLobbyTvMode}
                className="p-2.5 sm:px-4 sm:py-3 rounded-2xl bg-[#102A56] hover:bg-[#1D4E89] text-white transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                title="Launch Dedicated Lobby TV Mode (Only Slider Display)"
              >
                <Tv className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold">
                  Lobby TV Mode
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="p-2.5 sm:px-4 sm:py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition border border-slate-200 cursor-pointer flex items-center justify-center gap-2 group"
                title="Lobby TV Mode is restricted to authorized ground-floor display viewers. Click to sign in as 'viewer'."
              >
                <Lock className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span className="text-xs font-semibold">
                  Lobby TV (Login)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 Real-Time Summary Cards on White Background */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Scheduled */}
        <div
          onClick={() => setFilterStatus('all')}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'all' ? 'border-[#102A56] ring-2 ring-[#102A56]/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Scheduled Today</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">{todaySchedules.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All sessions</div>
        </div>

        {/* In Session Now (Pulsing Green) */}
        <div
          onClick={() => setFilterStatus('ongoing')}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'ongoing'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
              : 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/10'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>In Session Now</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 font-mono">{ongoingList.length}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Currently running</div>
        </div>

        {/* Starting Soon */}
        <div
          onClick={() => setFilterStatus('starting_soon')}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            filterStatus === 'starting_soon'
              ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-50/30'
              : 'border-cyan-200 hover:border-cyan-400 bg-cyan-50/10'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-cyan-800 tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-600" />
            <span>Starting Soon</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-700 mt-1 font-mono">{startingSoonList.length}</div>
          <div className="text-[11px] text-cyan-600 mt-0.5">Within 25 minutes</div>
        </div>

        {/* Halls In Use */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-red-500" />
            <span>Halls In Use</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-mono">
            {occupiedHallsCount} <span className="text-sm font-semibold text-slate-400">/ {classrooms.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{availableHallsCount} halls available</div>
        </div>

        {/* Concluded Sessions (Counts up as classes finish) */}
        <div
          onClick={() => setFilterStatus('concluded')}
          className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-xs col-span-2 sm:col-span-1 ${
            filterStatus === 'concluded'
              ? 'border-slate-600 ring-2 ring-slate-400/20 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-slate-400" />
            <span>Concluded</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-600 mt-1 font-mono">{concludedList.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Past end time</div>
        </div>
      </div>

      {/* AUTO-ROTATING SPOTLIGHT CARD ("Now & Next" Auto-Slide Showcase - එකින් එක මාරු වන Display එක) */}
      {renderSliderCard(false)}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full md:w-auto font-bold text-slate-600">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              filterStatus === 'all' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            All Today ({todaySchedules.length})
          </button>

          <button
            onClick={() => setFilterStatus('ongoing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              filterStatus === 'ongoing' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>In Session ({ongoingList.length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('starting_soon')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              filterStatus === 'starting_soon' ? 'bg-cyan-600 text-white shadow-xs' : 'text-cyan-700 hover:bg-cyan-50'
            }`}
          >
            Starting Soon ({startingSoonList.length})
          </button>

          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              filterStatus === 'upcoming' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            Upcoming ({upcomingList.length})
          </button>

          <button
            onClick={() => setFilterStatus('concluded')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              filterStatus === 'concluded' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Concluded ({concludedList.length})
          </button>
        </div>

        {/* Search and Department Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search hall, module, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#102A56] bg-white"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#102A56]"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Bus/Flight Arrival & Departure Dashboard on Clean White Background */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredSchedules.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Scheduled Sessions For This Filter</h4>
            <p className="text-xs text-slate-500">
              There are currently no sessions matching the selected filter criteria for {currentDay}.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP & TABLET VIEW: Modern Crisp Tabular Departure Board (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200 select-none">
                    <th className="py-3.5 px-4 font-mono">Time / Slot</th>
                    <th className="py-3.5 px-4">Hall / Location</th>
                    <th className="py-3.5 px-4">Curriculum Module</th>
                    <th className="py-3.5 px-4">Program &amp; Batch</th>
                    <th className="py-3.5 px-4">Lecturer</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredSchedules.map((sch, idx) => {
                    const status = getLectureStatus(sch, currentHM);
                    const isOngoing = status === 'ongoing';
                    const isStartingSoon = status === 'starting_soon';
                    const isConcluded = status === 'concluded';
                    const isCurrentActive = idx === validActiveIndex;

                    const remMinutes = getRemainingMinutes(sch.endTime);
                    const toStartMinutes = getMinutesUntilStart(sch.startTime);
                    const deptColor = getDeptColor(sch.departmentName);
                    const room = classrooms.find((c) => c.name === sch.classroomName || c.id === sch.classroomId);

                    return (
                      <tr
                        key={sch.id}
                        onClick={() => {
                          setActiveIndex(idx);
                          setProgress(0);
                          onScheduleClick(sch);
                        }}
                        className={`transition cursor-pointer group ${
                          isCurrentActive
                            ? 'bg-blue-50/70 border-l-4 border-blue-600 ring-1 ring-blue-500/20'
                            : isOngoing
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-4 border-emerald-500'
                            : isStartingSoon
                            ? 'bg-cyan-50/40 hover:bg-cyan-50/70 border-l-4 border-cyan-500'
                            : isConcluded
                            ? 'bg-slate-50/40 hover:bg-slate-100/60 opacity-60 text-slate-500'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/30 hover:bg-slate-50'
                        }`}
                      >
                        {/* Time Slot */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                            <Clock className={`w-3.5 h-3.5 ${isOngoing ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span>{sch.startTime} – {sch.endTime}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sch.day}</div>
                        </td>

                        {/* Lecture Hall & Location */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 font-mono text-sm inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {sch.classroomName}
                          </div>
                          {room && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                              <MapPin className="w-3 h-3 text-[#D62828] shrink-0" />
                              <span>{room.wing || 'Main Building'}{room.floor ? ` · ${room.floor}` : ''}</span>
                            </div>
                          )}
                        </td>

                        {/* Module & Department */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 text-sm group-hover:text-blue-900 transition leading-snug">
                            {sch.moduleName}
                          </div>
                          <div className="mt-1">
                            <span
                              className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: deptColor }}
                            >
                              {sch.departmentName}
                            </span>
                          </div>
                        </td>

                        {/* Program & Batch */}
                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-slate-700">{sch.programName}</div>
                          <div className="text-xs font-bold text-blue-700 font-mono mt-0.5">{sch.batchName}</div>
                        </td>

                        {/* Lecturer */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium text-xs">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold">{sch.lecturerName}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {isOngoing ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                <span>In Session</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                                {remMinutes} min left
                              </span>
                            </div>
                          ) : isStartingSoon ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-800 text-xs font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
                                <span>Starting Soon</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold text-cyan-700 mt-0.5">
                                In {toStartMinutes} min
                              </span>
                            </div>
                          ) : isConcluded ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
                                <CheckCircle className="w-3 h-3 text-slate-400" />
                                <span>Concluded</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Ended at {sch.endTime}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                                On Schedule
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Starts {sch.startTime}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: Dedicated Fully-Responsive Stacked Departure Cards (Displayed on Mobile < 768px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredSchedules.map((sch, idx) => {
                const status = getLectureStatus(sch, currentHM);
                const isOngoing = status === 'ongoing';
                const isStartingSoon = status === 'starting_soon';
                const isConcluded = status === 'concluded';
                const isCurrentActive = idx === validActiveIndex;

                const remMinutes = getRemainingMinutes(sch.endTime);
                const toStartMinutes = getMinutesUntilStart(sch.startTime);
                const deptColor = getDeptColor(sch.departmentName);
                const room = classrooms.find((c) => c.name === sch.classroomName || c.id === sch.classroomId);

                return (
                  <div
                    key={sch.id}
                    onClick={() => {
                      setActiveIndex(idx);
                      setProgress(0);
                      onScheduleClick(sch);
                    }}
                    className={`p-4 transition cursor-pointer ${
                      isCurrentActive
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : isOngoing
                        ? 'bg-emerald-50/50 border-l-4 border-emerald-500'
                        : isStartingSoon
                        ? 'bg-cyan-50/40 border-l-4 border-cyan-500'
                        : isConcluded
                        ? 'bg-slate-50/60 opacity-60'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Top Row: Time Slot & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-slate-900">
                        <Clock className={`w-3.5 h-3.5 ${isOngoing ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{sch.startTime} – {sch.endTime}</span>
                      </div>

                      {isOngoing ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>In Session ({remMinutes}m)</span>
                        </span>
                      ) : isStartingSoon ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold uppercase tracking-wider">
                          <span>Starts in {toStartMinutes}m</span>
                        </span>
                      ) : isConcluded ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                          <CheckCircle className="w-3 h-3 text-slate-400" />
                          <span>Concluded</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                          Starts {sch.startTime}
                        </span>
                      )}
                    </div>

                    {/* Hall Badge & Department */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-900">
                          {sch.classroomName}
                        </span>
                        {room && (
                          <span className="text-[11px] text-slate-500">
                            {room.wing || 'Main'} · {room.floor || 'G-Fl'}
                          </span>
                        )}
                      </div>

                      <span
                        className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: deptColor }}
                      >
                        {sch.departmentName}
                      </span>
                    </div>

                    {/* Module Title */}
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{sch.moduleName}</h4>

                    {/* Program & Batch */}
                    <div className="text-xs text-slate-600 mt-1">
                      <span>{sch.programName}</span>
                      <span className="font-bold text-blue-700 ml-1.5 font-mono">({sch.batchName})</span>
                    </div>

                    {/* Lecturer */}
                    <div className="flex items-center gap-1.5 text-slate-700 text-xs mt-2 pt-2 border-t border-slate-100">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold">{sch.lecturerName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
