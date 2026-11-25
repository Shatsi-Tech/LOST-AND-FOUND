import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { Modal } from './Modal';
import { FoundItem } from '../types';
import { api, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  foundItem: FoundItem;
  onClaimSubmitted?: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  foundItem,
  onClaimSubmitted,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Form Fields
  const [ownershipEvidence, setOwnershipEvidence] = useState('');
  const [identifyingMarks, setIdentifyingMarks] = useState('');
  const [purchaseInfo, setPurchaseInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownershipEvidence.trim()) {
      setError('Please provide detailed evidence or unique characteristics proving your ownership.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.submitClaim({
        found_item_id: foundItem.id,
        ownership_evidence: ownershipEvidence,
        identifying_marks: identifyingMarks,
        purchase_info: purchaseInfo,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSuccessData(res.claim);
      setStep(4);
      if (onClaimSubmitted) onClaimSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError(null);
    setSuccessData(null);
    setOwnershipEvidence('');
    setIdentifyingMarks('');
    setPurchaseInfo('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit Ownership Claim"
      subtitle={`Claiming Property #${foundItem.item_reference} - ${foundItem.item_name}`}
      maxWidth="2xl"
    >
      {/* Step Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span className={step >= 1 ? 'text-campus-600 font-bold' : ''}>1. Item Summary</span>
          <span className={step >= 2 ? 'text-campus-600 font-bold' : ''}>2. Ownership Proof</span>
          <span className={step >= 3 ? 'text-campus-600 font-bold' : ''}>3. Review & Submit</span>
          <span className={step >= 4 ? 'text-emerald-600 font-bold' : ''}>4. Status</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-campus-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Confirmation */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-campus-50/60 border border-campus-100 rounded-xl p-4 flex gap-4 items-center">
            {foundItem.image_url ? (
              <img
                src={getImageUrl(foundItem.image_url)!}
                alt={foundItem.item_name}
                className="w-16 h-16 rounded-lg object-cover border border-campus-200 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-campus-100 flex items-center justify-center text-campus-600 shrink-0 font-bold">
                {foundItem.category_name?.[0] || 'I'}
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-campus-700">Reference: {foundItem.item_reference}</span>
              <h4 className="text-sm font-bold text-slate-900">{foundItem.item_name}</h4>
              <p className="text-xs text-slate-600 mt-0.5">Found at: {foundItem.location_name} on {foundItem.date_found}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-900">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">Campus Verification Notice</span>
              To prevent unauthorized or fraudulent claims, all claims are verified by Campus Security officers. You will be asked to provide identifying proof that only the legitimate owner would know.
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              Continue to Provide Proof <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Proof & Evidence */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Description & Secret Characteristics <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Describe unique features known only to you (e.g., serial number, internal contents, lockscreen wallpaper, stickers, scratches, distinct case color).
            </p>
            <textarea
              required
              rows={3}
              value={ownershipEvidence}
              onChange={(e) => setOwnershipEvidence(e.target.value)}
              placeholder="e.g. Serial number ends in 8829; back cover has a blue Octocat sticker; wallpaper is a mountain photo..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Identifying Marks & Known Contents (Optional)
            </label>
            <input
              type="text"
              value={identifyingMarks}
              onChange={(e) => setIdentifyingMarks(e.target.value)}
              placeholder="e.g. Left hinge is slightly stiff; contains student ID card..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Purchase or Registration Information (Optional)
            </label>
            <input
              type="text"
              value={purchaseInfo}
              onChange={(e) => setPurchaseInfo(e.target.value)}
              placeholder="e.g. Purchased at University Bookstore Fall 2024; registered under my campus email..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-transparent"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              &larr; Back
            </button>
            <button
              type="button"
              disabled={!ownershipEvidence.trim()}
              onClick={() => setStep(3)}
              className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              Review Claim <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Submit */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block">Claimant:</span>
              <span className="font-bold text-slate-900">{user?.full_name} ({user?.student_staff_id})</span>
              <span className="text-slate-500 block">{user?.email}</span>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-500 block">Claimed Item:</span>
              <span className="font-bold text-slate-900">{foundItem.item_name} (#{foundItem.item_reference})</span>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-500 block">Submitted Evidence:</span>
              <p className="text-slate-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-slate-200">
                "{ownershipEvidence}"
              </p>
            </div>
          </div>

          <div className="p-3 bg-campus-50 border border-campus-200 rounded-xl text-[11px] text-campus-900">
            <ShieldCheck className="w-4 h-4 inline-block mr-1 text-campus-600" />
            By submitting this claim, I confirm under university honor code that this item belongs to me and the information provided is truthful.
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              &larr; Edit Details
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-colors"
            >
              {loading ? 'Submitting Claim...' : 'Confirm & Submit Claim'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900">Claim Registered Successfully!</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Your claim reference is{' '}
              <span className="font-mono font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded border border-campus-200">
                {successData?.claim_reference || 'CLAIM-PENDING'}
              </span>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-700 space-y-1.5 max-w-md mx-auto">
            <p className="font-semibold text-slate-900">Next Steps:</p>
            <p>1. Campus staff will review your provided evidence against the physical item.</p>
            <p>2. You will receive an in-app notification once the claim is approved.</p>
            <p>3. Upon approval, bring your student ID and Collection Pass to the campus security desk for handover.</p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Done & View My Claims
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
