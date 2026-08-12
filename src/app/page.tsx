'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Topbar from '@/components/Topbar';

// Actions
import { getRawMaterials, deleteRawMaterial } from '@/actions/raw-materials';
import { getFinishedGoods, deleteFinishedGood } from '@/actions/finished-goods';
import { getPackagingMaterials, deletePackagingMaterial } from '@/actions/packaging';
import { getMovements } from '@/actions/movements';
import { getSystemLookups, getStorageLocations } from '@/actions/lookups';
import { getPurchaseOrderSuggestions } from '@/actions/po-suggestions';
import { getReportsData } from '@/actions/reports';
import { getCurrentUser, logoutUser, getUsers, deleteUser } from '@/actions/auth';
import { getRoles, getPermissions, deleteRole } from '@/actions/roles';

// Modals
import AddRawMaterialModal from '@/components/Modals/AddRawMaterialModal';
import AddFinishedGoodModal from '@/components/Modals/AddFinishedGoodModal';
import AddPackagingModal from '@/components/Modals/AddPackagingModal';
import GRNModal from '@/components/Modals/GRNModal';
import IssueModal from '@/components/Modals/IssueModal';
import DispatchModal from '@/components/Modals/DispatchModal';
import AddLookupModal from '@/components/Modals/AddLookupModal';
import LoginModal from '@/components/LoginModal';
import RoleManagerModal from '@/components/Admin/RoleManagerModal';
import UserManagerModal from '@/components/Admin/UserManagerModal';

