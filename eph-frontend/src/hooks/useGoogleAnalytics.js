import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

export default function useGoogleAnalytics() {
  const location = useLocation();
  const GA_ID = import.meta.env.VITE_GA_ID || process.env.REACT_APP_GA_ID;

  // Initialize GA once
  useEffect(() => {
    if (!GA_ID) {
      console.warn("Google Analytics ID is missing");
      return;
    }
    ReactGA.initialize(GA_ID);
  }, [GA_ID]);

  // Track page changes
  useEffect(() => {
    if (!GA_ID) return;

    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
    });
  }, [location, GA_ID]);
}
