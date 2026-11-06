import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, testFirestoreConnection } from './lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { DataService } from './services/dataService';
import {
  Department,
  Lecturer,
  Classroom,
  Program,
  Batch,
  Module,
  TimeSlot,
  AcademicWeek,
  Schedule,
  ActivityLog,
  DayOfWeek,
} from './types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_LECTURERS,
  INITIAL_CLASSROOMS,
  INITIAL_TIME_SLOTS,
  INITIAL_PROGRAMS,
  INITIAL_BATCHES,
  INITIAL_MODULES,
  INITIAL_ACADEMIC_WEEKS,
  INITIAL_SCHEDULES,
} from './data/initialData';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TodayTimetable } from './components/TodayTimetable';
import { LectureHallTracker } from './components/LectureHallTracker';
import { TimetableGrid } from './components/TimetableGrid';
import { AdminDashboard } from './components/AdminDashboard';
import { MasterDataManager } from './components/MasterDataManager';
import { LoginModal } from './components/LoginModal';
import { ScheduleModal } from './components/ScheduleModal';
import { ScheduleDetailModal } from './components/ScheduleDetailModal';
import { CopyWeekModal } from './components/CopyWeekModal';
import { ExcelExportModal } from './components/ExcelExportModal';
import { PrintLayout } from './components/PrintLayout';
import { ForcePasswordModal } from './components/ForcePasswordModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AddLecturerModal } from './components/AddLecturerModal';
import { CampusDigitalBoard } from './components/CampusDigitalBoard';

