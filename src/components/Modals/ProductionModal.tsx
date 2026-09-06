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

  const handleNumberChange = (field: 'totalBatchesMade' | 'totalOutput' | 'wastage', val: string) => {
    if (val === '') {
      setFormData((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const mfgTime = formData.mfgDate ? new Date(formData.mfgDate).getTime() : 0;
  const expTime = formData.expiryDate ? new Date(formData.expiryDate).getTime() : 0;
  const computedShelfLife = mfgTime && expTime ? Math.max(0, Math.ceil((expTime - mfgTime) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const outputNum = Number(formData.totalOutput);
    if (!formData.fgCode || formData.totalOutput === '' || outputNum <= 0 || !formData.expiryDate) {
      alert('Please select FG Code, enter a valid Total Output (> 0), and Expiry Date');
      return;
    }

    setLoading(true);
    const res = await createProductionLog({
      fgCode: formData.fgCode,
      fgName: formData.fgName,
      totalBatchesMade: Math.max(1, Number(formData.totalBatchesMade) || 1),
      totalOutput: outputNum,
      unit: formData.unit,
      wastage: Math.max(0, Number(formData.wastage) || 0),
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Factory className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Record Finished Good Production Run
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Log completed food processing batch output into warehouse stock
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
            {/* FG Code Dropdown */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select FG SKU Code *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono transition-all"
                value={formData.fgCode}
                onChange={(e) => handleFgSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose FG SKU --</option>
                {finishedGoods.map((fg) => (
                  <option key={fg.id} value={fg.sku} className="bg-[#162440] text-white">
                    {fg.sku} — {fg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Finished Good Name */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Finished Good Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="Product name"
                value={formData.fgName}
                onChange={(e) => setFormData({ ...formData, fgName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Total Batches Made *</label>
              <input
                type="number"
                min="0"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none font-mono transition-all"
                value={formData.totalBatchesMade}
                onChange={(e) => handleNumberChange('totalBatchesMade', e.target.value)}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Total Output Produced *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-emerald-400 transition-all"
                placeholder="e.g. 500"
                value={formData.totalOutput}
                onChange={(e) => handleNumberChange('totalOutput', e.target.value)}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-slate-300 font-mono"
                value={formData.unit}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Wastage / Scrap Qty</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none font-mono transition-all"
                placeholder="e.g. 5"
                value={formData.wastage}
                onChange={(e) => handleNumberChange('wastage', e.target.value)}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Production Batch Code</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none font-mono transition-all"
                placeholder="Auto-generated or custom"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Shift In-Charge / Operator</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                placeholder="Operator name"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">MFG Date *</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date *</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Auto Shelf Life</label>
              <div className="w-full text-xs sm:text-sm p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-emerald-400 font-bold flex items-center h-[38px] sm:h-[42px]">
                {computedShelfLife > 0 ? `${computedShelfLife} Days` : '—'}
              </div>
            </div>
          </div>

          {/* Remarks — optional free-text note */}
          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <textarea
              rows={2}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-y"
              placeholder="Optional note about this entry"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
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
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                'Record Production Run'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
