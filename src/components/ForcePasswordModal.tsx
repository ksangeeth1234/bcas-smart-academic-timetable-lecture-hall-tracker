import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export const ForcePasswordModal: React.FC = () => {
  const { currentUser, mustChangePassword, updatePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!currentUser || !mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword === 'asdf@#1234' || newPassword === 'asdf@#123456') {
      setError('New password cannot be the same as the bootstrap default password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    const ok = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (ok) {
      setSuccess(true);
    } else {
      setError('Failed to update password in Firestore. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#102A56] p-6 text-white text-center relative">
          <div className="w-12 h-12 bg-amber-400 text-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Mandatory Security Update</h3>
          <p className="text-xs text-blue-200 mt-1">
            Welcome, <strong>{currentUser.displayName}</strong> ({currentUser.username})
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Default bootstrap password detected</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            For institution security compliance, BCAS policy mandates that both initial bootstrap accounts change their temporary default passwords upon first login before accessing timetable management tools.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Password Successfully Changed!</h4>
              <p className="text-xs text-slate-500">
                You now have full access to the BCAS Timetable administration dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Strong Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102A56] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#102A56] focus:border-transparent"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#102A56] hover:bg-[#1D4E89] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
