import React from 'react';
import { Classroom, Schedule, TimeSlot, Department } from '../types';
import { TodayTimetable } from './TodayTimetable';

interface CampusDigitalBoardProps {
  classrooms: Classroom[];
  schedules: Schedule[];
  timeSlots: TimeSlot[];
  departments: Department[];
  onScheduleClick?: (schedule: Schedule) => void;
  onExitBoardView?: () => void;
}

export const CampusDigitalBoard: React.FC<CampusDigitalBoardProps> = ({
  classrooms,
  schedules,
  timeSlots,
  departments,
  onScheduleClick = () => {},
  onExitBoardView,
}) => {
  return (
    <TodayTimetable
      classrooms={classrooms}
      schedules={schedules}
      timeSlots={timeSlots}
      departments={departments}
      onScheduleClick={onScheduleClick}
      onNavigateToTracker={onExitBoardView}
    />
  );
};
