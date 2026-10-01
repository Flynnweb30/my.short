import React, { useState, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Clock,
  Layers,
  MousePointerClick,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  Compass,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { ClickLog } from '../types';
import { getLiveLocalTime } from '../utils/geo';

interface WorldMapProps {
  logs: ClickLog[];
  shortCodeTitle?: string;
}

interface PlottedCluster {
  key: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  locationPrecision: 'precise' | 'approximate';
  totalClicks: number;
  uniqueVisitors: Set<string>;
  destinations: Set<string>;
  sources: Record<string, number>;
  mediums: Record<string, number>;
  campaigns: Record<string, number>;
  recentEvents: ClickLog[];
}

interface UnresolvedCluster {
  key: string;
  country: string;
  city: string;
  timeZone: string;
  locationPrecision: 'unavailable' | 'unresolved';
  totalClicks: number;
  uniqueVisitors: Set<string>;
  sources: Record<string, number>;
  recentEvents: ClickLog[];
}

export const WorldMap: React.FC<WorldMapProps> = ({ logs, shortCodeTitle }) => {
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'plotted' | 'unresolved'>('all');

  // Map SVG Dimensions
  const mapWidth = 900;
  const mapHeight = 460;

  // Convert real (lat, lng) to SVG (x, y) coordinates using Equirectangular projection
  const projectCoords = (lat: number, lng: number) => {
    const clampedLat = Math.max(-85, Math.min(85, lat));
    const clampedLng = Math.max(-180, Math.min(180, lng));
    const x = ((clampedLng + 180) / 360) * mapWidth;
    const y = ((90 - clampedLat) / 180) * mapHeight;
    return { x, y };
  };

  // Partition real telemetry into:
  // 1. Plotted Clusters (events with verified numeric coordinates)
  // 2. Unresolved / Unavailable Clusters (events where IP geolocation was private, blocked, or failed)
  const { plottedClusters, unresolvedClusters, preciseCount, approximateCount, unavailableCount } =
    useMemo(() => {
      const plottedMap = new Map<string, PlottedCluster>();
      const unresolvedMap = new Map<string, UnresolvedCluster>();
      let precise = 0;
      let approx = 0;
      let unavail = 0;

      logs.forEach((log) => {
        const hasValidCoords =
          typeof log.latitude === 'number' &&
          typeof log.longitude === 'number' &&
          !isNaN(log.latitude) &&
          !isNaN(log.longitude);

        if (log.locationPrecision === 'precise') precise++;
        else if (log.locationPrecision === 'approximate') approx++;
        else unavail++;

        if (hasValidCoords) {
          const lat = log.latitude!;
          const lng = log.longitude!;
          const key = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

          if (!plottedMap.has(key)) {
            plottedMap.set(key, {
              key,
              country: log.country && log.country !== 'Unknown' ? log.country : 'Unknown Country',
              countryCode: log.countryCode && log.countryCode !== 'UN' ? log.countryCode : 'UN',
              region: log.region && log.region !== 'Unknown' ? log.region : '',
              city: log.city && log.city !== 'Unknown' ? log.city : 'Resolved Area',
              timeZone: log.timeZone && log.timeZone !== 'Unknown' ? log.timeZone : 'Unknown',
              latitude: lat,
              longitude: lng,
              locationPrecision: log.locationPrecision === 'approximate' ? 'approximate' : 'precise',
              totalClicks: 0,
              uniqueVisitors: new Set(),
              destinations: new Set(),
              sources: {},
              mediums: {},
              campaigns: {},
              recentEvents: [],
            });
          }

          const cluster = plottedMap.get(key)!;
          cluster.totalClicks += 1;
          if (log.visitorId) cluster.uniqueVisitors.add(log.visitorId);
          if (log.destination) cluster.destinations.add(log.destination);

          const src = log.utmSource || log.referer || 'Direct';
          cluster.sources[src] = (cluster.sources[src] || 0) + 1;

          if (log.utmMedium) {
            cluster.mediums[log.utmMedium] = (cluster.mediums[log.utmMedium] || 0) + 1;
          }
          if (log.utmCampaign) {
            cluster.campaigns[log.utmCampaign] = (cluster.campaigns[log.utmCampaign] || 0) + 1;
          }

          cluster.recentEvents.push(log);
        } else {
          // Unresolved or unavailable coordinates
          const key = `unresolved_${log.timeZone || 'Unknown'}`;
          if (!unresolvedMap.has(key)) {
            unresolvedMap.set(key, {
              key,
              country: 'Unknown/Unavailable',
              city: 'Unknown Location',
              timeZone: log.timeZone && log.timeZone !== 'Unknown' ? log.timeZone : 'Unknown',
              locationPrecision: log.locationPrecision === 'unresolved' ? 'unresolved' : 'unavailable',
              totalClicks: 0,
              uniqueVisitors: new Set(),
              sources: {},
              recentEvents: [],
            });
          }

          const uCluster = unresolvedMap.get(key)!;
          uCluster.totalClicks += 1;
          if (log.visitorId) uCluster.uniqueVisitors.add(log.visitorId);
          const src = log.utmSource || log.referer || 'Direct';
          uCluster.sources[src] = (uCluster.sources[src] || 0) + 1;
          uCluster.recentEvents.push(log);
        }
      });

      return {
        plottedClusters: Array.from(plottedMap.values()).sort((a, b) => b.totalClicks - a.totalClicks),
        unresolvedClusters: Array.from(unresolvedMap.values()).sort(
          (a, b) => b.totalClicks - a.totalClicks
        ),
        preciseCount: precise,
        approximateCount: approx,
        unavailableCount: unavail,
      };
    }, [logs]);

  // Max clicks for scaling
  const maxClicks = useMemo(() => {
    return Math.max(...plottedClusters.map((c) => c.totalClicks), 1);
  }, [plottedClusters]);

  // Filter clusters by search
  const filteredPlotted = useMemo(() => {
    if (!searchQuery.trim()) return plottedClusters;
    const q = searchQuery.toLowerCase().trim();
    return plottedClusters.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.timeZone.toLowerCase().includes(q)
    );
  }, [plottedClusters, searchQuery]);

  const selectedPlottedCluster = useMemo(() => {
    if (!selectedClusterKey) return plottedClusters[0] || null;
    return plottedClusters.find((c) => c.key === selectedClusterKey) || null;
  }, [selectedClusterKey, plottedClusters]);

  const selectedUnresolvedCluster = useMemo(() => {
    if (!selectedClusterKey) return unresolvedClusters[0] || null;
    return unresolvedClusters.find((c) => c.key === selectedClusterKey) || null;
  }, [selectedClusterKey, unresolvedClusters]);

  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>AUTHENTIC TELEMETRY MAP</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Geographic Distribution &amp; Live Timezone Attribution
          </h3>
          <p className="text-xs text-slate-400">
            Powered exclusively by real incoming event telemetry &bull; No simulated traffic or placeholder locations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter location or timezone..."
              className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Accuracy & Integrity Indicators Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Tracked Events</div>
          <div className="text-lg font-black text-white">{logs.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Stored in telemetry DB</div>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Precise Locations
          </div>
          <div className="text-lg font-black text-emerald-300">{preciseCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified IP coordinates</div>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Approximate
          </div>
          <div className="text-lg font-black text-amber-300">{approximateCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Timezone / Regional match</div>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Unavailable / Private
          </div>
          <div className="text-lg font-black text-slate-300">{unavailableCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Localhost / privacy shield</div>
        </div>
      </div>

      {/* Map + Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* World Map SVG Container */}
        <div className="lg:col-span-8 bg-slate-950/90 border border-white/10 rounded-2xl p-3 sm:p-5 relative shadow-inner overflow-hidden flex flex-col justify-center min-h-[300px] sm:min-h-[420px]">
          
          {/* Subtle Grid Lines Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          {/* SVG Map */}
          <svg
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="w-full h-auto drop-shadow-md select-none"
            style={{ maxHeight: '420px' }}
          >
            <defs>
              <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#818cf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="activeHotspotGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Stylized Vector World Continents Paths */}
            <g fill="#1e293b" stroke="#334155" strokeWidth="0.8" opacity="0.85">
              {/* North America */}
              <path d="M 120 70 L 160 50 L 260 50 L 300 80 L 290 120 L 230 130 L 240 180 L 210 210 L 190 200 L 170 230 L 150 200 L 130 180 L 100 130 Z" />
              {/* Greenland */}
              <path d="M 310 35 L 360 30 L 380 60 L 340 85 L 305 60 Z" />
              {/* South America */}
              <path d="M 230 240 L 280 230 L 330 270 L 310 340 L 280 410 L 250 420 L 240 350 L 220 280 Z" />
              {/* Europe */}
              <path d="M 430 80 L 480 70 L 530 80 L 520 120 L 490 140 L 460 150 L 440 130 L 420 100 Z" />
              {/* United Kingdom & Ireland */}
              <path d="M 415 90 L 430 85 L 435 110 L 415 115 Z" />
              {/* Africa */}
              <path d="M 430 160 L 510 160 L 550 220 L 540 300 L 500 370 L 460 370 L 430 270 L 400 210 Z" />
              {/* Asia */}
              <path d="M 520 70 L 650 50 L 780 70 L 820 120 L 760 170 L 710 180 L 680 230 L 640 230 L 620 190 L 570 190 L 530 130 Z" />
              {/* Japan */}
              <path d="M 790 130 L 805 130 L 800 160 L 785 150 Z" />
              {/* Southeast Asia */}
              <path d="M 670 240 L 720 230 L 740 280 L 700 290 Z" />
              {/* Australia */}
              <path d="M 720 310 L 800 310 L 820 360 L 780 400 L 730 380 L 710 340 Z" />
              {/* New Zealand */}
              <path d="M 830 380 L 845 375 L 850 405 L 835 410 Z" />
            </g>

            {/* Grid Equator & Prime Meridian */}
            <line x1="0" y1="230" x2={mapWidth} y2="230" stroke="#475569" strokeDasharray="3,6" strokeWidth="0.5" opacity="0.3" />
            <line x1="450" y1="0" x2="450" y2={mapHeight} stroke="#475569" strokeDasharray="3,6" strokeWidth="0.5" opacity="0.3" />

            {/* ONLY plot clusters that have authentic, verified geographic coordinates */}
            {plottedClusters.map((cluster) => {
              const { x, y } = projectCoords(cluster.latitude, cluster.longitude);
              const isSelected = selectedClusterKey === cluster.key;
              const radius = Math.min(22, Math.max(7, (cluster.totalClicks / maxClicks) * 20));

              return (
                <g
                  key={cluster.key}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedClusterKey(cluster.key)}
                >
                  {/* Glowing Pulse Ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius * 1.5}
                    fill={isSelected ? 'url(#activeHotspotGlow)' : 'url(#hotspotGlow)'}
                    className="animate-pulse"
                  />

                  {/* Core Pin */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius * 0.7}
                    fill={isSelected ? '#c084fc' : '#818cf8'}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {/* Marker label */}
                  {isSelected && (
                    <g transform={`translate(${x}, ${y - radius - 8})`}>
                      <rect
                        x="-45"
                        y="-20"
                        width="90"
                        height="20"
                        rx="6"
                        fill="#0f172a"
                        stroke="#818cf8"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-6"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {cluster.city} ({cluster.totalClicks})
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Empty / Unresolved Coordinates Notice if no events can be plotted */}
          {plottedClusters.length === 0 && (
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Verified Coordinates Plotted Yet</h4>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                {logs.length > 0
                  ? `Recorded ${logs.length} telemetry click events. Clicks from private local networks (127.0.0.1) or privacy browsers do not emit public coordinates, and are classified under "Unavailable / Private" below rather than inventing fake markers.`
                  : 'Coordinates will appear automatically when external visitors click your tracking links.'}
              </p>
            </div>
          )}

          {/* Footer note inside map */}
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>
                Verified Plotted Locations: <strong>{plottedClusters.length}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Data derived exclusively from legitimate tracking events
            </div>
          </div>
        </div>

        {/* Selected Cluster Deep Inspector */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          {selectedPlottedCluster ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                      {selectedPlottedCluster.countryCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        selectedPlottedCluster.locationPrecision === 'precise'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {selectedPlottedCluster.locationPrecision === 'precise'
                        ? 'Precise Location'
                        : 'Approximate Location'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {selectedPlottedCluster.city}, {selectedPlottedCluster.country}
                  </h4>
                  {selectedPlottedCluster.region && (
                    <p className="text-xs text-slate-400">{selectedPlottedCluster.region}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Clicks</div>
                  <div className="text-2xl font-black text-white">
                    {selectedPlottedCluster.totalClicks}
                  </div>
                </div>
              </div>

              {/* Timezone and Authenticated Local Time */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Timezone &amp; Local Time</span>
                </div>
                <div className="text-sm font-mono font-bold text-emerald-300">
                  {getLiveLocalTime(selectedPlottedCluster.timeZone)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  IANA: {selectedPlottedCluster.timeZone}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Unique Visitors</div>
                  <div className="text-base font-black text-white">
                    {selectedPlottedCluster.uniqueVisitors.size}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">GPS Coordinates</div>
                  <div className="text-xs font-mono font-bold text-indigo-300">
                    {selectedPlottedCluster.latitude.toFixed(3)}°, {selectedPlottedCluster.longitude.toFixed(3)}°
                  </div>
                </div>
              </div>

              {/* Top UTM / Referral Sources */}
              <div>
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Top Referral Sources
                </h5>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {Object.entries(selectedPlottedCluster.sources).map(([src, count]) => (
                    <div
                      key={src}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-white/5"
                    >
                      <span className="text-slate-300 font-medium truncate max-w-[160px]">{src}</span>
                      <span className="text-indigo-400 font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination */}
              {selectedPlottedCluster.destinations.size > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Destination</div>
                  <div className="text-xs font-mono text-slate-300 truncate max-w-full p-2 bg-slate-900 rounded-lg border border-white/5">
                    {Array.from(selectedPlottedCluster.destinations)[0]}
                  </div>
                </div>
              )}
            </div>
          ) : selectedUnresolvedCluster ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-white/10">
                      Unavailable Coordinates
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {selectedUnresolvedCluster.city}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Clicks originating from local network, privacy protection, or private IP
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Clicks</div>
                  <div className="text-2xl font-black text-white">
                    {selectedUnresolvedCluster.totalClicks}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Timezone Attribution</span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-300">
                  {selectedUnresolvedCluster.timeZone !== 'Unknown'
                    ? getLiveLocalTime(selectedUnresolvedCluster.timeZone)
                    : 'Timezone Unavailable'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  IANA: {selectedUnresolvedCluster.timeZone}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> Why are coordinates unavailable?
                </div>
                <p className="text-[11px] leading-relaxed">
                  Our system records real telemetry only. When a click occurs on a local network (e.g. localhost, 127.0.0.1) or behind a privacy VPN, coordinates cannot be fabricated and are displayed accurately as Unavailable.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-2 my-auto">
              <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No telemetry events recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Verified Geographic Breakdown List */}
      <div className="border-t border-white/10 pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Geographic &amp; Timezone Telemetry Breakdown
          </h4>

          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-white/10 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setViewFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Events ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('plotted')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewFilter === 'plotted'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Plotted ({plottedClusters.length})
            </button>
            <button
              type="button"
              onClick={() => setViewFilter('unresolved')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                viewFilter === 'unresolved'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unavailable ({unresolvedClusters.length})
            </button>
          </div>
        </div>

        {/* Location Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
          {/* Plotted Clusters */}
          {(viewFilter === 'all' || viewFilter === 'plotted') &&
            filteredPlotted.map((cluster) => {
              const isSelected = selectedClusterKey === cluster.key;
              return (
                <button
                  key={cluster.key}
                  type="button"
                  onClick={() => setSelectedClusterKey(cluster.key)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white truncate">
                      {cluster.city}, {cluster.countryCode}
                    </span>
                    <span className="text-xs font-black text-indigo-400 shrink-0">
                      {cluster.totalClicks}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{cluster.country}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">
                    {getLiveLocalTime(cluster.timeZone).split(',')[0]}
                  </div>
                </button>
              );
            })}

          {/* Unresolved Clusters */}
          {(viewFilter === 'all' || viewFilter === 'unresolved') &&
            unresolvedClusters.map((uCluster) => {
              const isSelected = selectedClusterKey === uCluster.key;
              return (
                <button
                  key={uCluster.key}
                  type="button"
                  onClick={() => setSelectedClusterKey(uCluster.key)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-800/80 border-slate-600 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-300 truncate">
                      {uCluster.city}
                    </span>
                    <span className="text-xs font-black text-slate-400 shrink-0">
                      {uCluster.totalClicks}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">Private / Unavailable IP</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {uCluster.timeZone !== 'Unknown'
                      ? getLiveLocalTime(uCluster.timeZone).split(',')[0]
                      : 'Timezone Unavailable'}
                  </div>
                </button>
              );
            })}

          {logs.length === 0 && (
            <div className="col-span-full p-6 text-center text-xs text-slate-500">
              No click telemetry recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
