'use client';

import React from 'react';
import { User, LogIn, LogOut, Shield, Bell, RefreshCw } from 'lucide-react';

interface TopbarProps {
  title: string;
  alertCount: number;
  currentUser: any;
  onAlertClick?: () => void;
  onRefresh?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export default function Topbar({
  title,
  alertCount,
  currentUser,
  onAlertClick,
  onRefresh,
  onLoginClick,
  onLogoutClick,
  onOpenLogin,
  onLogout,
}: TopbarProps) {
  return (
    <header className="hidden md:flex bg-[#0A1628] border-b border-[#1E2F4A] px-4 lg:px-7 min-h-14 py-2.5 items-center justify-between sticky top-0 z-30 shadow-sm gap-3">
      {/* Title */}
      <div className="font-bold text-sm lg:text-base text-white tracking-tight flex items-center gap-2 shrink-0">
        <span>{title}</span>
      </div>

      {/* Actions & Status */}
      <div className="flex flex-wrap items-center justify-end gap-2 lg:gap-3">
        {/* Alert status button */}
        <button
          onClick={onAlertClick}
          className={`px-2.5 lg:px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            alertCount > 0
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{alertCount > 0 ? `${alertCount} Alert${alertCount !== 1 ? 's' : ''}` : '0 Alerts'}</span>
        </button>

        {/* Location badge */}
        <div className="hidden sm:inline-flex text-xs font-mono bg-[#162440] text-slate-300 px-2.5 lg:px-3 py-1 rounded-full border border-[#2A3F66] shrink-0">
          EFCPL · Pune Plant
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="text-xs font-medium text-slate-300 hover:text-white bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] px-2.5 lg:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Auth Profile Status */}
        {currentUser ? (
          <div className="flex items-center gap-2 border-l border-[#1E2F4A] pl-2 lg:pl-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#162440] border border-[#2A3F66] px-2.5 py-1 rounded-lg">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentUser.colorTag || '#1D9E75' }}
              />
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight max-w-[120px] truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                  {currentUser.roleName || 'Staff'} {currentUser.isSystemAdmin && '👑'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout || onLogoutClick}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin || onLoginClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1D9E75] hover:bg-[#168361] transition-all shadow-xs cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Admin</span>
          </button>
        )}
      </div>
    </header>
  );
}
