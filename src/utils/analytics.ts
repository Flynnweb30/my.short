import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClickAnalytics, UrlModel } from '../types';

export const analyticsService = {
  // Fetch raw analytics array for charts
  async getUrlAnalytics(urlId: string): Promise<ClickAnalytics[]> {
    const q = query(collection(db, 'clicks'), where('urlId', '==', urlId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClickAnalytics));
  },

  // Safely reduce aggregate totals for Top Level Dashboard displays
  async getUserTotalAnalytics(userId: string, urls: UrlModel[]) {
     let totalClicks = 0;
     let totalUniqueVisitors = 0;

     urls.forEach(url => {
         totalClicks += url.clicks || 0;
         totalUniqueVisitors += url.uniqueVisitors || 0;
     });

     return { totalClicks, totalUniqueVisitors };
  },

  // Grouping method designed for rendering synchronized click/unique charts
  groupClicksByDate(clicks: ClickAnalytics[]) {
    const data: Record<string, { clicks: number, unique: number }> = {};
    
    clicks.forEach(click => {
       const dateObj = click.timestamp && (click.timestamp as any).toDate 
            ? (click.timestamp as any).toDate() 
            : new Date(click.timestamp);
            
       if (isNaN(dateObj.getTime())) return;

       const dateStr = dateObj.toISOString().split('T')[0];
       
       if (!data[dateStr]) {
           data[dateStr] = { clicks: 0, unique: 0 };
       }
       
       data[dateStr].clicks += 1;
       
       if (click.isUnique) {
           data[dateStr].unique += 1;
       }
    });

    return Object.keys(data).sort().map(date => ({
        date,
        clicks: data[date].clicks,
        uniqueVisitors: data[date].unique
    }));
  }
};