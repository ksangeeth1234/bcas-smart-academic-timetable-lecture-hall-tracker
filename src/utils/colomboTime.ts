import dayjs from 'dayjs';
import { DayOfWeek } from '../types';

export const TIMEZONE = 'Asia/Colombo';

export function getColomboNow(): Date {
  // Convert current time to Asia/Colombo representation
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

  // Format: "MM/DD/YYYY, HH:mm:ss"
  const [datePart, timePart] = dateStr.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');

  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

export function getColomboDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts; // Returns "YYYY-MM-DD"
}

export function getColomboDayOfWeek(date = new Date()): DayOfWeek {
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
  }).format(date);
  return dayName as DayOfWeek;
}

export function getColomboTimeString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function getColomboHourMinute(date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date); // "HH:mm"
}

/**
 * Checks if a schedule is currently active right now in Colombo
 */
export function isScheduleOngoing(scheduleDate: string, startTime: string, endTime: string): boolean {
  const todayStr = getColomboDateString();
  if (scheduleDate !== todayStr) {
    return false;
  }

  const currentHM = getColomboHourMinute(); // e.g. "09:30"
  return currentHM >= startTime && currentHM < endTime;
}

/**
 * Computes remaining minutes for an ongoing schedule
 */
export function getRemainingMinutes(endTime: string): number {
  const now = getColomboNow();
  const [endH, endM] = endTime.split(':').map(Number);
  const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, 0);

  const diffMs = endDateTime.getTime() - now.getTime();
  const diffMinutes = Math.max(0, Math.ceil(diffMs / (1000 * 60)));
  return diffMinutes;
}

/**
 * Computes minutes remaining until a schedule starts
 */
export function getMinutesUntilStart(startTime: string): number {
  const now = getColomboNow();
  const [startH, startM] = startTime.split(':').map(Number);
  const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, 0);

  const diffMs = startDateTime.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  return diffMinutes;
}

export function formatTimeSlot(start: string, end: string): string {
  const to12h = (hm: string) => {
    const [h, m] = hm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
  };
  return `${to12h(start)} – ${to12h(end)}`;
}
