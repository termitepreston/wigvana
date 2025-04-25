import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  if (!isAuthenticated) {
    showToast('Please login to access this page', 'warning');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    showToast('You do not have permission to access this page', 'error');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 