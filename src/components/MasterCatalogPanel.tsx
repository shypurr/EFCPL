'use client';

import React, { useMemo, useState } from 'react';
import {
  Wheat,
  Boxes,
  Package,
  Search,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { archiveRawMaterialByCode, archivePackagingMaterial } from '@/actions/inventory';
import { archiveFinishedGood } from '@/actions/operations';

type CatalogType = 'RM' | 'PM' | 'FG';

/** Loose shape covering RawMaterial, PackagingMaterial and FinishedGood rows. */
interface CatalogRecord {
  id: string;
  code?: string;
  sku?: string;
  name: string;
  brand?: string | null;
  unit?: string;
  reorderLevel?: number;
  maxStock?: number | null;
  stock?: number;
  totalStock?: number;
  supplier?: string | null;
  location?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | Date | null;
  shelfLifeDays?: number | null;
}

interface CatalogRow {
  /** Identity used for selection + deletion: RM archives by code, PM/FG by row id */
  key: string;
  code: string;
  name: string;
  raw: CatalogRecord;
}

interface Column {
  label: string;
  align?: 'left' | 'right';
  render: (row: CatalogRecord) => React.ReactNode;
}

interface Props {
  rawMaterialMasters: CatalogRecord[];
  packagedMaterials: CatalogRecord[];
  finishedGoods: CatalogRecord[];
  onAddRm: () => void;
  onAddPm: () => void;
  onAddFg: () => void;
  onRefresh: () => void;
}

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? '—' : v;
const fmtDate = (v: string | Date | null | undefined) =>
  v ? new Date(v).toISOString().split('T')[0] : '—';

const TYPE_META: Record<
  CatalogType,
  {
    label: string;
    full: string;
    description: string;
    icon: React.ElementType;
    accent: string;
    border: string;
    hoverBorder: string;
    button: string;
    addLabel: string;
  }
> = {
  RM: {
    label: 'RM',
    full: 'Raw Materials',
    description: 'Master catalog of raw material SKUs — codes, units, and reorder levels',
    icon: Wheat,
    accent: 'text-[#1D9E75]',
    border: 'border-[#1D9E75]',
    hoverBorder: 'hover:border-[#1D9E75]',
    button: 'bg-[#1D9E75] hover:bg-[#168361]',
    addLabel: 'Add RM',
  },
  PM: {
    label: 'PM',
    full: 'Packaging Materials',
    description: 'Master catalog of bottles, jars, cartons, and packaging SKUs',
    icon: Boxes,
    accent: 'text-blue-400',
    border: 'border-blue-500',
    hoverBorder: 'hover:border-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
    addLabel: 'Add PM',
  },
  FG: {
    label: 'FG',
    full: 'Finished Goods',
    description: 'Master catalog of manufactured product SKUs and shelf-life rules',
    icon: Package,
    accent: 'text-violet-400',
    border: 'border-violet-500',
    hoverBorder: 'hover:border-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700',
    addLabel: 'Add FG',
  },
};

export default function MasterCatalogPanel({
  rawMaterialMasters,
  packagedMaterials,
  finishedGoods,
  onAddRm,
  onAddPm,
  onAddFg,
  onRefresh,
}: Props) {
  const [activeType, setActiveType] = useState<CatalogType | null>(null);
  const [search, setSearch] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<CatalogRow[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetListState = () => {
    setSearch('');
    setSelectMode(false);
    setSelectedKeys([]);
    setError(null);
  };

  const selectType = (type: CatalogType | null) => {
    setActiveType(type);
    resetListState();
  };

  // ----- Column definitions (defaults until final field list is confirmed) -----
  const columns: Record<CatalogType, Column[]> = {
    RM: [
      { label: 'Code', render: (r) => <span className="font-mono font-bold text-emerald-400">{r.code}</span> },
      { label: 'Material Name', render: (r) => <span className="font-semibold text-white">{r.name}</span> },
      { label: 'Brand Name', render: (r) => dash(r.brand) },
      { label: 'Unit', render: (r) => r.unit },
      { label: 'Reorder Level', align: 'right', render: (r) => <span className="font-mono">{r.reorderLevel}</span> },
      { label: 'Max Stock', align: 'right', render: (r) => <span className="font-mono">{dash(r.maxStock)}</span> },
      { label: 'Current Stock', align: 'right', render: (r) => <span className="font-mono text-slate-200">{r.totalStock ?? 0}</span> },
      { label: 'Default Supplier', render: (r) => dash(r.supplier) },
      { label: 'Default Location', render: (r) => dash(r.location) },
    ],
    PM: [
      { label: 'Code', render: (r) => <span className="font-mono font-bold text-blue-400">{r.code}</span> },
      { label: 'Material Name', render: (r) => <span className="font-semibold text-white">{r.name}</span> },
      { label: 'Brand / Type', render: (r) => dash(r.brand) },
      { label: 'Unit', render: (r) => r.unit },
      { label: 'Reorder Level', align: 'right', render: (r) => <span className="font-mono">{r.reorderLevel}</span> },
      { label: 'Max Stock', align: 'right', render: (r) => <span className="font-mono">{dash(r.maxStock)}</span> },
      { label: 'Current Stock', align: 'right', render: (r) => <span className="font-mono text-slate-200">{r.stock ?? 0}</span> },
      { label: 'Supplier', render: (r) => dash(r.supplier) },
      { label: 'Location', render: (r) => dash(r.location) },
    ],
    FG: [
      { label: 'SKU', render: (r) => <span className="font-mono font-bold text-violet-400">{r.sku}</span> },
      { label: 'Product Name', render: (r) => <span className="font-semibold text-white">{r.name}</span> },
      { label: 'Unit', render: (r) => r.unit },
      { label: 'Shelf Life (days)', align: 'right', render: (r) => <span className="font-mono">{dash(r.shelfLifeDays)}</span> },
      { label: 'Latest Batch', render: (r) => <span className="font-mono text-slate-400">{dash(r.batchNumber)}</span> },
      { label: 'Expiry', render: (r) => fmtDate(r.expiryDate) },
      { label: 'Current Stock', align: 'right', render: (r) => <span className="font-mono text-slate-200">{r.totalStock ?? 0}</span> },
      { label: 'Storage Location', render: (r) => dash(r.location) },
    ],
  };

  // ----- Normalise each source list into rows with a stable delete key -----
  const allRows: Record<CatalogType, CatalogRow[]> = useMemo(
    () => ({
      RM: rawMaterialMasters.map((m) => ({
        key: m.code ?? m.id,
        code: m.code ?? '',
        name: m.name,
        raw: m,
      })),
      PM: packagedMaterials.map((m) => ({
        key: m.id,
        code: m.code ?? '',
        name: m.name,
        raw: m,
      })),
      FG: finishedGoods.map((f) => ({
        key: f.id,
        code: f.sku ?? '',
        name: f.name,
        raw: f,
      })),
    }),
    [rawMaterialMasters, packagedMaterials, finishedGoods]
  );

  const rows = useMemo(() => {
    if (!activeType) return [];
    const term = search.trim().toLowerCase();
    const list = allRows[activeType];
    if (!term) return list;
    return list.filter(
      (r) => r.code.toLowerCase().includes(term) || r.name.toLowerCase().includes(term)
    );
  }, [activeType, allRows, search]);

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const visibleKeys = rows.map((r) => r.key);
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selectedKeys.includes(k));

  const toggleSelectAll = () => {
    setSelectedKeys(allVisibleSelected ? [] : visibleKeys);
  };

  const requestDeleteSelected = () => {
    const targets = rows.filter((r) => selectedKeys.includes(r.key));
    if (targets.length === 0) return;
    setPendingDelete(targets);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !activeType) return;
    setDeleting(true);
    setError(null);

    const failures: string[] = [];
    for (const row of pendingDelete) {
      const res =
        activeType === 'RM'
          ? await archiveRawMaterialByCode(row.code)
          : activeType === 'PM'
            ? await archivePackagingMaterial(row.key)
            : await archiveFinishedGood(row.key);

      if (!res.success) {
        failures.push(`${row.code}: ${res.error || 'failed'}`);
      }
    }

    setDeleting(false);
    setPendingDelete(null);
    setSelectedKeys([]);
    setSelectMode(false);

    if (failures.length > 0) {
      setError(`Could not delete ${failures.length} item(s) — ${failures.join('; ')}`);
    }

    onRefresh();
  };

  // ==========================================================
  // LEVEL 1 — type picker (RM / PM / FG)
  // ==========================================================
  if (!activeType) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#1D9E75]" /> Add Materials / Master Entry Hub
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Choose a catalog to view, add to, or clean up
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {(Object.keys(TYPE_META) as CatalogType[]).map((type) => {
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            return (
              <button
                key={type}
                onClick={() => selectType(type)}
                className={`text-left bg-[#0D1B2E] border border-[#1E2F4A] ${meta.hoverBorder} rounded-xl p-5 transition-all shadow-xs cursor-pointer group hover:bg-[#122038]`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2.5 ${meta.accent}`}>
                    <Icon className="w-6 h-6" />
                    <span className="text-xl font-bold">{meta.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{meta.full}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{meta.description}</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500">
                  {allRows[type].length} item{allRows[type].length === 1 ? '' : 's'} in catalog
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================================
  // LEVEL 2 — catalog list for the chosen type
  // ==========================================================
  const meta = TYPE_META[activeType];
  const Icon = meta.icon;
  const cols = columns[activeType];
  const onAdd = activeType === 'RM' ? onAddRm : activeType === 'PM' ? onAddPm : onAddFg;
  const colSpan = cols.length + (selectMode ? 2 : 1);

  return (
    <div className="space-y-4">
      {/* Type switcher */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(TYPE_META) as CatalogType[]).map((type) => {
          const m = TYPE_META[type];
          const TypeIcon = m.icon;
          const active = type === activeType;
          return (
            <button
              key={type}
              onClick={() => selectType(type)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                active
                  ? `bg-[#162440] ${m.border} ${m.accent}`
                  : 'bg-[#0D1B2E] border-[#1E2F4A] text-slate-400 hover:text-white hover:bg-[#162440]'
              }`}
            >
              <TypeIcon className="w-4 h-4" /> {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Icon className={`w-5 h-5 ${meta.accent}`} /> {meta.full} Catalog
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{meta.description}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-start gap-2.5 text-red-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-xs flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toolbar: search on the left, add + delete on the right */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
            placeholder={`Search ${meta.label} by code or name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onAdd}
            className={`${meta.button} text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer`}
          >
            <Plus className="w-4 h-4" /> {meta.addLabel}
          </button>

          {selectMode ? (
            <>
              <button
                onClick={requestDeleteSelected}
                disabled={selectedKeys.length === 0}
                className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900/40 disabled:text-red-300/50 disabled:cursor-not-allowed text-white transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Selected ({selectedKeys.length})
              </button>
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelectedKeys([]);
                }}
                className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-red-400 bg-[#162440] hover:bg-red-500/15 border border-red-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete {meta.label}
            </button>
          )}
        </div>
      </div>

      {/* Catalog table */}
      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                {selectMode && (
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-red-500 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                )}
                {cols.map((c) => (
                  <th key={c.label} className={`p-3 ${c.align === 'right' ? 'text-right' : ''}`}>
                    {c.label}
                  </th>
                ))}
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="p-8 text-center text-slate-500">
                    {search
                      ? `No ${meta.label} found matching "${search}".`
                      : `No ${meta.full.toLowerCase()} registered yet. Use "${meta.addLabel}" to create the first one.`}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const checked = selectedKeys.includes(row.key);
                  return (
                    <tr
                      key={row.key}
                      className={`transition-all ${checked ? 'bg-red-500/10' : 'hover:bg-[#162440]/50'}`}
                    >
                      {selectMode && (
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleKey(row.key)}
                            className="w-4 h-4 accent-red-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {cols.map((c) => (
                        <td key={c.label} className={`p-3 ${c.align === 'right' ? 'text-right' : ''}`}>
                          {c.render(row.raw)}
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setPendingDelete([row])}
                          className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                          title={`Delete ${row.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-start gap-3 p-5 border-b border-[#1E2F4A]">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  Delete {pendingDelete.length} {meta.label}
                  {pendingDelete.length === 1 ? '' : 's'}?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  This removes them from every list and blocks all future entries. Existing issue,
                  production, and dispatch records are kept for history and audit.
                </p>
              </div>
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-56 overflow-y-auto space-y-1.5">
              {pendingDelete.map((row) => {
                const stock =
                  activeType === 'PM' ? row.raw.stock ?? 0 : row.raw.totalStock ?? 0;
                return (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-3 bg-[#162440] border border-[#2A3F66] rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-slate-200">{row.code}</span>
                      <span className="text-slate-400 text-xs ml-2 truncate">{row.name}</span>
                    </div>
                    {stock > 0 && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                        {stock} in stock
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-[#1E2F4A]">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
