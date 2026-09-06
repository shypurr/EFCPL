'use client';

import React, { useState } from 'react';
import { X, PackageCheck } from 'lucide-react';
import { createFinishedGood } from '@/actions/finished-goods';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  units?: { code: string; label: string }[];
  locations?: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function AddFinishedGoodModal({
  isOpen,
  onClose,
  units = [
    { code: 'KG', label: 'Kilograms (KG)' },
    { code: 'Units', label: 'Units (PCS)' },
    { code: 'Boxes', label: 'Boxes' },
    { code: 'Jars', label: 'Jars' },
  ],
  locations = [
    { id: 'Cold Store Zone A', name: 'Cold Store Zone A' },
    { id: 'Deep Freezer 2', name: 'Deep Freezer 2' },
    { id: 'FG Bay 1', name: 'FG Bay 1' },
    { id: 'Dry Warehouse', name: 'Dry Warehouse' },
  ],
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    unit: 'KG',
    location: 'Cold Store Zone A',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sku.trim() || !formData.name.trim()) {
      alert('Please fill in required fields (Product SKU, Product Name)');
      return;
    }

    setLoading(true);
    // Catalog registration only — batch number, quantity and MFG/expiry dates are
    // captured per production run in "Log FG Batch Stock".
    const res = await createFinishedGood({
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      unit: formData.unit || 'KG',
      location: formData.location,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ New Finished Good "${formData.name}" registered in the catalog successfully!`);
      setFormData({
        sku: '',
        name: '',
        unit: 'KG',
        location: 'Cold Store Zone A',
      });
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Add Brand New Finished Good (Catalog SKU)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Introduce a manufactured product to the system (batch &amp; dates are logged at production)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162440] rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product SKU *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono transition-all"
                placeholder="e.g. FGPRO009"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. Alphonso Mango Jam 500g"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {units.map((u) => (
                  <option key={u.code} value={u.code} className="bg-[#162440] text-white">
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Default Storage Location</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#162440] text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
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
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                'Create Finished Good SKU'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
