import React from 'react';

interface CategoryData {
  name: string;
  lost_count: number;
  found_count: number;
}

export const CategoryBarChart: React.FC<{ data: CategoryData[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 py-6 text-center">No category data recorded yet</div>;
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.lost_count, d.found_count)), 1);

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-end gap-4 text-xs mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-500" />
          <span className="text-slate-600 font-medium">Lost Items</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-campus-600" />
          <span className="text-slate-600 font-medium">Found Items</span>
        </div>
      </div>

      {data.map((cat, idx) => {
        const lostWidth = Math.round((cat.lost_count / maxVal) * 100);
        const foundWidth = Math.round((cat.found_count / maxVal) * 100);

        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>{cat.name}</span>
              <span className="text-slate-500 font-mono">
                {cat.lost_count} Lost / {cat.found_count} Found
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-3.5 bg-slate-100 rounded-full p-0.5 overflow-hidden">
              <div className="h-full bg-slate-100 rounded-full overflow-hidden flex justify-end">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(lostWidth, cat.lost_count > 0 ? 5 : 0)}%` }}
                />
              </div>
              <div className="h-full bg-slate-100 rounded-full overflow-hidden flex justify-start">
                <div
                  className="h-full bg-campus-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(foundWidth, cat.found_count > 0 ? 5 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const LocationHotspotsChart: React.FC<{ data: Array<{ name: string; lost_count: number; found_count: number }> }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 py-6 text-center">No location incident data available</div>;
  }

  const maxTotal = Math.max(...data.map(d => d.lost_count + d.found_count), 1);

  return (
    <div className="space-y-3 py-2">
      {data.map((loc, idx) => {
        const total = loc.lost_count + loc.found_count;
        const width = Math.round((total / maxTotal) * 100);

        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{loc.name}</span>
              <span className="font-mono text-slate-500 text-[11px]">
                {total} total incidents ({loc.lost_count} lost, {loc.found_count} found)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-amber-500 rounded-l-full transition-all duration-500"
                style={{ width: `${Math.round((loc.lost_count / (total || 1)) * width)}%` }}
                title={`${loc.lost_count} lost`}
              />
              <div
                className="h-full bg-teal-500 rounded-r-full transition-all duration-500"
                style={{ width: `${Math.round((loc.found_count / (total || 1)) * width)}%` }}
                title={`${loc.found_count} found`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
