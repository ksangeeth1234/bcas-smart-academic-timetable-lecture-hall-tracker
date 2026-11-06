export type UserRole = 'superadmin' | 'admin' | 'viewer' | 'guest';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'admin' | 'viewer';
  displayName: string;
  active: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  color?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lecturer {
  id: string;
  staffCode: string;
  name: string;
  department: string;
  designation: string;
  facultyType: 'Permanent' | 'Visiting' | 'Contract';
  status: 'Active' | 'Inactive';
  email: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FacilityCategory = 'Lecture Hall' | 'Computer Lab' | 'Science Lab' | 'Specialized Facility' | 'Auditorium';
export type OperationalStatus = 'Operational' | 'Maintenance' | 'Inactive';

export interface Classroom {
  id: string;
  facilityId: string;
  name: string;
  category: FacilityCategory;
  capacity: number;
  operationalStatus: OperationalStatus;
  floor?: string;
  wing?: string;
  facilities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  departmentId?: string;
  departmentName: string;
  duration?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Batch {
  id: string;
  name: string;
  programId?: string;
  programName: string;
  departmentId?: string;
  departmentName: string;
  academicYear?: string;
  studentCount?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  programId?: string;
  departmentId?: string;
  departmentName?: string;
  credits?: number;
  semester?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimeSlot {
  id: string;
  slotNumber: number;
  label: string;
  startTime: string; // e.g. "08:15"
  endTime: string;   // e.g. "09:15"
  displayTime: string; // e.g. "08:15 AM – 09:15 AM"
  type: 'weekday' | 'weekend';
  isBreak?: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicWeek {
  id: string;
  weekNumber: number;
  label: string; // e.g. "Week 08 (Nov 03 - Nov 09, 2026)"
  startDate: string; // "2026-11-03"
  endDate: string;   // "2026-11-09"
  academicYear: string;
  semester: string;
  isCurrent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  id: string;
  scheduleId?: string;
  academicWeekId: string;
  date: string; // "YYYY-MM-DD"
  day: DayOfWeek;
  timeSlotId: string;
  startTime: string; // "08:15"
  endTime: string;   // "09:15"
  programId?: string;
  programName: string;
  departmentId?: string;
  departmentName: string;
  batchId?: string;
  batchName: string;
  moduleId?: string;
  moduleName: string;
  lecturerId?: string;
  lecturerName: string; // e.g. "Mr. Anis (LEC0006)"
  classroomId: string;
  classroomName: string;
  notes?: string;
  color?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  timestamp: string;
}

export interface SystemSetting {
  id: string;
  campusName: string;
  institution: string;
  timezone: string;
  weekendSundayEnabled: boolean;
  currentAcademicWeekId: string;
  notificationsEnabled: boolean;
  updatedAt?: string;
}

export interface OccupancyStatus {
  classroom: Classroom;
  isOccupied: boolean;
  currentSchedule?: Schedule;
  remainingMinutes?: number;
  nextSchedule?: Schedule;
}
