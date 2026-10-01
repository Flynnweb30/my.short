import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { urlService } from '../services/urlService';
import { ShortUrl } from '../types';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const RedirectHandler: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState<string | null>(null);
  const [urlRecord, setUrlRecord] = useState<ShortUrl | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) return;
      try {
        const data = await urlService.getUrlByShortCode(shortCode);
        if (!data) { setError('Short link not found or has been disabled.'); return; }
        if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
          setError('This short link has expired.'); return;
        }
        if (data.password) { setUrlRecord(data); setNeedsPassword(true); return; }
        await executeFinalRedirect(data);
      } catch (err: any) {
        console.error('Redirect failed:', err);
        setError('An unexpected error occurred while routing your request.');
      }
    };
    handleRedirect();
  }, [shortCode]);

  const executeFinalRedirect = async (data: ShortUrl) => {
    try {
      await urlService.recordClick(data.shortCode, {
        referrer: document.referrer || 'Direct',
        userAgent: navigator.userAgent,
      });
      let finalDestination = data.originalUrl;
      const currentSearchParams = new URLSearchParams(window.location.search);
      if (currentSearchParams.toString()) {
        try {
          const dest = new URL(finalDestination);
          currentSearchParams.forEach((val, key) => dest.searchParams.set(key, val));
          finalDestination = dest.toString();
        } catch { /* ignore */ }
      }
      window.location.replace(finalDestination);
    } catch {
      window.location.replace(data.originalUrl);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlRecord) return;
    if (enteredPassword.trim() === urlRecord.password) {
      setNeedsPassword(false);
      executeFinalRedirect(urlRecord);
    } else {
      setError('Incorrect passcode. Please try again.');
    }
  };

  if (needsPassword && urlRecord) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-1">Protected Short Link</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter the passcode to proceed to <strong className="text-white">/{urlRecord.shortCode}</strong>
          </p>
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-4">{error}</div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input type="password" required value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)} placeholder="Enter passcode PIN"
              className="w-full px-4 py-3 bg-slate-950 border border-white/15 rounded-xl text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest" />
            <button type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5">
              <span>Unlock &amp; Proceed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center">
        <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Link Unavailable</h2>
          <p className="text-xs sm:text-sm text-slate-400">{error}</p>
          <a href="/" className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all">
            Create Your Own Shortlink
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider">Redirecting safely...</span>
      </div>
    </div>
  );
};
