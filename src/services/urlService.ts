import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { ShortUrl, ShortenUrlPayload, ClickLog } from '../types';
import { getClientMetadata } from '../utils/analytics';

const GUEST_STORAGE_KEY = 'myshort_guest_links';
const LOCAL_CLICKS_KEY = 'myshort_local_clicks';

/**
 * Validates and normalizes long destination URL
 */
export function normalizeAndValidateUrl(inputUrl: string): { valid: boolean; url: string; error?: string } {
  let trimmed = inputUrl.trim();
  if (!trimmed) {
    return { valid: false, url: '', error: 'Please enter a URL to shorten' };
  }

  // Auto-prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, url: '', error: 'URL must use http or https protocol' };
    }
    // Prevent self-referencing loops
    const currentHost = window.location.host;
    if (parsed.host === currentHost && !parsed.pathname.startsWith('/')) {
      return { valid: false, url: '', error: 'Cannot create short link to another internal short link' };
    }
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, url: '', error: 'Please enter a valid web URL (e.g. https://example.com)' };
  }
}

/**
 * Generate high-entropy alphanumeric shortcode
 */
function generateRandomCode(length = 6): string {
  const chars = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Create a new shortened URL
 */
export async function createShortUrl(
  payload: ShortenUrlPayload,
  userId?: string | null
): Promise<ShortUrl> {
  const validation = normalizeAndValidateUrl(payload.originalUrl);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid URL');
  }

  let code = '';
  const isCustom = Boolean(payload.customAlias && payload.customAlias.trim());

  if (isCustom) {
    const cleanedAlias = payload.customAlias!.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(cleanedAlias)) {
      throw new Error('Custom alias must be 3-32 characters long and only contain letters, numbers, hyphens, and underscores');
    }

    // Reserved routes check
    const reservedRoutes = ['api', 'auth', 'login', 'signup', 'dashboard', 'settings', 'admin', 'about', 'privacy', 'terms'];
    if (reservedRoutes.includes(cleanedAlias)) {
      throw new Error(`The alias "${cleanedAlias}" is a reserved system keyword. Please choose another.`);
    }

    // Check availability
    try {
      const existingSnap = await getDoc(doc(db, 'urls', cleanedAlias));
      if (existingSnap.exists()) {
        throw new Error(`The alias "${cleanedAlias}" is already taken. Please try another one.`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already taken')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.GET, `urls/${cleanedAlias}`);
    }
    code = cleanedAlias;
  } else {
    // Generate code and check collision
    let attempts = 0;
    while (attempts < 5) {
      const testCode = generateRandomCode(6);
      try {
        const snap = await getDoc(doc(db, 'urls', testCode));
        if (!snap.exists()) {
          code = testCode;
          break;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `urls/${testCode}`);
      }
      attempts++;
    }
    if (!code) {
      code = generateRandomCode(8);
    }
  }

  let expiresAt: string | null = null;
  if (!userId) {
    // Guest Mode: strictly enforce 48 hours (2 days) lifetime
    const guestExpiry = new Date();
    guestExpiry.setHours(guestExpiry.getHours() + 48);
    expiresAt = guestExpiry.toISOString();
  } else if (payload.expireDays && payload.expireDays > 0) {
    // Authenticated members can set custom expiration periods
    const d = new Date();
    d.setDate(d.getDate() + payload.expireDays);
    expiresAt = d.toISOString();
  } else {
    // Authenticated members default to permanent links
    expiresAt = null;
  }

  const newRecord: ShortUrl = {
    id: code,
    shortCode: code,
    originalUrl: validation.url,
    ownerId: userId ? userId : '',
    title: payload.title?.trim() || validation.url.replace(/^https?:\/\//i, '').slice(0, 50),
    createdAt: new Date().toISOString(),
    expiresAt,
    status: 'active',
    clicks: 0,
    lastAccessedAt: null,
    isCustomAlias: isCustom,
    password: payload.password?.trim() || null,
    utmCampaign: payload.utmCampaign?.trim() || null,
    domain: payload.domain?.trim() || null,
  };

  try {
    await setDoc(doc(db, 'urls', code), newRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `urls/${code}`);
  }

  // If user is guest, save reference to local cache for seamless upgrade claiming
  if (!userId) {
    saveGuestUrl(newRecord);
  }

  return newRecord;
}

export type ResolveResult =
  | { type: 'success'; destinationUrl: string }
  | { type: 'password_required'; shortCode: string; title?: string }
  | { type: 'invalid_password'; shortCode: string; message: string }
  | { type: 'not_found'; shortCode: string }
  | { type: 'expired'; shortCode: string; message?: string }
  | { type: 'disabled'; shortCode: string }
  | { type: 'error'; message: string };

/**
 * Record click metadata in subcollection and update counter asynchronously
 */
export async function recordClickTelemetry(shortCode: string, metadata?: ClickLog): Promise<void> {
  const telemetry = metadata || getClientMetadata(shortCode);

  // 1. Try writing to Firestore subcollection
  try {
    const clickRef = doc(db, 'urls', shortCode, 'clicks', telemetry.id);
    await setDoc(clickRef, telemetry);
  } catch (err) {
    console.warn('Could not record telemetry in Firestore subcollection:', err);
  }

  // 2. Cache in local storage for instant offline analytics
  try {
    const raw = localStorage.getItem(LOCAL_CLICKS_KEY);
    const existing: ClickLog[] = raw ? JSON.parse(raw) : [];
    const updated = [telemetry, ...existing].slice(0, 500);
    localStorage.setItem(LOCAL_CLICKS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Resolve short URL, check validity, expiry, password protection, and record click metadata
 */
export async function resolveShortUrl(
  shortCode: string,
  providedPassword?: string
): Promise<ResolveResult> {
  const cleanCode = shortCode.trim();
  if (!cleanCode) {
    return { type: 'not_found', shortCode };
  }

  try {
    const docRef = doc(db, 'urls', cleanCode);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { type: 'not_found', shortCode: cleanCode };
    }

    const data = snap.data() as ShortUrl;

    if (data.status === 'disabled') {
      return { type: 'disabled', shortCode: cleanCode };
    }

    // Check expiration (such as 48-hour guest limit)
    if (data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      return {
        type: 'expired',
        shortCode: cleanCode,
        message: !data.ownerId
          ? 'This guest link was active for 48 hours and has now expired. Create an account to generate permanent links.'
          : 'This link has expired based on the expiration date set by its creator.'
      };
    }

    // Check password protection
    if (data.password && data.password.trim().length > 0) {
      if (!providedPassword) {
        return {
          type: 'password_required',
          shortCode: cleanCode,
          title: data.title || 'Protected Link',
        };
      }
      if (providedPassword.trim() !== data.password.trim()) {
        return {
          type: 'invalid_password',
          shortCode: cleanCode,
          message: 'Incorrect password. Please try again.',
        };
      }
    }

    // Track metadata (browser, device type, OS, etc.) and increment clicks asynchronously
    const metadata = getClientMetadata(cleanCode);

    updateDoc(docRef, {
      clicks: (data.clicks || 0) + 1,
      lastAccessedAt: new Date().toISOString(),
    }).catch((updateErr) => {
      console.warn('Failed to record click metric asynchronously:', updateErr);
    });

    recordClickTelemetry(cleanCode, metadata).catch((recErr) => {
      console.warn('Telemetry recording background error:', recErr);
    });

    return { type: 'success', destinationUrl: data.originalUrl };
  } catch (err: any) {
    console.error('Error resolving short URL:', err);
    return { type: 'error', message: 'Unable to connect to service. Please try again later.' };
  }
}

/**
 * Fetch click telemetry logs for a specific shortCode
 */
export async function getUrlClickLogs(shortCode: string): Promise<ClickLog[]> {
  const cleanCode = shortCode.trim();
  const remoteLogs: ClickLog[] = [];

  try {
    const clicksCol = collection(db, 'urls', cleanCode, 'clicks');
    const snap = await getDocs(clicksCol);
    snap.forEach((d) => {
      remoteLogs.push(d.data() as ClickLog);
    });
  } catch (err) {
    console.warn('Could not fetch remote clicks subcollection:', err);
  }

  // Merge with local storage clicks for high responsiveness
  try {
    const raw = localStorage.getItem(LOCAL_CLICKS_KEY);
    const local: ClickLog[] = raw ? JSON.parse(raw) : [];
    const matchingLocal = local.filter((c) => c.shortCode === cleanCode);

    const mergedMap = new Map<string, ClickLog>();
    remoteLogs.forEach((c) => mergedMap.set(c.id, c));
    matchingLocal.forEach((c) => mergedMap.set(c.id, c));

    const combined = Array.from(mergedMap.values());
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined;
  } catch {
    remoteLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return remoteLogs;
  }
}

/**
 * Fetch click telemetry logs across multiple links for an authenticated user
 */
export async function getAllUserClickLogs(shortCodes: string[]): Promise<ClickLog[]> {
  if (!shortCodes || shortCodes.length === 0) return [];

  const promises = shortCodes.slice(0, 30).map((code) => getUrlClickLogs(code));
  const results = await Promise.all(promises);
  const flat = results.flat();

  // Deduplicate and sort descending
  const map = new Map<string, ClickLog>();
  flat.forEach((c) => map.set(c.id, c));

  const all = Array.from(map.values());
  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return all;
}

/**
 * Claim an unowned guest URL and make it permanent for an authenticated user
 */
export async function claimGuestUrl(shortCode: string, userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'urls', shortCode);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;

    const data = snap.data() as ShortUrl;
    // Only unowned guest links can be claimed
    if (!data.ownerId || data.ownerId === '') {
      await updateDoc(docRef, {
        ownerId: userId,
        expiresAt: null, // Upgrade to permanent link!
      });
      removeGuestUrl(shortCode);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Failed to claim guest url:', err);
    return false;
  }
}

/**
 * Claim all guest URLs stored in browser session upon signup/signin
 */
export async function claimAllGuestUrls(userId: string): Promise<number> {
  const guestUrls = getGuestUrls();
  if (guestUrls.length === 0) return 0;

  let claimedCount = 0;
  for (const item of guestUrls) {
    const success = await claimGuestUrl(item.shortCode, userId);
    if (success) claimedCount++;
  }
  // Clear local guest cache once migrated
  localStorage.removeItem(GUEST_STORAGE_KEY);
  return claimedCount;
}

/**
 * Fetch all links for an authenticated user
 */
export async function getUserUrls(userId: string): Promise<ShortUrl[]> {
  try {
    const q = query(
      collection(db, 'urls'),
      where('ownerId', '==', userId)
    );
    const snap = await getDocs(q);
    const list: ShortUrl[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ShortUrl);
    });

    // Client-side sort descending by creation date
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'urls');
    return [];
  }
}

