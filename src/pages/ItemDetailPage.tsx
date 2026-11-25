import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Tag,
  ShieldCheck,
  Award,
  ArrowLeft,
  Sparkles,
  Lock,
  Building,
  User,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { LostItem, FoundItem, ItemMatch } from '../types';
import { StatusBadge } from '../components/Badge';
import { ClaimModal } from '../components/ClaimModal';
import { useAuth } from '../context/AuthContext';

export const ItemDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: 'lost' | 'found'; id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isOfficer } = useAuth();

  const [lostItem, setLostItem] = useState<LostItem | null>(null);
  const [foundItem, setFoundItem] = useState<FoundItem | null>(null);
  const [matches, setMatches] = useState<ItemMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [activeFoundForClaim, setActiveFoundForClaim] = useState<FoundItem | null>(null);

  const isFound = type === 'found';

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (isFound) {
        const res = await api.getFoundItemDetails(id);
        setFoundItem(res.item);
      } else {
        const res = await api.getLostItemDetails(id);
        setLostItem(res.item);
        setMatches(res.matches || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch item details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [type, id]);

  const item = isFound ? foundItem : lostItem;
  const isOwner = user && item && ('reporter_id' in item) && item.reporter_id === user.id;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-campus-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading campus property record...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs">
          {error || 'Item not found in campus database.'}
        </div>
        <Link
          to="/items"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-campus-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Main Item Card Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Image Box */}
        <div className="lg:col-span-5 bg-slate-100 relative min-h-[300px] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
          {item.image_url ? (
            <img
              src={getImageUrl(item.image_url)!}
              alt={item.item_name}
              className="w-full h-full object-cover max-h-[420px]"
            />
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Tag className="w-16 h-16 mx-auto mb-2 text-slate-300" />
              <span className="text-xs uppercase font-bold tracking-wider">No Photo Attached</span>
            </div>
          )}

          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-slate-900/90 text-white text-xs font-bold font-mono rounded-lg shadow backdrop-blur">
              {item.item_reference}
            </span>
          </div>

          <div className="absolute top-4 right-4">
            <StatusBadge status={item.status} size="md" />
          </div>
        </div>

        {/* Right: Item Information */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-campus-50 text-campus-700 font-bold border border-campus-200">
                {item.category_name || 'General Category'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-700">{item.color}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-mono text-[11px]">
                {isFound ? (item as FoundItem).date_found : (item as LostItem).date_lost}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans leading-tight">
              {item.item_name}
            </h1>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="font-semibold text-slate-700 mb-1">General Description:</p>
              {item.description}
            </div>

            {/* Privacy notice for shielded items */}
            {isFound && (item as FoundItem).is_valuable === 1 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Protected Sensitive Item:</span> Identifying serial numbers and internal contents are masked from public view. Owners must provide proof during the claim process.
                </div>
              </div>
            )}

            {/* Key specs grid */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Campus Location</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                  {item.location_name || 'Campus Grounds'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Approximate Time</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                  {item.approximate_time || 'Not specified'}
                </span>
              </div>

              {isFound && (
                <div className="col-span-2 p-3 rounded-xl bg-campus-50/70 border border-campus-200">
                  <span className="text-campus-900 block mb-0.5 font-bold">Current Physical Custody</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-campus-600 shrink-0" />
                    {(item as FoundItem).current_storage_location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            {isFound ? (
              <div className="w-full flex items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span>Found on campus? Verify ownership to collect.</span>
                </div>
                {item.status === 'Found' || item.status === 'Under Verification' ? (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login');
                        return;
                      }
                      setActiveFoundForClaim(item as FoundItem);
                      setClaimModalOpen(true);
                    }}
                    className="px-6 py-3 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Claim This Item
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    This item is {item.status.toLowerCase()}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full flex items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span>Reported by student on {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                {isOwner && item.status !== 'Returned' && (
                  <button
                    onClick={async () => {
                      await api.updateLostItemStatus(item.id, 'Returned');
                      fetchDetails();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Recovered
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SMART POSSIBLE MATCHES SECTION FOR LOST ITEMS (Section 10) */}
      {!isFound && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900">
                Automated Possible Matches ({matches.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Scanned across all campus found property
            </span>
          </div>

          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-700 block">
                        #{m.found_reference}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{m.found_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Found at {m.found_location_name} on {m.date_found}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        {m.match_score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Match Reason Breakdown */}
                  <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl text-[11px] text-amber-900">
                    <span className="font-bold block mb-0.5">Match Indicators:</span>
                    {m.match_reason}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <Link
                      to={`/items/found/${m.found_item_id}`}
                      className="text-xs font-semibold text-campus-600 hover:text-campus-800"
                    >
                      View Found Property &rarr;
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
                      className="px-4 py-1.5 bg-campus-600 hover:bg-campus-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      Claim This Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">No matching found property detected yet.</p>
              <p>The campus engine continuously monitors newly logged found items and will notify you when a match arrives.</p>
            </div>
          )}
        </div>
      )}

      {/* Claim Modal Wizard */}
      {activeFoundForClaim && (
        <ClaimModal
          isOpen={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setActiveFoundForClaim(null);
          }}
          foundItem={activeFoundForClaim}
          onClaimSubmitted={() => {
            fetchDetails();
          }}
        />
      )}
    </div>
  );
};
