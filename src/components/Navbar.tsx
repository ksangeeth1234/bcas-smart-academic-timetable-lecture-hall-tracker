import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LiveClock } from './LiveClock';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Calendar,
  Layers,
  LayoutDashboard,
  Copy,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Compass,
  Activity,
  Users,
  Tv,
  UserPlus,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
  onOpenExcelExport: () => void;
  onOpenPrint: () => void;
  onOpenAddLecturer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenLogin,
  onOpenExcelExport,
  onOpenPrint,
  onOpenAddLecturer,
}) => {
  const { currentUser, role, isSuperAdmin, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const logoUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_vg_vDQDD_PZfMsdp6_TpUpq3Ze0QoKCUx_vNrId9hw6JUkrLtynoT1XX&s=10';

  const handleNav = (v: string) => {
    onNavigate(v);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#102A56] text-white shadow-md border-b border-[#1D4E89]">
      {/* Top institutional strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Campus Title */}
          <div
            className="flex items-center gap-3.5 cursor-pointer select-none"
            onClick={() => handleNav('today')}
          >
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-slate-200">
              {!logoError ? (
                <img
                  src={logoUrl}
                  alt="BCAS Logo"
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-[#102A56] rounded-lg flex items-center justify-center font-black text-white text-xs">
                  BCAS
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide text-white">BCAS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#D62828] text-white">
                  Colombo
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium hidden sm:block">
                Colombo City Campus · Academic Timetable &amp; Hall Tracker
              </p>
            </div>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Live Clock: Compact on mobile, full on tablet/desktop */}
            <div className="hidden sm:block">
              <LiveClock compact={false} />
            </div>
            <div className="block sm:hidden">
              <LiveClock compact={true} />
            </div>

            {/* PWA Install Button: Visible on ALL screen sizes */}
            <div>
              <PWAInstallButton compact={true} />
            </div>

            {/* User status or login button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#1D4E89] pl-2 sm:pl-3 pr-1 sm:pr-1.5 py-1 rounded-xl border border-blue-400/20">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold leading-tight text-white flex items-center gap-1.5 justify-end">
                    <span>{currentUser.displayName}</span>
                    <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                      currentUser.role === 'viewer'
                        ? 'bg-emerald-400 text-slate-900'
                        : currentUser.role === 'superadmin'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-blue-300 text-slate-900'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-200">{currentUser.username}</div>
                </div>

                <button
                  onClick={logout}
                  className="p-1 sm:p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-red-600/80 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition shadow-xs cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Portal Login</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#1D4E89] lg:hidden shrink-0"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-[#0D2144] border-t border-[#1D4E89]/60 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 text-xs">
            {/* Primary navigation items */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleNav('today')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  currentView === 'today' || currentView === 'board'
                    ? 'bg-[#1D4E89] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Today&apos;s Timetable</span>
              </button>

              <button
                onClick={() => handleNav('tracker')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  currentView === 'tracker'
                    ? 'bg-[#1D4E89] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hall Availability Tracker</span>
              </button>

              <button
                onClick={() => handleNav('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  currentView === 'grid'
                    ? 'bg-[#1D4E89] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Weekly Grid Matrix</span>
              </button>

              {isAdmin && (
                <>
                  <div className="h-4 w-px bg-slate-700 mx-1" />

                  <button
                    onClick={() => handleNav('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                      currentView === 'dashboard'
                        ? 'bg-[#1D4E89] text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Admin Dashboard</span>
                  </button>

                  <button
                    onClick={() => handleNav('copyWeek')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                      currentView === 'copyWeek'
                        ? 'bg-[#1D4E89] text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span>Copy Previous Week</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => handleNav('masterData')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                        currentView === 'masterData'
                          ? 'bg-[#1D4E89] text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                      <span>Master Data &amp; Users</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Quick Action Export & Print Tools (Admin only) */}
            {isAdmin && (
              <div className="flex items-center space-x-2">
                {onOpenAddLecturer && (
                  <button
                    onClick={onOpenAddLecturer}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer"
                    title="Add New Academic Staff Member (Admin Only)"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                    <span>+ Add Lecturer</span>
                  </button>
                )}

                <button
                  onClick={onOpenExcelExport}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold transition cursor-pointer"
                  title="Export Timetables to Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  onClick={onOpenPrint}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-semibold transition cursor-pointer"
                  title="Print Timetable / Save PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0D2144] border-t border-[#1D4E89] p-4 space-y-2 text-sm animate-in slide-in-from-top duration-150">
          <div className="pb-2 border-b border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Navigation</span>
            <PWAInstallButton />
          </div>

          <button
            onClick={() => handleNav('today')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium ${
              currentView === 'today' || currentView === 'board' ? 'bg-[#1D4E89] text-white font-bold' : 'text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Today&apos;s Timetable</span>
          </button>

          <button
            onClick={() => handleNav('tracker')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium ${
              currentView === 'tracker' ? 'bg-[#1D4E89] text-white font-bold' : 'text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Hall Availability Tracker</span>
          </button>

          <button
            onClick={() => handleNav('grid')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium ${
              currentView === 'grid' ? 'bg-[#1D4E89] text-white font-bold' : 'text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Weekly Grid Matrix</span>
          </button>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-700/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2">
                Administrative Tools
              </span>

              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium ${
                  currentView === 'dashboard' ? 'bg-[#1D4E89] text-white font-bold' : 'text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Admin Dashboard</span>
              </button>

              <button
                onClick={() => handleNav('copyWeek')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium ${
                  currentView === 'copyWeek' ? 'bg-[#1D4E89] text-white font-bold' : 'text-slate-200'
                }`}
              >
                <Copy className="w-4 h-4 text-purple-400" />
                <span>Copy Previous Week</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => handleNav('masterData')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium ${
                    currentView === 'masterData' ? 'bg-[#1D4E89] text-white font-bold' : 'text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <span>Master Data &amp; Users</span>
                </button>
              )}

              {onOpenAddLecturer && (
                <button
                  onClick={() => {
                    onOpenAddLecturer();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold text-amber-300 bg-blue-600/50 hover:bg-blue-600"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add New Lecturer</span>
                </button>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="pt-2 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => {
                  onOpenExcelExport();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => {
                  onOpenPrint();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-700 text-white font-semibold text-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print View</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
