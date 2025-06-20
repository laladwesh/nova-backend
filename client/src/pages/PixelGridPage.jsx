import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PixelGridPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1) Perform login
    const loginRes  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      setError(loginData.message || 'Login failed');
      return;
    }

    // 2) Store JWT, role, and schoolId
    const { accessToken } = loginData.data.tokens;
    const { role, schoolId } = loginData.data.user;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('role', role);
    if (schoolId) {
      localStorage.setItem('schoolId', schoolId);
    }

    // 3) Check super-admin via backend
    const superRes = await fetch('/api/superadmin', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email }),
    });
    const superData = await superRes.json();

    // 4) Route accordingly
    if (superRes.ok && superData.success) {
      // confirmed super_admin
      navigate('/superadmin', { replace: true });
    } else if (role === 'school_admin') {
      // school_admin must have a schoolId
      if (!schoolId) {
        setError('Your account is missing a school assignment.');
      } else {
        navigate(`/schooladmin/${schoolId}`, { replace: true });
      }
    } else {
      // fallback for any other role
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-center text-2xl font-semibold text-white mb-6">
          Admin Portal
        </h2>
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
