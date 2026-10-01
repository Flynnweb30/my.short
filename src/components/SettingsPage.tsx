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
  Code2,
  Terminal,
  Eye,
  EyeOff,
  Webhook,
  Send,
  Radio,
  Play,
  Pause,
  Activity,
  History,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  CustomDomainRecord,
  AuthMode,
  ApiToken,
  WebhookEndpoint,
  WebhookTestResult,
  WebhookDeliveryLog,
} from '../types';
import {
  getUserDomains,
  addCustomDomain,
  verifyCustomDomain,
  setPrimaryDomain,
  deleteCustomDomain,
  DEFAULT_CNAME_TARGET,
  DEFAULT_APEX_IP,
} from '../services/domainService';
import {
  getUserApiTokens,
  createApiToken,
  deleteApiToken,
} from '../services/apiTokenService';
import {
  getUserWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhookEndpoint,
  generateWebhookSecret,
  validateWebhookUrl,
  getUserWebhookLogs,
  clearUserWebhookLogs,
} from '../services/webhookService';

interface SettingsPageProps {
  onTriggerAuth: (mode?: AuthMode) => void;
  onNavigateTab: (tab: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onTriggerAuth,
  onNavigateTab,
}) => {
  const { user, profile } = useAuth();

  const [activeSection, setActiveSection] = useState<'domains' | 'api' | 'webhooks' | 'account'>('domains');

  // Domains state
  const [domains, setDomains] = useState<CustomDomainRecord[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New domain form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [expandedDnsId, setExpandedDnsId] = useState<string | null>(null);

  // API Tokens state
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<ApiToken | null>(null);
  const [revealedTokenIds, setRevealedTokenIds] = useState<Set<string>>(new Set());

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [showAddWebhookModal, setShowAddWebhookModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState(generateWebhookSecret());
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['link.clicked']);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [revealedWebhookSecrets, setRevealedWebhookSecrets] = useState<Set<string>>(new Set());
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, WebhookTestResult>>({});
  const [togglingWebhookId, setTogglingWebhookId] = useState<string | null>(null);
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(null);
  const [showPayloadDoc, setShowPayloadDoc] = useState(false);

  // Webhook History Logs state
  const [webhookLogs, setWebhookLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [logFilterWebhookId, setLogFilterWebhookId] = useState<string>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Test Webhook Modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testModalWebhookId, setTestModalWebhookId] = useState<string>('custom');
  const [testModalCustomUrl, setTestModalCustomUrl] = useState<string>('');
  const [testModalSecret, setTestModalSecret] = useState<string>('');
  const [testingModal, setTestingModal] = useState(false);
  const [testModalResult, setTestModalResult] = useState<WebhookTestResult | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch user domains
  const loadDomains = async () => {
    if (!user) {
      setLoadingDomains(false);
      return;
    }
    setLoadingDomains(true);
    setError(null);
    try {
      const list = await getUserDomains(user.uid);
      setDomains(list);
      const firstPending = list.find((d) => d.status === 'pending');
      if (firstPending && !expandedDnsId) {
        setExpandedDnsId(firstPending.id);
      }
    } catch {
      setError('Unable to load your custom domains.');
    } finally {
      setLoadingDomains(false);
    }
  };

  // Fetch user API tokens
  const loadTokens = async () => {
    if (!user) return;
    setLoadingTokens(true);
    try {
      const list = await getUserApiTokens(user.uid);
      setTokens(list);
    } catch {
      console.warn('Could not load API tokens');
    } finally {
      setLoadingTokens(false);
    }
  };

  // Fetch user webhooks
  const loadWebhooks = async () => {
    if (!user) return;
    setLoadingWebhooks(true);
    try {
      const list = await getUserWebhooks(user.uid);
      setWebhooks(list);
      if (list.length > 0 && testModalWebhookId === 'custom') {
        setTestModalWebhookId(list[0].id);
        setTestModalCustomUrl(list[0].url);
        setTestModalSecret(list[0].secret || '');
      }
    } catch {
      console.warn('Could not load webhooks');
    } finally {
      setLoadingWebhooks(false);
    }
  };

  // Fetch user webhook logs
  const loadLogs = async () => {
    if (!user) return;
    setLoadingLogs(true);
    try {
      const logs = await getUserWebhookLogs(user.uid);
      setWebhookLogs(logs);
    } catch {
      console.warn('Could not load webhook delivery logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadDomains();
    loadTokens();
    loadWebhooks();
    loadLogs();

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#webhooks') {
        setActiveSection('webhooks');
      } else if (hash === '#api') {
        setActiveSection('api');
      }
    }
  }, [user]);

  const handleClearLogs = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to clear your webhook delivery history?')) {
      return;
    }
    await clearUserWebhookLogs(user.uid);
    setWebhookLogs([]);
    setSuccessMsg('Webhook delivery history cleared.');
  };

  const toggleExpandLog = (logId: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccessMsg(null);
    setSavingWebhook(true);

    try {
      const created = await createWebhook(user.uid, {
        url: newWebhookUrl,
        name: newWebhookName.trim() || 'Production Webhook',
        secret: newWebhookSecret,
        events: newWebhookEvents,
        status: 'active',
      });
      setWebhooks((prev) => [created, ...prev]);
      setShowAddWebhookModal(false);
      setNewWebhookUrl('');
      setNewWebhookName('');
      setNewWebhookSecret(generateWebhookSecret());
      setNewWebhookEvents(['link.clicked']);
      setSuccessMsg(`Webhook registered successfully. Real-time POST notifications will be dispatched to ${created.url}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to register webhook endpoint.');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleToggleWebhook = async (wh: WebhookEndpoint) => {
    if (!user) return;
    setTogglingWebhookId(wh.id);
    const newStatus = wh.status === 'active' ? 'paused' : 'active';
    try {
      await updateWebhook(user.uid, wh.id, { status: newStatus });
      setWebhooks((prev) =>
        prev.map((item) => (item.id === wh.id ? { ...item, status: newStatus } : item))
      );
      setSuccessMsg(`Webhook endpoint "${wh.name}" is now ${newStatus}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update webhook status.');
    } finally {
      setTogglingWebhookId(null);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!user) return;
    setDeletingWebhookId(webhookId);
    try {
      await deleteWebhook(user.uid, webhookId);
      setWebhooks((prev) => prev.filter((item) => item.id !== webhookId));
      setSuccessMsg('Webhook endpoint deleted successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete webhook.');
    } finally {
      setDeletingWebhookId(null);
    }
  };

  const handleTestWebhook = async (wh: WebhookEndpoint) => {
    setTestingWebhookId(wh.id);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await testWebhookEndpoint(wh.url, wh.secret, 'link.clicked', {
        userId: user?.uid,
        webhookId: wh.id,
      });
      setTestResults((prev) => ({ ...prev, [wh.id]: res }));
      if (res.success) {
        setSuccessMsg(`Test ping delivered to ${wh.url}! Status: ${res.statusCode} ${res.statusText} (${res.latencyMs}ms).`);
      } else {
        setError(`Test ping to ${wh.url} returned status ${res.statusCode} (${res.statusText}).`);
      }
      loadLogs();
    } catch (err: any) {
      setError(err.message || 'Test dispatch failed to reach the target URL.');
      loadLogs();
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleOpenTestModal = (targetWebhook?: WebhookEndpoint) => {
    if (targetWebhook) {
      setTestModalWebhookId(targetWebhook.id);
      setTestModalCustomUrl(targetWebhook.url);
      setTestModalSecret(targetWebhook.secret || '');
    } else if (webhooks.length > 0) {
      setTestModalWebhookId(webhooks[0].id);
      setTestModalCustomUrl(webhooks[0].url);
      setTestModalSecret(webhooks[0].secret || '');
    } else {
      setTestModalWebhookId('custom');
      setTestModalCustomUrl('');
      setTestModalSecret('');
    }
    setTestModalResult(null);
    setShowTestModal(true);
  };

  const handleRunTestModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalCustomUrl.trim()) return;

    setTestingModal(true);
    setTestModalResult(null);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await testWebhookEndpoint(
        testModalCustomUrl.trim(),
        testModalSecret.trim() || undefined,
        'link.clicked',
        {
          userId: user?.uid,
          webhookId: testModalWebhookId === 'custom' ? 'manual_test' : testModalWebhookId,
        }
      );
      setTestModalResult(res);
      if (res.success) {
        setSuccessMsg(`Sample payload successfully delivered to ${testModalCustomUrl}! HTTP ${res.statusCode} ${res.statusText} (${res.latencyMs}ms).`);
      } else {
        setError(`Test webhook returned error status HTTP ${res.statusCode} (${res.statusText}).`);
      }
      loadLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch test payload to webhook URL.');
      loadLogs();
    } finally {
      setTestingModal(false);
    }
  };

  const toggleRevealWebhookSecret = (whId: string) => {
    setRevealedWebhookSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(whId)) {
        next.delete(whId);
      } else {
        next.add(whId);
      }
      return next;
    });
  };

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
      setSuccessMsg(`Domain "${added.domain}" added! Please configure your DNS records below.`);
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
    try {
      await setPrimaryDomain(user.uid, domainId);
      setDomains((prev) =>
        prev.map((d) => ({
          ...d,
          isPrimary: d.id === domainId,
        }))
      );
      setSuccessMsg('Primary shortening domain updated.');
    } catch (err: any) {
      setError(err.message || 'Failed to set primary domain');
    }
  };

  const handleDelete = async (domainId: string, domainName: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to remove domain "${domainName}"?`)) return;

    try {
      await deleteCustomDomain(user.uid, domainId);
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
      setSuccessMsg(`Domain "${domainName}" removed.`);
    } catch (err: any) {
      setError(err.message || 'Failed to remove domain');
    }
  };

  // API Token Handlers
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreatingToken(true);
    setError(null);
    try {
      const tokenRecord = await createApiToken(user.uid, newTokenName);
      setTokens((prev) => [tokenRecord, ...prev]);
      setNewlyCreatedToken(tokenRecord);
      setNewTokenName('');
      setSuccessMsg(`Personal API token "${tokenRecord.name}" generated.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate API token');
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDeleteToken = async (tokenId: string, tokenName: string) => {
    if (!user) return;
    if (!window.confirm(`Revoke API token "${tokenName}"? Any scripts or tools using this token will stop working immediately.`)) {
      return;
    }
    try {
      await deleteApiToken(user.uid, tokenId);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      setSuccessMsg(`API token "${tokenName}" has been revoked.`);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke token');
    }
  };

  const toggleRevealToken = (id: string) => {
    setRevealedTokenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Settings Restricted to Members</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please sign in to configure custom branded vanity domains and generate personal API tokens.
        </p>
        <button
          onClick={() => onTriggerAuth('signin')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
        >
          Sign In to Access Settings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>PLATFORM SETTINGS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Domains, API Tokens &amp; Webhooks
          </h1>
          <p className="text-xs text-slate-400">
            Configure vanity branding, personal API credentials, and real-time click webhook endpoints.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-white/10 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSection('domains')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'domains'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Custom Domains</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('api')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'api'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Tokens</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('webhooks')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'webhooks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>Webhooks</span>
            {webhooks.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">
                {webhooks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('account')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSection === 'account'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Action Required</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-200">Success</p>
            <p className="mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* ===================== SECTION 1: CUSTOM DOMAINS ===================== */}
      {activeSection === 'domains' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" /> Connected Vanity Domains ({domains.length})
              </h2>
              <p className="text-xs text-slate-400">
                Route short links through your own branded apex domain or subdomain with auto-SSL.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Connect New Domain</span>
            </button>
          </div>

          {/* Add Domain Form Modal/Panel */}
          {showAddForm && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" /> Add Custom Vanity Domain
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddDomain} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Domain or Subdomain
                  </label>
                  <input
                    type="text"
                    required
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    placeholder="e.g. link.yourcompany.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingDomain || !newDomainInput.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                  >
                    {addingDomain ? 'Adding...' : 'Add Domain'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Domains List */}
          {loadingDomains ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading domains...</div>
          ) : domains.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
              <Globe className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Custom Domains Connected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Connect your brand&apos;s custom domain to generate clean, recognizable short links.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                Add Your First Domain
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((dom) => (
                <div
                  key={dom.id}
                  className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-lg space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white">{dom.domain}</span>
                        {dom.isPrimary && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                            Default
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            dom.status === 'verified'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {dom.status === 'verified' ? 'Verified' : 'Pending DNS'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Added on {new Date(dom.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!dom.isPrimary && dom.status === 'verified' && (
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
                        disabled={verifyingId === dom.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === dom.id ? 'animate-spin' : ''}`} />
                        <span>Verify DNS</span>
                      </button>

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

                  {/* DNS Instructions preview */}
                  <div className="p-3 bg-slate-950/70 border border-white/5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>CNAME Target:</span>
                      <button
                        onClick={() => handleCopy(dom.cnameTarget || DEFAULT_CNAME_TARGET, `cname_${dom.id}`)}
                        className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                      >
                        {copiedKey === `cname_${dom.id}` ? 'Copied!' : 'Copy Target'}
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-mono text-indigo-300 break-all select-all font-semibold">
                      {dom.cnameTarget || DEFAULT_CNAME_TARGET}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== SECTION 2: API TOKENS ===================== */}
      {activeSection === 'api' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" /> Personal API Tokens ({tokens.length})
              </h2>
              <p className="text-xs text-slate-400">
                Generate secret bearer tokens for programmatic URL shortening via REST API.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTokenModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New Token</span>
            </button>
          </div>

          {/* Modal / Generator Card */}
          {showTokenModal && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" /> Generate Personal API Token
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowTokenModal(false);
                    setNewlyCreatedToken(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>

              {newlyCreatedToken ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Token Generated! Store this secret safely.
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-white/10 font-mono text-xs text-white break-all select-all flex items-center justify-between gap-2">
                      <span>{newlyCreatedToken.token}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(newlyCreatedToken.token, 'new_token')}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
                        title="Copy Token"
                      >
                        {copiedKey === 'new_token' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      For security, keep this token private. You can revoke it anytime below.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowTokenModal(false);
                      setNewlyCreatedToken(null);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateToken} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Token Description / Label
                    </label>
                    <input
                      type="text"
                      required
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                      placeholder="e.g. Production CI/CD, Zapier, Webhook"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTokenModal(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingToken || !newTokenName.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      {creatingToken ? 'Generating...' : 'Create Secret Token'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tokens List Table */}
          {loadingTokens ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading API tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
              <Key className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No API Tokens Created</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate a personal API token to shorten links programmatically via cURL, Python, or Node.js.
              </p>
              <button
                type="button"
                onClick={() => setShowTokenModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                Generate First API Token
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Label</th>
                    <th className="py-3 px-4">Token Key</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Last Used</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {tokens.map((token) => {
                    const isRevealed = revealedTokenIds.has(token.id);
                    return (
                      <tr key={token.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{token.name}</td>
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span>
                              {isRevealed
                                ? token.token
                                : `${token.token.substring(0, 14)}••••••••••••••••`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealToken(token.id)}
                              className="text-slate-500 hover:text-slate-300"
                              title={isRevealed ? 'Mask token' : 'Reveal token'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(token.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {token.lastUsedAt
                            ? new Date(token.lastUsedAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopy(token.token, token.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                              title="Copy Token"
                            >
                              {copiedKey === token.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteToken(token.id, token.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Revoke Token"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Developer Quickstart / API Documentation */}
          <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Developer Quickstart (cURL &amp; JavaScript)
            </h3>
            <p className="text-xs text-slate-400">
              Shorten links programmatically by sending a POST request to <code className="text-indigo-300">/api/shorten</code> with your bearer token.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-slate-300 space-y-2 overflow-x-auto">
              <div className="text-slate-500"># 1. Shorten URL via cURL</div>
              <div className="text-indigo-300 select-all">
                curl -X POST {typeof window !== 'undefined' ? window.location.origin : 'https://my.short'}/api/shorten \
                <br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_API_TOKEN&quot; \
                <br />
                &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \
                <br />
                &nbsp;&nbsp;-d &apos;&#123;&quot;originalUrl&quot;: &quot;https://example.com/promo&quot;, &quot;customAlias&quot;: &quot;spring-sale&quot;&#125;&apos;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SECTION 3: WEBHOOKS ===================== */}
      {activeSection === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Webhook className="w-5 h-5 text-indigo-400" /> Real-Time Click Webhooks ({webhooks.length})
              </h2>
              <p className="text-xs text-slate-400">
                Register HTTP/HTTPS endpoints to receive instant POST notifications whenever any of your shortened links receives a click.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenTestModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Webhook</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddWebhookModal(true);
                  setNewWebhookSecret(generateWebhookSecret());
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Register Webhook</span>
              </button>
            </div>
          </div>

          {/* Test Webhook Modal / Panel */}
          {showTestModal && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-400" /> Test Webhook Endpoint
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Send an authentic sample telemetry JSON payload to verify your receiving endpoint is online and properly handling incoming click events.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleRunTestModal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Target Endpoint
                    </label>
                    <select
                      value={testModalWebhookId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        setTestModalWebhookId(selId);
                        if (selId === 'custom') {
                          setTestModalCustomUrl('');
                          setTestModalSecret('');
                        } else {
                          const wh = webhooks.find((w) => w.id === selId);
                          if (wh) {
                            setTestModalCustomUrl(wh.url);
                            setTestModalSecret(wh.secret || '');
                          }
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {webhooks.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.url.replace(/^https?:\/\//, '').slice(0, 30)}...)
                        </option>
                      ))}
                      <option value="custom">+ Test Custom Target URL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Webhook URL <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={testModalCustomUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      onInput={(e: any) => setTestModalCustomUrl(e.target.value)}
                      placeholder="https://example.com/api/webhooks"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Sample Payload Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Sample Payload Dispatched (JSON)
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">Event: link.clicked</span>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-[11px] text-indigo-300 overflow-x-auto max-h-36">
{`{
  "event": "link.clicked",
  "eventId": "evt_test_${Date.now()}",
  "timestamp": "${new Date().toISOString()}",
  "isTest": true,
  "link": {
    "shortCode": "promo-launch",
    "shortUrl": "https://my.short/promo-launch",
    "originalUrl": "https://example.com/features",
    "title": "Autumn Product Launch",
    "totalClicks": 142,
    "uniqueClicks": 118
  },
  "telemetry": {
    "country": "United States",
    "countryCode": "US",
    "region": "California",
    "city": "San Francisco",
    "timeZone": "America/Los_Angeles",
    "locationPrecision": "precise",
    "browser": "Chrome",
    "deviceType": "Desktop",
    "utmSource": "newsletter",
    "utmCampaign": "autumn_special"
  }
}`}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-slate-400">
                    Results are measured in real time and recorded in the <strong className="text-white">Webhook History</strong> panel below.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTestModal(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={testingModal || !testModalCustomUrl.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                    >
                      {testingModal ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Pinging Endpoint...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Sample Payload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Test Outcome */}
                {testModalResult && (
                  <div className="p-4 bg-slate-950 border border-indigo-500/20 rounded-2xl space-y-2 mt-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            testModalResult.success ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span className="font-bold text-xs text-white">
                          HTTP {testModalResult.statusCode} {testModalResult.statusText}
                        </span>
                        <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                          {testModalResult.latencyMs}ms round-trip
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Recorded in Webhook History
                      </span>
                    </div>
                    <pre className="p-2.5 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-24">
                      {testModalResult.responsePreview}
                    </pre>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Add Webhook Form / Modal */}
          {showAddWebhookModal && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-indigo-400" /> Register Webhook Endpoint
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddWebhookModal(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateWebhook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Destination Endpoint URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="https://api.yourcompany.com/webhooks/myshort-events or https://webhook.site/..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Must accept HTTP/HTTPS POST requests with JSON payloads. You can use free testing tools like <a href="https://webhook.site" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">webhook.site</a>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Integration Name / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    placeholder="e.g. Slack Notifier, Zapier Sync, Data Pipeline"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subscribed Events
                  </label>
                  <div className="p-3 bg-slate-950/80 border border-white/10 rounded-xl space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes('link.clicked')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhookEvents((prev) => Array.from(new Set([...prev, 'link.clicked'])));
                          } else {
                            if (newWebhookEvents.length > 1) {
                              setNewWebhookEvents((prev) => prev.filter((ev) => ev !== 'link.clicked'));
                            }
                          }
                        }}
                        className="mt-0.5 accent-indigo-600 rounded"
                      />
                      <div>
                        <span className="text-xs font-bold text-white font-mono">link.clicked</span>
                        <p className="text-[11px] text-slate-400">
                          Dispatched in real time whenever any of your shortened links receives a click, complete with visitor identity, UTM campaign tags, and geographic telemetry.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      HMAC Signing Secret
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewWebhookSecret(generateWebhookSecret())}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate Secret
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newWebhookSecret}
                    onChange={(e) => setNewWebhookSecret(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-indigo-300 text-xs font-mono select-all focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sent in the <code className="text-indigo-300">X-MyShort-Signature</code> header so your receiving server can verify event authenticity.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddWebhookModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingWebhook || !newWebhookUrl.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                  >
                    {savingWebhook ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Register Endpoint</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Webhooks List */}
          {loadingWebhooks ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Loading registered webhooks...</span>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
              <Webhook className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Webhook Endpoints Registered</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Connect a webhook URL to receive instant POST notifications whenever someone visits your shortened links. Stream live visitor clicks to Zapier, Slack, or your analytics backend.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowAddWebhookModal(true);
                  setNewWebhookSecret(generateWebhookSecret());
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Register Your First Webhook</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((wh) => {
                const isSecretRevealed = revealedWebhookSecrets.has(wh.id);
                const isTesting = testingWebhookId === wh.id;
                const isToggling = togglingWebhookId === wh.id;
                const isDeleting = deletingWebhookId === wh.id;
                const testResult = testResults[wh.id];

                return (
                  <div
                    key={wh.id}
                    className="p-5 sm:p-6 bg-slate-900/80 border border-white/10 rounded-3xl space-y-4 backdrop-blur-xl shadow-xl transition-all hover:border-white/20"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <Webhook className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{wh.name}</span>
                            {wh.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Paused
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>Subscribed to:</span>
                            {wh.events?.map((ev) => (
                              <span key={ev} className="font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                {ev}
                              </span>
                            )) || <span className="font-mono text-indigo-300">link.clicked</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleTestWebhook(wh)}
                          disabled={isTesting}
                          title="Send a real-time test POST notification to this endpoint"
                          className="px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Pinging...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Test Ping</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleWebhook(wh)}
                          disabled={isToggling}
                          title={wh.status === 'active' ? 'Pause webhook notifications' : 'Resume webhook notifications'}
                          className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors border border-white/5 disabled:opacity-50"
                        >
                          {wh.status === 'active' ? (
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteWebhook(wh.id)}
                          disabled={isDeleting}
                          title="Delete webhook endpoint"
                          className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-xl transition-colors border border-white/5 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Endpoint Target URL */}
                    <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          URL:
                        </span>
                        <span className="font-mono text-xs text-indigo-300 break-all select-all">
                          {wh.url}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(wh.url, `wh_url_${wh.id}`)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        {copiedKey === `wh_url_${wh.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Signing Secret Box */}
                    {wh.secret && (
                      <div className="p-3 bg-slate-950/70 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                            HMAC Secret:
                          </span>
                          <span className="font-mono text-xs text-slate-300 break-all select-all">
                            {isSecretRevealed ? wh.secret : `${wh.secret.substring(0, 10)}••••••••••••••••`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => toggleRevealWebhookSecret(wh.id)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title={isSecretRevealed ? 'Hide secret' : 'Reveal secret'}
                          >
                            {isSecretRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-indigo-300" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(wh.secret || '', `wh_sec_${wh.id}`)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1"
                          >
                            {copiedKey === `wh_sec_${wh.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Secret</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delivery Status Indicator */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        {wh.lastTriggeredAt ? (
                          <span>
                            Last notification dispatched:{' '}
                            <span className="text-slate-300 font-medium">
                              {new Date(wh.lastTriggeredAt).toLocaleTimeString()} ({new Date(wh.lastTriggeredAt).toLocaleDateString()})
                            </span>
                          </span>
                        ) : (
                          <span>No live click notifications dispatched yet</span>
                        )}
                      </div>

                      {wh.lastStatusCode != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Status:</span>
                          <span
                            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              wh.lastStatusCode >= 200 && wh.lastStatusCode < 300
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            HTTP {wh.lastStatusCode} {wh.lastDeliveryStatus === 'success' ? 'OK' : 'Failed'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Test Result Inspection Card */}
                    {testResult && (
                      <div className="p-4 bg-slate-950 border border-indigo-500/20 rounded-2xl space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                testResult.success ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            <span className="font-bold text-xs text-white">
                              Test Ping Result: HTTP {testResult.statusCode} {testResult.statusText}
                            </span>
                            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                              {testResult.latencyMs}ms latency
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(testResult.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Target Response Preview:
                          </span>
                          <pre className="p-2.5 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-28">
                            {testResult.responsePreview}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ===================== WEBHOOK HISTORY PANEL ===================== */}
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-5">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-400" /> Webhook Delivery History
                  </h3>
                  <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold font-mono">
                    {webhookLogs.length} attempts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Inspect outbound dispatch attempts, HTTP status codes, latency, and response bodies to troubleshoot integration failures.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter Buttons */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setLogFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      logFilterStatus === 'all'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({webhookLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilterStatus('success')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      logFilterStatus === 'success'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    Success ({webhookLogs.filter((l) => l.success).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilterStatus('failed')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      logFilterStatus === 'failed'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-slate-400 hover:text-rose-300'
                    }`}
                  >
                    Failed ({webhookLogs.filter((l) => !l.success).length})
                  </button>
                </div>

                {/* Endpoint selector if multiple */}
                {webhooks.length > 1 && (
                  <select
                    value={logFilterWebhookId}
                    onChange={(e) => setLogFilterWebhookId(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Endpoints</option>
                    {webhooks.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Refresh and Clear */}
                <button
                  type="button"
                  onClick={() => loadLogs()}
                  title="Refresh logs"
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors border border-white/5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-indigo-400' : ''}`} />
                </button>

                {webhookLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    title="Clear history logs"
                    className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-xl transition-colors border border-white/5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Logs List Container */}
            {loadingLogs ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading delivery logs...</span>
              </div>
            ) : (() => {
              const filteredLogs = webhookLogs.filter((log) => {
                if (logFilterStatus === 'success' && !log.success) return false;
                if (logFilterStatus === 'failed' && log.success) return false;
                if (logFilterWebhookId !== 'all' && log.webhookId !== logFilterWebhookId) return false;
                return true;
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-white/5">
                    <History className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-300 font-semibold">
                      {webhookLogs.length === 0
                        ? 'No Webhook Delivery Attempts Recorded Yet'
                        : 'No Delivery Attempts Match Selected Filters'}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Whenever someone visits one of your shortened links or you send a test ping, the outbound dispatch attempt and server response will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenTestModal()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Webhook Now</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogIds.has(log.id);
                    const matchingWebhook = webhooks.find((w) => w.id === log.webhookId);

                    return (
                      <div
                        key={log.id}
                        className={`rounded-2xl border transition-all ${
                          log.success
                            ? 'bg-slate-950/80 border-white/5 hover:border-emerald-500/30'
                            : 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40'
                        }`}
                      >
                        {/* Summary Bar */}
                        <div
                          onClick={() => toggleExpandLog(log.id)}
                          className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Status Code Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                                log.success
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {log.success ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>HTTP {log.statusCode}</span>
                              <span className="font-sans text-[11px] font-medium opacity-80">
                                {log.statusText}
                              </span>
                            </span>

                            {/* Event Type Badge */}
                            <span className="font-mono text-[11px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                              {log.event}
                            </span>

                            {/* Test Tag */}
                            {log.isTest && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                Test
                              </span>
                            )}

                            {/* Target URL / Name */}
                            <div className="flex items-center gap-1.5 text-xs">
                              {matchingWebhook && (
                                <span className="font-bold text-white">
                                  {matchingWebhook.name}:
                                </span>
                              )}
                              <span className="font-mono text-slate-300 truncate max-w-[200px] sm:max-w-[280px]">
                                {log.url}
                              </span>
                            </div>
                          </div>

                          {/* Right Metadata */}
                          <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto shrink-0">
                            <span className="font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded text-slate-300">
                              {log.latencyMs}ms
                            </span>
                            <span className="text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-white"
                              aria-label="Toggle details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Troubleshooting Details */}
                        {isExpanded && (
                          <div className="p-4 pt-1 border-t border-white/5 space-y-3.5 bg-slate-950/90 rounded-b-2xl animate-in fade-in">
                            {/* Failure Diagnostic Alert */}
                            {!log.success && (
                              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-1">
                                <p className="font-bold text-rose-200 flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                  Troubleshooting Diagnostic:
                                </p>
                                <p className="text-[11px]">
                                  {log.error || log.statusText || 'Endpoint returned an error or was unreachable.'}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  💡 Tip: Ensure your server is publicly accessible, accepts POST requests at this route, returns a 2xx status code, and finishes processing within 5 seconds.
                                </p>
                              </div>
                            )}

                            {/* Outbound Payload Preview */}
                            {log.requestPayloadPreview && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Dispatched JSON Payload Sent:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(log.requestPayloadPreview || '', `log_req_${log.id}`)}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                                  >
                                    {copiedKey === `log_req_${log.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-300">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy Payload</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-indigo-200 overflow-x-auto max-h-40">
                                  {(() => {
                                    try {
                                      return JSON.stringify(JSON.parse(log.requestPayloadPreview), null, 2);
                                    } catch {
                                      return log.requestPayloadPreview;
                                    }
                                  })()}
                                </pre>
                              </div>
                            )}

                            {/* Response Preview */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Destination Server Response:
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  HTTP {log.statusCode} • Round-trip: {log.latencyMs}ms
                                </span>
                              </div>
                              <pre className="p-3 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-32">
                                {log.responseBodyPreview || '(No response body returned from server)'}
                              </pre>
                            </div>

                            {/* Meta info footer */}
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-white/5 flex-wrap gap-2">
                              <span>Log ID: {log.id}</span>
                              <span>Timestamp: {new Date(log.timestamp).toISOString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Webhook Payload Reference & Developer Quickstart */}
          <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" /> Webhook Payload Schema &amp; HMAC Verification
              </h3>
              <button
                type="button"
                onClick={() => setShowPayloadDoc(!showPayloadDoc)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {showPayloadDoc ? 'Hide Details' : 'View Payload Example'}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Whenever a link receives a click, a POST request is dispatched to your registered endpoint with HTTP headers and a structured JSON payload containing real-time telemetry, location precision, visitor identity, and UTM campaign parameters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="font-bold text-white block mb-1">HTTP Headers Sent:</span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                  <li><span className="text-indigo-300">Content-Type:</span> application/json</li>
                  <li><span className="text-indigo-300">User-Agent:</span> my.short-Webhook/1.0</li>
                  <li><span className="text-indigo-300">X-MyShort-Event:</span> link.clicked</li>
                  <li><span className="text-indigo-300">X-MyShort-Delivery:</span> deliv_...</li>
                  <li><span className="text-indigo-300">X-MyShort-Signature:</span> sha256=&lt;hmac&gt;</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <span className="font-bold text-white block mb-1">Node.js Signature Check:</span>
                <pre className="font-mono text-[10px] text-slate-300 overflow-x-auto">
{`const hmac = crypto
  .createHmac('sha256', secret)
  .update(rawBody)
  .digest('hex');
const valid = signature === 'sha256=' + hmac;`}
                </pre>
              </div>
            </div>

            {showPayloadDoc && (
              <div className="space-y-2 pt-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Sample JSON Event Payload:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(
                          {
                            event: 'link.clicked',
                            eventId: 'evt_1788666233_a9b',
                            timestamp: new Date().toISOString(),
                            link: {
                              shortCode: 'demo-link',
                              shortUrl: 'https://my.short/demo-link',
                              originalUrl: 'https://example.com/promo',
                              title: 'Spring Product Showcase',
                              totalClicks: 142,
                              uniqueClicks: 118,
                            },
                            telemetry: {
                              country: 'United States',
                              countryCode: 'US',
                              region: 'California',
                              city: 'San Francisco',
                              timeZone: 'America/Los_Angeles',
                              locationPrecision: 'precise',
                              latitude: 37.7749,
                              longitude: -122.4194,
                              browser: 'Chrome',
                              os: 'macOS',
                              deviceType: 'Desktop',
                              referer: 'https://news.ycombinator.com',
                              utmSource: 'newsletter',
                              utmMedium: 'email',
                              utmCampaign: 'spring_launch',
                            },
                          },
                          null,
                          2
                        ),
                        'schema_json'
                      )
                    }
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === 'schema_json' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-indigo-200 overflow-x-auto max-h-64">
{`{
  "event": "link.clicked",
  "eventId": "evt_1788666233_a9b",
  "timestamp": "2026-10-01T07:30:00.000Z",
  "link": {
    "shortCode": "demo-link",
    "shortUrl": "https://my.short/demo-link",
    "originalUrl": "https://example.com/promo",
    "title": "Spring Product Showcase",
    "totalClicks": 142,
    "uniqueClicks": 118
  },
  "telemetry": {
    "country": "United States",
    "countryCode": "US",
    "region": "California",
    "city": "San Francisco",
    "timeZone": "America/Los_Angeles",
    "locationPrecision": "precise",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "browser": "Chrome",
    "os": "macOS",
    "deviceType": "Desktop",
    "referer": "https://news.ycombinator.com",
    "utmSource": "newsletter",
    "utmMedium": "email",
    "utmCampaign": "spring_launch"
  }
}`}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== SECTION 4: ACCOUNT PROFILE ===================== */}
      {activeSection === 'account' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> Member Account Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-slate-400 text-xs block mb-1">Email Address</span>
                <span className="font-semibold text-white break-all">{user.email}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-slate-400 text-xs block mb-1">Account Tier</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" /> Pro Member (Unlimited Lifetime Links)
                </span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-slate-400 text-xs block mb-1">Active Custom Vanity Domain</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {profile?.customDomain || (domains.length > 0 ? domains[0].domain : 'my.short')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
