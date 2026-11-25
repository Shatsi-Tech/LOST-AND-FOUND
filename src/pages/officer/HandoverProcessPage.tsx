import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  User,
  PackageCheck,
  Printer,
  Calendar,
  Clock,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { Claim, Handover } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { HandoverModal } from '../../components/HandoverModal';

export const HandoverProcessPage: React.FC = () => {
  const { user: officer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [lookupTerm, setLookupTerm] = useState(initialRef);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [existingHandover, setExistingHandover] = useState<Handover | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [completedHandover, setCompletedHandover] = useState<Handover | null>(null);

  const handleLookup = async (termToUse?: string) => {
    const term = (termToUse || lookupTerm).trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setClaim(null);
    setExistingHandover(null);
    setCompletedHandover(null);

    try {
      const res = await api.lookupHandover(term);
      setClaim(res.claim);
      setExistingHandover(res.handover);
      setSearchParams({ ref: term });
    } catch (err: any) {
      setError(err.message || 'No matching claim found for this reference or student ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      handleLookup(initialRef);
    }
  }, [initialRef]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Campus Security Handover Desk
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans mt-2">
          Verify & Process Item Handover
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Lookup approved collection passes, inspect physical student identification, and record legal handover of university property.
        </p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Scan / Enter Collection Reference or Student ID
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={lookupTerm}
              onChange={(e) => setLookupTerm(e.target.value)}
              placeholder="e.g. CLAIM-2026-00452 or STU-2024-7744"
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shrink-0 transition-colors"
          >
            {loading ? 'Searching...' : 'Lookup Voucher'}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs mt-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Active Claim Details Card */}
      {claim && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 space-y-6">
          {/* Top Status Header */}
          <div
            className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              claim.status === 'Approved'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider bg-white/80 px-2.5 py-0.5 rounded shadow-xs">
                  {claim.claim_reference}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  Status: {claim.status}
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1 text-slate-900">
                Property Release Voucher: {claim.found_name}
              </h2>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-500 block">Current Property Status</span>
              <span className="font-bold text-slate-900 capitalize">
                {(claim as any).found_status || 'Under Custody'}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Student & Item Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Claimant / Student card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <User className="w-4 h-4 text-campus-600" /> Authorized Claimant Details
                </h3>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student Name:</span>
                    <span className="font-bold text-slate-900">{claim.claimant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student/Staff ID:</span>
                    <span className="font-mono font-bold text-campus-700">{claim.claimant_student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-700">{claim.claimant_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Faculty/Dept:</span>
                    <span className="text-slate-700">{claim.claimant_department || 'Campus Student'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Phone:</span>
                    <span className="text-slate-700">{claim.claimant_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Found Item Details */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <PackageCheck className="w-4 h-4 text-campus-600" /> Physical Item in Vault
                </h3>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Item Title:</span>
                    <span className="font-bold text-slate-900">{claim.found_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Property Ref:</span>
                    <span className="font-mono font-bold text-slate-900">{claim.found_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-700">{claim.category_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Color:</span>
                    <span className="text-slate-700">{claim.found_color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vault Location:</span>
                    <span className="font-semibold text-campus-700">{claim.current_storage_location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approved Evidence */}
            <div className="p-4 bg-campus-50/60 rounded-2xl border border-campus-200 text-xs space-y-1.5">
              <span className="font-bold text-campus-900 block">Verified Ownership Evidence:</span>
              <p className="text-slate-800 italic leading-relaxed bg-white p-3 rounded-xl border border-campus-100">
                "{claim.ownership_evidence}"
              </p>
              {claim.identifying_marks && (
                <p className="text-slate-700 text-[11px] pt-1">
                  <strong>Identifying Marks:</strong> {claim.identifying_marks}
                </p>
              )}
            </div>

            {/* Existing Handover Check */}
            {existingHandover ? (
              <div className="p-5 bg-teal-50 border border-teal-200 rounded-2xl text-xs space-y-2 text-teal-950">
                <div className="flex items-center gap-2 font-bold text-sm text-teal-900">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  Item Already Handed Over & Returned!
                </div>
                <p className="text-teal-800">
                  Handover Ref: <span className="font-mono font-bold">#{existingHandover.handover_reference}</span> on {existingHandover.handover_date} at {existingHandover.handover_time}.
                </p>
                <p className="text-slate-600 text-[11px]">
                  Notes: {existingHandover.notes || 'Normal sign-off.'}
                </p>
              </div>
            ) : claim.status === 'Approved' ? (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span>Student is present at the desk with required identification.</span>
                </div>

                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Verify ID & Complete Handover
                </button>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                This claim is currently <strong>{claim.status}</strong>. Only claims with <strong>Approved</strong> status can be physically handed over at the security desk.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {claim && (
        <HandoverModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          claim={claim}
          onHandoverComplete={() => {
            handleLookup(claim.claim_reference);
          }}
        />
      )}
    </div>
  );
};
