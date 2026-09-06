import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';
import { AuthMode } from '../types';

interface PricingPageProps {
  onTriggerAuth: (mode?: AuthMode) => void;
  onNavigateTab: (tab: any) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onTriggerAuth,
  onNavigateTab,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      name: 'Guest Pass',
      badge: 'NO LOGIN NEEDED',
      price: '$0',
      period: 'forever',
      description: 'Quick links for casual sharing and immediate redirections.',
      features: [
        'Instant URL shortening',
        'Standard my.short domain',
        'Basic click counter',
        'Standard QR code generation',
        '48-Hour link lifetime',
      ],
      highlight: false,
      cta: 'Shorten Link as Guest',
      action: () => onNavigateTab('shorten'),
      popular: false,
    },
    {
      name: 'Pro Member',
      badge: 'RECOMMENDED',
      price: '$0',
      period: 'free in public preview',
      description: 'Full power for creators, marketers, and independent brands.',
      features: [
        'Branded custom vanity domains (e.g. link.yourbrand.com)',
        'Automatic SSL certificate provisioning',
        'Permanent links (never expire)',
        'Deep device, browser & referrer telemetry',
        'Passcode-protected short links',
        'Dynamic UTM campaign builder',
        '24-Hour link expiry warning alerts',
        'Full CSV click log data export',
      ],
      highlight: true,
      cta: 'Create Free Account',
      action: () => onTriggerAuth('signup'),
      popular: true,
    },
    {
      name: 'Enterprise Cloud',
      badge: 'FOR TEAMS',
      price: 'Contact Us',
      period: 'annual billing',
      description: 'Dedicated edge proxy infrastructure and team collaboration.',
      features: [
        'Unlimited custom domains & apex redirects',
        'Global Anycast edge network (<15ms p99 latency)',
        'Custom SSL SAN certificate uploads',
        'Role-based team workspace access',
        'Dedicated IP address pools',
        '99.99% uptime SLA guarantee',
        'Priority 24/7 engineering support',
      ],
      highlight: false,
      cta: 'Talk to Sales',
      action: () => {
        window.location.href = 'mailto:support@my.short?subject=Enterprise%20Inquiry';
      },
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'How does custom domain setup work?',
      a: 'In your User Settings, add your desired domain (e.g., go.yourbrand.com). You will receive copyable CNAME and TXT challenge records to add to your DNS provider (like Cloudflare, GoDaddy, or Namecheap). Once added, click "Verify DNS" to activate your domain and SSL certificate.',
    },
    {
      q: 'Are custom domain links really free during preview?',
      a: 'Yes! All Pro Member features—including branded custom domains, deep device and browser telemetry, password protection, and permanent link retention—are 100% free with no credit card required.',
    },
    {
      q: 'What happens to guest links created before signing in?',
      a: 'When you create an account or sign in, any temporary guest links created during your current browser session are automatically claimed and converted into permanent links that will never expire.',
    },
    {
      q: 'Can I protect sensitive links with a password?',
      a: 'Yes. Authenticated members can assign a passcode PIN to any short link. When visitors open the link, they must enter the correct passcode before being redirected to the target URL.',
    },
    {
      q: 'How does the 24-hour expiry alert work?',
      a: 'If you create a temporary or time-bounded link, our system monitors the expiration time and displays a discreet, unobtrusive floating toast in your dashboard 24 hours before it expires, giving you the option to extend it or make it permanent in a single click.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Simple, Transparent Pricing
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Choose the Perfect Plan for Your Brand
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Start for free as a guest or create an account to unlock custom domains, telemetry, and permanent links.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
              plan.highlight
                ? 'bg-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-950/40 ring-1 ring-indigo-500/50 -translate-y-2'
                : 'bg-slate-900/60 border border-white/10'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-[10px] font-extrabold tracking-wider uppercase text-white shadow-md">
                Most Popular
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {plan.badge}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-xs text-slate-400 min-h-[32px] mb-6">
                {plan.description}
              </p>

              <div className="mb-6 flex items-baseline gap-1.5 pb-6 border-b border-white/10">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                <span className="text-xs text-slate-400">/ {plan.period}</span>
              </div>

              <div className="space-y-3 mb-8">
                <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
                  Included Features:
                </span>
                {plan.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={plan.action}
              className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md ${
                plan.highlight
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-600/30'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              {plan.cta} &rarr;
            </button>
          </div>
        ))}
      </div>

      {/* Cloud Infrastructure Banner with Pricing Illustration */}
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative aspect-video sm:aspect-auto sm:h-52 bg-slate-950">
            <img
              src="/src/assets/images/pricing-cloud-plan-1788666247878.avif.jpg"
              alt="Enterprise Cloud Plan Architecture Diagram"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
              <span className="text-[10px] font-mono text-indigo-300">Edge Redirection &bull; 99.99% Availability</span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" /> High-Performance Infrastructure
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Enterprise-Grade Reliability for Every Short Link
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every link created on my.short is powered by distributed Google Cloud and Render.com edge containers. Redirections happen instantly, avoiding sluggish intermediate redirects and preserving SEO link equity.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400 font-mono">
              <span>⚡ &lt;15ms Response Time</span>
              <span>🔒 Zero-Config SSL</span>
              <span>🌍 Global CDN Edge Routing</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Got questions about custom vanity domains or member benefits? We have answers.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {faq.q}
                  </span>
                  <span className="text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};