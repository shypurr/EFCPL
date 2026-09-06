'use client';

import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { createRMIssue } from '@/actions/operations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** RM master records (one per code) — the same list that feeds the inward modal */
  rawMaterials?: any[];
  finishedGoods?: any[];
  onSuccess: () => void;
}

export default function IssueModal({
  isOpen,
  onClose,
  rawMaterials = [],
  finishedGoods = [],
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rmCode: '',
    materialName: '',
    batchNumber: '',
    issueFor: '',
    issuedStock: '',
    unit: 'KG',
    issuedBy: 'Store Manager',
    remarks: '',
  });

  if (!isOpen) return null;

  // One entry per material code — issuing is a material-level act, not a batch pick
  const materialOptions = Array.from(
    new Map(rawMaterials.map((rm) => [rm.code, rm])).values()
  );

  const selectedRm = materialOptions.find((r) => r.code === formData.rmCode);
  // Master rows carry totalStock; fall back to the row's own stock for plain rows
  const availableStock = selectedRm ? selectedRm.totalStock ?? selectedRm.stock ?? 0 : 0;

  const handleCodeSelect = (selectedCode: string) => {
    const item = materialOptions.find((r) => r.code === selectedCode);
    if (item) {
      setFormData({
        ...formData,
        rmCode: item.code,
        materialName: item.name,
        unit: item.unit || 'KG',
      });
    } else {
      setFormData({ ...formData, rmCode: selectedCode, materialName: '' });
    }
  };

  const handleIssuedStockChange = (val: string) => {
    if (val === '') {
      setFormData({ ...formData, issuedStock: '' });
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData({ ...formData, issuedStock: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(formData.issuedStock);
    if (!formData.rmCode || formData.issuedStock === '' || qtyNum <= 0 || !formData.issueFor) {
      alert('Please select an RM Code, enter a valid Qty to Issue (> 0), and select a Target FG');
      return;
    }

    if (selectedRm && qtyNum > availableStock) {
      if (
        !confirm(
          `⚠️ Warning: Qty to issue (${qtyNum}) exceeds available stock (${availableStock} ${formData.unit}). Proceed anyway?`
        )
      ) {
        return;
      }
    }

    setLoading(true);
    const res = await createRMIssue({
      rmCode: formData.rmCode,
      materialName: formData.materialName,
      batchNumber: formData.batchNumber,
      issueFor: formData.issueFor,
      quantityInBatch: availableStock,
      issuedStock: qtyNum,
      issuedBy: formData.issuedBy,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ RM Issue of ${formData.issuedStock} ${formData.unit} for "${formData.issueFor}" posted successfully!`);
      setFormData({
        rmCode: '',
        materialName: '',
        batchNumber: '',
        issueFor: '',
        issuedStock: '',
        unit: 'KG',
        issuedBy: 'Store Manager',
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Post Raw Material (RM) Issue
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Issue raw agricultural commodities &amp; spices to production floor
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
            {/* RM Code Dropdown */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select RM Code *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-mono transition-all"
                value={formData.rmCode}
                onChange={(e) => handleCodeSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose RM Code --</option>
                {materialOptions.map((rm) => (
                  <option key={rm.id || rm.code} value={rm.code} className="bg-[#162440] text-white">
                    {rm.code} — {rm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Name (auto-filled on code select, but editable) */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Material Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
                placeholder="Select RM code above to auto-fill"
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Material-level Stock Banner */}
          {selectedRm && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs sm:text-sm text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span>Available Stock of {selectedRm.name}: </span>
                <strong className="text-white font-mono">
                  {availableStock} {selectedRm.unit}
                </strong>
              </div>
              <div className="font-mono text-emerald-400 text-xs">
                Issued oldest batch first (FIFO)
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Target Finished Good Dropdown */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Issue For (Target FG) *
              </label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
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

            {/* Qty to Issue with Integrated Unit Badge */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Qty to Issue (Deduct) *
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full text-xs sm:text-sm p-2.5 pr-16 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-bold text-amber-400 transition-all"
                  placeholder="e.g. 50"
                  value={formData.issuedStock}
                  onChange={(e) => handleIssuedStockChange(e.target.value)}
                  required
                />
                <div className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#1E2F4A] rounded-md text-xs font-mono text-slate-300 flex items-center justify-center pointer-events-none shrink-0">
                  {formData.unit || 'KG'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Batch Code — optional FIFO override */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch Code</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-mono transition-all"
                placeholder="Leave blank to draw oldest first"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Optional — set only to draw from one specific lot
              </p>
            </div>

            {/* Issued By */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issued By</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all"
                placeholder="Store Manager"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
              />
            </div>
          </div>

          {/* Remarks — optional free-text note */}
          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <textarea
              rows={2}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all resize-y"
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
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#1D9E75] hover:bg-[#168361] rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                'Post RM Issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
