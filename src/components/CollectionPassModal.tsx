import React from 'react';
import { Printer, ShieldCheck, MapPin, Calendar, User, Clock, QrCode } from 'lucide-react';
import { Modal } from './Modal';
import { Claim } from '../types';

interface CollectionPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: Claim;
}

export const CollectionPassModal: React.FC<CollectionPassModalProps> = ({
  isOpen,
  onClose,
  claim,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Campus Collection Pass"
      subtitle="Authorized University Property Handover Voucher"
      maxWidth="2xl"
    >
      <div id="printable-section" className="space-y-6">
        {/* Pass Header Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-campus-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-gold-400 font-bold block mb-1">
                Apex University Campus Security
              </span>
              <h2 className="text-xl font-bold font-sans">Official Property Handover Pass</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Collection Reference</span>
              <span className="font-mono text-lg font-bold text-amber-400 tracking-wider">
                {claim.claim_reference}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 block">Claimant Name</span>
              <span className="font-semibold text-white">{claim.claimant_name || 'Student'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Student/Staff ID</span>
              <span className="font-semibold text-white font-mono">{claim.claimant_student_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Authorization Date</span>
              <span className="font-semibold text-white">{claim.reviewed_at ? claim.reviewed_at.split(' ')[0] : 'Authorized'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Pass Status</span>
              <span className="inline-flex items-center text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Approved
              </span>
            </div>
          </div>
        </div>

        {/* Item & Collection Station Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">Item Details</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Item Name:</span>
              <span className="font-semibold text-slate-800">{claim.found_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Property Ref:</span>
              <span className="font-mono font-semibold text-slate-800">{claim.found_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-medium text-slate-700">{claim.category_name || 'General'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Color:</span>
              <span className="font-medium text-slate-700">{claim.found_color}</span>
            </div>
          </div>

          <div className="p-4 bg-campus-50/70 border border-campus-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-campus-900 uppercase tracking-wider block">Designated Collection Office</span>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-campus-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">{claim.current_storage_location || 'Campus Security Central Office'}</span>
                <span className="text-slate-600">Administration Building, Ground Floor, Room G-04</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Clock className="w-4 h-4 text-campus-600 shrink-0" />
              <span className="text-slate-700">Mon - Fri: 08:30 AM – 05:00 PM</span>
            </div>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-950">
          <span className="font-bold block mb-1">What to Present at the Security Desk:</span>
          <p>1. Original Physical University Student ID Card or National ID.</p>
          <p>2. This Collection Pass (digital on smartphone or printed copy) with reference <strong>{claim.claim_reference}</strong>.</p>
          <p>3. If electronic device (phone/laptop), be prepared to unlock the device with your passcode in front of the officer.</p>
        </div>

        {/* Simulated Barcode / QR Code for Quick Scanning */}
        <div className="p-4 border border-dashed border-slate-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-lg flex items-center justify-center p-2">
              <QrCode className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-slate-900 block">{claim.claim_reference}</span>
              <span className="text-[11px] text-slate-500">Security Officer Scan Barcode / Verify Token</span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <div className="font-mono text-xs tracking-widest text-slate-600">||| | |||| | || ||| || ||||</div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Apex Security Token</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Save Pass
        </button>
      </div>
    </Modal>
  );
};
