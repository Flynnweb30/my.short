import React from 'react';
import { Globe, Shield, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppTab, AuthMode } from '../types';

interface SettingsPageProps {
  onTriggerAuth: (mode: AuthMode) => void;
  onNavigateTab: (tab: AppTab) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onTriggerAuth, onNavigateTab }) => {
  const { user, profile, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to access settings</h2>
        <p className="text-sm text-slate-400 mb-6">Manage your custom domains, account, and preferences.</p>
        <button onClick={() => onTriggerAuth('signin')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage your account and custom domain configuration.</p>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Account</h3>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex justify-between p-2 rounded-lg bg-white/5">
            <span className="text-slate-400">Display Name</span>
            <span className="font-semibold text-white">{profile?.displayName || user.displayName || '—'}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-white/5">
            <span className="text-slate-400">User ID</span>
            <span className="font-mono text-slate-400 text-[10px] truncate max-w-[200px]">{user.uid}</span>
          </div>
        </div>
        <button onClick={logout}
          className="mt-4 px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition-colors">
          Sign Out
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Custom Domains</h3>
            <p className="text-xs text-slate-400">Coming soon — connect your own branded short domain.</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Custom domain configuration will be available in a future release. Your current shortlinks use the default <code className="text-indigo-400 font-mono">my.short</code> domain.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Privacy &amp; Telemetry</h3>
            <p className="text-xs text-slate-400">We record only legitimate visitor clicks.</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          No mock clicks, no simulated traffic. Every telemetry event reflects a real visitor redirect. Visitor fingerprints are stored locally in your browser.
        </p>
      </div>
    </div>
  );
};
