import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Printer,
  Tag,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { Handover } from '../../types';

export const HandoverHistoryPage: React.FC = () => {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHandoverHistory(query ? { query } : undefined);
      setHandovers(res.handovers);
    } catch (err) {
      console.error('Failed to load handover history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
            Property Return & Handover Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable physical collection registry signed by campus security officers
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" /> Print Return Log
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
            placeholder="Search by handover reference, claim reference, student name, or item..."
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Handover Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : handovers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Handover Ref</th>
                  <th className="py-3 px-4">Property Item</th>
                  <th className="py-3 px-4">Recipient Student</th>
                  <th className="py-3 px-4">Authorizing Officer</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Handover Notes</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {handovers.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-campus-700">
                      {h.handover_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{h.found_name || h.item_name}</span>
                      <span className="font-mono text-[11px] text-slate-400">Claim: #{h.claim_reference}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{h.recipient_name}</span>
                      <span className="font-mono text-[11px] text-slate-500">{h.recipient_student_id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">{h.officer_name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {h.handover_date} {h.handover_time}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {h.notes || 'ID verified & signed off'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Returned
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No completed return records matching your query.
          </div>
        )}
      </div>
    </div>
  );
};
