import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, X, ShieldCheck, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Verifying credentials...');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLoadingMessage('Verifying credentials with BCAS Campus Directory...');

    // Small delay to allow user to visually appreciate the institutional authentication loader
    const timer = setTimeout(() => {
      setLoadingMessage('Authenticating session & synchronizing permissions...');
    }, 450);

    const res = await login(username, password);
    clearTimeout(timer);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-1.5 rounded-full hover:bg-white/10 transition disabled:opacity-40"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-[#102A56] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-blue-500/10 to-transparent pointer-events-none" />

          <div className="w-12 h-12 bg-white/10 backdrop-blur-xs rounded-2xl mx-auto flex items-center justify-center mb-3 border border-white/20 shadow-inner">
            <Lock className="w-6 h-6 text-amber-300" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">BCAS Campus Portal</h3>
          <p className="text-xs text-blue-200 mt-1">
            Colombo City Campus Timetable Management System
          </p>
        </div>

        {/* Modal Body with Institutional Loading State Overlay */}
        <div className="p-6 relative">
          {/* Animated Institutional Loader Overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
              <div className="relative mb-4">
                {/* Outer spinning ring */}
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[#102A56] border-r-amber-400 animate-spin" />
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#102A56]" />
                </div>
              </div>

              <h4 className="text-sm font-black text-slate-900 tracking-tight">
                Authenticating Session
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs animate-pulse">
                {loadingMessage}
              </p>

              {/* Animated Progress Bar */}
              <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                <div className="w-full h-full bg-gradient-to-r from-[#102A56] via-blue-600 to-amber-400 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  disabled={loading}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102A56] focus:border-transparent font-medium disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102A56] focus:border-transparent font-medium disabled:bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#102A56] hover:bg-[#1D4E89] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
