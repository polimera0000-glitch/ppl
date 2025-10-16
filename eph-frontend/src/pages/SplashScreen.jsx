// src/pages/SplashScreen.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, mustChangePassword } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        if (isAuthenticated) {
          // Check if password change is required
          if (mustChangePassword) {
            navigate('/change-password', { replace: true });
          } else {
            // ✅ Role-based redirect
            const user = authService.getUser();
            const isAdminRole = (user?.role || '').toLowerCase() === 'admin';
            const destination = isAdminRole ? '/admin' : '/main';
            navigate(destination, { replace: true });
          }
        } else {
          // Non-authenticated users go to landing page
          navigate('/', { replace: true });
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, mustChangePassword, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">P</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-primary-text mb-2">PPL Platform</h1>
        <p className="text-secondary-text text-lg mb-8">Student Projects League</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-secondary-text">Loading...</span>
        </div>
        <p className="text-secondary-text text-sm mt-12">
          Where Student Projects Meet Real Investors
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
