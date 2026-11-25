import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, AlertCircle, CheckCircle, PackageCheck, UserCheck } from 'lucide-react';
import { Modal } from './Modal';
import { Claim } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim;
  onHandoverComplete?: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  claim,
  onHandoverComplete,
}) => {
  const { user: officer } = useAuth();
  const [idVerified, setIdVerified] = useState(true);
  const [itemVerified, setItemVerified] = useState(true);
  const [claimantConfirmed, setClaimantConfirmed] = useState(true);
  const [signatureName, setSignatureName] = useState(claim.claimant_name || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idVerified || !itemVerified || !claimantConfirmed) {
      setError('Please complete all physical verification checklist items.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.completeHandover({
        claim_id: claim.id,
        id_verified: idVerified,
        signature_name: signatureName,
        notes: notes || 'Verified and handed over at security desk.',
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onHandoverComplete) onHandoverComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete handover');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Physical Item Handover"
      subtitle={`Processing Return for Collection #${claim.claim_reference}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Claim & Recipient Summary */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Recipient Student</span>
            <span className="font-bold text-slate-900">{claim.claimant_name}</span>
            <span className="font-mono text-slate-600 block">{claim.claimant_student_id}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Property to Release</span>
            <span className="font-bold text-slate-900">{claim.found_name}</span>
            <span className="font-mono text-slate-600 block">{claim.found_reference}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200">
            <span className="text-slate-500 block">Current Storage Location:</span>
            <span className="font-semibold text-campus-800">{claim.current_storage_location || 'Central Security Desk'}</span>
          </div>
        </div>

        {/* Physical Verification Checklist */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Officer Verification Checklist <span className="text-rose-500">*</span>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={idVerified}
              onChange={(e) => setIdVerified(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-campus-600 rounded border-slate-300 focus:ring-campus-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" /> Physical Student / Staff ID Verified
              </span>
              <span className="text-slate-500">I have physically inspected the student's university photo ID and confirmed their identity.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={itemVerified}
              onChange={(e) => setItemVerified(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-campus-600 rounded border-slate-300 focus:ring-campus-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-emerald-600" /> Property Serial / Evidence Confirmed
              </span>
              <span className="text-slate-500">Physical item serial number, marks, or device passcode verified in presence of student.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={claimantConfirmed}
              onChange={(e) => setClaimantConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-campus-600 rounded border-slate-300 focus:ring-campus-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Recipient Handover Confirmation
              </span>
              <span className="text-slate-500">The recipient has acknowledged receipt of their property in satisfactory condition.</span>
            </div>
          </label>
        </div>

        {/* Handover Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Digital Sign-off Name
            </label>
            <input
              type="text"
              required
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Authorizing Officer
            </label>
            <input
              type="text"
              disabled
              value={`${officer?.full_name || 'Officer'} (${officer?.student_staff_id || 'SEC-01'})`}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Officer Handover Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Device powered on and unlocked with PIN; signed off without damages."
            className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !idVerified || !itemVerified || !claimantConfirmed}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Processing Handover...' : 'Sign & Complete Handover'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
