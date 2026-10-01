import React, { useState, useEffect } from 'react';
import {
  Link2,
  Sparkles,
  Sliders,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Tag,
  Globe,
  KeyRound,
} from 'lucide-react';
import { ShortenUrlPayload, ShortUrl, AuthMode, CustomDomainRecord } from '../types';
import { createShortUrl, normalizeAndValidateUrl } from '../services/urlService';
import { useAuth } from '../context/AuthContext';
import { getUserDomains } from '../services/domainService';
import { ResultCard } from './ResultCard';

interface ShortenerSectionProps {
  onUrlCreated: (newUrl: ShortUrl) => void;
  onOpenQr: (url: string, title?: string) => void;
  onTriggerAuth?: (mode: AuthMode) => void;
  onViewDashboard?: () => void;
}

export const ShortenerSection: React.FC<ShortenerSectionProps> = ({
  onUrlCreated,
  onOpenQr,
  onTriggerAuth,
  onViewDashboard,
}) => {
  const { user, profile } = useAuth();
  const [urlInput, setUrlInput] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expireDays, setExpireDays] = useState<number | ''>('');
  const [password, setPassword] = useState('');
  
  // Custom domains
  const [userDomains, setUserDomains] = useState<CustomDomainRecord[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('my.short');

  // UTM Campaign Builder state (accessible when user is logged in)
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<ShortUrl | null>(null);

  // Load custom domains for authenticated user
  useEffect(() => {
    if (!user) {
      setUserDomains([]);
      setSelectedDomain('my.short');
      return;
    }

    getUserDomains(user.uid)
      .then((domains) => {
        setUserDomains(domains);
        const primary = domains.find((d) => d.isPrimary) || domains[0];
        if (primary && primary.status === 'verified') {
          setSelectedDomain(primary.domain);
        }
      })
      .catch((err) => {
        console.warn('Could not load user domains:', err);
      });
  }, [user]);

  // Apply UTM parameters to long URL
  const applyUtmPreset = (source: string, medium: string, campaign: string) => {
    if (!user) {
      onTriggerAuth?.('signup');
      return;
    }
    setUtmSource(source);
    setUtmMedium(medium);
    setUtmCampaign(campaign);
  };

  const computeFinalUrl = (): string => {
    let base = urlInput.trim();
    if (!base) return '';
    if (!/^https?:\/\//i.test(base)) {
      base = `https://${base}`;
    }

    // UTM is applied for authenticated users who configure it
    if (!user || (!utmSource && !utmMedium && !utmCampaign)) {
      return base;
    }

    try {
      const parsed = new URL(base);
      if (utmSource) parsed.searchParams.set('utm_source', utmSource);
      if (utmMedium) parsed.searchParams.set('utm_medium', utmMedium);
      if (utmCampaign) parsed.searchParams.set('utm_campaign', utmCampaign);
      return parsed.toString();
    } catch {
      return base;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalUrl = computeFinalUrl();
    const validation = normalizeAndValidateUrl(finalUrl);
    if (!validation.valid) {
      setError(validation.error || 'Please enter a valid URL');
      return;
    }

    setIsLoading(true);

    try {
      const payload: ShortenUrlPayload = {
        originalUrl: finalUrl,
        customAlias: customAlias.trim() || undefined,
        title: title.trim() || undefined,
        expireDays: user && expireDays ? Number(expireDays) : undefined,
        password: user && password.trim() ? password.trim() : undefined,
        utmCampaign: user && utmCampaign.trim() ? utmCampaign.trim() : undefined,
        domain: selectedDomain !== 'my.short' ? selectedDomain : undefined,
      };

      const result = await createShortUrl(payload, user?.uid || null);
      setCreatedUrl(result);
      onUrlCreated(result);
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCreatedUrl(null);
    setUrlInput('');
    setCustomAlias('');
    setTitle('');
    setExpireDays('');
    setPassword('');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setShowOptions(false);
    setShowUtmBuilder(false);
    setError(null);
  };

  const handleUtmButtonClick = () => {
    if (!user) {
      onTriggerAuth?.('signup');
      return;
    }
    setShowOptions(true);
    setShowUtmBuilder(!showUtmBuilder);
  };

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Title & Subheading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>High-Speed, Production Short Links</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-emerald-400 font-bold">my.short</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 sm:mb-4">
            Shorten Links with <span className="text-indigo-400">Deep Telemetry</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Create clean, lightning-fast short URLs formatted as <code className="text-indigo-300 font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10">my.short/alias</code>. Track browser &amp; device analytics, attach UTM tags, and deploy anywhere.
          </p>
        </div>

        {/* Shortener Container */}
        <div className="relative">
          {createdUrl ? (
            <ResultCard
              shortUrl={createdUrl}
              onReset={handleReset}
              onOpenQr={onOpenQr}
              onTriggerAuth={onTriggerAuth}
              onViewDashboard={onViewDashboard}
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 sm:p-8 shadow-2xl relative">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Long URL Input Bar */}
                <div className="relative flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Link2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <input
                      id="original-url-input"
                      type="text"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Paste your long link here (e.g. https://github.com/trending)..."
                      required
                      className="w-full pl-11 pr-4 py-3.5 sm:py-4 bg-slate-900/90 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>

                  <button
                    id="shorten-submit-button"
                    type="submit"
                    disabled={isLoading || !urlInput.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Shortening...</span>
                      </>
                    ) : (
                      <>
                        <span>Shorten URL</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Sub-bar: Options Toggle & Membership Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 px-1">
                  <div className="flex items-center gap-2">
                    <button
                      id="toggle-options-button"
                      type="button"
                      onClick={() => setShowOptions(!showOptions)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{showOptions ? 'Hide Link Options' : 'Options & Custom Alias'}</span>
                    </button>

                    {/* UTM Builder Toggle: Accessible to authenticated users, with unlock prompt for guests */}
                    <button
                      id="toggle-utm-builder-button"
                      type="button"
                      onClick={handleUtmButtonClick}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                        user
                          ? 'text-indigo-300 hover:text-indigo-200 bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/30'
                          : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <Tag className="w-3 h-3 text-indigo-400" />
                      <span>UTM Builder</span>
                      {!user && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
                    </button>
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    {user ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Permanent Links &amp; Telemetry
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Guest: Active 48 Hours
                      </span>
                    )}
                  </span>
                </div>

                {/* Expanded Link Options Drawer */}
                {showOptions && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4 pt-4 mt-2">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Custom Alias & Domain Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="custom-alias-input"
                            className="text-xs font-medium text-slate-300"
                          >
                            Custom alias (optional)
                          </label>
                          {user && userDomains.length > 0 && (
                            <select
                              value={selectedDomain}
                              onChange={(e) => setSelectedDomain(e.target.value)}
                              className="text-[11px] bg-slate-900 border border-white/10 text-indigo-300 rounded-lg px-2 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              title="Select Domain for Short Link"
                            >
                              <option value="my.short">my.short</option>
                              {userDomains.map((d) => (
                                <option key={d.id} value={d.domain}>
                                  {d.domain} {d.status === 'verified' ? '✓' : '(DNS pending)'}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs text-indigo-400 font-mono font-bold truncate max-w-[120px]">
                            {selectedDomain}/
                          </span>
                          <input
                            id="custom-alias-input"
                            type="text"
                            value={customAlias}
                            onChange={(e) => setCustomAlias(e.target.value.toLowerCase())}
                            placeholder="my-link"
                            style={{ paddingLeft: `${Math.max(selectedDomain.length * 7.5 + 20, 80)}px` }}
                            className="w-full pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </div>
                      </div>

                      {/* Link Title */}
                      <div>
                        <label
                          htmlFor="link-title-input"
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Link title (optional)
                        </label>
                        <input
                          id="link-title-input"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Q3 Sales Pitch"
                          className="w-full px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                      </div>

                      {/* Password Protection (Accessible when logged in) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="link-password-input"
                            className="text-xs font-medium text-slate-300 flex items-center gap-1"
                          >
                            <Lock className="w-3 h-3 text-purple-400" />
                            <span>Password Protection</span>
                          </label>
                          {!user && (
                            <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Sign in to use
                            </span>
                          )}
                        </div>

                        {user ? (
                          <input
                            id="link-password-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Set secret passcode / PIN"
                            className="w-full px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        ) : (
                          <div className="p-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs text-slate-400">
                            <span className="truncate">Passcode security for private links</span>
                            <button
                              type="button"
                              onClick={() => onTriggerAuth?.('signup')}
                              className="text-indigo-400 hover:text-indigo-300 font-bold shrink-0 ml-2 text-[11px]"
                            >
                              Unlock
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expiration Settings */}
                      <div>
                        <label
                          htmlFor="expire-days-select"
                          className="block text-xs font-medium text-slate-300 mb-1"
                        >
                          Link Expiration
                        </label>
                        {user ? (
                          <select
                            id="expire-days-select"
                            value={expireDays}
                            onChange={(e) => setExpireDays(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          >
                            <option value="" className="bg-slate-900 text-slate-200">Never (Permanent link)</option>
                            <option value="1" className="bg-slate-900 text-slate-200">1 day (24 hours - alerts you before expiry)</option>
                            <option value="7" className="bg-slate-900 text-slate-200">7 days (1 week)</option>
                            <option value="30" className="bg-slate-900 text-slate-200">30 days (1 month)</option>
                            <option value="90" className="bg-slate-900 text-slate-200">90 days (3 months)</option>
                          </select>
                        ) : (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Guest: Expires in 48 hours</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onTriggerAuth?.('signup')}
                              className="text-indigo-400 hover:text-indigo-300 font-semibold underline text-[11px]"
                            >
                              Upgrade
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Integrated UTM Campaign Builder (Accessible when user is logged in) */}
                    {showUtmBuilder && (
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                            <Tag className="w-3.5 h-3.5" />
                            <span>UTM Campaign Builder</span>
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          </div>

                          {/* 1-Click Presets */}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400 text-[10px] uppercase font-bold">Presets:</span>
                            <button
                              type="button"
                              onClick={() => applyUtmPreset('twitter', 'social', 'x_post')}
                              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            >
                              X / Twitter
                            </button>
                            <button
                              type="button"
                              onClick={() => applyUtmPreset('linkedin', 'social', 'post')}
                              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            >
                              LinkedIn
                            </button>
                            <button
                              type="button"
                              onClick={() => applyUtmPreset('newsletter', 'email', 'weekly_digest')}
                              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            >
                              Newsletter
                            </button>
                            <button
                              type="button"
                              onClick={() => applyUtmPreset('google', 'cpc', 'search_ads')}
                              className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            >
                              Google Ads
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                              utm_source
                            </label>
                            <input
                              type="text"
                              value={utmSource}
                              onChange={(e) => setUtmSource(e.target.value)}
                              placeholder="e.g. twitter, google"
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                              utm_medium
                            </label>
                            <input
                              type="text"
                              value={utmMedium}
                              onChange={(e) => setUtmMedium(e.target.value)}
                              placeholder="e.g. social, email, cpc"
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                              utm_campaign
                            </label>
                            <input
                              type="text"
                              value={utmCampaign}
                              onChange={(e) => setUtmCampaign(e.target.value)}
                              placeholder="e.g. launch_spring"
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200"
                            />
                          </div>
                        </div>

                        {(utmSource || utmCampaign) && (
                          <div className="text-[11px] text-slate-400 truncate bg-slate-900/60 p-2 rounded-lg border border-white/5">
                            <span className="font-semibold text-slate-300">Tagged Destination: </span>
                            <span className="font-mono text-cyan-300">{computeFinalUrl()}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* Error Notification */}
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

              </form>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
