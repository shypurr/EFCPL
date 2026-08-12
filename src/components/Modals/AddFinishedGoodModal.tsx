'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createFinishedGood } from '@/actions/finished-goods';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: { code: string; label: string }[];
  locations: { id: string; name: string }[];
  tempConditions: { code: string; label: string }[];
  onSuccess: () => void;
}

export default function AddFinishedGoodModal({
  isOpen,
  onClose,
  units,
  locations,
  tempConditions,
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    batchNumber: '',
    qtyProduced: '',
    qtyDispatched: '0',
    unit: 'Units',
    qtyReserved: '0',
    salesOrderRef: '',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    shelfLifeDays: '180',
    locationId: '',
    tempCondition: '-18°C (Deep Frozen)',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name || !formData.batchNumber || !formData.qtyProduced || !formData.expiryDate) {
      alert('Please fill in required fields (SKU, Name, Batch, Qty Produced, Expiry Date)');
      return;
    }

    setLoading(true);
    const res = await createFinishedGood({
      ...formData,
      qtyProduced: Number(formData.qtyProduced),
      qtyDispatched: Number(formData.qtyDispatched) || 0,
      qtyReserved: Number(formData.qtyReserved) || 0,
      shelfLifeDays: formData.shelfLifeDays ? Number(formData.shelfLifeDays) : undefined,
    });
    setLoading(false);

    if (res.success) {
      alert('✅ Finished good added successfully!');
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
          <h3 className="text-base font-bold text-slate-900">📦 Add New Finished Good</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">SKU Code *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="FG-007"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Paneer Tikka 400g"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Batch Number *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="FGB-2025-009"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Qty Produced *</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="500"
                value={formData.qtyProduced}
                onChange={(e) => setFormData({ ...formData, qtyProduced: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Qty Dispatched</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="0"
                value={formData.qtyDispatched}
                onChange={(e) => setFormData({ ...formData, qtyDispatched: e.target.value })}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reserved Qty (Orders)</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="0"
                value={formData.qtyReserved}
                onChange={(e) => setFormData({ ...formData, qtyReserved: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Sales Order Ref</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="SO-2025-099"
                value={formData.salesOrderRef}
                onChange={(e) => setFormData({ ...formData, salesOrderRef: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Manufacturing Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Expiry Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Shelf Life (Days)</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="180"
                value={formData.shelfLifeDays}
                onChange={(e) => setFormData({ ...formData, shelfLifeDays: e.target.value })}
              />
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Temperature Condition</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.tempCondition}
                onChange={(e) => setFormData({ ...formData, tempCondition: e.target.value })}
              >
                {tempConditions.map((tc) => (
                  <option key={tc.code} value={tc.code}>
                    {tc.label}
                  </option>
                ))}
              </select>
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
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
