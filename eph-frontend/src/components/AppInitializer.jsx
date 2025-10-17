import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import SplashScreen from '../pages/SplashScreen';

const AppInitializer = () => {
  const [showSplash, setShowSplash] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading, mustChangePassword } = useAuth();

  useEffect(() => {
    // Check if this is the very first app load (not from refresh or logout)
    const hasSeenSplash = localStorage.getItem('ppl-has-seen-splash');
    const isFromLogout = sessionStorage.getItem('ppl-from-logout');
    
    if (!hasSeenSplash && !isFromLogout) {
      // Very first app load - show splash screen
      setShowSplash(true);
      
      // Mark that user has seen the splash screen
      localStorage.setItem('ppl-has-seen-splash', 'true');
      
      const timer = setTimeout(() => {
        setShowSplash(false);
        
        if (!loading) {
          if (isAuthenticated) {
            // Check if password change is required
            if (mustChangePassword) {
              navigate('/change-password', { replace: true });
            } else {
              // Role-based redirect
              const user = authService.getUser();
              const isAdminRole = (user?.role || '').toLowerCase() === 'admin';
              const destination = isAdminRole ? '/admin' : '/main';
              navigate(destination, { replace: true });
            }
          } else {
            // Non-authenticated users go to landing page
            navigate('/landing', { replace: true });
          }
        }
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Coming from refresh or logout - skip splash screen
      if (isFromLogout) {
        sessionStorage.removeItem('ppl-from-logout');
      }
      
      if (!loading) {
        if (isAuthenticated) {
          // Check if password change is required
          if (mustChangePassword) {
            navigate('/change-password', { replace: true });
          } else {
            // Role-based redirect
            const user = authService.getUser();
            const isAdminRole = (user?.role || '').toLowerCase() === 'admin';
            const destination = isAdminRole ? '/admin' : '/main';
            navigate(destination, { replace: true });
          }
        } else {
          // Non-authenticated users go to landing page
          navigate('/landing', { replace: true });
        }
      }
    }
  }, [loading, isAuthenticated, mustChangePassword, navigate]);

  if (showSplash) {
    return <SplashScreen />;
  }
  return null;
};

export default AppInitializer;
