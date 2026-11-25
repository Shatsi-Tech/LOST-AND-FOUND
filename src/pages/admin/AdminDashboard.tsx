import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Tag,
  Award,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Building,
  MapPin,
  ClipboardList,
  DownloadCloud,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Shield,
  Activity,
  BarChart2,
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminAnalytics } from '../../types';
import { StatusBadge } from '../../components/Badge';
import { CategoryBarChart, LocationHotspotsChart } from '../../components/Charts';
import { useAuth } from '../../context/AuthContext';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  bg: string;
  border: string;
  sub?: string;
  to?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, accent, bg, border, sub, to }) => {
  const inner = (
    <div className={`rounded-2xl p-4 border-2 transition-all hover:shadow-md ${bg} ${border}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-4.5 h-4.5 text-white w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{inner}</Link>;
  }
  return inner;
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [resettingSeed, setResettingSeed] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleResetSeed = async () => {
    if (!window.confirm('Reset database and restore realistic campus demo seed data?')) return;
    setResettingSeed(true);
    try {
      const res = await api.resetDemoSeed();
      setSeedNotice(res.message);
      fetchAnalytics();
      setTimeout(() => setSeedNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset seed');
    } finally {
      setResettingSeed(false);
    }
  };

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      {/* ─── HERO BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-purple-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-purple-400/10 rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-purple-100 text-xs font-semibold border border-white/20">
              <Building className="w-3.5 h-3.5" />
              Campus Administrative Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              System Administration Panel
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200">
              <span className="font-semibold text-white">{user?.full_name}</span>
              <span className="opacity-60">·</span>
              <span>{user?.student_staff_id}</span>
              <span className="opacity-60">·</span>
              <span>{user?.department || 'Campus Administration'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleResetSeed}
              disabled={resettingSeed}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resettingSeed ? 'animate-spin' : ''}`} />
              {resettingSeed ? 'Resetting...' : 'Reset Demo Data'}
            </button>
            <Link
              to="/admin/claims"
              className="px-5 py-2.5 bg-white text-purple-800 hover:bg-purple-50 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <Award className="w-4 h-4" /> Review Claims
            </Link>
          </div>
        </div>
      </div>

      {/* SEED NOTICE */}
      {seedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{seedNotice}</span>
        </div>
      )}

      {/* ─── ADMIN QUICK NAV ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/users', label: 'User Directory', icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100' },
          { to: '/admin/claims', label: 'Claims Review', icon: Award, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-100' },
          { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList, color: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100' },
          { to: '/admin/export', label: 'Export Reports', icon: DownloadCloud, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all text-xs font-bold ${item.color}`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* ─── 8 SYSTEM KPI CARDS ─── */}
      <div>
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-purple-500" />
          System KPIs
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            title="Registered Users"
            value={loading ? '–' : kpis?.total_users || 0}
            icon={Users}
            accent="bg-indigo-600"
            bg="bg-white"
            border="border-indigo-100"
            sub="Students and staff"
            to="/admin/users"
          />
          <KpiCard
            title="Lost Reports"
            value={loading ? '–' : kpis?.total_lost || 0}
            icon={FileText}
            accent="bg-rose-500"
            bg="bg-white"
            border="border-rose-100"
            sub="Total campus reports"
            to="/admin/lost-reports"
          />
          <KpiCard
            title="Found Reports"
            value={loading ? '–' : kpis?.total_found || 0}
            icon={Tag}
            accent="bg-emerald-500"
            bg="bg-white"
            border="border-emerald-100"
            sub="Discovered property"
            to="/admin/found-reports"
          />
          <KpiCard
            title="Pending Claims"
            value={loading ? '–' : kpis?.pending_claims || 0}
            icon={Award}
            accent="bg-amber-500"
            bg="bg-amber-50"
            border="border-amber-200"
            sub="Awaiting your review"
            to="/admin/claims"
          />
          <KpiCard
            title="Approved Claims"
            value={loading ? '–' : kpis?.approved_claims || 0}
            icon={CheckCircle2}
            accent="bg-sky-500"
            bg="bg-white"
            border="border-sky-100"
            sub="Ready for pickup"
          />
          <KpiCard
            title="Rejected Claims"
            value={loading ? '–' : kpis?.rejected_claims || 0}
            icon={XCircle}
            accent="bg-rose-500"
            bg="bg-white"
            border="border-rose-100"
            sub="Unverified evidence"
          />
          <KpiCard
            title="Returned Items"
            value={loading ? '–' : kpis?.returned_items || 0}
            icon={CheckCircle2}
            accent="bg-emerald-600"
            bg="bg-emerald-50"
            border="border-emerald-200"
            sub="Handover completed"
          />
          <KpiCard
            title="Unclaimed Items"
            value={loading ? '–' : kpis?.unclaimed_items || 0}
            icon={Archive}
            accent="bg-purple-500"
            bg="bg-white"
            border="border-purple-100"
            sub="In storage over 30 days"
          />
        </div>
      </div>

      {/* ─── CHARTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Property by Category</h3>
              <p className="text-xs text-slate-500">Lost vs Found distribution</p>
            </div>
            <Link to="/admin/categories" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CategoryBarChart data={data?.category_stats || []} />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Campus Hotspot Locations</h3>
              <p className="text-xs text-slate-500">Venues with highest incidents</p>
            </div>
            <Link to="/admin/locations" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <LocationHotspotsChart data={data?.location_stats || []} />
        </div>
      </div>

      {/* ─── CLAIMS QUEUE + AUDIT FEED ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims Queue */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Pending Claims Queue
              </h3>
              <p className="text-xs text-slate-500">Claims requiring administrator review</p>
            </div>
            <Link to="/admin/claims" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
              Full Queue ({kpis?.pending_claims || 0}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data?.pending_claims && data.pending_claims.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.pending_claims.map((claim) => (
                <div key={claim.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-mono text-purple-700 font-bold block">#{claim.claim_reference}</span>
                    <h4 className="font-bold text-slate-900 truncate">{claim.found_name}</h4>
                    <p className="text-slate-500 text-[11px]">
                      Claimant:{' '}
                      <span className="font-semibold text-slate-700">{claim.claimant_name}</span>{' '}
                      ({claim.claimant_student_id})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={claim.status} size="sm" />
                    <Link
                      to="/admin/claims"
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 rounded-lg font-semibold transition-colors text-[11px]"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              All claims have been processed. Queue is clear!
            </div>
          )}
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600" />
                Audit Trail
              </h3>
              <p className="text-xs text-slate-500">Live system events</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
              All Logs <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data?.recent_audit && data.recent_audit.length > 0 ? (
            <div className="space-y-3 text-xs">
              {data.recent_audit.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 text-[10px] uppercase tracking-wide">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.created_at ? log.created_at.split(' ')[0] : 'Today'}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-snug">{log.description}</p>
                  <p className="text-[10px] text-slate-400">By: {log.user_name || 'System'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No audit records available.
            </div>
          )}
        </div>
      </div>

      {/* ─── MODULE SHORTCUTS ─── */}
      <div>
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          Management Modules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { to: '/admin/lost-reports', label: 'Lost Reports', icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-200' },
            { to: '/admin/found-reports', label: 'Found Reports', icon: Tag, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { to: '/admin/categories', label: 'Categories', icon: LayoutDashboard, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { to: '/admin/locations', label: 'Locations', icon: MapPin, color: 'text-purple-600 bg-purple-50 border-purple-200' },
            { to: '/admin/users', label: 'User Management', icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 text-xs font-bold ${item.color}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
