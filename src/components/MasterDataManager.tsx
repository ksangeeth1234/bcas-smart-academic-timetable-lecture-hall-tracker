import React, { useState } from 'react';
import {
  Department,
  Lecturer,
  Classroom,
  Program,
  Batch,
  Module,
  TimeSlot,
  ActivityLog,
  UserProfile,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../services/dataService';
import {
  ShieldCheck,
  Users,
  Building2,
  DoorOpen,
  BookOpen,
  Clock,
  Activity,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  KeyRound,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserPlus,
} from 'lucide-react';

interface MasterDataManagerProps {
  departments: Department[];
  lecturers: Lecturer[];
  classrooms: Classroom[];
  programs: Program[];
  batches: Batch[];
  modules: Module[];
  timeSlots: TimeSlot[];
  activityLogs: ActivityLog[];
  sundayEnabled: boolean;
  onToggleSunday: (enabled: boolean) => void;
  onRefreshData: () => void;
}

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  departments,
  lecturers,
  classrooms,
  programs,
  batches,
  modules,
  timeSlots,
  activityLogs,
  sundayEnabled,
  onToggleSunday,
  onRefreshData,
}) => {
  const { allUsers, currentUser, createUser, toggleUserStatus, deleteUser, resetUserPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'users' | 'staff' | 'classrooms' | 'departments' | 'programs' | 'slots' | 'logs'
  >('users');

  // Sub-search filters
  const [searchQuery, setSearchQuery] = useState('');

  // Add User Form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'superadmin' | 'viewer'>('admin');
  const [userError, setUserError] = useState<string | null>(null);

  // Add Lecturer Form state
  const [showAddLecturer, setShowAddLecturer] = useState(false);
  const [lecCode, setLecCode] = useState(`LEC00${lecturers.length + 1}`);
  const [lecName, setLecName] = useState('');
  const [lecDept, setLecDept] = useState(departments[0]?.name || 'Computing');
  const [lecDesig, setLecDesig] = useState('Lecturer');
  const [lecFaculty, setLecFaculty] = useState<'Permanent' | 'Visiting' | 'Contract'>('Permanent');
  const [lecEmail, setLecEmail] = useState('');

  // Add Classroom Form state
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [roomCategory, setRoomCategory] = useState<'Lecture Hall' | 'Computer Lab' | 'Science Lab' | 'Specialized Facility' | 'Auditorium'>('Lecture Hall');
  const [roomCap, setRoomCap] = useState(60);
  const [roomWing, setRoomWing] = useState('West Wing');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    const res = await createUser({
      username: newUsername,
      displayName: newDisplayName,
      email: newEmail,
      role: newRole,
    });
    if (res.success) {
      setShowAddUser(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewEmail('');
    } else {
      setUserError(res.error || 'Failed to create user');
    }
  };

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.addLecturer(
      {
        staffCode: lecCode,
        name: lecName,
        department: lecDept,
        designation: lecDesig,
        facultyType: lecFaculty,
        status: 'Active',
        email: lecEmail || `${lecCode.toLowerCase()}@bcas.campus.lk`,
      },
      currentUser?.username || 'superadmin',
      currentUser?.role || 'superadmin'
    );
    setShowAddLecturer(false);
    setLecName('');
    onRefreshData();
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.addClassroom(
      {
        name: roomName,
        facilityId: facilityId || roomName,
        category: roomCategory,
        capacity: Number(roomCap),
        operationalStatus: 'Operational',
        wing: roomWing,
      },
      currentUser?.username || 'superadmin',
      currentUser?.role || 'superadmin'
    );
    setShowAddRoom(false);
    setRoomName('');
    setFacilityId('');
    onRefreshData();
  };

  const toggleLecturerStatus = async (lec: Lecturer) => {
    const newStatus = lec.status === 'Active' ? 'Inactive' : 'Active';
    await DataService.updateLecturer(
      lec.id,
      { status: newStatus },
      currentUser?.username || 'superadmin',
      currentUser?.role || 'superadmin'
    );
    onRefreshData();
  };

  const toggleClassroomStatus = async (cr: Classroom) => {
    const nextStatus =
      cr.operationalStatus === 'Operational'
        ? 'Maintenance'
        : cr.operationalStatus === 'Maintenance'
        ? 'Inactive'
        : 'Operational';

    await DataService.updateClassroom(
      cr.id,
      { operationalStatus: nextStatus },
      currentUser?.username || 'superadmin',
      currentUser?.role || 'superadmin'
    );
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#D62828]" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Super Administrator Master Data Control
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional directories: Staff members (94), Classrooms (39), Departments (11), Programs, and Admin User accounts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeTab === 'users' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Admin Users ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeTab === 'staff' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Academic Staff ({lecturers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classrooms')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeTab === 'classrooms' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:bg-white/60'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span>Classrooms ({classrooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeTab === 'departments' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:bg-white/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('programs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeTab === 'programs' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Programs &amp; Batches</span>
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeTab === 'slots' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:bg-white/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Time Slot Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
            activeTab === 'logs' ? 'bg-[#102A56] text-white shadow-xs' : 'hover:bg-white/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Activity Logs</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Administrative Accounts</h3>
              <p className="text-xs text-slate-500">
                Super Admin can create, deactivate, and reset passwords for campus administrators.
              </p>
            </div>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#102A56] text-white text-xs font-bold hover:bg-[#1D4E89] transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin</span>
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase">New Administrator Provisioning</h4>
              {userError && <div className="text-xs text-red-600">{userError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jameel_admin"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Jameel"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jameel@bcas.campus.lk"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'superadmin' | 'viewer')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="viewer">Viewer (Lobby TV Display Only)</option>
                    <option value="admin">Admin (Timetable Scheduler)</option>
                    <option value="superadmin">Super Admin (Full Privileges)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-bold"
                >
                  Save Account
                </button>
              </div>
            </form>
          )}

          {/* User List */}
          <div className="divide-y divide-slate-100">
            {allUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{u.displayName}</span>
                    <span className="text-[10px] font-mono text-slate-500">(@{u.username})</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.role === 'superadmin'
                          ? 'bg-amber-100 text-amber-800'
                          : u.role === 'viewer'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {u.role}
                    </span>
                    {!u.active && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {u.email} · Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {u.username !== 'superadmin' && (
                    <>
                      <button
                        onClick={() => toggleUserStatus(u.id, !u.active)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold"
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => resetUserPassword(u.id)}
                        className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                        title="Reset to default password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {u.username === 'superadmin' && (
                    <span className="text-[10px] text-slate-400 font-semibold italic">Primary Root</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC STAFF (94 members) */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Staff Directory (94 Members)</h3>
              <p className="text-xs text-slate-500">
                Imported directly from BCAS Colombo Staff Directory. Active staff appear in timetable selectors.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search staff code, name, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs w-56"
              />
              <button
                onClick={() => setShowAddLecturer(!showAddLecturer)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A56] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lecturer</span>
              </button>
            </div>
          </div>

          {showAddLecturer && (
            <form onSubmit={handleCreateLecturer} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase">Register New Academic Staff</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff Code</label>
                  <input
                    type="text"
                    required
                    value={lecCode}
                    onChange={(e) => setLecCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. M. I. M. Anis"
                    value={lecName}
                    onChange={(e) => setLecName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={lecDept}
                    onChange={(e) => setLecDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={lecDesig}
                    onChange={(e) => setLecDesig(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLecturer(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-bold">
                  Save Staff Member
                </button>
              </div>
            </form>
          )}

          {/* Lecturer Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">Staff Code</th>
                  <th className="p-2.5">Lecturer Name</th>
                  <th className="p-2.5">Department</th>
                  <th className="p-2.5">Designation</th>
                  <th className="p-2.5">Faculty</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lecturers
                  .filter(
                    (l) =>
                      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      l.staffCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      l.department.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-mono font-bold text-blue-900">{l.staffCode}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{l.name}</td>
                      <td className="p-2.5 text-slate-600">{l.department}</td>
                      <td className="p-2.5 text-slate-600">{l.designation}</td>
                      <td className="p-2.5 text-slate-500">{l.facultyType}</td>
                      <td className="p-2.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            l.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => toggleLecturerStatus(l)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {l.status === 'Active' ? 'Set Inactive' : 'Set Active'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CLASSROOMS (39 facilities) */}
      {activeTab === 'classrooms' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lecture Halls &amp; Facilities (39 Rooms)</h3>
              <p className="text-xs text-slate-500">
                All West Wing, East Wing, Tech Wing, Computing Labs, and Science Facilities.
              </p>
            </div>
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A56] text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Facility</span>
            </button>
          </div>

          {showAddRoom && (
            <form onSubmit={handleCreateClassroom} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase">Create New Facility</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Room Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WEST 011"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={roomCategory}
                    onChange={(e) => setRoomCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Science Lab">Science Lab</option>
                    <option value="Specialized Facility">Specialized Facility</option>
                    <option value="Auditorium">Auditorium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={roomCap}
                    onChange={(e) => setRoomCap(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Wing</label>
                  <select
                    value={roomWing}
                    onChange={(e) => setRoomWing(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="West Wing">West Wing</option>
                    <option value="East Wing">East Wing</option>
                    <option value="Tech Wing">Tech Wing</option>
                    <option value="Main Building">Main Building</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoom(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#102A56] text-white text-xs font-bold">
                  Save Facility
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">Facility ID</th>
                  <th className="p-2.5">Classroom Name</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Capacity</th>
                  <th className="p-2.5">Wing / Location</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Toggle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classrooms.map((cr) => (
                  <tr key={cr.id} className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-mono font-bold text-slate-700">{cr.facilityId}</td>
                    <td className="p-2.5 font-bold text-slate-900">{cr.name}</td>
                    <td className="p-2.5 text-slate-600">{cr.category}</td>
                    <td className="p-2.5 text-slate-600">{cr.capacity} seats</td>
                    <td className="p-2.5 text-slate-500">{cr.wing} ({cr.floor})</td>
                    <td className="p-2.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          cr.operationalStatus === 'Operational'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cr.operationalStatus === 'Maintenance'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {cr.operationalStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => toggleClassroomStatus(cr)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENTS (11) */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">BCAS Academic Departments (11 Faculties)</h3>
            <p className="text-xs text-slate-500">Authoritative academic departments from BCAS Colombo directory.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-[#102A56]">
                    {d.code}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{d.description}</p>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  Head: <strong className="text-slate-800">{d.headOfDepartment}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROGRAMS & BATCHES */}
      {activeTab === 'programs' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900">Degree &amp; Higher Diploma Programs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {programs.map((p) => (
                <div key={p.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Code: {p.code} · {p.duration}</div>
                  <div className="text-[11px] text-blue-700 font-medium mt-1">Dept: {p.departmentName}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Registered Student Batches</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {batches.map((b) => (
                <div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="font-bold text-slate-900">{b.name}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{b.programName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Year: {b.academicYear} · {b.studentCount} students</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TIME SLOTS */}
      {activeTab === 'slots' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Time Slot Specifications</h3>
            <p className="text-xs text-slate-500">
              Weekday 9-Slot schedule and Weekend 4-Slot schedule (Saturday and Sunday share identical weekend slots).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm">Sunday Academic Operations</div>
              <p className="text-xs text-slate-500">
                Active in timetable matrix using the identical weekend slot format as Saturday (08:00 AM – 05:00 PM).
              </p>
            </div>
            <button
              onClick={() => onToggleSunday(!sundayEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                sundayEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {sundayEnabled ? 'Sunday Active' : 'Sunday Inactive'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Weekday Time Slots (Monday – Friday)
              </h4>
              <div className="space-y-2 text-xs">
                {timeSlots
                  .filter((ts) => ts.type === 'weekday')
                  .map((ts) => (
                    <div key={ts.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between font-mono">
                      <span>Slot #{ts.slotNumber}: {ts.label}</span>
                      <span className="text-slate-400 font-sans">{ts.startTime} - {ts.endTime}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Weekend Time Slots (Saturday &amp; Sunday)
              </h4>
              <div className="space-y-2 text-xs">
                {timeSlots
                  .filter((ts) => ts.type === 'weekend')
                  .map((ts) => (
                    <div
                      key={ts.id}
                      className={`p-2.5 rounded-lg border font-mono flex justify-between ${
                        ts.isBreak ? 'bg-amber-50 border-amber-200 text-amber-900 italic' : 'bg-white border-slate-200'
                      }`}
                    >
                      <span>{ts.label}</span>
                      <span className="text-slate-400 font-sans">{ts.isBreak ? 'Non-bookable Break' : `${ts.startTime} - ${ts.endTime}`}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Administrative Audit Activity Logs</h3>
            <p className="text-xs text-slate-500">Chronological history of all admin timetable changes and master records.</p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200">{log.entityType}</span>
                    <span className="text-blue-600 font-semibold">{log.username} ({log.userRole})</span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{log.details}</div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
