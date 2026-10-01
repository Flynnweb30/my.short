import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ShortUrl, ClickLog, ShortenUrlPayload } from '../types';
import { resolveGeoLocation } from '../utils/geoData';

const LOCAL_URLS_KEY = 'myshort_urls_v3';
const LOCAL_CLICKS_KEY = 'myshort_clicks_v3';

export function detectDeviceType(ua: string): 'Desktop' | 'Mobile' | 'Tablet' {
  const lower = ua.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(lower)) return 'Tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(lower)) return 'Mobile';
  return 'Desktop';
}

export function detectBrowser(ua: string): string {
  if (/edg/i.test(ua)) return 'Microsoft Edge';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/opr\//i.test(ua)) return 'Opera';
  return 'Browser';
}

export function detectOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

export function normalizeAndValidateUrl(rawUrl: string): { valid: boolean; normalized: string; error?: string } {
  let trimmed = rawUrl.trim();
  if (!trimmed) return { valid: false, normalized: '', error: 'Destination URL is required.' };
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`;
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { valid: false, normalized: trimmed, error: 'Only http:// and https:// URLs are supported.' };
    if (!parsed.hostname.includes('.')) return { valid: false, normalized: trimmed, error: 'Destination must include a valid domain.' };
    return { valid: true, normalized: trimmed };
  } catch {
    return { valid: false, normalized: trimmed, error: 'Invalid URL format.' };
  }
}

export function generateShortCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export const urlService = {
  async getUrlByShortCode(shortCode: string): Promise<ShortUrl | null> {
    const cleanCode = shortCode.trim();
    try {
      const docRef = doc(db, 'urls', cleanCode);
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as ShortUrl;
    } catch (e) {
      console.warn('Firestore lookup fallback:', e);
    }
    try {
      const raw = localStorage.getItem(LOCAL_URLS_KEY);
      if (raw) {
        const localList: ShortUrl[] = JSON.parse(raw);
        const found = localList.find((u) => u.shortCode.toLowerCase() === cleanCode.toLowerCase());
        if (found) return found;
      }
    } catch { /* ignore */ }
    return null;
  },

  async createShortUrl(payload: ShortenUrlPayload, ownerId: string | null): Promise<ShortUrl> {
    const validCheck = normalizeAndValidateUrl(payload.originalUrl);
    if (!validCheck.valid) throw new Error(validCheck.error || 'Invalid URL');

    let code = payload.customAlias ? payload.customAlias.trim() : generateShortCode();
    code = code.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!code) code = generateShortCode();

    const existing = await this.getUrlByShortCode(code);
    if (existing) {
      if (payload.customAlias) throw new Error(`The custom alias "${code}" is already taken. Please choose another.`);
      else code = generateShortCode(7);
    }

    const now = new Date();
    let expiresAt: string | null = null;
    if (ownerId && payload.expireDays) {
      expiresAt = new Date(now.getTime() + payload.expireDays * 86400000).toISOString();
    } else if (!ownerId) {
      expiresAt = new Date(now.getTime() + 48 * 3600000).toISOString();
    }

    const newRecord: ShortUrl = {
      id: code,
      shortCode: code,
      originalUrl: validCheck.normalized,
      ownerId: ownerId || null,
      title: payload.title || undefined,
      createdAt: now.toISOString(),
      expiresAt,
      status: 'active',
      clicks: 0,
      uniqueVisitors: 0,
      lastAccessedAt: null,
      isCustomAlias: Boolean(payload.customAlias),
      password: payload.password || null,
      domain: payload.domain || 'my.short',
      utm: payload.utm || null,
      utmCampaign: payload.utm?.campaign || payload.utmCampaign || null,
      utmSource: payload.utm?.source || null,
      utmMedium: payload.utm?.medium || null,
    };

    try {
      await setDoc(doc(db, 'urls', code), newRecord);
    } catch (err) {
      console.warn('Saving URL to Firestore failed; storing locally:', err);
    }

    try {
      const raw = localStorage.getItem(LOCAL_URLS_KEY);
      const list: ShortUrl[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(LOCAL_URLS_KEY, JSON.stringify([newRecord, ...list]));
    } catch { /* ignore */ }

    return newRecord;
  },

  async recordClick(shortCode: string, clientMeta: { referrer?: string; userAgent?: string }): Promise<{ clicks: number; uniqueVisitors: number }> {
    const urlData = await this.getUrlByShortCode(shortCode);
    if (!urlData) throw new Error('URL not found');

    const ua = clientMeta.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const timeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC';
    const geo = resolveGeoLocation(timeZone);

    let visitorId = typeof localStorage !== 'undefined' ? localStorage.getItem('myshort_vid') : null;
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (typeof localStorage !== 'undefined') localStorage.setItem('myshort_vid', visitorId);
    }

    const visitedLinksKey = `myshort_vlinks_${visitorId}`;
    let visitedSet: string[] = [];
    try {
      const visitedSetRaw = localStorage.getItem(visitedLinksKey);
      visitedSet = visitedSetRaw ? JSON.parse(visitedSetRaw) : [];
    } catch { visitedSet = []; }

    const isUnique = !visitedSet.includes(shortCode);
    if (isUnique) {
      visitedSet.push(shortCode);
      try { localStorage.setItem(visitedLinksKey, JSON.stringify(visitedSet)); } catch { /* ignore */ }
    }

    const newClicks = (urlData.clicks || 0) + 1;
    const newUnique = (urlData.uniqueVisitors || 0) + (isUnique ? 1 : 0);
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const clickEvent: ClickLog = {
      id: eventId,
      shortCode,
      originalUrl: urlData.originalUrl,
      timestamp: new Date().toISOString(),
      browser: detectBrowser(ua),
      deviceType: detectDeviceType(ua),
      os: detectOS(ua),
      referrer: clientMeta.referrer || (typeof document !== 'undefined' ? document.referrer : '') || 'Direct',
      language: typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en',
      timeZone,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isUnique,
      visitorId: visitorId || 'unknown',
      utmSource: urlData.utm?.source || urlData.utmSource || undefined,
      utmMedium: urlData.utm?.medium || urlData.utmMedium || undefined,
      utmCampaign: urlData.utm?.campaign || urlData.utmCampaign || undefined,
      utmId: urlData.utm?.id || undefined,
      utmTerm: urlData.utm?.term || undefined,
      utmContent: urlData.utm?.content || undefined,
    };

    try {
      await updateDoc(doc(db, 'urls', shortCode), {
        clicks: newClicks,
        uniqueVisitors: newUnique,
        lastAccessedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'urls', shortCode, 'clicks', eventId), clickEvent);
    } catch (e) {
      console.warn('Firestore click log write error:', e);
    }

    try {
      const rawUrls = localStorage.getItem(LOCAL_URLS_KEY);
      if (rawUrls) {
        const list: ShortUrl[] = JSON.parse(rawUrls);
        const updated = list.map((u) =>
          u.shortCode === shortCode ? { ...u, clicks: newClicks, uniqueVisitors: newUnique, lastAccessedAt: clickEvent.timestamp } : u
        );
        localStorage.setItem(LOCAL_URLS_KEY, JSON.stringify(updated));
      }
      const rawClicks = localStorage.getItem(LOCAL_CLICKS_KEY);
      const clickList: ClickLog[] = rawClicks ? JSON.parse(rawClicks) : [];
      localStorage.setItem(LOCAL_CLICKS_KEY, JSON.stringify([clickEvent, ...clickList]));
    } catch { /* ignore */ }

    return { clicks: newClicks, uniqueVisitors: newUnique };
  },

  async getUserUrls(userId: string): Promise<ShortUrl[]> {
    const list: ShortUrl[] = [];
    try {
      const q = query(collection(db, 'urls'), where('ownerId', '==', userId));
      const snap = await getDocs(q);
      snap.forEach((d) => list.push(d.data() as ShortUrl));
    } catch (e) {
      console.warn('Firestore getUserUrls query fallback:', e);
    }
    try {
      const raw = localStorage.getItem(LOCAL_URLS_KEY);
      if (raw) {
        const localList: ShortUrl[] = JSON.parse(raw);
        localList.forEach((lu) => {
          if ((lu.ownerId === userId || !lu.ownerId) && !list.some((u) => u.shortCode === lu.shortCode)) {
            list.push(lu);
          }
        });
      }
    } catch { /* ignore */ }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllClicksForUser(userId: string, userUrls?: ShortUrl[]): Promise<ClickLog[]> {
    const urls = userUrls || (await this.getUserUrls(userId));
    const codes = urls.map((u) => u.shortCode);
    const allClicks: ClickLog[] = [];

    for (const code of codes) {
      try {
        const snap = await getDocs(collection(db, 'urls', code, 'clicks'));
        snap.forEach((d) => allClicks.push(d.data() as ClickLog));
      } catch { /* ignore */ }
    }

    try {
      const rawClicks = localStorage.getItem(LOCAL_CLICKS_KEY);
      if (rawClicks) {
        const localClicks: ClickLog[] = JSON.parse(rawClicks);
        localClicks.forEach((lc) => {
          if (codes.includes(lc.shortCode) && !allClicks.some((c) => c.id === lc.id)) allClicks.push(lc);
        });
      }
    } catch { /* ignore */ }

    return allClicks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async resetTelemetry(shortCode?: string, userId?: string): Promise<void> {
    if (shortCode) {
      try { await updateDoc(doc(db, 'urls', shortCode), { clicks: 0, uniqueVisitors: 0 }); } catch (e) { console.warn('Firestore reset error:', e); }
      try {
        const rawUrls = localStorage.getItem(LOCAL_URLS_KEY);
        if (rawUrls) {
          const list: ShortUrl[] = JSON.parse(rawUrls);
          localStorage.setItem(LOCAL_URLS_KEY, JSON.stringify(list.map((u) => (u.shortCode === shortCode ? { ...u, clicks: 0, uniqueVisitors: 0 } : u))));
        }
        const rawClicks = localStorage.getItem(LOCAL_CLICKS_KEY);
        if (rawClicks) {
          const clicks: ClickLog[] = JSON.parse(rawClicks);
          localStorage.setItem(LOCAL_CLICKS_KEY, JSON.stringify(clicks.filter((c) => c.shortCode !== shortCode)));
        }
      } catch { /* ignore */ }
    } else if (userId) {
      const urls = await this.getUserUrls(userId);
      for (const u of urls) await this.resetTelemetry(u.shortCode);
    }
  },

  async deleteUrl(shortCode: string): Promise<void> {
    try { await deleteDoc(doc(db, 'urls', shortCode)); } catch (e) { console.warn('Firestore delete error:', e); }
    try {
      const raw = localStorage.getItem(LOCAL_URLS_KEY);
      if (raw) {
        const list: ShortUrl[] = JSON.parse(raw);
        localStorage.setItem(LOCAL_URLS_KEY, JSON.stringify(list.filter((u) => u.shortCode !== shortCode)));
      }
    } catch { /* ignore */ }
  },
};

export const createShortUrl = urlService.createShortUrl.bind(urlService);
