'use client';

import React from 'react';
import {
  BarChart3,
  Bell,
  Wheat,
  PackageCheck,
  RefreshCw,
  Factory,
  Box,
  Truck,
  PlusCircle,
  ShieldCheck,
  Users,
  ClipboardList,
  ShoppingCart,
  Boxes,
  FlaskConical,
} from 'lucide-react';

interface SidebarProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
  alertCount: number;
}

export default function Sidebar({ activePanel, setActivePanel, alertCount }: SidebarProps) {
  const navItems = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },

    { section: 'Inventory' },
    { id: 'raw-materials', label: 'Raw Materials (RM)', icon: Wheat },
    { id: 'packaged-materials', label: 'Packaged Materials (PM)', icon: Boxes },

    { section: 'Operations' },
    { id: 'op-rm-issue', label: 'RM Issue', icon: RefreshCw },
    { id: 'op-production', label: 'Production', icon: Factory },
    { id: 'op-packaging-issue', label: 'Packaging Issue', icon: Box },
    { id: 'op-finished-goods', label: 'Finished Goods', icon: PackageCheck },
    { id: 'op-dispatch', label: 'Dispatch', icon: Truck },

    { section: 'Lab Tests' },
    { id: 'lab-coa', label: 'COA Certificates', icon: FlaskConical },

    { section: 'Master Entry Hub' },
    { id: 'add-materials', label: 'Add Materials / Items', icon: PlusCircle },

    { section: 'Admin & Governance' },
    { id: 'admin-roles', label: 'Discord Roles & Perms', icon: ShieldCheck },
    { id: 'admin-users', label: 'Staff Users Manager', icon: Users },
    { id: 'reports', label: 'Reports & Valuation', icon: ClipboardList },
    { id: 'po-suggestions', label: 'PO Suggestions', icon: ShoppingCart },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-[#0A1628] text-slate-300 flex-col fixed top-0 left-0 bottom-0 z-50 border-r border-[#1E2F4A]">
      {/* BRAND LOGO */}
      <div className="p-5 border-b border-[#1E2F4A]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            E
          </div>
          <div>
            <div className="text-white font-bold text-lg tracking-tight leading-none">EFCPL MES</div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider mt-1 uppercase">
              Factory Ops & Inventory
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION ITEMS */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div
                key={idx}
                className="px-3 pt-4 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest"
              >
                {item.section}
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = activePanel === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(item.id!)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1D9E75] text-white font-semibold shadow-sm'
                  : 'hover:bg-[#162440] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-[#1D9E75]' : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* FOOTER METADATA */}
      <div className="p-4 border-t border-[#1E2F4A] text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <div>
          <span>Database Engine</span>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            PostgreSQL (Neon)
          </div>
        </div>
        <ShieldCheck className="w-4 h-4 text-slate-600" />
      </div>
    </aside>
  );
}
