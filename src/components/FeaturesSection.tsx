import React from 'react';
import { Link2, BarChart3, ShieldCheck } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Link2 className="w-6 h-6 text-indigo-400" />,
      bg: 'bg-indigo-500/15 border-indigo-500/30',
      title: 'Smart Shortening',
      description: 'Create short, clean URLs instantly. Customize with your own alias for branding and effortless sharing.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
      bg: 'bg-purple-500/15 border-purple-500/30',
      title: 'Detailed Analytics',
      description: 'Track every click with real-time counters and insights into your link traffic and audience activity.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      bg: 'bg-blue-500/15 border-blue-500/30',
      title: 'Secure & Private',
      description: 'Enterprise-grade Firestore protection, strict access control, and link expiration safeguards.',
    },
  ];

  return (
    <section className="py-16 bg-slate-900/30 backdrop-blur-sm border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Why Choose <span className="text-indigo-400">my.short</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Everything you need to create, manage, and monitor high-performance short links.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-xl hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all flex flex-col items-start"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${feature.bg}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
