import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  PackagePlus,
  Upload,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Building,
  ShieldCheck,
  Lock,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { Category, CampusLocation } from '../../types';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_electronics', name: 'Electronics', icon: 'Cpu', status: 'active', created_at: '', description: '' },
  { id: 'cat_phones', name: 'Mobile Phones', icon: 'Smartphone', status: 'active', created_at: '', description: '' },
  { id: 'cat_laptops', name: 'Laptops', icon: 'Laptop', status: 'active', created_at: '', description: '' },
  { id: 'cat_tablets', name: 'Tablets', icon: 'Tablet', status: 'active', created_at: '', description: '' },
  { id: 'cat_student_ids', name: 'Student IDs', icon: 'CreditCard', status: 'active', created_at: '', description: '' },
  { id: 'cat_books', name: 'Books', icon: 'Book', status: 'active', created_at: '', description: '' },
  { id: 'cat_wallets', name: 'Wallets', icon: 'Wallet', status: 'active', created_at: '', description: '' },
  { id: 'cat_keys', name: 'Keys', icon: 'Key', status: 'active', created_at: '', description: '' },
  { id: 'cat_bags', name: 'Bags', icon: 'ShoppingBag', status: 'active', created_at: '', description: '' },
  { id: 'cat_clothing', name: 'Clothing', icon: 'Shirt', status: 'active', created_at: '', description: '' },
  { id: 'cat_academic', name: 'Academic Materials', icon: 'GraduationCap', status: 'active', created_at: '', description: '' },
  { id: 'cat_jewellery', name: 'Jewellery', icon: 'Watch', status: 'active', created_at: '', description: '' },
  { id: 'cat_documents', name: 'Documents', icon: 'FileText', status: 'active', created_at: '', description: '' },
  { id: 'cat_accessories', name: 'Accessories', icon: 'Glasses', status: 'active', created_at: '', description: '' },
  { id: 'cat_other', name: 'Other', icon: 'HelpCircle', status: 'active', created_at: '', description: '' }
];

const DEFAULT_LOCATIONS: CampusLocation[] = [
  { id: 'loc_library', name: 'Main Library', zone: 'Academic Zone', status: 'active', created_at: '', description: '' },
  { id: 'loc_ict_lab', name: 'ICT Laboratory', zone: 'Science & Tech', status: 'active', created_at: '', description: '' },
  { id: 'loc_block_a', name: 'Lecture Block L12', zone: 'Academic Zone', status: 'active', created_at: '', description: '' },
  { id: 'loc_block_b', name: 'Lecture Block L11', zone: 'Academic Zone', status: 'active', created_at: '', description: '' },
  { id: 'loc_theatre', name: 'Main Lecture L13', zone: 'Central Zone', status: 'active', created_at: '', description: '' },
  { id: 'loc_cafeteria', name: 'University Cafeteria', zone: 'Student Services', status: 'active', created_at: '', description: '' },
  { id: 'loc_admin', name: 'Administration Block', zone: 'Admin Zone', status: 'active', created_at: '', description: '' },
  { id: 'loc_hostels', name: 'Student Hostels / Hall', zone: 'Residential Zone', status: 'active', created_at: '', description: '' },
  { id: 'loc_sports', name: 'Sports Ground & Pavilion', zone: 'Sports Zone', status: 'active', created_at: '', description: '' },
  { id: 'loc_parking', name: 'Main Parking Area', zone: 'Perimeter', status: 'active', created_at: '', description: '' },
  { id: 'loc_science_lab', name: 'Science Complex Laboratories', zone: 'Science & Tech', status: 'active', created_at: '', description: '' },
  { id: 'loc_student_center', name: 'MULTIPURPOSE HALL', zone: 'Student Services', status: 'active', created_at: '', description: '' }
];

