import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProtectedSellerRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    toast.error('Please log in to access this page');
    return <Navigate to="/login" replace />;
  }

  if (!user?.isSeller) {
    toast.error('This page is only accessible to sellers');
    return <Navigate to="/become-seller" replace />;
  }

  // Check if seller profile is complete
  if (!user?.isSellerProfileComplete) {
    toast.info('Please complete your seller profile first');
    return <Navigate to="/become-seller" replace />;
  }

  return children;
};

export default ProtectedSellerRoute; 