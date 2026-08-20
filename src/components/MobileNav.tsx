'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
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
  ClipboardList,
  ShoppingCart,
  Menu,
  X,
  LogIn,
  LogOut,
} from 'lucide-react';

interface MobileNavProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
  alertCount: number;
  currentUser?: any;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export default function MobileNav({
  activePanel,
  setActivePanel,
  alertCount,
  currentUser,
  onOpenLogin,
  onLogout,
}: MobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainBottomTabs: { id: string; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'raw-materials', label: 'Raw Mat', icon: Wheat },
    { id: 'op-production', label: 'Production', icon: Factory },
    { id: 'op-finished-goods', label: 'FG Stock', icon: PackageCheck },
    { id: 'add-materials', label: 'Add Item', icon: PlusCircle },
  ];

  const drawerItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts & Notifications', icon: Bell, badge: alertCount },
    
    // Inventory
    { id: 'raw-materials', label: 'Raw Materials (RM)', icon: Wheat },
    { id: 'packaged-materials', label: 'Packaged Materials (PM)', icon: Boxes },
    
    // Operations
    { id: 'op-rm-issue', label: 'RM Issue', icon: RefreshCw },
    { id: 'op-production', label: 'Production', icon: Factory },
    { id: 'op-packaging-issue', label: 'Packaging Issue', icon: Box },
    { id: 'op-finished-goods', label: 'Finished Goods', icon: PackageCheck },
    { id: 'op-dispatch', label: 'Dispatch', icon: Truck },
    
    // Add Hub & Admin
    { id: 'add-materials', label: 'Add Materials / Product', icon: PlusCircle },
    { id: 'admin-roles', label: 'Discord Roles & Perms', icon: ShieldCheck },
    { id: 'admin-users', label: 'Staff Users Manager', icon: Users },
    { id: 'reports', label: 'Reports & Valuation', icon: ClipboardList },
    { id: 'po-suggestions', label: 'PO Suggestions', icon: ShoppingCart },
  ];

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden sticky top-0 z-40 bg-[#0A1628] text-white px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-[#1E2F4A] shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#1D9E75] flex items-center justify-center font-bold text-sm shadow-xs">
            E
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block leading-tight">EFCPL MES</span>
            <span className="text-[9px] font-mono text-slate-400 block">Factory Ops</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <button
              onClick={() => setActivePanel('alerts')}
              className="bg-red-500 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              {alertCount}
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-[#162440] border border-[#2A3F66] px-2 py-1 rounded-lg">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: currentUser.colorTag || '#1D9E75' }}
              />
              <span className="text-[11px] font-bold text-white max-w-[80px] truncate">
                {currentUser.name}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#1D9E75] text-white rounded-lg cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-1.5 rounded-lg bg-[#162440] hover:bg-[#1E2F4A] text-slate-200 border border-[#2A3F66] cursor-pointer"
          >
            {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0A1628] text-white flex flex-col h-full max-w-xs w-4/5 shadow-2xl border-r border-[#1E2F4A]"
          >
            <div className="p-4 flex items-center justify-between border-b border-[#1E2F4A]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#1D9E75] flex items-center justify-center font-bold text-sm">
                  E
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">EFCPL MES</div>
                  <div className="text-[10px] text-slate-400 font-mono">Pune Plant</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded bg-[#162440] text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile info in drawer */}
            {currentUser && (
              <div className="p-3 bg-[#162440]/80 border-b border-[#1E2F4A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentUser.colorTag || '#1D9E75' }}
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {currentUser.roleName || 'Staff'} {currentUser.isSystemAdmin && '👑'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onLogout?.();
                  }}
                  className="p-1 text-slate-400 hover:text-red-400"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-[#0A1628] text-slate-300">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePanel(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive ? 'bg-[#1D9E75] text-white font-semibold shadow-xs' : 'bg-[#162440]/50 text-slate-300 hover:bg-[#162440]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A1628] border-t border-[#1E2F4A] flex justify-around py-1.5 shadow-lg">
        {mainBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] font-medium relative px-2 py-1 cursor-pointer transition-colors ${
                isActive ? 'text-[#1D9E75] font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-[#1D9E75]' : 'text-slate-400'}`} />
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
