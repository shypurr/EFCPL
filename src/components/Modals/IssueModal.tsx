'use client';

import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { createRMIssue } from '@/actions/operations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    quantityInBatch: 0,
    issuedStock: '',
    unit: 'KG',
    expiryDate: '',
    issuedBy: 'Store Manager',
    remarks: '',
  });

  if (!isOpen) return null;

  const selectedRm = rawMaterials.find((r) => r.code === formData.rmCode);

  const handleRmSelect = (selectedCode: string) => {
    const item = rawMaterials.find((r) => r.code === selectedCode);
    if (item) {
      setFormData({
        ...formData,
        rmCode: item.code,
        materialName: item.name,
        batchNumber: item.batchNumber || '',
        quantityInBatch: item.stock,
        unit: item.unit || 'KG',
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({ ...formData, rmCode: selectedCode });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rmCode || !formData.issuedStock || !formData.issueFor) {
      alert('Please select RM Code, enter Issued Stock Qty, and Target FG (Issue For)');
      return;
    }

    setLoading(true);
    const res = await createRMIssue({
      rmCode: formData.rmCode,
      materialName: formData.materialName,
      batchNumber: formData.batchNumber,
      issueFor: formData.issueFor,
      quantityInBatch: selectedRm ? selectedRm.stock : 100,
      issuedStock: Number(formData.issuedStock),
      expiryDate: formData.expiryDate || undefined,
      remarks: formData.remarks,
      issuedBy: formData.issuedBy,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ RM Issue of ${formData.issuedStock} ${formData.unit} for "${formData.issueFor}" posted successfully!`);
      setFormData({
        rmCode: '',
        materialName: '',
        batchNumber: '',
        issueFor: '',
        quantityInBatch: 0,
        issuedStock: '',
        unit: 'KG',
        expiryDate: '',
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" /> Post Raw Material (RM) Issue
            </h3>
            <p className="text-xs text-slate-400">Issue raw agricultural commodities & spices to production floor</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* RM Code Dropdown (Linked to Name) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select RM Code *</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-mono"
                value={formData.rmCode}
                onChange={(e) => handleRmSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose RM Code --</option>
                {rawMaterials.map((rm) => (
                  <option key={rm.id} value={rm.code} className="bg-[#162440] text-white">
                    {rm.code} — {rm.name} ({rm.stock} {rm.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Material Name (Auto-filled on code select, but editable) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Material Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="Select RM code above to auto-fill"
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedRm && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300 flex items-center justify-between">
              <div>
                <span>Available Batch Stock: </span>
                <strong className="text-white font-mono">{selectedRm.stock} {selectedRm.unit}</strong>
              </div>
              <div className="font-mono text-emerald-400">
                Batch No: {selectedRm.batchNumber}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch Number</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-mono"
                placeholder="Batch number"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issue For (Target FG) *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
                placeholder="e.g. Paneer Butter Masala 400g"
                value={formData.issueFor}
                onChange={(e) => setFormData({ ...formData, issueFor: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Qty to Issue (Deduct) *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  className="flex-1 text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-bold text-amber-400"
                  placeholder="e.g. 50"
                  value={formData.issuedStock}
                  onChange={(e) => setFormData({ ...formData, issuedStock: e.target.value })}
                  required
                />
                <input
                  className="w-20 text-xs p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-slate-300 font-mono text-center"
                  value={formData.unit}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issued By</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] outline-none"
                placeholder="Store Manager"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] outline-none"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none"
              placeholder="Batch notes, recipe formulation version..."
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
              {loading ? 'Posting...' : 'Post RM Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
