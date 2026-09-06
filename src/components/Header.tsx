import React from 'react';
import {
  Link2,
  LogOut,
  User,
  Sparkles,
  Layers,
  Lock,
  Globe,
  Sliders,
  Zap,
  Tag,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthMode, AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenAuth: (mode: AuthMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onOpenAuth }) => {
  const { user, profile, logout } = useAuth();

  const displayName =
    profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'My Account';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/70 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            id="brand-logo-button"
            onClick={() => onSelectTab('shorten')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/50 group-hover:scale-105 transition-transform">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold tracking-tight text-white">
              my<span className="text-indigo-400">.short</span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-shorten-button"
              onClick={() => onSelectTab('shorten')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'shorten'
                  ? 'text-white bg-white/10 border border-white/10 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Shorten
            </button>

            <button
              id="nav-my-links-button"
              onClick={() => onSelectTab('links')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'links'
                  ? 'text-white bg-white/10 border border-white/10 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Links</span>
              {!user && <Lock className="w-3 h-3 text-indigo-400 opacity-80" />}
            </button>

            <button
              id="nav-settings-button"
              onClick={() => onSelectTab('settings')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'text-white bg-white/10 border border-white/10 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Custom Domains</span>
              {!user && <Lock className="w-3 h-3 text-indigo-400 opacity-80" />}
            </button>

            <button
              id="nav-features-button"
              onClick={() => onSelectTab('features')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'features'
                  ? 'text-white bg-white/10 border border-white/10 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Features
            </button>

            <button
              id="nav-pricing-button"
              onClick={() => onSelectTab('pricing')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'pricing'
                  ? 'text-white bg-white/10 border border-white/10 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Pricing
            </button>
          </nav>
        </div>

        {/* User / Auth Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onSelectTab('settings')}
                className={`hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
                title="Account Settings & Custom Domains"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[130px]">{displayName}</span>
              </button>

              <button
                id="header-logout-button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-login-button"
                onClick={() => onOpenAuth('signin')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Sign In
              </button>

              <button
                id="header-signup-button"
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Sub-Navigation Scrollable Bar */}
      <div className="md:hidden flex overflow-x-auto no-scrollbar border-t border-white/10 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md justify-between gap-1 text-xs">
        <button
          id="mobile-nav-shorten"
          onClick={() => onSelectTab('shorten')}
          className={`px-3 py-1 rounded-lg shrink-0 font-medium transition-all ${
            activeTab === 'shorten'
              ? 'text-white bg-white/15 border border-white/10'
              : 'text-slate-400'
          }`}
        >
          Shorten
        </button>
        <button
          id="mobile-nav-links"
          onClick={() => onSelectTab('links')}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg shrink-0 font-medium transition-all ${
            activeTab === 'links'
              ? 'text-white bg-white/15 border border-white/10'
              : 'text-slate-400'
          }`}
        >
          <span>My Links</span>
          {!user && <Lock className="w-2.5 h-2.5 text-indigo-400 opacity-80" />}
        </button>
        <button
          id="mobile-nav-settings"
          onClick={() => onSelectTab('settings')}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg shrink-0 font-medium transition-all ${
            activeTab === 'settings'
              ? 'text-white bg-white/15 border border-white/10'
              : 'text-slate-400'
          }`}
        >
          <span>Domains</span>
          {!user && <Lock className="w-2.5 h-2.5 text-indigo-400 opacity-80" />}
        </button>
        <button
          id="mobile-nav-features"
          onClick={() => onSelectTab('features')}
          className={`px-3 py-1 rounded-lg shrink-0 font-medium transition-all ${
            activeTab === 'features'
              ? 'text-white bg-white/15 border border-white/10'
              : 'text-slate-400'
          }`}
        >
          Features
        </button>
        <button
          id="mobile-nav-pricing"
          onClick={() => onSelectTab('pricing')}
          className={`px-3 py-1 rounded-lg shrink-0 font-medium transition-all ${
            activeTab === 'pricing'
              ? 'text-white bg-white/15 border border-white/10'
              : 'text-slate-400'
          }`}
        >
          Pricing
        </button>
      </div>
    </header>
  );
};

