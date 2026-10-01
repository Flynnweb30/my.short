export interface ClickLog {
  id: string; // Unique Event ID (e.g. evt_1788666...)
  shortCode: string;
  destination: string;
  timestamp: string; // ISO String
  visitorId: string; // Persistent client identifier to calculate unique vs repeated clicks
  sessionId: string; // Ephemeral browser session identifier
  browser: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  os: string;
  referer: string;
  language?: string;
  timeZone: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: 'precise' | 'approximate' | 'unavailable' | 'unresolved';
  ip?: string;
  isApproximateLocation?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmId?: string;
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

export interface ApiToken {
  id: string;
  userId: string;
  token: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  name: string;
  secret?: string;
  events: string[];
  status: 'active' | 'paused';
  createdAt: string;
  lastTriggeredAt?: string | null;
  lastStatusCode?: number | null;
  lastDeliveryStatus?: 'success' | 'failed' | 'pending' | null;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  responsePreview: string;
  timestamp: string;
  requestPayloadPreview?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  userId: string;
  url: string;
  event: string;
  isTest?: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  success: boolean;
  timestamp: string;
  requestPayloadPreview?: string;
  responseBodyPreview?: string;
  error?: string | null;
}

export interface ShortUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  ownerId?: string;
  title?: string;
  createdAt: string;
  expiresAt?: string | null;
  resetAt?: string | null; // Timestamp when active counters were last reset
  status: 'active' | 'expired' | 'disabled';
  clicks: number; // Total lifetime clicks
  uniqueClicks?: number; // Total lifetime unique visitors
  lastAccessedAt?: string | null;
  isCustomAlias?: boolean;
  password?: string | null;
  utmCampaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  utmId?: string | null;
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
  utmSource?: string;
  utmMedium?: string;
  utmContent?: string;
  utmTerm?: string;
  utmId?: string;
  domain?: string;
}

export type AuthMode = 'signin' | 'signup';
export type AppTab =
  | 'shorten'
  | 'links'
  | 'utm'
  | 'settings'
  | 'features'
  | 'pricing'
  | 'privacy'
  | 'terms'
  | 'contact';
