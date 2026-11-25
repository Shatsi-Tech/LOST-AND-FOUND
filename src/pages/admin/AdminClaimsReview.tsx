import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  User,
  PackageCheck,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { Claim } from '../../types';
import { StatusBadge } from '../../components/Badge';

export const AdminClaimsReview: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showInfoInput, setShowInfoInput] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (query) params.query = query;

      const res = await api.getAllClaims(params);
      setClaims(res.claims);
      if (res.claims.length > 0 && !selectedClaim) {
        setSelectedClaim(res.claims[0]);
      } else if (selectedClaim) {
        const updated = res.claims.find(c => c.id === selectedClaim.id);
        setSelectedClaim(updated || res.claims[0] || null);
      }
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleReviewAction = async (status: 'Approved' | 'Rejected' | 'Info Requested' | 'Under Review') => {
    if (!selectedClaim) return;
    if (status === 'Rejected' && !rejectionReason.trim()) {
      alert('Please specify a rejection reason for the claimant.');
      return;
    }

    setActionLoading(true);
    try {
      await api.reviewClaim(selectedClaim.id, {
        status,
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      });

      if (status === 'Approved') {
        confetti({
          particleCount: 70,
          spread: 50,
          origin: { y: 0.6 },
        });
      }

      setActionMessage(`Claim status updated to "${status}" successfully.`);
      setShowRejectInput(false);
      setShowInfoInput(false);
      setRejectionReason('');
      setAdminNotes('');
      fetchClaims();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update claim');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
          Ownership Claims & Verification Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Review claimant ownership proof against discovered property records and authorize collection passes
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Info Requested'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-campus-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Claims' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchClaims()}
            placeholder="Search claim, student..."
            className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Claims List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 max-h-[750px] overflow-y-auto">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 text-xs text-slate-500 font-semibold">
            <span>Claims ({claims.length})</span>
            <span>Priority Queue</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : claims.length > 0 ? (
            claims.map((c) => {
              const isSelected = selectedClaim?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedClaim(c);
                    setShowRejectInput(false);
                    setShowInfoInput(false);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all text-xs space-y-2 ${
                    isSelected
                      ? 'border-campus-500 bg-campus-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-campus-700">{c.claim_reference}</span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{c.found_name}</h4>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>{c.claimant_name} ({c.claimant_student_id})</span>
                    <span className="font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No claims matching this filter.
            </div>
          )}
        </div>

        {/* Right: Detailed Claim Inspection & Verification (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {selectedClaim ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
                    {selectedClaim.claim_reference}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Claim Verification for "{selectedClaim.found_name}"
                  </h2>
                </div>
                <StatusBadge status={selectedClaim.status} size="md" />
              </div>

              {/* Side-by-side Evidence Grid (Section 12) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Claimant Details */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px]">
                    1. Claimant Information
                  </span>
                  <div className="space-y-1">
                    <p><span className="text-slate-500">Name:</span> <strong className="text-slate-800">{selectedClaim.claimant_name}</strong></p>
                    <p><span className="text-slate-500">Student ID:</span> <strong className="font-mono text-campus-700">{selectedClaim.claimant_student_id}</strong></p>
                    <p><span className="text-slate-500">Email:</span> <span className="text-slate-700">{selectedClaim.claimant_email}</span></p>
                    <p><span className="text-slate-500">Phone:</span> <span className="text-slate-700">{selectedClaim.claimant_phone || 'N/A'}</span></p>
                    <p><span className="text-slate-500">Date Claimed:</span> <span className="font-mono text-slate-600">{new Date(selectedClaim.created_at).toLocaleString()}</span></p>
                  </div>
                </div>

                {/* Found Property Record */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px]">
                    2. Physical Item Details
                  </span>
                  <div className="space-y-1">
                    <p><span className="text-slate-500">Title:</span> <strong className="text-slate-800">{selectedClaim.found_name}</strong></p>
                    <p><span className="text-slate-500">Ref:</span> <span className="font-mono text-slate-700">#{selectedClaim.found_reference}</span></p>
                    <p><span className="text-slate-500">Category:</span> <span className="text-slate-700">{selectedClaim.category_name}</span></p>
                    <p><span className="text-slate-500">Color:</span> <span className="text-slate-700">{selectedClaim.found_color}</span></p>
                    <p><span className="text-slate-500">Storage:</span> <strong className="text-campus-700">{selectedClaim.current_storage_location}</strong></p>
                  </div>
                </div>
              </div>

              {/* Submitted Private Evidence Box */}
              <div className="p-5 bg-campus-50/70 rounded-2xl border border-campus-200 text-xs space-y-3">
                <span className="font-bold text-campus-900 uppercase tracking-wider block text-[11px]">
                  Claimant's Submitted Ownership Evidence:
                </span>
                <div className="p-3.5 bg-white rounded-xl border border-campus-100 space-y-2">
                  <p className="text-slate-800 italic leading-relaxed">
                    "{selectedClaim.ownership_evidence}"
                  </p>
                  {selectedClaim.identifying_marks && (
                    <p className="text-slate-700 pt-2 border-t border-slate-100 text-[11px]">
                      <strong>Identifying Marks:</strong> {selectedClaim.identifying_marks}
                    </p>
                  )}
                  {selectedClaim.purchase_info && (
                    <p className="text-slate-700 text-[11px]">
                      <strong>Purchase/Registration Info:</strong> {selectedClaim.purchase_info}
                    </p>
                  )}
                </div>
              </div>

              {/* Rejection / Info Request Forms */}
              {showRejectInput && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-xs animate-in fade-in">
                  <label className="block font-bold text-rose-900">
                    Specify Rejection Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Serial number mismatch; physical item is a different sub-model..."
                    className="w-full text-xs rounded-xl border border-rose-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReviewAction('Rejected')}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {showInfoInput && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-xs animate-in fade-in">
                  <label className="block font-bold text-amber-900">
                    Instructions for Claimant (Request Additional Info)
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Please bring original purchase receipt or student card to Security Room G-04..."
                    className="w-full text-xs rounded-xl border border-amber-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInfoInput(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReviewAction('Info Requested')}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      Send Request
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons (Section 12) */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectInput(!showRejectInput);
                      setShowInfoInput(false);
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject Claim
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowInfoInput(!showInfoInput);
                      setShowRejectInput(false);
                    }}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Request Info
                  </button>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReviewAction('Approved')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all hover:scale-105"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Approve Claim & Authorize Voucher'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a claim from the left queue to inspect evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
