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
        transition-all duration-300 ease-out transform-gpu
        backdrop-blur-xl shadow-lg shadow-black/20
        ${
          table.status === 'available'
            ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/[0.18] hover:border-emerald-400/50 hover:shadow-emerald-500/10'
            : table.status === 'pending'
            ? 'bg-amber-500/[0.08] border-amber-500/30 opacity-90'
            : table.status === 'occupied'
            ? 'bg-red-500/[0.06] border-red-500/20 opacity-70 cursor-not-allowed'
            : 'bg-sky-500/[0.06] border-sky-500/20 opacity-75'
        }
        ${isClickable
          ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
          : 'cursor-default'
        }
      `}
    >
      {/* Left glowing status indicator bar */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl transition-colors duration-300 ${
          table.status === 'available'
            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
            : table.status === 'pending'
            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
            : table.status === 'occupied'
            ? 'bg-red-400/80'
            : 'bg-sky-400/80'
        }`}
      />

      {/* Table label */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-serif text-xl font-bold text-[#F4EFE8] drop-shadow-sm">
          {table.label}
        </span>
        {isClickable && (
          <span className="text-[11px] font-medium text-amber-300/80 opacity-0 transition-opacity group-hover:opacity-100">
            {adminMode ? 'Tap to cycle' : 'Tap to book →'}
          </span>
        )}
      </div>

      {/* Capacity */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-[#A69E93]">
        <Users size={13} className="text-white/50" />
        <span>{table.capacity} seats</span>
      </div>

      {/* Status badge */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md border ${config.bg} ${config.color} ${config.border}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            table.status === 'available'
              ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]'
              : table.status === 'pending'
              ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.9)]'
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