export default function Home() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // User Session & RBAC
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Data states
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [packaging, setPackaging] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [poSuggestions, setPoSuggestions] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);

  // Lookups
  const [units, setUnits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [coaStatuses, setCoaStatuses] = useState<any[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<any[]>([]);
  const [tempConditions, setTempConditions] = useState<any[]>([]);

  // Search & Filter
  const [rmSearch, setRmSearch] = useState('');
  const [rmStatusFilter, setRmStatusFilter] = useState('');
  const [fgSearch, setFgSearch] = useState('');
  const [pmSearch, setPmSearch] = useState('');

  // Modals state
  const [modalRm, setModalRm] = useState(false);
  const [modalFg, setModalFg] = useState(false);
  const [modalPm, setModalPm] = useState(false);
  const [modalGrn, setModalGrn] = useState(false);
  const [modalIssue, setModalIssue] = useState(false);
  const [modalDispatch, setModalDispatch] = useState(false);
  const [modalLookup, setModalLookup] = useState(false);
  const [modalLogin, setModalLogin] = useState(false);
  const [modalRole, setModalRole] = useState(false);
  const [modalUser, setModalUser] = useState(false);

  // Reports tabs
  const [reportTab, setReportTab] = useState<'summary' | 'valuation' | 'consumption' | 'aging'>('summary');
  const [movementTab, setMovementTab] = useState<'grn' | 'issue'>('grn');
  const [adminTab, setAdminTab] = useState<'users' | 'roles' | 'lookups'>('roles');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      userRes,
      usersRes,
      rolesRes,
      permsRes,
      rmRes,
      fgRes,
      pmRes,
      mvRes,
      unitRes,
      locRes,
      coaRes,
      pkgTypeRes,
      tempRes,
      poRes,
      rptRes,
    ] = await Promise.all([
      getCurrentUser(),
      getUsers(),
      getRoles(),
      getPermissions(),
      getRawMaterials(rmSearch, rmStatusFilter),
      getFinishedGoods(fgSearch),
      getPackagingMaterials(pmSearch),
      getMovements(20),
      getSystemLookups('UNIT'),
      getStorageLocations(),
      getSystemLookups('COA_STATUS'),
      getSystemLookups('PACKAGING_TYPE'),
      getSystemLookups('TEMP_CONDITION'),
      getPurchaseOrderSuggestions(),
      getReportsData(),
    ]);

    if (userRes) setCurrentUser(userRes);
    if (usersRes.success) setUsersList(usersRes.data);
    if (rolesRes.success) setRolesList(rolesRes.data);
    if (permsRes.success) setPermissionsList(permsRes.data);
    if (rmRes.success) setRawMaterials(rmRes.data);
    if (fgRes.success) setFinishedGoods(fgRes.data);
    if (pmRes.success) setPackaging(pmRes.data);
    if (mvRes.success) setMovements(mvRes.data);
    if (unitRes.success) setUnits(unitRes.data);
    if (locRes.success) setLocations(locRes.data);
    if (coaRes.success) setCoaStatuses(coaRes.data);
    if (pkgTypeRes.success) setPackagingTypes(pkgTypeRes.data);
    if (tempRes.success) setTempConditions(tempRes.data);
    if (poRes.success) setPoSuggestions(poRes.data);
    if (rptRes.success) setReportsData(rptRes.data);

    setLoading(false);
  }, [rmSearch, rmStatusFilter, fgSearch, pmSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    loadData();
  };

  // Compute live alerts
  const computeAlerts = () => {
    const alerts: any[] = [];
    const today = new Date();

    rawMaterials.forEach((r) => {
      if (r.qty <= r.reorderLevel) {
        alerts.push({
          type: 'critical',
          title: `Low Stock: ${r.name}`,
          desc: `Stock: ${r.qty} ${r.unit} | Reorder Level: ${r.reorderLevel} ${r.unit} | Supplier: ${r.supplierName || '—'}`,
          cat: 'Raw Material',
        });
      }

      if (r.expiryDate) {
        const diffDays = Math.ceil((new Date(r.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30 && diffDays >= 0) {
          alerts.push({
            type: 'critical',
            title: `Expiring Soon: ${r.name}`,
            desc: `Expires in ${diffDays} days (${new Date(r.expiryDate).toISOString().split('T')[0]}) | Batch: ${r.batchNumber || '—'}`,
            cat: 'Raw Material',
          });
        }
      }

      if (r.coaStatus === 'Pending') {
        alerts.push({
          type: 'warning',
          title: `CoA Pending: ${r.name}`,
          desc: `Batch ${r.batchNumber || '—'} awaiting CoA approval`,
          cat: 'Raw Material',
        });
      }
    });

    finishedGoods.forEach((f) => {
      const stock = f.qtyProduced - f.qtyDispatched;
      if (stock <= 0) return;
      const diffDays = Math.ceil((new Date(f.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30 && diffDays >= 0) {
        alerts.push({
          type: 'critical',
          title: `FG Near Expiry: ${f.name}`,
          desc: `${stock} units expire in ${diffDays} days (${new Date(f.expiryDate).toISOString().split('T')[0]}) | Batch: ${f.batchNumber}`,
          cat: 'Finished Goods',
        });
      }

      const free = stock - f.qtyReserved;
      if (free < 0) {
        alerts.push({
          type: 'critical',
          title: `Overcommitted: ${f.name}`,
          desc: `Reserved: ${f.qtyReserved} | Available: ${stock} | Shortfall: ${Math.abs(free)} units`,
          cat: 'Finished Goods',
        });
      }
    });

    packaging.forEach((p) => {
      if (p.qty <= p.reorderLevel) {
        alerts.push({
          type: 'warning',
          title: `Low Packaging: ${p.description}`,
          desc: `Stock: ${p.qty} ${p.unit} | Reorder Level: ${p.reorderLevel} | Supplier: ${p.supplier || '—'}`,
          cat: 'Packaging',
        });
      }
    });

    return alerts;
  };

  const activeAlerts = computeAlerts();

  // Delete handlers
  const handleDeleteRM = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteRawMaterial(id);
      loadData();
    }
  };

  const handleDeleteFG = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteFinishedGood(id);
      loadData();
    }
  };

  const handleDeletePM = async (id: string, desc: string) => {
    if (confirm(`Are you sure you want to delete ${desc}?`)) {
      await deletePackagingMaterial(id);
      loadData();
    }
  };

  const handleDeleteRoleItem = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete custom role "${name}"?`)) {
      const res = await deleteRole(id);
      if (res.success) {
        alert(`✅ Role "${name}" deleted.`);
        loadData();
      } else {
        alert('❌ Error: ' + res.error);
      }
    }
  };

  const handleDeleteUserItem = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete staff account "${name}"?`)) {
      const res = await deleteUser(id);
      if (res.success) {
        alert(`✅ Staff account "${name}" deleted.`);
        loadData();
      } else {
        alert('❌ Error: ' + res.error);
      }
    }
  };

  // Summary stats
  const totalRMValuation = rawMaterials.reduce((s, r) => s + r.qty * (r.lastPurchaseRate || 0), 0);
  const totalFGStock = finishedGoods.reduce((s, f) => s + (f.qtyProduced - f.qtyDispatched), 0);
  const lowRMCount = rawMaterials.filter((r) => r.qty <= r.reorderLevel).length;

  const panelTitles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    'alerts-panel': 'Alerts & Notifications',
    'raw-materials': 'Raw Materials Master',
    'finished-goods': 'Finished Goods Master',
    packaging: 'Packaging Materials',
    movements: 'GRN & Stock Issues Log',
    'purchase-orders': 'Purchase Order Suggestions',
    reports: 'Reports & Analytics',
    settings: 'Admin User & Role Governance',
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* DESKTOP SIDEBAR */}
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} alertCount={activeAlerts.length} />

      {/* MOBILE NAV BAR */}
      <MobileNav activePanel={activePanel} setActivePanel={setActivePanel} alertCount={activeAlerts.length} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen pb-16 md:pb-0">
        <Topbar
          title={panelTitles[activePanel] || activePanel}
          alertCount={activeAlerts.length}
          currentUser={currentUser}
          onAlertClick={() => setActivePanel('alerts-panel')}
          onRefresh={loadData}
          onLoginClick={() => setModalLogin(true)}
          onLogoutClick={handleLogout}
        />

        <main className="p-4 md:p-7 flex-1">
          {/* ========================================== */}
          {/* 1. DASHBOARD PANEL */}
          {/* ========================================== */}
          {activePanel === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Good day, {currentUser ? currentUser.name : 'EFCPL Team'}! 👋
                  </h1>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
                >
                  ⟳ Refresh Data
                </button>
              </div>

              {/* STATS ROW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-t-4 border-t-emerald-500">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Raw Materials</div>
                  <div className="text-2xl font-bold text-slate-900 font-mono">{rawMaterials.length}</div>
                  <div className="text-xs text-amber-600 font-medium mt-1">{lowRMCount} below reorder level</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-t-4 border-t-blue-500">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Finished Goods</div>
                  <div className="text-2xl font-bold text-slate-900 font-mono">{totalFGStock.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">{finishedGoods.length} active SKUs</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-t-4 border-t-amber-500">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Alerts</div>
                  <div className="text-2xl font-bold text-slate-900 font-mono">{activeAlerts.length}</div>
                  <div className="text-xs text-red-500 font-medium mt-1">Requiring immediate action</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-t-4 border-t-red-500">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RM Valuation</div>
                  <div className="text-2xl font-bold text-slate-900 font-mono">₹{(totalRMValuation / 100000).toFixed(2)}L</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Current stock value</div>
                </div>
              </div>

              {/* TWO COLUMN GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LOW STOCK TABLE */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>⚠️ Low Stock — Raw Materials</span>
                    <span className="text-[10px] font-normal text-slate-500">Auto-evaluated</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5">Stock</th>
                          <th className="p-2.5">Reorder</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rawMaterials.filter((r) => r.qty <= r.reorderLevel).length > 0 ? (
                          rawMaterials
                            .filter((r) => r.qty <= r.reorderLevel)
                            .map((r) => {
                              const pct = Math.round((r.qty / r.reorderLevel) * 100);
                              return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-bold">{r.name}</td>
                                  <td className="p-2.5 font-mono">{r.qty} {r.unit}</td>
                                  <td className="p-2.5 font-mono">{r.reorderLevel} {r.unit}</td>
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pct <= 50 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {pct <= 50 ? 'Critical' : 'Low'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                              ✅ All stock levels OK
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NEAR EXPIRY TABLE */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>📦 Near-Expiry — Finished Goods</span>
                    <span className="text-[10px] font-normal text-slate-500">Sorted by expiry</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Product</th>
                          <th className="p-2.5">Batch</th>
                          <th className="p-2.5">Expiry</th>
                          <th className="p-2.5">Days Left</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {finishedGoods.filter((f) => {
                          const diff = Math.ceil((new Date(f.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          return diff <= 60 && diff >= 0 && f.qtyProduced - f.qtyDispatched > 0;
                        }).length > 0 ? (
                          finishedGoods
                            .filter((f) => {
                              const diff = Math.ceil((new Date(f.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                              return diff <= 60 && diff >= 0 && f.qtyProduced - f.qtyDispatched > 0;
                            })
                            .map((f) => {
                              const diff = Math.ceil((new Date(f.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                              return (
                                <tr key={f.id} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-bold">{f.name}</td>
                                  <td className="p-2.5 font-mono">{f.batchNumber}</td>
                                  <td className="p-2.5 font-mono">{new Date(f.expiryDate).toISOString().split('T')[0]}</td>
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diff <= 30 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {diff}d
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                              ✅ No near-expiry items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RECENT MOVEMENTS LOG */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                  🕐 Recent Movements (Last 10 Records)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Party / Source</th>
                        <th className="p-2.5">Ref No.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements.slice(0, 10).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono">{new Date(m.movementDate).toISOString().split('T')[0]}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.type === 'GRN' ? 'bg-emerald-100 text-emerald-800' : m.type === 'ISSUE' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium">{m.itemTitle}</td>
                          <td className="p-2.5 font-mono font-bold">{m.type === 'GRN' ? `+${m.qty}` : `-${m.qty}`} {m.unit}</td>
                          <td className="p-2.5 text-slate-600">{m.party || '—'}</td>
                          <td className="p-2.5 font-mono text-slate-500">{m.refNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 2. ALERTS PANEL */}
          {/* ========================================== */}
          {activePanel === 'alerts-panel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">🔔 Alerts & Notifications</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Active automated rules requiring operational attention</p>
                </div>
              </div>

              {activeAlerts.length > 0 ? (
                <div className="space-y-3">
                  {activeAlerts.map((a, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-2xs ${
                        a.type === 'critical'
                          ? 'bg-red-50/80 border-red-200 text-red-950'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}
                    >
                      <span className="text-base">{a.type === 'critical' ? '🔴' : '🟡'}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{a.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">{a.desc}</div>
                        <div className="mt-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                            {a.cat}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="font-bold text-slate-800 text-base">No Active Alerts</div>
                  <p className="text-xs text-slate-500 mt-1">All stock levels, expiration windows, and CoA certifications are compliant.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 3. RAW MATERIALS PANEL */}
          {/* ========================================== */}
          {activePanel === 'raw-materials' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">🌾 Raw Materials</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Stock tracking, GRN inward, reorder level management</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalGrn(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
                  >
                    + GRN Entry
                  </button>
                  <button
                    onClick={() => setModalRm(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-2xs"
                  >
                    + Add Material
                  </button>
                </div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Search material code, name..."
                  className="text-xs p-2 border border-slate-300 rounded-lg w-60 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={rmSearch}
                  onChange={(e) => setRmSearch(e.target.value)}
                />
                <select
                  className="text-xs p-2 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  value={rmStatusFilter}
                  onChange={(e) => setRmStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="OK">OK</option>
                  <option value="Overstocked">Overstocked</option>
                </select>
              </div>

              {/* RAW MATERIALS TABLE */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Grade</th>
                        <th className="p-2.5">Stock</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Reorder</th>
                        <th className="p-2.5">Max</th>
                        <th className="p-2.5">Supplier</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5">CoA</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawMaterials.map((r) => {
                        const status = r.qty <= r.reorderLevel ? 'Low Stock' : r.maxStock && r.qty >= r.maxStock ? 'Overstocked' : 'OK';
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-mono"><span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">{r.code}</span></td>
                            <td className="p-2.5 font-bold text-slate-900">{r.name}</td>
                            <td className="p-2.5 text-slate-500">{r.grade || '—'}</td>
                            <td className="p-2.5 font-mono font-bold">{r.qty}</td>
                            <td className="p-2.5">{r.unit}</td>
                            <td className="p-2.5 font-mono text-slate-600">{r.reorderLevel}</td>
                            <td className="p-2.5 font-mono text-slate-600">{r.maxStock || '—'}</td>
                            <td className="p-2.5 text-slate-600">{r.supplierName || '—'}</td>
                            <td className="p-2.5 text-slate-500 text-[11px]">{r.location?.name || '—'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.coaStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {r.coaStatus}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status === 'Low Stock' ? 'bg-red-100 text-red-800' : status === 'Overstocked' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleDeleteRM(r.id, r.name)}
                                className="text-red-500 hover:text-red-700 p-1 text-xs"
                                title="Delete"
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 4. FINISHED GOODS PANEL */}
          {/* ========================================== */}
          {activePanel === 'finished-goods' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">📦 Finished Goods</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Production batches, dispatch, cold storage aging</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalDispatch(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
                  >
                    🚚 Dispatch
                  </button>
                  <button
                    onClick={() => setModalFg(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-2xs"
                  >
                    + Add Product
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search SKU, Product Name..."
                  className="text-xs p-2 border border-slate-300 rounded-lg w-60 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={fgSearch}
                  onChange={(e) => setFgSearch(e.target.value)}
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5">Batch</th>
                        <th className="p-2.5">Produced</th>
                        <th className="p-2.5">Dispatched</th>
                        <th className="p-2.5">In Stock</th>
                        <th className="p-2.5">Reserved</th>
                        <th className="p-2.5">Free Stock</th>
                        <th className="p-2.5">Expiry</th>
                        <th className="p-2.5">Days Left</th>
                        <th className="p-2.5">Temp Condition</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finishedGoods.map((f) => {
                        const stock = f.qtyProduced - f.qtyDispatched;
                        const free = stock - f.qtyReserved;
                        const diffDays = Math.ceil((new Date(f.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={f.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-mono"><span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">{f.sku}</span></td>
                            <td className="p-2.5 font-bold text-slate-900">{f.name}</td>
                            <td className="p-2.5 font-mono text-slate-600">{f.batchNumber}</td>
                            <td className="p-2.5 font-mono">{f.qtyProduced}</td>
                            <td className="p-2.5 font-mono text-slate-600">{f.qtyDispatched}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">{stock} {f.unit}</td>
                            <td className="p-2.5 font-mono text-slate-500">{f.qtyReserved}</td>
                            <td className="p-2.5 font-mono font-bold">{free >= 0 ? free : <span className="text-red-600">{free}</span>}</td>
                            <td className="p-2.5 font-mono text-slate-600">{new Date(f.expiryDate).toISOString().split('T')[0]}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diffDays <= 30 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {diffDays}d
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 text-[11px]">{f.tempCondition || 'Ambient'}</td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleDeleteFG(f.id, f.name)}
                                className="text-red-500 hover:text-red-700 p-1 text-xs"
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 5. PACKAGING PANEL */}
          {/* ========================================== */}
          {activePanel === 'packaging' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">🏷️ Packaging Materials</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Cartons, labels, pouches, bottles, shrink wraps</p>
                </div>
                <button
                  onClick={() => setModalPm(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-2xs self-start"
                >
                  + Add Packaging
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search packaging description, code..."
                  className="text-xs p-2 border border-slate-300 rounded-lg w-60 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={pmSearch}
                  onChange={(e) => setPmSearch(e.target.value)}
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Specification</th>
                        <th className="p-2.5">Stock</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Linked SKUs</th>
                        <th className="p-2.5">Supplier</th>
                        <th className="p-2.5">MOQ</th>
                        <th className="p-2.5">Rate (₹)</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {packaging.map((p) => {
                        const low = p.qty <= p.reorderLevel;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-mono"><span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">{p.code}</span></td>
                            <td className="p-2.5"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">{p.type}</span></td>
                            <td className="p-2.5 font-bold text-slate-900">{p.description}</td>
                            <td className="p-2.5 text-slate-500 max-w-[150px] truncate">{p.specification || '—'}</td>
                            <td className="p-2.5 font-mono font-bold">{p.qty}</td>
                            <td className="p-2.5">{p.unit}</td>
                            <td className="p-2.5 text-slate-500 text-[11px]">{p.linkedSkus || '—'}</td>
                            <td className="p-2.5 text-slate-600">{p.supplier || '—'}</td>
                            <td className="p-2.5 font-mono text-slate-600">{p.moq || '—'}</td>
                            <td className="p-2.5 font-mono text-slate-900 font-bold">₹{p.lastPurchaseRate || 0}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${low ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {low ? 'Low Stock' : 'OK'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleDeletePM(p.id, p.description)}
                                className="text-red-500 hover:text-red-700 p-1 text-xs"
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 6. MOVEMENTS PANEL */}
          {/* ========================================== */}
          {activePanel === 'movements' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">🔄 GRN & Material Issues</h1>
                  <p className="text-xs text-slate-500 mt-0.5">All inward and outward stock movements</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalIssue(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs"
                  >
                    ↓ Issue Material
                  </button>
                  <button
                    onClick={() => setModalGrn(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-2xs"
                  >
                    + New GRN
                  </button>
                </div>
              </div>

              {/* TABS */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setMovementTab('grn')}
                  className={`pb-2 text-xs font-bold border-b-2 px-1 transition-all ${
                    movementTab === 'grn' ? 'border-[#1D9E75] text-[#1D9E75]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  GRN (Inward)
                </button>
                <button
                  onClick={() => setMovementTab('issue')}
                  className={`pb-2 text-xs font-bold border-b-2 px-1 transition-all ${
                    movementTab === 'issue' ? 'border-[#1D9E75] text-[#1D9E75]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Material Issues (Outward)
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Ref No.</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">{movementTab === 'grn' ? 'Supplier' : 'Issued To'}</th>
                        <th className="p-2.5">{movementTab === 'grn' ? 'Invoice / Batch' : 'Remarks'}</th>
                        <th className="p-2.5">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements
                        .filter((m) => (movementTab === 'grn' ? m.type === 'GRN' : m.type === 'ISSUE'))
                        .map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-mono font-bold text-slate-900">{m.refNumber}</td>
                            <td className="p-2.5 font-mono text-slate-600">{new Date(m.movementDate).toISOString().split('T')[0]}</td>
                            <td className="p-2.5"><span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">{m.category}</span></td>
                            <td className="p-2.5 font-bold text-slate-900">{m.itemTitle}</td>
                            <td className="p-2.5 font-mono font-bold">{m.qty}</td>
                            <td className="p-2.5">{m.unit}</td>
                            <td className="p-2.5 text-slate-600">{m.party || '—'}</td>
                            <td className="p-2.5 font-mono text-slate-500">{m.invoiceRef || m.remarks || '—'}</td>
                            <td className="p-2.5 text-slate-500">{m.performedBy}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 7. PURCHASE ORDERS PANEL */}
          {/* ========================================== */}
          {activePanel === 'purchase-orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">🛒 Purchase Order Suggestions</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Auto-generated recommendations based on dynamic reorder points</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-2xs"
                >
                  ⟳ Refresh Suggestions
                </button>
              </div>

              {poSuggestions.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium">
                    ⚠️ {poSuggestions.length} item(s) require replenishment based on current stock vs. reorder levels.
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5">Current Stock</th>
                          <th className="p-2.5">Reorder Level</th>
                          <th className="p-2.5">Suggested Order</th>
                          <th className="p-2.5">Supplier</th>
                          <th className="p-2.5">Lead Time</th>
                          <th className="p-2.5">Est. Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {poSuggestions.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50">
                            <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[10px]">{po.category}</span></td>
                            <td className="p-2.5 font-mono">{po.code}</td>
                            <td className="p-2.5 font-bold text-slate-900">{po.name}</td>
                            <td className="p-2.5 font-mono text-red-600 font-bold">{po.qty} {po.unit}</td>
                            <td className="p-2.5 font-mono">{po.reorderLevel} {po.unit}</td>
                            <td className="p-2.5 font-mono font-bold text-[#1D9E75]">{po.suggestQty} {po.unit}</td>
                            <td className="p-2.5 text-slate-700">{po.supplier}</td>
                            <td className="p-2.5 text-slate-600">{po.leadTimeDays ? `${po.leadTimeDays} days` : '—'}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">₹{po.estValue.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-emerald-900 font-medium text-sm">
                  ✅ No purchase orders needed at this time. All stock levels are above reorder points.
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 8. REPORTS PANEL */}
          {/* ========================================== */}
          {activePanel === 'reports' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">📋 Reports & Analytics</h1>
                <p className="text-xs text-slate-500 mt-0.5">Inventory analytics, valuation summaries, and aging logs</p>
              </div>

              {/* REPORT TABS */}
              <div className="flex gap-2 border-b border-slate-200">
                {(['summary', 'valuation', 'consumption', 'aging'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setReportTab(tab)}
                    className={`pb-2 text-xs font-bold border-b-2 px-2 capitalize transition-all ${
                      reportTab === tab ? 'border-[#1D9E75] text-[#1D9E75]' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {reportTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">RM SKUs</div>
                      <div className="text-xl font-bold text-slate-900">{rawMaterials.length}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">FG Units Stock</div>
                      <div className="text-xl font-bold text-slate-900">{totalFGStock.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Packaging SKUs</div>
                      <div className="text-xl font-bold text-slate-900">{packaging.length}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Movements</div>
                      <div className="text-xl font-bold text-slate-900">{movements.length}</div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-3 bg-slate-50 font-bold text-xs">Raw Material Stock Summary</div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Material</th>
                          <th className="p-2.5">Stock</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Supplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rawMaterials.map((r) => (
                          <tr key={r.id}>
                            <td className="p-2.5 font-mono">{r.code}</td>
                            <td className="p-2.5 font-bold">{r.name}</td>
                            <td className="p-2.5 font-mono">{r.qty}</td>
                            <td className="p-2.5">{r.unit}</td>
                            <td className="p-2.5 text-slate-600">{r.supplierName || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportTab === 'valuation' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs p-4">
                  <div className="mb-4">
                    <div className="text-xs font-bold text-slate-500 uppercase">Total Inventory Valuation</div>
                    <div className="text-3xl font-bold text-[#1D9E75] font-mono mt-1">₹{totalRMValuation.toLocaleString('en-IN')}</div>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Rate (₹)</th>
                        <th className="p-2.5">Total Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawMaterials.map((r) => {
                        const val = r.qty * (r.lastPurchaseRate || 0);
                        return (
                          <tr key={r.id}>
                            <td className="p-2.5 font-mono">{r.code}</td>
                            <td className="p-2.5 font-bold">{r.name}</td>
                            <td className="p-2.5 font-mono">{r.qty} {r.unit}</td>
                            <td className="p-2.5 font-mono">₹{r.lastPurchaseRate || 0}</td>
                            <td className="p-2.5 font-mono font-bold">₹{val.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {reportTab === 'aging' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-3 bg-slate-50 font-bold text-xs">Finished Goods Aging Report</div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5">Batch</th>
                        <th className="p-2.5">Stock</th>
                        <th className="p-2.5">Days to Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportsData?.fgAging?.map((f: any) => (
                        <tr key={f.id}>
                          <td className="p-2.5 font-mono">{f.sku}</td>
                          <td className="p-2.5 font-bold">{f.name}</td>
                          <td className="p-2.5 font-mono">{f.batchNumber}</td>
                          <td className="p-2.5 font-mono">{f.stock} {f.unit}</td>
                          <td className="p-2.5 font-mono font-bold text-amber-600">{f.daysLeft}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 9. SETTINGS & ADMIN GOVERNANCE PANEL */}
          {/* ========================================== */}
          {activePanel === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">⚙️ Admin User & Role Governance</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Discord-style custom roles, authority templates, and staff user management
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalLookup(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
                  >
                    + Add Custom Lookup
                  </button>
                  <button
                    onClick={() => {
                      setEditingRole(null);
                      setModalRole(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    + Create Custom Role
                  </button>
                  <button
                    onClick={() => setModalUser(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                  >
                    + Create Staff User
                  </button>
                </div>
              </div>

              {/* ADMIN GOVERNANCE TABS */}
              <div className="flex gap-2 border-b border-slate-200">
                <button
                  onClick={() => setAdminTab('roles')}
                  className={`pb-2 text-xs font-bold border-b-2 px-1 transition-all ${
                    adminTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Custom Roles & Authorities ({rolesList.length})
                </button>
                <button
                  onClick={() => setAdminTab('users')}
                  className={`pb-2 text-xs font-bold border-b-2 px-1 transition-all ${
                    adminTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Staff Accounts ({usersList.length})
                </button>
                <button
                  onClick={() => setAdminTab('lookups')}
                  className={`pb-2 text-xs font-bold border-b-2 px-1 transition-all ${
                    adminTab === 'lookups' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Dynamic Lookups & Units
                </button>
              </div>

              {/* ROLES MANAGEMENT TAB */}
              {adminTab === 'roles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rolesList.map((role) => (
                    <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-2xs"
                            style={{ backgroundColor: role.colorTag || '#3B82F6' }}
                          />
                          <h3 className="font-bold text-sm text-slate-900">{role.name}</h3>
                          {role.isSystemAdmin && (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              System Admin
                            </span>
                          )}
                          {role.isDefault && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Default Template
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setModalRole(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 bg-blue-50 rounded-md"
                          >
                            Edit Authorities
                          </button>
                          {!role.isSystemAdmin && (
                            <button
                              onClick={() => handleDeleteRoleItem(role.id, role.name)}
                              className="text-xs text-red-500 hover:text-red-700 p-1"
                              title="Delete Role"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">{role.description || 'No description provided.'}</p>

                      <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span>Staff Assigned: <strong>{role._count?.users || 0}</strong></span>
                        <span>Granted Privileges: <strong>{role.isSystemAdmin ? 'All (*)' : `${role.rolePermissions?.length || 0}`}</strong></span>
                      </div>

                      {/* PERMISSION BADGES LIST */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {role.isSystemAdmin ? (
                          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded">
                            FULL ADMIN SUPERUSER PRIVILEGES
                          </span>
                        ) : role.rolePermissions && role.rolePermissions.length > 0 ? (
                          role.rolePermissions.slice(0, 6).map((rp: any) => (
                            <span key={rp.id} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                              {rp.permission.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No permissions assigned</span>
                        )}
                        {role.rolePermissions && role.rolePermissions.length > 6 && (
                          <span className="text-[10px] font-bold text-blue-600 self-center">
                            +{role.rolePermissions.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* USERS MANAGEMENT TAB */}
              {adminTab === 'users' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Staff Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Username</th>
                        <th className="p-2.5">Assigned Role</th>
                        <th className="p-2.5">Password Status</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{u.name}</td>
                          <td className="p-2.5 font-mono text-slate-600">{u.email}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-700">@{u.username}</td>
                          <td className="p-2.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                              style={{ backgroundColor: u.role?.colorTag || '#3B82F6' }}
                            >
                              {u.role?.name || 'Unassigned'}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isPasswordSet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {u.isPasswordSet ? 'Password Active' : '⏳ Pending First Login Setup'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            {!u.role?.isSystemAdmin && (
                              <button
                                onClick={() => handleDeleteUserItem(u.id, u.name)}
                                className="text-red-500 hover:text-red-700 p-1 text-xs"
                              >
                                🗑
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* LOOKUPS MANAGEMENT TAB */}
              {adminTab === 'lookups' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Configured Unit Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {units.map((u) => (
                        <span key={u.id} className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono font-medium text-slate-700">
                          {u.label} ({u.code})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Storage Zones / Cold Vaults</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {locations.map((loc) => (
                        <div key={loc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <div className="font-bold text-slate-900">{loc.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Zone: {loc.zone} | Temp: {loc.tempSpec || 'Ambient'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      <AddRawMaterialModal
        isOpen={modalRm}
        onClose={() => setModalRm(false)}
        units={units}
        locations={locations}
        coaStatuses={coaStatuses}
        onSuccess={loadData}
      />

      <AddFinishedGoodModal
        isOpen={modalFg}
        onClose={() => setModalFg(false)}
        units={units}
        locations={locations}
        tempConditions={tempConditions}
        onSuccess={loadData}
      />

      <AddPackagingModal
        isOpen={modalPm}
        onClose={() => setModalPm(false)}
        units={units}
        packagingTypes={packagingTypes}
        onSuccess={loadData}
      />

      <GRNModal
        isOpen={modalGrn}
        onClose={() => setModalGrn(false)}
        rawMaterials={rawMaterials}
        packaging={packaging}
        coaStatuses={coaStatuses}
        onSuccess={loadData}
      />

      <IssueModal
        isOpen={modalIssue}
        onClose={() => setModalIssue(false)}
        rawMaterials={rawMaterials}
        packaging={packaging}
        finishedGoods={finishedGoods}
        onSuccess={loadData}
      />

      <DispatchModal
        isOpen={modalDispatch}
        onClose={() => setModalDispatch(false)}
        finishedGoods={finishedGoods}
        onSuccess={loadData}
      />

      <AddLookupModal
        isOpen={modalLookup}
        onClose={() => setModalLookup(false)}
        onSuccess={loadData}
      />

      <LoginModal
        isOpen={modalLogin}
        onClose={() => setModalLogin(false)}
        onSuccess={loadData}
      />

      <RoleManagerModal
        isOpen={modalRole}
        onClose={() => {
          setModalRole(false);
          setEditingRole(null);
        }}
        permissions={permissionsList}
        editingRole={editingRole}
        onSuccess={loadData}
      />

      <UserManagerModal
        isOpen={modalUser}
        onClose={() => setModalUser(false)}
        roles={rolesList}
        permissions={permissionsList}
        onSuccess={loadData}
      />
    </div>
  );
}
