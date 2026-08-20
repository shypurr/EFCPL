'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Topbar from '@/components/Topbar';

// Actions
import { getRawMaterials, getRawMaterialMasters, deleteRawMaterial } from '@/actions/inventory';
import { getPackagingMaterials, deletePackagingMaterial } from '@/actions/inventory';
import {
  getRMIssues,
  deleteRMIssue,
  getProductionLogs,
  deleteProductionLog,
  getPackagingIssues,
  deletePackagingIssue,
  getFinishedGoods,
  deleteFinishedGood,
  getDispatches,
  deleteDispatch,
} from '@/actions/operations';
import { getPurchaseOrderSuggestions } from '@/actions/po-suggestions';
import { getReportsData } from '@/actions/reports';
import { getCurrentUser, logoutUser, getUsers, deleteUser } from '@/actions/auth';
import { getRoles, getPermissions, deleteRole } from '@/actions/roles';

// Modals
import AddRawMaterialModal from '@/components/Modals/AddRawMaterialModal';
import InwardRawMaterialModal from '@/components/Modals/InwardRawMaterialModal';
import AddPackagingModal from '@/components/Modals/AddPackagingModal';
import InwardPackagingModal from '@/components/Modals/InwardPackagingModal';
import AddFinishedGoodModal from '@/components/Modals/AddFinishedGoodModal';
import InwardFinishedGoodModal from '@/components/Modals/InwardFinishedGoodModal';
import IssueModal from '@/components/Modals/IssueModal';
import ProductionModal from '@/components/Modals/ProductionModal';
import PackagingIssueModal from '@/components/Modals/PackagingIssueModal';
import DispatchModal from '@/components/Modals/DispatchModal';
import LoginModal from '@/components/LoginModal';
import RoleManagerModal from '@/components/Admin/RoleManagerModal';
import UserManagerModal from '@/components/Admin/UserManagerModal';

// Icons
import {
  Wheat,
  Boxes,
  RefreshCw,
  Factory,
  Box,
  PackageCheck,
  Truck,
  PlusCircle,
  ShieldCheck,
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  ArrowDownRight,
  X,
} from 'lucide-react';

