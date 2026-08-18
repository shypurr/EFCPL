'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight } from 'lucide-react';
import { inwardPackagingMaterial } from '@/actions/packaging';

interface InwardPackagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  packagingMaterials: any[];
  locations?: { id: string; name: string }[];
  onSuccess: () => void;
}

export default function InwardPackagingModal({
  isOpen,
  onClose,
  packagingMaterials = [],
  locations = [
    { id: 'PM Warehouse', name: 'PM Warehouse' },
    { id: 'Packaging Bay 1', name: 'Packaging Bay 1' },
    { id: 'Dry Storage B', name: 'Dry Storage B' },
  ],
  onSuccess,
}: InwardPackagingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    brand: '',
    inwardQty: '',
    unit: 'Units',
    batchNumber: '',
    supplier: '',
    location: 'PM Warehouse',
    expiryDate: '',
    remarks: '',
  });

  if (!isOpen) return null;

  const selectedPm = packagingMaterials.find((p) => p.code === formData.code);

  const handleCodeSelect = (selectedCode: string) => {
    const item = packagingMaterials.find((p) => p.code === selectedCode);
    if (item) {
      setFormData({
        ...formData,
        code: item.code,
        name: item.name,
        brand: item.brand || '',
        unit: item.unit || 'Units',
        supplier: item.supplier || '',
        location: item.location || 'PM Warehouse',
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({ ...formData, code: selectedCode });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.inwardQty || !formData.batchNumber) {
      alert('Please select Packaging Material Code, enter Inward Qty, and Batch Number');
      return;
    }

    setLoading(true);
    const res = await inwardPackagingMaterial({
      code: formData.code,
      name: formData.name,
      brand: formData.brand,
      batchNumber: formData.batchNumber,
      inwardQty: Number(formData.inwardQty),
      unit: formData.unit,
      supplier: formData.supplier,
      location: formData.location,
      expiryDate: formData.expiryDate || undefined,
      remarks: formData.remarks,
    });
    setLoading(false);

    if (res.success) {
      alert(`✅ Successfully received ${formData.inwardQty} ${formData.unit} for ${formData.name}!`);
      setFormData({
        code: '',
        name: '',
        brand: '',
        inwardQty: '',
        unit: 'Units',
        batchNumber: '',
        supplier: '',
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-4 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-blue-400" /> Log Incoming / Arrived Packaging Material
            </h3>
            <p className="text-xs text-slate-400">Receive stock shipments for existing jars, bottles, caps or cartons</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* PM Code Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select PM Code *</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                value={formData.code}
                onChange={(e) => handleCodeSelect(e.target.value)}
                required
              >
                <option value="" className="bg-[#162440] text-slate-400">-- Choose PM Code --</option>
                {packagingMaterials.map((pm) => (
                  <option key={pm.id} value={pm.code} className="bg-[#162440] text-white">
                    {pm.code} — {pm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Name (Auto-filled but editable) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Material Name *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Select code above to auto-fill"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Brand / Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Brand Name / Type</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Type or brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedPm && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300 flex items-center justify-between">
              <div>
                <span>Current Stock on Record: </span>
                <strong className="text-white font-mono">{selectedPm.stock} {selectedPm.unit}</strong>
                <span className="text-slate-400 ml-2">(Last Batch: {selectedPm.batchNumber})</span>
              </div>
              <div className="font-mono text-blue-400 font-bold">
                Reorder Threshold: {selectedPm.reorderLevel} {selectedPm.unit}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Incoming / Received Qty *</label>
              <input
                type="number"
                step="any"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. 500"
                value={formData.inwardQty}
                onChange={(e) => setFormData({ ...formData, inwardQty: e.target.value })}
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

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Arriving Batch Number *</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                placeholder="e.g. PB-2026-09"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier Name</label>
              <input
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Supplier name"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Storage Location</label>
              <select
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date</label>
              <input
                type="date"
                className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <input
              className="w-full text-xs p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Delivery note number, invoice, or quality remarks..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Receiving Stock...' : 'Receive Inward Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
