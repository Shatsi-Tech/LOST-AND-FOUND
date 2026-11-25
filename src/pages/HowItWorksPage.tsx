import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Sparkles,
  Award,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Clock,
  MapPin,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Report Property',
      desc: 'Students and staff log lost or found items with approximate time, campus location, color, and descriptions. A unique university reference number (e.g., LOST-2026-0001 or FOUND-2026-0001) is automatically generated.',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      num: '02',
      title: 'Search & Filter',
      desc: 'Users can search the public campus database using keywords, categories, dates, colors, and specific campus locations (Library, ICT Labs, Lecture Blocks, Cafeteria, Sports Ground).',
      icon: Search,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      num: '03',
      title: 'Automated Smart Matching',
      desc: 'Our intelligent matching algorithm continuously calculates similarity scores between lost reports and found property based on category (30%), location (20%), color (15%), date proximity (15%), and keyword tokens (20%).',
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      num: '04',
      title: 'Submit Ownership Claim',
      desc: 'If you identify a found item that belongs to you, click "Claim Item" to submit private verification details (serial numbers, device lockscreen wallpapers, internal pocket contents, or purchase invoices).',
      icon: Award,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      num: '05',
      title: 'Staff Verification',
      desc: 'Authorized university administrators and security officers evaluate the claimant’s evidence against the physically stored item to prevent fraudulent or mistaken claims.',
      icon: ShieldCheck,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
    },
    {
      num: '06',
      title: 'Physical Handover & Recovery',
      desc: 'Upon claim approval, an Official Collection Pass with reference #CLAIM-2026-XXXX is generated. Present your physical Student ID at the Security Office to complete the return sign-off.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ];

  const faqs = [
    {
      q: 'What should I do if I find a valuable item like a laptop, phone, or wallet?',
      a: 'Please report it immediately on UniFind and hand it over to the nearest Campus Security Desk (Administration Building Room G-04 or Library Security Desk). The system will record you as the honest finder.',
    },
    {
      q: 'Why are some item details masked with "[Restricted]" in the catalog?',
      a: 'In compliance with Campus Privacy Bylaw §28, sensitive identifiers (such as phone IMEI numbers, full serials, and wallet internal contents) are hidden publicly so fraudulent claimants cannot misuse them.',
    },
    {
      q: 'How long are found items kept at the Campus Security Office?',
      a: 'All found items are stored securely for a statutory retention period of 60 days. Unclaimed items after 60 days are processed in accordance with university property regulations.',
    },
    {
      q: 'What identification do I need to collect an approved item?',
      a: 'You must bring your physical University Student/Staff ID card (or valid National Photo ID) and present your digital or printed Collection Pass containing your approved claim reference.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-campus-600 bg-campus-50 px-3 py-1 rounded-full border border-campus-200">
          Campus Property Guidelines
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
          How the Campus Lost & Found System Works
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          From reporting an incident to receiving automated match alerts and collecting your property, here is the complete 6-stage lifecycle.
        </p>
      </div>

      {/* 6 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-campus-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-200 font-mono">{step.num}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-campus-600">
                <span>Stage {idx + 1} of 6</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Office Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-2 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-bold border border-gold-500/30">
            <ShieldCheck className="w-4 h-4" /> Physical Collection Office
          </div>
          <h2 className="text-2xl font-bold font-sans">Central Security & Lost Property Desk</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All high-value items (laptops, phones, IDs, keys, wallets) are secured under 24/7 CCTV surveillance in the administration security vault.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-campus-400" /> Administration Block, Room G-04
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-campus-400" /> Mon - Fri: 08:30 AM – 05:00 PM
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center">
          <Link
            to="/report-lost"
            className="w-full text-center py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            Report Lost Item
          </Link>
          <Link
            to="/report-found"
            className="w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
          >
            Report Found Item
          </Link>
        </div>
      </div>

      {/* Campus FAQs */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 font-sans">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 mt-1">Common inquiries about campus lost & found protocols.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-campus-600 shrink-0 mt-0.5" />
                {faq.q}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
