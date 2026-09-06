import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { CustomDomainRecord } from '../types';

const LOCAL_DOMAINS_KEY = 'myshort_custom_domains_v2';
const ACTIVE_DOMAIN_KEY = 'myshort_custom_domain';

export const DEFAULT_CNAME_TARGET = 'cname.myshort.com';
export const DEFAULT_APEX_IP = '76.76.21.21';

/**
 * Normalizes and validates custom domain string
 */
export function normalizeDomain(rawInput: string): { valid: boolean; domain: string; error?: string } {
  let cleaned = rawInput.trim().toLowerCase();
  
  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  // Remove trailing path, slash, or query
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  // Remove port if present
  cleaned = cleaned.split(':')[0];

  if (!cleaned) {
    return { valid: false, domain: '', error: 'Please enter a domain name (e.g., link.yourbrand.com)' };
  }

  // Domain syntax validation
  const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  if (!domainRegex.test(cleaned)) {
    return {
      valid: false,
      domain: cleaned,
      error: 'Invalid domain format. Example: "go.mybrand.com" or "short.io"',
    };
  }

  // Disallow local or reserved test domains
  if (cleaned.endsWith('.local') || cleaned === 'localhost' || cleaned === 'my.short') {
    return { valid: false, domain: cleaned, error: 'Cannot use reserved or local domain name' };
  }

  return { valid: true, domain: cleaned };
}

/**
 * Generate a random unique verification token
 */
function generateVerificationToken(): string {
  const chars = '0123456789abcdef';
  let token = 'myshort-verify-';
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

/**
 * Fetch all custom domains configured by the user
 */
export async function getUserDomains(userId: string): Promise<CustomDomainRecord[]> {
  const remoteDomains: CustomDomainRecord[] = [];

  try {
    const domainsCol = collection(db, 'users', userId, 'domains');
    const snap = await getDocs(domainsCol);
    snap.forEach((d) => {
      remoteDomains.push(d.data() as CustomDomainRecord);
    });
  } catch (err) {
    console.warn('Could not fetch custom domains from Firestore, checking local cache:', err);
  }

  // Local storage synchronization
  try {
    const raw = localStorage.getItem(`${LOCAL_DOMAINS_KEY}_${userId}`);
    const local: CustomDomainRecord[] = raw ? JSON.parse(raw) : [];

    const map = new Map<string, CustomDomainRecord>();
    remoteDomains.forEach((d) => map.set(d.id, d));
    local.forEach((d) => {
      if (!map.has(d.id)) {
        map.set(d.id, d);
      }
    });

    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  } catch {
    return remoteDomains;
  }
}

/**
 * Add a new custom domain for an authenticated user
 */
export async function addCustomDomain(
  userId: string,
  rawDomain: string
): Promise<CustomDomainRecord> {
  const normalized = normalizeDomain(rawDomain);
  if (!normalized.valid) {
    throw new Error(normalized.error || 'Invalid domain format');
  }

  const domain = normalized.domain;
  // Domain document ID (safe slug)
  const domainId = domain.replace(/\./g, '_');

  // Check if already registered in user's list
  const existingDomains = await getUserDomains(userId);
  if (existingDomains.some((d) => d.domain === domain)) {
    throw new Error(`Domain "${domain}" is already added to your account.`);
  }

  const isFirstDomain = existingDomains.length === 0;

  const newRecord: CustomDomainRecord = {
    id: domainId,
    userId,
    domain,
    status: 'pending',
    verificationToken: generateVerificationToken(),
    cnameTarget: DEFAULT_CNAME_TARGET,
    createdAt: new Date().toISOString(),
    verifiedAt: null,
    isPrimary: isFirstDomain,
    sslStatus: 'pending',
  };

  // 1. Save to Firestore
  try {
    const docRef = doc(db, 'users', userId, 'domains', domainId);
    await setDoc(docRef, newRecord);

    if (isFirstDomain) {
      // Sync primary to user profile document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { customDomain: domain }).catch(() => {});
      localStorage.setItem(ACTIVE_DOMAIN_KEY, domain);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/domains/${domainId}`);
  }

  // 2. Sync to local storage
  try {
    const raw = localStorage.getItem(`${LOCAL_DOMAINS_KEY}_${userId}`);
    const list: CustomDomainRecord[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      `${LOCAL_DOMAINS_KEY}_${userId}`,
      JSON.stringify([newRecord, ...list])
    );
  } catch {
    // ignore
  }

  return newRecord;
}

/**
 * Check DNS records for a domain using Google Public DNS API with simulated testing option
 */
export async function verifyCustomDomain(
  userId: string,
  domainId: string,
  options?: { simulateSuccess?: boolean }
): Promise<{ success: boolean; message: string; record: CustomDomainRecord }> {
  // Fetch current domain
  const domains = await getUserDomains(userId);
  const target = domains.find((d) => d.id === domainId);
  if (!target) {
    throw new Error('Custom domain not found');
  }

  let dnsResolved = false;
  let verificationDetails = '';

  if (options?.simulateSuccess) {
    dnsResolved = true;
    verificationDetails = 'Simulated DNS check passed (Sandbox Mode).';
  } else {
    // Attempt actual DNS lookup via Google DNS REST API over HTTPS
    try {
      // 1. Check CNAME record
      const cnameResponse = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(target.domain)}&type=CNAME`
      );
      const cnameData = await cnameResponse.json();

      if (cnameData.Answer && cnameData.Answer.length > 0) {
        const answers = cnameData.Answer.map((a: any) => String(a.data).toLowerCase());
        const matchesCname = answers.some((ans: string) =>
          ans.includes('myshort') || ans.includes('cname') || ans.includes('render')
        );
        if (matchesCname) {
          dnsResolved = true;
          verificationDetails = `CNAME successfully resolved pointing to ${answers[0]}`;
        }
      }

      // 2. Check TXT Challenge Record if CNAME not resolved
      if (!dnsResolved) {
        const txtHost = `_myshort-challenge.${target.domain}`;
        const txtResponse = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(txtHost)}&type=TXT`
        );
        const txtData = await txtResponse.json();
        if (txtData.Answer && txtData.Answer.length > 0) {
          const txtAnswers = txtData.Answer.map((a: any) => String(a.data).replace(/"/g, ''));
          if (txtAnswers.some((ans: string) => ans.includes(target.verificationToken))) {
            dnsResolved = true;
            verificationDetails = `TXT challenge record confirmed for ${txtHost}`;
          }
        }
      }

      // 3. Check A Record
      if (!dnsResolved) {
        const aResponse = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(target.domain)}&type=A`
        );
        const aData = await aResponse.json();
        if (aData.Answer && aData.Answer.length > 0) {
          dnsResolved = true;
          verificationDetails = `A record resolved pointing to ${aData.Answer[0]?.data}`;
        }
      }
    } catch (fetchErr) {
      console.warn('Real DNS query failed or blocked by CORS:', fetchErr);
    }
  }

  // If still not resolved in production and not simulated, return pending/failed status
  if (!dnsResolved && !options?.simulateSuccess) {
    const updatedRecord: CustomDomainRecord = {
      ...target,
      status: 'failed',
    };
    await updateDomainRecord(userId, updatedRecord);
    return {
      success: false,
      message:
        'DNS records could not be verified yet. DNS propagation can take between 5 to 60 minutes. Please ensure your CNAME or TXT record is correctly saved with your registrar.',
      record: updatedRecord,
    };
  }

  // Verified successfully!
  const updatedRecord: CustomDomainRecord = {
    ...target,
    status: 'verified',
    sslStatus: 'active',
    verifiedAt: new Date().toISOString(),
  };

  await updateDomainRecord(userId, updatedRecord);

  // If primary or no primary yet, set active
  if (updatedRecord.isPrimary) {
    localStorage.setItem(ACTIVE_DOMAIN_KEY, updatedRecord.domain);
  }

  return {
    success: true,
    message: verificationDetails || `Domain "${target.domain}" has been verified and SSL certificate is active!`,
    record: updatedRecord,
  };
}

