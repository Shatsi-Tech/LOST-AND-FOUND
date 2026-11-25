import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Phone, Mail, Clock, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: University Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-campus-600 flex items-center justify-center text-white font-bold text-base">
                U
              </div>
              <span className="font-bold text-white text-sm tracking-tight">Apex University UniFind</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              The centralized campus property management system for reporting, searching, verifying, and recovering lost and found items.
            </p>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Official Campus IT Service
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Quick Navigation</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/items" className="hover:text-white transition-colors">Browse Campus Items</Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-white transition-colors">Report Lost Property</Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-white transition-colors">Report Found Item</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">Campus Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Security & Lost Property Desk */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Lost Property Desk</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-campus-400 shrink-0 mt-0.5" />
                <span>Administration Building, Room G-04, Ground Floor</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-campus-400 shrink-0" />
                <span>Mon - Fri: 08:30 AM – 05:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-campus-400 shrink-0" />
                <span>+1 (555) 019-5520 (Security Desk)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-campus-400 shrink-0" />
                <span>lostandfound@campus.edu</span>
              </div>
            </div>
          </div>

          {/* Col 4: Campus Policies */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Campus Policies</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unclaimed property is securely stored for 60 days before campus auction or donation in accordance with University Property Regulation Bylaw §14.
            </p>
            <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300">
              <span className="font-bold text-white block mb-0.5">Campus Honor Code:</span>
              Submitting false claims is subject to disciplinary review by the Dean of Students.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Apex University Campus Lost & Found System. All rights reserved.</p>
          <p className="font-mono text-[11px]">System Release v1.0 • Powered by React & Express</p>
        </div>
      </div>
    </footer>
  );
};
