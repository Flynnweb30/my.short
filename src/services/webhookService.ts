import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { WebhookEndpoint, WebhookTestResult, WebhookDeliveryLog, ShortUrl, ClickLog } from '../types';

const LOCAL_WEBHOOK_LOGS_KEY = 'myshort_webhook_logs';

/**
 * Persist an outbound webhook delivery attempt into Firestore and local cache
 */
export async function recordWebhookLog(log: WebhookDeliveryLog): Promise<void> {
  // 1. Write to Firestore subcollection /users/{userId}/webhookLogs/{log.id}
  try {
    const docRef = doc(db, 'users', log.userId, 'webhookLogs', log.id);
    await setDoc(docRef, log);
  } catch (err) {
    console.warn('Could not record webhook log in Firestore:', err);
  }

  // 2. Cache in localStorage for high-speed responsiveness
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_WEBHOOK_LOGS_KEY);
      const existing: WebhookDeliveryLog[] = raw ? JSON.parse(raw) : [];
      const updated = [log, ...existing.filter((item) => item.id !== log.id)].slice(0, 100);
      localStorage.setItem(LOCAL_WEBHOOK_LOGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

/**
 * Fetch recent webhook delivery attempt logs for an authenticated user
 */
export async function getUserWebhookLogs(userId: string): Promise<WebhookDeliveryLog[]> {
  const remoteLogs: WebhookDeliveryLog[] = [];

  try {
    const colRef = collection(db, 'users', userId, 'webhookLogs');
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      remoteLogs.push(d.data() as WebhookDeliveryLog);
    });
  } catch (err) {
    console.warn('Could not fetch webhookLogs subcollection:', err);
  }

  let localLogs: WebhookDeliveryLog[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_WEBHOOK_LOGS_KEY);
      if (raw) {
        localLogs = (JSON.parse(raw) as WebhookDeliveryLog[]).filter((l) => l.userId === userId);
      }
    } catch {
      // ignore
    }
  }

  // Merge by unique id
  const map = new Map<string, WebhookDeliveryLog>();
  for (const log of remoteLogs) {
    map.set(log.id, log);
  }
  for (const log of localLogs) {
    if (!map.has(log.id)) {
      map.set(log.id, log);
    }
  }

  const combined = Array.from(map.values());
  combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return combined.slice(0, 100);
}

/**
 * Clear user webhook history logs
 */
export async function clearUserWebhookLogs(userId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_WEBHOOK_LOGS_KEY);
    } catch {
      // ignore
    }
  }

  try {
    const colRef = collection(db, 'users', userId, 'webhookLogs');
    const snap = await getDocs(colRef);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.allSettled(deletePromises);
  } catch (err) {
    console.warn('Error clearing webhook logs:', err);
  }
}

/**
 * Generate a cryptographically secure webhook signing secret (e.g. whsec_live_...)
 */
export function generateWebhookSecret(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  const arr = new Uint8Array(28);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < 28; i++) {
      rand += chars[arr[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 28; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `whsec_live_${rand}`;
}

/**
 * Validates webhook destination URL
 */
export function validateWebhookUrl(inputUrl: string): { valid: boolean; url: string; error?: string } {
  let trimmed = inputUrl.trim();
  if (!trimmed) {
    return { valid: false, url: '', error: 'Webhook URL cannot be empty' };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, url: '', error: 'Webhook URL must use http or https protocol' };
    }
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, url: '', error: 'Please enter a valid webhook endpoint URL' };
  }
}

/**
 * Fetch all registered webhooks for an authenticated user
 */
export async function getUserWebhooks(userId: string): Promise<WebhookEndpoint[]> {
  try {
    const colRef = collection(db, 'users', userId, 'webhooks');
    const snap = await getDocs(colRef);
    const webhooks: WebhookEndpoint[] = [];
    snap.forEach((d) => {
      webhooks.push(d.data() as WebhookEndpoint);
    });

    webhooks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sync active list to backend server cache asynchronously
    if (typeof window !== 'undefined' && webhooks.length > 0) {
      fetch('/api/webhooks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, webhooks }),
      }).catch(() => {
        // non-blocking
      });
    }

    return webhooks;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${userId}/webhooks`);
    return [];
  }
}

/**
 * Register a new webhook endpoint for a user
 */
export async function createWebhook(
  userId: string,
  input: {
    url: string;
    name: string;
    secret?: string;
    events?: string[];
    status?: 'active' | 'paused';
  }
): Promise<WebhookEndpoint> {
  const urlValidation = validateWebhookUrl(input.url);
  if (!urlValidation.valid) {
    throw new Error(urlValidation.error || 'Invalid webhook URL');
  }

  const webhookId = `whk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const secret = input.secret && input.secret.trim() ? input.secret.trim() : generateWebhookSecret();

  const newWebhook: WebhookEndpoint = {
    id: webhookId,
    userId,
    url: urlValidation.url,
    name: input.name.trim() || 'Default Webhook',
    secret,
    events: input.events && input.events.length > 0 ? input.events : ['link.clicked'],
    status: input.status || 'active',
    createdAt: new Date().toISOString(),
    lastTriggeredAt: null,
    lastStatusCode: null,
    lastDeliveryStatus: null,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'webhooks', webhookId), newWebhook);

    // Sync with backend server
    if (typeof window !== 'undefined') {
      fetch('/api/webhooks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, webhook: newWebhook }),
      }).catch(() => {
        // non-blocking
      });
    }

    return newWebhook;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/webhooks/${webhookId}`);
    throw err;
  }
}

/**
 * Update an existing webhook endpoint
 */
export async function updateWebhook(
  userId: string,
  webhookId: string,
  updates: Partial<WebhookEndpoint>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'webhooks', webhookId);
    await updateDoc(docRef, updates);

    // Sync update to backend
    if (typeof window !== 'undefined') {
      fetch('/api/webhooks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, webhook: { id: webhookId, userId, ...updates } }),
      }).catch(() => {
        // non-blocking
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/webhooks/${webhookId}`);
    throw err;
  }
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhook(userId: string, webhookId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'webhooks', webhookId));

    if (typeof window !== 'undefined') {
      fetch(`/api/webhooks/${encodeURIComponent(webhookId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {
        // non-blocking
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}/webhooks/${webhookId}`);
    throw err;
  }
}

