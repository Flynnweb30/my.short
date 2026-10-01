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
import { ApiToken } from '../types';

/**
 * Generate high-entropy personal API token (e.g. myshort_live_...)
 */
export function generateApiTokenString(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  const arr = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < 32; i++) {
      rand += chars[arr[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 32; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `myshort_live_${rand}`;
}

/**
 * Fetch all API tokens for an authenticated user
 */
export async function getUserApiTokens(userId: string): Promise<ApiToken[]> {
  try {
    const colRef = collection(db, 'users', userId, 'apiKeys');
    const snap = await getDocs(colRef);
    const tokens: ApiToken[] = [];
    snap.forEach((d) => {
      tokens.push(d.data() as ApiToken);
    });
    tokens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return tokens;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${userId}/apiKeys`);
    return [];
  }
}

/**
 * Create a new API token for the user
 */
export async function createApiToken(userId: string, name: string): Promise<ApiToken> {
  const trimmedName = name.trim() || 'Default API Token';
  const tokenString = generateApiTokenString();
  const tokenId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newRecord: ApiToken = {
    id: tokenId,
    userId,
    token: tokenString,
    name: trimmedName,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };

  try {
    await setDoc(doc(db, 'users', userId, 'apiKeys', tokenId), newRecord);
    return newRecord;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/apiKeys/${tokenId}`);
    throw err;
  }
}

/**
 * Delete / revoke an API token
 */
export async function deleteApiToken(userId: string, tokenId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'apiKeys', tokenId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}/apiKeys/${tokenId}`);
    throw err;
  }
}

/**
 * Update token last used timestamp
 */
export async function markTokenUsed(userId: string, tokenId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId, 'apiKeys', tokenId), {
      lastUsedAt: new Date().toISOString(),
    });
  } catch {
    // Non-blocking
  }
}
