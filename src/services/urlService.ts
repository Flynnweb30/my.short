import { db } from '../lib/firebase';
import { 
  collection, doc, getDocs, query, where, updateDoc, 
  increment, addDoc, serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { UrlModel, ClickAnalytics } from '../types';

export const urlService = {
  // Fetch URL document by short code
  async getUrlByShortId(shortId: string): Promise<UrlModel | null> {
    const q = query(collection(db, 'urls'), where('shortId', '==', shortId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as UrlModel;
  },

  // Record Telemetry: Clicks and Unique Visitors
  async recordClick(urlId: string, clickData: Partial<ClickAnalytics>): Promise<void> {
    const urlRef = doc(db, 'urls', urlId);
    const clicksRef = collection(db, 'clicks');

    const isUnique = clickData.isUnique ?? false;

    // Build the atomic update payload
    const updateData: any = {
      clicks: increment(1)
    };
    
    if (isUnique) {
      updateData.uniqueVisitors = increment(1);
    }

    try {
      // 1. Add analytics event telemetry
      await addDoc(clicksRef, {
        urlId,
        timestamp: serverTimestamp(),
        userAgent: clickData.userAgent || navigator.userAgent,
        referrer: clickData.referrer || document.referrer || 'Direct',
        isUnique,
        ...clickData
      });

      // 2. Update parent URL document atomically
      await updateDoc(urlRef, updateData);
    } catch (error) {
      console.error("Error synchronizing telemetry data:", error);
    }
  },

  // Retrieve user's generated URLs
  async getUserUrls(userId: string): Promise<UrlModel[]> {
     const q = query(collection(db, 'urls'), where('userId', '==', userId));
     const snapshot = await getDocs(q);
     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UrlModel));
  },

  // Create a new URL entry
  async createUrl(urlData: Partial<UrlModel>): Promise<string> {
     const docRef = await addDoc(collection(db, 'urls'), {
         ...urlData,
         clicks: 0,
         uniqueVisitors: 0,
         createdAt: serverTimestamp()
     });
     return docRef.id;
  },

  // Delete a URL
  async deleteUrl(urlId: string): Promise<void> {
     await deleteDoc(doc(db, 'urls', urlId));
  }
};