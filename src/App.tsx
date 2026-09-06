import React, { useState, useEffect } from 'react';

interface LinkItem {
  id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  lastVisited?: string;
}

export function App() {
  const [links, setLinks] = useState<LinkItem[]>([
    { id: '1', shortCode: 'demo-link', originalUrl: 'https://example.com', clicks: 124 }
  ]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial links and real-time telemetry state from backend
  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (err) {
      console.error('Failed to fetch centralized link data:', err);
    }
  };

  // Real visitor click telemetry handler using fetch
  const handleLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>, link: LinkItem) => {
    e.preventDefault();
    setLoadingId(link.id);
    setError(null);

    const telemetryPayload = {
      shortCode: link.shortCode,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
    };

    try {
      // Send real-time telemetry and increment click counter centrally
      const response = await fetch(`/api/track/${link.shortCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telemetryPayload),
      });

      if (!response.ok) {
        throw new Error('Telemetry tracking failed to record real visitor event.');
      }

      const result = await response.json();

      // Update local state to reflect centralized count
      setLinks(prevLinks =>
        prevLinks.map(l => (l.id === link.id ? { ...l, clicks: result.clicks ?? l.clicks + 1 } : l))
      );

      // Navigate to destination URL after successful telemetry logging
      window.location.href = link.originalUrl;
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing the click.');
      setLoadingId(null);
      // Fallback navigation if telemetry request fails
      window.location.href = link.originalUrl;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <header className="mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Centralized Telemetry Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Tracking real-time visitor click events and link performance.
          </p>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {links.map(link => (
            <div
              key={link.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl gap-4 hover:border-slate-600 transition-colors"
            >
              <div className="space-y-1 overflow-hidden">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/50">
                  /{link.shortCode}
                </span>
                <p className="text-sm text-slate-300 truncate max-w-md">{link.originalUrl}</p>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="text-right">
                  <span className="text-lg font-bold text-white">{link.clicks}</span>
                  <span className="text-xs text-slate-400 block">Real Clicks</span>
                </div>

                <a
                  href={link.originalUrl}
                  onClick={(e) => handleLinkClick(e, link)}
                  disabled={loadingId === link.id}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    loadingId === link.id
                      ? 'bg-indigo-600/50 cursor-wait text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  }`}
                >
                  {loadingId === link.id ? 'Tracking...' : 'Visit Link'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;