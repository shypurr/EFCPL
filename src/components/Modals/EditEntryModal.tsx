'use client';

import React, { useState } from 'react';
import { X, Pencil, Lock } from 'lucide-react';
import { updateRawMaterial, updatePackagingMaterial } from '@/actions/inventory';
import {
  updateFinishedGood,
  updateRMIssue,
  updateProductionLog,
  updatePackagingIssue,
  updateDispatch,
} from '@/actions/operations';

export type EntryType =
  | 'RM_BATCH'
  | 'PM'
  | 'FG'
  | 'RM_ISSUE'
  | 'PRODUCTION'
  | 'PM_ISSUE'
  | 'DISPATCH';

interface FieldSpec {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  options?: string[];
  /** Adds a "None" choice that clears the field (stored as null) */
  allowNone?: boolean;
  hint?: string;
  span?: string;
}

interface Props {
  isOpen: boolean;
  type: EntryType;
  record: Record<string, unknown> | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RM_UNITS = ['KG', 'GM', 'Units', 'Boxes', 'LTR', 'ML', 'BAGS'];
const PM_UNITS = ['Units', 'Boxes', 'Rolls', 'KG'];
const FG_UNITS = ['KG', 'GM', 'Units', 'Boxes', 'Jars'];

const RM_LOCATIONS = ['RM Store A', 'Cold Storage 1', 'Dry Warehouse'];
const PM_LOCATIONS = ['PM Warehouse', 'Packaging Bay 1', 'Dry Storage B'];
const FG_LOCATIONS = ['Cold Store Zone A', 'Deep Freezer 2', 'FG Bay 1', 'Dry Warehouse'];

const COA_STATUS = ['Approved', 'Pending', 'N/A'];

const LOCKED_QTY = 'Locked — delete the entry to reverse the stock movement, then post it again';

const FIELDS: Record<EntryType, FieldSpec[]> = {
  RM_BATCH: [
    { key: 'code', label: 'RM Code', type: 'text', readOnly: true, hint: 'Codes are permanent — issue history references them' },
    { key: 'name', label: 'Material Name', type: 'text', required: true },
    { key: 'brand', label: 'Brand Name', type: 'text' },
    { key: 'batchNumber', label: 'Batch Code', type: 'text' },
    { key: 'stock', label: 'Stock (this batch)', type: 'number', hint: 'Direct correction of what is physically on the shelf' },
    { key: 'unit', label: 'Unit', type: 'select', options: RM_UNITS },
    { key: 'supplier', label: 'Supplier', type: 'text' },
    { key: 'location', label: 'Storage Location', type: 'select', options: RM_LOCATIONS, allowNone: true },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional note', span: 'sm:col-span-2' },
  ],
  PM: [
    { key: 'code', label: 'PM Code', type: 'text', readOnly: true, hint: 'Codes are permanent — packaging issue history references them' },
    { key: 'name', label: 'Material Name', type: 'text', required: true },
    { key: 'brand', label: 'Brand / Type', type: 'text' },
    { key: 'batchNumber', label: 'Batch Code', type: 'text' },
    { key: 'stock', label: 'Current Stock', type: 'number', hint: 'Direct correction of what is physically on the shelf' },
    { key: 'unit', label: 'Unit', type: 'select', options: PM_UNITS },
    { key: 'reorderLevel', label: 'Reorder Level', type: 'number' },
    { key: 'maxStock', label: 'Max Stock Level', type: 'number' },
    { key: 'supplier', label: 'Supplier', type: 'text' },
    { key: 'location', label: 'Storage Location', type: 'select', options: PM_LOCATIONS, allowNone: true },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional note', span: 'sm:col-span-2' },
  ],
  FG: [
    { key: 'sku', label: 'SKU', type: 'text', readOnly: true, hint: 'SKUs are permanent — production and dispatch history reference them' },
    { key: 'name', label: 'Product Name', type: 'text', required: true },
    { key: 'batchNumber', label: 'Batch Code', type: 'text' },
    { key: 'unit', label: 'Unit', type: 'select', options: FG_UNITS },
    { key: 'location', label: 'Storage Location', type: 'select', options: FG_LOCATIONS, allowNone: true },
    { key: 'mfgDate', label: 'MFG Date', type: 'date' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date', hint: 'Shelf life is recalculated from these two dates' },
    { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional note', span: 'sm:col-span-2' },
  ],
  RM_ISSUE: [
    { key: 'rmCode', label: 'RM Code', type: 'text', readOnly: true },
    { key: 'materialName', label: 'Material Name', type: 'text', readOnly: true },
    { key: 'batchNumber', label: 'Batch(es) Drawn', type: 'text', readOnly: true },
    { key: 'issuedStock', label: 'Issued Stock', type: 'number', readOnly: true, hint: LOCKED_QTY },
    { key: 'issueFor', label: 'Issue For (Target FG)', type: 'text', required: true, span: 'sm:col-span-2' },
    { key: 'issuedBy', label: 'Issued By', type: 'text' },
    { key: 'issuedDate', label: 'Issued Date', type: 'date' },
    { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional note', span: 'sm:col-span-2' },
  ],
  PRODUCTION: [
    { key: 'fgCode', label: 'FG Code', type: 'text', readOnly: true },
    { key: 'totalOutput', label: 'Total Output', type: 'number', readOnly: true, hint: LOCKED_QTY },
    { key: 'fgName', label: 'Product Name', type: 'text', required: true, span: 'sm:col-span-2' },
    { key: 'totalBatchesMade', label: 'Batches Made', type: 'number' },
    { key: 'wastage', label: 'Wastage', type: 'number' },
    { key: 'mfgDate', label: 'MFG Date', type: 'date' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'operator', label: 'Operator', type: 'text', span: 'sm:col-span-2' },
    { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional note', span: 'sm:col-span-2' },
  ],
  PM_ISSUE: [
    { key: 'pmCode', label: 'PM Code', type: 'text', readOnly: true },
    { key: 'pmName', label: 'Material Name', type: 'text', readOnly: true },
    { key: 'issuedQty', label: 'Issued Qty', type: 'number', readOnly: true, hint: LOCKED_QTY },
    { key: 'issueFor', label: 'Issue For (Target FG)', type: 'text', required: true },
    { key: 'issuedBy', label: 'Issued By', type: 'text' },
    { key: 'issuedDate', label: 'Issued Date', type: 'date' },
    { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional note', span: 'sm:col-span-2' },
  ],
  DISPATCH: [
    { key: 'skuCode', label: 'SKU Code', type: 'text', readOnly: true },
    { key: 'dispatchQty', label: 'Dispatch Qty', type: 'number', readOnly: true, hint: LOCKED_QTY },
    { key: 'productName', label: 'Product Name', type: 'text', required: true },
    { key: 'batchCode', label: 'Batch Code', type: 'text' },
    { key: 'partyName', label: 'Party / Buyer Name', type: 'text', required: true },
    { key: 'dispatchDate', label: 'Dispatch Date', type: 'date' },
    { key: 'location', label: 'Location', type: 'select', options: FG_LOCATIONS, allowNone: true },
    { key: 'coaStatus', label: 'CoA Status', type: 'select', options: COA_STATUS },
    { key: 'dispatchedBy', label: 'Dispatched By', type: 'text', span: 'sm:col-span-2' },
    { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional note', span: 'sm:col-span-2' },
  ],
};

const TITLES: Record<EntryType, string> = {
  RM_BATCH: 'Edit Raw Material Batch',
  PM: 'Edit Packaging Material',
  FG: 'Edit Finished Good',
  RM_ISSUE: 'Edit RM Issue Entry',
  PRODUCTION: 'Edit Production Log',
  PM_ISSUE: 'Edit Packaging Issue',
  DISPATCH: 'Edit Dispatch Entry',
};

const SUBTITLES: Record<EntryType, string> = {
  RM_BATCH: 'Correct the details of this arrival batch',
  PM: 'Update this packaging material record',
  FG: 'Update this finished good record',
  RM_ISSUE: 'Quantities are locked — only the details of the issue can change',
  PRODUCTION: 'Output is locked — only the run details can change',
  PM_ISSUE: 'Quantities are locked — only the details of the issue can change',
  DISPATCH: 'Quantity is locked — only the shipment details can change',
};

const ACCENTS: Record<EntryType, { icon: string; ring: string; button: string }> = {
  RM_BATCH: { icon: 'bg-emerald-500/10 border-emerald-500/30 text-[#1D9E75]', ring: 'focus:ring-[#1D9E75] focus:border-[#1D9E75]', button: 'bg-[#1D9E75] hover:bg-[#168361]' },
  PM: { icon: 'bg-blue-500/10 border-blue-500/30 text-blue-400', ring: 'focus:ring-blue-500 focus:border-blue-500', button: 'bg-blue-600 hover:bg-blue-700' },
  FG: { icon: 'bg-blue-500/10 border-blue-500/30 text-blue-400', ring: 'focus:ring-blue-500 focus:border-blue-500', button: 'bg-blue-600 hover:bg-blue-700' },
  RM_ISSUE: { icon: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', ring: 'focus:ring-[#1D9E75] focus:border-[#1D9E75]', button: 'bg-[#1D9E75] hover:bg-[#168361]' },
  PRODUCTION: { icon: 'bg-amber-500/10 border-amber-500/30 text-amber-400', ring: 'focus:ring-amber-500 focus:border-amber-500', button: 'bg-amber-600 hover:bg-amber-700' },
  PM_ISSUE: { icon: 'bg-purple-500/10 border-purple-500/30 text-purple-400', ring: 'focus:ring-purple-500 focus:border-purple-500', button: 'bg-purple-600 hover:bg-purple-700' },
  DISPATCH: { icon: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', ring: 'focus:ring-indigo-500 focus:border-indigo-500', button: 'bg-indigo-600 hover:bg-indigo-700' },
};

const asString = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const asDateInput = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '';
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

export default function EditEntryModal({ isOpen, type, record, onClose, onSuccess }: Props) {
  const fields = FIELDS[type];
  const accent = ACCENTS[type];

  const buildForm = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      next[f.key] = f.type === 'date' ? asDateInput(record?.[f.key]) : asString(record?.[f.key]);
    }
    return next;
  };

  const [form, setForm] = useState<Record<string, string>>(buildForm);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  // Refill when a different row is opened (render-time reset, no effect needed)
  const recordId = asString(record.id);
  if (loadedFor !== recordId + ':' + type) {
    setLoadedFor(recordId + ':' + type);
    setForm(buildForm());
    setError(null);
  }

  const setField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let res: { success: boolean; error?: string };

    if (type === 'RM_BATCH') {
      res = await updateRawMaterial(recordId, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        batchNumber: form.batchNumber.trim(),
        stock: num(form.stock),
        unit: form.unit,
        supplier: form.supplier.trim(),
        location: form.location,
        remarks: form.remarks,
        ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
      } as any);
    } else if (type === 'PM') {
      res = await updatePackagingMaterial(recordId, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        batchNumber: form.batchNumber.trim(),
        stock: num(form.stock),
        unit: form.unit,
        reorderLevel: num(form.reorderLevel),
        maxStock: numOrNull(form.maxStock) as number,
        supplier: form.supplier,
        location: form.location,
        remarks: form.remarks,
        ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
      } as any);
    } else if (type === 'FG') {
      res = await updateFinishedGood(recordId, {
        name: form.name.trim(),
        batchNumber: form.batchNumber.trim(),
        unit: form.unit,
        location: form.location,
        remarks: form.remarks,
        ...(form.mfgDate ? { mfgDate: form.mfgDate } : {}),
        ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
      });
    } else if (type === 'RM_ISSUE') {
      res = await updateRMIssue(recordId, {
        issueFor: form.issueFor,
        issuedBy: form.issuedBy,
        remarks: form.remarks,
        ...(form.issuedDate ? { issuedDate: form.issuedDate } : {}),
      });
    } else if (type === 'PRODUCTION') {
      res = await updateProductionLog(recordId, {
        fgName: form.fgName,
        totalBatchesMade: num(form.totalBatchesMade),
        wastage: num(form.wastage),
        operator: form.operator,
        remarks: form.remarks,
        ...(form.mfgDate ? { mfgDate: form.mfgDate } : {}),
        ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
      });
    } else if (type === 'PM_ISSUE') {
      res = await updatePackagingIssue(recordId, {
        issueFor: form.issueFor,
        issuedBy: form.issuedBy,
        remarks: form.remarks,
        ...(form.issuedDate ? { issuedDate: form.issuedDate } : {}),
      });
    } else {
      res = await updateDispatch(recordId, {
        productName: form.productName,
        batchCode: form.batchCode,
        partyName: form.partyName,
        coaStatus: form.coaStatus,
        dispatchedBy: form.dispatchedBy,
        remarks: form.remarks,
        location: form.location,
        ...(form.dispatchDate ? { dispatchDate: form.dispatchDate } : {}),
      });
    }

    setSaving(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to save changes');
    }
  };

  const inputCls =
    'w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 outline-none transition-all focus:ring-2 ' +
    accent.ring;
  const readOnlyCls =
    'w-full text-xs sm:text-sm p-2.5 bg-[#0B1524] border border-[#1E2F4A] rounded-lg text-slate-400 font-mono outline-none cursor-not-allowed';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2.5">
            <div className={'w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ' + accent.icon}>
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{TITLES[type]}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{SUBTITLES[type]}</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs sm:text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {fields.map((f) => (
              <div key={f.key} className={'min-w-0 ' + (f.span || '')}>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  {f.label}
                  {f.required && ' *'}
                  {f.readOnly && <Lock className="w-3 h-3 text-slate-500" />}
                </label>

                {f.readOnly ? (
                  <input className={readOnlyCls} value={form[f.key] || '—'} readOnly tabIndex={-1} />
                ) : f.type === 'select' ? (
                  <select
                    className={inputCls + ' font-medium'}
                    value={form[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                  >
                    {f.allowNone && (
                      <option value="" className="bg-[#162440] text-slate-400">
                        None
                      </option>
                    )}
                    {/* Keep a legacy value selectable even if it is not in the preset list */}
                    {form[f.key] !== '' && !f.options?.includes(form[f.key]) && (
                      <option value={form[f.key]} className="bg-[#162440] text-white">
                        {form[f.key]}
                      </option>
                    )}
                    {f.options?.map((o) => (
                      <option key={o} value={o} className="bg-[#162440] text-white">
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputCls}
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    min={f.type === 'number' ? 0 : undefined}
                    step={f.type === 'number' ? 'any' : undefined}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => {
                      if (f.type === 'number' && e.target.value !== '' && Number(e.target.value) < 0) return;
                      setField(f.key, e.target.value);
                    }}
                    required={f.required}
                  />
                )}

                {f.hint && <p className="text-[10px] text-slate-500 mt-1">{f.hint}</p>}
              </div>
            ))}
          </div>
        </form>

        <div className="flex justify-end gap-2 p-4 sm:p-5 border-t border-[#1E2F4A]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={'px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ' + accent.button}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
