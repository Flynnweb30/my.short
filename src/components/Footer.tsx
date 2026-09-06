import React, { useState } from 'react';
import { Link2, Shield, Heart } from 'lucide-react';
import { AppTab } from '../types';

interface FooterProps {
  onNavigateTab?: (tab: AppTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const openInfo = (title: string, body: string) => {
    setModalContent({ title, body });
  };

  return (
    <footer className="bg-slate-900/60 backdrop-blur-xl border-t border-white/10 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30 flex items-center justify-center text-white text-xs">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white tracking-tight">
                my<span className="text-indigo-400">.short</span>
              </span>
            </div>
            <span className="text-slate-700 hidden sm:inline">&middot;</span>
            <p className="text-xs text-slate-500">
              &copy; 2026 my.short &mdash; Fast, Free &amp; Production-Ready URL Shortener
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('features');
                } else {
                  openInfo(
                    'Features',
                    'my.short provides high-speed link shortening with instant redirection, custom aliases, QR code generation, real-time analytics, and expiration controls backed by Google Cloud Firestore.'
                  );
                }
              }}
              className="hover:text-indigo-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('pricing');
                } else {
                  openInfo(
                    'Pricing',
                    'my.short is 100% free forever for all standard users, with unlimited guest and authenticated link generation.'
                  );
                }
              }}
              className="hover:text-indigo-400 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('settings');
                } else {
                  openInfo(
                    'Custom Domains',
                    'Connect your custom vanity domains with automated SSL and DNS verification.'
                  );
                }
              }}
              className="hover:text-indigo-400 transition-colors"
            >
              Custom Domains
            </button>
            <button
              onClick={() =>
                openInfo(
                  'Privacy Policy',
                  'We respect your privacy. No personal data or tracking cookies are collected from visitors during redirection. Authenticated accounts only store email and user-generated link records.'
                )
              }
              className="hover:text-indigo-400 transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() =>
                openInfo(
                  'Terms of Service',
                  'By using my.short, you agree not to shorten malicious, phishing, or harmful URLs. Abusive links are immediately disabled.'
                )
              }
              className="hover:text-indigo-400 transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() =>
                openInfo(
                  'Contact Support',
                  'For technical inquiries or link abuse reporting, contact the my.short team via the AI Studio console.'
                )
              }
              className="hover:text-indigo-400 transition-colors"
            >
              Contact
            </button>
          </div>

        </div>
      </div>

      {/* Info Modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-2">{modalContent.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">{modalContent.body}</p>
            <button
              onClick={() => setModalContent(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
