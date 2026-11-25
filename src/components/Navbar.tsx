import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  User as UserIcon,
  Shield,
  GraduationCap,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building,
  CheckCheck,
  LayoutDashboard,
  Search,
  PlusCircle,
  PackagePlus,
  QrCode,
  Sparkles,
  FileText,
  Layers,
  History,
  Award,
  FolderTree,
  MapPin,
  Users,
  ClipboardList,
  DownloadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isOfficer } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const studentNavLinks = [
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Browse Catalog', path: '/items', icon: Search },
    { label: 'Report Lost Property', path: '/report-lost', icon: PlusCircle },
    { label: 'Report Found Item', path: '/report-found', icon: PackagePlus },
    { label: 'My Reports', path: '/dashboard/reports', icon: FileText },
    { label: 'My Claims & Passes', path: '/dashboard/claims', icon: QrCode },
    { label: 'Possible Matches', path: '/dashboard/matches', icon: Sparkles },
    { label: 'My Profile', path: '/profile', icon: UserIcon },
  ];

  const officerNavLinks = [
    { label: 'Security Desk', path: '/officer', icon: Shield },
    { label: 'Process Handover', path: '/officer/handover', icon: QrCode },
    { label: 'Custody Inventory', path: '/officer/inventory', icon: Layers },
    { label: 'Handover History', path: '/officer/history', icon: History },
    { label: 'Register Found Item', path: '/report-found', icon: PackagePlus },
    { label: 'Browse Catalog', path: '/items', icon: Search },
  ];

  const adminNavLinks = [
    { label: 'Admin Dashboard', path: '/admin', icon: Building },
    { label: 'Lost Item Reports', path: '/admin/lost-reports', icon: FileText },
    { label: 'Found Item Reports', path: '/admin/found-reports', icon: Layers },
    { label: 'Claims Review Queue', path: '/admin/claims', icon: Award },
    { label: 'Category Settings', path: '/admin/categories', icon: FolderTree },
    { label: 'Campus Locations', path: '/admin/locations', icon: MapPin },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: ClipboardList },
    { label: 'Export Reports', path: '/admin/export', icon: DownloadCloud },
  ];

  const navLinks = isAdmin ? adminNavLinks : isOfficer ? officerNavLinks : studentNavLinks;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Campus Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-campus-600 to-campus-400 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg border border-campus-300/30 group-hover:scale-105 transition-transform">
              U
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans">
                  UniFind
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  Campus
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate max-w-[170px] sm:max-w-none">
                Lost & Found Management Portal
              </p>
            </div>
          </Link>

          {/* Right Side Header Items */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {isAuthenticated ? (
              <>
                {/* Role specific dashboard link (Desktop) */}
                <Link
                  to={isAdmin ? '/admin' : isOfficer ? '/officer' : '/dashboard'}
                  className="hidden md:flex px-3.5 py-2 rounded-lg text-xs font-bold text-campus-300 hover:text-white hover:bg-slate-800/80 transition-colors items-center gap-1.5"
                >
                  {isAdmin ? (
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                  ) : isOfficer ? (
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5 text-campus-400" />
                  )}
                  <span>{isAdmin ? 'Admin Console' : isOfficer ? 'Security Desk' : 'Dashboard'}</span>
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-md">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-campus-50 text-campus-700 border border-campus-200">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-semibold text-campus-600 hover:text-campus-800 flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setNotifDropdownOpen(false);
                                }
                              }}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                                n.is_read === 0 ? 'bg-campus-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900">{n.title}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {n.created_at ? n.created_at.split('T')[0] : 'Today'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown (Desktop) */}
                <div className="relative hidden md:block" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-campus-700 text-white font-bold text-xs flex items-center justify-center border border-campus-500">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                      {user?.full_name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{user?.student_staff_id}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-campus-50 text-campus-700 border border-campus-200 capitalize">
                          {user?.role}
                        </span>
                      </div>

                      <div className="py-1 text-xs">
                        <Link
                          to={isAdmin ? '/admin' : isOfficer ? '/officer' : '/dashboard'}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                        >
                          My Profile
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Hamburger Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-gold-400 hover:bg-gold-300 rounded-lg shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MOBILE DRAWER MENU ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 overflow-y-auto p-4 flex flex-col justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-4">
            {/* User Profile Card on Mobile */}
            {isAuthenticated && user && (
              <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-campus-600 text-white font-bold text-sm flex items-center justify-center border-2 border-campus-400 shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    user.full_name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{user.full_name}</h4>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{user.student_staff_id}</p>
                  <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-campus-500/20 text-campus-300 border border-campus-400/30 capitalize">
                    {user.role} Portal
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Campus Navigation
              </p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-campus-600 text-white shadow-md'
                        : 'text-slate-200 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 bg-slate-800 text-white text-center rounded-xl text-xs font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 bg-gold-400 text-slate-900 text-center rounded-xl text-xs font-bold"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <div className="text-center text-[10px] text-slate-500">
              Campus Security Helpline: <span className="font-mono text-slate-400 font-bold">+1 (555) 019-5520</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
