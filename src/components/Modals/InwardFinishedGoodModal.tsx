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

  const mfgTime = formData.mfgDate ? new Date(formData.mfgDate).getTime() : 0;
  const expTime = formData.expiryDate ? new Date(formData.expiryDate).getTime() : 0;
  const computedShelfLife = mfgTime && expTime ? Math.max(0, Math.ceil((expTime - mfgTime) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.batchNumber || !formData.quantityProduced || !formData.expiryDate) {
      alert('Please select FG SKU, enter Batch Number, Quantity Produced, and Expiry Date');
      return;
    }

    setLoading(true);
    const mfg = formData.mfgDate || new Date().toISOString().split('T')[0];
    const res = await inwardFinishedGood({
      sku: formData.sku,
      name: formData.name,
      batchNumber: formData.batchNumber,
      quantityProduced: Number(formData.quantityProduced),
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-amber-400" /> Log Finished Good Production Batch
            </h3>
            <p className="text-xs text-slate-400">Record newly produced stock for an existing product SKU</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* FG SKU Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select FG SKU *</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
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

            {/* Product Name (Auto-filled but editable) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Select SKU above to auto-fill"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedFg && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-center justify-between">
              <div>
                <span>Current Total Stock: </span>
                <strong className="text-white font-mono">{selectedFg.totalStock} {selectedFg.unit}</strong>
                <span className="text-slate-400 ml-2">(Last Batch: {selectedFg.batchNumber})</span>
              </div>
              <div className="font-mono text-emerald-400 font-bold">
                Shelf Life: {selectedFg.shelfLifeDays} days
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">New Batch Number *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                placeholder="e.g. FGB-2026-101"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Quantity Produced *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. 500"
                value={formData.quantityProduced}
                onChange={(e) => setFormData({ ...formData, quantityProduced: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unit</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-slate-300 font-mono"
                value={formData.unit}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Manufacturing Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
            <label className="text-xs font-semibold text-slate-300 block mb-1">Storage Location</label>
            <select
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Logging Batch...' : 'Log Finished Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
