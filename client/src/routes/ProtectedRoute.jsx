import React from "react";
import { Navigate, useParams } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/" replace />;
}

export function SuperAdminRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  const role  = localStorage.getItem("role");
  if (!token)                  return <Navigate to="/" replace />;
  if (role !== "super_admin")  return <Navigate to="/schooladmin" replace />;
  return children;
}

export function SchoolAdminRoute({ children }) {
  const token    = localStorage.getItem("accessToken");
  const role     = localStorage.getItem("role");
 const mySchool = localStorage.getItem("schoolId");
 const { id }   = useParams();   // the :id from /schooladmin/:id

  if (!token)                  return <Navigate to="/" replace />;
  if (role !== "school_admin") return <Navigate to="/pixelgrid" replace />;
 if (id !== mySchool) {
  // redirect to this admin's own school page
  return <Navigate to={`/schooladmin/${mySchool}`} replace />;
}

  return children;
}
