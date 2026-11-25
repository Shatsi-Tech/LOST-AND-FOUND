import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  Clock,
  AlertCircle,
  QrCode,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Claim } from '../../types';
import { StatusBadge } from '../../components/Badge';
import { CollectionPassModal } from '../../components/CollectionPassModal';

export const MyClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassClaim, setSelectedPassClaim] = useState<Claim | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.getMyClaims();
      setClaims(res.claims);
    } catch (err) {
      console.error('Failed to load user claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
            My Claims & Handover Passes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track verification progress and access approved collection vouchers for security desk pickup
          </p>
        </div>

        <Link
          to="/items"
          className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-bold shadow-sm self-start sm:self-auto transition-colors"
        >
          Search Items to Claim &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isApproved = claim.status === 'Approved';
            const isRejected = claim.status === 'Rejected';

            return (
              <div
                key={claim.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm transition-all space-y-4 ${
                  isApproved
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : isRejected
                    ? 'border-rose-200'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {claim.claim_reference}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      Target: #{claim.found_reference}
                    </span>
                    <StatusBadge status={claim.status} size="sm" />
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    Submitted: {new Date(claim.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Body Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 block uppercase font-bold text-[10px]">Claimed Item</span>
                    <h3 className="text-sm font-bold text-slate-900">{claim.found_name}</h3>
                    <p className="text-slate-500">{claim.category_name} • {claim.found_color}</p>
                    <p className="text-slate-600 flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                      {claim.current_storage_location || 'Campus Security Desk'}
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-bold block text-[11px]">Your Submitted Ownership Evidence:</span>
                    <p className="text-slate-700 italic leading-relaxed">
                      "{claim.ownership_evidence}"
                    </p>
                    {claim.identifying_marks && (
                      <p className="text-slate-600 text-[11px]">
                        <strong>Marks:</strong> {claim.identifying_marks}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Decision Box */}
                {isApproved && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-950">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-sm">Claim Approved by Campus Security!</span>
                        <p className="text-emerald-800 mt-0.5">
                          Please bring your original student ID and this Collection Pass to the Security Office to collect your property.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPassClaim(claim)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm shrink-0 transition-colors"
                    >
                      <QrCode className="w-4 h-4" /> View Collection Pass
                    </button>
                  </div>
                )}

                {isRejected && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Claim Rejected</span>
                      <p className="text-rose-700 mt-0.5">
                        Reason: {claim.rejection_reason || 'Evidence provided did not match the physical property.'}
                      </p>
                    </div>
                  </div>
                )}

                {claim.status === 'Info Requested' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Additional Information Requested</span>
                      <p className="text-amber-800 mt-0.5">
                        {claim.admin_notes || 'Please visit the Security Office in person with secondary proof of purchase.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Claims Submitted Yet</h3>
          <p>
            When you find a matching item in the campus catalog, submit an ownership claim to begin the verification process.
          </p>
          <Link
            to="/items"
            className="inline-block px-5 py-2.5 bg-campus-600 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            Browse Campus Items
          </Link>
        </div>
      )}

      {/* Collection Pass Modal */}
      {selectedPassClaim && (
        <CollectionPassModal
          isOpen={!!selectedPassClaim}
          onClose={() => setSelectedPassClaim(null)}
          claim={selectedPassClaim}
        />
      )}
    </div>
  );
};
