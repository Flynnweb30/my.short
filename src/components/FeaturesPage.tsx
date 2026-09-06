import React, { useState } from 'react';
import {
  Globe,
  Zap,
  BarChart3,
  Lock,
  QrCode,
  Sliders,
  Clock,
  Download,
  Smartphone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Check,
  Layers,
} from 'lucide-react';
import { AuthMode } from '../types';

interface FeaturesPageProps {
  onNavigateHome: () => void;
  onTriggerAuth: (mode?: AuthMode) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onNavigateHome,
  onTriggerAuth,
}) => {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const features = [
    {
      id: 'custom-domains',
      title: 'Branded Custom Vanity Domains',
      badge: 'PRO & ENTERPRISE',
      icon: Globe,
      color: 'from-indigo-500 to-blue-600',
      description:
        'Eliminate generic short links. Route all traffic through your own branded domain (e.g. link.yourcompany.com) with automatic Let\'s Encrypt SSL certificates and instantaneous DNS verification.',
      bullets: [
        'Automatic CNAME & TXT verification via Google Cloud DNS',
        'Auto-provisioned TLS certificates renewed every 90 days',
        'Increases brand credibility and click-through rates by up to 34%',
        'Deployable instantly on Render.com, Vercel, or custom CDN edge',
      ],
    },
    {
      id: 'telemetry',
      title: 'Deep Click Telemetry & Analytics',
      badge: 'REAL-TIME ATTRIBUTION',
      icon: BarChart3,
      color: 'from-purple-500 to-indigo-600',
      description:
        'Capture critical traffic telemetry on every redirection event without tracking scripts or privacy-invasive third-party cookies.',
      bullets: [
        'Device classification: Desktop, Tablet, and Mobile devices',
        'Browser & OS detection (Chrome, Safari, Edge, Firefox, Brave)',
        'Referral traffic intelligence (Google Search, Twitter/X, LinkedIn, WhatsApp)',
        'One-click CSV telemetry export for marketing team analysis',
      ],
    },
    {
      id: 'utm-builder',
      title: 'Dynamic UTM Campaign Builder',
      badge: 'MARKETING READY',
      icon: Sliders,
      color: 'from-pink-500 to-rose-600',
      description:
        'Build structured marketing links with standardized campaign parameters (utm_source, utm_medium, utm_campaign) that pass cleanly to Google Analytics and your internal tracking.',
      bullets: [
        'Presets for Newsletter, Twitter, LinkedIn, and Product Hunt',
        'Automatic URL encoding and query string formatting',
        'Prevents broken parameters and human typos',
      ],
    },
    {
      id: 'passcode-protection',
      title: 'Passcode Protection & Security',
      badge: 'SECURE ACCESS',
      icon: Lock,
      color: 'from-amber-500 to-orange-600',
      description:
        'Restricted-access short links protected by custom passcodes. Ideal for private pitch decks, investor documents, internal staging URLs, and gated beta launches.',
      bullets: [
        'Password check before redirection occurs',
        'Protects sensitive company documents and private previews',
        'Can be updated or removed at any time from your dashboard',
      ],
    },
    {
      id: 'expiry-alerts',
      title: '24-Hour Expiry Alerts & Permanent Retention',
      badge: 'AUTOMATED LIFECYCLE',
      icon: Clock,
      color: 'from-emerald-500 to-teal-600',
      description:
        'Never let a critical promotional link go dead. Proactive in-app alert toasts warn you 24 hours before any custom-alias link expires, allowing one-click lifetime extension.',
      bullets: [
        'Automatic time-to-live countdown tracking',
        'Unobtrusive floating toast notifications in your dashboard',
        'Single-click "Make Permanent" upgrade',
      ],
    },
    {
      id: 'qr-codes',
      title: 'High-Resolution Vector QR Codes',
      badge: 'PRINT & DIGITAL',
      icon: QrCode,
      color: 'from-blue-500 to-cyan-600',
      description:
        'Generate instant QR codes with customizable canvas resolution, clean error correction, and instant download for flyers, business cards, and slide decks.',
      bullets: [
        'Direct PNG/SVG export ready for high-DPI print reproduction',
        'Embedded short URL encoding for rapid mobile camera scanning',
        'Zero external API dependencies; generated entirely in browser',
      ],
    },
  ];

  const current = features[activeFeatureIndex];
  const CurrentIcon = current.icon;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Platform Capabilities
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Engineered for Speed, Reliability &amp; Brand Identity
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Everything you need to create custom branded short links, monitor real-time visitor devices, protect private documents, and scale traffic across campaigns.
        </p>
      </div>

      {/* Featured Banner with Analytics Telemetry Image */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900/80 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-6 sm:p-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" /> Telemetry &amp; Device Intelligence
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Actionable Telemetry On Every Click
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Gain deep visibility into your audience without expensive third-party tracking suites. Every redirection through <strong className="text-white">my.short</strong> safely captures browser type, operating system, device family (Mobile/Desktop), and referral source into a clean, searchable, and exportable audit trail.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                Shorten a URL Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl relative aspect-video lg:aspect-auto lg:h-72 bg-slate-950">
            <img
              src="/src/assets/images/analytics-telemetry-1788666233677.avif"
              alt="Analytics and Telemetry Dashboard Visualization"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
              <span className="text-[11px] font-mono text-purple-200">Real-Time Telemetry Breakdown: Desktop 64% &bull; Mobile 31% &bull; Tablet 5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Feature Explorer */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Explore All Features
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Click any feature below to inspect detailed specifications and workflows.
          </p>
        </div>

        {/* Feature Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            const isSelected = activeFeatureIndex === idx;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => setActiveFeatureIndex(idx)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start gap-2 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/40'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold truncate w-full text-center sm:text-left">
                  {feat.title.split(' ')[0]} {feat.title.split(' ')[1]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Feature Detail Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                  {current.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {current.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Try in Shortener <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            {current.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.bullets.map((bullet, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 p-8 sm:p-12 text-center space-y-4">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ready to brand your links and track visitors?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Sign up today to create custom domains, set password protection, build campaign UTMs, and enjoy unlimited permanent links.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onTriggerAuth('signup')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
          >
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
};