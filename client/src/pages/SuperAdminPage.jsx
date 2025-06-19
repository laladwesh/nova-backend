import React, { useState, useEffect } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function SuperAdminPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    navigate("/pixelgrid");
  };

  // Fetch schools on mount
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/schools", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const body = await res.json();
        if (res.ok && body.success) {
          setSchools(body.data.schools);
        } else {
          setError(body.message || "Failed to load schools");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Toggle isActive on the server, then update local state
  const handleToggle = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/auth/school/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message);

      setSchools((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, isActive: body.data.school.isActive } : s
        )
      );
    } catch (err) {
      alert("Could not toggle school: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">All Schools</h1>
        <button
          onClick={handleLogout}
          className="flex items-center text-red-600 hover:text-red-800 transition"
        >
          <FaSignOutAlt className="mr-2 text-lg" />
          Logout
        </button>
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-gray-600">Loading schools…</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* School List */}
      {!loading && !error && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((s) => {
            const id = s.schoolId || s._id;
            return (
              <li key={id} className="relative">
                <button
                  onClick={() => navigate(`/school/${id}`)}
                  className={`
                    w-full p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl
                    transform  transition-all duration-200
                    ${!s.isActive ? "opacity-60 filter grayscale" : ""}
                  `}
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {s.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {s._id.slice(-6).toUpperCase()}
                  </p>
                </button>

                {/* Toggle */}
                <div className="absolute top-4 right-4 flex items-center">
                  <span
                    className={`mr-2 text-sm font-medium ${
                      s.isActive ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => handleToggle(id)}
                    className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
                    style={{
                      backgroundColor: s.isActive ? "#4ADE80" : "#CBD5E1",
                    }}
                  >
                    <span
                      className="inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200"
                      style={{
                        transform: s.isActive
                          ? "translateX(1.5rem)"
                          : "translateX(0.125rem)",
                      }}
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
