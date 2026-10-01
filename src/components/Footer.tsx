import React from 'react';
import { Link2, Shield, Heart, Tag, Globe, LifeBuoy } from 'lucide-react';
import { AppTab } from '../types';

interface FooterProps {
  onNavigateTab?: (tab: AppTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const navigate = (tab: AppTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-900/60 backdrop-blur-xl border-t border-white/10 py-10 mt-auto relative z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <button
              onClick={() => navigate('shorten')}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30 flex items-center justify-center text-white text-xs">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white tracking-tight">
                my<span className="text-indigo-400">.short</span>
              </span>
            </button>
            <span className="text-slate-700 hidden sm:inline">&middot;</span>
            <p className="text-xs text-slate-500">
              &copy; 2026 my.short &mdash; Production Telemetry &amp; UTM Analytics Platform
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
            <button
              onClick={() => navigate('shorten')}
              className="hover:text-indigo-400 transition-colors"
            >
              Shorten
            </button>

            <button
              onClick={() => navigate('utm')}
              className="hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <Tag className="w-3 h-3 text-indigo-400" />
              <span>UTM Builder</span>
            </button>

            <button
              onClick={() => navigate('features')}
              className="hover:text-indigo-400 transition-colors"
            >
              Features
            </button>

            <button
              onClick={() => navigate('pricing')}
              className="hover:text-indigo-400 transition-colors"
            >
              Pricing
            </button>

            <button
              onClick={() => navigate('settings')}
              className="hover:text-indigo-400 transition-colors"
            >
              Custom Domains &amp; API
            </button>

            <button
              onClick={() => navigate('privacy')}
              className="hover:text-indigo-400 transition-colors"
            >
              Privacy Policy
            </button>

            <button
              onClick={() => navigate('terms')}
              className="hover:text-indigo-400 transition-colors"
            >
              Terms of Service
            </button>

            <button
              onClick={() => navigate('contact')}
              className="hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <LifeBuoy className="w-3 h-3 text-indigo-400" />
              <span>Contact Support</span>
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
};
