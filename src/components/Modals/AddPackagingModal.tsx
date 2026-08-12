'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPackagingMaterial } from '@/actions/packaging';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: { code: string; label: string }[];
  packagingTypes: { code: string; label: string }[];
  onSuccess: () => void;
}

export default function AddPackagingModal({
  isOpen,
  onClose,
  units,
  packagingTypes,
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'Pouch',
    description: '',
    specification: '',
    qty: '',
    unit: 'Units',
    linkedSkus: '',
    supplier: '',
    moq: '',
    leadTimeDays: '',
    lastPurchaseRate: '',
    reorderLevel: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.description || !formData.qty) {
      alert('Please fill in required fields (Code, Description, Stock Qty)');
      return;
    }

    setLoading(true);
    const res = await createPackagingMaterial({
      ...formData,
      qty: Number(formData.qty),
      moq: formData.moq ? Number(formData.moq) : undefined,
      leadTimeDays: formData.leadTimeDays ? Number(formData.leadTimeDays) : undefined,
      lastPurchaseRate: formData.lastPurchaseRate ? Number(formData.lastPurchaseRate) : undefined,
      reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : undefined,
    });
    setLoading(false);

    if (res.success) {
      alert('✅ Packaging material added successfully!');
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-slate-900">🏷️ Add Packaging Material</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Item Code *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="PKG-009"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Type * (Dynamic)</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {packagingTypes.map((pt) => (
                  <option key={pt.code} value={pt.code}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Description *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="400g PP Container"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Specification</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Size: 150x100mm, Clear PP"
                value={formData.specification}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Linked SKUs</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="FG-001, FG-002"
                value={formData.linkedSkus}
                onChange={(e) => setFormData({ ...formData, linkedSkus: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Current Stock *</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="1000"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Unit</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reorder Level</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="500"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Avon Plastics Pune"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">MOQ</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="2000"
                value={formData.moq}
                onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Last Rate (₹ / unit)</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="4.50"
                value={formData.lastPurchaseRate}
                onChange={(e) => setFormData({ ...formData, lastPurchaseRate: e.target.value })}
              />
            </div>
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
              {loading ? 'Saving...' : 'Save Packaging'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
