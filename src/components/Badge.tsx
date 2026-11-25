import React from 'react';
import { ItemStatus, ClaimStatus } from '../types';

interface BadgeProps {
  status: ItemStatus | ClaimStatus | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '', size = 'md' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  const s = (status || '').toLowerCase();

  if (s === 'lost') {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (s === 'found') {
    colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (s === 'possible match') {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
    dotColor = 'bg-amber-500';
  } else if (s === 'under verification' || s === 'under review') {
    colorStyles = 'bg-purple-50 text-purple-700 border-purple-200';
    dotColor = 'bg-purple-500';
  } else if (s === 'claim approved' || s === 'approved') {
    colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-600';
  } else if (s === 'returned' || s === 'completed') {
    colorStyles = 'bg-teal-50 text-teal-800 border-teal-200';
    dotColor = 'bg-teal-600';
  } else if (s === 'rejected') {
    colorStyles = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  } else if (s === 'pending') {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (s === 'info requested') {
    colorStyles = 'bg-orange-50 text-orange-800 border-orange-200';
    dotColor = 'bg-orange-500';
  } else if (s === 'unclaimed') {
    colorStyles = 'bg-gray-100 text-gray-700 border-gray-300';
    dotColor = 'bg-gray-400';
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${colorStyles} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
