import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { urlService } from '../services/urlService';
import { ShortUrl } from '../types';

interface ExpiryAlertToastProps {
  onViewDashboard: () => void;
}

export const ExpiryAlertToast: React.FC<ExpiryAlertToastProps> = ({ onViewDashboard }) => {
  const { user } = useAuth();
  const [expiring, setExpiring] = useState<ShortUrl[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const urls = await urlService.getUserUrls(user.uid);
        const now = Date.now();
        const dayAhead = now + 24 * 3600 * 1000;
        const list = urls.filter((u) => {
          if (!u.expiresAt) return false;
          const exp = new Date(u.expiresAt).getTime();
          return exp > now && exp <= dayAhead;
        });
        if (!cancelled) setExpiring(list);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (dismissed || expiring.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-300 mb-1">
            {expiring.length} link{expiring.length > 1 ? 's' : ''} expiring soon
          </p>
          <p className="text-[11px] text-slate-300 mb-2">
            Some of your shortlinks expire within 24 hours.
          </p>
          <button onClick={onViewDashboard} className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline">
            View in Dashboard →
          </button>
        </div>
        <button onClick={() => setDismissed(true)} className="p-1 text-slate-400 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
