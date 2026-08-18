'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { postGRN } from '@/actions/movements';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials?: { id: string; name: string; code: string; unit: string }[];
  packaging?: { id: string; description: string; code: string; unit: string }[];
  category?: 'Raw Material' | 'Packaging' | string;
  coaStatuses?: { code: string; label: string }[];
  items?: any[];
  onSuccess: () => void;
}

export default function GRNModal({
  isOpen,
  onClose,
  rawMaterials = [],
  packaging = [],
  coaStatuses = [
    { code: 'Approved', label: 'Approved' },
    { code: 'Pending', label: 'Pending' },
    { code: 'Rejected', label: 'Rejected' },
  ],
  items = [],
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
    const mfg = formData.receivedDate || new Date().toISOString().split('T')[0];
    const exp = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const res = await postGRN({
      fgCode: formData.itemId || 'FGPRO001',
      fgName: formData.itemId || 'Finished Good',
      totalBatchesMade: 1,
      totalOutput: Number(formData.qty),
      unit: formData.unit || 'KG',
      mfgDate: mfg,
      expiryDate: exp,
      remarks: formData.remarks,
      operator: formData.enteredBy,
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            📥 New Goods Receipt Note (GRN)
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category *</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as 'Raw Material' | 'Packaging';
                  setCategory(cat);
                  setFormData({ ...formData, itemId: '' });
                }}
              >
                <option value="Raw Material" className="bg-[#162440] text-white">Raw Material</option>
                <option value="Packaging" className="bg-[#162440] text-white">Packaging Material</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select Item *</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                value={formData.itemId}
                onChange={(e) => handleItemChange(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-white">Select material / item</option>
                {currentItems.map((item: any) => (
                  <option key={item.id} value={item.id} className="bg-[#162440] text-white">
                    {item.name || item.description} ({item.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Received Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Qty Received *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="500"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit</label>
              <input
                className="w-full text-xs p-2.5 border border-[#2A3F66] bg-[#162440]/60 rounded-lg text-slate-300 font-mono"
                value={formData.unit}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="Shree Ganesh Traders"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice No.</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="INV-2025-001"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch No.</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="B2025-101"
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">CoA Status</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                value={formData.coaStatus}
                onChange={(e) => setFormData({ ...formData, coaStatus: e.target.value })}
              >
                {coaStatuses.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#162440] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Entered By</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="Ramesh Patil"
                value={formData.enteredBy}
                onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
              placeholder="Optional notes..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-[#1E2F4A] flex justify-end gap-2">
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
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1D9E75] hover:bg-[#168361] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post GRN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
