'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createRawMaterial } from '@/actions/raw-materials';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: { code: string; label: string }[];
  locations: { id: string; name: string }[];
  coaStatuses: { code: string; label: string }[];
  onSuccess: () => void;
}

export default function AddRawMaterialModal({
  isOpen,
  onClose,
  units,
  locations,
  coaStatuses,
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    grade: '',
    qty: '',
    unit: 'KG',
    reorderLevel: '',
    maxStock: '',
    supplierName: '',
    leadTimeDays: '',
    lastPurchaseRate: '',
    batchNumber: '',
    coaStatus: 'Approved',
    locationId: '',
    expiryDate: '',
    remarks: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.qty || !formData.reorderLevel) {
      alert('Please fill in required fields (Code, Name, Qty, Reorder Level)');
      return;
    }

    setLoading(true);
    const res = await createRawMaterial({
      ...formData,
      qty: Number(formData.qty),
      reorderLevel: Number(formData.reorderLevel),
      maxStock: formData.maxStock ? Number(formData.maxStock) : undefined,
      leadTimeDays: formData.leadTimeDays ? Number(formData.leadTimeDays) : undefined,
      lastPurchaseRate: formData.lastPurchaseRate ? Number(formData.lastPurchaseRate) : undefined,
    });
    setLoading(false);

    if (res.success) {
      alert('✅ Raw material added successfully!');
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
          <h3 className="text-base font-bold text-slate-900">🌾 Add New Raw Material</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Code *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="RM-009"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Name *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Spices Mix"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Grade / Spec</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Food Grade A"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Current Stock Qty *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="100"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Unit * (Dynamic)</label>
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reorder Level *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="50"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Max Stock Level</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="500"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier Name</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="ABC Agro"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Lead Time (Days)</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="5"
                value={formData.leadTimeDays}
                onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Last Rate (₹ / unit)</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="45"
                value={formData.lastPurchaseRate}
                onChange={(e) => setFormData({ ...formData, lastPurchaseRate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Batch Number</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="B2025-999"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">CoA Status</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.coaStatus}
                onChange={(e) => setFormData({ ...formData, coaStatus: e.target.value })}
              >
                {coaStatuses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Storage Location (Dynamic)</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry Date</label>
              <input
                type="date"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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
              {loading ? 'Saving...' : 'Save Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
