'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { postIssue } from '@/actions/movements';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: { id: string; name: string; code: string; unit: string; qty: number }[];
  packaging: { id: string; description: string; code: string; unit: string; qty: number }[];
  finishedGoods: { id: string; name: string; sku: string; unit: string; qtyProduced: number; qtyDispatched: number }[];
  onSuccess: () => void;
}

export default function IssueModal({
  isOpen,
  onClose,
  rawMaterials,
  packaging,
  finishedGoods,
  onSuccess,
}: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<'Raw Material' | 'Packaging' | 'Finished Goods'>('Raw Material');
  const [formData, setFormData] = useState({
    itemId: '',
    qty: '',
    unit: 'KG',
    issueDate: new Date().toISOString().split('T')[0],
    issuedTo: '',
    issuedBy: 'Store Manager',
    remarks: '',
  });

  if (!isOpen) return null;

  const currentItems =
    category === 'Raw Material'
      ? rawMaterials
      : category === 'Packaging'
      ? packaging
      : finishedGoods.map((f) => ({
          id: f.id,
          name: f.name,
          code: f.sku,
          unit: f.unit,
          qty: f.qtyProduced - f.qtyDispatched,
        }));

  const selectedItem: any = currentItems.find((i) => i.id === formData.itemId);

  const handleItemChange = (itemId: string) => {
    const found: any = currentItems.find((i) => i.id === itemId);
    setFormData({
      ...formData,
      itemId,
      unit: found ? found.unit : formData.unit,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId || !formData.qty || !formData.issuedTo) {
      alert('Please fill in required fields (Item, Qty, Issued To / Department)');
      return;
    }

    setLoading(true);
    const res = await postIssue({
      category,
      itemId: formData.itemId,
      qty: Number(formData.qty),
      unit: formData.unit,
      issueDate: formData.issueDate,
      issuedTo: formData.issuedTo,
      issuedBy: formData.issuedBy,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert('✅ Material Issue posted successfully!');
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
          <h3 className="text-base font-bold text-slate-900">📤 Issue Material to Production</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category *</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as any;
                  setCategory(cat);
                  setFormData({ ...formData, itemId: '' });
                }}
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Packaging">Packaging</option>
                <option value="Finished Goods">Finished Goods</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Item *</label>
              <select
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                value={formData.itemId}
                onChange={(e) => handleItemChange(e.target.value)}
                required
              >
                <option value="">Select item to issue</option>
                {currentItems.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name || item.description} ({item.code}) — Avail: {item.qty} {item.unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedItem && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 font-medium flex items-center justify-between">
              <span>Available In Stock:</span>
              <span className="font-bold font-mono">
                {selectedItem.qty} {selectedItem.unit}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Issue Date *</label>
              <input
                type="date"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Qty to Issue *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="50"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Unit</label>
              <input
                className="w-full text-xs p-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600 font-mono"
                value={formData.unit}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Issued To / Dept *</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Production Line 1"
                value={formData.issuedTo}
                onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Issued By</label>
              <input
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Store Manager"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Production Order Ref..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs"
            >
              {loading ? 'Posting...' : 'Post Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
