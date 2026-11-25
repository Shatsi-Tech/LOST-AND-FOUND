import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, CheckCircle2, AlertCircle, Building } from 'lucide-react';
import { api } from '../../services/api';
import { CampusLocation } from '../../types';
import { Modal } from '../../components/Modal';

export const AdminLocations: React.FC = () => {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<CampusLocation | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('Academic Zone');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminLocations();
      setLocations(res.locations);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setName('');
    setDescription('');
    setZone('Academic Zone');
    setStatus('active');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (loc: CampusLocation) => {
    setEditingLocation(loc);
    setName(loc.name);
    setDescription(loc.description || '');
    setZone(loc.zone || 'Academic Zone');
    setStatus(loc.status);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Location name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingLocation) {
        await api.updateLocation(editingLocation.id, { name, description, zone, status });
      } else {
        await api.createLocation({ name, description, zone });
      }
      setModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (loc: CampusLocation) => {
    try {
      const newStatus = loc.status === 'active' ? 'inactive' : 'active';
      await api.updateLocation(loc.id, { status: newStatus });
      fetchLocations();
    } catch (err) {
      console.error('Failed to toggle location status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
            Campus Venue & Location Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure buildings, lecture halls, laboratories, and outdoor zones
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Campus Location
        </button>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Campus Zone</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Incidents</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-campus-600" />
                      {loc.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {loc.zone || 'Campus'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                      {loc.description || 'General venue'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                      {(loc.lost_count || 0) + (loc.found_count || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleStatus(loc)}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                          loc.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${loc.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span className="capitalize">{loc.status}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLocation ? 'Edit Campus Location' : 'Add Campus Location'}
        subtitle="Manage building, room, or outdoor area details"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Science Complex Chemistry Wet Lab"
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Campus Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
            >
              <option value="Academic Zone">Academic Zone</option>
              <option value="Science & Tech">Science & Tech</option>
              <option value="Student Services">Student Services</option>
              <option value="Residential Zone">Residential Zone</option>
              <option value="Sports Zone">Sports Zone</option>
              <option value="Admin Zone">Admin Zone</option>
              <option value="Perimeter & Parking">Perimeter & Parking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Building floor, room number, or access guidance..."
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>

          {editingLocation && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
