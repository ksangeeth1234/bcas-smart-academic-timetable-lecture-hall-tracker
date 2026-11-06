import React, { useState } from 'react';
import {
  Classroom,
  Schedule,
  Department,
  Lecturer,
  AcademicWeek,
  ActivityLog,
} from '../types';
import {
  getColomboDateString,
  getColomboDayOfWeek,
  getColomboHourMinute,
} from '../utils/colomboTime';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DoorClosed,
  Calendar,
  CheckCircle,
  Flame,
  Building2,
  Users,
  Activity,
  ArrowUpRight,
  UserPlus,
} from 'lucide-react';
import { AddLecturerModal } from './AddLecturerModal';

interface AdminDashboardProps {
  classrooms: Classroom[];
  schedules: Schedule[];
  departments: Department[];
  lecturers: Lecturer[];
  currentWeek: AcademicWeek;
  activityLogs: ActivityLog[];
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  classrooms,
  schedules,
  departments,
  lecturers,
  currentWeek,
  activityLogs,
  onNavigate,
}) => {
  const [isAddLecturerOpen, setIsAddLecturerOpen] = useState(false);
  const todayStr = getColomboDateString();
  const currentDay = getColomboDayOfWeek();
  const currentHM = getColomboHourMinute();

  const todaySchedules = schedules.filter((s) => s.date === todayStr || s.day === currentDay);
  const weekSchedules = schedules.filter((s) => s.academicWeekId === currentWeek.id);

  // Real-time occupied halls right now
  const occupiedHallsNow = classrooms.filter((cr) => {
    return (
      cr.operationalStatus === 'Operational' &&
      todaySchedules.some(
        (s) =>
          (s.classroomName === cr.name || s.classroomId === cr.id) &&
          currentHM >= s.startTime &&
          currentHM < s.endTime
      )
    );
  }).length;

  const availableHallsNow = classrooms.filter((cr) => {
    return (
      cr.operationalStatus === 'Operational' &&
      !todaySchedules.some(
        (s) =>
          (s.classroomName === cr.name || s.classroomId === cr.id) &&
          currentHM >= s.startTime &&
          currentHM < s.endTime
      )
    );
  }).length;

  // 1. Chart Data: Weekly Day Distribution
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayDistribution = days.map((d) => ({
    name: d.slice(0, 3),
    fullName: d,
    lectures: weekSchedules.filter((s) => s.day === d).length,
  }));

  // 2. Chart Data: Department Distribution
  const deptDistribution = departments
    .map((d) => {
      const count = schedules.filter((s) => s.departmentName === d.name).length;
      return {
        name: d.code,
        fullName: d.name,
        value: count,
        color: d.color || '#2563EB',
      };
    })
    .filter((d) => d.value > 0);

  // 3. Chart Data: Top Classrooms
  const roomUsageMap: Record<string, number> = {};
  schedules.forEach((s) => {
    roomUsageMap[s.classroomName] = (roomUsageMap[s.classroomName] || 0) + 1;
  });
  const topRooms = Object.entries(roomUsageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({ name, count }));

  // 4. Chart Data: Top Lecturers
  const lecturerMap: Record<string, number> = {};
  schedules.forEach((s) => {
    const shortName = s.lecturerName.split('(')[0].trim();
    lecturerMap[shortName] = (lecturerMap[shortName] || 0) + 1;
  });
  const topLecturers = Object.entries(lecturerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      {/* Welcome & Context Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Administrative Scheduling Command Center
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#102A56] font-bold">
              {currentWeek.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics and utilization metrics for BCAS Colombo City Campus facilities and academic staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddLecturerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Register a new academic staff member to a department"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>+ Register Lecturer</span>
          </button>

          <button
            onClick={() => onNavigate('grid')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#102A56] hover:bg-[#1D4E89] text-white text-xs font-bold transition shadow-xs"
          >
            <span>Open Timetable Matrix</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (7 key indicators) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Classrooms */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <DoorClosed className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{classrooms.length}</div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Classrooms</div>
        </div>

        {/* Total Scheduled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{schedules.length}</div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Lectures</div>
        </div>

        {/* Today's Lectures */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{todaySchedules.length}</div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Today&apos;s Lectures</div>
        </div>

        {/* Occupied Now */}
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs bg-red-50/20">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-[#D62828] flex items-center justify-center mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D62828] animate-ping" />
          </div>
          <div className="text-2xl font-black text-red-700">{occupiedHallsNow}</div>
          <div className="text-[11px] font-bold text-red-800 uppercase">Occupied Now</div>
        </div>

        {/* Available Now */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{availableHallsNow}</div>
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Available Now</div>
        </div>

        {/* Total Departments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{departments.length}</div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Departments</div>
        </div>

        {/* Academic Staff */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{lecturers.length}</div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Staff (94)</div>
        </div>
      </div>

      {/* Analytics Charts (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Weekly Lecture Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Weekly Lecture Distribution (Day-wise)
            </h3>
            <span className="text-[10px] text-slate-400">Current Week</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val ?? 0} Lectures`, 'Scheduled']}
                  labelFormatter={(name: any) => `Day: ${name}`}
                />
                <Bar dataKey="lectures" fill="#102A56" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department-wise Lecture Share */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Department-wise Academic Workload
            </h3>
            <span className="text-[10px] text-slate-400">Total Bookings</span>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={38}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {deptDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, _name: any, props: any) => [value, props?.payload?.fullName || '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top Utilized Classrooms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Top Utilized Lecture Halls
            </h3>
            <span className="text-[10px] text-slate-400">Booking Frequency</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRooms} layout="vertical" margin={{ top: 5, right: 20, left: 25, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={75} />
                <Tooltip />
                <Bar dataKey="count" fill="#1D4E89" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top Scheduled Lecturers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Academic Staff Teaching Allocations
            </h3>
            <span className="text-[10px] text-slate-400">Lectures Assigned</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLecturers} layout="vertical" margin={{ top: 5, right: 20, left: 35, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#D62828" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Trail */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent System Activity Audit Trail</h3>
          </div>
          <span className="text-xs text-slate-400">Live synchronization</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">No recent activity logged yet.</p>
          ) : (
            activityLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {log.entityType}
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium">by {log.username} ({log.userRole})</span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{log.details}</div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddLecturerModal
        isOpen={isAddLecturerOpen}
        onClose={() => setIsAddLecturerOpen(false)}
        departments={departments}
        existingLecturers={lecturers}
      />
    </div>
  );
};
