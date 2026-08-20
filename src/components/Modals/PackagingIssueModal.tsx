'use client';

import React, { useState } from 'react';
import { X, Box } from 'lucide-react';
import { createPackagingIssue } from '@/actions/operations';

interface PackagingIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  packagingMaterials: any[];
  finishedGoods?: any[];
  onSuccess: () => void;
}

export default function PackagingIssueModal({
  isOpen,
  onClose,
  packagingMaterials = [],
  finishedGoods = [],
  onSuccess,
}: PackagingIssueModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pmCode: '',
    pmName: '',
    issueFor: '',
    issuedQty: '',
    unit: 'Units',
    remarks: '',
    issuedBy: 'Store Manager',
  });

  if (!isOpen) return null;

  const selectedPm = packagingMaterials.find((p) => p.code === formData.pmCode);

  const handlePmSelect = (selectedCode: string) => {
    const item = packagingMaterials.find((p) => p.code === selectedCode);
    if (item) {
      setFormData({
        ...formData,
        pmCode: item.code,
        pmName: item.name,
        unit: item.unit || 'Units',
      });
    } else {
      setFormData({ ...formData, pmCode: selectedCode });
    }
  };

  const handleIssuedQtyChange = (val: string) => {
    if (val === '') {
      setFormData({ ...formData, issuedQty: '' });
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData({ ...formData, issuedQty: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(formData.issuedQty);
    if (!formData.pmCode || !formData.issuedQty || qtyNum <= 0 || !formData.issueFor) {
      alert('Please select PM Code, enter a valid Issued Qty (> 0), and select Target FG');
      return;
    }

    if (selectedPm && qtyNum > selectedPm.stock) {
      if (!confirm(`⚠️ Warning: Issued Qty (${qtyNum}) exceeds current available stock (${selectedPm.stock} ${selectedPm.unit}). Proceed anyway?`)) {
        return;
      }
    }

    setLoading(true);
    const res = await createPackagingIssue({
      pmCode: formData.pmCode,
      pmName: formData.pmName,
      issueFor: formData.issueFor,
      quantityInBatch: selectedPm ? selectedPm.stock : 100,
      issuedQty: qtyNum,
      remarks: formData.remarks,
      issuedBy: formData.issuedBy,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Packaging Issue of ${formData.issuedQty} ${formData.unit} for "${formData.issueFor}" posted successfully!`);
      setFormData({
        pmCode: '',
        pmName: '',
        issueFor: '',
        issuedQty: '',
        unit: 'Units',
        remarks: '',
        issuedBy: 'Store Manager',
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Box className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Issue Packaging Material to Production
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Issue jars, bottles, caps or cartons for finished goods packaging run
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
            {/* PM Code Dropdown */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select PM Code *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono transition-all"
                value={formData.pmCode}
                onChange={(e) => handlePmSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose PM Item --</option>
                {packagingMaterials.map((pm) => (
                  <option key={pm.id} value={pm.code} className="bg-[#162440] text-white">
                    {pm.code} — {pm.name} ({pm.stock} {pm.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* PM Material Name (Auto-filled but editable) */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Material Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                placeholder="Select PM code above"
                value={formData.pmName}
                onChange={(e) => setFormData({ ...formData, pmName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedPm && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-xs sm:text-sm text-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span>Available Stock in Warehouse: </span>
                <strong className="text-white font-mono">{selectedPm.stock} {selectedPm.unit}</strong>
              </div>
              <div className="font-mono text-purple-400 text-xs">
                Batch: {selectedPm.batchNumber || '—'}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Target FG Dropdown */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issue For (Target FG) *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                value={formData.issueFor}
                onChange={(e) => setFormData({ ...formData, issueFor: e.target.value })}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">
                  -- Choose Target Finished Good --
                </option>
                {finishedGoods.map((fg) => (
                  <option key={fg.id} value={`${fg.sku} - ${fg.name}`} className="bg-[#162440] text-white">
                    {fg.sku} — {fg.name} ({fg.totalStock ?? fg.quantityProduced ?? 0} {fg.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Qty to Issue with Integrated Unit Badge (non-negative) */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Qty to Issue *</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full text-xs sm:text-sm p-2.5 pr-16 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-bold text-purple-400 transition-all"
                  placeholder="e.g. 500"
                  value={formData.issuedQty}
                  onChange={(e) => handleIssuedQtyChange(e.target.value)}
                  required
                />
                <div className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#1E2F4A] rounded-md text-xs font-mono text-slate-300 flex items-center justify-center pointer-events-none shrink-0">
                  {formData.unit || 'Units'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issued By</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                placeholder="Store Manager"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                placeholder="Production line number..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
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
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                'Post Packaging Issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
