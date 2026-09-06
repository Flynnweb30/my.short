import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { urlService } from '../services/urlService';
import { analyticsService } from '../utils/analytics';
import { UrlModel } from '../types';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [urls, setUrls] = useState<UrlModel[]>([]);
  const [stats, setStats] = useState({ totalClicks: 0, totalUniqueVisitors: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          const userUrls = await urlService.getUserUrls(currentUser.uid);
          setUrls(userUrls);

          const globalStats = await analyticsService.getUserTotalAnalytics(currentUser.uid, userUrls);
          setStats(globalStats);
        } catch (error) {
          console.error("Failed to load telemetry stats:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-gray-500 font-medium">
      Loading dashboard...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      </div>
      
      {/* Telemetry Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium text-sm mb-2 uppercase tracking-wide">Total Links</h3>
          <p className="text-4xl font-bold text-gray-800">{urls.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium text-sm mb-2 uppercase tracking-wide">Total Clicks</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.totalClicks}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium text-sm mb-2 uppercase tracking-wide">Unique Visitors</h3>
          <p className="text-4xl font-bold text-green-600">{stats.totalUniqueVisitors}</p>
        </div>
      </div>

      {/* Synchronized URL Data Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium text-sm">Short Link</th>
                <th className="p-4 font-medium text-sm">Original Destination</th>
                <th className="p-4 font-medium text-sm text-right">Clicks</th>
                <th className="p-4 font-medium text-sm text-right">Unique Visitors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {urls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No active shortlinks currently.</td>
                </tr>
              ) : (
                urls.map((url) => (
                  <tr key={url.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <a 
                        href={`/${url.shortId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 font-medium hover:text-blue-600 hover:underline"
                      >
                        /{url.shortId}
                      </a>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="truncate max-w-xs xl:max-w-md" title={url.originalUrl}>
                        {url.originalUrl}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-700 text-right">{url.clicks || 0}</td>
                    <td className="p-4 font-semibold text-green-600 text-right">{url.uniqueVisitors || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;