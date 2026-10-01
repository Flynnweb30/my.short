import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CtaBannerProps {
  onGetStarted: () => void;
  isLoggedIn: boolean;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ onGetStarted, isLoggedIn }) => {
  if (isLoggedIn) {
    return null;
  }

  return (
    <section className="py-12 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600/25 via-purple-600/15 to-indigo-700/25 backdrop-blur-2xl border border-indigo-500/30 p-8 sm:p-12 shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Subtle background graphic circles */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
              Ready to get started?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base font-normal">
              Create your free account today to unlock URL history, click analytics, and custom branded aliases.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              id="cta-get-started-button"
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/40 transition-all border border-indigo-400/30"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
