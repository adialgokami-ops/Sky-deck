'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useRealtimeTables } from '@/hooks/useRealtimeTables';
import { useAutoExpiry } from '@/hooks/useAutoExpiry';
import { ZONES } from '@/lib/types';
import type { Table, Zone } from '@/lib/types';
import TableCard from '@/components/TableCard';
import BookingModal from '@/components/BookingModal';

export default function CustomerPage() {
  const { tables, loading } = useRealtimeTables();
  const [activeZone, setActiveZone] = useState<Zone>('Rooftop');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Run auto-expiry checker
  useAutoExpiry();

  const filteredTables = tables.filter((t) => t.zone === activeZone);

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0F0F12]">
      {/* Warm gradient glow effect */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-amber-100/50 dark:from-amber-900/8 via-transparent to-transparent" />
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-amber-100/40 dark:bg-amber-500/5 blur-[120px] rounded-full" />

      <div className="relative mx-auto max-w-2xl px-4 pb-8">
        {/* Header */}
        <header className="pb-6 pt-8 text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-5xl">
            Sky<span className="text-amber-600 dark:text-amber-400">Deck</span>
          </h1>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-stone-400 dark:text-white/40">
            <MapPin size={14} className="text-amber-600/60 dark:text-amber-400/60" />
            Live Table Availability
          </p>
        </header>

        {/* Zone Tabs */}
        <div className="mb-6 flex gap-2 rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.03] p-1.5 backdrop-blur-sm">
          {ZONES.map((zone) => {
            const count = tables.filter(
              (t) => t.zone === zone && t.status === 'available'
            ).length;
            const total = tables.filter((t) => t.zone === zone).length;

            return (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeZone === zone
                    ? 'bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-400 dark:text-white/40 hover:text-stone-600 dark:hover:text-white/60'
                }`}
              >
                <span className="block">{zone}</span>
                <span className={`text-xs ${
                  activeZone === zone ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-300 dark:text-white/25'
                }`}>
                  {count}/{total} free
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500" />
          </div>
        )}

        {/* Table Grid */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => {
                  if (table.status === 'available') {
                    setSelectedTable(table);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredTables.length === 0 && (
          <div className="py-20 text-center text-stone-400 dark:text-white/30">
            <p>No tables in this zone</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-stone-300 dark:text-white/20">
          <p>Rooftop Restaurant · Pimpri-Chinchwad, Pune</p>
        </footer>
      </div>

      {/* Booking Modal */}
      {selectedTable && (
        <BookingModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onBooked={() => {
            // Modal handles its own confirmation state
          }}
        />
      )}
    </div>
  );
}
