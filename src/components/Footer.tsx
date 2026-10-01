import React from 'react';
import { Link2 } from 'lucide-react';
import { AppTab } from '../types';

interface FooterProps {
  onNavigateTab: (tab: AppTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  return (
    <footer className="border-t border-white/10 bg-slate-950 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                <Link2 className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-white">my<span className="text-indigo-400">.short</span></span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              High-performance URL shortener with real-time visitor telemetry, interactive world click maps, and structured UTM attribution.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => onNavigateTab('shorten')} className="hover:text-white">Shorten</button></li>
              <li><button onClick={() => onNavigateTab('links')} className="hover:text-white">Dashboard</button></li>
              <li><button onClick={() => onNavigateTab('utm')} className="hover:text-white">UTM Builder</button></li>
              <li><button onClick={() => onNavigateTab('pricing')} className="hover:text-white">Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => onNavigateTab('features')} className="hover:text-white">Features</button></li>
              <li><button onClick={() => onNavigateTab('settings')} className="hover:text-white">Custom Domains</button></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} my.short — All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500">
            Real visitor telemetry · No fake clicks · Global click map
          </p>
        </div>
      </div>
    </footer>
  );
};
