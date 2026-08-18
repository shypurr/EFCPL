'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, ShieldCheck, Check } from 'lucide-react';
import { createRole, updateRole } from '@/actions/roles';

interface RoleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: { id: string; key: string; label: string; module: string }[];
  editingRole?: any;
  onSuccess: () => void;
}

export default function RoleManagerModal({
  isOpen,
  onClose,
  permissions = [],
  editingRole,
  onSuccess,
}: RoleManagerModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [colorTag, setColorTag] = useState('#3B82F6');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  const colorPresets = ['#3B82F6', '#1D9E75', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name || '');
      setColorTag(editingRole.colorTag || '#3B82F6');
      setDescription(editingRole.description || '');
      setIsDefault(editingRole.isDefault || false);
      setSelectedPermIds(editingRole.rolePermissions?.map((rp: any) => rp.permissionId) || []);
    } else {
      setName('');
      setColorTag('#3B82F6');
      setDescription('');
      setIsDefault(false);
      setSelectedPermIds([]);
    }
  }, [editingRole, isOpen]);

  if (!isOpen) return null;

  // Group permissions by Module
  const groupedPerms = (permissions || []).reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = [];
    acc[curr.module].push(curr);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const togglePerm = (id: string) => {
    if (selectedPermIds.includes(id)) {
      setSelectedPermIds(selectedPermIds.filter((p) => p !== id));
    } else {
      setSelectedPermIds([...selectedPermIds, id]);
    }
  };

  const selectAllModule = (modulePerms: typeof permissions) => {
    const ids = modulePerms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermIds.includes(id));
    if (allSelected) {
      setSelectedPermIds(selectedPermIds.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermIds(Array.from(new Set([...selectedPermIds, ...ids])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Please provide a Role Name');
      return;
    }

    setLoading(true);
    let res;
    if (editingRole) {
      res = await updateRole(editingRole.id, {
        name,
        colorTag,
        description,
        permissionKeys: selectedPermIds,
      });
    } else {
      res = await createRole({
        name,
        colorTag,
        description,
        permissionKeys: selectedPermIds,
      });
    }
    setLoading(false);

    if (res.success) {
      alert(`✅ Role "${name}" saved successfully!`);
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">
              {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Custom Role (Discord-Style)'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Role Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-semibold"
                placeholder="e.g. Quality Inspector, Store Supervisor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Role Color Tag (Discord Style)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-9 h-9 p-0.5 border border-[#2A3F66] rounded-lg cursor-pointer bg-[#162440]"
                  value={colorTag}
                  onChange={(e) => setColorTag(e.target.value)}
                />
                <div className="flex gap-1">
                  {colorPresets.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColorTag(c)}
                      className="w-6 h-6 rounded-full border border-slate-700 transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
            <input
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="e.g. Responsible for quality testing and CoA approvals"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* DEFAULT PERMISSIONS TEMPLATE TOGGLE */}
          <div className="bg-[#162440] border border-[#2A3F66] p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                Save Selected Authorities as Default Role Template
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                When admins assign this role to new staff, they can apply these authorities automatically.
              </p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 accent-red-500 rounded cursor-pointer"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
          </div>

          {/* PERMISSIONS CHECKBOX GRID GROUPED BY MODULE */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Decide Authorities & Privileges for this Role ({selectedPermIds.length} Selected)
            </h4>

            {Object.keys(groupedPerms).map((mod) => (
              <div key={mod} className="border border-[#1E2F4A] rounded-xl p-3 bg-[#162440]/40">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E2F4A]">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{mod}</span>
                  <button
                    type="button"
                    onClick={() => selectAllModule(groupedPerms[mod])}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Select All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {groupedPerms[mod].map((perm) => {
                    const isChecked = selectedPermIds.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        onClick={() => togglePerm(perm.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-red-500/15 border-red-500/40 text-white font-semibold'
                            : 'bg-[#162440] border-[#2A3F66] text-slate-300 hover:bg-[#1E2F4A]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-red-500 border-red-500 text-white' : 'border-[#2A3F66] bg-[#0D1B2E]'
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
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving Role...' : 'Save Custom Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
