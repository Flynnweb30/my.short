import React from 'react';
import { Check, Sparkles, ArrowLeft } from 'lucide-react';
import { AuthMode, AppTab } from '../types';

interface PricingPageProps {
  onTriggerAuth: (mode: AuthMode) => void;
  onNavigateTab: (tab: AppTab) => void;
}

const PLANS = [
  {
    name: 'Guest',
    price: 'Free',
    period: 'no account needed',
    features: ['Shorten unlimited URLs', '48-hour link expiry', 'Basic click counter', 'QR code generation'],
    cta: 'Start Shortening',
    highlight: false,
  },
  {
    name: 'Free Account',
    price: '$0',
    period: 'forever',
    features: ['Permanent shortlinks', 'Custom aliases', 'Full telemetry dashboard', 'Interactive world click map', 'UTM campaign builder', 'CSV telemetry export', 'Password protection'],
    cta: 'Create Free Account',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 'Coming Soon',
    period: 'custom domain ready',
    features: ['Everything in Free', 'Custom branded domains', 'Advanced team analytics', 'API access', 'Priority support'],
    cta: 'Notify Me',
    highlight: false,
  },
];

export const PricingPage: React.FC<PricingPageProps> = ({ onTriggerAuth, onNavigateTab }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div>
        <button onClick={() => onNavigateTab('shorten')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shortener
        </button>
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Simple, Honest Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Start free. Scale when ready.
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            No credit card required. All core telemetry features are free forever.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => (
          <div key={i}
            className={`p-6 rounded-3xl border backdrop-blur-xl relative ${
              plan.highlight
                ? 'bg-gradient-to-b from-indigo-600/20 to-slate-900/80 border-indigo-500/40 shadow-2xl shadow-indigo-500/20'
                : 'bg-slate-900/60 border-white/10'
            }`}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
            )}
            <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-white">{plan.price}</span>
              <span className="text-xs text-slate-400">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feat, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => plan.name === 'Pro' ? alert('Pro plan coming soon!') : onTriggerAuth('signup')}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                plan.highlight
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
