import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Tag,
  PlusCircle,
  PackagePlus,
  Sparkles,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api, getImageUrl } from '../../services/api';
import { LostItem, FoundItem } from '../../types';
import { StatusBadge } from '../../components/Badge';

export const MyReportsPage: React.FC = () => {
  const [tab, setTab] = useState<'lost' | 'found'>('lost');
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [lostRes, foundRes] = await Promise.all([
        api.getMyLostItems(),
        api.getMyFoundItems(),
      ]);
      setLostItems(lostRes.items);
      setFoundItems(foundRes.items);
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleMarkRecovered = async (id: string) => {
    try {
      await api.updateLostItemStatus(id, 'Returned');
      fetchReports();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans">My Campus Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track and manage all lost and found property cases you have registered
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/report-lost"
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Report Lost
          </Link>
          <Link
            to="/report-found"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <PackagePlus className="w-4 h-4" /> Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setTab('lost')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'lost'
              ? 'bg-white text-rose-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lost Items ({lostItems.length})
        </button>
        <button
          onClick={() => setTab('found')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'found'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Found Items ({foundItems.length})
        </button>
      </div>

      {/* Content list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : tab === 'lost' ? (
        lostItems.length > 0 ? (
          <div className="space-y-4">
            {lostItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {item.image_url ? (
                    <img
                      src={getImageUrl(item.image_url)!}
                      alt={item.item_name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-lg shrink-0">
                      L
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {item.item_reference}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      {(item.match_count || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {item.match_count} Match{item.match_count! > 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.item_name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.location_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {item.date_lost}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  {item.status !== 'Returned' && (
                    <button
                      onClick={() => handleMarkRecovered(item.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Recovered
                    </button>
                  )}
                  <Link
                    to={`/items/lost/${item.id}`}
                    className="px-4 py-2 bg-campus-50 hover:bg-campus-600 hover:text-white text-campus-700 border border-campus-200 hover:border-transparent rounded-lg text-xs font-semibold transition-colors"
                  >
                    View Matches &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
            <p>You have not submitted any lost item reports yet.</p>
            <Link
              to="/report-lost"
              className="inline-block px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
            >
              Report a Lost Item
            </Link>
          </div>
        )
      ) : foundItems.length > 0 ? (
        <div className="space-y-4">
          {foundItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {item.image_url ? (
                  <img
                    src={getImageUrl(item.image_url)!}
                    alt={item.item_name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
                    F
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {item.item_reference}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                    {(item.claim_count || 0) > 0 && (
                      <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {item.claim_count} Claim{item.claim_count! > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{item.item_name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.location_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.date_found}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center shrink-0">
                <Link
                  to={`/items/found/${item.id}`}
                  className="px-4 py-2 bg-campus-50 hover:bg-campus-600 hover:text-white text-campus-700 border border-campus-200 hover:border-transparent rounded-lg text-xs font-semibold transition-colors"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
          <p>You have not logged any found items yet.</p>
          <Link
            to="/report-found"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            Report a Found Item
          </Link>
        </div>
      )}
    </div>
  );
};
