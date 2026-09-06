'use client';

import React, { useState } from 'react';
import { X, Truck } from 'lucide-react';
import { postDispatch } from '@/actions/finished-goods';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  finishedGoods?: any[];
  locations?: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function DispatchModal({
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
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skuCode: '',
    productName: '',
    batchCode: '',
    dispatchQty: '',
    unit: 'KG',
    dispatchDate: new Date().toISOString().split('T')[0],
    partyName: '',
    mfgDate: '',
    expiryDate: '',
    location: '',
    remarks: '',
  });

  if (!isOpen) return null;

  const selectedFg = finishedGoods.find((f) => f.sku === formData.skuCode);

  const handleSkuSelect = (selectedSku: string) => {
    const item = finishedGoods.find((f) => f.sku === selectedSku);
    if (item) {
      setFormData({
        ...formData,
        skuCode: item.sku,
        productName: item.name,
        batchCode: item.batchNumber || '',
        unit: item.unit || 'KG',
        location: item.location || '',
        mfgDate: item.mfgDate ? new Date(item.mfgDate).toISOString().split('T')[0] : '',
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({ ...formData, skuCode: selectedSku });
    }
  };

  const handleQtyChange = (val: string) => {
    if (val === '') {
      setFormData({ ...formData, dispatchQty: '' });
      return;
    }
    const num = Number(val);
    if (num < 0 || isNaN(num)) return;
    setFormData({ ...formData, dispatchQty: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(formData.dispatchQty);
    if (!formData.skuCode || formData.dispatchQty === '' || qtyNum <= 0 || !formData.partyName.trim()) {
      alert('Please select an FG SKU, enter a valid Dispatch Quantity (> 0), and a Party Name');
      return;
    }

    if (selectedFg && qtyNum > selectedFg.totalStock) {
      alert(
        `❌ Cannot dispatch ${qtyNum} ${formData.unit} — only ${selectedFg.totalStock} ${selectedFg.unit} in stock.`
      );
      return;
    }

    setLoading(true);
    const res = await postDispatch({
      skuCode: formData.skuCode,
      productName: formData.productName,
      batchCode: formData.batchCode,
      dispatchQty: qtyNum,
      dispatchDate: formData.dispatchDate,
      partyName: formData.partyName,
      mfgDate: formData.mfgDate,
      expiryDate: formData.expiryDate,
      location: formData.location,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Dispatch of ${formData.dispatchQty} ${formData.unit} to "${formData.partyName}" posted successfully!`);
      setFormData({
        skuCode: '',
        productName: '',
        batchCode: '',
        dispatchQty: '',
        unit: 'KG',
        dispatchDate: new Date().toISOString().split('T')[0],
        partyName: '',
        mfgDate: '',
        expiryDate: '',
        location: '',
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Post Customer Dispatch</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Ship finished food products to B2B distributors and retail chains
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
            {/* FG SKU */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select FG SKU *</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono transition-all"
                value={formData.skuCode}
                onChange={(e) => handleSkuSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose FG SKU --</option>
                {finishedGoods.map((fg) => (
                  <option key={fg.id} value={fg.sku} className="bg-[#162440] text-white">
                    {fg.sku} — {fg.name} ({fg.totalStock} {fg.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Name */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Select SKU above to auto-fill"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Available Stock Banner */}
          {selectedFg && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 text-xs sm:text-sm text-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <span>Available Finished Stock: </span>
                <strong className="text-white font-mono">
                  {selectedFg.totalStock} {selectedFg.unit}
                </strong>
              </div>
              <div className="font-mono text-indigo-400 text-xs">Batch: {selectedFg.batchNumber || '—'}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Dispatch Qty with unit badge */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Dispatch Quantity *</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full text-xs sm:text-sm p-2.5 pr-16 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-300 transition-all"
                  placeholder="e.g. 100"
                  value={formData.dispatchQty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  required
                />
                <div className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#1E2F4A] rounded-md text-xs font-mono text-slate-300 flex items-center justify-center pointer-events-none shrink-0">
                  {formData.unit || 'KG'}
                </div>
              </div>
            </div>

            {/* Party Name */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Customer / Party Name *</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Reliance Retail / DMart"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Batch Code */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch Code</label>
              <input
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-mono transition-all"
                placeholder="Select SKU above to auto-fill"
                value={formData.batchCode}
                onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
              />
            </div>

            {/* Dispatch Date */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Dispatch Date *</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.dispatchDate}
                onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* MFG Date */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">MFG Date</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
              />
            </div>

            {/* Expiry Date */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date</label>
              <input
                type="date"
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            {/* Storage Location */}
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Storage Location</label>
              <select
                className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
          </div>

          {/* Remarks — optional free-text note */}
          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <textarea
              rows={2}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-y"
              placeholder="Optional note about this shipment"
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
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                'Post Customer Dispatch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
