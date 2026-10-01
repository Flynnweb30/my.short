import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface CtaBannerProps {
  onGetStarted: () => void;
  isLoggedIn: boolean;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ onGetStarted, isLoggedIn }) => {
  if (isLoggedIn) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20 border border-indigo-500/30 p-8 sm:p-12 text-center backdrop-blur-xl">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Ready to track every real click?
        </h2>
        <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
          Create a free account to unlock unlimited links, custom aliases, permanent retention, and full telemetry dashboards.
        </p>
        <button onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl shadow-2xl hover:scale-105 transition-transform">
          <Sparkles className="w-4 h-4" />
          <span>Get Started Free</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
