import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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
  SystemSetting,
  UserProfile,
} from '../types';
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
} from '../data/initialData';

// Validation conflict error type
export interface ScheduleValidationError {
  field: 'classroom' | 'lecturer' | 'batch' | 'status';
  message: string;
}

export class DataService {
  /**
   * Idempotent initialization of master data and bootstrap accounts
   */
  static async initializeDatabase(): Promise<void> {
    try {
      const settingDoc = await getDoc(doc(db, 'systemSettings', 'general'));
      const isUpToDate = settingDoc.exists() && settingDoc.data()?.version === 'v3_reference_dataset';
      if (isUpToDate) {
        return; // Already initialized with latest reference dataset
      }

      console.log('Synchronizing authoritative BCAS Colombo reference dataset (11 depts, 94 staff, 39 halls) to Firestore...');

      // 1. System Settings with dataset version tracking
      await setDoc(doc(db, 'systemSettings', 'general'), {
        id: 'general',
        campusName: 'BCAS Colombo City Campus',
        institution: 'British College of Applied Studies (BCAS)',
        timezone: 'Asia/Colombo',
        weekendSundayEnabled: true,
        currentAcademicWeekId: 'week-2026-w08',
        notificationsEnabled: true,
        version: 'v3_reference_dataset',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. Initial Admin Accounts (if not existing)
      const superAdminDoc = await getDoc(doc(db, 'users', 'superadmin'));
      if (!superAdminDoc.exists()) {
        await setDoc(doc(db, 'users', 'superadmin'), {
          id: 'superadmin',
          username: 'superadmin',
          email: 'superadmin@bcas.campus.lk',
          role: 'superadmin',
          displayName: 'Campus Super Administrator',
          active: true,
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        });
      }

      const adminDoc = await getDoc(doc(db, 'users', 'admin'));
      if (!adminDoc.exists()) {
        await setDoc(doc(db, 'users', 'admin'), {
          id: 'admin',
          username: 'admin',
          email: 'admin@bcas.campus.lk',
          role: 'admin',
          displayName: 'Timetable Scheduling Admin',
          active: true,
          mustChangePassword: true,
          customPassword: 'asdf@#1234',
          createdAt: new Date().toISOString(),
        });
      }

      const viewerDoc = await getDoc(doc(db, 'users', 'viewer'));
      if (!viewerDoc.exists()) {
        await setDoc(doc(db, 'users', 'viewer'), {
          id: 'viewer',
          username: 'viewer',
          email: 'viewer@bcas.campus.lk',
          role: 'viewer',
          displayName: 'Lobby Display Viewer',
          active: true,
          mustChangePassword: false,
          customPassword: 'asdf@#1234',
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Departments (11 authoritative faculties)
      const deptBatch = writeBatch(db);
      for (const d of INITIAL_DEPARTMENTS) {
        deptBatch.set(doc(db, 'departments', d.id), d, { merge: true });
      }
      await deptBatch.commit();

      // 4. Academic Staff (All 94 members from reference directory) in chunks of 45
      for (let i = 0; i < INITIAL_LECTURERS.length; i += 45) {
        const chunk = INITIAL_LECTURERS.slice(i, i + 45);
        const lBatch = writeBatch(db);
        for (const lec of chunk) {
          lBatch.set(doc(db, 'lecturers', lec.id), lec, { merge: true });
        }
        await lBatch.commit();
      }

      // 5. Classrooms (All 39 authoritative facilities)
      const crBatch = writeBatch(db);
      for (const cr of INITIAL_CLASSROOMS) {
        crBatch.set(doc(db, 'classrooms', cr.id), cr, { merge: true });
      }
      await crBatch.commit();

      // Prune any legacy or duplicate classrooms and lecturers not in authoritative lists
      const validCrIds = new Set(INITIAL_CLASSROOMS.map((c) => c.id));
      const existingCrs = await getDocs(collection(db, 'classrooms'));
      for (const d of existingCrs.docs) {
        if (!validCrIds.has(d.id)) {
          await deleteDoc(doc(db, 'classrooms', d.id));
        }
      }

      const validLecIds = new Set(INITIAL_LECTURERS.map((l) => l.id));
      const existingLecs = await getDocs(collection(db, 'lecturers'));
      for (const d of existingLecs.docs) {
        if (!validLecIds.has(d.id)) {
          await deleteDoc(doc(db, 'lecturers', d.id));
        }
      }

      // 6. Time Slots (if first run)
      const tsDocs = await getDocs(collection(db, 'timeSlots'));
      if (tsDocs.empty) {
        const tsBatch = writeBatch(db);
        for (const ts of INITIAL_TIME_SLOTS) {
          tsBatch.set(doc(db, 'timeSlots', ts.id), ts);
        }
        await tsBatch.commit();
      }

      // 7. Programs (if first run)
      const pDocs = await getDocs(collection(db, 'programs'));
      if (pDocs.empty) {
        const pBatch = writeBatch(db);
        for (const p of INITIAL_PROGRAMS) {
          pBatch.set(doc(db, 'programs', p.id), p);
        }
        await pBatch.commit();
      }

      // 8. Batches (if first run)
      const bDocs = await getDocs(collection(db, 'batches'));
      if (bDocs.empty) {
        const bBatch = writeBatch(db);
        for (const b of INITIAL_BATCHES) {
          bBatch.set(doc(db, 'batches', b.id), b);
        }
        await bBatch.commit();
      }

      // 9. Modules (if first run)
      const mDocs = await getDocs(collection(db, 'modules'));
      if (mDocs.empty) {
        const mBatch = writeBatch(db);
        for (const m of INITIAL_MODULES) {
          mBatch.set(doc(db, 'modules', m.id), m);
        }
        await mBatch.commit();
      }

      // 10. Academic Weeks (if first run)
      const wDocs = await getDocs(collection(db, 'academicWeeks'));
      if (wDocs.empty) {
        const wBatch = writeBatch(db);
        for (const w of INITIAL_ACADEMIC_WEEKS) {
          wBatch.set(doc(db, 'academicWeeks', w.id), w);
        }
        await wBatch.commit();
      }

      // 11. Initial Schedules (if first run)
      const sDocs = await getDocs(collection(db, 'schedules'));
      if (sDocs.empty) {
        const sBatch = writeBatch(db);
        for (const s of INITIAL_SCHEDULES) {
          sBatch.set(doc(db, 'schedules', s.id), s);
        }
        await sBatch.commit();
      }

      // Log initialization
      await this.logActivity(
        'superadmin',
        'superadmin',
        'System Initialization',
        'System',
        'general',
        'Synchronized authoritative reference master data: 11 departments, 94 academic staff, and 39 lecture facilities.'
      );

      console.log('BCAS Colombo database synchronization completed successfully!');
    } catch (err) {
      console.error('Error during database initialization:', err);
      // Non-fatal if permission denied or already written
    }
  }

  /**
   * Log an activity
   */
  static async logActivity(
    username: string,
    userRole: string,
    action: string,
    entityType: string,
    entityId: string,
    details: string
  ): Promise<void> {
    try {
      const logEntry: Omit<ActivityLog, 'id'> = {
        userId: username,
        username,
        userRole,
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, 'activityLogs'), logEntry);
    } catch (err) {
      console.warn('Failed to record activity log:', err);
    }
  }

  /**
   * Validate potential schedule conflicts against existing entries
   */
  static validateScheduleConflict(
    newSchedule: Partial<Schedule>,
    existingSchedules: Schedule[],
    classrooms: Classroom[],
    lecturers: Lecturer[]
  ): ScheduleValidationError | null {
    // 1. Check classroom operational status
    const targetRoom = classrooms.find(
      (c) => c.name === newSchedule.classroomName || c.id === newSchedule.classroomId
    );
    if (targetRoom && targetRoom.operationalStatus !== 'Operational') {
      return {
        field: 'status',
        message: `Classroom "${targetRoom.name}" is currently set to ${targetRoom.operationalStatus} and cannot host lectures.`,
      };
    }

    // 2. Check lecturer active status
    const targetLecturer = lecturers.find(
      (l) => l.name === newSchedule.lecturerName || `${l.name} (${l.staffCode})` === newSchedule.lecturerName
    );
    if (targetLecturer && targetLecturer.status === 'Inactive') {
      return {
        field: 'status',
        message: `Lecturer "${targetLecturer.name}" is marked Inactive. Inactive lecturers cannot be scheduled for new lectures.`,
      };
    }

    // Filter candidate schedules on the same academic date and time slot
    const concurrentSchedules = existingSchedules.filter(
      (s) =>
        s.date === newSchedule.date &&
        s.timeSlotId === newSchedule.timeSlotId &&
        s.id !== newSchedule.id
    );

    // 3. Hall Conflict: Is the room already occupied at this time?
    const hallConflict = concurrentSchedules.find(
      (s) => s.classroomName === newSchedule.classroomName || s.classroomId === newSchedule.classroomId
    );
    if (hallConflict) {
      return {
        field: 'classroom',
        message: `Lecture Hall ${newSchedule.classroomName} is already occupied during this time slot (${hallConflict.programName} - ${hallConflict.moduleName}).`,
      };
    }

    // 4. Lecturer Conflict: Is the lecturer assigned to another lecture at this time?
    const lecturerConflict = concurrentSchedules.find(
      (s) => s.lecturerName === newSchedule.lecturerName
    );
    if (lecturerConflict) {
      return {
        field: 'lecturer',
        message: `${newSchedule.lecturerName} is already assigned to another lecture in ${lecturerConflict.classroomName} during this period.`,
      };
    }

    // 5. Batch Conflict: Is the batch scheduled for another lecture at this time?
    if (newSchedule.batchName) {
      const batchConflict = concurrentSchedules.find(
        (s) => s.batchName === newSchedule.batchName
      );
      if (batchConflict) {
        return {
          field: 'batch',
          message: `Batch "${newSchedule.batchName}" already has a lecture scheduled in ${batchConflict.classroomName} during this time slot.`,
        };
      }
    }

    return null; // Valid!
  }

  /**
   * Helper to strip undefined values and id from Firestore payloads
   */
  private static sanitizePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined && key !== 'id') {
        clean[key] = val;
      }
    }
    return clean;
  }

  /**
   * Add a new schedule entry
   */
  static async addSchedule(scheduleData: Omit<Schedule, 'id'>, username: string, userRole: string): Promise<string> {
    try {
      const cleanData = this.sanitizePayload(scheduleData);
      const docRef = await addDoc(collection(db, 'schedules'), {
        ...cleanData,
        scheduleId: cleanData.scheduleId || `SCH-${Date.now().toString().slice(-5)}`,
        createdBy: username || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await this.logActivity(
        username || 'admin',
        userRole || 'admin',
        'Create Schedule',
        'Schedule',
        docRef.id,
        `Scheduled ${scheduleData.programName} (${scheduleData.moduleName}) in ${scheduleData.classroomName} on ${scheduleData.date} (${scheduleData.startTime}-${scheduleData.endTime})`
      );

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedules');
    }
  }

  /**
   * Update an existing schedule entry
   */
  static async updateSchedule(
    id: string,
    updates: Partial<Schedule>,
    username: string,
    userRole: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'schedules', id);
      const cleanUpdates = this.sanitizePayload(updates);
      await updateDoc(docRef, {
        ...cleanUpdates,
        updatedBy: username || 'admin',
        updatedAt: new Date().toISOString(),
      });

      await this.logActivity(
        username || 'admin',
        userRole || 'admin',
        'Update Schedule',
        'Schedule',
        id,
        `Updated schedule for ${updates.classroomName || 'Room'} on ${updates.date || 'date'}`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `schedules/${id}`);
    }
  }

  /**
   * Delete a schedule entry
   */
  static async deleteSchedule(
    id: string,
    schedule: Schedule,
    username: string,
    userRole: string
  ): Promise<void> {
    try {
      await deleteDoc(doc(db, 'schedules', id));

      await this.logActivity(
        username,
        userRole,
        'Delete Schedule',
        'Schedule',
        id,
        `Removed schedule: ${schedule.moduleName} in ${schedule.classroomName} on ${schedule.date} (${schedule.day})`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schedules/${id}`);
    }
  }

  /**
   * Copy timetable entries from a source week into a target week
   * Implements exact day mapping, dates alignment, conflict detection, and duplication prevention
   */
  static async copyWeeklyTimetable(
    sourceWeek: AcademicWeek,
    targetWeek: AcademicWeek,
    allSchedules: Schedule[],
    username: string,
    userRole: string
  ): Promise<{ copiedCount: number; errors: string[] }> {
    try {
      // Find all schedules in source week
      const sourceSchedules = allSchedules.filter((s) => s.academicWeekId === sourceWeek.id);
      if (sourceSchedules.length === 0) {
        return { copiedCount: 0, errors: ['No schedules found in the selected source week to copy.'] };
      }

      // Check existing schedules in target week to avoid duplicates
      const targetExisting = allSchedules.filter((s) => s.academicWeekId === targetWeek.id);
      
      const dayOffsetMap: Record<string, number> = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      };

      const targetStartDate = new Date(targetWeek.startDate);
      const copiedSchedules: Omit<Schedule, 'id'>[] = [];
      const errors: string[] = [];

      for (const src of sourceSchedules) {
        const offset = dayOffsetMap[src.day] ?? 0;
        const newDate = new Date(targetStartDate);
        newDate.setDate(targetStartDate.getDate() + offset);
        const newDateStr = newDate.toISOString().split('T')[0];

        // Check if an identical schedule already exists in target week
        const alreadyExists = targetExisting.some(
          (t) =>
            t.date === newDateStr &&
            t.timeSlotId === src.timeSlotId &&
            t.classroomName === src.classroomName
        );

        if (alreadyExists) {
          continue; // Skip already populated slot
        }

        copiedSchedules.push({
          academicWeekId: targetWeek.id,
          date: newDateStr,
          day: src.day,
          timeSlotId: src.timeSlotId,
          startTime: src.startTime,
          endTime: src.endTime,
          programId: src.programId,
          programName: src.programName,
          departmentId: src.departmentId,
          departmentName: src.departmentName,
          batchId: src.batchId,
          batchName: src.batchName,
          moduleId: src.moduleId,
          moduleName: src.moduleName,
          lecturerId: src.lecturerId,
          lecturerName: src.lecturerName,
          classroomId: src.classroomId,
          classroomName: src.classroomName,
          notes: src.notes ? `[Copied from ${sourceWeek.label}] ${src.notes}` : `Copied from ${sourceWeek.label}`,
          scheduleId: `SCH-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
          createdBy: username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (copiedSchedules.length === 0) {
        return {
          copiedCount: 0,
          errors: ['All schedules for this target week are already synchronized or no new slots to copy.'],
        };
      }

      // Write in batches
      for (let i = 0; i < copiedSchedules.length; i += 45) {
        const chunk = copiedSchedules.slice(i, i + 45);
        const batch = writeBatch(db);
        for (const item of chunk) {
          const newDocRef = doc(collection(db, 'schedules'));
          batch.set(newDocRef, item);
        }
        await batch.commit();
      }

      await this.logActivity(
        username,
        userRole,
        'Copy Weekly Timetable',
        'AcademicWeek',
        targetWeek.id,
        `Copied ${copiedSchedules.length} schedules from ${sourceWeek.label} into ${targetWeek.label}`
      );

      return { copiedCount: copiedSchedules.length, errors };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'schedules');
    }
  }

  /**
   * Master Data: Add Lecturer
   */
  static async addLecturer(lecturer: Omit<Lecturer, 'id'>, username: string, userRole: string): Promise<string> {
    try {
      const cleanData = this.sanitizePayload(lecturer);
      const docRef = await addDoc(collection(db, 'lecturers'), {
        ...cleanData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await this.logActivity(username || 'admin', userRole || 'admin', 'Create Lecturer', 'Lecturer', docRef.id, `Added staff: ${lecturer.name} (${lecturer.staffCode})`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lecturers');
    }
  }

  /**
   * Master Data: Update Lecturer
   */
  static async updateLecturer(id: string, updates: Partial<Lecturer>, username: string, userRole: string): Promise<void> {
    try {
      const cleanUpdates = this.sanitizePayload(updates);
      await updateDoc(doc(db, 'lecturers', id), {
        ...cleanUpdates,
        updatedAt: new Date().toISOString(),
      });
      await this.logActivity(username || 'admin', userRole || 'admin', 'Update Lecturer', 'Lecturer', id, `Updated staff profile for ${updates.name || id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `lecturers/${id}`);
    }
  }

  /**
   * Master Data: Update Classroom
   */
  static async updateClassroom(id: string, updates: Partial<Classroom>, username: string, userRole: string): Promise<void> {
    try {
      const cleanUpdates = this.sanitizePayload(updates);
      await updateDoc(doc(db, 'classrooms', id), {
        ...cleanUpdates,
        updatedAt: new Date().toISOString(),
      });
      await this.logActivity(username || 'admin', userRole || 'admin', 'Update Classroom', 'Classroom', id, `Updated classroom ${updates.name || id} status/info`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classrooms/${id}`);
    }
  }

  /**
   * Master Data: Add Classroom
   */
  static async addClassroom(classroom: Omit<Classroom, 'id'>, username: string, userRole: string): Promise<string> {
    try {
      const cleanData = this.sanitizePayload(classroom);
      const docRef = await addDoc(collection(db, 'classrooms'), {
        ...cleanData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await this.logActivity(username || 'admin', userRole || 'admin', 'Create Classroom', 'Classroom', docRef.id, `Added facility: ${classroom.name} (${classroom.facilityId})`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classrooms');
    }
  }
}
