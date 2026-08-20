'use client';

import React, { useState } from 'react';
import { X, Boxes } from 'lucide-react';
import { createPackagingMaterial } from '@/actions/packaging';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  units?: { code: string; label: string }[];
  locations?: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function AddPackagingModal({
  isOpen,
  onClose,
  units = [
    { code: 'Units', label: 'Units (PCS)' },
    { code: 'Boxes', label: 'Boxes' },
    { code: 'Rolls', label: 'Rolls' },
    { code: 'KG', label: 'Kilograms (KG)' },
  ],
  locations = [
    { id: 'PM Warehouse', name: 'PM Warehouse' },
    { id: 'Packaging Bay 1', name: 'Packaging Bay 1' },
    { id: 'Dry Storage B', name: 'Dry Storage B' },
  ],
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    brand: '',
    stock: '',
    unit: 'Units',
    reorderLevel: '',
    maxStock: '',
    supplier: '',
    batchNumber: '',
    location: 'PM Warehouse',
    expiryDate: '',
    remarks: '',
  });

  if (!isOpen) return null;

  const handleNumberChange = (field: 'stock' | 'reorderLevel' | 'maxStock', val: string) => {
    if (val === '') {
      setFormData((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockNum = Number(formData.stock);
    const reorderNum = Number(formData.reorderLevel);

    if (!formData.code || !formData.name || formData.stock === '' || stockNum < 0 || formData.reorderLevel === '' || reorderNum < 0) {
      alert('Please fill in required fields with valid non-negative numbers (Code, Material Name, Stock, Reorder Level)');
      return;
    }

    setLoading(true);
    const res = await createPackagingMaterial({
      code: formData.code,
      name: formData.name,
      brand: formData.brand,
      batchNumber: formData.batchNumber || `PB-${Date.now().toString().slice(-4)}`,
      stock: stockNum,
      unit: formData.unit || 'Units',
      reorderLevel: reorderNum,
      maxStock: formData.maxStock ? Number(formData.maxStock) : undefined,
      supplier: formData.supplier,
      location: formData.location,
      expiryDate: formData.expiryDate || undefined,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ New Packaging Material "${formData.name}" added to catalog successfully!`);
      setFormData({
        code: '',
        name: '',
        brand: '',
        stock: '',
        unit: 'Units',
        reorderLevel: '',
        maxStock: '',
        supplier: '',
        batchNumber: '',
        location: 'PM Warehouse',
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Add Brand New Packaging (Catalog PM)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Register jars, bottles, cartons or caps in master catalog
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
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Code *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono transition-all"
                placeholder="PM009"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Material Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="500g Glass Jars"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="min-w-0 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Brand Name / Type</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Hindusthan Glass"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Current Stock Qty *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-blue-400"
                placeholder="5000"
                value={formData.stock}
                onChange={(e) => handleNumberChange('stock', e.target.value)}
                required
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
            <div className="min-w-0 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Reorder Level *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="1000"
                value={formData.reorderLevel}
                onChange={(e) => handleNumberChange('reorderLevel', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Max Stock Level</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="20000"
                value={formData.maxStock}
                onChange={(e) => handleNumberChange('maxStock', e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier Name</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="PackTech Solutions"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div className="min-w-0 sm:col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch Number</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono transition-all"
                placeholder="PB-2026-01"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Storage Location</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
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
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <input
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Optional notes or specifications..."
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
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Master Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
