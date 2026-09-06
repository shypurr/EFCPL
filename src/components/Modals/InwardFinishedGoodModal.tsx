'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight } from 'lucide-react';
import { inwardFinishedGood } from '@/actions/finished-goods';

interface InwardFinishedGoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  finishedGoods: any[];
  locations?: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function InwardFinishedGoodModal({
  isOpen,
  onClose,
  finishedGoods = [],
  locations = [
    { id: 'Cold Store Zone A', name: 'Cold Store Zone A' },
    { id: 'Deep Freezer 2', name: 'Deep Freezer 2' },
    { id: 'FG Bay 1', name: 'FG Bay 1' },
    { id: 'Dry Warehouse', name: 'Dry Warehouse' },
  ],
  onSuccess,
}: InwardFinishedGoodModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    batchNumber: '',
    quantityProduced: '',
    unit: 'KG',
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    location: 'Cold Store Zone A',
  });

  if (!isOpen) return null;

  const selectedFg = finishedGoods.find((f) => f.sku === formData.sku);

  const handleSkuSelect = (selectedSku: string) => {
    const item = finishedGoods.find((f) => f.sku === selectedSku);
    if (item) {
      setFormData({
        ...formData,
        sku: item.sku,
        name: item.name,
        unit: item.unit || 'KG',
        location: item.location || 'Cold Store Zone A',
        mfgDate: item.mfgDate ? new Date(item.mfgDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({ ...formData, sku: selectedSku });
    }
  };

  const handleQtyChange = (val: string) => {
    if (val === '') {
      setFormData({ ...formData, quantityProduced: '' });
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData({ ...formData, quantityProduced: val });
  };

  const mfgTime = formData.mfgDate ? new Date(formData.mfgDate).getTime() : 0;
  const expTime = formData.expiryDate ? new Date(formData.expiryDate).getTime() : 0;
  const computedShelfLife = mfgTime && expTime ? Math.max(0, Math.ceil((expTime - mfgTime) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(formData.quantityProduced);
    if (!formData.sku || !formData.batchNumber || formData.quantityProduced === '' || qtyNum <= 0 || !formData.expiryDate) {
      alert('Please select FG SKU, enter Batch Number, valid Quantity Produced (> 0), and Expiry Date');
      return;
    }

    setLoading(true);
    const mfg = formData.mfgDate || new Date().toISOString().split('T')[0];
    const res = await inwardFinishedGood({
      sku: formData.sku,
      name: formData.name,
      batchNumber: formData.batchNumber,
      quantityProduced: qtyNum,
      unit: formData.unit,
      mfgDate: mfg,
      expiryDate: formData.expiryDate,
      location: formData.location,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Successfully added ${formData.quantityProduced} ${formData.unit} to Finished Good ${formData.name}!`);
      setFormData({
        sku: '',
        name: '',
        batchNumber: '',
        quantityProduced: '',
        unit: 'KG',
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        location: 'Cold Store Zone A',
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
              <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Log Arrived / Inward Finished Goods Batch
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Log completed manufactured batches into cold room stock
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
            {/* FG SKU Dropdown */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select FG SKU *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono transition-all"
                value={formData.sku}
                onChange={(e) => handleSkuSelect(e.target.value)}
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

            {/* Product Name */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Select SKU above to auto-fill"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedFg && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs sm:text-sm text-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span>Current Stock on Record: </span>
                <strong className="text-white font-mono">{selectedFg.totalStock} {selectedFg.unit}</strong>
                <span className="text-slate-400 ml-2 text-xs">(Batch: {selectedFg.batchNumber || '—'})</span>
              </div>
              <div className="font-mono text-emerald-400 font-bold text-xs">
                {selectedFg.shelfLifeDays != null
                  ? `Shelf Life: ${selectedFg.shelfLifeDays} Days`
                  : 'Not yet produced'}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch Number *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none font-mono transition-all"
                placeholder="e.g. FG-2026-880"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity Produced *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-400 transition-all"
                placeholder="e.g. 1000"
                value={formData.quantityProduced}
                onChange={(e) => handleQtyChange(e.target.value)}
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">MFG Date *</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date *</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Calculated Shelf Life</label>
              <div className="w-full text-xs sm:text-sm p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-emerald-400 font-bold flex items-center h-[38px] sm:h-[42px]">
                {computedShelfLife > 0 ? `${computedShelfLife} Days` : '—'}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Storage Location</label>
            <select
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                  <span>Adding Batch...</span>
                </>
              ) : (
                'Add Inward Batch Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
