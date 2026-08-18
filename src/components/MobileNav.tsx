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
} from 'lucide-react';

interface MobileNavProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
  alertCount: number;
}

export default function MobileNav({ activePanel, setActivePanel, alertCount }: MobileNavProps) {
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
      <div className="md:hidden sticky top-0 z-40 bg-[#0A1628] text-white px-4 py-3 flex items-center justify-between border-b border-[#1E2F4A] shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#1D9E75] flex items-center justify-center font-bold text-sm">
            E
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">EFCPL MES</span>
            <span className="text-[9px] font-mono text-slate-400 block -mt-1">Factory Ops</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {alertCount > 0 && (
            <button
              onClick={() => setActivePanel('alerts')}
              className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              {alertCount}
            </button>
          )}

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-1.5 rounded-lg bg-[#162440] text-slate-200 cursor-pointer"
          >
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col">
          <div className="bg-[#0A1628] text-white p-4 flex items-center justify-between border-b border-[#1E2F4A]">
            <span className="font-bold text-base">Navigation Menu</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1 rounded bg-[#162440] text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0A1628] text-slate-300">
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
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive ? 'bg-[#1D9E75] text-white font-semibold' : 'bg-[#162440]/60 text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A1628] border-t border-[#1E2F4A] flex justify-around py-2 shadow-lg">
        {mainBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium relative px-2 py-1 cursor-pointer ${
                isActive ? 'text-[#1D9E75] font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#1D9E75]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
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
