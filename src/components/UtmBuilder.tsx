import React, { useState, useMemo } from 'react';
import {
  Tag,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ArrowRight,
  Link2,
  AlertCircle,
  HelpCircle,
  Share2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { normalizeAndValidateUrl, createShortUrl } from '../services/urlService';
import { useAuth } from '../context/AuthContext';
import { ShortUrl, AuthMode } from '../types';

interface UtmBuilderProps {
  onShortenUrl?: (generatedUrl: string, utmData: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;
    utmId: string;
  }) => void;
  onOpenAuth?: (mode: AuthMode) => void;
}

export const UtmBuilder: React.FC<UtmBuilderProps> = ({ onShortenUrl, onOpenAuth }) => {
  const { user } = useAuth();

  // Form Fields
  const [destinationUrl, setDestinationUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmId, setUtmId] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // UI State
  const [copied, setCopied] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [shortening, setShortening] = useState(false);
  const [shortenedResult, setShortenedResult] = useState<ShortUrl | null>(null);

  // Quick Preset Options
  const SOURCE_PRESETS = ['google', 'newsletter', 'twitter', 'linkedin', 'facebook', 'youtube', 'partner'];
  const MEDIUM_PRESETS = ['cpc', 'email', 'social', 'referral', 'banner', 'qr_code', 'affiliate'];

  // Assemble and validate Final URL with query preservation
  const { finalUrl, isValid } = useMemo(() => {
    const raw = destinationUrl.trim();
    if (!raw) return { finalUrl: '', isValid: false };

    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    try {
      const parsed = new URL(normalized);

      // Preserve existing parameters while setting or overriding UTM values
      if (utmSource.trim()) parsed.searchParams.set('utm_source', utmSource.trim());
      else parsed.searchParams.delete('utm_source');

      if (utmMedium.trim()) parsed.searchParams.set('utm_medium', utmMedium.trim());
      else parsed.searchParams.delete('utm_medium');

      if (utmCampaign.trim()) parsed.searchParams.set('utm_campaign', utmCampaign.trim());
      else parsed.searchParams.delete('utm_campaign');

      if (utmId.trim()) parsed.searchParams.set('utm_id', utmId.trim());
      else parsed.searchParams.delete('utm_id');

      if (utmTerm.trim()) parsed.searchParams.set('utm_term', utmTerm.trim());
      else parsed.searchParams.delete('utm_term');

      if (utmContent.trim()) parsed.searchParams.set('utm_content', utmContent.trim());
      else parsed.searchParams.delete('utm_content');

      return { finalUrl: parsed.toString(), isValid: true };
    } catch {
      return { finalUrl: '', isValid: false };
    }
  }, [destinationUrl, utmSource, utmMedium, utmCampaign, utmId, utmTerm, utmContent]);

  const handleCopy = async () => {
    if (!finalUrl) return;
    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleReset = () => {
    setDestinationUrl('');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmId('');
    setUtmTerm('');
    setUtmContent('');
    setUrlError(null);
    setShortenedResult(null);
  };

  const handleShortenNow = async () => {
    if (!finalUrl) {
      setUrlError('Please enter a valid destination website URL');
      return;
    }
    setUrlError(null);
    setShortening(true);

    try {
      const result = await createShortUrl(
        {
          originalUrl: finalUrl,
          customAlias: customAlias.trim() || undefined,
          utmSource: utmSource.trim() || undefined,
          utmMedium: utmMedium.trim() || undefined,
          utmCampaign: utmCampaign.trim() || undefined,
          utmContent: utmContent.trim() || undefined,
          utmTerm: utmTerm.trim() || undefined,
          utmId: utmId.trim() || undefined,
        },
        user?.uid || null
      );
      setShortenedResult(result);
      if (onShortenUrl) {
        onShortenUrl(finalUrl, {
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          utmId,
        });
      }
    } catch (err: any) {
      setUrlError(err.message || 'Failed to shorten UTM tracking link');
    } finally {
      setShortening(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Title Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span>PRODUCTION UTM CAMPAIGN BUILDER</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Campaign URL &amp; Telemetry Tagging
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Attach standardized UTM parameters to your destination URLs with zero query mangling. Generate tracking links, track real visitor clicks, and inspect global telemetry.
        </p>
      </div>

      {/* Main Builder Form Card */}
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Step 1: Destination URL */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>Destination Website URL</span>
              <span className="text-rose-400">*</span>
            </span>
            <span className="text-[11px] text-slate-400 lowercase font-normal">
              e.g. https://yourbrand.com/spring-sale
            </span>
          </label>
          <input
            type="text"
            value={destinationUrl}
            onChange={(e) => {
              setDestinationUrl(e.target.value);
              if (urlError) setUrlError(null);
            }}
            placeholder="https://example.com/landing-page"
            className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {destinationUrl && !isValid && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Please check that your destination URL format is valid.
            </p>
          )}
        </div>

        {/* Step 2: Primary UTM Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Source */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
              <span>Campaign Source (utm_source)</span>
              <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="e.g. google, newsletter"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {SOURCE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setUtmSource(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    utmSource === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Medium */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
              <span>Campaign Medium (utm_medium)</span>
              <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              placeholder="e.g. cpc, email, social"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              {MEDIUM_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setUtmMedium(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    utmMedium === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
              <span>Campaign Name (utm_campaign)</span>
              <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="e.g. spring_launch_2026"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-500 pt-1">Product, promo code, or slogan identifier.</p>
          </div>
        </div>

        {/* Step 3: Optional Advanced UTM Parameters */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Optional Attribution Tags (ID, Term, Content)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-300">Campaign ID (utm_id)</label>
              <input
                type="text"
                value={utmId}
                onChange={(e) => setUtmId(e.target.value)}
                placeholder="e.g. camp_9281"
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-300">Search Term (utm_term)</label>
              <input
                type="text"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
                placeholder="e.g. url+shortener"
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-300">Ad Content (utm_content)</label>
              <input
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="e.g. hero_banner_btn"
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder:text-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Live Generated URL Preview Box */}
        <div className="border-t border-white/10 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Live Generated Tracking URL
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset all fields"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!finalUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl text-xs font-mono text-slate-300 break-all select-all min-h-[50px] flex items-center">
            {finalUrl ? (
              <span>{finalUrl}</span>
            ) : (
              <span className="text-slate-600 italic">Enter a destination URL above to generate your tagged campaign link.</span>
            )}
          </div>
        </div>

        {/* Step 4: One-Click Shorten with my.short */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-400" /> Turn into a Short Tracking Link
            </h4>
            <p className="text-xs text-slate-300">
              Shorten this tagged URL with my.short to automatically log every click event into the world map and device telemetry dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              placeholder="Custom alias (optional)"
              className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleShortenNow}
              disabled={shortening || !finalUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all shrink-0"
            >
              {shortening ? 'Shortening...' : 'Shorten UTM Link'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {urlError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            {urlError}
          </div>
        )}

        {/* Shortened URL Output Banner */}
        {shortenedResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tracking Link Created!
              </span>
              <a
                href={`/${shortenedResult.shortCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-300 underline"
              >
                <span>Test Live Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="font-mono text-sm text-white font-bold bg-slate-900/60 p-2.5 rounded-xl border border-white/10 select-all">
              {window.location.origin}/{shortenedResult.shortCode}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
