'use client';

import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, Check, Info } from 'lucide-react';
import { createStaffUser } from '@/actions/auth';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: any[];
  permissions: { id: string; key: string; label: string; module: string }[];
  onSuccess: () => void;
}

export default function UserManagerModal({
  isOpen,
  onClose,
  roles = [],
  permissions = [],
  onSuccess,
}: UserManagerModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || '');
  const [useDefaultPermissions, setUseDefaultPermissions] = useState(true);
  const [manualPermIds, setManualPermIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const selectedRole = roles.find((r) => r.id === roleId);

  // Derive generated username preview
  const derivedUsername = email ? email.toLowerCase().trim().split('@')[0].replace(/[^a-z0-9_]/g, '') || 'staff' : 'staff';

  // Group permissions by Module
  const groupedPerms = (permissions || []).reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const togglePerm = (id: string) => {
    if (manualPermIds.includes(id)) {
      setManualPermIds(manualPermIds.filter((p) => p !== id));
    } else {
      setManualPermIds([...manualPermIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !roleId) {
      alert('Please fill in required fields (Name, Email, Role)');
      return;
    }

    setLoading(true);
    const username = email.includes('@') ? email.split('@')[0] : email;
    const res = await createStaffUser({
      username,
      name,
      password: 'user123',
      roleId: roleId || undefined,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Staff User "${name}" created successfully! Default password is "user123"`);
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + (res.error || 'Failed to create user'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-white">Create New Staff User</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Staff Member Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-semibold"
                placeholder="e.g. Suresh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Staff Email Address *</label>
              <input
                type="email"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="suresh@efcpl.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {email && (
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Auto-assigned Username: <span className="font-bold text-emerald-400">@{derivedUsername}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Assigned Role *</label>
            <select
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-semibold"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#162440] text-white">
                  {r.name} {r.isSystemAdmin ? '(System Admin)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* INFO BOX REGARDING FIRST-TIME PASSWORD SETUP */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300 font-medium">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">First-Time Login Setup</div>
              <p className="text-[11px] text-emerald-200/80 font-normal mt-0.5">
                Staff member will log in with email or username (@{derivedUsername}) and default password: <code className="bg-[#162440] px-1.5 py-0.5 rounded text-white font-mono">user123</code>.
              </p>
            </div>
          </div>

          {/* PERMISSION SELECTION MODE */}
          <div className="bg-[#162440] border border-[#2A3F66] p-4 rounded-xl space-y-2">
            <label className="text-xs font-bold text-white block mb-1">
              Permission Model for this Staff Member
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label
                onClick={() => setUseDefaultPermissions(true)}
                className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                  useDefaultPermissions
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white font-semibold'
                    : 'bg-[#0D1B2E] border-[#2A3F66] text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="permMode"
                  checked={useDefaultPermissions}
                  onChange={() => setUseDefaultPermissions(true)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Use Role Default Authorities
                  </div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Inherit standard permissions defined for "{selectedRole?.name || 'this role'}".
                  </p>
                </div>
              </label>

              <label
                onClick={() => setUseDefaultPermissions(false)}
                className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                  !useDefaultPermissions
                    ? 'bg-blue-500/15 border-blue-500/40 text-white font-semibold'
                    : 'bg-[#0D1B2E] border-[#2A3F66] text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="permMode"
                  checked={!useDefaultPermissions}
                  onChange={() => setUseDefaultPermissions(false)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold">Customize Manual Authorities</div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                    Manually pick specific privileges for this user.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* MANUAL PERMISSION CHECKBOXES */}
          {!useDefaultPermissions && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Specific Authorities ({manualPermIds.length} Selected)
              </h4>

              {Object.keys(groupedPerms).map((mod) => (
                <div key={mod} className="border border-[#1E2F4A] rounded-xl p-3 bg-[#162440]/40">
                  <span className="text-xs font-bold text-white block mb-2 uppercase tracking-wider">{mod}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {groupedPerms[mod].map((perm) => {
                      const isChecked = manualPermIds.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          onClick={() => togglePerm(perm.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-white font-semibold'
                              : 'bg-[#162440] border-[#2A3F66] text-slate-300 hover:bg-[#1E2F4A]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-[#2A3F66] bg-[#0D1B2E]'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[#1E2F4A] flex justify-end gap-2 sticky bottom-0 bg-[#0D1B2E] py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Staff User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
