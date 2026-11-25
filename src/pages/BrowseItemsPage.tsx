import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  PackagePlus,
  SlidersHorizontal,
  X,
  Tag,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { LostItem, FoundItem, Category, CampusLocation } from '../types';
import { ItemCard } from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';

export const BrowseItemsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || 'all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load Categories & Locations metadata
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await api.getMeta();
        setCategories(meta.categories);
        setLocations(meta.locations);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch Items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.query = query;
      if (selectedCategory !== 'all') params.category_id = selectedCategory;
      if (selectedLocation !== 'all') params.location_id = selectedLocation;
      if (selectedColor !== 'all') params.color = selectedColor;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const [lostRes, foundRes] = await Promise.all([
        api.getLostItems(params),
        api.getFoundItems(params),
      ]);

      setLostItems(lostRes.items);
      setFoundItems(foundRes.items);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedLocation, selectedColor, selectedStatus, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedColor('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
    setSearchParams({});
  };

  // Filter items by active tab
  let displayItems: Array<(LostItem | FoundItem) & { itemType: 'lost' | 'found' }> = [];
  if (activeTab === 'all' || activeTab === 'found') {
    displayItems.push(...foundItems.map(item => ({ ...item, itemType: 'found' as const })));
  }
  if (activeTab === 'all' || activeTab === 'lost') {
    displayItems.push(...lostItems.map(item => ({ ...item, itemType: 'lost' as const })));
  }

  // Sort by date created desc
  displayItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-600 bg-campus-50 px-3 py-1 rounded-full border border-campus-200">
            Campus Property Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans mt-1.5">
            Browse Lost & Found Items
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Search verified reports and discovered property across Apex University campus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={isAuthenticated ? '/report-lost' : '/login'}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Report Lost
          </Link>
          <Link
            to={isAuthenticated ? '/report-found' : '/login'}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <PackagePlus className="w-4 h-4" /> Report Found
          </Link>
        </div>
      </div>

      {/* Main Search & Type Tabs Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Tabs: All, Found, Lost */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({foundItems.length + lostItems.length})
            </button>
            <button
              onClick={() => setActiveTab('found')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'found'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found Items ({foundItems.length})
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'lost'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Reports ({lostItems.length})
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-auto flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by keywords, reference ID (e.g. LOST-2026-0001), color, or brand..."
                className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-campus-500 font-sans"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-semibold shrink-0 shadow-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                filtersOpen
                  ? 'bg-campus-50 border-campus-300 text-campus-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </form>
        </div>

        {/* Filter Controls Accordion */}
        {filtersOpen && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-in fade-in duration-150">
            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Item Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campus Location */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Campus Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="all">All Campus Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.zone || 'Campus'})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lifecycle Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-campus-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Lost">Lost</option>
                <option value="Found">Found</option>
                <option value="Possible Match">Possible Match</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Claim Approved">Claim Approved</option>
                <option value="Returned">Returned</option>
                <option value="Unclaimed">Unclaimed</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2 px-3 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Item Grid Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item) => (
            <ItemCard
              key={`${item.itemType}_${item.id}`}
              item={item}
              type={item.itemType}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Matching Campus Items Found</h3>
          <p className="text-xs text-slate-500">
            We couldn't find any property matching your current search criteria. Try modifying your filters or submit a new report.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
