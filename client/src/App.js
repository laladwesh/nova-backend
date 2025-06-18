import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PixelGridPage from "./pages/PixelGridPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import SchoolAdminPage from "./pages/SchoolAdminPage";
import { SuperAdminRoute, SchoolAdminRoute } from "./routes/ProtectedRoute";
import Homepage from "./pages/HomePage.js";
import { SchoolDetailPage } from "./pages/SchoolDetailPage.jsx";
function PublicRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  if (token) {
    // already logged in → redirect by role
    if (role === "super_admin") {
      return <Navigate to="/superadmin" replace />;
    }
    if (role === "school_admin") {
      return <Navigate to="/schooladmin" replace />;
    }
    // fallback
    return <Navigate to="/" replace />;
  }

  // not logged in → render the login page
  return children;
}

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />

        {/* Public login page, blocked if already authenticated */}
        <Route
          path="/pixelgrid"
          element={
            <PublicRoute>
              <PixelGridPage />
            </PublicRoute>
          }
        />

<Route
      path="/school/:id"
      element={
        <SuperAdminRoute>
          <SchoolDetailPage />
        </SuperAdminRoute>
      }
    />
        {/* Only accessible to users with role === "super_admin" */}
        <Route
          path="/superadmin"
          element={
            <SuperAdminRoute>
              <SuperAdminPage />
            </SuperAdminRoute>
          }
        />

        {/* Only accessible to users with role === "school_admin" */}
        <Route
          path="/schooladmin"
          element={
            <SchoolAdminRoute>
              <SchoolAdminPage />
            </SchoolAdminRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
