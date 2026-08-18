'use client';

import React, { useState } from 'react';
import { X, Truck } from 'lucide-react';
import { postDispatch } from '@/actions/finished-goods';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  finishedGoods: any[];
  onSuccess: () => void;
}

export default function DispatchModal({ isOpen, onClose, finishedGoods = [], onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skuCode: '',
    productName: '',
    batchCode: '',
    dispatchQty: '',
    unit: 'KG',
    dispatchDate: new Date().toISOString().split('T')[0],
    partyName: '',
    location: '',
    coaStatus: 'Approved',
    dispatchedBy: 'Dispatch Officer',
    remarks: '',
  });

  if (!isOpen) return null;

  const availableGoods = (finishedGoods || []).filter((f) => (f.totalStock !== undefined ? f.totalStock : (f.quantityProduced - (f.qtyDispatched || 0))) > 0);
  const selectedFg = (finishedGoods || []).find((f) => f.sku === formData.skuCode);
  const freeStock = selectedFg ? (selectedFg.totalStock !== undefined ? selectedFg.totalStock : (selectedFg.quantityProduced - (selectedFg.qtyDispatched || 0))) : 0;

  const handleSkuSelect = (selectedSku: string) => {
    const item = finishedGoods.find((f) => f.sku === selectedSku);
    if (item) {
      setFormData({
        ...formData,
        skuCode: item.sku,
        productName: item.name,
        batchCode: item.batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
        unit: item.unit || 'KG',
        location: item.location || 'FG Store A',
      });
    } else {
      setFormData({ ...formData, skuCode: selectedSku });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.skuCode || !formData.dispatchQty || !formData.partyName) {
      alert('Please select FG SKU, enter Dispatch Qty, and Party / Customer Name');
      return;
    }

    setLoading(true);
    const res = await postDispatch({
      skuCode: formData.skuCode,
      productName: formData.productName,
      batchCode: formData.batchCode,
      dispatchQty: Number(formData.dispatchQty),
      dispatchDate: formData.dispatchDate,
      partyName: formData.partyName,
      mfgDate: selectedFg ? selectedFg.mfgDate : new Date(),
      expiryDate: selectedFg ? selectedFg.expiryDate : new Date(),
      location: formData.location || (selectedFg ? selectedFg.location : 'FG Store A'),
      coaStatus: formData.coaStatus,
      remarks: formData.remarks,
      dispatchedBy: formData.dispatchedBy,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Dispatch of ${formData.dispatchQty} ${formData.unit} for "${formData.partyName}" posted successfully!`);
      setFormData({
        skuCode: '',
        productName: '',
        batchCode: '',
        dispatchQty: '',
        unit: 'KG',
        dispatchDate: new Date().toISOString().split('T')[0],
        partyName: '',
        location: '',
        coaStatus: 'Approved',
        dispatchedBy: 'Dispatch Officer',
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
              <Truck className="w-5 h-5 text-indigo-400" /> Post Customer Dispatch
            </h3>
            <p className="text-xs text-slate-400">Dispatch finished goods to clients, supermarkets, or distributors</p>
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
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                value={formData.skuCode}
                onChange={(e) => handleSkuSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose FG SKU to Dispatch --</option>
                {availableGoods.map((fg) => {
                  const stock = fg.totalStock !== undefined ? fg.totalStock : (fg.quantityProduced - (fg.qtyDispatched || 0));
                  return (
                    <option key={fg.id} value={fg.sku} className="bg-[#162440] text-white">
                      {fg.sku} — {fg.name} (Stock: {stock} {fg.unit})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Product Name (Auto-filled on SKU select, still editable) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Select SKU above to auto-fill"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedFg && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 text-xs text-indigo-300 flex items-center justify-between">
              <div>
                <span>Total Available Stock: </span>
                <strong className="text-white font-mono">{freeStock} {selectedFg.unit}</strong>
              </div>
              <div className="font-mono text-indigo-400">
                Batch Code: {selectedFg.batchNumber}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Dispatch Qty *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  className="flex-1 text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-emerald-400"
                  placeholder="e.g. 100"
                  value={formData.dispatchQty}
                  onChange={(e) => setFormData({ ...formData, dispatchQty: e.target.value })}
                  required
                />
                <input
                  className="w-20 text-xs p-2.5 bg-[#162440]/60 border border-[#2A3F66] rounded-lg text-slate-300 font-mono text-center"
                  value={formData.unit}
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Dispatch Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.dispatchDate}
                onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Party / Customer Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Reliance Retail / BigBasket"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Batch Code</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                placeholder="Batch code"
                value={formData.batchCode}
                onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">COA Status</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.coaStatus}
                onChange={(e) => setFormData({ ...formData, coaStatus: e.target.value })}
              >
                <option value="Approved" className="bg-[#162440] text-white">Approved</option>
                <option value="Pending" className="bg-[#162440] text-white">Pending</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Dispatched By</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Dispatch Officer"
                value={formData.dispatchedBy}
                onChange={(e) => setFormData({ ...formData, dispatchedBy: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Vehicle No., Invoice No., or delivery instructions..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
