import React, { useState } from 'react';
import { Globe, Clock, Smartphone, Laptop, Tablet, X } from 'lucide-react';
import { ClickLog } from '../types';
import { getCountryFlag } from '../utils/geoData';

interface WorldClickMapProps {
  clicks: ClickLog[];
  selectedCountry?: string | null;
  onSelectCountry?: (country: string | null) => void;
}

export const WorldClickMap: React.FC<WorldClickMapProps> = ({
  clicks,
  selectedCountry: controlledCountry,
  onSelectCountry,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const activeCountry = controlledCountry !== undefined ? controlledCountry : internalSelected;

  const countryStats = clicks.reduce<Record<string, { count: number; clicks: ClickLog[]; code: string; lat: number; lng: number }>>(
    (acc, c) => {
      const country = c.country || 'Global';
      if (!acc[country]) {
        acc[country] = {
          count: 0,
          clicks: [],
          code: c.countryCode || 'GL',
          lat: c.latitude || 20,
          lng: c.longitude || 0,
        };
      }
      acc[country].count += 1;
      acc[country].clicks.push(c);
      return acc;
    },
    {}
  );

  const selectedData = activeCountry && countryStats[activeCountry] ? countryStats[activeCountry] : null;

  const getCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.max(3, Math.min(97, x)), y: Math.max(8, Math.min(92, y)) };
  };

  const handleSelect = (country: string) => {
    const next = activeCountry === country ? null : country;
    if (onSelectCountry) onSelectCountry(next);
    else setInternalSelected(next);
  };

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
            <Globe className="w-3.5 h-3.5" /> Geographic Telemetry Map
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">Global Click Origins</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any node or country below to inspect location, local timezone time, and UTM attribution.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400">
            Active Countries: <strong className="text-indigo-400">{Object.keys(countryStats).length}</strong>
          </span>
          {activeCountry && (
            <button
              onClick={() => (onSelectCountry ? onSelectCountry(null) : setInternalSelected(null))}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="relative w-full aspect-[2/1] min-h-[260px] sm:min-h-[340px] bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] bg-[size:4%_8%]" />

        <svg className="w-full h-full opacity-40 pointer-events-none select-none" viewBox="0 0 1000 500" fill="currentColor">
          <path className="text-slate-800" d="M150,90 Q220,70 300,100 Q280,180 200,240 Q150,220 120,150 Z" />
          <path className="text-slate-800" d="M260,260 Q340,280 320,400 Q260,450 240,350 Z" />
          <path className="text-slate-800" d="M460,100 Q560,90 560,170 Q490,190 450,150 Z" />
          <path className="text-slate-800" d="M470,200 Q580,210 560,340 Q490,380 460,260 Z" />
          <path className="text-slate-800" d="M580,90 Q820,80 840,220 Q700,280 580,210 Z" />
          <path className="text-slate-800" d="M760,320 Q860,310 850,400 Q770,410 750,350 Z" />
        </svg>

        {Object.entries(countryStats).map(([country, data]) => {
          const coords = getCoordinates(data.lat, data.lng);
          const isSelected = activeCountry === country;
          const pinScale = Math.min(24, Math.max(12, 10 + Math.log2(data.count + 1) * 4));

          return (
            <button
              key={country}
              type="button"
              onClick={() => handleSelect(country)}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform z-20 focus:outline-none ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
              title={`${country}: ${data.count} clicks`}
            >
              <span className="relative flex items-center justify-center">
                <span
                  style={{ width: `${pinScale * 1.8}px`, height: `${pinScale * 1.8}px` }}
                  className={`animate-ping absolute rounded-full ${
                    isSelected ? 'bg-indigo-400 opacity-75' : 'bg-emerald-400 opacity-40'
                  }`}
                />
                <span
                  style={{ width: `${pinScale}px`, height: `${pinScale}px` }}
                  className={`relative rounded-full flex items-center justify-center font-bold text-[9px] text-white shadow-lg border ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-300 ring-2 ring-indigo-400'
                      : 'bg-emerald-600 border-emerald-300 hover:bg-emerald-500'
                  }`}
                >
                  {data.count}
                </span>
              </span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-white/20 text-white text-[10px] font-semibold whitespace-nowrap shadow-xl">
                <span>{getCountryFlag(data.code)}</span>
                <span>{country}</span>
                <span className="text-emerald-400 font-mono">({data.count})</span>
              </span>
            </button>
          );
        })}
      </div>

      {selectedData && (
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getCountryFlag(selectedData.code)}</span>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{activeCountry}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {selectedData.code}
                  </span>
                </h4>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    Timezone: <strong className="text-slate-200">{selectedData.clicks[0]?.timeZone || 'UTC'}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Local Time:{' '}
                    <strong className="text-slate-200">
                      {new Date().toLocaleTimeString(undefined, {
                        timeZone: selectedData.clicks[0]?.timeZone || 'UTC',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-emerald-400">{selectedData.count}</span>
              <span className="block text-[10px] text-slate-400 uppercase">Recorded Clicks</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Top UTM Campaigns</span>
              <div className="space-y-1">
                {Array.from(new Set(selectedData.clicks.map((c) => c.utmCampaign).filter(Boolean)))
                  .slice(0, 3)
                  .map((camp, idx) => (
                    <div key={idx} className="font-mono text-[11px] text-indigo-300 truncate">&bull; {camp}</div>
                  ))}
                {selectedData.clicks.filter((c) => c.utmCampaign).length === 0 && (
                  <span className="text-slate-500 italic text-[11px]">No UTM tag</span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Top Referrers</span>
              <div className="space-y-1">
                {Array.from(new Set(selectedData.clicks.map((c) => c.referrer))).slice(0, 3).map((ref, idx) => (
                  <div key={idx} className="text-[11px] text-slate-300 truncate">&bull; {ref}</div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Device Distribution</span>
              <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-1">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-indigo-400" />
                  {selectedData.clicks.filter((c) => c.deviceType === 'Desktop').length}
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  {selectedData.clicks.filter((c) => c.deviceType === 'Mobile').length}
                </span>
                <span className="flex items-center gap-1">
                  <Tablet className="w-3 h-3 text-purple-400" />
                  {selectedData.clicks.filter((c) => c.deviceType === 'Tablet').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