export const ReportFoundPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [locations, setLocations] = useState<CampusLocation[]>(DEFAULT_LOCATIONS);

  const [formData, setFormData] = useState({
    item_name: '',
    category_id: 'cat_electronics',
    description: '',
    color: 'Black',
    date_found: new Date().toISOString().split('T')[0],
    approximate_time: '14:00',
    location_id: 'loc_library',
    current_storage_location: 'Central Security Office - Desk 1',
    is_handed_to_security: true,
    is_valuable: true,
    additional_notes: '',
    image_url: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<any | null>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await api.getMeta();
        if (meta.categories && meta.categories.length > 0) {
          setCategories(meta.categories);
          setFormData(prev => ({
            ...prev,
            category_id: prev.category_id && meta.categories.some((c: any) => c.id === prev.category_id) ? prev.category_id : meta.categories[0].id
          }));
        }
        if (meta.locations && meta.locations.length > 0) {
          setLocations(meta.locations);
          setFormData(prev => ({
            ...prev,
            location_id: prev.location_id && meta.locations.some((l: any) => l.id === prev.location_id) ? prev.location_id : meta.locations[0].id
          }));
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMeta();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData({ ...formData, [target.name]: value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be under 5MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_name || !formData.category_id || !formData.description || !formData.location_id || !formData.current_storage_location) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let uploadedUrl = formData.image_url;
      if (imageFile) {
        try {
          const uploadRes = await api.uploadImage(imageFile);
          uploadedUrl = uploadRes.url;
        } catch (uploadErr) {
          console.warn('Image upload fallback to preview:', uploadErr);
        }
      }

      const payload = {
        ...formData,
        image_url: uploadedUrl || null,
      };

      const res = await api.reportFoundItem(payload);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setCreatedItem(res.item);
    } catch (err: any) {
      setError(err.message || 'Failed to submit found report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Step 1: Found Property Registration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans mt-2">
          Report a Found Item
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Log an item discovered on campus so the rightful student or staff member can identify and reclaim it.
        </p>
      </div>

      {createdItem ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Found Property Successfully Logged!</h2>
            <p className="text-xs text-slate-600">
              Generated Property Reference:{' '}
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-sm">
                {createdItem.item_reference}
              </span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs text-slate-700 space-y-2 max-w-lg mx-auto">
            <p className="font-bold text-slate-900">Important Reminders for Finders:</p>
            <p>1. If this is a high-value item (laptop, phone, ID, wallet), please hand it to Campus Security (Admin Bldg Room G-04) if not already done.</p>
            <p>2. The campus matching engine has scanned active lost reports and alerted potential owners.</p>
            <p>3. Thank you for contributing to an honest university campus community!</p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/items/found/${createdItem.id}`)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              View Found Item &rarr;
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Item Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Found Item Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Title / General Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleChange}
                  placeholder="e.g. HP Pavilion Laptop / Blue Campus Student ID"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Color <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g. Black, Silver, Navy Blue, Red"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  General Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the visible condition, brand, and where exactly in the room/hall it was found..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Custody */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Discovery Location & Current Custody
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campus Location Found <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  name="location_id"
                  value={formData.location_id}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date Found <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  name="date_found"
                  value={formData.date_found}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Approximate Time
                </label>
                <input
                  type="time"
                  name="approximate_time"
                  value={formData.approximate_time}
                  onChange={handleChange}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Where is the item currently stored? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="current_storage_location"
                  value={formData.current_storage_location}
                  onChange={handleChange}
                  placeholder="e.g. Handed to Main Security Office - Desk 2, or With Finder in Room 204"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Checkbox: Handed to Security */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_handed_to_security"
                  checked={formData.is_handed_to_security}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">
                  Item has been deposited at University Security / Lost Property Desk
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_valuable"
                  checked={formData.is_valuable}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">
                  Valuable Item (Phone, Laptop, ID, Wallet) — Mask sensitive details publicly
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Notes & Photo */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Private Notes & Photograph
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Internal Verification Notes (Hidden from Public View)
              </label>
              <p className="text-[11px] text-slate-500 mb-1">
                Note secret details (e.g. exact stickers, serial numbers, wallpapers) for officers to verify against claimant evidence.
              </p>
              <input
                type="text"
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleChange}
                placeholder="e.g. Lockscreen has photo of dog; React sticker on cover"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Found Item Photo
              </label>
              <div className="mt-1 flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full hover:bg-slate-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-600">Click to upload photo</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              {loading ? 'Logging Found Item...' : 'Submit Found Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
