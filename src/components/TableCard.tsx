'use client';

import { Users } from 'lucide-react';
import type { Table, TableStatus } from '@/lib/types';
import { STATUS_CONFIG } from '@/lib/types';

interface TableCardProps {
  table: Table;
  onClick?: () => void;
  /** If true, card is always clickable (admin mode) */
  adminMode?: boolean;
}

export default function TableCard({ table, onClick, adminMode }: TableCardProps) {
  const config = STATUS_CONFIG[table.status as TableStatus];
  const isClickable = adminMode || table.status === 'available';

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`
        group relative w-full rounded-2xl border p-4 text-left
        transition-all duration-300 ease-out
        ${config.border} ${config.bg}
        ${isClickable
          ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]'
          : 'cursor-default opacity-80'
        }
        ${config.glow}
        backdrop-blur-sm
      `}
    >
      {/* Status indicator line */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl transition-colors duration-300 ${
          table.status === 'available'
            ? 'bg-emerald-500'
            : table.status === 'pending'
            ? 'bg-amber-500'
            : table.status === 'occupied'
            ? 'bg-red-500'
            : 'bg-sky-500'
        }`}
      />

      {/* Table label */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-serif text-xl font-bold text-stone-800 dark:text-white/90">
          {table.label}
        </span>
        {isClickable && (
          <span className="text-xs text-stone-400 dark:text-white/30 opacity-0 transition-opacity group-hover:opacity-100">
            {adminMode ? 'Tap to cycle' : 'Tap to book'}
          </span>
        )}
      </div>

      {/* Capacity */}
      <div className="mb-3 flex items-center gap-1.5 text-sm text-stone-500 dark:text-white/50">
        <Users size={14} />
        <span>{table.capacity} seats</span>
      </div>

      {/* Status badge */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            table.status === 'available'
              ? 'bg-emerald-400 animate-pulse'
              : table.status === 'pending'
              ? 'bg-amber-400 animate-pulse'
              : table.status === 'occupied'
              ? 'bg-red-400'
              : 'bg-sky-400 animate-pulse'
          }`}
        />
        {config.label}
      </div>
    </button>
  );
}
