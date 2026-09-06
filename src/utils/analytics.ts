import { ClickLog } from '../types';

/**
 * Detect client device type based on user agent and screen traits
 */
export function detectDeviceType(userAgent: string = ''): 'Mobile' | 'Tablet' | 'Desktop' {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  
  // Tablet check
  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  if (isTablet) return 'Tablet';

  // Mobile check
  const isMobile =
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|windows phone|xda|xiino/i.test(
      ua
    );
  if (isMobile) return 'Mobile';

  return 'Desktop';
}

/**
 * Detect browser name and version hints from user agent
 */
export function detectBrowser(userAgent: string = ''): string {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  if (/edg/i.test(ua)) return 'Microsoft Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/brave/i.test(ua) || (typeof navigator !== 'undefined' && (navigator as any).brave !== undefined)) {
    return 'Brave';
  }
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
  if (/chrome|crios/i.test(ua)) return 'Google Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Mozilla Firefox';
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Apple Safari';
  if (/msie|trident/i.test(ua)) return 'Internet Explorer';

  return 'Other Browser';
}

/**
 * Detect Operating System
 */
export function detectOS(userAgent: string = ''): string {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/cros/i.test(ua)) return 'ChromeOS';
  if (/linux/i.test(ua)) return 'Linux';

  return 'Other OS';
}

/**
 * Detect human-readable referral traffic source
 */
export function detectReferer(): string {
  if (typeof document === 'undefined') return 'Direct Navigation';

  const ref = document.referrer;
  if (!ref) {
    // Check URL parameters for campaign source
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const source = params.get('utm_source') || params.get('ref') || params.get('source');
      if (source) return `Campaign (${source})`;
    }
    return 'Direct Navigation';
  }

  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();

    if (host.includes('google.')) return 'Google Search';
    if (host.includes('twitter.') || host.includes('x.com') || host.includes('t.co')) return 'Twitter / X';
    if (host.includes('linkedin.')) return 'LinkedIn';
    if (host.includes('facebook.') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('instagram.')) return 'Instagram';
    if (host.includes('reddit.')) return 'Reddit';
    if (host.includes('youtube.')) return 'YouTube';
    if (host.includes('github.')) return 'GitHub';
    if (host.includes('tiktok.')) return 'TikTok';
    if (host.includes('whatsapp.')) return 'WhatsApp';
    if (host.includes('slack.')) return 'Slack';
    if (host.includes('t.me') || host.includes('telegram.')) return 'Telegram';

    return host.replace(/^www\./, '');
  } catch {
    return 'External Referrer';
  }
}

/**
 * Generate full telemetry metadata log for an incoming redirect visit
 */
export function getClientMetadata(shortCode: string): ClickLog {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const language = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // ignore
  }

  return {
    id: `click_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    shortCode,
    timestamp: new Date().toISOString(),
    browser: detectBrowser(userAgent),
    deviceType: detectDeviceType(userAgent),
    os: detectOS(userAgent),
    referer: detectReferer(),
    language,
    timeZone,
  };
}

/**
 * Helper to get clean branded URL (e.g. "my.short/abcd")
 */
export function getDisplayShortUrl(shortCode: string, customDomain?: string): string {
  const domain = customDomain?.trim() || 'my.short';
  return `${domain}/${shortCode}`;
}

/**
 * Helper to get the actual live clickable URL in current environment
 */
export function getReachableShortUrl(shortCode: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/${shortCode}`;
  }
  return `https://my.short/${shortCode}`;
}

/**
 * Export click telemetry logs as downloadable CSV
 */
export function exportClicksToCsv(clicks: ClickLog[], shortCode?: string): void {
  if (!clicks || clicks.length === 0) {
    alert('No click telemetry data available to export.');
    return;
  }

  const headers = ['Click ID', 'Short Code', 'Timestamp (ISO)', 'Device Type', 'Browser', 'Operating System', 'Traffic Source', 'Language', 'Time Zone'];
  
  const rows = clicks.map((c) => [
    `"${c.id}"`,
    `"${c.shortCode}"`,
    `"${c.timestamp}"`,
    `"${c.deviceType}"`,
    `"${c.browser}"`,
    `"${c.os}"`,
    `"${c.referer}"`,
    `"${c.language || 'N/A'}"`,
    `"${c.timeZone || 'N/A'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `myshort_analytics_${shortCode || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
