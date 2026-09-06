export interface ClickLog {
  id: string;
  shortCode: string;
  timestamp: string;
  browser: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  os: string;
  referer: string;
  language?: string;
  timeZone?: string;
}

export interface CustomDomainRecord {
  id: string;
  userId: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  verificationToken: string;
  cnameTarget: string;
  createdAt: string;
  verifiedAt?: string | null;
  isPrimary?: boolean;
  sslStatus?: 'active' | 'issuing' | 'pending';
}

export interface ShortUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  ownerId?: string;
  title?: string;
  createdAt: string;
  expiresAt?: string | null;
  status: 'active' | 'expired' | 'disabled';
  clicks: number;
  lastAccessedAt?: string | null;
  isCustomAlias?: boolean;
  password?: string | null;
  utmCampaign?: string | null;
  domain?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  customDomain?: string;
}

export interface ShortenUrlPayload {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  expireDays?: number;
  password?: string;
  utmCampaign?: string;
  domain?: string;
}

export type AuthMode = 'signin' | 'signup';
export type AppTab = 'shorten' | 'links' | 'settings' | 'features' | 'pricing';
