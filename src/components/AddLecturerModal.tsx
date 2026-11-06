import React, { useState, useEffect } from 'react';
import { Department, Lecturer } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, CheckCircle2, AlertCircle, Building2, Briefcase, Mail, Phone, Tag } from 'lucide-react';

interface AddLecturerModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  existingLecturers: Lecturer[];
  onLecturerAdded?: (newLecturer: Lecturer) => void;
  preselectedDepartment?: string;
}

export const AddLecturerModal: React.FC<AddLecturerModalProps> = ({
  isOpen,
  onClose,
  departments,
  existingLecturers,
  onLecturerAdded,
  preselectedDepartment,
}) => {
  const { currentUser } = useAuth();

  const [staffCode, setStaffCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('Lecturer');
  const [facultyType, setFacultyType] = useState<'Permanent' | 'Visiting' | 'Contract'>('Permanent');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute next suggested staff code on open
  useEffect(() => {
    if (isOpen) {
      let maxNum = 0;
      for (const lec of existingLecturers) {
        const match = lec.staffCode?.match(/LEC(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum > 0 ? maxNum + 1 : existingLecturers.length + 1;
      const suggestedCode = `LEC${nextNum.toString().padStart(4, '0')}`;
      
      setStaffCode(suggestedCode);
      setName('');
      setDepartment(preselectedDepartment || departments[0]?.name || 'Computing & Software Engineering');
      setDesignation('Lecturer');
      setFacultyType('Permanent');
      setStatus('Active');
      setEmail('');
      setPhone('');
      setError(null);
    }
  }, [isOpen, existingLecturers, departments, preselectedDepartment]);

  // Auto-fill suggested email based on code
  const handleCodeChange = (newCode: string) => {
    setStaffCode(newCode);
    if (!email || email.includes('@bcas.campus.lk')) {
      const clean = newCode.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (clean) {
        setEmail(`${clean}@bcas.campus.lk`);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedCode = staffCode.trim().toUpperCase();

    if (!trimmedName) {
      setError('Please provide the full name of the academic staff member.');
      return;
    }

    if (!trimmedCode) {
      setError('Please provide a unique staff code (e.g. LEC0095).');
      return;
    }

    if (!department) {
      setError('Please select an academic department.');
      return;
    }

    // Check duplicate staff code
    const existingCode = existingLecturers.find(
      (l) => l.staffCode?.toUpperCase() === trimmedCode
    );
    if (existingCode) {
      setError(`Staff code "${trimmedCode}" is already assigned to "${existingCode.name}". Please choose a distinct code.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newLecturerPayload: Omit<Lecturer, 'id'> = {
        staffCode: trimmedCode,
        name: trimmedName,
        department,
        designation,
        facultyType,
        status,
        email: email.trim() || `${trimmedCode.toLowerCase()}@bcas.campus.lk`,
        phone: phone.trim() || undefined,
      };

      const docId = await DataService.addLecturer(
        newLecturerPayload,
        currentUser?.username || 'admin',
        currentUser?.role || 'admin'
      );

      const createdLecturer: Lecturer = {
        id: docId,
        ...newLecturerPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onLecturerAdded) {
        onLecturerAdded(createdLecturer);
      }

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register lecturer in Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-[#102A56] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add New Academic Lecturer</h3>
              <p className="text-xs text-blue-200">
                Register a new lecturer to a BCAS Colombo department
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Lecturer Name & Staff Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name with Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mr. M. I. M. Anis or Dr. Nuwan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56] font-medium"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Staff Code <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. LEC0095"
                value={staffCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56] font-mono font-bold uppercase"
              />
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Academic Department <span className="text-red-500">*</span></span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56] font-medium"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Designation & Faculty Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>Designation <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                list="designations-list"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
                placeholder="e.g. Lecturer"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56]"
              />
              <datalist id="designations-list">
                <option value="Lecturer" />
                <option value="Senior Lecturer" />
                <option value="Head of Department (HOD)" />
                <option value="Visiting Lecturer" />
                <option value="Senior Assistant Lecturer" />
                <option value="Assistant Lecturer" />
                <option value="Professor" />
                <option value="Demonstrator" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Contract Type
              </label>
              <select
                value={facultyType}
                onChange={(e) => setFacultyType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56]"
              >
                <option value="Permanent">Permanent Faculty</option>
                <option value="Visiting">Visiting Faculty</option>
                <option value="Contract">Contract Faculty</option>
              </select>
            </div>
          </div>

          {/* Email & Phone Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Institutional Email</span>
              </label>
              <input
                type="email"
                placeholder="e.g. lec0095@bcas.campus.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Contact Phone (Optional)</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. +94 77 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#102A56]"
              />
            </div>
          </div>

          {/* Operational Status */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800">Lecturer Timetable Status</span>
              <p className="text-[11px] text-slate-500">
                Active staff members appear immediately in schedule booking selectors.
              </p>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-bold text-slate-800"
            >
              <option value="Active">Active (Available)</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#102A56] hover:bg-[#1D4E89] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Registering Staff...' : 'Add Lecturer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
