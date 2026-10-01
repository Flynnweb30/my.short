import React from 'react';
import { ArrowLeft, Globe, Tag, Shield, Zap, BarChart3, QrCode, Sparkles } from 'lucide-react';
import { AuthMode } from '../types';

interface FeaturesPageProps {
  onNavigateHome: () => void;
  onTriggerAuth: (mode: AuthMode) => void;
}

const FEATURES = [
  { icon: Globe, title: 'Interactive World Click Map', desc: 'High-performance SVG world map with interactive country nodes, local timezones, and click volume visualization.' },
  { icon: Tag, title: 'Full UTM Campaign Builder', desc: 'Real-time URL generation supporting all 6 UTM parameters with presets, lowercase sanitization, and parameter preservation.' },
  { icon: BarChart3, title: 'Precision Click Telemetry', desc: 'Every legitimate click recorded with unique event IDs. Distinct visitor tracking via persistent browser fingerprints.' },
  { icon: Shield, title: 'Password Protection', desc: 'Lock any short link behind a passcode. Only visitors with the correct code are routed to the destination.' },
  { icon: Zap, title: 'Instant Redirects with UTM Forwarding', desc: 'Lightning-fast client-side routing that preserves all query parameters end-to-end.' },
  { icon: QrCode, title: 'QR Code Generator', desc: 'Generate and download high-resolution PNG QR codes for any short link in one click.' },
];

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigateHome, onTriggerAuth }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div>
        <button onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shortener
        </button>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Full Feature Set
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          Everything you need to track real clicks
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          my.short is built for marketers, developers, and teams who need real visitor insights — not vanity metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:border-indigo-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20 border border-indigo-500/30 p-8 sm:p-10 text-center">
        <h2 className="text-2xl font-black text-white mb-3">Ready to get started?</h2>
        <p className="text-sm text-slate-300 mb-5 max-w-lg mx-auto">
          Create a free account and start tracking real visitor telemetry in under a minute.
        </p>
        <button onClick={() => onTriggerAuth('signup')}
          className="px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl shadow-2xl hover:scale-105 transition-transform">
          Sign Up Free
        </button>
      </div>
    </div>
  );
};
