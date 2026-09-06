import { Timestamp } from 'firebase/firestore';

export interface UrlModel {
  id: string;
  originalUrl: string;
  shortId: string;
  clicks: number;
  uniqueVisitors: number; // Added metric for unique tracking
  userId: string;
  createdAt: Timestamp | Date;
  domain?: string;
  title?: string;
}

export interface ClickAnalytics {
  id?: string;
  urlId: string;
  timestamp: Timestamp | Date;
  userAgent: string;
  referrer: string;
  isUnique: boolean; // Flag to identify if the click was unique
  country?: string;
  device?: string;
  browser?: string;
}