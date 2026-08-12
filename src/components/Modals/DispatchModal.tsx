'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { postDispatch } from '@/actions/finished-goods';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  finishedGoods: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    qtyProduced: number;
    qtyDispatched: number;
    qtyReserved: number;
  }[];
  onSuccess: () => void;
}

export default function DispatchModal({ isOpen, onClose, finishedGoods, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    finishedGoodId: '',
    qtyDispatched: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    customerName: '',
    salesOrderRef: '',
    dispatchedBy: 'Warehouse Manager',
    remarks: '',
  });

  if (!isOpen) return null;

  const availableGoods = finishedGoods.filter((f) => f.qtyProduced - f.qtyDispatched > 0);
  const selectedFg = availableGoods.find((f) => f.id === formData.finishedGoodId);
  const freeStock = selectedFg ? selectedFg.qtyProduced - selectedFg.qtyDispatched - selectedFg.qtyReserved : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.finishedGoodId || !formData.qtyDispatched || !formData.customerName) {
      alert('Please fill in required fields (Product, Qty, Customer)');
      return;
    }

    setLoading(true);
    const res = await postDispatch({
      finishedGoodId: formData.finishedGoodId,
      qtyDispatched: Number(formData.qtyDispatched),
      dispatchDate: formData.dispatchDate,
      customerName: formData.customerName,
      salesOrderRef: formData.salesOrderRef,
      dispatchedBy: formData.dispatchedBy,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert('✅ Finished Goods Dispatch posted successfully!');
      onSuccess();
      onClose();
    } else {
      alert('❌ Error: ' + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-slate-900">🚚 Dispatch Finished Goods</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Product *</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.finishedGoodId}
                onChange={(e) => setFormData({ ...formData, finishedGoodId: e.target.value })}
                required
              >
                <option value="">Select product to dispatch</option>
                {availableGoods.map((fg) => {
                  const stock = fg.qtyProduced - fg.qtyDispatched;
                  return (
                    <option key={fg.id} value={fg.id}>
                      {fg.name} ({fg.sku}) — Stock: {stock} {fg.unit}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Dispatch Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.dispatchDate}
                onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                required
              />
            </div>
          </div>

          {selectedFg && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900 font-medium flex items-center justify-between">
              <span>Total Available Stock:</span>
              <span className="font-bold font-mono">
                {selectedFg.qtyProduced - selectedFg.qtyDispatched} {selectedFg.unit} (Free: {freeStock})
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Qty to Dispatch *</label>
              <input
                type="number"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="100"
                value={formData.qtyDispatched}
                onChange={(e) => setFormData({ ...formData, qtyDispatched: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Customer / Party *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Supermarket Reliance Mart"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Sales Order Ref</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="SO-2025-011"
                value={formData.salesOrderRef}
                onChange={(e) => setFormData({ ...formData, salesOrderRef: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Dispatched By</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Warehouse Manager"
                value={formData.dispatchedBy}
                onChange={(e) => setFormData({ ...formData, dispatchedBy: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Vehicle No., delivery note..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
            >
              {loading ? 'Posting...' : 'Post Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
