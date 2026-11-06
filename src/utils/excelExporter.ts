import ExcelJS from 'exceljs';
import { Schedule, Classroom, TimeSlot, AcademicWeek, DayOfWeek } from '../types';
import { getColomboDateString, getColomboTimeString } from './colomboTime';

export class ExcelExporter {
  /**
   * Export a complete multi-sheet Weekly Timetable
   * (Overview Summary sheet + Individual Day sheets: Mon, Tue, Wed, Thu, Fri, Sat)
   */
  static async exportWeeklyTimetable(
    week: AcademicWeek,
    schedules: Schedule[],
    classrooms: Classroom[],
    timeSlots: TimeSlot[]
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BCAS Colombo City Campus Timetable System';
    workbook.lastModifiedBy = 'Academic Registry';
    workbook.created = new Date();
    workbook.modified = new Date();

    const weekSchedules = schedules.filter((s) => s.academicWeekId === week.id);
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // 1. Summary Sheet
    const summarySheet = workbook.addWorksheet('Weekly Summary', {
      views: [{ showGridLines: true }],
    });

    this.applyHeader(summarySheet, `BCAS COLOMBO CITY CAMPUS - WEEKLY TIMETABLE OVERVIEW`, [
      `Academic Week: ${week.label}`,
      `Date Range: ${week.startDate} to ${week.endDate}`,
      `Total Scheduled Lectures: ${weekSchedules.length}`,
      `Total Classrooms Registered: ${classrooms.length}`,
      `Report Generated: ${getColomboDateString()} ${getColomboTimeString()} (Asia/Colombo)`,
    ]);

    summarySheet.addRow([]);
    const summaryHeaderRow = summarySheet.addRow([
      'Day of Week',
      'Total Lectures',
      'Occupied Halls',
      'Computing',
      'Business Mgmt',
      'Biomedical',
      'Engineering/CBE',
      'Law',
      'Nursing',
      'Other Depts',
    ]);
    this.styleHeaderRow(summaryHeaderRow);

    for (const day of days) {
      const dayLectures = weekSchedules.filter((s) => s.day === day);
      const uniqueHalls = new Set(dayLectures.map((s) => s.classroomName)).size;
      const compCount = dayLectures.filter((s) => s.departmentName.includes('Computing')).length;
      const bmCount = dayLectures.filter((s) => s.departmentName.includes('Business')).length;
      const bmsCount = dayLectures.filter((s) => s.departmentName.includes('Biomedical')).length;
      const cbeCount = dayLectures.filter((s) => s.departmentName.includes('Construction')).length;
      const lawCount = dayLectures.filter((s) => s.departmentName.includes('Law')).length;
      const nurCount = dayLectures.filter((s) => s.departmentName.includes('Nursing')).length;
      const otherCount = dayLectures.length - (compCount + bmCount + bmsCount + cbeCount + lawCount + nurCount);

      const r = summarySheet.addRow([
        day,
        dayLectures.length,
        uniqueHalls,
        compCount,
        bmCount,
        bmsCount,
        cbeCount,
        lawCount,
        nurCount,
        otherCount,
      ]);
      this.styleDataRow(r);
    }

    summarySheet.columns.forEach((col) => {
      col.width = 18;
    });

    // 2. Day-by-day Timetable Sheets
    for (const day of days) {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      const daySlots = timeSlots
        .filter((ts) => ts.type === (isWeekend ? 'weekend' : 'weekday'))
        .sort((a, b) => a.slotNumber - b.slotNumber);

      const daySheet = workbook.addWorksheet(day, {
        views: [{ showGridLines: true }],
      });

      this.applyHeader(daySheet, `BCAS COLOMBO - ${day.toUpperCase()} TIMETABLE`, [
        `Academic Week: ${week.label}`,
        `Academic Day: ${day}`,
        `Format: ${isWeekend ? 'Weekend (Block Modules)' : 'Weekday (Standard)'}`,
        `Report Generated: ${getColomboDateString()} ${getColomboTimeString()}`,
      ]);

      daySheet.addRow([]);

      // Header row: Lecture Hall | Time slots...
      const colHeaders = ['Lecture Hall / Facility', 'Category', 'Capacity'];
      daySlots.forEach((slot) => {
        colHeaders.push(slot.displayTime);
      });

      const dayHeaderRow = daySheet.addRow(colHeaders);
      this.styleHeaderRow(dayHeaderRow);

      // Rows for each classroom
      for (const cr of classrooms) {
        const rowData: string[] = [cr.name, cr.category, `${cr.capacity} seats`];

        daySlots.forEach((slot) => {
          if (slot.isBreak) {
            rowData.push('LUNCH BREAK (Non-Bookable)');
            return;
          }

          if (cr.operationalStatus !== 'Operational') {
            rowData.push(`[${cr.operationalStatus.toUpperCase()}]`);
            return;
          }

          const matched = weekSchedules.find(
            (s) =>
              s.day === day &&
              (s.classroomName === cr.name || s.classroomId === cr.id) &&
              s.timeSlotId === slot.id
          );

          if (matched) {
            rowData.push(
              `${matched.programName}\n${matched.moduleName}\nBatch: ${matched.batchName}\n${matched.lecturerName}`
            );
          } else {
            rowData.push('Available');
          }
        });

        const dataRow = daySheet.addRow(rowData);
        dataRow.height = 42; // generous height for multi-line lecture details
        this.styleDataRow(dataRow, true);
      }

      // Column widths
      daySheet.getColumn(1).width = 24;
      daySheet.getColumn(2).width = 18;
      daySheet.getColumn(3).width = 12;
      for (let i = 4; i <= colHeaders.length; i++) {
        daySheet.getColumn(i).width = 28;
      }
    }

    // Save and download workbook
    await this.triggerDownload(workbook, `BCAS_Colombo_Timetable_${week.label.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  }

  /**
   * Export single Day Timetable
   */
  static async exportDayTimetable(
    day: DayOfWeek,
    dateStr: string,
    schedules: Schedule[],
    classrooms: Classroom[],
    timeSlots: TimeSlot[]
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BCAS Colombo City Campus';

    const sheet = workbook.addWorksheet(`${day} Timetable`);
    this.applyHeader(sheet, `BCAS COLOMBO - ${day.toUpperCase()} ACADEMIC TIMETABLE`, [
      `Date: ${dateStr}`,
      `Day: ${day}`,
      `Report Generated: ${getColomboDateString()} ${getColomboTimeString()}`,
    ]);

    sheet.addRow([]);

    const isWeekend = day === 'Saturday' || day === 'Sunday';
    const daySlots = timeSlots
      .filter((ts) => ts.type === (isWeekend ? 'weekend' : 'weekday'))
      .sort((a, b) => a.slotNumber - b.slotNumber);

    const headers = ['Lecture Hall', 'Category', 'Capacity', ...daySlots.map((s) => s.displayTime)];
    const headerRow = sheet.addRow(headers);
    this.styleHeaderRow(headerRow);

    const daySchedules = schedules.filter((s) => s.date === dateStr || s.day === day);

    for (const cr of classrooms) {
      const rowData: string[] = [cr.name, cr.category, `${cr.capacity} seats`];
      daySlots.forEach((slot) => {
        if (slot.isBreak) {
          rowData.push('LUNCH BREAK');
          return;
        }
        const matched = daySchedules.find(
          (s) =>
            (s.classroomName === cr.name || s.classroomId === cr.id) &&
            s.timeSlotId === slot.id
        );
        if (matched) {
          rowData.push(`${matched.programName}\n${matched.moduleName}\n${matched.batchName}\n${matched.lecturerName}`);
        } else {
          rowData.push('Available');
        }
      });
      const dataRow = sheet.addRow(rowData);
      dataRow.height = 40;
      this.styleDataRow(dataRow, true);
    }

    sheet.getColumn(1).width = 24;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 12;
    for (let i = 4; i <= headers.length; i++) {
      sheet.getColumn(i).width = 28;
    }

    await this.triggerDownload(workbook, `BCAS_${day}_Timetable_${dateStr}.xlsx`);
  }

  /**
   * Export Lecture Hall Utilization Report
   */
  static async exportUtilizationReport(
    schedules: Schedule[],
    classrooms: Classroom[],
    timeSlots: TimeSlot[]
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BCAS Colombo City Campus';

    const sheet = workbook.addWorksheet('Hall Utilization');
    this.applyHeader(sheet, 'BCAS COLOMBO - LECTURE HALL UTILIZATION REPORT', [
      `Total Facilities: ${classrooms.length}`,
      `Total Scheduled Bookings: ${schedules.length}`,
      `Report Generated: ${getColomboDateString()} ${getColomboTimeString()}`,
    ]);

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      'Facility ID',
      'Lecture Hall Name',
      'Wing',
      'Floor',
      'Category',
      'Capacity',
      'Status',
      'Total Bookings',
      'Utilization Rate (%)',
    ]);
    this.styleHeaderRow(headerRow);

    const totalPossibleSlots = 9 * 5 + 4; // approximate slots per week

    for (const cr of classrooms) {
      const roomBookings = schedules.filter(
        (s) => s.classroomName === cr.name || s.classroomId === cr.id
      ).length;
      const rate = Math.min(100, Math.round((roomBookings / totalPossibleSlots) * 100));

      const r = sheet.addRow([
        cr.facilityId,
        cr.name,
        cr.wing || '-',
        cr.floor || '-',
        cr.category,
        cr.capacity,
        cr.operationalStatus,
        roomBookings,
        `${rate}%`,
      ]);
      this.styleDataRow(r);
    }

    sheet.columns.forEach((col) => {
      col.width = 18;
    });

    await this.triggerDownload(workbook, `BCAS_Colombo_Hall_Utilization_${getColomboDateString()}.xlsx`);
  }

  // --- Helper Methods ---

  private static applyHeader(sheet: ExcelJS.Worksheet, title: string, metadata: string[]) {
    const titleRow = sheet.addRow([title]);
    titleRow.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF102A56' } };
    sheet.mergeCells(`A1:G1`);
    titleRow.height = 28;

    metadata.forEach((meta) => {
      const metaRow = sheet.addRow([meta]);
      metaRow.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
    });
  }

  private static styleHeaderRow(row: ExcelJS.Row) {
    row.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF102A56' }, // BCAS Navy Blue
    };
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    row.height = 30;

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0D2144' } },
        bottom: { style: 'medium', color: { argb: 'FFD62828' } }, // Red accent underline
        left: { style: 'thin', color: { argb: 'FF0D2144' } },
        right: { style: 'thin', color: { argb: 'FF0D2144' } },
      };
    });
  }

  private static styleDataRow(row: ExcelJS.Row, isTimetableCell = false) {
    row.font = { name: 'Arial', size: 9 };
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (isTimetableCell && colNumber >= 4) {
        const val = String(cell.value || '');
        if (val.includes('Available')) {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF15803D' } }; // Soft green
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' },
          };
        } else if (val.includes('BREAK')) {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' }, italic: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' },
          };
        } else if (val.includes('INACTIVE') || val.includes('MAINTENANCE')) {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FFDC2626' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2F2' },
          };
        } else if (val.trim()) {
          // Occupied lecture
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF102A56' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEBF2FF' }, // Soft ice blue
          };
        }
      }
    });
  }

  private static async triggerDownload(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
