import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Award,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { LostItem, FoundItem, ItemMatch } from '../../types';
import { ClaimModal } from '../../components/ClaimModal';

export const StudentMatchesPage: React.FC = () => {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [itemMatchesMap, setItemMatchesMap] = useState<Record<string, ItemMatch[]>>({});
  const [loading, setLoading] = useState(true);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [activeFoundForClaim, setActiveFoundForClaim] = useState<FoundItem | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const lostRes = await api.getMyLostItems();
      setLostItems(lostRes.items);

      const matchesMap: Record<string, ItemMatch[]> = {};
      for (const item of lostRes.items) {
        const details = await api.getLostItemDetails(item.id);
        if (details.matches && details.matches.length > 0) {
          matchesMap[item.id] = details.matches;
        }
      }
      setItemMatchesMap(matchesMap);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const totalMatchesCount = Object.values(itemMatchesMap).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-extrabold text-slate-900 font-sans">
            Smart Possible Matches
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Automated multi-factor similarity scanning across campus lost & found records
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : totalMatchesCount > 0 ? (
        <div className="space-y-6">
          {lostItems.map((lost) => {
            const matches = itemMatchesMap[lost.id];
            if (!matches || matches.length === 0) return null;

            return (
              <div key={lost.id} className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6 space-y-4">
                {/* Lost Item Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                      Your Lost Report
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {lost.item_name}{' '}
                      <span className="font-mono text-xs text-slate-500 font-normal">
                        (#{lost.item_reference})
                      </span>
                    </h3>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
                    {matches.length} Possible Match{matches.length > 1 ? 'es' : ''}
                  </span>
                </div>

                {/* Matches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-mono text-[11px] font-bold text-slate-600">
                              #{m.found_reference}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{m.found_name}</h4>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm shrink-0">
                            {m.match_score}% Match
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-campus-600" />
                            Location: {m.found_location_name}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-campus-600" />
                            Date: {m.date_found}
                          </p>
                        </div>

                        {/* Match Indicators */}
                        <div className="mt-3 p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                          <span className="font-bold block mb-0.5">Similarity Factors:</span>
                          {m.match_reason}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-amber-200 flex items-center justify-between gap-2">
                        <Link
                          to={`/items/found/${m.found_item_id}`}
                          className="text-xs font-semibold text-campus-600 hover:text-campus-800"
                        >
                          View Item &rarr;
                        </Link>

                        <button
                          onClick={() => {
                            setActiveFoundForClaim({
                              id: m.found_item_id,
                              item_reference: m.found_reference || 'FOUND-REF',
                              item_name: m.found_name || 'Item',
                              color: m.found_color || '',
                              date_found: m.date_found || '',
                              location_name: m.found_location_name,
                              category_name: m.found_category_name,
                              current_storage_location: m.current_storage_location || 'Security Desk',
                              is_handed_to_security: 1,
                              is_valuable: 1,
                              status: 'Found',
                              description: '',
                              reporter_id: '',
                              category_id: '',
                              location_id: '',
                              created_at: '',
                              updated_at: '',
                            });
                            setClaimModalOpen(true);
                          }}
                          className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                        >
                          Claim This Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Match Alerts Currently</h3>
          <p>
            When a found item matching your report is logged by campus security or students, it will appear here with similarity breakdown.
          </p>
        </div>
      )}

      {/* Claim Modal */}
      {activeFoundForClaim && (
        <ClaimModal
          isOpen={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setActiveFoundForClaim(null);
          }}
          foundItem={activeFoundForClaim}
          onClaimSubmitted={() => loadMatches()}
        />
      )}
    </div>
  );
};
