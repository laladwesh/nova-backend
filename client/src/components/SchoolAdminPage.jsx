import React from 'react';
import { useNavigate } from 'react-router-dom';

const SchoolAdminPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // clear auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    // redirect to login
    navigate('/pixelgrid');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-semibold text-gray-800 mb-6">
        School Admin Dashboard
      </h1>

      {/* your dashboard content here */}

      <button
        onClick={handleLogout}
        className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
      >
        Logout
      </button>
    </div>
  );
};

export default SchoolAdminPage;
