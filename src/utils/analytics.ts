import { ShortUrl, ClickLog } from '../types';

export function getDisplayShortUrl(shortCode: string, customDomain?: string | null): string {
  const host = customDomain && customDomain !== 'my.short' ? customDomain : 'my.short';
  return `${host}/${shortCode}`;
}

export function getReachableShortUrl(shortCode: string): string {
  return `${window.location.origin}/r/${shortCode}`;
}

export const analyticsService = {
  computeAggregates(urls: ShortUrl[], clicks: ClickLog[]) {
    const totalClicks = urls.reduce((acc, u) => acc + (u.clicks || 0), 0);
    const totalUniqueVisitors = urls.reduce((acc, u) => acc + (u.uniqueVisitors || 0), 0);

    const countryMap: Record<string, { count: number; countryCode: string; name: string }> = {};
    const timezoneMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    const mediumMap: Record<string, number> = {};
    const campaignMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const browserMap: Record<string, number> = {};

    clicks.forEach((c) => {
      const countryName = c.country || 'Unknown';
      if (!countryMap[countryName]) {
        countryMap[countryName] = { count: 0, countryCode: c.countryCode || 'GL', name: countryName };
      }
      countryMap[countryName].count += 1;

      if (c.timeZone) timezoneMap[c.timeZone] = (timezoneMap[c.timeZone] || 0) + 1;

      let src = 'Direct';
      if (c.utmSource) src = c.utmSource;
      else if (c.referrer && c.referrer !== 'Direct') {
        try { src = new URL(c.referrer).hostname; } catch { src = c.referrer; }
      }
      sourceMap[src] = (sourceMap[src] || 0) + 1;

      if (c.utmMedium) mediumMap[c.utmMedium] = (mediumMap[c.utmMedium] || 0) + 1;
      if (c.utmCampaign) campaignMap[c.utmCampaign] = (campaignMap[c.utmCampaign] || 0) + 1;
      if (c.deviceType) deviceMap[c.deviceType] = (deviceMap[c.deviceType] || 0) + 1;
      if (c.browser) browserMap[c.browser] = (browserMap[c.browser] || 0) + 1;
    });

    return {
      totalClicks,
      totalUniqueVisitors,
      countries: Object.values(countryMap).sort((a, b) => b.count - a.count),
      timezones: Object.entries(timezoneMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      sources: Object.entries(sourceMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      mediums: Object.entries(mediumMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      campaigns: Object.entries(campaignMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      devices: deviceMap,
      browsers: Object.entries(browserMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    };
  },

  exportClicksToCsv(clicks: ClickLog[], filename = 'myshort-telemetry.csv') {
    if (clicks.length === 0) {
      alert('No telemetry click events to export yet.');
      return;
    }
    const headers = ['Event ID','Short Code','Original Destination','Timestamp (ISO)','Unique Visitor','Device Type','Browser','Operating System','Country','Timezone','Referrer','UTM Source','UTM Medium','UTM Campaign','UTM Content','Visitor ID'];
    const rows = clicks.map((c) => [
      `"${c.id}"`,`"${c.shortCode}"`,`"${c.originalUrl || ''}"`,`"${c.timestamp}"`,
      c.isUnique ? 'Yes' : 'No',`"${c.deviceType}"`,`"${c.browser}"`,`"${c.os}"`,
      `"${c.country || ''}"`,`"${c.timeZone}"`,`"${c.referrer}"`,
      `"${c.utmSource || ''}"`,`"${c.utmMedium || ''}"`,`"${c.utmCampaign || ''}"`,
      `"${c.utmContent || ''}"`,`"${c.visitorId}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
