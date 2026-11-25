import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Search, MapPin, Building, PackagePlus, Edit2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { FoundItem } from '../../types';
import { StatusBadge } from '../../components/Badge';

export const OfficerFoundItemsPage: React.FC = () => {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingStorageId, setEditingStorageId] = useState<string | null>(null);
  const [newStorage, setNewStorage] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getFoundItems(query ? { query } : undefined);
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load found inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpdateStorage = async (id: string, currentStatus: string) => {
    if (!newStorage.trim()) return;
    try {
      await api.updateFoundItemStatus(id, {
        status: currentStatus,
        current_storage_location: newStorage.trim(),
      });
      setEditingStorageId(null);
      setNewStorage('');
      fetchItems();
    } catch (err) {
      console.error('Failed to update storage location:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
            Campus Found Property Vault & Custody
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage storage locker bins, custody transfer, and release readiness
          </p>
        </div>

        <Link
          to="/report-found"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <PackagePlus className="w-4 h-4" /> Register New Found Item
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
            placeholder="Search by property reference, title, or storage locker..."
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>
        <button
          onClick={fetchItems}
          className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-semibold"
        >
          Filter
        </button>
      </div>

      {/* Table */}
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
                  <th className="py-3 px-4">Property Item</th>
                  <th className="py-3 px-4">Found Venue & Date</th>
                  <th className="py-3 px-4">Current Vault Custody Location</th>
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
                      <span className="font-medium text-slate-800 block">{item.location_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.date_found}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {editingStorageId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newStorage}
                            onChange={(e) => setNewStorage(e.target.value)}
                            placeholder="Locker / Room"
                            className="text-xs border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-campus-500"
                          />
                          <button
                            onClick={() => handleUpdateStorage(item.id, item.status)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-campus-800 bg-campus-50 px-2 py-0.5 rounded border border-campus-100">
                            {item.current_storage_location}
                          </span>
                          <button
                            onClick={() => {
                              setEditingStorageId(item.id);
                              setNewStorage(item.current_storage_location);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Edit Storage Location"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/items/found/${item.id}`}
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
            No found property records available.
          </div>
        )}
      </div>
    </div>
  );
};
