'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { postGRN } from '@/actions/movements';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: { id: string; name: string; code: string; unit: string }[];
  packaging: { id: string; description: string; code: string; unit: string }[];
  coaStatuses: { code: string; label: string }[];
  onSuccess: () => void;
}

export default function GRNModal({
  isOpen,
  onClose,
  rawMaterials,
  packaging,
  coaStatuses,
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<'Raw Material' | 'Packaging'>('Raw Material');
  const [formData, setFormData] = useState({
    itemId: '',
    qty: '',
    unit: 'KG',
    receivedDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    invoiceNo: '',
    batchNo: '',
    coaStatus: 'Approved',
    enteredBy: 'Store Manager',
    remarks: '',
  });

  if (!isOpen) return null;

  const currentItems = category === 'Raw Material' ? rawMaterials : packaging;

  const handleItemChange = (itemId: string) => {
    const found = currentItems.find((i) => i.id === itemId);
    setFormData({
      ...formData,
      itemId,
      unit: found ? found.unit : formData.unit,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId || !formData.qty || !formData.supplierName) {
      alert('Please fill in required fields (Item, Qty, Supplier)');
      return;
    }

    setLoading(true);
    const res = await postGRN({
      category,
      itemId: formData.itemId,
      qty: Number(formData.qty),
      unit: formData.unit,
      receivedDate: formData.receivedDate,
      supplierName: formData.supplierName,
      invoiceNo: formData.invoiceNo,
      batchNo: formData.batchNo,
      coaStatus: formData.coaStatus,
      enteredBy: formData.enteredBy,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert('✅ GRN Entry posted successfully!');
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-slate-900">📥 New Goods Receipt Note (GRN)</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category *</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as 'Raw Material' | 'Packaging';
                  setCategory(cat);
                  setFormData({ ...formData, itemId: '' });
                }}
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Packaging">Packaging Material</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Item *</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                value={formData.itemId}
                onChange={(e) => handleItemChange(e.target.value)}
                required
              >
                <option value="">Select material / item</option>
                {currentItems.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name || item.description} ({item.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Received Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Qty Received *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="500"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Unit</label>
              <input
                className="w-full text-xs p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600 font-mono"
                value={formData.unit}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier Name *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Shree Ganesh Traders"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Invoice No.</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="INV-2025-001"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Batch No.</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="B2025-101"
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Entered By</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Ramesh Patil"
                value={formData.enteredBy}
                onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Optional notes..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              {loading ? 'Posting...' : 'Post GRN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