export default function Home() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Data States
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [rawMaterialMasters, setRawMaterialMasters] = useState<any[]>([]);
  const [packagedMaterials, setPackagedMaterials] = useState<any[]>([]);
  const [rmIssues, setRmIssues] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [packagingIssues, setPackagingIssues] = useState<any[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [poSuggestions, setPoSuggestions] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Master Modals State (New Catalog Items)
  const [modalNewRm, setModalNewRm] = useState(false);
  const [modalNewPm, setModalNewPm] = useState(false);
  const [modalNewFg, setModalNewFg] = useState(false);

  // Tab Inward / Operations Modals State (Existing Items)
  const [modalInwardRm, setModalInwardRm] = useState(false);
  const [modalInwardPm, setModalInwardPm] = useState(false);
  const [modalInwardFg, setModalInwardFg] = useState(false);
  const [modalRmIssue, setModalRmIssue] = useState(false);
  const [modalProduction, setModalProduction] = useState(false);
  const [modalPackagingIssue, setModalPackagingIssue] = useState(false);
  const [modalDispatch, setModalDispatch] = useState(false);

  // Admin & Auth Modals State
  const [modalLogin, setModalLogin] = useState(false);
  const [modalRole, setModalRole] = useState(false);
  const [modalUser, setModalUser] = useState(false);

  const [dbError, setDbError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [
        userRes,
        usersRes,
        rolesRes,
        permsRes,
        rmRes,
        rmMastersRes,
        pmRes,
        rmIssueRes,
        prodRes,
        pmIssueRes,
        fgRes,
        dispatchRes,
        poRes,
        rptRes,
      ] = await Promise.all([
        getCurrentUser(),
        getUsers(),
        getRoles(),
        getPermissions(),
        getRawMaterials(searchQuery),
        getRawMaterialMasters(),
        getPackagingMaterials(searchQuery),
        getRMIssues(searchQuery),
        getProductionLogs(searchQuery),
        getPackagingIssues(searchQuery),
        getFinishedGoods(searchQuery),
        getDispatches(searchQuery),
        getPurchaseOrderSuggestions(),
        getReportsData(),
      ]);

      if (userRes && userRes.data) setCurrentUser(userRes.data);
      if (usersRes?.success && usersRes.data) setUsersList(usersRes.data);
      if (rolesRes?.success && rolesRes.data) setRolesList(rolesRes.data);
      if (permsRes?.success && permsRes.data) setPermissionsList(permsRes.data);
      if (rmRes?.success && rmRes.data) setRawMaterials(rmRes.data);
      if (rmMastersRes?.success && rmMastersRes.data) setRawMaterialMasters(rmMastersRes.data);
      if (pmRes?.success && pmRes.data) setPackagedMaterials(pmRes.data);
      if (rmIssueRes?.success && rmIssueRes.data) setRmIssues(rmIssueRes.data);
      if (prodRes?.success && prodRes.data) setProductionLogs(prodRes.data);
      if (pmIssueRes?.success && pmIssueRes.data) setPackagingIssues(pmIssueRes.data);
      if (fgRes?.success && fgRes.data) setFinishedGoods(fgRes.data);
      if (dispatchRes?.success && dispatchRes.data) setDispatches(dispatchRes.data);
      if (poRes?.success && poRes.data) setPoSuggestions(poRes.data);
      if (rptRes?.success && rptRes.data) setReportsData(rptRes.data);
    } catch (err: any) {
      console.error('Data loading error:', err);
      setDbError(err.message || 'Database connection or initialization error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute live alerts count
  const lowRmCount = rawMaterials.filter((r) => r.stock <= r.reorderLevel).length;
  const lowPmCount = packagedMaterials.filter((p) => p.stock <= p.reorderLevel).length;
  const totalAlertsCount = lowRmCount + lowPmCount;

  // Delete Actions
  const handleDeleteRM = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Raw Material "${name}"?`)) {
      await deleteRawMaterial(id);
      loadData();
    }
  };

  const handleDeletePM = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Packaged Material "${name}"?`)) {
      await deletePackagingMaterial(id);
      loadData();
    }
  };

  const handleDeleteRMIssueItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this RM Issue record?')) {
      await deleteRMIssue(id);
      loadData();
    }
  };

  const handleDeleteProdLog = async (id: string) => {
    if (confirm('Are you sure you want to delete this Production Log?')) {
      await deleteProductionLog(id);
      loadData();
    }
  };

  const handleDeletePMIssueItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this Packaging Issue record?')) {
      await deletePackagingIssue(id);
      loadData();
    }
  };

  const handleDeleteFG = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Finished Good "${name}"?`)) {
      await deleteFinishedGood(id);
      loadData();
    }
  };

  const handleDeleteDispatchLog = async (id: string) => {
    if (confirm('Are you sure you want to delete this Dispatch record?')) {
      await deleteDispatch(id);
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
        alert(`❌ ${res.error}`);
      }
    }
  };

  const handleDeleteUserItem = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
      await deleteUser(id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#070E1A] text-slate-100 flex flex-col font-sans">
      {/* SIDEBAR NAVIGATION (DESKTOP) */}
      <Sidebar
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        alertCount={totalAlertsCount}
      />

      {/* MOBILE NAVIGATION */}
      <MobileNav
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        alertCount={totalAlertsCount}
        currentUser={currentUser}
        onOpenLogin={() => setModalLogin(true)}
        onLogout={async () => {
          await logoutUser();
          setCurrentUser(null);
          loadData();
        }}
      />

      {/* MAIN CONTENT WORKSPACE */}
      <div className="md:pl-64 flex-1 flex flex-col min-h-screen pb-20 md:pb-6">
        {/* TOPBAR (DESKTOP & TABLET) */}
        <Topbar
          title="EFCPL MES Dashboard"
          alertCount={totalAlertsCount}
          currentUser={currentUser}
          onAlertClick={() => setActivePanel('alerts')}
          onRefresh={loadData}
          onOpenLogin={() => setModalLogin(true)}
          onLogout={async () => {
            await logoutUser();
            setCurrentUser(null);
            loadData();
          }}
        />

        {/* MAIN BODY */}
        <main className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 flex-1 w-full max-w-7xl mx-auto">
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D1B2E] border border-[#1E2F4A] p-3 rounded-xl shadow-xs">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
                placeholder="Search materials, batch numbers, codes, SKUs, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadData}
                className="px-3 py-2 text-xs font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Data</span>
              </button>
            </div>
          </div>

          {dbError && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-white">Database Connection Status</div>
                  <div className="text-xs text-red-300/90">{dbError}</div>
                </div>
              </div>
              <button
                onClick={() => loadData()}
                className="bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition-all cursor-pointer shrink-0"
              >
                ⟳ Retry Connection
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs sm:text-sm flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading operational data from database...</span>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* 1. INVENTORY: RAW MATERIALS (RM) TAB */}
              {/* ======================================================== */}
              {activePanel === 'raw-materials' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Wheat className="w-5 h-5 text-[#1D9E75]" /> Raw Materials Inventory (RM)
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Master stock levels, batches, and inward shipments for raw materials</p>
                    </div>
                    <button
                      onClick={() => setModalInwardRm(true)}
                      className="bg-[#1D9E75] hover:bg-[#168361] text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <ArrowDownRight className="w-4 h-4" /> Log Inward / Arrived RM
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">Code</th>
                            <th className="p-3">Material Name</th>
                            <th className="p-3">Brand Name</th>
                            <th className="p-3">Batch No</th>
                            <th className="p-3 text-right">Stock</th>
                            <th className="p-3">Unit</th>
                            <th className="p-3 text-right">Reorder Level</th>
                            <th className="p-3 text-right">Max Stock</th>
                            <th className="p-3">Supplier</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Expiring</th>
                            <th className="p-3">Entry Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {rawMaterials.length === 0 ? (
                            <tr>
                              <td colSpan={14} className="p-8 text-center text-slate-500">
                                No raw materials found matching search query.
                              </td>
                            </tr>
                          ) : (
                            rawMaterials.map((rm) => (
                              <tr key={rm.id} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-mono font-bold text-emerald-400">{rm.code}</td>
                                <td className="p-3 font-semibold text-white">{rm.name}</td>
                                <td className="p-3">{rm.brand || '—'}</td>
                                <td className="p-3 font-mono text-slate-400">{rm.batchNumber}</td>
                                <td className={`p-3 text-right font-bold ${rm.stock <= rm.reorderLevel ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {rm.stock}
                                </td>
                                <td className="p-3">{rm.unit}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{rm.reorderLevel}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{rm.maxStock ?? '—'}</td>
                                <td className="p-3">{rm.supplier || '—'}</td>
                                <td className="p-3">{rm.location || '—'}</td>
                                <td className="p-3">
                                  {rm.expiryDate ? new Date(rm.expiryDate).toISOString().split('T')[0] : '—'}
                                </td>
                                <td className="p-3 font-mono text-slate-400 text-xs">
                                  {rm.createdAt ? new Date(rm.createdAt).toLocaleDateString() : '—'}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      rm.stock <= rm.reorderLevel
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}
                                  >
                                    {rm.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleDeleteRM(rm.id, rm.name)}
                                      className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                      title="Delete Raw Material"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 2. INVENTORY: PACKAGED MATERIALS (PM) TAB */}
              {/* ======================================================== */}
              {activePanel === 'packaged-materials' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-blue-400" /> Packaged Materials Inventory (PM)
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Jars, bottles, cartons, caps, and inward shipments for packaging supplies</p>
                    </div>
                    <button
                      onClick={() => setModalInwardPm(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <ArrowDownRight className="w-4 h-4" /> Log Inward / Arrived PM
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">Code</th>
                            <th className="p-3">Material Name</th>
                            <th className="p-3">Brand Name / Type</th>
                            <th className="p-3">Batch No</th>
                            <th className="p-3 text-right">Stock</th>
                            <th className="p-3">Unit</th>
                            <th className="p-3 text-right">Reorder Level</th>
                            <th className="p-3 text-right">Max Stock</th>
                            <th className="p-3">Supplier</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Expiring</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {packagedMaterials.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="p-8 text-center text-slate-500">
                                No packaging materials found matching search query.
                              </td>
                            </tr>
                          ) : (
                            packagedMaterials.map((pm) => (
                              <tr key={pm.id} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-mono font-bold text-blue-400">{pm.code}</td>
                                <td className="p-3 font-semibold text-white">{pm.name}</td>
                                <td className="p-3">{pm.brand || '—'}</td>
                                <td className="p-3 font-mono text-slate-400">{pm.batchNumber}</td>
                                <td className={`p-3 text-right font-bold ${pm.stock <= pm.reorderLevel ? 'text-amber-400' : 'text-blue-400'}`}>
                                  {pm.stock}
                                </td>
                                <td className="p-3">{pm.unit}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{pm.reorderLevel}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{pm.maxStock ?? '—'}</td>
                                <td className="p-3">{pm.supplier || '—'}</td>
                                <td className="p-3">{pm.location || '—'}</td>
                                <td className="p-3">
                                  {pm.expiryDate ? new Date(pm.expiryDate).toISOString().split('T')[0] : '—'}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      pm.stock <= pm.reorderLevel
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}
                                  >
                                    {pm.status}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleDeletePM(pm.id, pm.name)}
                                      className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                      title="Delete Packaging Material"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 3. OPERATIONS: RM ISSUE TAB */}
              {/* ======================================================== */}
              {activePanel === 'op-rm-issue' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-emerald-400" /> RM Issue
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Issuing raw materials to production floor (deducts RM stock atomically)</p>
                    </div>
                    <button
                      onClick={() => setModalRmIssue(true)}
                      className="bg-[#1D9E75] hover:bg-[#168361] text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Post RM Issue
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">RM Code</th>
                            <th className="p-3">Material Name</th>
                            <th className="p-3">Batch Number</th>
                            <th className="p-3">Issue For (FG)</th>
                            <th className="p-3">Expiry Date</th>
                            <th className="p-3 text-right">Qty in Selected Batch</th>
                            <th className="p-3 text-right">Issued Stock</th>
                            <th className="p-3">Issued Date</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {rmIssues.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-500">
                                No RM Issue entries logged yet.
                              </td>
                            </tr>
                          ) : (
                            rmIssues.map((issue) => (
                              <tr key={issue.id} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-mono font-bold text-emerald-400">{issue.rmCode || '—'}</td>
                                <td className="p-3 font-semibold text-white">{issue.materialName}</td>
                                <td className="p-3 font-mono text-slate-400">{issue.batchNumber}</td>
                                <td className="p-3 font-semibold text-blue-400">{issue.issueFor}</td>
                                <td className="p-3">
                                  {issue.expiryDate ? new Date(issue.expiryDate).toISOString().split('T')[0] : '—'}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-400">{issue.quantityInBatch}</td>
                                <td className="p-3 text-right font-bold text-amber-400">{issue.issuedStock}</td>
                                <td className="p-3 text-slate-400">
                                  {new Date(issue.issuedDate).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteRMIssueItem(issue.id)}
                                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 4. OPERATIONS: PRODUCTION TAB */}
              {/* ======================================================== */}
              {activePanel === 'op-production' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Factory className="w-5 h-5 text-amber-400" /> Production
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Recording FG batch production runs, outputs, and auto-adding stock</p>
                    </div>
                    <button
                      onClick={() => setModalProduction(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Record Production Run
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">FG Code</th>
                            <th className="p-3">Finished Good Name</th>
                            <th className="p-3 text-right">Total Batches Made</th>
                            <th className="p-3 text-right">Total Output</th>
                            <th className="p-3 text-right">Wastage</th>
                            <th className="p-3">Operator</th>
                            <th className="p-3">Recorded At</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {productionLogs.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-500">
                                No production runs recorded yet.
                              </td>
                            </tr>
                          ) : (
                            productionLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-mono font-bold text-amber-400">{log.fgCode}</td>
                                <td className="p-3 font-semibold text-white">{log.fgName}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-200">{log.totalBatchesMade}</td>
                                <td className="p-3 text-right font-bold text-emerald-400">+{log.totalOutput} {log.unit}</td>
                                <td className="p-3 text-right text-red-400 font-mono">{log.wastage} {log.unit}</td>
                                <td className="p-3">{log.operator}</td>
                                <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteProdLog(log.id)}
                                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 5. OPERATIONS: PACKAGING ISSUE TAB */}
              {/* ======================================================== */}
              {activePanel === 'op-packaging-issue' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Box className="w-5 h-5 text-purple-400" /> Packaging Issue
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Issuing bottles, jars, pouches & cartons for production runs (deducts PM stock)</p>
                    </div>
                    <button
                      onClick={() => setModalPackagingIssue(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Post PM Issue
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">PM Code</th>
                            <th className="p-3">Material Name</th>
                            <th className="p-3">Issue For (FG)</th>
                            <th className="p-3 text-right">Qty in Selected Batch</th>
                            <th className="p-3 text-right">Issued Quantity</th>
                            <th className="p-3">Issued Date</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {packagingIssues.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-500">
                                No Packaging Issue entries logged yet.
                              </td>
                            </tr>
                          ) : (
                            packagingIssues.map((issue) => (
                              <tr key={issue.id} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-mono font-bold text-purple-400">{issue.pmCode || '—'}</td>
                                <td className="p-3 font-semibold text-white">{issue.pmName}</td>
                                <td className="p-3 font-semibold text-blue-400">{issue.issueFor}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{issue.quantityInBatch}</td>
                                <td className="p-3 text-right font-bold text-purple-400">{issue.issuedQty}</td>
                                <td className="p-3 text-slate-400">{new Date(issue.issuedDate).toLocaleDateString()}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeletePMIssueItem(issue.id)}
                                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 6. OPERATIONS: FINISHED GOODS TAB */}
              {/* ======================================================== */}
              {activePanel === 'op-finished-goods' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <PackageCheck className="w-5 h-5 text-blue-400" /> Finished Goods
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Produced stock batches, shelf-life auto-calculations & warehouse locations</p>
                    </div>
                    <button
                      onClick={() => setModalInwardFg(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <ArrowDownRight className="w-4 h-4" /> Log FG Batch Stock
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">SKU</th>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Batch Number</th>
                            <th className="p-3 text-right">Quantity Produced</th>
                            <th className="p-3 text-right">Total Stock</th>
                            <th className="p-3">Unit</th>
                            <th className="p-3">MFG Date</th>
                            <th className="p-3">Expiry Date</th>
                            <th className="p-3 text-center">Shelf Life</th>
                            <th className="p-3">Location</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {finishedGoods.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="p-8 text-center text-slate-500">
                                No finished goods found in inventory.
                              </td>
                            </tr>
                          ) : (
                            finishedGoods.map((fg) => (
                              <tr key={fg.id} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-mono font-bold text-blue-400">{fg.sku}</td>
                                <td className="p-3 font-semibold text-white">{fg.name}</td>
                                <td className="p-3 font-mono text-slate-400">{fg.batchNumber}</td>
                                <td className="p-3 text-right font-mono text-slate-300">{fg.quantityProduced}</td>
                                <td className="p-3 text-right font-bold text-emerald-400">{fg.totalStock}</td>
                                <td className="p-3">{fg.unit}</td>
                                <td className="p-3">{new Date(fg.mfgDate).toISOString().split('T')[0]}</td>
                                <td className="p-3">{new Date(fg.expiryDate).toISOString().split('T')[0]}</td>
                                <td className="p-3 text-center font-bold text-emerald-400">{fg.shelfLifeDays} days</td>
                                <td className="p-3">{fg.location || '—'}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleDeleteFG(fg.id, fg.name)}
                                      className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                      title="Delete Finished Good"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 7. OPERATIONS: DISPATCH TAB */}
              {/* ======================================================== */}
              {activePanel === 'op-dispatch' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Truck className="w-5 h-5 text-indigo-400" /> Dispatch
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Sales dispatch logs, COA status & party delivery records (deducts FG stock)</p>
                    </div>
                    <button
                      onClick={() => setModalDispatch(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Post Dispatch
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">SKU Code</th>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Batch Code</th>
                            <th className="p-3 text-right">Dispatch Qty</th>
                            <th className="p-3">Dispatch Date</th>
                            <th className="p-3">Party Name</th>
                            <th className="p-3">MFG</th>
                            <th className="p-3">EXP</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">COA</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {dispatches.length === 0 ? (
                            <tr>
                              <td colSpan={11} className="p-8 text-center text-slate-500">
                                No dispatch entries logged yet.
                              </td>
                            </tr>
                          ) : (
                            dispatches.map((disp) => (
                              <tr key={disp.id} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-mono font-bold text-indigo-400">{disp.skuCode || '—'}</td>
                                <td className="p-3 font-semibold text-white">{disp.productName}</td>
                                <td className="p-3 font-mono text-slate-400">{disp.batchCode}</td>
                                <td className="p-3 text-right font-bold text-[#1D9E75]">{disp.dispatchQty}</td>
                                <td className="p-3 text-slate-400">{new Date(disp.dispatchDate).toLocaleDateString()}</td>
                                <td className="p-3 font-semibold text-white">{disp.partyName}</td>
                                <td className="p-3">{new Date(disp.mfgDate).toISOString().split('T')[0]}</td>
                                <td className="p-3">{new Date(disp.expiryDate).toISOString().split('T')[0]}</td>
                                <td className="p-3">{disp.location || '—'}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {disp.coaStatus}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteDispatchLog(disp.id)}
                                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 8. MASTER ENTRY HUB: ADD MATERIALS / ITEMS */}
              {/* ======================================================== */}
              {activePanel === 'add-materials' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-[#1D9E75]" /> Add Materials / Master Entry Hub
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                      Centralized workspace to define brand new master materials and catalog SKUs
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Add NEW RM Master Card */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-5 hover:border-[#1D9E75] transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                          <Wheat className="w-5 h-5 shrink-0" /> Add Brand New Raw Material (Master)
                        </div>
                        <p className="text-xs text-slate-400">Create a brand new RM SKU with code, brand name, unit, and reorder levels</p>
                      </div>
                      <button
                        onClick={() => setModalNewRm(true)}
                        className="w-full bg-[#1D9E75] hover:bg-[#168361] text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Create New RM Master
                      </button>
                    </div>

                    {/* Add NEW PM Master Card */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-5 hover:border-blue-500 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                          <Boxes className="w-5 h-5 shrink-0" /> Add Brand New Packaging (Master)
                        </div>
                        <p className="text-xs text-slate-400">Create a brand new bottle, jar, carton, or packaging SKU catalog record</p>
                      </div>
                      <button
                        onClick={() => setModalNewPm(true)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Create New PM Master
                      </button>
                    </div>

                    {/* Add NEW FG Master Card */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-5 hover:border-blue-400 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
                          <PackageCheck className="w-5 h-5 shrink-0" /> Add Brand New Finished Good (Master)
                        </div>
                        <p className="text-xs text-slate-400">Register a new manufactured product SKU, shelf-life, and storage guidelines</p>
                      </div>
                      <button
                        onClick={() => setModalNewFg(true)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Create New FG Master
                      </button>
                    </div>

                    {/* Quick Action: Post RM Issue */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-5 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                          <RefreshCw className="w-5 h-5 shrink-0" /> Post RM Issue to Production
                        </div>
                        <p className="text-xs text-slate-400">Deduct raw material batch stock for a factory batch run</p>
                      </div>
                      <button
                        onClick={() => setModalRmIssue(true)}
                        className="w-full bg-[#1D9E75] hover:bg-[#168361] text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Post RM Issue
                      </button>
                    </div>

                    {/* Quick Action: Record Production Run */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-5 hover:border-amber-500 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                          <Factory className="w-5 h-5 shrink-0" /> Record Factory Production Run
                        </div>
                        <p className="text-xs text-slate-400">Record produced batches and automatically update FG inventory stock</p>
                      </div>
                      <button
                        onClick={() => setModalProduction(true)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Record Production
                      </button>
                    </div>

                    {/* Quick Action: Post Customer Dispatch */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-5 hover:border-indigo-500 transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                          <Truck className="w-5 h-5 shrink-0" /> Post Customer Dispatch
                        </div>
                        <p className="text-xs text-slate-400">Dispatch finished goods orders to distributors and retail clients</p>
                      </div>
                      <button
                        onClick={() => setModalDispatch(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Post Sales Dispatch
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 9. ADMIN: DISCORD-STYLE ROLES & PERMISSIONS */}
              {/* ======================================================== */}
              {activePanel === 'admin-roles' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" /> Discord-Style Roles & Permissions
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Color-tagged roles with modular granular authority flags</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingRole(null);
                        setModalRole(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Create Custom Role
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rolesList.map((role) => (
                      <div
                        key={role.id}
                        className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-4 space-y-3 hover:border-slate-500 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs"
                                style={{ backgroundColor: role.colorTag || '#1D9E75' }}
                              />
                              <h3 className="font-bold text-sm text-white">{role.name}</h3>
                            </div>
                            {role.isSystemAdmin ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                System Admin
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {role.users?.length || 0} users
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{role.description}</p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-[#1E2F4A] flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {role.isSystemAdmin ? 'Full Access' : `${role.permissions?.length || 0} permissions`}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingRole(role);
                                setModalRole(true);
                              }}
                              className="p-1.5 rounded text-slate-300 hover:bg-[#162440] hover:text-white cursor-pointer"
                              title="Edit Role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {!role.isSystemAdmin && (
                              <button
                                onClick={() => handleDeleteRoleItem(role.id, role.name)}
                                className="p-1.5 rounded text-red-400 hover:bg-red-500/20 cursor-pointer"
                                title="Delete Role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 10. ADMIN: STAFF USERS PROVISIONING */}
              {/* ======================================================== */}
              {activePanel === 'admin-users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" /> Staff Members & Accounts
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">User accounts, roles, and authorization management</p>
                    </div>
                    <button
                      onClick={() => setModalUser(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add Staff Member
                    </button>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">Staff Name</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Assigned Role</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Created</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-[#162440]/50 transition-all">
                              <td className="p-3 font-semibold text-white">{u.name}</td>
                              <td className="p-3 font-mono text-slate-400">@{u.username}</td>
                              <td className="p-3">
                                {u.role ? (
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white inline-flex items-center gap-1.5"
                                    style={{ backgroundColor: `${u.role.colorTag || '#1D9E75'}33`, color: u.role.colorTag || '#1D9E75' }}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full inline-block"
                                      style={{ backgroundColor: u.role.colorTag || '#1D9E75' }}
                                    />
                                    {u.role.name}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">No role</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Active
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="p-3 text-center">
                                {u.username !== 'admin' && (
                                  <button
                                    onClick={() => handleDeleteUserItem(u.id, u.name)}
                                    className="p-1.5 rounded text-red-400 hover:bg-red-500/20 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 11. DASHBOARD & PIPELINE OVERVIEW */}
              {/* ======================================================== */}
              {activePanel === 'dashboard' && (
                <div className="space-y-6">
                  {/* Pipeline Quick Access Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
                    <div
                      onClick={() => setActivePanel('raw-materials')}
                      className="bg-[#0D1B2E] border border-[#1E2F4A] hover:border-emerald-500 p-3 sm:p-4 rounded-xl cursor-pointer transition-all space-y-1"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                        <Wheat className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> RM Items
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">{rawMaterials.length}</div>
                      <div className="text-[10px] text-emerald-400 font-mono truncate">
                        {lowRmCount > 0 ? `${lowRmCount} Low Stock` : 'Optimal'}
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePanel('packaged-materials')}
                      className="bg-[#0D1B2E] border border-[#1E2F4A] hover:border-blue-500 p-3 sm:p-4 rounded-xl cursor-pointer transition-all space-y-1"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                        <Boxes className="w-3.5 h-3.5 text-blue-400 shrink-0" /> PM Items
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">{packagedMaterials.length}</div>
                      <div className="text-[10px] text-blue-400 font-mono truncate">
                        {lowPmCount > 0 ? `${lowPmCount} Low Stock` : 'Optimal'}
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePanel('op-rm-issue')}
                      className="bg-[#0D1B2E] border border-[#1E2F4A] hover:border-emerald-500 p-3 sm:p-4 rounded-xl cursor-pointer transition-all space-y-1"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> RM Issues
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">{rmIssues.length}</div>
                      <div className="text-[10px] text-slate-400 truncate">Total Issued</div>
                    </div>

                    <div
                      onClick={() => setActivePanel('op-production')}
                      className="bg-[#0D1B2E] border border-[#1E2F4A] hover:border-amber-500 p-3 sm:p-4 rounded-xl cursor-pointer transition-all space-y-1"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                        <Factory className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Production
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">{productionLogs.length}</div>
                      <div className="text-[10px] text-amber-400 font-mono truncate">
                        {productionLogs.reduce((acc, p) => acc + (p.totalOutput || 0), 0)} Output
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePanel('op-packaging-issue')}
                      className="bg-[#0D1B2E] border border-[#1E2F4A] hover:border-purple-500 p-3 sm:p-4 rounded-xl cursor-pointer transition-all space-y-1"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                        <Box className="w-3.5 h-3.5 text-purple-400 shrink-0" /> PM Issues
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">{packagingIssues.length}</div>
                      <div className="text-[10px] text-slate-400 truncate">Packaging Out</div>
                    </div>

                    <div
                      onClick={() => setActivePanel('op-finished-goods')}
                      className="bg-[#0D1B2E] border border-[#1E2F4A] hover:border-blue-400 p-3 sm:p-4 rounded-xl cursor-pointer transition-all space-y-1"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                        <PackageCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Finished Goods
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">{finishedGoods.length}</div>
                      <div className="text-[10px] text-emerald-400 font-mono truncate">
                        {finishedGoods.reduce((acc, f) => acc + (f.totalStock || 0), 0)} Units
                      </div>
                    </div>

                    <div
                      onClick={() => setActivePanel('op-dispatch')}
                      className="bg-[#0D1B2E] border border-[#1E2F4A] hover:border-indigo-500 p-3 sm:p-4 rounded-xl cursor-pointer transition-all space-y-1 col-span-2 sm:col-span-1"
                    >
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                        <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Dispatches
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-white">{dispatches.length}</div>
                      <div className="text-[10px] text-indigo-400 font-mono truncate">
                        {dispatches.reduce((acc, d) => acc + (d.dispatchQty || 0), 0)} Out
                      </div>
                    </div>
                  </div>

                  {/* Production & Dispatch Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recent Production Logs */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Factory className="w-4 h-4 text-amber-400" /> Recent Production Runs
                        </h3>
                        <button
                          onClick={() => setActivePanel('op-production')}
                          className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                        >
                          View All →
                        </button>
                      </div>
                      <div className="space-y-2">
                        {productionLogs.slice(0, 4).map((log) => (
                          <div
                            key={log.id}
                            className="bg-[#162440]/60 border border-[#2A3F66] p-3 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-white truncate">{log.fgName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Code: {log.fgCode} | Batches: {log.totalBatchesMade}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-400">+{log.totalOutput} {log.unit}</span>
                              <div className="text-[10px] text-slate-400">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Dispatches */}
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Truck className="w-4 h-4 text-indigo-400" /> Recent Dispatches
                        </h3>
                        <button
                          onClick={() => setActivePanel('op-dispatch')}
                          className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                        >
                          View All →
                        </button>
                      </div>
                      <div className="space-y-2">
                        {dispatches.slice(0, 4).map((disp) => (
                          <div
                            key={disp.id}
                            className="bg-[#162440]/60 border border-[#2A3F66] p-3 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-white truncate">{disp.productName}</div>
                              <div className="text-[10px] text-slate-400 truncate">Party: {disp.partyName}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-[#1D9E75]">{disp.dispatchQty}</span>
                              <div className="text-[10px] text-slate-400">
                                {new Date(disp.dispatchDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 12. PO SUGGESTIONS TAB */}
              {/* ======================================================== */}
              {activePanel === 'po-suggestions' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" /> Purchase Order (PO) Suggestions
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Automated replenishment suggestions based on reorder thresholds</p>
                  </div>

                  <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                            <th className="p-3">Type</th>
                            <th className="p-3">Code</th>
                            <th className="p-3">Item Name</th>
                            <th className="p-3 text-right">Current Stock</th>
                            <th className="p-3 text-right">Reorder Level</th>
                            <th className="p-3 text-right">Suggested PO Qty</th>
                            <th className="p-3">Supplier</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
                          {poSuggestions.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-500">
                                All inventory levels are above reorder thresholds. No POs needed.
                              </td>
                            </tr>
                          ) : (
                            poSuggestions.map((item, idx) => (
                              <tr key={idx} className="hover:bg-[#162440]/50 transition-all">
                                <td className="p-3 font-semibold text-white">{item.type}</td>
                                <td className="p-3 font-mono font-bold text-amber-400">{item.code}</td>
                                <td className="p-3 font-semibold text-white">{item.name}</td>
                                <td className="p-3 text-right font-bold text-amber-400 font-mono">
                                  {item.currentStock} {item.unit}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-400">
                                  {item.reorderLevel} {item.unit}
                                </td>
                                <td className="p-3 text-right font-bold text-emerald-400 font-mono">
                                  +{item.suggestedPOQty} {item.unit}
                                </td>
                                <td className="p-3">{item.supplier || '—'}</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Needs Reorder
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 13. REPORTS TAB */}
              {/* ======================================================== */}
              {activePanel === 'reports' && reportsData && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" /> MES Factory Reports & Summaries
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Inventory valuation, turnover ratios, production yields & dispatch rates</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] p-4 sm:p-5 rounded-xl space-y-1">
                      <div className="text-xs text-slate-400 font-medium">Total Raw Materials Stock</div>
                      <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
                        {reportsData.summary?.totalRMStock || 0} KG
                      </div>
                    </div>
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] p-4 sm:p-5 rounded-xl space-y-1">
                      <div className="text-xs text-slate-400 font-medium">Total Packaging Stock</div>
                      <div className="text-xl sm:text-2xl font-bold text-blue-400 font-mono">
                        {reportsData.summary?.totalPMStock || 0} Units
                      </div>
                    </div>
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] p-4 sm:p-5 rounded-xl space-y-1">
                      <div className="text-xs text-slate-400 font-medium">Finished Goods Inventory</div>
                      <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono">
                        {reportsData.summary?.totalFGStock || 0} Units
                      </div>
                    </div>
                    <div className="bg-[#0D1B2E] border border-[#1E2F4A] p-4 sm:p-5 rounded-xl space-y-1">
                      <div className="text-xs text-slate-400 font-medium">Total Lifetime Dispatches</div>
                      <div className="text-xl sm:text-2xl font-bold text-indigo-400 font-mono">
                        {reportsData.summary?.totalDispatched || 0} Units
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 14. ALERTS TAB */}
              {/* ======================================================== */}
              {activePanel === 'alerts' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" /> Factory Floor Real-time Alerts
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Critical reorder warnings, low stock and quality notices</p>
                  </div>

                  {totalAlertsCount === 0 ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 sm:p-8 rounded-xl text-center text-emerald-300">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <div className="font-bold text-base text-white">All Inventory Healthy</div>
                      <p className="text-xs mt-1">No raw or packaged materials are below reorder thresholds.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rawMaterials
                        .filter((r) => r.stock <= r.reorderLevel)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-white">
                                Low Stock: {r.name} ({r.code})
                              </div>
                              <div className="text-xs">
                                Current Stock: <strong>{r.stock} {r.unit}</strong> | Reorder Threshold:{' '}
                                <strong>{r.reorderLevel} {r.unit}</strong>
                              </div>
                            </div>
                            <button
                              onClick={() => setActivePanel('po-suggestions')}
                              className="bg-amber-500 text-white font-bold px-3 py-2 rounded-lg text-xs hover:bg-amber-400 transition-all cursor-pointer w-full sm:w-auto shrink-0"
                            >
                              Generate PO
                            </button>
                          </div>
                        ))}

                      {packagedMaterials
                        .filter((p) => p.stock <= p.reorderLevel)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-300"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-white">
                                Low Packaging Stock: {p.name} ({p.code})
                              </div>
                              <div className="text-xs">
                                Current Stock: <strong>{p.stock} {p.unit}</strong> | Reorder Threshold:{' '}
                                <strong>{p.reorderLevel} {p.unit}</strong>
                              </div>
                            </div>
                            <button
                              onClick={() => setActivePanel('po-suggestions')}
                              className="bg-blue-500 text-white font-bold px-3 py-2 rounded-lg text-xs hover:bg-blue-400 transition-all cursor-pointer w-full sm:w-auto shrink-0"
                            >
                              Generate PO
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* ALL MODAL DIALOGS */}
      {/* ======================================================== */}

      {/* 1. MASTER ADDITION MODALS (Catalog Master Items) */}
      <AddRawMaterialModal
        isOpen={modalNewRm}
        onClose={() => setModalNewRm(false)}
        onSuccess={loadData}
      />

      <AddPackagingModal
        isOpen={modalNewPm}
        onClose={() => setModalNewPm(false)}
        onSuccess={loadData}
      />

      <AddFinishedGoodModal
        isOpen={modalNewFg}
        onClose={() => setModalNewFg(false)}
        onSuccess={loadData}
      />

      {/* 2. TAB-SPECIFIC INWARD / EXISTING ITEM MODALS */}
      <InwardRawMaterialModal
        isOpen={modalInwardRm}
        onClose={() => setModalInwardRm(false)}
        rawMaterials={rawMaterialMasters.length > 0 ? rawMaterialMasters : rawMaterials}
        onSuccess={loadData}
      />

      <InwardPackagingModal
        isOpen={modalInwardPm}
        onClose={() => setModalInwardPm(false)}
        packagingMaterials={packagedMaterials}
        onSuccess={loadData}
      />

      <InwardFinishedGoodModal
        isOpen={modalInwardFg}
        onClose={() => setModalInwardFg(false)}
        finishedGoods={finishedGoods}
        onSuccess={loadData}
      />

      {/* 3. OPERATIONS MODALS (Pipeline Actions) */}
      <IssueModal
        isOpen={modalRmIssue}
        onClose={() => setModalRmIssue(false)}
        rawMaterials={rawMaterials}
        finishedGoods={finishedGoods}
        onSuccess={loadData}
      />

      <ProductionModal
        isOpen={modalProduction}
        onClose={() => setModalProduction(false)}
        finishedGoods={finishedGoods}
        onSuccess={loadData}
      />

      <PackagingIssueModal
        isOpen={modalPackagingIssue}
        onClose={() => setModalPackagingIssue(false)}
        packagingMaterials={packagedMaterials}
        finishedGoods={finishedGoods}
        onSuccess={loadData}
      />

      <DispatchModal
        isOpen={modalDispatch}
        onClose={() => setModalDispatch(false)}
        finishedGoods={finishedGoods}
        onSuccess={loadData}
      />

      {/* 4. ADMIN & AUTH MODALS */}
      <RoleManagerModal
        isOpen={modalRole}
        onClose={() => {
          setEditingRole(null);
          setModalRole(false);
        }}
        editingRole={editingRole}
        permissions={permissionsList}
        onSuccess={loadData}
      />

      <UserManagerModal
        isOpen={modalUser}
        onClose={() => setModalUser(false)}
        roles={rolesList}
        permissions={permissionsList}
        onSuccess={loadData}
      />

      <LoginModal
        isOpen={modalLogin}
        onClose={() => setModalLogin(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
