'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight } from 'lucide-react';
import { inwardRawMaterial } from '@/actions/raw-materials';

interface InwardRawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: any[];
  units?: { code: string; label: string }[];
  locations?: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function InwardRawMaterialModal({
  isOpen,
  onClose,
  rawMaterials = [],
  units = [
    { code: 'KG', label: 'KG' },
    { code: 'Units', label: 'Units' },
    { code: 'Boxes', label: 'Boxes' },
  ],
  locations = [
    { id: 'RM Store A', name: 'RM Store A' },
    { id: 'Cold Storage 1', name: 'Cold Storage 1' },
    { id: 'Dry Warehouse', name: 'Dry Warehouse' },
  ],
  onSuccess,
}: InwardRawMaterialModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    brand: '',
    inwardQty: '',
    unit: 'KG',
    batchNumber: '',
    supplier: '',
    location: '',
    expiryDate: '',
    remarks: '',
  });

  if (!isOpen) return null;

  // Deduplicate materials by code for clean selection dropdown
  const materialOptions = Array.from(
    new Map(rawMaterials.map((rm) => [rm.code, rm])).values()
  );

  const selectedRm = materialOptions.find((r) => r.code === formData.code);

  const handleCodeSelect = (selectedCode: string) => {
    const item = materialOptions.find((r) => r.code === selectedCode);
    if (item) {
      setFormData({
        ...formData,
        code: item.code,
        name: item.name,
        brand: item.brand || '',
        unit: item.unit || 'KG',
        supplier: item.supplier || '',
        location: item.location || '',
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({ ...formData, code: selectedCode });
    }
  };

  const handleQtyChange = (val: string) => {
    if (val === '') {
      setFormData({ ...formData, inwardQty: '' });
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData({ ...formData, inwardQty: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(formData.inwardQty);
    if (!formData.code || formData.inwardQty === '' || qtyNum <= 0 || !formData.batchNumber) {
      alert('Please select Raw Material Code, enter a valid Inward Qty (> 0), and Batch Number');
      return;
    }

    setLoading(true);
    const res = await inwardRawMaterial({
      code: formData.code,
      name: formData.name,
      brand: formData.brand,
      batchNumber: formData.batchNumber,
      inwardQty: qtyNum,
      unit: formData.unit,
      supplier: formData.supplier,
      location: formData.location,
      expiryDate: formData.expiryDate || undefined,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Successfully logged new inward entry of ${formData.inwardQty} ${formData.unit} for ${formData.name}!`);
      setFormData({
        code: '',
        name: '',
        brand: '',
        inwardQty: '',
        unit: 'KG',
        batchNumber: '',
        supplier: '',
        location: '',
        expiryDate: '',
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
              <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Log Incoming / Arrived Raw Material
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Logs a separate incoming batch entry into the Raw Materials inventory
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* RM Code Dropdown */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select RM Code *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-mono transition-all"
                value={formData.code}
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

            {/* Material Name */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Material Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
                placeholder="Select code to auto-fill"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Brand Name */}
            <div className="min-w-0 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Brand Name</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
                placeholder="Brand name"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedRm && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs sm:text-sm text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span>Latest Stock of {selectedRm.name}: </span>
                <strong className="text-white font-mono">{selectedRm.stock} {selectedRm.unit}</strong>
                <span className="text-slate-400 ml-2 text-xs">(Last Batch: {selectedRm.batchNumber || '—'})</span>
              </div>
              <div className="font-mono text-emerald-400 font-bold text-xs">
                Reorder Threshold: {selectedRm.reorderLevel} {selectedRm.unit}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Incoming Qty with non-negative constraints */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Incoming Qty *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-bold text-emerald-400 transition-all"
                placeholder="e.g. 250"
                value={formData.inwardQty}
                onChange={(e) => handleQtyChange(e.target.value)}
                required
              />
            </div>

            {/* Changeable Unit Dropdown with KG, Units, Boxes */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-medium transition-all"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {units.map((u) => (
                  <option key={u.code} value={u.code} className="bg-[#162440] text-white">
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Arriving Batch No *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-mono transition-all"
                placeholder="e.g. B2026-081"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier Name</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
                placeholder="Supplier or vendor"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Storage Location</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="" className="bg-[#162440] text-slate-400">None</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#162440] text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-[#1D9E75] outline-none transition-all"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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
                  <span>Receiving Stock...</span>
                </>
              ) : (
                'Receive Inward Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
