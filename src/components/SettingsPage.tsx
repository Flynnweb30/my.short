import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Star,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Server,
  Key,
  Lock,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CustomDomainRecord, AuthMode } from '../types';
import {
  getUserDomains,
  addCustomDomain,
  verifyCustomDomain,
  setPrimaryDomain,
  deleteCustomDomain,
  DEFAULT_CNAME_TARGET,
  DEFAULT_APEX_IP,
} from '../services/domainService';

interface SettingsPageProps {
  onTriggerAuth: (mode?: AuthMode) => void;
  onNavigateTab: (tab: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onTriggerAuth,
  onNavigateTab,
}) => {
  const { user, profile } = useAuth();

  const [domains, setDomains] = useState<CustomDomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New domain form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [expandedDnsId, setExpandedDnsId] = useState<string | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch user domains
  const loadDomains = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getUserDomains(user.uid);
      setDomains(list);
      // Auto expand first pending domain if present
      const firstPending = list.find((d) => d.status === 'pending');
      if (firstPending && !expandedDnsId) {
        setExpandedDnsId(firstPending.id);
      }
    } catch (err: any) {
      setError('Unable to load your custom domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, [user]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccessMsg(null);
    setAddingDomain(true);

    try {
      const added = await addCustomDomain(user.uid, newDomainInput);
      setDomains((prev) => [added, ...prev]);
      setNewDomainInput('');
      setShowAddForm(false);
      setExpandedDnsId(added.id);
      setSuccessMsg(`Domain "${added.domain}" added! Please configure your DNS records below to complete verification.`);
    } catch (err: any) {
      setError(err.message || 'Failed to add custom domain');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerify = async (domainId: string, simulateSandbox = false) => {
    if (!user) return;
    setError(null);
    setSuccessMsg(null);
    setVerifyingId(domainId);

    try {
      const result = await verifyCustomDomain(user.uid, domainId, {
        simulateSuccess: simulateSandbox,
      });

      // Update state
      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? result.record : d))
      );

      if (result.success) {
        setSuccessMsg(result.message);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'DNS verification request failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    if (!user) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await setPrimaryDomain(user.uid, domainId);
      setDomains(updated);
      const chosen = updated.find((d) => d.id === domainId);
      setSuccessMsg(`"${chosen?.domain}" is now your primary domain for short links!`);
    } catch (err: any) {
      setError(err.message || 'Failed to update primary domain.');
    }
  };

  const handleDelete = async (domainId: string, domainName: string) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to remove "${domainName}" from your account?`)) {
      return;
    }

    try {
      await deleteCustomDomain(user.uid, domainId);
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      setSuccessMsg(`Removed domain "${domainName}".`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete domain.');
    }
  };

  // If visitor is a guest, display informative sign-in gate
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-8 sm:p-12 text-center relative overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-inner">
            <Globe className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Custom Domains &amp; Brand Settings
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-8">
            Create an account or sign in to connect custom vanity domains (e.g. <span className="text-indigo-300 font-mono">link.yourbrand.com</span>), configure instant DNS verification, and manage SSL certificates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => onTriggerAuth('signup')}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
            >
              Sign Up Free
            </button>
            <button
              type="button"
              onClick={() => onTriggerAuth('signin')}
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/10 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sliders className="w-3.5 h-3.5" /> Account &amp; Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            User Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your custom vanity domains, DNS verification records, and URL branding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
          >
            <Plus className="w-4 h-4" /> Add Custom Domain
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Action Required</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-200">Success</p>
            <p className="mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> Account Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-slate-400 text-xs block mb-1">Email Address</span>
            <span className="font-medium text-white break-all">{user.email}</span>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-slate-400 text-xs block mb-1">Account Tier</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" /> Pro Member (Unlimited)
            </span>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-slate-400 text-xs block mb-1">Active Custom Domain</span>
            <span className="font-mono text-indigo-300">
              {profile?.customDomain || (domains.length > 0 ? domains[0].domain : 'my.short')}
            </span>
          </div>
        </div>
      </div>

      {/* Add Custom Domain Form Modal / Card */}
      {showAddForm && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" /> Add New Custom Vanity Domain
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 mb-5">
            Use your own brand name for short URLs instead of <code className="text-indigo-300">my.short</code>. For best results, use a subdomain like <strong className="text-slate-200">link.yourdomain.com</strong> or <strong className="text-slate-200">go.yourdomain.com</strong>.
          </p>

          <form onSubmit={handleAddDomain} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Domain or Subdomain
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  placeholder="link.yourbrand.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingDomain || !newDomainInput.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
              >
                {addingDomain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Save &amp; Get DNS Records
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Domains List & Verification Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" /> Configured Custom Domains
          </h2>
          <span className="text-xs text-slate-400">
            {domains.length} {domains.length === 1 ? 'domain' : 'domains'} connected
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading domain configurations...</p>
          </div>
        ) : domains.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl bg-slate-900/40 border border-white/10 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No custom domains added yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
              Connect your branded domain (e.g. <span className="font-mono text-indigo-300">go.acme.com</span>) to replace the default domain for all your short links and increase click-through rates by up to 34%.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Your First Domain
            </button>
          </div>
        ) : (
          /* Domain Cards List */
          <div className="space-y-4">
            {domains.map((dom) => {
              const isExpanded = expandedDnsId === dom.id;
              const isPrimary = Boolean(dom.isPrimary);
              const isVerified = dom.status === 'verified';
              const isVerifying = verifyingId === dom.id;

              return (
                <div
                  key={dom.id}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    isPrimary
                      ? 'bg-slate-900/90 border-indigo-500/40 shadow-xl shadow-indigo-950/20'
                      : 'bg-slate-900/60 border-white/10'
                  }`}
                >
                  {/* Domain Header Row */}
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                          {dom.domain}
                        </span>

                        {/* Status Badge */}
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Verified &amp; SSL Active
                          </span>
                        ) : dom.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                            <AlertCircle className="w-3 h-3" /> DNS Incomplete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            <Clock className="w-3 h-3" /> Pending Verification
                          </span>
                        )}

                        {/* Primary Badge */}
                        {isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                            <Star className="w-3 h-3 fill-indigo-400" /> Default for New Links
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Added: {new Date(dom.createdAt).toLocaleDateString()}</span>
                        {dom.verifiedAt && (
                          <span>Verified: {new Date(dom.verifiedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isPrimary && isVerified && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(dom.id)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl border border-white/10 transition-colors"
                        >
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleVerify(dom.id, false)}
                        disabled={isVerifying}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Checking DNS...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Verify DNS</span>
                          </>
                        )}
                      </button>

                      {/* Toggle DNS Instructions Drawer */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDnsId((prev) => (prev === dom.id ? null : dom.id))
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl border border-white/10 transition-colors"
                      >
                        <span>DNS Instructions</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(dom.id, dom.domain)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Delete domain"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded DNS Instructions Panel */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-5 sm:p-6 bg-slate-950/60 space-y-5 animate-in fade-in duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Server className="w-4 h-4 text-indigo-400" /> DNS Setup Configuration for {dom.domain}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Log in to your DNS provider (Cloudflare, GoDaddy, Namecheap, Route53, etc.) and add the records below:
                        </span>
                      </div>

                      {/* DNS Records Table */}
                      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-2.5 px-4">Type</th>
                              <th className="py-2.5 px-4">Host / Name</th>
                              <th className="py-2.5 px-4">Value / Target</th>
                              <th className="py-2.5 px-4">TTL</th>
                              <th className="py-2.5 px-4 text-right">Copy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-200 font-mono">
                            {/* Record 1: CNAME */}
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 text-indigo-400 font-bold">CNAME</td>
                              <td className="py-3 px-4 text-white">
                                {dom.domain.includes('.')
                                  ? dom.domain.split('.')[0]
                                  : '@'}
                              </td>
                              <td className="py-3 px-4 text-emerald-400 font-semibold break-all">
                                {dom.cnameTarget || DEFAULT_CNAME_TARGET}
                              </td>
                              <td className="py-3 px-4 text-slate-400">Automatic / 3600</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      dom.cnameTarget || DEFAULT_CNAME_TARGET,
                                      `cname_${dom.id}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] transition-colors"
                                >
                                  {copiedKey === `cname_${dom.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy Target
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Record 2: TXT verification challenge */}
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 text-purple-400 font-bold">TXT</td>
                              <td className="py-3 px-4 text-white">
                                _myshort-challenge
                              </td>
                              <td className="py-3 px-4 text-slate-300 break-all text-[11px]">
                                {dom.verificationToken}
                              </td>
                              <td className="py-3 px-4 text-slate-400">Automatic</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(dom.verificationToken, `txt_${dom.id}`)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] transition-colors"
                                >
                                  {copiedKey === `txt_${dom.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy Token
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Record 3: Apex fallback (A record) */}
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 text-blue-400 font-bold">A Record</td>
                              <td className="py-3 px-4 text-white">@ (apex domain only)</td>
                              <td className="py-3 px-4 text-slate-300">{DEFAULT_APEX_IP}</td>
                              <td className="py-3 px-4 text-slate-400">3600</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(DEFAULT_APEX_IP, `a_${dom.id}`)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] transition-colors"
                                >
                                  {copiedKey === `a_${dom.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy IP
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Helpful Sandbox Simulation & Instructions helper */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                        <div className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-indigo-200">
                            <strong>Testing / Sandbox Mode:</strong> Real DNS records can take up to an hour to propagate worldwide. If you are testing within a development sandbox or demo environment, you can simulate instantaneous DNS validation.
                          </p>
                        </div>
                        {!isVerified && (
                          <button
                            type="button"
                            onClick={() => handleVerify(dom.id, true)}
                            disabled={isVerifying}
                            className="shrink-0 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 transition-colors"
                          >
                            Simulate Instant Verification
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DNS Setup Architecture Card with Illustration */}
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Server className="w-3.5 h-3.5" /> How Custom Domain Routing Works
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Global Anycast Edge Network &amp; Automatic SSL
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When a visitor clicks your branded link (e.g. <span className="font-mono text-indigo-300">link.acme.com/spring-sale</span>), our high-speed edge proxy terminates TLS automatically, checks telemetry headers, and redirects in under 15ms.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Auto-Renewing Let&apos;s Encrypt SSL
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Compatible with Cloudflare &amp; GoDaddy
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Fallback to my.short if offline
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero Redirection Delay overhead
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative aspect-video sm:aspect-auto sm:h-44 bg-slate-950">
            <img
              src="/src/assets/images/custom-domain-dns-1788666220212.avif"
              alt="Custom Domain DNS Architecture Diagram"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-[10px] font-mono text-indigo-300">CNAME &rarr; cname.myshort.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};