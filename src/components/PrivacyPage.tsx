import React from 'react';
import { Shield, Lock, Eye, Database, Globe, UserCheck, ArrowLeft } from 'lucide-react';
import { AppTab } from '../types';

interface PrivacyPageProps {
  onNavigateHome: () => void;
  onNavigateTab?: (tab: AppTab) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigateHome, onNavigateTab }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shortener</span>
        </button>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>LEGAL &amp; COMPLIANCE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-400">
          Last updated: October 2026 &bull; Effective immediately for all visitors and registered members.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        
        {/* Section 1: Overview */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" /> 1. Commitment to User Privacy
          </h2>
          <p>
            At <strong>my.short</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;), we take privacy and data security seriously. This Privacy Policy describes how we collect, store, utilize, and protect data when you visit our website, use our link shortening services, or redirect through our tracking URLs.
          </p>
        </div>

        {/* Section 2: Data We Collect */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" /> 2. Information We Collect
          </h2>
          <div className="space-y-3 pl-2">
            <div>
              <h3 className="font-semibold text-white">A. Telemetry Click Data</h3>
              <p className="text-slate-400 text-xs mt-1">
                When a user clicks a shortened link (e.g., <code className="text-indigo-300">my.short/xyz</code>), our servers record telemetry metadata necessary for analytics reporting:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-400 mt-2 space-y-1">
                <li>Event timestamp and unique event ID</li>
                <li>Device category (Mobile, Tablet, Desktop)</li>
                <li>Browser name and Operating System (detected via User-Agent)</li>
                <li>Referrer URL (traffic source such as search engines or social media)</li>
                <li>Browser language and client Timezone</li>
                <li>Approximate geographic region (Country, Region, City) resolved via timezone and server network routing</li>
                <li>UTM campaign parameters attached to destination links</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white">B. Account Information</h3>
              <p className="text-slate-400 text-xs mt-1">
                For registered accounts, we store your email address, display name, and links you have generated. We do not sell, rent, or monetize your email or personal information to third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Cookie & Storage */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" /> 3. Cookies and Local Storage
          </h2>
          <p>
            We use minimal client-side storage (<code className="text-indigo-300">localStorage</code> and <code className="text-indigo-300">sessionStorage</code>) to:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
            <li>Distinguish <strong>Total Clicks</strong> from <strong>Unique Visitors</strong> accurately.</li>
            <li>Maintain authenticated user login sessions safely.</li>
            <li>Cache temporary links created during guest mode before account creation.</li>
          </ul>
          <p className="text-xs text-slate-400">
            We do not use intrusive third-party cross-site advertising trackers or sell profiling cookies.
          </p>
        </div>

        {/* Section 4: Data Security */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" /> 4. Security &amp; Infrastructure
          </h2>
          <p>
            All data in transit is encrypted using standard Transport Layer Security (TLS 1.3 / HTTPS). Data at rest is securely persisted on Google Cloud Firestore Enterprise with granular, validated Attribute-Based Access Control (ABAC) rules preventing unauthorized access.
          </p>
        </div>

        {/* Section 5: GDPR & CCPA Rights */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" /> 5. Your Rights (GDPR &amp; CCPA Compliance)
          </h2>
          <p>
            You have the right to request access to any personal data associated with your account, export your link telemetry logs in CSV format, or request complete deletion of your account and links at any time by contacting support or deleting links from your member dashboard.
          </p>
        </div>

        {/* Section 6: Contact */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 space-y-2">
          <h2 className="text-base font-bold text-white">Questions or Inquiries?</h2>
          <p className="text-xs text-slate-300">
            If you have any questions regarding this Privacy Policy or our security practices, please submit a message via our{' '}
            <button
              onClick={() => onNavigateTab?.('contact')}
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
            >
              Contact Support page
            </button>
            .
          </p>
        </div>

      </div>
    </div>
  );
};
