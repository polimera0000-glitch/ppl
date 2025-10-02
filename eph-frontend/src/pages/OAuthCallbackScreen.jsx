// src/pages/OAuthCallbackScreen.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

const OAuthCallbackScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error from OAuth provider
        const errorParam = searchParams.get('error');
        if (errorParam) {
          throw new Error(decodeURIComponent(errorParam));
        }

        // Get token directly from URL (backend already exchanged the code)
        const token = searchParams.get('token');
        const provider = searchParams.get('provider');

        if (!token) {
          throw new Error('No authentication token received');
        }

        // Save token using authService directly
        if (authService.setToken) {
          authService.setToken(token);
        } else {
          localStorage.setItem('token', token);
        }

        // Decode token to get user info (JWT payload)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const user = {
            id: payload.id || payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role
          };
          
          // Save user info
          if (authService.setUser) {
            authService.setUser(user);
          } else {
            localStorage.setItem('user', JSON.stringify(user));
          }

          // Redirect based on role
          const isAdmin = (user.role || '').toLowerCase() === 'admin';
          navigate(isAdmin ? '/admin' : '/main', { 
            replace: true,
            state: { tab: 'competitions' }
          });
        } catch (decodeError) {
          // If JWT decode fails, just redirect to main
          console.warn('Could not decode JWT, redirecting to main');
          navigate('/main', { replace: true, state: { tab: 'competitions' } });
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
        
        // Redirect to login after showing error briefly
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/70 rounded-2xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-slate-300 mb-4">{error}</p>
            <p className="text-slate-400 text-sm">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
        <p className="text-white">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackScreen;