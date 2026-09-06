import React, { useEffect, useState } from 'react';
import { resolveShortUrl, ResolveResult } from '../services/urlService';
import {
  ExternalLink,
  AlertTriangle,
  Clock,
  Ban,
  ArrowRight,
  Home,
  RefreshCw,
  Sparkles,
  Lock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface RedirectHandlerProps {
  shortCode: string;
  onGoHome: () => void;
}

export const RedirectHandler: React.FC<RedirectHandlerProps> = ({ shortCode, onGoHome }) => {
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(2);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const executeLookup = async (passwordAttempt?: string) => {
    try {
      if (passwordAttempt) {
        setSubmittingPassword(true);
      }
      const res = await resolveShortUrl(shortCode, passwordAttempt);
      setResult(res);
      setLoading(false);
      setSubmittingPassword(false);

      if (res.type === 'invalid_password') {
        setPasswordError(res.message);
      } else {
        setPasswordError(null);
      }

      if (res.type === 'success') {
        const isInIframe = window.self !== window.top;
        if (!isInIframe) {
          window.location.replace(res.destinationUrl);
        }
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Error occurred while resolving link' });
      setLoading(false);
      setSubmittingPassword(false);
    }
  };

  useEffect(() => {
    executeLookup();
  }, [shortCode]);

  // Countdown timer for automatic or manual redirect
  useEffect(() => {
    if (result?.type === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => {
          if (prev <= 1 && window.self === window.top) {
            window.location.replace(result.destinationUrl);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, countdown]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPassword.trim()) return;
    executeLookup(enteredPassword.trim());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            Locating Destination
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Resolving short link <span className="font-mono font-semibold text-indigo-300">my.short/{shortCode}</span> securely...
          </p>
          <div className="w-full bg-slate-900/60 border border-white/10 h-2.5 rounded-full overflow-hidden p-0.5">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Password Protection Screen
  if (result?.type === 'password_required' || result?.type === 'invalid_password') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            Password Protected Link
          </h2>
          <p className="text-slate-300 text-sm mb-6">
            This short link <span className="font-mono font-semibold text-purple-300">my.short/{shortCode}</span> is secured. Please enter the passcode to proceed.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" /> Passcode
              </label>
              <input
                id="link-passcode-input"
                type="password"
                value={enteredPassword}
                onChange={(e) => {
                  setEnteredPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Enter password..."
                autoFocus
                className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                {passwordError}
              </div>
            )}

            <button
              id="submit-link-passcode-button"
              type="submit"
              disabled={submittingPassword || !enteredPassword.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all text-sm"
            >
              {submittingPassword ? 'Verifying...' : 'Unlock & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <button
            id="password-cancel-home-button"
            onClick={onGoHome}
            className="mt-4 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel & Return Home
          </button>
        </div>
      </div>
    );
  }

  // 1. Success Redirect Screen
  if (result?.type === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Link Verified &amp; Telemetry Logged
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Redirecting to Destination
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Taking you to the original address in a moment...
          </p>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-left mb-6 overflow-hidden">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Destination URL
            </div>
            <div className="text-sm font-mono text-indigo-300 break-all font-medium select-all">
              {result.destinationUrl}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              id="redirect-now-button"
              href={result.destinationUrl}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm border border-indigo-400/30"
            >
              <span>Go Now</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              id="redirect-home-button"
              onClick={onGoHome}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-200 font-medium rounded-xl transition-colors text-sm border border-white/10"
            >
              Cancel &amp; Return Home
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            If your browser does not redirect automatically within {countdown}s, click "Go Now" above.
          </p>
        </div>
      </div>
    );
  }

  // 2. Link Not Found (404)
  if (result?.type === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            Link Not Found
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            The short URL <span className="font-mono font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">my.short/{shortCode}</span> does not exist in our database. It may have been mistyped or removed.
          </p>

          <button
            id="notfound-home-button"
            onClick={onGoHome}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm border border-indigo-400/30"
          >
            <Home className="w-4 h-4" />
            <span>Create a New Short Link</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Link Expired
  if (result?.type === 'expired') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Clock className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            This Link Has Expired
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {result.message ? (
              result.message
            ) : (
              <>
                The link <span className="font-mono font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">my.short/{shortCode}</span> set an expiration limit that has now passed.
              </>
            )}
          </p>

          <button
            id="expired-home-button"
            onClick={onGoHome}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm border border-indigo-400/30"
          >
            <Home className="w-4 h-4" />
            <span>Go to my.short Homepage</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Link Disabled
  if (result?.type === 'disabled') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400">
            <Ban className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            This Link Is No Longer Available
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            The link <span className="font-mono font-semibold text-slate-300 bg-slate-800/60 border border-white/10 px-1.5 py-0.5 rounded">my.short/{shortCode}</span> was paused or deactivated by its owner.
          </p>

          <button
            id="disabled-home-button"
            onClick={onGoHome}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm border border-indigo-400/30"
          >
            <Home className="w-4 h-4" />
            <span>Go to my.short Homepage</span>
          </button>
        </div>
      </div>
    );
  }

  // 5. Generic Error
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center relative z-10">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          Unable to Redirect
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {result?.type === 'error' ? result.message : 'A temporary error occurred while processing your request.'}
        </p>

        <button
          id="error-home-button"
          onClick={onGoHome}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm border border-indigo-400/30"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>
      </div>
    </div>
  );
};
