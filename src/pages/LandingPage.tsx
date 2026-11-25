import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register State
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    student_staff_id: '',
    email: '',
    phone: '',
    department: 'School of Computing & Engineering',
    role: 'admin' as 'student' | 'admin' | 'officer',
    password: '',
    confirm_password: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // If already authenticated, redirect to role dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setLoginError('Please enter your email / ID and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);
    try {
      await login({ identifier: loginIdentifier, password: loginPassword });
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirm_password) {
      setRegisterError('Passwords do not match.');
      return;
    }
    if (registerForm.password.length < 6) {
      setRegisterError('Password must be at least 6 characters.');
      return;
    }

    setRegisterLoading(true);
    setRegisterError(null);
    try {
      await register(registerForm);
    } catch (err: any) {
      setRegisterError(err.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-campus-600 to-campus-400 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl border border-campus-300/30">
            U
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
            UniFind Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Campus Lost & Found Property Management System
          </p>
        </div>

        {/* Auth Card with Tabs */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
                setRegisterError(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white text-campus-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setLoginError(null);
                setRegisterError(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-white text-campus-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'login' ? (
              /* LOGIN TAB */
              <div className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email or Student / Staff ID
                    </label>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    {loginLoading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>

                <div className="pt-3 text-center text-xs text-slate-500">
                  New member?{' '}
                  <button
                    onClick={() => setActiveTab('register')}
                    className="font-bold text-campus-600 hover:text-campus-800"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : (
              /* REGISTER TAB */
              <div className="space-y-4">
                {registerError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{registerError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={registerForm.full_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Student/Staff ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={registerForm.student_staff_id}
                        onChange={(e) => setRegisterForm({ ...registerForm, student_staff_id: e.target.value })}
                        placeholder="e.g. KBA7674"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        placeholder="0751533654"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="name@campus.edu"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Account Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={registerForm.role}
                        onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as any })}
                        className="w-full text-xs font-bold text-campus-700 rounded-xl border border-campus-300 bg-campus-50/50 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
                      >
                        <option value="admin">Administrator (Admin)</option>
                        <option value="student">Student Account</option>
                        <option value="officer">Security Officer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Faculty / Department
                      </label>
                      <select
                        value={registerForm.department}
                        onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
                      >
                        <option value="System Administration">System Administration</option>
                        <option value="School of Computing & Engineering">School of Computing & Engineering</option>
                        <option value="School of Business & Economics">School of Business & Economics</option>
                        <option value="Faculty of Health & Medical Sciences">Faculty of Health & Medical Sciences</option>
                        <option value="Faculty of Law & Humanities">Faculty of Law & Humanities</option>
                        <option value="Faculty of Natural Sciences">Faculty of Natural Sciences</option>
                        <option value="General Campus Staff">General Campus Staff</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="Min 6 chars"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={registerForm.confirm_password}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirm_password: e.target.value })}
                        placeholder="Repeat password"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full py-3 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {registerLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>

                <div className="pt-3 text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('login')}
                    className="font-bold text-campus-600 hover:text-campus-800"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
