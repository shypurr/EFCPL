'use client';

import React, { useState } from 'react';
import { X, Factory } from 'lucide-react';
import { createProductionLog } from '@/actions/operations';

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  finishedGoods: any[];
  onSuccess: () => void;
}

export default function ProductionModal({
  isOpen,
  onClose,
  finishedGoods = [],
  onSuccess,
}: ProductionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fgCode: '',
    fgName: '',
    totalBatchesMade: '1',
    totalOutput: '',
    unit: 'KG',
    wastage: '0',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    batchNumber: '',
    operator: 'Supervisor',
    remarks: '',
  });

  if (!isOpen) return null;

  const handleFgSelect = (selectedCode: string) => {
    const item = finishedGoods.find((f) => f.sku === selectedCode);
    if (item) {
      setFormData({
        ...formData,
        fgCode: item.sku,
        fgName: item.name,
        unit: item.unit || 'KG',
        batchNumber: `FGB-${Date.now().toString().slice(-4)}`,
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({ ...formData, fgCode: selectedCode });
    }
  };

  const mfgTime = formData.mfgDate ? new Date(formData.mfgDate).getTime() : 0;
  const expTime = formData.expiryDate ? new Date(formData.expiryDate).getTime() : 0;
  const computedShelfLife = mfgTime && expTime ? Math.max(0, Math.ceil((expTime - mfgTime) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fgCode || !formData.totalOutput || !formData.expiryDate) {
      alert('Please select FG Code, enter Total Output, and Expiry Date');
      return;
    }

    setLoading(true);
    const res = await createProductionLog({
      fgCode: formData.fgCode,
      fgName: formData.fgName,
      totalBatchesMade: Number(formData.totalBatchesMade),
      totalOutput: Number(formData.totalOutput),
      unit: formData.unit,
      wastage: Number(formData.wastage) || 0,
      mfgDate: formData.mfgDate,
      expiryDate: formData.expiryDate,
      batchNumber: formData.batchNumber,
      operator: formData.operator,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Production Run for "${formData.fgName}" logged successfully! Stock incremented.`);
      setFormData({
        fgCode: '',
        fgName: '',
        totalBatchesMade: '1',
        totalOutput: '',
        unit: 'KG',
        wastage: '0',
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        batchNumber: '',
        operator: 'Supervisor',
        remarks: '',
      });
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Factory className="w-5 h-5 text-amber-400" /> Record Factory Production Run
            </h3>
            <p className="text-xs text-slate-400">Log batch output, batches made, wastage, and automatically add to FG inventory</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* FG Code Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select FG Code *</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono"
                value={formData.fgCode}
                onChange={(e) => handleFgSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose FG Product --</option>
                {finishedGoods.map((fg) => (
                  <option key={fg.id} value={fg.sku} className="bg-[#162440] text-white">
                    {fg.sku} — {fg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Finished Good Name (Auto-filled but editable) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Finished Good Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Select FG code to auto-fill"
                value={formData.fgName}
                onChange={(e) => setFormData({ ...formData, fgName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Total Batches Made *</label>
              <input
                type="number"
                min="1"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono"
                placeholder="e.g. 5"
                value={formData.totalBatchesMade}
                onChange={(e) => setFormData({ ...formData, totalBatchesMade: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Total Output Produced *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold text-emerald-400"
                placeholder="e.g. 500"
                value={formData.totalOutput}
                onChange={(e) => setFormData({ ...formData, totalOutput: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Wastage</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-red-400 font-mono"
                placeholder="0"
                value={formData.wastage}
                onChange={(e) => setFormData({ ...formData, wastage: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-slate-300 font-mono"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Production Batch Number</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono"
                placeholder="FGB-2026-99"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Operator / Supervisor</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Operator name"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">MFG Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Calculated Shelf Life</label>
              <div className="w-full text-xs p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-emerald-400 font-bold">
                {computedShelfLife > 0 ? `${computedShelfLife} Days` : '—'}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="Recipe version, line number, or shift details..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Production Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
