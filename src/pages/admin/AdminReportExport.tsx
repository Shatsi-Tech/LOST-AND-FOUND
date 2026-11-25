import React, { useState } from 'react';
import { DownloadCloud, Printer, FileText, Tag, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const AdminReportExport: React.FC = () => {
  const [exportType, setExportType] = useState<'lost' | 'found' | 'claims' | 'handovers'>('lost');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedType, setLoadedType] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    setLoading(true);
    try {
      const res = await api.exportReport(exportType);
      setData(res.data);
      setLoadedType(exportType);
    } catch (err: any) {
      alert(err.message || 'Failed to generate report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `apex_campus_${exportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
          Campus Report Generation & Data Export
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Generate formal PDF printable reports and CSV datasets for university council review
        </p>
      </div>

      {/* Control Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Select Report Category
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { id: 'lost', label: 'Lost Property Incidents', icon: FileText, color: 'text-rose-600' },
            { id: 'found', label: 'Discovered Property Vault', icon: Tag, color: 'text-emerald-600' },
            { id: 'claims', label: 'Ownership Claims Registry', icon: Award, color: 'text-purple-600' },
            { id: 'handovers', label: 'Handover & Return Ledger', icon: CheckCircle2, color: 'text-teal-600' },
          ].map((opt) => {
            const Icon = opt.icon;
            const isSelected = exportType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setExportType(opt.id as any)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-campus-500 bg-campus-50/70 shadow-sm font-bold'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${opt.color}`} />
                <span className="text-xs font-bold text-slate-900">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGeneratePreview}
            disabled={loading}
            className="px-6 py-2.5 bg-campus-600 hover:bg-campus-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            {loading ? 'Compiling Report...' : 'Generate Live Preview'}
          </button>

          {data.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <DownloadCloud className="w-4 h-4" /> Download CSV ({data.length} records)
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print PDF Summary
              </button>
            </>
          )}
        </div>
      </div>

      {/* Printable Section / Data Table */}
      {data.length > 0 && (
        <div id="printable-section" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-campus-700 font-bold block">
                Apex University Official Property Report
              </span>
              <h2 className="text-xl font-bold text-slate-900 capitalize">
                {loadedType} Dataset Records ({data.length} total)
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Report Generated: {new Date().toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  {Object.keys(data[0]).map((k) => (
                    <th key={k} className="py-2.5 px-3 whitespace-nowrap">
                      {k.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    {Object.values(row).map((val: any, vIdx) => (
                      <td key={vIdx} className="py-2.5 px-3 max-w-xs truncate text-slate-700">
                        {String(val || 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
