import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FaSpinner } from "react-icons/fa";

export default function PixelGridPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1) Perform login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || "Login failed");

      // 2) Store JWT, role, and schoolId
      const { accessToken } = loginData.data.tokens;
      const { role, schoolId } = loginData.data.user;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("role", role);
      if (schoolId) localStorage.setItem("schoolId", schoolId);

      // 3) Check super-admin via backend
      const superRes = await fetch("/api/superadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email }),
      });
      const superData = await superRes.json();

      // 4) Route accordingly
      if (superRes.ok && superData.success) {
        toast.success("Welcome, Super Admin!");
        navigate("/superadmin", { replace: true });
      } else if (role === "school_admin") {
        if (!schoolId) throw new Error("Your account is missing a school assignment.");
        toast.success("Welcome, School Admin!");
        navigate(`/schooladmin/${schoolId}`, { replace: true });
      } else {
        toast.success("Login successful!");
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-blue-200 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-center text-2xl font-semibold text-gray-800 mb-6">
          Admin Portal
        </h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
