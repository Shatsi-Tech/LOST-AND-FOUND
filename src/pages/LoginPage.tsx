import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email / ID and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ identifier, password });
      // login() sets the user in context; read role from the response via api directly
      // We navigate to /dashboard which App.tsx will redirect based on role
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-campus-600 to-campus-400 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg">
            U
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
            Sign In
          </h2>
          <p className="text-xs text-slate-500">
            Access your university lost and found portal account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                University Email or Student / Staff ID
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-campus-600 hover:text-campus-800"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Don&apos;t have a campus account?{' '}
            <Link to="/register" className="font-bold text-campus-600 hover:text-campus-800">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Quick Demo Logins Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              ⚡ Quick Demo Logins (1-Click)
            </span>
            <span className="text-[10px] text-slate-400">Pre-seeded accounts</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setIdentifier('admin@campus.edu');
                setPassword('admin123');
              }}
              className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-purple-700 group-hover:text-purple-800">👑 Admin</div>
              <div className="text-[10px] text-slate-400 truncate">admin@campus.edu</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('security@campus.edu');
                setPassword('officer123');
              }}
              className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-blue-700 group-hover:text-blue-800">🛡️ Officer</div>
              <div className="text-[10px] text-slate-400 truncate">security@campus.edu</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('alex.kim@campus.edu');
                setPassword('student123');
              }}
              className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all shadow-xs group"
            >
              <div className="text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">🎓 Student</div>
              <div className="text-[10px] text-slate-400 truncate">alex.kim@campus.edu</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

