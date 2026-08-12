'use client';

import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, UserCheck, KeyRound, ArrowRight } from 'lucide-react';
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
    if (res.status === 'NEEDS_PASSWORD_SETUP') {
      setStep('FIRST_TIME_SETUP');
    } else {
      setStep('PASSWORD_LOGIN');
    }
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
    const res = await setupFirstTimePassword(userInfo.userId, password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Password created successfully!');
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

    const res = await loginUser({ identifier, password });
    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="bg-[#0A1628] text-white p-6 text-center relative">
          <div className="w-12 h-12 rounded-xl bg-[#1D9E75] flex items-center justify-center font-bold text-2xl mx-auto shadow-md mb-2">
            E
          </div>
          <h2 className="text-xl font-bold tracking-tight">EFCPL Authentication Portal</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {step === 'FIRST_TIME_SETUP'
              ? 'First-Time Password Setup'
              : step === 'PASSWORD_LOGIN'
              ? `Sign in as ${userInfo?.name || 'User'}`
              : 'Enter Username or Email Address'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-medium">
              {successMsg}
            </div>
          )}

          {/* STEP 1: IDENTIFIER (EMAIL / USERNAME) */}
          {step === 'IDENTIFIER' && (
            <form onSubmit={handleCheckIdentifier} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address or Username *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    placeholder="admin@efcpl.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] text-slate-600 font-mono space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Default Admin Access:
                </div>
                <div>Username / Email: <span className="font-bold text-slate-900">admin@efcpl.com</span></div>
                <div>Password: <span className="font-bold text-slate-900">admin123password</span></div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-md flex items-center gap-1.5"
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
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Welcome, {userInfo?.name}!
                </div>
                <p className="text-[11px] text-blue-800">
                  This is your first login. Please create a password for your account (@{userInfo?.username}).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Create Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md"
                >
                  {loading ? 'Saving...' : 'Save Password & Continue'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PASSWORD LOGIN FOR REGISTERED ACCOUNTS */}
          {step === 'PASSWORD_LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium">Account: </span>
                  <span className="font-bold text-slate-900">{userInfo?.name || identifier}</span>
                  <span className="text-slate-400 font-mono text-[10px] block">@{userInfo?.username || identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('IDENTIFIER')}
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enter Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1D9E75] hover:bg-[#0F6E56] rounded-lg shadow-md"
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
