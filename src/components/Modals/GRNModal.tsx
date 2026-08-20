'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight } from 'lucide-react';
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

  const handleQtyChange = (val: string) => {
    if (val === '') {
      setFormData({ ...formData, qty: '' });
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData({ ...formData, qty: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(formData.qty);
    if (!formData.itemId || formData.qty === '' || qtyNum <= 0 || !formData.supplierName) {
      alert('Please fill in required fields with valid Received Quantity (> 0) (Item, Qty, Supplier)');
      return;
    }

    setLoading(true);
    const mfg = formData.receivedDate || new Date().toISOString().split('T')[0];
    const exp = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const res = await postGRN({
      fgCode: formData.itemId || 'FGPRO001',
      fgName: formData.itemId || 'Finished Good',
      totalBatchesMade: 1,
      totalOutput: qtyNum,
      unit: formData.unit || 'KG',
      mfgDate: mfg,
      expiryDate: exp,
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in duration-150">
        <div className="p-4 sm:p-5 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              New Goods Receipt Note (GRN)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162440] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCategory('Raw Material')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                category === 'Raw Material'
                  ? 'bg-[#1D9E75] text-white'
                  : 'bg-[#162440] text-slate-400 hover:bg-[#1E2F4A]'
              }`}
            >
              Raw Material
            </button>
            <button
              type="button"
              onClick={() => setCategory('Packaging')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                category === 'Packaging'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#162440] text-slate-400 hover:bg-[#1E2F4A]'
              }`}
            >
              Packaging Material
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select Item *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all"
                value={formData.itemId}
                onChange={(e) => handleItemChange(e.target.value)}
                required
              >
                <option value="">-- Choose Item --</option>
                {currentItems.map((item: any) => (
                  <option key={item.id} value={item.id} className="bg-[#162440] text-white">
                    {item.code} — {item.name || item.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Received Quantity *</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full text-xs sm:text-sm p-2.5 pr-16 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] outline-none font-bold text-emerald-400 transition-all"
                  placeholder="e.g. 500"
                  value={formData.qty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  required
                />
                <div className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#1E2F4A] rounded-md text-xs font-mono text-slate-300 flex items-center justify-center pointer-events-none shrink-0">
                  {formData.unit}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all"
                placeholder="Supplier name"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice / DC No.</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all"
                placeholder="INV-9901"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch No.</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] outline-none font-mono transition-all"
                placeholder="BATCH-123"
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">CoA Quality Status</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all"
                value={formData.coaStatus}
                onChange={(e) => setFormData({ ...formData, coaStatus: e.target.value })}
              >
                {coaStatuses.map((s) => (
                  <option key={s.code} value={s.code} className="bg-[#162440] text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
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
              {loading ? 'Posting...' : 'Post GRN Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
