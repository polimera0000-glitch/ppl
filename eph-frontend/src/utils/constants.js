export const ROLES = {
  STUDENT: 'student',
  HIRING: 'hiring', 
  INVESTOR: 'investor',
  ADMIN: 'admin'
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.HIRING]: 'Hiring',
  [ROLES.INVESTOR]: 'Investor',
  [ROLES.ADMIN]: 'Admin'
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.STUDENT]: 'Showcase projects & join competitions',
  [ROLES.HIRING]: 'Discover talents & post opportunities',
  [ROLES.INVESTOR]: 'Find startups & promising projects',
  [ROLES.ADMIN]: 'Manage competitions & platform'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  OAUTH: {
    GOOGLE: '/auth/google',
    GITHUB: '/auth/github',
    EXCHANGE: '/auth/oauth/exchange'
  },
  ADMIN: {
    INVITE: '/admin/invite',
    LIST: '/admin/list',
    DEACTIVATE: '/admin/{id}/deactivate'
  }
};