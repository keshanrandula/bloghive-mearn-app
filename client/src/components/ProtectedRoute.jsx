import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection wrapper. Checks authentication state.
 * If user context is loading, shows a loading state.
 * If unauthenticated, navigates to the login screen.
 */
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-sm font-medium tracking-wide">Syncing Session...</p>
        </div>
      </div>
    );
  }

  // Render child routes (Outlet) if logged in, otherwise redirect to login
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
