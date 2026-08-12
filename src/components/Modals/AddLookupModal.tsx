'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createSystemLookup } from '@/actions/lookups';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLookupModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    group: 'UNIT',
    code: '',
    label: '',
    sortOrder: '10',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.label) {
      alert('Please fill in required fields (Code, Label)');
      return;
    }

    setLoading(true);
    const res = await createSystemLookup({
      group: formData.group,
      code: formData.code.trim(),
      label: formData.label.trim(),
      sortOrder: Number(formData.sortOrder) || 10,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ New ${formData.group} option added successfully!`);
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-slate-900">⚙️ Add Dynamic Master Lookup Option</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Lookup Category / Type *</label>
            <select
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
            >
              <option value="UNIT">Unit Type (e.g. KG, LTR, Cartons, Drums)</option>
              <option value="PACKAGING_TYPE">Packaging Type (e.g. Bottle, Tray, Pouch)</option>
              <option value="TEMP_CONDITION">Storage Temp Spec (e.g. -18°C Deep Frozen)</option>
              <option value="COA_STATUS">CoA Status Tag (e.g. Approved, Pending)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Code / Value *</label>
            <input
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. DRUM or BARREL"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Display Label *</label>
            <input
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. 200L Steel Drum"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Sort Order</label>
            <input
              type="number"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-2xs"
            >
              {loading ? 'Saving...' : 'Add Dynamic Option'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
