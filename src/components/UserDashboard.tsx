import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  MousePointerClick,
  Globe,
  RotateCcw,
  Download,
  Search,
  ExternalLink,
  Trash2,
  Lock,
  Tag,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { urlService } from '../services/urlService';
import { analyticsService, getDisplayShortUrl, getReachableShortUrl } from '../utils/analytics';
import { ShortUrl, ClickLog } from '../types';
import { WorldClickMap } from './WorldClickMap';
import { getCountryFlag } from '../utils/geoData';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [clicks, setClicks] = useState<ClickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetCode, setResetTargetCode] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userUrls = await urlService.getUserUrls(user.uid);
      setUrls(userUrls);
      const userClicks = await urlService.getAllClicksForUser(user.uid, userUrls);
      setClicks(userClicks);
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const aggregates = analyticsService.computeAggregates(urls, clicks);

  const filteredClicks = clicks.filter((c) => {
    if (selectedCountryFilter && c.country !== selectedCountryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.shortCode.toLowerCase().includes(q) ||
        (c.utmCampaign && c.utmCampaign.toLowerCase().includes(q)) ||
        (c.utmSource && c.utmSource.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenReset = (shortCode?: string) => {
    setResetTargetCode(shortCode || null);
    setResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      if (resetTargetCode) {
        await urlService.resetTelemetry(resetTargetCode);
      } else if (user) {
        await urlService.resetTelemetry(undefined, user.uid);
      }
      await loadData();
      setResetModalOpen(false);
    } catch (err) {
      alert('Failed to reset telemetry counters.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUrl = async (shortCode: string) => {
    if (!confirm(`Delete short link "/${shortCode}" and all its logs?`)) return;
    await urlService.deleteUrl(shortCode);
    await loadData();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs sm:text-sm">Loading real-time telemetry analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Real Visitor Attribution Active
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Telemetry &amp; Link Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time attribution, global origins, and device breakdown across your active links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenReset()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors"
            title="Reset telemetry counters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Telemetry</span>
          </button>

          <button
            onClick={() => analyticsService.exportClicksToCsv(clicks)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
            <MousePointerClick className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{aggregates.totalClicks}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Every legitimate click event</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unique Visitors</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{aggregates.totalUniqueVisitors}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Distinct visitor sessions</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Links</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">{urls.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Shortlinks monitored</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Source</span>
            <Tag className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 truncate">
            {aggregates.sources[0]?.name || 'Direct'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {aggregates.sources[0]?.count || 0} clicks attributed
          </span>
        </div>
      </div>

      <WorldClickMap
        clicks={clicks}
        selectedCountry={selectedCountryFilter}
        onSelectCountry={(country) => setSelectedCountryFilter(country)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" /> UTM Campaigns
          </h3>
          {aggregates.campaigns.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No campaign tags recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {aggregates.campaigns.slice(0, 5).map((camp, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5">
                  <span className="font-mono text-indigo-300 truncate max-w-[180px]">{camp.name}</span>
                  <span className="font-bold text-white font-mono">{camp.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" /> Top Countries
          </h3>
          {aggregates.countries.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No geographic clicks recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {aggregates.countries.slice(0, 5).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/5">
                  <span className="flex items-center gap-1.5 text-slate-200 truncate">
                    <span>{getCountryFlag(c.countryCode)}</span>
                    <span>{c.name}</span>
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-purple-400" /> Device Telemetry
          </h3>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
              <span className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" /> Desktop
              </span>
              <span className="font-mono font-bold text-white">{aggregates.devices.Desktop}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Mobile
              </span>
              <span className="font-mono font-bold text-white">{aggregates.devices.Mobile}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
              <span className="flex items-center gap-1.5">
                <Tablet className="w-3.5 h-3.5 text-purple-400" /> Tablet
              </span>
              <span className="font-mono font-bold text-white">{aggregates.devices.Tablet}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Active Shortlinks &amp; Performance</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search links, UTMs, origins..."
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Shortlink</th>
                <th className="p-4">Destination URL</th>
                <th className="p-4 text-center">Total Clicks</th>
                <th className="p-4 text-center">Unique Visitors</th>
                <th className="p-4">Campaign</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {urls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No active shortlinks found. Create one in the Shorten tab!
                  </td>
                </tr>
              ) : (
                urls.map((link) => (
                  <tr key={link.shortCode} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      <a
                        href={getReachableShortUrl(link.shortCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>/{link.shortCode}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-400" title={link.originalUrl}>
                      {link.originalUrl}
                    </td>
                    <td className="p-4 text-center font-bold text-white font-mono">{link.clicks || 0}</td>
                    <td className="p-4 text-center font-bold text-emerald-400 font-mono">{link.uniqueVisitors || 0}</td>
                    <td className="p-4">
                      {link.utmCampaign ? (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]">
                          {link.utmCampaign}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReset(link.shortCode)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                          title="Reset click counters for this link"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUrl(link.shortCode)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete shortlink"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Reset Telemetry Counters?
                </h3>
                <p className="text-xs text-slate-400">
                  {resetTargetCode
                    ? `Reset click counters and visitor events for /${resetTargetCode}.`
                    : 'Reset telemetry click metrics for ALL your shortlinks.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-slate-950 p-3 rounded-xl border border-white/5">
              This action resets total clicks and unique visitor counts to zero. Your shortened URL destinations, custom aliases, and passwords remain intact.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