function AppContent() {
  const { currentUser, role, isSuperAdmin, isAdmin } = useAuth();

  const [currentView, setCurrentView] = useState<string>('today');

  // Firestore real-time state with resilient baseline fallbacks
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [lecturers, setLecturers] = useState<Lecturer[]>(INITIAL_LECTURERS);
  const [classrooms, setClassrooms] = useState<Classroom[]>(INITIAL_CLASSROOMS);
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(INITIAL_TIME_SLOTS);
  const [academicWeeks, setAcademicWeeks] = useState<AcademicWeek[]>(INITIAL_ACADEMIC_WEEKS);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sundayEnabled, setSundayEnabled] = useState(true);

  // Active academic week selection
  const [selectedWeek, setSelectedWeek] = useState<AcademicWeek>(
    INITIAL_ACADEMIC_WEEKS.find((w) => w.isCurrent) || INITIAL_ACADEMIC_WEEKS[1]
  );

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isCopyWeekOpen, setIsCopyWeekOpen] = useState(false);
  const [isAddLecturerOpen, setIsAddLecturerOpen] = useState(false);

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [newSlotDefaults, setNewSlotDefaults] = useState<{
    classroom: Classroom | null;
    slot: TimeSlot | null;
    day: DayOfWeek;
    date: string;
  }>({
    classroom: null,
    slot: null,
    day: 'Monday',
    date: '',
  });

  // Schedule detail modal state
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);

  // 1. Initialize Firestore connection and bootstrap database
  useEffect(() => {
    const init = async () => {
      await testFirestoreConnection();
      await DataService.initializeDatabase();
    };
    init();
  }, []);

  // 2. Set up real-time listeners for all collections
  useEffect(() => {
    const handleError = (collectionName: string) => (err: Error) => {
      console.warn(`Firestore onSnapshot notice [${collectionName}]:`, err.message);
    };

    const unsubs = [
      onSnapshot(
        collection(db, 'departments'),
        (snap) => {
          if (!snap.empty) {
            const list: Department[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Department));
            setDepartments(list);
          }
        },
        handleError('departments')
      ),
      onSnapshot(
        collection(db, 'lecturers'),
        (snap) => {
          if (!snap.empty) {
            const map = new Map<string, Lecturer>();
            snap.forEach((d) => {
              const data = { id: d.id, ...d.data() } as Lecturer;
              const key = (data.staffCode || data.name).trim().toLowerCase();
              if (!map.has(key) || data.id.startsWith('lec-0') || data.id.startsWith('lec-exm')) {
                map.set(key, data);
              }
            });
            setLecturers(Array.from(map.values()));
          }
        },
        handleError('lecturers')
      ),
      onSnapshot(
        collection(db, 'classrooms'),
        (snap) => {
          if (!snap.empty) {
            const map = new Map<string, Classroom>();
            snap.forEach((d) => {
              const data = { id: d.id, ...d.data() } as Classroom;
              const key = (data.facilityId || data.name).trim().toLowerCase();
              if (!map.has(key) || data.id.startsWith('cr-0')) {
                map.set(key, data);
              }
            });
            setClassrooms(Array.from(map.values()));
          }
        },
        handleError('classrooms')
      ),
      onSnapshot(
        collection(db, 'timeSlots'),
        (snap) => {
          if (!snap.empty) {
            const list: TimeSlot[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as TimeSlot));
            setTimeSlots(list);
          }
        },
        handleError('timeSlots')
      ),
      onSnapshot(
        collection(db, 'programs'),
        (snap) => {
          if (!snap.empty) {
            const list: Program[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Program));
            setPrograms(list);
          }
        },
        handleError('programs')
      ),
      onSnapshot(
        collection(db, 'batches'),
        (snap) => {
          if (!snap.empty) {
            const list: Batch[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Batch));
            setBatches(list);
          }
        },
        handleError('batches')
      ),
      onSnapshot(
        collection(db, 'modules'),
        (snap) => {
          if (!snap.empty) {
            const list: Module[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Module));
            setModules(list);
          }
        },
        handleError('modules')
      ),
      onSnapshot(
        collection(db, 'academicWeeks'),
        (snap) => {
          if (!snap.empty) {
            const list: AcademicWeek[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AcademicWeek));
            setAcademicWeeks(list);
            const curr = list.find((w) => w.isCurrent);
            if (curr) setSelectedWeek(curr);
          }
        },
        handleError('academicWeeks')
      ),
      onSnapshot(
        collection(db, 'schedules'),
        (snap) => {
          if (!snap.empty) {
            const list: Schedule[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Schedule));
            setSchedules(list);
          }
        },
        handleError('schedules')
      ),
      onSnapshot(
        collection(db, 'activityLogs'),
        (snap) => {
          const list: ActivityLog[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ActivityLog));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setActivityLogs(list);
        },
        handleError('activityLogs')
      ),
      onSnapshot(
        doc(db, 'systemSettings', 'general'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.weekendSundayEnabled !== undefined) {
              setSundayEnabled(data.weekendSundayEnabled);
            }
          }
        },
        handleError('systemSettings')
      ),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Cell click in timetable matrix -> Open schedule creation modal (Admins)
  const handleCellClick = (
    room: Classroom,
    slot: TimeSlot,
    day: DayOfWeek,
    dateStr: string
  ) => {
    if (!isAdmin) return;
    setEditingSchedule(null);
    setNewSlotDefaults({
      classroom: room,
      slot,
      day,
      date: dateStr,
    });
    setIsScheduleModalOpen(true);
  };

  // Click on existing occupied schedule -> Open details modal
  const handleScheduleClick = (schedule: Schedule) => {
    setDetailSchedule(schedule);
  };

  // Edit from detail modal
  const handleEditSchedule = (sch: Schedule) => {
    setEditingSchedule(sch);
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#1E293B]">
      {/* Institutional Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(v) => {
          if (v === 'copyWeek') {
            setIsCopyWeekOpen(true);
          } else {
            setCurrentView(v);
          }
        }}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenExcelExport={() => setIsExcelOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onOpenAddLecturer={() => setIsAddLecturerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {currentView === 'board' && (
          <CampusDigitalBoard
            classrooms={classrooms}
            schedules={schedules}
            timeSlots={timeSlots}
            departments={departments}
            onScheduleClick={handleScheduleClick}
            onExitBoardView={() => setCurrentView('today')}
          />
        )}

        {currentView === 'today' && (
          <TodayTimetable
            classrooms={classrooms}
            schedules={schedules}
            timeSlots={timeSlots}
            departments={departments}
            onScheduleClick={handleScheduleClick}
            onNavigateToTracker={() => setCurrentView('tracker')}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {currentView === 'tracker' && (
          <LectureHallTracker
            classrooms={classrooms}
            schedules={schedules}
            timeSlots={timeSlots}
            onScheduleClick={handleScheduleClick}
          />
        )}

        {currentView === 'grid' && (
          <TimetableGrid
            currentWeek={selectedWeek}
            academicWeeks={academicWeeks}
            onSelectWeek={setSelectedWeek}
            schedules={schedules}
            classrooms={classrooms}
            timeSlots={timeSlots}
            departments={departments}
            lecturers={lecturers}
            onCellClick={handleCellClick}
            onScheduleClick={handleScheduleClick}
            sundayEnabled={sundayEnabled}
          />
        )}

        {currentView === 'dashboard' && isAdmin && (
          <AdminDashboard
            classrooms={classrooms}
            schedules={schedules}
            departments={departments}
            lecturers={lecturers}
            currentWeek={selectedWeek}
            activityLogs={activityLogs}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'masterData' && isSuperAdmin && (
          <MasterDataManager
            departments={departments}
            lecturers={lecturers}
            classrooms={classrooms}
            programs={programs}
            batches={batches}
            modules={modules}
            timeSlots={timeSlots}
            activityLogs={activityLogs}
            sundayEnabled={sundayEnabled}
            onToggleSunday={async (enabled) => {
              setSundayEnabled(enabled);
              try {
                await updateDoc(doc(db, 'systemSettings', 'general'), {
                  weekendSundayEnabled: enabled,
                  updatedAt: new Date().toISOString(),
                });
              } catch (e) {
                console.warn('Failed to update sunday setting in Firestore:', e);
              }
            }}
            onRefreshData={() => {}}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <Footer onNavigate={setCurrentView} />

      {/* Modals & Dialogs */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        existingSchedule={editingSchedule}
        defaultDate={newSlotDefaults.date}
        defaultDay={newSlotDefaults.day}
        defaultTimeSlot={newSlotDefaults.slot}
        defaultClassroom={newSlotDefaults.classroom}
        academicWeek={selectedWeek}
        allSchedules={schedules}
        classrooms={classrooms}
        timeSlots={timeSlots}
        departments={departments}
        lecturers={lecturers}
        programs={programs}
        batches={batches}
        modules={modules}
        onSaveSuccess={() => {}}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        classroom={classrooms.find((c) => c.name === detailSchedule?.classroomName)}
        isOpen={!!detailSchedule}
        onClose={() => setDetailSchedule(null)}
        onEdit={handleEditSchedule}
        onDelete={async (sch) => {
          await DataService.deleteSchedule(sch.id, sch, currentUser?.username || 'admin', currentUser?.role || 'admin');
        }}
      />

      <CopyWeekModal
        isOpen={isCopyWeekOpen}
        onClose={() => setIsCopyWeekOpen(false)}
        academicWeeks={academicWeeks}
        allSchedules={schedules}
        onCopySuccess={() => {}}
      />

      {isAdmin && (
        <>
          <ExcelExportModal
            isOpen={isExcelOpen}
            onClose={() => setIsExcelOpen(false)}
            academicWeeks={academicWeeks}
            currentWeek={selectedWeek}
            schedules={schedules}
            classrooms={classrooms}
            timeSlots={timeSlots}
          />

          <PrintLayout
            isOpen={isPrintOpen}
            onClose={() => setIsPrintOpen(false)}
            academicWeeks={academicWeeks}
            currentWeek={selectedWeek}
            schedules={schedules}
            classrooms={classrooms}
            timeSlots={timeSlots}
          />

          <AddLecturerModal
            isOpen={isAddLecturerOpen}
            onClose={() => setIsAddLecturerOpen(false)}
            departments={departments}
            existingLecturers={lecturers}
          />
        </>
      )}

      {/* Mandatory Forced Password Change for Initial Bootstrap Accounts */}
      <ForcePasswordModal />

      {/* Offline Status Warning */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
