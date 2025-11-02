// src/services/analytics.js
// Google Analytics 4 integration

// Replace with your actual Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.VITE_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID';

// Initialize Google Analytics
export const initGA = () => {
  // Check if gtag is available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (path, title) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title,
    });
  }
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: parameters.category || 'engagement',
      event_label: parameters.label,
      value: parameters.value,
      ...parameters
    });
  }
};

// Track user registration
export const trackRegistration = (competitionId, registrationType, userType) => {
  trackEvent('registration_completed', {
    category: 'user_engagement',
    label: `${registrationType}_${userType}`,
    competition_id: competitionId,
    registration_type: registrationType,
    user_type: userType
  });
};

// Track payment events
export const trackPayment = (orderId, amount, currency, competitionId) => {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: amount,
    currency: currency,
    items: [{
      item_id: competitionId,
      item_name: 'Competition Registration',
      category: 'registration',
      quantity: 1,
      price: amount
    }]
  });
};

// Track payment initiation
export const trackPaymentInitiated = (orderId, amount, currency, competitionId) => {
  trackEvent('begin_checkout', {
    currency: currency,
    value: amount,
    items: [{
      item_id: competitionId,
      item_name: 'Competition Registration',
      category: 'registration',
      quantity: 1,
      price: amount
    }]
  });
};

// Track team invitation events
export const trackTeamInvitation = (action, competitionId) => {
  trackEvent('team_invitation', {
    category: 'team_management',
    label: action, // 'sent', 'accepted', 'rejected'
    competition_id: competitionId
  });
};

// Track competition views
export const trackCompetitionView = (competitionId, competitionTitle) => {
  trackEvent('view_item', {
    currency: 'INR',
    value: 0,
    items: [{
      item_id: competitionId,
      item_name: competitionTitle,
      category: 'competition',
      quantity: 1
    }]
  });
};

// Track user login
export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method
  });
};

// Track user signup
export const trackSignup = (method = 'email') => {
  trackEvent('sign_up', {
    method: method
  });
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackRegistration,
  trackPayment,
  trackPaymentInitiated,
  trackTeamInvitation,
  trackCompetitionView,
  trackLogin,
  trackSignup
};