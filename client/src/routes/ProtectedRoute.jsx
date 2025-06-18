import React from 'react';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  return token
    ? children
    : <Navigate to="/" replace />;
}

export function SuperAdminRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  const role  = localStorage.getItem('role');
  if (!token)                 return <Navigate to="/" replace />;
  if (role !== 'super_admin') return <Navigate to="/schooladmin" replace />;
  return children;
}

export function SchoolAdminRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  const role  = localStorage.getItem('role');
  if (!token)                 return <Navigate to="/" replace />;
  if (role !== 'school_admin') return <Navigate to="/superadmin" replace />;
  return children;
}
