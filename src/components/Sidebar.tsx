import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Search,
  Sparkles,
  Award,
  ShieldCheck,
  Building,
  Users,
  FolderTree,
  MapPin,
  ClipboardList,
  DownloadCloud,
  History,
  Tag,
  PackagePlus,
  QrCode,
  User,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isOfficer, isStudent } = useAuth();

  /* ─── ROLE LINKS ─── */
  const studentLinks = [
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Report Lost Item', path: '/report-lost', icon: PlusCircle },
    { label: 'Report Found Item', path: '/report-found', icon: PackagePlus },
    { label: 'My Reports', path: '/dashboard/reports', icon: FileText },
    { label: 'My Claims & Passes', path: '/dashboard/claims', icon: QrCode },
    { label: 'Possible Matches', path: '/dashboard/matches', icon: Sparkles },
    { label: 'Browse Catalog', path: '/items', icon: Search },
    { label: 'My Profile', path: '/profile', icon: User },
  ];

  const officerLinks = [
    { label: 'Security Desk', path: '/officer', icon: ShieldCheck, exact: true },
    { label: 'Process Handover', path: '/officer/handover', icon: QrCode },
    { label: 'Custody Inventory', path: '/officer/inventory', icon: Layers },
    { label: 'Handover History', path: '/officer/history', icon: History },
    { label: 'Register Found Item', path: '/report-found', icon: PackagePlus },
    { label: 'Browse All Items', path: '/items', icon: Search },
  ];

  const adminLinks = [
    { label: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Lost Item Reports', path: '/admin/lost-reports', icon: FileText },
    { label: 'Found Item Reports', path: '/admin/found-reports', icon: Tag },
    { label: 'Claims Review Queue', path: '/admin/claims', icon: Award },
    { label: 'Category Settings', path: '/admin/categories', icon: FolderTree },
    { label: 'Campus Locations', path: '/admin/locations', icon: MapPin },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: ClipboardList },
    { label: 'Export Reports', path: '/admin/export', icon: DownloadCloud },
  ];

  const links = isAdmin ? adminLinks : isOfficer ? officerLinks : studentLinks;

  /* ─── ROLE THEME ─── */
  const theme = isAdmin
    ? {
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
        badgeText: 'Admin Console',
        avatarBg: 'bg-purple-600',
        activeLink: 'bg-purple-600 text-white shadow-sm',
        header: 'from-purple-900 to-indigo-950 text-white',
        helpBg: 'bg-purple-50 border-purple-100 text-purple-900',
        helpTitle: 'text-purple-800',
        helpSub: 'text-purple-700',
        helpAccent: 'text-purple-800',
        portalName: 'Admin Console',
      }
    : isOfficer
    ? {
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        badgeText: 'Security Portal',
        avatarBg: 'bg-amber-600',
        activeLink: 'bg-amber-600 text-white shadow-sm',
        header: 'from-slate-900 to-slate-800 text-white',
        helpBg: 'bg-amber-50 border-amber-100 text-amber-900',
        helpTitle: 'text-amber-800',
        helpSub: 'text-amber-700',
        helpAccent: 'text-amber-800',
        portalName: 'Security Portal',
      }
    : {
        badge: 'bg-sky-100 text-sky-700 border-sky-200',
        badgeText: 'Student Portal',
        avatarBg: 'bg-sky-600',
        activeLink: 'bg-sky-600 text-white shadow-sm',
        header: 'from-sky-900 to-blue-950 text-white',
        helpBg: 'bg-sky-50 border-sky-100 text-sky-900',
        helpTitle: 'text-sky-800',
        helpSub: 'text-sky-700',
        helpAccent: 'text-sky-800',
        portalName: 'Student Center',
      };

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] flex-col justify-between p-4 shadow-sm shrink-0">
      <div>

        {/* ─── USER CARD ─── */}
        <div className={`rounded-2xl mb-5 p-4 bg-gradient-to-br ${theme.header} shadow-sm`}>
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-11 h-11 rounded-xl object-cover border-2 border-white/30 shrink-0"
              />
            ) : (
              <div className={`w-11 h-11 rounded-xl ${theme.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 border-2 border-white/20`}>
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user?.full_name || 'Guest User'}</h4>
              <p className="text-[10px] font-mono text-white/60 truncate">{user?.student_staff_id || 'ID: ???'}</p>
              <span className={`inline-flex mt-1 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                {theme.badgeText}
              </span>
            </div>
          </div>
        </div>

        {/* ─── NAVIGATION ─── */}
        <div className="space-y-0.5">
          <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Navigation
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? theme.activeLink
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ─── SECURITY HELPLINE ─── */}
      <div className={`mt-6 p-4 rounded-2xl border text-xs ${theme.helpBg}`}>
        <p className={`font-bold flex items-center gap-1 ${theme.helpTitle}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          {isAdmin ? 'System Admin' : 'Security Desk'}
        </p>
        <p className={`text-[11px] mt-1 ${theme.helpSub}`}>
          {isAdmin ? 'Campus Administration Office' : 'Admin Bldg · Room G-04'}
        </p>
        <p className={`text-[11px] font-mono font-bold mt-0.5 ${theme.helpAccent}`}>
          Ext: #5520
        </p>
      </div>
    </aside>
  );
};
