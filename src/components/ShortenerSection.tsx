import React, { useState } from 'react';
import { Link2, Copy, Check, QrCode, ArrowRight, Lock, Sparkles, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { urlService } from '../services/urlService';
import { getDisplayShortUrl, getReachableShortUrl } from '../utils/analytics';
import { ShortUrl, AuthMode, UtmParams } from '../types';
import { useAuth } from '../context/AuthContext';

interface ShortenerSectionProps {
  onUrlCreated: (url: ShortUrl) => void;
  onOpenQr: (url: string, title?: string) => void;
  onTriggerAuth: (mode: AuthMode) => void;
  onViewDashboard: () => void;
}

export const ShortenerSection: React.FC<ShortenerSectionProps> = ({
  onUrlCreated,
  onOpenQr,
  onTriggerAuth,
  onViewDashboard,
}) => {
  const { user } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [password, setPassword] = useState('');
  const [expireDays, setExpireDays] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<ShortUrl | null>(null);
  const [copied, setCopied] = useState(false);

  // UTM fields
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedUrl(null);
    setLoading(true);

    try {
      const utm: UtmParams | undefined = utmSource || utmMedium || utmCampaign
        ? { source: utmSource, medium: utmMedium, campaign: utmCampaign }
        : undefined;

      const record = await urlService.createShortUrl(
        {
          originalUrl,
          customAlias: customAlias || undefined,
          password: password || undefined,
          expireDays: expireDays > 0 ? expireDays : undefined,
          utm,
        },
        user?.uid || null
      );

      setCreatedUrl(record);
      onUrlCreated(record);
      setOriginalUrl('');
      setCustomAlias('');
      setPassword('');
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(getReachableShortUrl(createdUrl.shortCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
      <div className="relative max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Real-Time Visitor Telemetry · No Fake Clicks
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-4">
          Shorten links.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Track every real click.
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-8">
          Production-grade URL shortener with interactive world click maps, unique visitor tracking, UTM campaign attribution, and custom domains.
        </p>

        <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl text-left">
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="Paste a long URL (https://example.com/...)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !originalUrl}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{loading ? 'Shortening...' : 'Shorten'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 mb-3"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            <span>Advanced options (custom alias, password, UTM, expiry)</span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Alias</label>
                <input type="text" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="my-brand"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password (optional)</label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="passcode"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expire in (days, 0 = never)</label>
                <input type="number" min={0} value={expireDays} onChange={(e) => setExpireDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="utm_source"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)}
                  placeholder="utm_medium"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="utm_campaign"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          )}

          {!user && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Guest links expire in 48 hours. <button type="button" onClick={() => onTriggerAuth('signup')} className="underline hover:text-amber-300 font-semibold">Sign up</button> to keep them forever.</span>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdUrl && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider mb-2">Short link ready!</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input readOnly value={getReachableShortUrl(createdUrl.shortCode)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-emerald-300" />
                <button type="button" onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" onClick={() => onOpenQr(getReachableShortUrl(createdUrl.shortCode), createdUrl.shortCode)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/10">
                  <QrCode className="w-3.5 h-3.5" /> QR
                </button>
              </div>
              {user && (
                <button type="button" onClick={onViewDashboard} className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 underline">
                  View in Dashboard →
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </section>
  );
};
