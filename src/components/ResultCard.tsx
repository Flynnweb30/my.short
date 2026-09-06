import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Copy,
  Check,
  ExternalLink,
  QrCode,
  RotateCcw,
  Link2,
  Sparkles,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  ShieldCheck,
  Globe,
  Tag,
} from 'lucide-react';
import { ShortUrl, AuthMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { getDisplayShortUrl, getReachableShortUrl } from '../utils/analytics';

interface ResultCardProps {
  shortUrl: ShortUrl;
  onReset: () => void;
  onOpenQr: (url: string, title?: string) => void;
  onTriggerAuth?: (mode: AuthMode) => void;
  onViewDashboard?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  shortUrl,
  onReset,
  onOpenQr,
  onTriggerAuth,
  onViewDashboard,
}) => {
  const { user } = useAuth();
  const [copiedType, setCopiedType] = useState<'branded' | 'full' | 'code' | null>(null);

  // Clean branded short URL representation (e.g. "my.short/abcd" or "link.brand.com/abcd")
  const brandedShortUrl = getDisplayShortUrl(shortUrl.shortCode, shortUrl.domain);
  const fullBrandedUrl = `https://${brandedShortUrl}`;
  // Reachable live browser link for local sandbox testing
  const liveBrowserUrl = getReachableShortUrl(shortUrl.shortCode);

  const handleCopyBranded = async () => {
    try {
      await navigator.clipboard.writeText(brandedShortUrl);
      setCopiedType('branded');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981'],
      });

      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(fullBrandedUrl);
      setCopiedType('full');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(`/${shortUrl.shortCode}`);
      setCopiedType('code');
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // fallback
    }
  };

  // 48-hour guest expiration calculation
  const isGuestLink = !user && !shortUrl.ownerId;
  const expiryDate = shortUrl.expiresAt ? new Date(shortUrl.expiresAt) : null;
  const formattedExpiry = expiryDate
    ? expiryDate.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all">
      {/* Top Gradient Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                Link Shortened!
              </span>
              {shortUrl.isCustomAlias && (
                <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                  Custom Alias
                </span>
              )}
              {shortUrl.password && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                  <Lock className="w-3 h-3" /> Password Protected
                </span>
              )}
              {shortUrl.utmCampaign && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30">
                  <Tag className="w-3 h-3" /> {shortUrl.utmCampaign}
                </span>
              )}
              {isGuestLink ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  Active for 48 Hours
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Permanent Link
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Your short link is active and ready to share
            </h3>
          </div>
        </div>

        <button
          id="shorten-another-button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors self-start md:self-auto bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl border border-white/10"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Shorten Another</span>
        </button>
      </div>

      {/* Main Short URL & Code Display Box */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 mb-5 shadow-inner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Clean Short Link & Short Code */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shrink-0">
              <Link2 className="w-6 h-6" />
            </div>

            <div className="overflow-hidden">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-slate-400">Short Link</span>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                  /{shortUrl.shortCode}
                </span>
                <span className="text-[10px] font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                  Render Ready
                </span>
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight truncate select-all">
                {brandedShortUrl}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary: Copy Branded my.short Link */}
            <button
              id="copy-short-url-button"
              onClick={handleCopyBranded}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg ${
                copiedType === 'branded'
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
              title="Copy branded my.short link"
            >
              {copiedType === 'branded' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied my.short!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy my.short</span>
                </>
              )}
            </button>

            {/* Copy https://my.short/... */}
            <button
              id="copy-full-url-button"
              onClick={handleCopyFull}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
              title="Copy complete URL with https://"
            >
              {copiedType === 'full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Globe className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedType === 'full' ? 'Copied Full' : 'Full URL'}</span>
            </button>

            {/* Quick: Copy Short Code */}
            <button
              id="copy-short-code-button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors"
              title="Copy only the short code"
            >
              {copiedType === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedType === 'code' ? 'Copied' : `/${shortUrl.shortCode}`}</span>
            </button>

            {/* Test Redirection (Opens in preview window) */}
            <a
              id="open-short-url-button"
              href={liveBrowserUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium transition-colors"
              title="Test redirection in current preview environment"
            >
              <ExternalLink className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Test Link</span>
            </a>

            {/* QR Code */}
            <button
              id="qr-code-button"
              onClick={() => onOpenQr(fullBrandedUrl, shortUrl.title)}
              className="p-2.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-slate-200 transition-colors shadow-sm"
              title="Generate QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Live URL Sub-row with fast preview link */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden text-slate-400">
            <span className="text-slate-400 font-medium shrink-0">Branded Link:</span>
            <span className="font-mono text-indigo-300 font-bold select-all">{brandedShortUrl}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-400 text-[11px] truncate">Preview Origin: {window.location.host}/{shortUrl.shortCode}</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium shrink-0">
            Instant 301 Fast Redirect
          </span>
        </div>
      </div>

      {/* Destination & Expiry Metadata */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2 pb-2">
        <div className="flex items-center gap-1.5 truncate max-w-lg">
          <span className="font-medium text-slate-400">Original Destination:</span>
          <span className="truncate text-slate-300 font-mono" title={shortUrl.originalUrl}>
            {shortUrl.originalUrl}
          </span>
        </div>

        {formattedExpiry && (
          <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isGuestLink ? 'Expires in 48 hours:' : 'Expires:'}{' '}
              <strong className="text-white font-medium">{formattedExpiry}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Guest Mode Upgrade Banner */}
      {isGuestLink && (
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Want permanent links & deep click telemetry?</span>
                <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Upgrade Free
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-lg leading-relaxed">
                Guest links expire after 48 hours. Create a free account to make this link permanent, track device types and browsers, and access full link controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="result-upgrade-signup-button"
              onClick={() => onTriggerAuth?.('signup')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
            >
              <span>Save & Make Permanent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Authenticated Confirmation */}
      {!isGuestLink && onViewDashboard && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-emerald-400 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-4 h-4" /> Link saved to your account with real-time telemetry
          </span>
          <button
            id="result-view-dashboard-button"
            onClick={onViewDashboard}
            className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>View in My Links & Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};