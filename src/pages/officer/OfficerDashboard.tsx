import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  PackagePlus,
  Tag,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  User,
  ArrowRight,
  ChevronRight,
  Layers,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { api, getImageUrl } from '../../services/api';
import { Handover, FoundItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface MetricProps {
  value: string | number;
  label: string;
  sub: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
}

const Metric: React.FC<MetricProps> = ({ value, label, sub, icon: Icon, accent, bg }) => (
  <div className={`rounded-2xl p-5 border flex items-center gap-4 ${bg}`}>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${accent}`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <p className="text-3xl font-extrabold text-slate-900 leading-none">{value}</p>
      <p className="text-xs font-bold text-slate-700 mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-500">{sub}</p>
    </div>
  </div>
);

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lookupRef, setLookupRef] = useState('');
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [handRes, foundRes] = await Promise.all([
        api.getHandoverHistory(),
        api.getFoundItems(),
      ]);
      setHandovers(handRes.handovers);
      setFoundItems(foundRes.items);
    } catch (err) {
      console.error('Failed to load officer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRef.trim()) return;
    navigate(`/officer/handover?ref=${encodeURIComponent(lookupRef.trim())}`);
  };

  const inCustody = foundItems.filter((i) => i.status === 'Found' || i.status === 'Under Verification');
  const readyForPickup = foundItems.filter((i) => i.status === 'Claim Approved');
  const valuableItems = foundItems.filter((i) => i.is_valuable === 1 && (i.status === 'Found' || i.status === 'Under Verification'));

  return (
    <div className="space-y-6">
      {/* ─── HERO BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-amber-500/10 rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-amber-400/5 rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Security Officer Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Officer Duty Console
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-semibold">{user?.full_name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                {user?.student_staff_id}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Admin Block · Room G-04
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/officer/handover"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <QrCode className="w-4 h-4" /> Process Handover
            </Link>
            <Link
              to="/report-found"
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <PackagePlus className="w-4 h-4" /> Register Property
            </Link>
          </div>
        </div>
      </div>

      {/* ─── VALUABLE ITEMS ALERT ─── */}
      {!loading && valuableItems.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {valuableItems.length} High-Value Item{valuableItems.length > 1 ? 's' : ''} in Custody
              </p>
              <p className="text-xs text-amber-700">These valuable items require secure handling and priority resolution.</p>
            </div>
          </div>
          <Link
            to="/officer/inventory"
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
          >
            View <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ─── METRICS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric
          value={loading ? '–' : inCustody.length}
          label="Items in Custody"
          sub="Currently stored in vault"
          icon={Layers}
          accent="bg-blue-600"
          bg="bg-blue-50 border-blue-100"
        />
        <Metric
          value={loading ? '–' : readyForPickup.length}
          label="Ready for Pickup"
          sub="Claim approved, awaiting student"
          icon={QrCode}
          accent="bg-amber-500"
          bg="bg-amber-50 border-amber-100"
        />
        <Metric
          value={loading ? '–' : handovers.length}
          label="Completed Handovers"
          sub="Officially signed off"
          icon={CheckCircle2}
          accent="bg-emerald-600"
          bg="bg-emerald-50 border-emerald-100"
        />
      </div>

      {/* ─── COLLECTION PASS LOOKUP ─── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-campus-100 text-campus-600 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quick Handover Pass Lookup</h3>
            <p className="text-xs text-slate-500">Enter a Claim Reference or Student ID to verify and release property</p>
          </div>
        </div>

        <form onSubmit={handleLookupSubmit} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value)}
              placeholder="CLAIM-2026-00452 or STU-2024-8891"
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-campus-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shrink-0 transition-colors"
          >
            Lookup &rarr;
          </button>
        </form>
      </div>

      {/* ─── BOTTOM GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Handovers */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Recent Handovers
              </h3>
              <p className="text-xs text-slate-500">Completed property returns audit trail</p>
            </div>
            <Link to="/officer/history" className="text-xs font-semibold text-campus-600 hover:text-campus-800 flex items-center gap-1">
              Full History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : handovers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {handovers.slice(0, 5).map((h) => (
                <div key={h.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                      RET
                    </div>
                    <div>
                      <p className="font-mono text-slate-400 text-[10px]">#{h.handover_reference}</p>
                      <p className="font-bold text-slate-900">{h.found_name || h.item_name}</p>
                      <p className="text-slate-500 text-[10px]">
                        Released to: <span className="font-semibold text-slate-700">{h.recipient_name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      Returned
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                      {h.handover_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No completed handovers recorded yet.
            </div>
          )}
        </div>

        {/* Items Awaiting Collection */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Awaiting Collection
              </h3>
              <p className="text-xs text-slate-500">Approved claims not yet picked up</p>
            </div>
            <Link to="/officer/inventory" className="text-xs font-semibold text-campus-600 hover:text-campus-800 flex items-center gap-1">
              Full Inventory <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : readyForPickup.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {readyForPickup.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={getImageUrl(item.image_url)!}
                        alt={item.item_name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-slate-400 text-[10px]">#{item.item_reference}</p>
                      <p className="font-bold text-slate-900">{item.item_name}</p>
                      <p className="text-slate-500 text-[10px]">{item.current_storage_location}</p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">
                    Ready
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No items awaiting collection right now.
            </div>
          )}
        </div>
      </div>

      {/* ─── QUICK NAV ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/officer', label: 'Security Desk', icon: ShieldCheck, color: 'text-slate-700 border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100' },
          { to: '/officer/handover', label: 'Process Handover', icon: QrCode, color: 'text-emerald-700 border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100' },
          { to: '/officer/inventory', label: 'Custody Inventory', icon: Layers, color: 'text-blue-700 border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100' },
          { to: '/officer/history', label: 'Handover History', icon: History, color: 'text-purple-700 border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-xs font-semibold ${item.color}`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};
