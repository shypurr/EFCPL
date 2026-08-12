'use client';

import React from 'react';
import { User, LogIn, LogOut, Shield } from 'lucide-react';

interface TopbarProps {
  title: string;
  alertCount: number;
  currentUser: any;
  onAlertClick: () => void;
  onRefresh: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export default function Topbar({
  title,
  alertCount,
  currentUser,
  onAlertClick,
  onRefresh,
  onLoginClick,
  onLogoutClick,
}: TopbarProps) {
  return (
    <header className="hidden md:flex bg-white border-b border-slate-200 px-7 h-14 items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="font-semibold text-base text-slate-900 tracking-tight">{title}</div>

      <div className="flex items-center gap-3">
        <button
          onClick={onAlertClick}
          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
            alertCount > 0
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-2xs'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {alertCount > 0 ? `${alertCount} Active Alert${alertCount !== 1 ? 's' : ''}` : '✅ 0 Alerts'}
        </button>

        <div className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
          EFCPL · Pune Plant
        </div>

        <button
          onClick={onRefresh}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5"
        >
          <span>⟳</span> Refresh
        </button>

        {/* AUTH PROFILE STATUS */}
        {currentUser ? (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentUser.colorTag || '#1D9E75' }}
              />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentUser.roleName} {currentUser.isSystemAdmin && '👑'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogoutClick}
              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0A1628] hover:bg-[#1E2F4A] transition-all shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In / Admin
          </button>
        )}
      </div>
    </header>
  );
}