/**
 * Delete a user's shortened link
 */
export async function deleteShortUrl(shortCode: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'urls', shortCode));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `urls/${shortCode}`);
  }
}

/**
 * Toggle active/disabled status of a user's link
 */
export async function toggleUrlStatus(shortCode: string, currentStatus: 'active' | 'disabled'): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
  try {
    await updateDoc(doc(db, 'urls', shortCode), {
      status: newStatus,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `urls/${shortCode}`);
  }
}

/**
 * Extend or make permanent an existing shortened link
 */
export async function extendShortUrl(shortCode: string, newExpiresAt: string | null): Promise<void> {
  try {
    await updateDoc(doc(db, 'urls', shortCode), {
      expiresAt: newExpiresAt,
      status: 'active',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `urls/${shortCode}`);
  }
}

/**
 * Fetch custom-alias links belonging to an authenticated user that are expiring within 24 hours (or recently expired)
 */
export async function getExpiringCustomAliasUrls(userId: string): Promise<ShortUrl[]> {
  try {
    const userLinks = await getUserUrls(userId);
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    return userLinks.filter((link) => {
      // Must be a custom alias
      if (!link.isCustomAlias) return false;
      // Must have an active expiration set
      if (!link.expiresAt) return false;

      const expiryTime = new Date(link.expiresAt).getTime();
      const diff = expiryTime - now;

      // Alert if expiring within 24 hours (diff > 0 && diff <= 24 hours)
      // or if expired in the last 24 hours (diff <= 0 && diff >= -twentyFourHoursMs) so user can save it
      return diff <= twentyFourHoursMs && diff >= -twentyFourHoursMs;
    });
  } catch (err) {
    console.warn('Failed to check expiring custom alias links:', err);
    return [];
  }
}

/**
 * Guest link management in local storage
 */
export function getGuestUrls(): ShortUrl[] {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestUrl(urlRecord: ShortUrl): void {
  try {
    const existing = getGuestUrls();
    const updated = [urlRecord, ...existing.filter((u) => u.id !== urlRecord.id)].slice(0, 20);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save guest link to local storage:', err);
  }
}

export function removeGuestUrl(shortCode: string): void {
  try {
    const existing = getGuestUrls();
    const updated = existing.filter((u) => u.shortCode !== shortCode);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete guest link from local storage:', err);
  }
}