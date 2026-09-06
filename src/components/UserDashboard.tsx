import React, { useEffect, useState } from 'react';
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Power,
  Search,
  Filter,
  MousePointerClick,
  Clock,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  Download,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  Compass,
  Tag,
  RefreshCw,
  Layers,
  X,
} from 'lucide-react';
import { ShortUrl, AuthMode, ClickLog } from '../types';
import {
  getUserUrls,
  deleteShortUrl,
  toggleUrlStatus,
  getGuestUrls,
  claimAllGuestUrls,
  getUrlClickLogs,
  getAllUserClickLogs,
  recordClickTelemetry,
  extendShortUrl,
} from '../services/urlService';
import { useAuth } from '../context/AuthContext';
import {
  getDisplayShortUrl,
  getReachableShortUrl,
  exportClicksToCsv,
  getClientMetadata,
} from '../utils/analytics';

interface UserDashboardProps {
  onNavigateHome: () => void;
  onOpenQr: (url: string, title?: string) => void;
  onTriggerAuth: (mode?: AuthMode) => void;
  onNavigateSettings?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onNavigateHome,
  onOpenQr,
  onTriggerAuth,
  onNavigateSettings,
}) => {
  const { user } = useAuth();
  const [links, setLinks] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [extendingCode, setExtendingCode] = useState<string | null>(null);

  // Telemetry drawer / modal state
  const [selectedLinkForTelemetry, setSelectedLinkForTelemetry] = useState<ShortUrl | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<ClickLog[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [telemetrySearch, setTelemetrySearch] = useState('');
  const [telemetryDeviceFilter, setTelemetryDeviceFilter] = useState<string>('all');

  // Custom Domain Setting (Render.com friendly)
  const [customDomain, setCustomDomain] = useState<string>(() => {
    return localStorage.getItem('myshort_custom_domain') || 'my.short';
  });
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');

  // Check if guest has temporary links created in current session
  const [guestLinksCount, setGuestLinksCount] = useState(0);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      if (user) {
        // Automatically claim any guest links from this session if present
        await claimAllGuestUrls(user.uid);
        const fetched = await getUserUrls(user.uid);
        setLinks(fetched);
      } else {
        // Guest user: do not display links or management
        const guestUrls = getGuestUrls();
        setGuestLinksCount(guestUrls.length);
        setLinks([]);
      }
    } catch (err: any) {
      console.error('Unable to load your links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [user]);

  // Load telemetry logs when a link is selected for deep analytics
  const openTelemetry = async (link: ShortUrl) => {
    setSelectedLinkForTelemetry(link);
    setLoadingTelemetry(true);
    setTelemetrySearch('');
    setTelemetryDeviceFilter('all');
    try {
      const logs = await getUrlClickLogs(link.shortCode);
      setTelemetryLogs(logs);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Open aggregate telemetry across all links
  const openAggregateTelemetry = async () => {
    if (links.length === 0) return;
    const dummyAggregateLink: ShortUrl = {
      id: 'all_links',
      shortCode: 'All Links',
      originalUrl: 'All Destinations',
      title: 'Aggregate Portfolio Telemetry',
      createdAt: new Date().toISOString(),
      status: 'active',
      clicks: links.reduce((a, b) => a + (b.clicks || 0), 0),
    };
    setSelectedLinkForTelemetry(dummyAggregateLink);
    setLoadingTelemetry(true);
    setTelemetrySearch('');
    setTelemetryDeviceFilter('all');
    try {
      const codes = links.map((l) => l.shortCode);
      const logs = await getAllUserClickLogs(codes);
      setTelemetryLogs(logs);
    } catch (err) {
      console.error('Failed to load aggregate telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Simulate a test telemetry click event for quick live preview verification
  const handleSimulateTestClick = async (shortCode: string) => {
    const meta = getClientMetadata(shortCode);
    await recordClickTelemetry(shortCode, meta);
    // Reload logs
    const updated = await getUrlClickLogs(shortCode);
    setTelemetryLogs(updated);
    // Increment link click count in UI
    setLinks((prev) =>
      prev.map((l) =>
        l.shortCode === shortCode ? { ...l, clicks: (l.clicks || 0) + 1 } : l
      )
    );
  };

  const handleCopyBranded = async (shortCode: string) => {
    const branded = getDisplayShortUrl(shortCode, customDomain);
    try {
      await navigator.clipboard.writeText(branded);
      setCopiedCode(shortCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (shortCode: string) => {
    if (!window.confirm(`Are you sure you want to delete /${shortCode}? This will permanently remove the link.`)) {
      return;
    }
    setDeletingCode(shortCode);
    try {
      if (user) {
        await deleteShortUrl(shortCode);
      }
      setLinks((prev) => prev.filter((l) => l.shortCode !== shortCode));
      if (selectedLinkForTelemetry?.shortCode === shortCode) {
        setSelectedLinkForTelemetry(null);
      }
    } catch (err: any) {
      alert('Could not delete link: ' + err.message);
    } finally {
      setDeletingCode(null);
    }
  };

  const handleToggleStatus = async (link: ShortUrl) => {
    if (!user) return;
    const current = link.status === 'active' ? 'active' : 'disabled';
    try {
      await toggleUrlStatus(link.shortCode, current);
      setLinks((prev) =>
        prev.map((l) =>
          l.shortCode === link.shortCode
            ? { ...l, status: current === 'active' ? 'disabled' : 'active' }
            : l
        )
      );
    } catch (err: any) {
      alert('Could not update status: ' + err.message);
    }
  };

  const handleMakePermanent = async (shortCode: string) => {
    setExtendingCode(shortCode);
    try {
      await extendShortUrl(shortCode, null);
      setLinks((prev) =>
        prev.map((l) =>
          l.shortCode === shortCode ? { ...l, expiresAt: null, status: 'active' } : l
        )
      );
      // Remove any dismissed flag in session storage
      sessionStorage.removeItem(`dismissed_expiry_alert_${shortCode}`);
    } catch (err: any) {
      alert('Could not make link permanent: ' + err.message);
    } finally {
      setExtendingCode(null);
    }
  };

  const saveCustomDomain = () => {
    let clean = newDomainInput.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    if (!clean) clean = 'my.short';
    setCustomDomain(clean);
    localStorage.setItem('myshort_custom_domain', clean);
    setShowDomainSettings(false);
  };

  // If user is NOT authenticated, display the locked Upgrade Showcase
  if (!user) {
    return (
      <section className="py-10 sm:py-16 bg-transparent min-h-[calc(100vh-200px)] relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-4 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>MEMBER EXCLUSIVE DASHBOARD</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                Unlock My Links, Saved History &amp; Device Telemetry
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Guest Mode allows quick, 48-hour temporary shortening. Create a free account to permanently save your links, inspect browser and device click telemetry tables, and export logs to CSV.
              </p>

              {guestLinksCount > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      You have <strong>{guestLinksCount} temporary guest {guestLinksCount === 1 ? 'link' : 'links'}</strong> expiring in 48 hours. Sign up now to permanently claim them!
                    </span>
                  </div>
                  <button
                    id="claim-guest-links-btn"
                    onClick={() => onTriggerAuth('signup')}
                    className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow"
                  >
                    Claim Links Free
                  </button>
                </div>
              )}
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Browser &amp; Device Table</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time breakdown of every click: Mobile, Tablet, Desktop, Chrome, Safari, OS, and referrers in a clean scrollable table.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Permanent &amp; Password Links</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No 48-hour expiration limit. Secure your links with optional PIN passcodes and custom aliases.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">1-Click CSV Export</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export your raw click events with timestamps, user agents, languages, and timezones for deep spreadsheet analytics.
                </p>
              </div>
            </div>

            {/* Sign Up Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-white/10">
              <button
                id="upgrade-signup-button"
                onClick={() => onTriggerAuth('signup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="upgrade-signin-button"
                onClick={() => onTriggerAuth('signin')}
                className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-sm rounded-xl border border-white/10 transition-colors"
              >
                Sign In to Existing Account
              </button>

              <button
                id="upgrade-back-home-button"
                onClick={onNavigateHome}
                className="w-full sm:w-auto text-xs text-slate-400 hover:text-white px-3 py-2 transition-colors"
              >
                Back to Shortener
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Metrics calculation for Authenticated Member
  const totalUrls = links.length;
  const totalClicks = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const activeCount = links.filter((l) => l.status === 'active').length;

  // Detect custom alias links expiring in <= 24 hours
  const now = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const expiringCustomLinks = links.filter((link) => {
    if (!link.isCustomAlias || !link.expiresAt) return false;
    const expiry = new Date(link.expiresAt).getTime();
    const diff = expiry - now;
    return diff <= twentyFourHoursMs && diff >= -twentyFourHoursMs;
  });

  // Filtered links
  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (link.title && link.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return link.status === statusFilter;
  });

  // Filtered telemetry logs in drawer
  const filteredTelemetry = telemetryLogs.filter((log) => {
    const matchesSearch =
      log.browser.toLowerCase().includes(telemetrySearch.toLowerCase()) ||
      log.os.toLowerCase().includes(telemetrySearch.toLowerCase()) ||
      log.referer.toLowerCase().includes(telemetrySearch.toLowerCase()) ||
      (log.timeZone && log.timeZone.toLowerCase().includes(telemetrySearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (telemetryDeviceFilter === 'all') return true;
    return log.deviceType.toLowerCase() === telemetryDeviceFilter.toLowerCase();
  });

  // Telemetry aggregates
  const deviceCounts = telemetryLogs.reduce(
    (acc, item) => {
      acc[item.deviceType] = (acc[item.deviceType] || 0) + 1;
      return acc;
    },
    { Desktop: 0, Mobile: 0, Tablet: 0 } as Record<string, number>
  );

  return (
    <section className="py-8 sm:py-12 bg-transparent min-h-[calc(100vh-200px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authenticated Member Dashboard</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-indigo-300 font-mono">Domain: {customDomain}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Shortened Links &amp; Telemetry
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your private URLs, inspect browser &amp; device click tables, and export raw logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Custom Domain / Render Settings Button */}
            <button
              id="dashboard-domain-settings-btn"
              onClick={() => {
                if (onNavigateSettings) {
                  onNavigateSettings();
                } else {
                  setNewDomainInput(customDomain);
                  setShowDomainSettings(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-white/10 transition-colors"
              title="Configure custom domain or Render deployment URL"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Domain: <strong className="text-white">{customDomain}</strong></span>
            </button>

            {/* Aggregate Telemetry Button */}
            {links.length > 0 && (
              <button
                id="dashboard-aggregate-telemetry-btn"
                onClick={openAggregateTelemetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold text-xs rounded-xl border border-purple-500/30 transition-colors"
                title="View combined click telemetry across all links"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Telemetry ({totalClicks})</span>
              </button>
            )}

            <button
              id="dashboard-shorten-new-button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Link2 className="w-4 h-4" />
              <span>Shorten New URL</span>
            </button>
          </div>
        </div>

        {/* Link Expiry Alert Banner: Shows if any custom alias links expire in <= 24h */}
        {expiringCustomLinks.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Custom Link Expiry Alert</span>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                    {expiringCustomLinks.length} link{expiringCustomLinks.length > 1 ? 's' : ''} expiring in &lt;24 hours
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Keep your custom aliases active so visitors aren&apos;t blocked when the timer finishes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {expiringCustomLinks.map((link) => (
                <button
                  key={link.shortCode}
                  onClick={() => handleMakePermanent(link.shortCode)}
                  disabled={extendingCode === link.shortCode}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shrink-0 shadow"
                >
                  Make /{link.shortCode} Permanent
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Domain Modal */}
        {showDomainSettings && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Custom Domain / Render URL</h3>
                    <p className="text-xs text-slate-400">Configure your primary short URL display domain</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDomainSettings(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Display Base Domain
                </label>
                <input
                  type="text"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  placeholder="e.g. my.short, myshort.onrender.com, go.mybrand.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Default is <code className="text-indigo-300">my.short</code>. If deploying to Render.com, you can also set your Render address or custom branded vanity domain.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDomainSettings(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomDomain}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Save Domain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Saved Links
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                {totalUrls}
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Tracked Clicks
              </div>
              <div className="text-2xl font-black text-indigo-400 mt-0.5">
                {totalClicks}
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active Links
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {activeCount}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="dashboard-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, title, or destination URL..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              id="dashboard-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-medium"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="active" className="bg-slate-900 text-slate-200">Active</option>
              <option value="expired" className="bg-slate-900 text-slate-200">Expired</option>
              <option value="disabled" className="bg-slate-900 text-slate-200">Disabled</option>
            </select>
          </div>
        </div>

        {/* Links List */}
        {loading ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm font-medium">Loading your links &amp; telemetry...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Link2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {searchQuery ? 'No links match your search' : 'No shortened links yet'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto mb-6">
              {searchQuery
                ? 'Try a different search keyword or clear the status filter.'
                : 'Create your first short link to begin tracking device types, browsers, and redirects.'}
            </p>
            <button
              id="dashboard-empty-shorten-button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Link2 className="w-4 h-4" />
              <span>Shorten Your First Link</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLinks.map((link) => {
              const reachableLiveUrl = getReachableShortUrl(link.shortCode);
              const cleanShort = getDisplayShortUrl(link.shortCode, customDomain);
              const isCopied = copiedCode === link.shortCode;
              const isDeleting = deletingCode === link.shortCode;
              const isExtending = extendingCode === link.shortCode;

              // Check if expiring in 24 hours
              const linkExpiry = link.expiresAt ? new Date(link.expiresAt).getTime() : null;
              const isExpiringSoon =
                link.isCustomAlias &&
                linkExpiry !== null &&
                linkExpiry - now <= twentyFourHoursMs &&
                linkExpiry - now >= -twentyFourHoursMs;

              return (
                <div
                  key={link.id}
                  id={`link-item-${link.shortCode}`}
                  className={`bg-white/5 backdrop-blur-xl rounded-2xl border p-5 shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isExpiringSoon ? 'border-amber-500/40 bg-amber-500/[0.03]' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Left: Code, Short Domain, Original URL, Title */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Short Code badge */}
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                        /{link.shortCode}
                      </span>

                      {/* Clean domain preview: my.short/abcd */}
                      <span className="font-mono text-sm sm:text-base font-black text-white select-all">
                        {cleanShort}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          link.status === 'active'
                            ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                            : link.status === 'expired'
                            ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                            : 'text-slate-400 bg-slate-800 border-white/10'
                        }`}
                      >
                        {link.status}
                      </span>

                      {link.isCustomAlias && (
                        <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          Custom
                        </span>
                      )}

                      {isExpiringSoon && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Expiring &lt;24h</span>
                        </span>
                      )}

                      {link.password && (
                        <span className="text-[10px] font-medium text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Password
                        </span>
                      )}

                      {link.utmCampaign && (
                        <span className="text-[10px] font-medium text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {link.utmCampaign}
                        </span>
                      )}
                    </div>

                    {link.title && (
                      <div className="text-sm font-semibold text-slate-200 truncate">
                        {link.title}
                      </div>
                    )}

                    {/* Original Destination */}
                    <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                      <span className="text-slate-400 shrink-0">Destination:</span>
                      <span className="font-mono text-slate-300 truncate" title={link.originalUrl}>
                        {link.originalUrl}
                      </span>
                    </div>

                    {/* Metadata Sub-row */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="text-slate-400">Created {new Date(link.createdAt).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <span className={isExpiringSoon ? 'text-amber-400 font-semibold' : ''}>
                        {link.expiresAt
                          ? `Expires ${new Date(link.expiresAt).toLocaleDateString()}`
                          : 'Permanent link'}
                      </span>
                      <span>&bull;</span>
                      <span className="text-indigo-300/80 font-mono text-[10px] truncate max-w-xs">
                        Preview: {window.location.host}/{link.shortCode}
                      </span>
                    </div>
                  </div>

                  {/* Right: Metrics & Controls */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/10 shrink-0">
                    
                    {/* Make Permanent Action for Expiring Links */}
                    {isExpiringSoon && (
                      <button
                        id={`make-permanent-btn-${link.shortCode}`}
                        onClick={() => handleMakePermanent(link.shortCode)}
                        disabled={isExtending}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1"
                        title="Remove expiration date and keep link forever"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isExtending ? 'Saving...' : 'Make Permanent'}</span>
                      </button>
                    )}

                    {/* View Click Telemetry Table Button */}
                    <button
                      id={`telemetry-btn-${link.shortCode}`}
                      onClick={() => openTelemetry(link)}
                      className="text-left px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition-all group"
                      title="Inspect browser and device click telemetry"
                    >
                      <div className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span>Telemetry</span>
                      </div>
                      <div className="text-base font-black text-white">
                        {link.clicks || 0} <span className="text-xs font-medium text-slate-400">clicks</span>
                      </div>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* Copy Branded Link */}
                      <button
                        id={`copy-link-btn-${link.shortCode}`}
                        onClick={() => handleCopyBranded(link.shortCode)}
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 transition-all text-xs font-semibold ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-slate-200'
                        }`}
                        title={`Copy ${cleanShort}`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Open Destination / Test in Preview */}
                      <a
                        id={`open-link-btn-${link.shortCode}`}
                        href={reachableLiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                        title="Test redirect in preview window"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* QR Code */}
                      <button
                        id={`qr-link-btn-${link.shortCode}`}
                        onClick={() => onOpenQr(`https://${cleanShort}`, link.title)}
                        className="p-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                        title="Generate QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      {/* Toggle Active / Disabled */}
                      <button
                        id={`toggle-link-btn-${link.shortCode}`}
                        onClick={() => handleToggleStatus(link)}
                        className={`p-2 rounded-xl border border-white/10 transition-colors ${
                          link.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                        title={link.status === 'active' ? 'Disable link' : 'Enable link'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        id={`delete-link-btn-${link.shortCode}`}
                        onClick={() => handleDelete(link.shortCode)}
                        disabled={isDeleting}
                        className="p-2 rounded-xl border border-white/10 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30 transition-colors disabled:opacity-50"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Telemetry & Device Analytics Modal / Drawer */}
        {selectedLinkForTelemetry && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900/95 border border-white/15 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-6 my-auto max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                      {selectedLinkForTelemetry.shortCode}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      Telemetry Active
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Click Analytics &amp; Device Breakdown
                  </h2>
                  <p className="text-xs text-slate-400 truncate max-w-md">
                    Destination: {selectedLinkForTelemetry.originalUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Simulate Test Click Button */}
                  {selectedLinkForTelemetry.id !== 'all_links' && (
                    <button
                      id="simulate-click-btn"
                      onClick={() => handleSimulateTestClick(selectedLinkForTelemetry.shortCode)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-semibold text-xs rounded-xl border border-indigo-500/30 transition-colors"
                      title="Log a test click right now using current browser & device"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Test Click Event</span>
                    </button>
                  )}

                  {/* Export CSV */}
                  <button
                    id="export-csv-btn"
                    onClick={() => exportClicksToCsv(telemetryLogs, selectedLinkForTelemetry.shortCode)}
                    disabled={telemetryLogs.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors"
                    title="Export all click events to CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => setSelectedLinkForTelemetry(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                    title="Close Telemetry"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                {/* Desktop breakdown */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Desktop Visitors</div>
                    <div className="text-lg font-black text-white">
                      {deviceCounts.Desktop || 0}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        ({telemetryLogs.length ? Math.round(((deviceCounts.Desktop || 0) / telemetryLogs.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile breakdown */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Mobile Visitors</div>
                    <div className="text-lg font-black text-white">
                      {deviceCounts.Mobile || 0}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        ({telemetryLogs.length ? Math.round(((deviceCounts.Mobile || 0) / telemetryLogs.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tablet breakdown */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                    <Tablet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Tablet Visitors</div>
                    <div className="text-lg font-black text-white">
                      {deviceCounts.Tablet || 0}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        ({telemetryLogs.length ? Math.round(((deviceCounts.Tablet || 0) / telemetryLogs.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar: Search and Filter inside telemetry logs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={telemetrySearch}
                    onChange={(e) => setTelemetrySearch(e.target.value)}
                    placeholder="Search by browser, OS, or referral source..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Device:</span>
                  <select
                    value={telemetryDeviceFilter}
                    onChange={(e) => setTelemetryDeviceFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All Devices</option>
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                    <option value="tablet">Tablet</option>
                  </select>
                </div>
              </div>

              {/* Clean Scrollable Telemetry Table */}
              <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 shadow-inner">
                {loadingTelemetry ? (
                  <div className="p-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400">Loading telemetry records...</p>
                  </div>
                ) : filteredTelemetry.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <MousePointerClick className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">No Click Telemetry Recorded Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click events and metadata (browser, OS, device type) are captured in real-time when anyone visits the short link.
                    </p>
                    {selectedLinkForTelemetry.id !== 'all_links' && (
                      <button
                        onClick={() => handleSimulateTestClick(selectedLinkForTelemetry.shortCode)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors"
                      >
                        Generate First Test Click
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 border-b border-white/10 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Device</th>
                        <th className="py-3 px-4">Browser</th>
                        <th className="py-3 px-4">Operating System</th>
                        <th className="py-3 px-4">Traffic Source</th>
                        <th className="py-3 px-4">Timezone / Locale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTelemetry.map((click) => {
                        const dateObj = new Date(click.timestamp);
                        const formattedTime = dateObj.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });
                        const formattedDate = dateObj.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        });

                        return (
                          <tr key={click.id} className="hover:bg-white/5 transition-colors">
                            {/* Timestamp */}
                            <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                              <div>{formattedDate}</div>
                              <div className="text-[10px] text-slate-400">{formattedTime}</div>
                            </td>

                            {/* Device Type */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-200">
                                {click.deviceType === 'Mobile' ? (
                                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                                ) : click.deviceType === 'Tablet' ? (
                                  <Tablet className="w-3.5 h-3.5 text-cyan-400" />
                                ) : (
                                  <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                                )}
                                <span>{click.deviceType}</span>
                              </span>
                            </td>

                            {/* Browser */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
                                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{click.browser}</span>
                              </span>
                            </td>

                            {/* OS */}
                            <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                              {click.os}
                            </td>

                            {/* Referral Traffic Source */}
                            <td className="py-3 px-4 text-slate-300 truncate max-w-[150px]">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300 text-[11px]">
                                {click.referer}
                              </span>
                            </td>

                            {/* Timezone / Language */}
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              <div>{click.timeZone || 'UTC'}</div>
                              <div className="text-[10px] text-slate-400">{click.language || 'en-US'}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="text-right text-[11px] text-slate-400 shrink-0">
                Showing {filteredTelemetry.length} of {telemetryLogs.length} total recorded click events
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
};