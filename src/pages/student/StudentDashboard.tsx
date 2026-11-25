import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  PackagePlus,
  Search,
  FileText,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  QrCode,
  BookOpen,
  MapPin,
  User,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { StudentDashboardSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/Badge';

interface KpiTileProps {
  value: string | number;
  label: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
}

const KpiTile: React.FC<KpiTileProps> = ({ value, label, icon: Icon, accent, bg }) => (
  <div className={`rounded-2xl p-4 border flex items-center gap-4 ${bg}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

interface QuickActionProps {
  to: string;
  icon: React.ElementType;
  label: string;
  sub: string;
  colorClass: string;
  iconClass: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ to, icon: Icon, label, sub, colorClass, iconClass }) => (
  <Link
    to={to}
    className={`group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${colorClass}`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="text-center">
      <p className="text-xs font-bold text-slate-800">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  </Link>
);

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user) return;
      try {
        const data = await api.getStudentSummary(user.id);
        setSummary(data);
      } catch (err) {
        console.error('Failed to load student summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [user]);

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* ─── HERO BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 right-20 w-24 h-24 bg-white/10 rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-xs font-semibold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Student Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              {greeting()}, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-sky-100">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {user?.student_staff_id}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {user?.department || 'General Campus'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 relative z-10">
            <Link
              to="/report-lost"
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" /> Report Lost
            </Link>
            <Link
              to="/report-found"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <PackagePlus className="w-4 h-4" /> Report Found
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MATCH ALERT ─── */}
      {summary && summary.possible_matches > 0 && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {summary.possible_matches} Possible Match{summary.possible_matches > 1 ? 'es' : ''} Found!
              </p>
              <p className="text-xs text-amber-700">Our AI engine may have located your missing item.</p>
            </div>
          </div>
          <Link
            to="/dashboard/matches"
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ─── KPI TILES ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiTile value={loading ? '–' : summary?.my_lost || 0} label="My Lost Reports" icon={PlusCircle} accent="bg-rose-500" bg="bg-rose-50 border-rose-100" />
        <KpiTile value={loading ? '–' : summary?.my_found || 0} label="Found Reports" icon={PackagePlus} accent="bg-emerald-500" bg="bg-emerald-50 border-emerald-100" />
        <KpiTile value={loading ? '–' : summary?.pending_claims || 0} label="Active Claims" icon={Award} accent="bg-amber-500" bg="bg-amber-50 border-amber-100" />
        <KpiTile value={loading ? '–' : summary?.possible_matches || 0} label="AI Matches" icon={Sparkles} accent="bg-purple-500" bg="bg-purple-50 border-purple-100" />
        <KpiTile value={loading ? '–' : summary?.recovered || 0} label="Recovered" icon={CheckCircle2} accent="bg-sky-500" bg="bg-sky-50 border-sky-100" />
      </div>

      {/* ─── QUICK ACTIONS ─── */}
      <div>
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction
            to="/report-lost"
            icon={PlusCircle}
            label="Report Lost Item"
            sub="Submit a missing report"
            colorClass="border-rose-200 hover:border-rose-400 hover:bg-rose-50"
            iconClass="bg-rose-50 text-rose-600"
          />
          <QuickAction
            to="/report-found"
            icon={PackagePlus}
            label="Report Found Item"
            sub="Log a discovered item"
            colorClass="border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50"
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <QuickAction
            to="/dashboard/claims"
            icon={QrCode}
            label="My Claims"
            sub="Track collection passes"
            colorClass="border-blue-200 hover:border-blue-400 hover:bg-blue-50"
            iconClass="bg-blue-50 text-blue-600"
          />
          <QuickAction
            to="/items"
            icon={Search}
            label="Browse Catalog"
            sub="Explore campus items"
            colorClass="border-purple-200 hover:border-purple-400 hover:bg-purple-50"
            iconClass="bg-purple-50 text-purple-600"
          />
        </div>
      </div>

      {/* ─── BOTTOM GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Your latest reports and claim updates</p>
            </div>
            <Link
              to="/dashboard/reports"
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              All Reports <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : summary?.recent_activity && summary.recent_activity.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {summary.recent_activity.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                        item.type === 'lost'
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : item.type === 'found'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.type === 'lost' ? 'LOST' : item.type === 'found' ? 'FND' : 'CLM'}
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-400">#{item.ref}</p>
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={item.status} size="sm" />
                    <span className="text-[10px] text-slate-400 hidden sm:block">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No activity yet. Start by reporting a lost or found item.
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* How it works */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-3xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-sky-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              How It Works
            </h4>
            <div className="space-y-3 text-xs text-sky-800">
              {[
                { step: '1', label: 'Report your lost item with details and photo' },
                { step: '2', label: 'Our AI matches it with found items' },
                { step: '3', label: 'Submit a claim with ownership evidence' },
                { step: '4', label: 'Collect at the security desk with your pass' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>
            <Link
              to="/how-it-works"
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              Learn more <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Security Desk */}
          <div className="bg-slate-900 text-white rounded-3xl p-5">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Security Desk
            </p>
            <p className="text-sm font-bold">Administration Block</p>
            <p className="text-xs text-slate-400 mt-0.5">Room G-04 · Mon–Fri, 8am–6pm</p>
            <p className="text-lg font-mono font-bold text-amber-400 mt-2">Ext: #5520</p>
            <p className="text-[10px] text-slate-500 mt-1">Bring your campus ID when collecting items</p>
          </div>
        </div>
      </div>
    </div>
  );
};
