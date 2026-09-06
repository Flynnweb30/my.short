import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { urlService } from '../services/urlService';

const RedirectHandler: React.FC = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortId) return;

      try {
        const urlData = await urlService.getUrlByShortId(shortId);
        
        if (urlData) {
          // TELEMETRY FIX: Determine if Unique Visitor
          const visitorKey = `telemetry_visitor_${urlData.id}`;
          const hasVisited = localStorage.getItem(visitorKey);
          const isUnique = !hasVisited;

          if (isUnique) {
            localStorage.setItem(visitorKey, 'visited');
          }

          // Push telemetry with accurate uniqueness
          await urlService.recordClick(urlData.id, {
            isUnique,
            referrer: document.referrer || 'Direct',
            userAgent: navigator.userAgent
          });

          // Execute physical redirect
          window.location.replace(urlData.originalUrl);
        } else {
          setError('URL not found or has been disabled.');
        }
      } catch (err) {
        console.error("Telemetry/Redirect execution failed:", err);
        setError('An error occurred while routing your request.');
      }
    };

    handleRedirect();
  }, [shortId]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 font-semibold bg-gray-50">
        {error}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-pulse text-gray-500 font-medium">Redirecting...</div>
    </div>
  );
};

export default RedirectHandler;