/**
 * Set a custom domain as the primary domain
 */
export async function setPrimaryDomain(
  userId: string,
  domainId: string
): Promise<CustomDomainRecord[]> {
  const domains = await getUserDomains(userId);
  const target = domains.find((d) => d.id === domainId);
  if (!target) {
    throw new Error('Domain not found');
  }

  const updatedList: CustomDomainRecord[] = [];

  for (const d of domains) {
    const isThisPrimary = d.id === domainId;
    const updated: CustomDomainRecord = {
      ...d,
      isPrimary: isThisPrimary,
    };
    updatedList.push(updated);
    await updateDomainRecord(userId, updated);
  }

  // Update profile and local storage
  localStorage.setItem(ACTIVE_DOMAIN_KEY, target.domain);

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { customDomain: target.domain });
  } catch (err) {
    console.warn('Could not update userProfile primary domain:', err);
  }

  return updatedList;
}

/**
 * Delete a custom domain from account
 */
export async function deleteCustomDomain(userId: string, domainId: string): Promise<void> {
  // 1. Delete in Firestore
  try {
    const docRef = doc(db, 'users', userId, 'domains', domainId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}/domains/${domainId}`);
  }

  // 2. Delete in localStorage
  try {
    const raw = localStorage.getItem(`${LOCAL_DOMAINS_KEY}_${userId}`);
    const list: CustomDomainRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((d) => d.id !== domainId);
    localStorage.setItem(`${LOCAL_DOMAINS_KEY}_${userId}`, JSON.stringify(filtered));

    // If deleted domain was primary, reset or pick next
    const currentActive = localStorage.getItem(ACTIVE_DOMAIN_KEY);
    const domainDeleted = list.find((d) => d.id === domainId);
    if (domainDeleted && domainDeleted.domain === currentActive) {
      if (filtered.length > 0) {
        localStorage.setItem(ACTIVE_DOMAIN_KEY, filtered[0].domain);
      } else {
        localStorage.setItem(ACTIVE_DOMAIN_KEY, 'my.short');
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Get active domain name for the current user
 */
export function getActiveDomainName(userProfileCustomDomain?: string): string {
  if (userProfileCustomDomain && userProfileCustomDomain.trim()) {
    return userProfileCustomDomain.trim();
  }
  const cached = localStorage.getItem(ACTIVE_DOMAIN_KEY);
  if (cached && cached.trim()) {
    return cached.trim();
  }
  return 'my.short';
}

/**
 * Internal helper to update domain doc
 */
async function updateDomainRecord(
  userId: string,
  record: CustomDomainRecord
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'domains', record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/domains/${record.id}`);
  }

  try {
    const raw = localStorage.getItem(`${LOCAL_DOMAINS_KEY}_${userId}`);
    const list: CustomDomainRecord[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((d) => d.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(`${LOCAL_DOMAINS_KEY}_${userId}`, JSON.stringify(list));
  } catch {
    // ignore
  }
}