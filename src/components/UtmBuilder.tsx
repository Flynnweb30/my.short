import React, { useState } from 'react';
import { Tag, Copy, Check, RotateCcw, Link2, ArrowRight } from 'lucide-react';
import { UtmParams } from '../types';

interface UtmBuilderProps {
  initialUrl?: string;
  onShortenUtmUrl?: (url: string, utm: UtmParams) => void;
}

export const UtmBuilder: React.FC<UtmBuilderProps> = ({ initialUrl = '', onShortenUtmUrl }) => {
  const [destinationUrl, setDestinationUrl] = useState(initialUrl);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmId, setUtmId] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [forceLowercase, setForceLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const applyPreset = (source: string, medium: string, campaign: string) => {
    setUtmSource(source); setUtmMedium(medium); setUtmCampaign(campaign);
  };

  const sanitizeParam = (val: string) => {
    let clean = val.trim();
    if (forceLowercase) clean = clean.toLowerCase();
    return clean.replace(/\s+/g, '_');
  };

  const generateUrl = (): string => {
    let base = destinationUrl.trim();
    if (!base) return '';
    if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
    try {
      const url = new URL(base);
      if (utmSource) url.searchParams.set('utm_source', sanitizeParam(utmSource));
      if (utmMedium) url.searchParams.set('utm_medium', sanitizeParam(utmMedium));
      if (utmCampaign) url.searchParams.set('utm_campaign', sanitizeParam(utmCampaign));
      if (utmId) url.searchParams.set('utm_id', sanitizeParam(utmId));
      if (utmTerm) url.searchParams.set('utm_term', sanitizeParam(utmTerm));
      if (utmContent) url.searchParams.set('utm_content', sanitizeParam(utmContent));
      return url.toString();
    } catch { return base; }
  };

  const generatedUrl = generateUrl();
  const hasUtmParams = Boolean(utmSource || utmMedium || utmCampaign || utmId || utmTerm || utmContent);

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleReset = () => {
    setDestinationUrl(''); setUtmSource(''); setUtmMedium(''); setUtmCampaign('');
    setUtmId(''); setUtmTerm(''); setUtmContent('');
  };

  const handleTransferToShortener = () => {
    if (!generatedUrl || !onShortenUtmUrl) return;
    onShortenUtmUrl(generatedUrl, {
      source: sanitizeParam(utmSource),
      medium: sanitizeParam(utmMedium),
      campaign: sanitizeParam(utmCampaign),
      id: utmId ? sanitizeParam(utmId) : undefined,
      term: utmTerm ? sanitizeParam(utmTerm) : undefined,
      content: utmContent ? sanitizeParam(utmContent) : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Tag className="w-3.5 h-3.5" /> Campaign Attribution
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">UTM Campaign Link Builder</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Add standardized marketing tracking tags to your destination URLs with zero parameter loss.
            </p>
          </div>
          <button onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">Quick Campaign Presets</span>
          <div className="flex flex-wrap gap-2">
            {[
              ['twitter', 'social', 'brand_launch', 'X / Twitter'],
              ['linkedin', 'social', 'q2_campaign', 'LinkedIn Post'],
              ['newsletter', 'email', 'weekly_roundup', 'Newsletter'],
              ['google', 'cpc', 'search_promo', 'Google Ads'],
              ['producthunt', 'referral', 'launch_day', 'Product Hunt'],
            ].map(([s, m, c, label]) => (
              <button key={label} type="button" onClick={() => applyPreset(s, m, c)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium border border-white/10 transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Destination URL <span className="text-rose-400">*</span>
            </label>
            <input type="text" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
              className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Source (<code className="text-indigo-400">utm_source</code>) <span className="text-rose-400">*</span>
              </label>
              <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
                placeholder="e.g. google, twitter"
                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Medium (<code className="text-indigo-400">utm_medium</code>)
              </label>
              <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="e.g. cpc, email, social"
                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Campaign (<code className="text-indigo-400">utm_campaign</code>)
              </label>
              <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="e.g. spring_sale"
                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">ID (<code>utm_id</code>)</label>
              <input type="text" value={utmId} onChange={(e) => setUtmId(e.target.value)} placeholder="e.g. ad_984"
                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Term (<code>utm_term</code>)</label>
              <input type="text" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} placeholder="e.g. running+shoes"
                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Content (<code>utm_content</code>)</label>
              <input type="text" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="e.g. hero_cta"
                className="w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={forceLowercase} onChange={(e) => setForceLowercase(e.target.checked)}
              className="rounded bg-slate-800 border-white/10 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
            <span>Automatically format UTM tags to lowercase</span>
          </label>
        </div>

        <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" /> Generated Campaign URL
            </span>
            {hasUtmParams && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                Tags Active
              </span>
            )}
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-white/5 font-mono text-xs text-indigo-300 break-all select-all min-h-[44px] flex items-center">
            {generatedUrl || <span className="text-slate-500 italic">Enter a destination URL above to preview</span>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" onClick={handleCopy} disabled={!generatedUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl border border-white/10 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied URL!' : 'Copy Full URL'}</span>
            </button>
            {onShortenUtmUrl && (
              <button type="button" onClick={handleTransferToShortener} disabled={!generatedUrl}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30">
                <span>Shorten this UTM URL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
