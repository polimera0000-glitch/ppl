/* 
This file is temporarily disabled as part of GA removal.
Original implementation is preserved below for reference.

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
*/

// Stubbed export to prevent import errors
export const usePageTracking = () => {};
export default usePageTracking;