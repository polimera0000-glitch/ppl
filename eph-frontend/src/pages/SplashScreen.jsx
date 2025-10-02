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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-white/10 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-white">E</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2">EPH Platform</h1>
        <p className="text-white/80 text-lg mb-8">Engineering Projects Hub</p>
        
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-white/70">Loading...</span>
        </div>
        
        <p className="text-white/60 text-sm mt-12">
          Empowering Students, Connecting Opportunities
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;