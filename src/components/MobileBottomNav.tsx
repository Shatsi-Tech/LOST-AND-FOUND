import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  PackagePlus,
  QrCode,
  ShieldCheck,
  Layers,
  History,
  Award,
  Users,
  FileText,
  Tag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { isAuthenticated, isAdmin, isOfficer } = useAuth();

  if (!isAuthenticated) return null;

  const studentTabs = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Browse', path: '/items', icon: Search },
    { label: 'Lost', path: '/report-lost', icon: PlusCircle },
    { label: 'Found', path: '/report-found', icon: PackagePlus },
    { label: 'Claims', path: '/dashboard/claims', icon: QrCode },
  ];

  const officerTabs = [
    { label: 'Desk', path: '/officer', icon: ShieldCheck, exact: true },
    { label: 'Handover', path: '/officer/handover', icon: QrCode },
    { label: 'Inventory', path: '/officer/inventory', icon: Layers },
    { label: 'History', path: '/officer/history', icon: History },
    { label: 'Browse', path: '/items', icon: Search },
  ];

  const adminTabs = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Lost', path: '/admin/lost-reports', icon: FileText },
    { label: 'Found', path: '/admin/found-reports', icon: Tag },
    { label: 'Claims', path: '/admin/claims', icon: Award },
    { label: 'Users', path: '/admin/users', icon: Users },
  ];

  const tabs = isAdmin ? adminTabs : isOfficer ? officerTabs : studentTabs;

  const activeColor = isAdmin
    ? 'text-purple-600 bg-purple-50/80 font-bold'
    : isOfficer
    ? 'text-amber-600 bg-amber-50/80 font-bold'
    : 'text-campus-600 bg-campus-50/80 font-bold';

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-1 py-1 safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.exact}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
                  isActive
                    ? activeColor
                    : 'text-slate-500 hover:text-slate-900 active:scale-95'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5 shrink-0" />
              <span className="text-[10px] tracking-tight truncate max-w-[56px] leading-tight">
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
