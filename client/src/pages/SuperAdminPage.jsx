import React, { useState, useEffect } from "react";
import { FaSignOutAlt, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function SuperAdminPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: "",
    secretKey: "",
    address: "",
    phone: "",
    email: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
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
          const msg = body.message || "Failed to load schools";
          setError(msg);
          toast.error(msg);
        }
      } catch (err) {
        setError("Network error");
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Toggle isActive on the server, then update local state
  const handleToggle = async (id) => {
    const toastId = toast.loading("Updating status...");
    setTogglingId(id);
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
      toast.success(
        `School ${body.data.school.isActive ? "activated" : "deactivated"}`,
        { id: toastId }
      );
    } catch (err) {
      toast.error(`Could not toggle school: ${err.message}`, { id: toastId });
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddSchool = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating school...");
    setIsCreating(true);
    try {
      const token = localStorage.getItem("accessToken");
      // Create school
      const schoolRes = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(newSchool),
      });
      const schoolBody = await schoolRes.json();
      if (!schoolRes.ok || !schoolBody.success) {
        throw new Error(schoolBody.message || "Failed to create school");
      }
      toast.success("School created successfully", { id: toastId });

      // Create school admin user
      const userRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: newSchool.name,
          email: newSchool.email,
          password: newSchool.secretKey,
          secretKey: process.env.REACT_APP_SUPER_ADMIN_SECRET_KEY,
          role: "school_admin",
          schoolId: schoolBody.data.school._id,
        }),
      });
      const userBody = await userRes.json();
      if (!userRes.ok || !userBody.success) {
        toast.error(`Admin user creation failed: ${userBody.message}`);
        console.warn(
          "School created but admin user creation failed:",
          userBody.message
        );
      } else {
        toast.success("Admin user created successfully");
      }

      setSchools((prev) => [...prev, schoolBody.data.school]);
      setShowAddForm(false);
      setNewSchool({
        name: "",
        secretKey: "",
        address: "",
        phone: "",
        email: "",
      });
    } catch (err) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-blue-200 p-8">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">All Schools</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <FaPlus className="mr-2" />
            Add School
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-800 transition"
          >
            <FaSignOutAlt className="mr-2 text-lg" />
            Logout
          </button>
        </div>
      </div>

      {/* Add School Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Add New School</h2>
            <form onSubmit={handleAddSchool}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="School Name"
                  value={newSchool.name}
                  onChange={(e) =>
                    setNewSchool((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Secret Key"
                  value={newSchool.secretKey}
                  onChange={(e) =>
                    setNewSchool((prev) => ({
                      ...prev,
                      secretKey: e.target.value,
                    }))
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newSchool.address}
                  onChange={(e) =>
                    setNewSchool((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newSchool.phone}
                  onChange={(e) =>
                    setNewSchool((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newSchool.email}
                  onChange={(e) =>
                    setNewSchool((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading / Error */}
      {loading && <p className="text-gray-600">Loading schools…</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* School List */}
      {!loading && !error && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((s) => {
            const id = s._id;
            return (
              <li key={id} className="relative">
                <button
                  onClick={() => navigate(`/school/${id}`)}
                  className={`w-full p-6 bg-white space-y-2 rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-200 ${
                    !s.isActive ? "opacity-60 filter grayscale" : ""
                  }`}
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {s.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {id.slice(-6).toUpperCase()}
                  </p>
                  <p>
                    <span className="font-semibold">Secret Key</span> {s.secretKey}
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
                    disabled={togglingId === id}
                    className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50"
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
