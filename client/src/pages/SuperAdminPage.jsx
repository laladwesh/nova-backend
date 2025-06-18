import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  // logout handler
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    navigate('/pixelgrid');
  };

  // fetch minimal list (id + name) on mount
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res   = await fetch('/api/schools', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : undefined
          },
        });
        const body = await res.json();
        if (res.ok && body.success) {
          setSchools(body.data.schools);
        } else {
          setError(body.message || 'Failed to load schools');
        }
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">All Schools</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
        >
          Logout
        </button>
      </div>

      {/* List */}
      {loading && <p className="text-gray-600">Loading schools…</p>}
      {error   && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((s) => {
            const id = s.schoolId || s._id;
            return (
              <li key={id}>
                <button
                  onClick={() => navigate(`/school/${id}`)}
                  className="w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition text-left"
                >
                  <h2 className="text-xl font-semibold text-gray-800">
                    {s.name}
                  </h2>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