/**
 * Trigger a real-time test POST notification to verify a webhook URL
 */
export async function testWebhookEndpoint(
  url: string,
  secret?: string,
  eventType: string = 'link.clicked',
  meta?: { userId?: string; webhookId?: string }
): Promise<WebhookTestResult> {
  const urlValidation = validateWebhookUrl(url);
  if (!urlValidation.valid) {
    throw new Error(urlValidation.error || 'Invalid webhook URL');
  }

  const response = await fetch('/api/webhooks/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: urlValidation.url,
      secret: secret || '',
      eventType,
    }),
  });

  if (!response.ok && response.status >= 500) {
    const errData = await response.json().catch(() => ({}));
    const errorMsg = errData.error || `Server returned error status ${response.status}`;
    if (meta?.userId) {
      const logId = `deliv_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      recordWebhookLog({
        id: logId,
        webhookId: meta.webhookId || 'custom_test',
        userId: meta.userId,
        url: urlValidation.url,
        event: eventType || 'test.ping',
        isTest: true,
        statusCode: response.status,
        statusText: 'Server Error',
        latencyMs: 0,
        success: false,
        timestamp: new Date().toISOString(),
        error: errorMsg,
      }).catch(() => {});
    }
    throw new Error(errorMsg);
  }

  const data = (await response.json()) as WebhookTestResult;

  if (meta?.userId) {
    const logId = `deliv_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    recordWebhookLog({
      id: logId,
      webhookId: meta.webhookId || 'custom_test',
      userId: meta.userId,
      url: urlValidation.url,
      event: eventType || 'test.ping',
      isTest: true,
      statusCode: data.statusCode,
      statusText: data.statusText,
      latencyMs: data.latencyMs,
      success: data.success,
      timestamp: data.timestamp || new Date().toISOString(),
      requestPayloadPreview: data.requestPayloadPreview,
      responseBodyPreview: data.responsePreview,
      error: !data.success ? data.statusText : null,
    }).catch(() => {});
  }

  return data;
}

/**
 * Dispatch real-time notification to registered user webhooks on link click
 */
export async function dispatchClickWebhook(
  shortUrl: ShortUrl,
  telemetry: ClickLog
): Promise<void> {
  if (!shortUrl.ownerId) {
    return;
  }

  try {
    const response = await fetch('/api/webhooks/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: shortUrl.ownerId,
        event: 'link.clicked',
        link: {
          shortCode: shortUrl.shortCode,
          originalUrl: shortUrl.originalUrl,
          title: shortUrl.title || '',
          clicks: shortUrl.clicks,
          uniqueClicks: shortUrl.uniqueClicks,
        },
        telemetry: {
          id: telemetry.id,
          timestamp: telemetry.timestamp,
          destination: telemetry.destination,
          country: telemetry.country,
          countryCode: telemetry.countryCode,
          region: telemetry.region,
          city: telemetry.city,
          timeZone: telemetry.timeZone,
          locationPrecision: telemetry.locationPrecision,
          latitude: telemetry.latitude,
          longitude: telemetry.longitude,
          browser: telemetry.browser,
          deviceType: telemetry.deviceType,
          os: telemetry.os,
          referer: telemetry.referer,
          utmSource: telemetry.utmSource,
          utmMedium: telemetry.utmMedium,
          utmCampaign: telemetry.utmCampaign,
          utmContent: telemetry.utmContent,
          utmTerm: telemetry.utmTerm,
          utmId: telemetry.utmId,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.results)) {
        for (const res of data.results) {
          if (res && res.webhookId) {
            const logId = `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const log: WebhookDeliveryLog = {
              id: logId,
              webhookId: res.webhookId,
              userId: shortUrl.ownerId,
              url: res.url || '',
              event: 'link.clicked',
              isTest: false,
              statusCode: res.statusCode || (res.success ? 200 : 502),
              statusText: res.statusText || (res.success ? 'OK' : res.error || 'Failed'),
              latencyMs: res.latencyMs || 0,
              success: Boolean(res.success),
              timestamp: new Date().toISOString(),
              requestPayloadPreview: res.requestPayloadPreview,
              responseBodyPreview: res.responsePreview,
              error: res.error || null,
            };
            recordWebhookLog(log).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn('Webhook dispatch network error (non-fatal):', err);
  }
}
