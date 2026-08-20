'use client';

import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0D1B2E] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#1E2F4A] text-white animate-in fade-in zoom-in duration-150">
        <div className="p-4 sm:p-5 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">Add Master Lookup Option</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162440] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Lookup Category / Type *</label>
            <select
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-medium transition-all"
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Code / Value *</label>
            <input
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all font-mono"
              placeholder="e.g. DRUM or BARREL"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Display Label *</label>
            <input
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
              placeholder="e.g. 200L Steel Drum"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Sort Order</label>
            <input
              type="number"
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-[#1E2F4A] flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#1D9E75] hover:bg-[#168361] rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Dynamic Option'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
