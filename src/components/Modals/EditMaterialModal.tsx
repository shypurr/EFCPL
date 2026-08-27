'use client';

import React, { useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { updateRawMaterialMasterByCode, updatePackagingMaterial } from '@/actions/inventory';
import { updateFinishedGood } from '@/actions/operations';

export type CatalogType = 'RM' | 'PM' | 'FG';

interface FieldSpec {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  options?: string[];
  hint?: string;
  span?: string;
}

interface Props {
  isOpen: boolean;
  type: CatalogType;
  /** The catalog row being edited (master record for RM, the row itself for PM/FG) */
  record: Record<string, unknown> | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RM_UNITS = ['KG', 'Units', 'Boxes', 'GM', 'LTR', 'ML', 'BAGS'];
const PM_UNITS = ['Units', 'Boxes', 'Rolls', 'KG'];
const FG_UNITS = ['KG', 'Units', 'Boxes', 'Jars'];

const RM_LOCATIONS = ['RM Store A', 'Cold Storage 1', 'Dry Warehouse'];
const PM_LOCATIONS = ['PM Warehouse', 'Packaging Bay 1', 'Dry Storage B'];
const FG_LOCATIONS = ['Cold Store Zone A', 'Deep Freezer 2', 'FG Bay 1', 'Dry Warehouse'];

const FIELDS: Record<CatalogType, FieldSpec[]> = {
  RM: [
    {
      key: 'code',
      label: 'Code',
      type: 'text',
      readOnly: true,
      hint: 'Codes are permanent — issue and production history references them',
    },
    { key: 'name', label: 'Material Name', type: 'text', required: true, placeholder: 'e.g. Coriander Powder' },
    { key: 'brand', label: 'Brand Name', type: 'text', placeholder: 'e.g. Everest / MDH' },
    { key: 'unit', label: 'Unit', type: 'select', required: true, options: RM_UNITS },
    { key: 'reorderLevel', label: 'Reorder Level', type: 'number', required: true, placeholder: 'e.g. 50' },
    { key: 'maxStock', label: 'Max Stock Level', type: 'number', placeholder: 'e.g. 500' },
    {
      key: 'supplier',
      label: 'Default Supplier Name',
      type: 'text',
      placeholder: 'e.g. ABC Agro Pune',
      span: 'sm:col-span-2',
    },
    { key: 'location', label: 'Default Storage Location', type: 'select', options: RM_LOCATIONS },
  ],
  PM: [
    {
      key: 'code',
      label: 'Code',
      type: 'text',
      readOnly: true,
      hint: 'Codes are permanent — packaging issue history references them',
    },
    { key: 'name', label: 'Material Name', type: 'text', required: true, placeholder: 'e.g. 500ml PET Bottle' },
    { key: 'brand', label: 'Brand / Type', type: 'text', placeholder: 'e.g. Amber Glass' },
    { key: 'unit', label: 'Unit', type: 'select', options: PM_UNITS },
    { key: 'reorderLevel', label: 'Reorder Level', type: 'number', required: true, placeholder: 'e.g. 500' },
    { key: 'maxStock', label: 'Max Stock Level', type: 'number', placeholder: 'e.g. 5000' },
    {
      key: 'supplier',
      label: 'Supplier Name',
      type: 'text',
      placeholder: 'e.g. Pune Packaging Co',
      span: 'sm:col-span-2',
    },
    { key: 'location', label: 'Storage Location', type: 'select', options: PM_LOCATIONS },
  ],
  FG: [
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      readOnly: true,
      hint: 'SKUs are permanent — production and dispatch history references them',
    },
    { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. Mango Pickle 500g' },
    { key: 'unit', label: 'Unit', type: 'select', options: FG_UNITS },
    { key: 'location', label: 'Storage Location', type: 'select', options: FG_LOCATIONS, span: 'sm:col-span-2' },
  ],
};

const TITLES: Record<CatalogType, string> = {
  RM: 'Edit Raw Material (Master)',
  PM: 'Edit Packaging Material',
  FG: 'Edit Finished Good',
};

const SUBTITLES: Record<CatalogType, string> = {
  RM: 'Changes to name, brand, unit and levels apply to every batch of this code',
  PM: 'Update catalog details for this packaging SKU',
  FG: 'Update catalog details for this product SKU',
};

const ACCENTS: Record<CatalogType, { icon: string; ring: string; button: string }> = {
  RM: {
    icon: 'bg-emerald-500/10 border-emerald-500/30 text-[#1D9E75]',
    ring: 'focus:ring-[#1D9E75] focus:border-[#1D9E75]',
    button: 'bg-[#1D9E75] hover:bg-[#168361]',
  },
  PM: {
    icon: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    ring: 'focus:ring-blue-500 focus:border-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  FG: {
    icon: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    ring: 'focus:ring-violet-500 focus:border-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700',
  },
};

const asString = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export default function EditMaterialModal({ isOpen, type, record, onClose, onSuccess }: Props) {
  const fields = FIELDS[type];
  const accent = ACCENTS[type];

  const buildForm = () => {
    const next: Record<string, string> = {};
    for (const f of fields) next[f.key] = asString(record?.[f.key]);
    return next;
  };

  const [form, setForm] = useState<Record<string, string>>(buildForm);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  // Refill the form when a different row is opened (render-time reset, no effect needed)
  const recordId = asString(record.id);
  if (loadedFor !== recordId) {
    setLoadedFor(recordId);
    setForm(buildForm());
    setError(null);
  }

  const setField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let res: { success: boolean; error?: string };

    if (type === 'RM') {
      res = await updateRawMaterialMasterByCode(asString(record.code), {
        name: form.name,
        brand: form.brand,
        unit: form.unit,
        reorderLevel: Number(form.reorderLevel),
        maxStock: numOrNull(form.maxStock),
        supplier: form.supplier,
        location: form.location,
      });
    } else if (type === 'PM') {
      res = await updatePackagingMaterial(recordId, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        unit: form.unit,
        reorderLevel: Number(form.reorderLevel),
        maxStock: numOrNull(form.maxStock) as number,
        supplier: form.supplier.trim(),
        location: form.location,
      });
    } else {
      res = await updateFinishedGood(recordId, {
        name: form.name.trim(),
        unit: form.unit,
        location: form.location,
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
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white">
        <div className="p-4 sm:p-5 border-b border-[#1E2F4A] flex items-center justify-between sticky top-0 bg-[#0D1B2E] z-10">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${accent.icon}`}
            >
              <Pencil className="w-4 h-4" />
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs text-red-300">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {fields.map((f) => (
              <div key={f.key} className={`min-w-0 ${f.span || ''}`}>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {f.label}
                  {f.required && ' *'}
                </label>

                {f.readOnly ? (
                  <input className={readOnlyCls} value={form[f.key]} readOnly tabIndex={-1} />
                ) : f.type === 'select' ? (
                  <select
                    className={`${inputCls} font-medium`}
                    value={form[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                  >
                    {/* Keep an existing legacy value selectable even if it is not in the preset list */}
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
                    type={f.type === 'number' ? 'number' : 'text'}
                    min={f.type === 'number' ? 0 : undefined}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
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
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${accent.button}`}
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
