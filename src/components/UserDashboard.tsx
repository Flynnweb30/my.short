import React, { useEffect, useState, useMemo } from 'react';
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
  Sparkles,
  QrCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Sliders,
  History,
  CheckCircle,
  Download,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  Compass,
  Tag,
  RefreshCw,
  Layers,
  ChevronDown,
  X,
  RotateCcw,
  Calendar,
  Users,
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
  extendShortUrl,
  resetLinkActiveCounters,
  clearLinkResetBaseline,
  subscribeToUrlClickLogs,
} from '../services/urlService';
import { useAuth } from '../context/AuthContext';
import {
  getDisplayShortUrl,
  getReachableShortUrl,
  exportClicksToCsv,
  computeTelemetryMetrics,
} from '../utils/analytics';
import { WorldMap } from './WorldMap';

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
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [extendingCode, setExtendingCode] = useState<string | null>(null);
  const [resettingCode, setResettingCode] = useState<string | null>(null);

  // Telemetry drawer / modal state
  const [selectedLinkForTelemetry, setSelectedLinkForTelemetry] = useState<ShortUrl | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<ClickLog[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [telemetrySearch, setTelemetrySearch] = useState('');
  const [telemetryDeviceFilter, setTelemetryDeviceFilter] = useState<string>('all');
  const [telemetryTimeframe, setTelemetryTimeframe] = useState<'active' | 'all'>('active');

  // Custom Domain Setting
  const [customDomain] = useState<string>(() => {
    return localStorage.getItem('myshort_custom_domain') || 'my.short';
  });

  // Guest links count
  const [guestLinksCount, setGuestLinksCount] = useState(0);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        // Automatically claim any guest links from this session if present
        await claimAllGuestUrls(user.uid);
        const fetched = await getUserUrls(user.uid);
        setLinks(fetched);
      } else {
        const guestUrls = getGuestUrls();
        setGuestLinksCount(guestUrls.length);
        setLinks([]);
      }
    } catch {
      setError('Unable to load your links. Please try again.');
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
    setTelemetryTimeframe(link.resetAt ? 'active' : 'all');
    try {
      const logs = await getUrlClickLogs(link.shortCode);
      setTelemetryLogs(logs);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Open aggregate portfolio telemetry across all links
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
    setTelemetryTimeframe('all');
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

  // Real-time live Firestore subscription for the currently viewed link
  useEffect(() => {
    if (!selectedLinkForTelemetry || selectedLinkForTelemetry.id === 'all_links') {
      return;
    }

    const unsubscribe = subscribeToUrlClickLogs(
      selectedLinkForTelemetry.shortCode,
      (liveLogs) => {
        setTelemetryLogs(liveLogs);
        // Automatically reconcile the link's click count in state
        setLinks((prev) =>
          prev.map((l) =>
            l.shortCode === selectedLinkForTelemetry.shortCode
              ? { ...l, clicks: Math.max(l.clicks, liveLogs.length) }
              : l
          )
        );
      }
    );

    return () => unsubscribe();
  }, [selectedLinkForTelemetry]);

  // Reset Active Counters without deleting historical data
  const handleResetActiveCounters = async (shortCode: string) => {
    if (
      !window.confirm(
        `Reset active click counters for /${shortCode}? Historical click telemetry and all-time records will remain safely preserved.`
      )
    ) {
      return;
    }

    setResettingCode(shortCode);
    try {
      const newResetAt = await resetLinkActiveCounters(shortCode);
      setLinks((prev) =>
        prev.map((l) => (l.shortCode === shortCode ? { ...l, resetAt: newResetAt } : l))
      );
      if (selectedLinkForTelemetry?.shortCode === shortCode) {
        setSelectedLinkForTelemetry((prev) => (prev ? { ...prev, resetAt: newResetAt } : null));
      }
    } catch (err: any) {
      alert('Could not reset active counter: ' + err.message);
    } finally {
      setResettingCode(null);
    }
  };

  // Clear Reset Baseline (restores active counter to all-time lifetime)
  const handleClearResetBaseline = async (shortCode: string) => {
    try {
      await clearLinkResetBaseline(shortCode);
      setLinks((prev) =>
        prev.map((l) => (l.shortCode === shortCode ? { ...l, resetAt: null } : l))
      );
      if (selectedLinkForTelemetry?.shortCode === shortCode) {
        setSelectedLinkForTelemetry((prev) => (prev ? { ...prev, resetAt: null } : null));
      }
    } catch (err: any) {
      alert('Could not restore baseline: ' + err.message);
    }
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
      sessionStorage.removeItem(`dismissed_expiry_alert_${shortCode}`);
    } catch (err: any) {
      alert('Could not make link permanent: ' + err.message);
    } finally {
      setExtendingCode(null);
    }
  };

  // Filter links for display
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (statusFilter !== 'all' && link.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        link.shortCode.toLowerCase().includes(q) ||
        link.originalUrl.toLowerCase().includes(q) ||
        (link.title && link.title.toLowerCase().includes(q)) ||
        (link.utmCampaign && link.utmCampaign.toLowerCase().includes(q))
      );
    });
  }, [links, statusFilter, searchQuery]);

  // Telemetry metrics calculation
  const telemetryMetrics = useMemo(() => {
    const resetTimestamp =
      telemetryTimeframe === 'active' && selectedLinkForTelemetry?.resetAt
        ? selectedLinkForTelemetry.resetAt
        : null;
    return computeTelemetryMetrics(telemetryLogs, resetTimestamp);
  }, [telemetryLogs, selectedLinkForTelemetry, telemetryTimeframe]);

  // Filtered telemetry logs for table view
  const filteredTelemetry = useMemo(() => {
    return telemetryLogs.filter((log) => {
      // Filter by reset timeframe if active selected
      if (telemetryTimeframe === 'active' && selectedLinkForTelemetry?.resetAt) {
        const resetTime = new Date(selectedLinkForTelemetry.resetAt).getTime();
        if (new Date(log.timestamp).getTime() < resetTime) return false;
      }

      // Device filter
      if (telemetryDeviceFilter !== 'all') {
        if (log.deviceType.toLowerCase() !== telemetryDeviceFilter.toLowerCase()) return false;
      }

      // Search query
      if (!telemetrySearch.trim()) return true;
      const q = telemetrySearch.toLowerCase().trim();
      return (
        (log.browser && log.browser.toLowerCase().includes(q)) ||
        (log.os && log.os.toLowerCase().includes(q)) ||
        (log.country && log.country.toLowerCase().includes(q)) ||
        (log.city && log.city.toLowerCase().includes(q)) ||
        (log.timeZone && log.timeZone.toLowerCase().includes(q)) ||
        (log.referer && log.referer.toLowerCase().includes(q)) ||
        (log.id && log.id.toLowerCase().includes(q)) ||
        (log.utmSource && log.utmSource.toLowerCase().includes(q)) ||
        (log.utmCampaign && log.utmCampaign.toLowerCase().includes(q))
      );
    });
  }, [telemetryLogs, telemetryDeviceFilter, telemetrySearch, telemetryTimeframe, selectedLinkForTelemetry]);

  // Device counts
  const deviceCounts = useMemo(() => {
    const counts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    filteredTelemetry.forEach((c) => {
      counts[c.deviceType] = (counts[c.deviceType] || 0) + 1;
    });
    return counts;
  }, [filteredTelemetry]);

  // If user is NOT authenticated, display the locked Upgrade Showcase
  if (!user) {
    return (
      <section className="py-10 sm:py-16 bg-transparent min-h-[calc(100vh-200px)] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Unlock My Links, Telemetry &amp; World Map
            </h1>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mb-6 leading-relaxed">
              Create a free account to permanently save your shortened links, monitor live global telemetry, inspect city and timezone distributions on the world map, and generate personal API tokens.
            </p>
            {guestLinksCount > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm max-w-md mx-auto">
                You have <strong>{guestLinksCount} temporary guest links</strong> in this session. Sign up now to permanently claim them!
              </div>
            )}
            <button
              onClick={() => onTriggerAuth('signup')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              Sign Up Free &amp; Claim Links
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Dashboard Top Header & Portfolio Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>PORTFOLIO TELEMETRY DASHBOARD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Shortened Links &amp; Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry tracking every legitimate click event, unique visitor, and campaign attribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openAggregateTelemetry}
            disabled={links.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>Global Portfolio Map</span>
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs rounded-xl border border-white/10 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Shorten New</span>
          </button>
        </div>
      </div>

      {/* Portfolio Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Total Links</div>
          <div className="text-2xl font-black text-white">{links.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Total Clicks (All Time)</div>
          <div className="text-2xl font-black text-indigo-400">
            {links.reduce((acc, l) => acc + (l.clicks || 0), 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Active Links</div>
          <div className="text-2xl font-black text-emerald-400">
            {links.filter((l) => l.status === 'active').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Vanity Branding</div>
          <div className="text-sm font-mono font-bold text-purple-300 truncate">
            {customDomain}
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search links by code, title, destination URL, or UTM campaign..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
      </div>

      {/* Links List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading your shortened links and telemetry...</p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-white/10 text-center space-y-3">
          <Link2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Short Links Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No links matched your search "${searchQuery}".`
              : 'You have not shortened any links yet. Create your first link to start capturing telemetry.'}
          </p>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Create a Link
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLinks.map((link) => {
            const displayUrl = getDisplayShortUrl(link.shortCode, link.domain || customDomain);
            const liveUrl = getReachableShortUrl(link.shortCode);
            const isDeleting = deletingCode === link.shortCode;

            return (
              <div
                key={link.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-white/20 transition-all shadow-md space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Code, Title, Destination */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-indigo-400 select-all">
                        {displayUrl}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          link.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : link.status === 'expired'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {link.status.toUpperCase()}
                      </span>
                      {link.isCustomAlias && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                          Custom Alias
                        </span>
                      )}
                      {link.password && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> PIN Protected
                        </span>
                      )}
                      {link.utmCampaign && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> {link.utmCampaign}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {link.title || 'Untitled Link'}
                    </div>

                    <div className="text-xs font-mono text-slate-400 truncate flex items-center gap-1.5">
                      <span className="text-slate-500">&rarr;</span>
                      <span className="truncate">{link.originalUrl}</span>
                    </div>

                    {link.resetAt && (
                      <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>Active counter baseline reset at {new Date(link.resetAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle / Right: Metrics & Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {/* Metrics button / Telemetry launcher */}
                    <button
                      type="button"
                      onClick={() => openTelemetry(link)}
                      className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Inspect clicks, map, and telemetry"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{link.clicks || 0} Clicks</span>
                    </button>

                    {/* Reset Active Counter Button */}
                    <button
                      type="button"
                      onClick={() => handleResetActiveCounters(link.shortCode)}
                      disabled={resettingCode === link.shortCode}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
                      title="Restart / Reset active click counter (historical data remains safe)"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resettingCode === link.shortCode ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Copy Branded */}
                    <button
                      type="button"
                      onClick={() => handleCopyBranded(link.shortCode)}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
                      title="Copy short link"
                    >
                      {copiedCode === link.shortCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Open QR */}
                    <button
                      type="button"
                      onClick={() => onOpenQr(liveUrl, link.title || link.shortCode)}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
                      title="Generate QR code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Active / Disabled */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(link)}
                      className={`p-2 rounded-xl border transition-colors ${
                        link.status === 'active'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'border-white/10 text-slate-500 bg-white/5 hover:bg-white/10'
                      }`}
                      title={link.status === 'active' ? 'Disable link' : 'Enable link'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(link.shortCode)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== DEEP TELEMETRY & WORLD MAP MODAL ===================== */}
      {selectedLinkForTelemetry && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-7 max-w-5xl w-full shadow-2xl space-y-6 my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    {selectedLinkForTelemetry.shortCode}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Live Telemetry
                  </span>
                  {selectedLinkForTelemetry.resetAt && (
                    <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Active Baseline Set
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {selectedLinkForTelemetry.title || 'Telemetry & Attribution'}
                </h2>
                <p className="text-xs text-slate-400 truncate max-w-lg">
                  Destination: {selectedLinkForTelemetry.originalUrl}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Restart / Reset Control */}
                {selectedLinkForTelemetry.id !== 'all_links' && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleResetActiveCounters(selectedLinkForTelemetry.shortCode)}
                      disabled={resettingCode === selectedLinkForTelemetry.shortCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition-colors"
                      title="Reset active counters while preserving all historical telemetry"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Active Counters</span>
                    </button>

                    {selectedLinkForTelemetry.resetAt && (
                      <button
                        type="button"
                        onClick={() => handleClearResetBaseline(selectedLinkForTelemetry.shortCode)}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs rounded-xl"
                        title="Clear reset baseline, restoring active counters to all-time"
                      >
                        Restore Baseline
                      </button>
                    )}
                  </div>
                )}

                {/* Export CSV */}
                <button
                  type="button"
                  onClick={() => exportClicksToCsv(telemetryLogs, selectedLinkForTelemetry.shortCode)}
                  disabled={telemetryLogs.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLinkForTelemetry(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Timeframe Selector & Metric Cards */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-white/10 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTelemetryTimeframe('active')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      telemetryTimeframe === 'active'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Active View {selectedLinkForTelemetry.resetAt ? '(Since Reset)' : '(Current)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTelemetryTimeframe('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      telemetryTimeframe === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All-Time Lifetime Records
                  </button>
                </div>
              </div>

              {/* Total vs Unique Clicks Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {telemetryTimeframe === 'active' ? 'Active Total Clicks' : 'Lifetime Total Clicks'}
                  </div>
                  <div className="text-xl font-black text-indigo-400">
                    {telemetryTimeframe === 'active'
                      ? telemetryMetrics.activeTotalClicks
                      : telemetryMetrics.totalClicks}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Every legitimate event</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {telemetryTimeframe === 'active' ? 'Active Unique Clicks' : 'Lifetime Unique Visitors'}
                  </div>
                  <div className="text-xl font-black text-purple-400">
                    {telemetryTimeframe === 'active'
                      ? telemetryMetrics.activeUniqueClicks
                      : telemetryMetrics.uniqueClicks}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Deduplicated visitor IDs</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Unique Sessions</div>
                  <div className="text-xl font-black text-emerald-400">
                    {telemetryMetrics.uniqueSessionsCount}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Distinct browser sessions</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Top Device</div>
                  <div className="text-base font-black text-white truncate">
                    {deviceCounts.Mobile > deviceCounts.Desktop ? 'Mobile' : 'Desktop'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    D:{deviceCounts.Desktop} M:{deviceCounts.Mobile} T:{deviceCounts.Tablet}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive World Map Section */}
            <div className="shrink-0">
              <WorldMap
                logs={
                  telemetryTimeframe === 'active' && selectedLinkForTelemetry.resetAt
                    ? telemetryLogs.filter(
                        (l) =>
                          new Date(l.timestamp).getTime() >=
                          new Date(selectedLinkForTelemetry.resetAt!).getTime()
                      )
                    : telemetryLogs
                }
                shortCodeTitle={selectedLinkForTelemetry.shortCode}
              />
            </div>

            {/* Search, Filter, and Detailed Events Table */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={telemetrySearch}
                    onChange={(e) => setTelemetrySearch(e.target.value)}
                    placeholder="Search by Event ID, Country, City, Referrer, Browser, or UTM Source..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              {/* Scrollable Event Log Table */}
              <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 shadow-inner max-h-64">
                {loadingTelemetry ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading events...</div>
                ) : filteredTelemetry.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No click events recorded for this selection yet. Real visits to the tracking link will appear here instantly.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="py-2.5 px-3">Event ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Location &amp; Timezone</th>
                        <th className="py-2.5 px-3">Device / Browser</th>
                        <th className="py-2.5 px-3">Referrer &amp; UTM Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {filteredTelemetry.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-mono text-[11px] text-indigo-300">
                            {log.id.slice(0, 16)}...
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            <div className="font-semibold text-white">
                              {log.city || 'Unknown'}, {log.country || 'Global'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {log.timeZone || 'UTC'}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            <div className="text-white font-medium">{log.deviceType} &bull; {log.browser}</div>
                            <div className="text-[10px] text-slate-400">{log.os}</div>
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            <div className="text-slate-200 truncate max-w-[180px]">
                              {log.utmSource ? `UTM: ${log.utmSource}` : log.referer}
                            </div>
                            {log.utmCampaign && (
                              <div className="text-[10px] text-blue-400 font-mono">
                                Camp: {log.utmCampaign}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
