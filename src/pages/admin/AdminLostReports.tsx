import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, PlusCircle, Edit, Trash2, CheckCircle2, MapPin, Calendar, User } from 'lucide-react';
import { api } from '../../services/api';
import { LostItem } from '../../types';
import { StatusBadge } from '../../components/Badge';

export const AdminLostReports: React.FC = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLostReports = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.query = query;
      if (status !== 'all') params.status = status;
      const res = await api.getLostItems(params);
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load lost reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLostReports();
  }, [status]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateLostItemStatus(id, newStatus);
      fetchLostReports();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
            Lost Property Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            View, audit, search, and update status for all lost item incidents across campus
          </p>
        </div>

        <Link
          to="/report-lost"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Report New Lost Item
        </Link>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'Lost', 'Possible Match', 'Under Verification', 'Claim Approved', 'Returned', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                status === st
                  ? 'bg-campus-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Reports' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLostReports()}
            placeholder="Search report ref, student, title..."
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4">Campus Location & Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-campus-700">
                      {item.item_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{item.item_name}</span>
                      <span className="text-slate-500">{item.category_name} • {item.color}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{item.reporter_name || 'Student'}</span>
                      <span className="text-slate-500 text-[11px]">{item.contact_phone || 'No phone'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block">{item.location_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.date_lost}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs font-semibold rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-campus-500"
                      >
                        <option value="Lost">Lost</option>
                        <option value="Possible Match">Possible Match</option>
                        <option value="Under Verification">Under Verification</option>
                        <option value="Claim Approved">Claim Approved</option>
                        <option value="Returned">Returned</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/items/lost/${item.id}`}
                        className="text-xs font-semibold text-campus-600 hover:text-campus-800"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No lost reports matching current filter.
          </div>
        )}
      </div>
    </div>
  );
};
