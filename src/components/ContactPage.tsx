import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
  ArrowLeft,
  LifeBuoy,
  Clock,
  Sparkles,
} from 'lucide-react';
import { submitContactFeedback } from '../services/urlService';
import { useAuth } from '../context/AuthContext';
import { AppTab } from '../types';

interface ContactPageProps {
  onNavigateHome: () => void;
  onNavigateTab?: (tab: AppTab) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateHome, onNavigateTab }) => {
  const { user } = useAuth();

  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const submissionId = await submitContactFeedback({
        name: name.trim(),
        email: email.trim(),
        category,
        message: message.trim(),
      });
      setSubmittedId(submissionId);
    } catch (err: any) {
      setError(err.message || 'Unable to submit your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />
          <span>SUPPORT &amp; FEEDBACK</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Contact the my.short Team
        </h1>
        <p className="text-sm text-slate-400">
          Have an inquiry, report a malicious link, or need technical help? We respond within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Form Card */}
        <div className="md:col-span-8 bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {submittedId ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Message Sent Successfully!</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you for reaching out. Your submission ID is <span className="font-mono text-indigo-300 font-bold">{submittedId}</span>. Our security and support staff will review your message promptly.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedId(null);
                    setMessage('');
                  }}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Inquiry Topic
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Report Malicious Link (Abuse)">Report Malicious Link (Abuse / Phishing)</option>
                  <option value="API & Developer Token Support">API &amp; Developer Token Support</option>
                  <option value="Custom Vanity Domain Setup">Custom Vanity Domain Setup</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Message Details *
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry, report link, or question in detail..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs"
              >
                {submitting ? 'Sending...' : 'Send Message'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Right Info Cards */}
        <div className="md:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Direct Correspondence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official notifications and link status alerts are routed directly through Google Cloud Firestore and AI Studio endpoints.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> Immediate Takedown
            </div>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              Phishing or malware links submitted through the abuse channel are quarantined automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-400" /> Response Time
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              We monitor submissions 24/7. High priority abuse reports are typically processed in under 2 hours.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
