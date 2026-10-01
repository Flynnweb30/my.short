import React from 'react';
import { FileText, AlertTriangle, ShieldCheck, CheckCircle2, ArrowLeft, Ban, Zap } from 'lucide-react';
import { AppTab } from '../types';

interface TermsPageProps {
  onNavigateHome: () => void;
  onNavigateTab?: (tab: AppTab) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigateHome, onNavigateTab }) => {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span>TERMS &amp; CONDITIONS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-400">
          Last revised: October 2026 &bull; Please review these terms carefully before utilizing our shortening or API services.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        
        {/* Section 1: Agreement to Terms */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" /> 1. Agreement to Terms
          </h2>
          <p>
            By accessing or using <strong>my.short</strong> (&ldquo;the Platform&rdquo;), whether as a guest visitor, registered member, or programmatic API user, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must discontinue use of the service immediately.
          </p>
        </div>

        {/* Section 2: Prohibited Content & Abuse */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 text-rose-300">
            <Ban className="w-4 h-4 text-rose-400" /> 2. Strict Prohibition on Abusive Content
          </h2>
          <p>
            You agree NEVER to use my.short to shorten, redirect to, or distribute links containing:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-2">
            <li>Malware, viruses, trojans, ransomware, spyware, or malicious code.</li>
            <li>Phishing scams, credential harvesting, or fraudulent banking impersonation.</li>
            <li>Spam, unsolicited mass messaging, or search engine manipulation.</li>
            <li>Content that infringes upon third-party intellectual property or copyrights.</li>
            <li>Harassment, threats, hate speech, or illicit material.</li>
          </ul>
          <p className="text-xs text-rose-300/90 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mt-3">
            <strong>Zero Tolerance Policy:</strong> Any short links found to violate these guidelines will be immediately disabled without notice, and associated IP addresses or user accounts permanently banned.
          </p>
        </div>

        {/* Section 3: Link Lifecycle & Expiry */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" /> 3. Link Expiration &amp; Account Tiers
          </h2>
          <p>
            Links created by unauthenticated <strong>Guest</strong> users are subject to an automatic <strong>48-hour expiration period</strong>. Registered account holders may create permanent links, configure custom aliases, attach passcodes, and monitor real-time telemetry.
          </p>
          <p className="text-xs text-slate-400">
            We reserve the right to prune inactive unowned guest links that have been expired for more than 30 days to maintain database hygiene.
          </p>
        </div>

        {/* Section 4: API & Programmatic Token Usage */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> 4. Personal API Tokens
          </h2>
          <p>
            Registered members may generate personal API tokens for programmatic URL shortening. You are responsible for safeguarding your secret tokens. Automated requests must comply with fair-use rate limits and not cause intentional denial of service.
          </p>
        </div>

        {/* Section 5: Limitation of Liability */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-400" /> 5. Disclaimer of Warranties &amp; Liability
          </h2>
          <p>
            The service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. my.short does not guarantee uninterrupted or error-free operation. Under no circumstances shall my.short or its operators be held liable for any damages resulting from destination websites, link downtime, or third-party content.
          </p>
        </div>

        {/* Section 6: Report Abuse or Contact */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 space-y-2">
          <h2 className="text-base font-bold text-white">Reporting Abuse</h2>
          <p className="text-xs text-slate-300">
            If you encounter a shortened link violating our safety standards, please submit an abuse report via our{' '}
            <button
              onClick={() => onNavigateTab?.('contact')}
              className="text-purple-400 hover:text-purple-300 underline font-semibold"
            >
              Contact Support page
            </button>{' '}
            for swift review and takedown.
          </p>
        </div>

      </div>
    </div>
  );
};
