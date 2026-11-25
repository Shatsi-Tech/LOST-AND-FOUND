import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import { StatusBadge } from './Badge';
import { LostItem, FoundItem } from '../types';
import { getImageUrl } from '../services/api';

interface ItemCardProps {
  item: (LostItem | FoundItem) & { type?: 'lost' | 'found'; match_score?: number };
  type: 'lost' | 'found';
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, type }) => {
  const isFound = type === 'found' || ('date_found' in item);
  const dateStr = isFound ? (item as FoundItem).date_found : (item as LostItem).date_lost;
  const isValuable = isFound && (item as FoundItem).is_valuable === 1;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-campus-300 transition-all duration-200 flex flex-col h-full">
      {/* Top Image / Placeholder Banner */}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {item.image_url ? (
          <img
            src={getImageUrl(item.image_url)!}
            alt={item.item_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // fallback
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-4 text-center">
            <Tag className="w-10 h-10 mb-1 text-slate-300" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Campus Property</span>
          </div>
        )}

        {/* Reference pill */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-md shadow">
            {item.item_reference}
          </span>
        </div>

        {/* Match score badge if applicable */}
        {item.match_score && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              {item.match_score}% Match
            </span>
          </div>
        )}

        {/* Status Badge in corner if no match score */}
        {!item.match_score && (
          <div className="absolute top-3 right-3">
            <StatusBadge status={item.status} size="sm" />
          </div>
        )}

        {/* Privacy protected tag for valuable items */}
        {isValuable && (
          <div className="absolute bottom-2 left-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-900/90 text-amber-300 px-2 py-0.5 rounded backdrop-blur">
              <Lock className="w-3 h-3" /> Shielded Details
            </span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-campus-700 font-medium">
            <span className="px-2 py-0.5 rounded bg-campus-50 border border-campus-100 font-medium">
              {item.category_name || 'General'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-normal">{item.color}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-campus-600 transition-colors line-clamp-1">
            {item.item_name}
          </h3>

          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Meta details footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{item.location_name || 'Campus Venue'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateStr}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <Link
              to={`/items/${isFound ? 'found' : 'lost'}/${item.id}`}
              className="w-full text-center py-2 px-3 rounded-lg text-xs font-semibold bg-campus-50 text-campus-700 hover:bg-campus-600 hover:text-white transition-colors border border-campus-200 hover:border-transparent"
            >
              View Full Details &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
