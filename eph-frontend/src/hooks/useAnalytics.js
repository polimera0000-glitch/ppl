// src/hooks/useAnalytics.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/analytics';

// Hook to track page views automatically
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);
};

export default usePageTracking;