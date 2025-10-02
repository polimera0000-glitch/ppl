// src/context/AuthProvider.jsx
import React, { useReducer, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        mustChangePassword: action.payload.mustChangePassword || false,
        loading: false,
      };
    case 'SET_MUST_CHANGE_PASSWORD':
      return { ...state, mustChangePassword: action.payload };
    case 'CLEAR_AUTH':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        mustChangePassword: false,
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    mustChangePassword: false,
    loading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = authService.getToken();
      const user = authService.getUser();

      if (token && user) {
        const mustChange = user.force_password_change === true;
        dispatch({ 
          type: 'SET_AUTH', 
          payload: { user, token, mustChangePassword: mustChange } 
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials) => {
  try {
    const response = await apiService.login(credentials);
    if (response.success) {
      const { user, token, mustChangePassword } = response.data;
      authService.saveToken(token);
      authService.saveUser(user);
      
      // Only force password change if explicitly required (for admins with default passwords)
      const shouldChange = mustChangePassword === true || user.force_password_change === true;
      
      dispatch({ 
        type: 'SET_AUTH', 
        payload: { user, token, mustChangePassword: shouldChange } 
      });
      
      return { success: true, mustChangePassword: shouldChange };
    }
    return response;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

 const register = async (userData) => {
  try {
    const response = await apiService.register(userData);
    if (response.success) {
      const { user, token } = response.data;
      authService.saveToken(token);
      authService.saveUser(user);
      // ✅ Explicitly set mustChangePassword to false for regular registration
      dispatch({ 
        type: 'SET_AUTH', 
        payload: { 
          user, 
          token, 
          mustChangePassword: false  // Regular users never need forced password change
        } 
      });
    }
    return response;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      authService.clearToken();
      dispatch({ type: 'CLEAR_AUTH' });
    }
  };

  const clearMustChangePassword = () => {
    dispatch({ type: 'SET_MUST_CHANGE_PASSWORD', payload: false });
    
    // Update stored user
    const user = authService.getUser();
    if (user) {
      user.force_password_change = false;
      authService.saveUser(user);
    }
  };

  const value = { 
    ...state, 
    login, 
    register, 
    logout, 
    clearMustChangePassword 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};