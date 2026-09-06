import React, { useEffect, useState } from 'react';
import {
  Clock,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ShortUrl } from '../types';
import { getExpiringCustomAliasUrls, extendShortUrl } from '../services/urlService';
import { useAuth } from '../context/AuthContext';
import { getDisplayShortUrl } from '../utils/analytics';

interface ExpiryAlertToastProps {
  onViewDashboard?: () => void;
  onLinkUpdated?: () => void;
}

export const ExpiryAlertToast: React.FC<ExpiryAlertToastProps> = ({
  onViewDashboard,
  onLinkUpdated,
}) => {
  const { user } = useAuth();
  const [expiringLinks, setExpiringLinks] = useState<ShortUrl[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setExpiringLinks([]);
      return;
    }

    let isMounted = true;

    async function checkExpiring() {
      try {
        const list = await getExpiringCustomAliasUrls(user!.uid);
        if (!isMounted) return;

        // Filter out links dismissed during this browser session
        const activeAlerts = list.filter((link) => {
          return !sessionStorage.getItem(`dismissed_expiry_alert_${link.shortCode}`);
        });

        setExpiringLinks(activeAlerts);
        if (activeAlerts.length > 0 && currentIndex >= activeAlerts.length) {
          setCurrentIndex(0);
        }
      } catch (err) {
        console.warn('Failed to fetch expiring custom links:', err);
      }
    }

    checkExpiring();
    // Poll every 5 minutes to stay accurate
    const interval = setInterval(checkExpiring, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  if (!user || expiringLinks.length === 0) {
    return null;
  }

  const currentLink = expiringLinks[currentIndex] || expiringLinks[0];
  if (!currentLink) return null;

  // Calculate time remaining
  const now = Date.now();
  const expiryTime = currentLink.expiresAt ? new Date(currentLink.expiresAt).getTime() : now;
  const diffMs = expiryTime - now;

  let timeRemainingText = '';
  const isAlreadyExpired = diffMs <= 0;

  if (isAlreadyExpired) {
    timeRemainingText = 'Just reached expiry limit';
  } else {
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      timeRemainingText = `Expires in ${hours}h ${minutes}m`;
    } else {
      timeRemainingText = `Expires in ${minutes} minutes`;
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem(`dismissed_expiry_alert_${currentLink.shortCode}`, 'true');
    const updated = expiringLinks.filter((l) => l.shortCode !== currentLink.shortCode);
    setExpiringLinks(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleMakePermanent = async () => {
    setIsProcessing(true);
    try {
      await extendShortUrl(currentLink.shortCode, null);
      setSuccessMessage(`my.short/${currentLink.shortCode} is now permanent!`);
      
      if (onLinkUpdated) {
        onLinkUpdated();
      }

      setTimeout(() => {
        setSuccessMessage(null);
        handleDismiss();
      }, 2000);
    } catch (err: any) {
      alert('Could not update link expiration: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const brandedUrl = getDisplayShortUrl(currentLink.shortCode);

  return (
    <div
      id="link-expiry-alert-toast"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] bg-slate-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Top Warning Strip */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Custom Link Expiry Alert</span>
          </span>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {successMessage ? (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm font-bold text-white tracking-tight truncate">
                {brandedUrl}
              </span>
              <span className={`text-[11px] font-semibold shrink-0 ${isAlreadyExpired ? 'text-rose-400' : 'text-amber-400'}`}>
                {timeRemainingText}
              </span>
            </div>
            {currentLink.title && (
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {currentLink.title}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="alert-make-permanent-btn"
              onClick={handleMakePermanent}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30 disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Updating...' : 'Make Permanent'}</span>
            </button>

            {onViewDashboard && (
              <button
                id="alert-view-dashboard-btn"
                onClick={onViewDashboard}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold rounded-xl border border-white/10 transition-colors shrink-0"
              >
                Manage
              </button>
            )}
          </div>

          {/* Pagination if multiple links are expiring */}
          {expiringLinks.length > 1 && (
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
              <span>
                Alert {currentIndex + 1} of {expiringLinks.length} expiring custom links
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : expiringLinks.length - 1))}
                  className="p-1 hover:text-white"
                  title="Previous alert"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev < expiringLinks.length - 1 ? prev + 1 : 0))}
                  className="p-1 hover:text-white"
                  title="Next alert"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};