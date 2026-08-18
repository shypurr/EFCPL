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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pmCode || !formData.issuedQty || !formData.issueFor) {
      alert('Please select PM Code, enter Issued Qty, and Target FG (Issue For)');
      return;
    }

    setLoading(true);
    const res = await createPackagingIssue({
      pmCode: formData.pmCode,
      pmName: formData.pmName,
      issueFor: formData.issueFor,
      quantityInBatch: selectedPm ? selectedPm.stock : 100,
      issuedQty: Number(formData.issuedQty),
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-purple-400" /> Issue Packaging Material to Production
            </h3>
            <p className="text-xs text-slate-400">Issue jars, bottles, caps or cartons for finished goods packaging run</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* PM Code Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select PM Code *</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono"
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
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Material Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Select PM code above"
                value={formData.pmName}
                onChange={(e) => setFormData({ ...formData, pmName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedPm && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-xs text-purple-300 flex items-center justify-between">
              <div>
                <span>Available Stock in Warehouse: </span>
                <strong className="text-white font-mono">{selectedPm.stock} {selectedPm.unit}</strong>
              </div>
              <div className="font-mono text-purple-400">
                Batch: {selectedPm.batchNumber}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issue For (Target FG) *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="e.g. Paneer Tikka 400g"
                value={formData.issueFor}
                onChange={(e) => setFormData({ ...formData, issueFor: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Qty to Issue *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  className="flex-1 text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-bold text-purple-400"
                  placeholder="e.g. 500"
                  value={formData.issuedQty}
                  onChange={(e) => setFormData({ ...formData, issuedQty: e.target.value })}
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
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Store Manager"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Production line number..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Packaging Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
