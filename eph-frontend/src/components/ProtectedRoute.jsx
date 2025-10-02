// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  // DEBUG logging
  console.log('ProtectedRoute check:', {
    path: location.pathname,
    isAuthenticated,
    loading,
    mustChangePassword
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Don't redirect if already on change-password page
  if (mustChangePassword && location.pathname !== '/change-password') {
    console.log('Must change password, redirecting');
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ProtectedRoute;