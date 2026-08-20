'use client';

import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, UserCheck, KeyRound, ArrowRight, X } from 'lucide-react';
import { checkUserLoginStatus, setupFirstTimePassword, loginUser } from '@/actions/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [step, setStep] = useState<'IDENTIFIER' | 'PASSWORD_LOGIN' | 'FIRST_TIME_SETUP'>('IDENTIFIER');
  const [identifier, setIdentifier] = useState('admin@efcpl.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // First-time setup info
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCheckIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await checkUserLoginStatus(identifier);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Account not found');
      return;
    }

    setUserInfo(res);
    setStep('PASSWORD_LOGIN');
  };

  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await setupFirstTimePassword(identifier, password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Password created successfully!');
      setPassword('');
      setConfirmPassword('');
      setStep('PASSWORD_LOGIN');
    } else {
      setError(res.error || 'Failed to set password');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginUser(identifier, password);
    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#0D1B2E] rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#1E2F4A] animate-in fade-in zoom-in duration-150 text-white">
        {/* HEADER */}
        <div className="bg-[#0A1628] text-white p-5 sm:p-6 text-center relative border-b border-[#1E2F4A]">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#162440] rounded-lg transition-colors cursor-pointer absolute top-3 sm:top-4 right-3 sm:right-4"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1D9E75] flex items-center justify-center font-bold text-xl sm:text-2xl mx-auto shadow-md mb-2">
            E
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">EFCPL Authentication Portal</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-1">
            {step === 'FIRST_TIME_SETUP'
              ? 'First-Time Password Setup'
              : step === 'PASSWORD_LOGIN'
              ? `Sign in as ${userInfo?.name || 'User'}`
              : 'Enter Username or Email Address'}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs font-medium">
              {successMsg}
            </div>
          )}

          {/* STEP 1: IDENTIFIER (EMAIL / USERNAME) */}
          {step === 'IDENTIFIER' && (
            <form onSubmit={handleCheckIdentifier} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Email Address or Username *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none font-medium transition-all"
                    placeholder="admin@efcpl.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="bg-[#162440] border border-[#2A3F66] p-3 sm:p-4 rounded-xl text-[11px] sm:text-xs text-slate-300 font-mono space-y-1">
                <div className="font-bold text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Default Admin Access:
                </div>
                <div>Username: <span className="font-bold text-emerald-400">admin@efcpl.com</span></div>
                <div>Password: <span className="font-bold text-emerald-400">admin123password</span></div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#1D9E75] hover:bg-[#168361] rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Checking...' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: FIRST-TIME PASSWORD SETUP */}
          {step === 'FIRST_TIME_SETUP' && (
            <form onSubmit={handleFirstTimeSetup} className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 sm:p-4 rounded-xl text-xs text-blue-300 space-y-1">
                <div className="font-bold flex items-center gap-1 text-white">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  Welcome, {userInfo?.name}!
                </div>
                <p className="text-[11px] text-blue-200/80">
                  This is your first login. Please create a password for your account (@{userInfo?.username}).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Create Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-2 text-center"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Password & Continue'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PASSWORD LOGIN FOR REGISTERED ACCOUNTS */}
          {step === 'PASSWORD_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="bg-[#162440] border border-[#2A3F66] p-2.5 sm:p-3 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium">Account: </span>
                  <span className="font-bold text-white">{userInfo?.name || identifier}</span>
                  <span className="text-slate-400 font-mono text-[10px] block">@{userInfo?.username || identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="text-[11px] font-bold text-[#1D9E75] hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Enter Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 bg-[#162440] hover:bg-[#1E2F4A] border border-[#2A3F66] rounded-lg transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#1D9E75] hover:bg-[#168361] rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
