import React from 'react';
import { Globe, Tag, Shield, Zap, BarChart3, QrCode } from 'lucide-react';

const FEATURES = [
  { icon: Globe, title: 'Interactive World Map', desc: 'Real-time geographic click visualization with country nodes and local timezones.' },
  { icon: Tag, title: 'Full UTM Builder', desc: 'Build campaign-tagged URLs with all 6 UTM parameters and one-click presets.' },
  { icon: BarChart3, title: 'Precision Telemetry', desc: 'Every legitimate click recorded. Unique visitors tracked via persistent fingerprints.' },
  { icon: Shield, title: 'Password Protection', desc: 'Lock any short link behind a passcode to control access.' },
  { icon: Zap, title: 'Instant Redirects', desc: 'Lightning-fast routing with UTM parameter forwarding preserved end-to-end.' },
  { icon: QrCode, title: 'QR Code Generator', desc: 'Generate downloadable QR codes for any of your short links instantly.' },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Everything you need to <span className="text-indigo-400">track smarter</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Built for marketers, developers, and teams who need real visitor insights — not vanity metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
