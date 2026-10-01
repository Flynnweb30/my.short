export type AuthMode = 'signin' | 'signup';

export type AppTab = 'shorten' | 'links' | 'utm' | 'settings' | 'features' | 'pricing';

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  id?: string;
  term?: string;
  content?: string;
}

export interface ShortUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  ownerId?: string | null;
  title?: string;
  createdAt: string;
  expiresAt?: string | null;
  status: 'active' | 'expired' | 'disabled';
  clicks: number;
  uniqueVisitors: number;
  lastAccessedAt?: string | null;
  isCustomAlias?: boolean;
  password?: string | null;
  domain?: string | null;
  utm?: UtmParams | null;
  utmCampaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}

export type UrlModel = ShortUrl;

export interface ClickLog {
  id: string;
  shortCode: string;
  originalUrl?: string;
  timestamp: string;
  browser: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  os: string;
  referrer: string;
  language: string;
  timeZone: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isUnique: boolean;
  visitorId: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmId?: string;
  utmTerm?: string;
  utmContent?: string;
}

export type ClickAnalytics = ClickLog;

export interface ShortenUrlPayload {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  expireDays?: number;
  password?: string;
  domain?: string;
  utm?: UtmParams;
  utmCampaign?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  customDomain?: string | null;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
