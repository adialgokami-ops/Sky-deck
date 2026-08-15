'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  CheckCircle2,
  XCircle,
  Phone,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTables } from '@/hooks/useRealtimeTables';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { useAutoExpiry } from '@/hooks/useAutoExpiry';
import { ZONES, EXPIRY_MINUTES } from '@/lib/types';
import type { Table, TableStatus, Booking } from '@/lib/types';
import TableCard from '@/components/TableCard';

/** Admin table status cycle: available → occupied → cleaning → available */
const ADMIN_STATUS_CYCLE: Record<TableStatus, TableStatus> = {
  available: 'occupied',
  occupied: 'cleaning',
  cleaning: 'available',
  pending: 'available', // clicking a pending table releases it
};

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('skydeck_admin');
      if (stored === 'true') setIsAuthed(true);
    }
  }, []);

  const handlePinSubmit = useCallback(async () => {
    setPinLoading(true);
    setPinError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        // This is demo-only security, not production-grade.
        sessionStorage.setItem('skydeck_admin', 'true');
        setIsAuthed(true);
      } else {
        setPinError('Invalid PIN. Try again.');
      }
    } catch {
      setPinError('Network error. Try again.');
    } finally {
      setPinLoading(false);
    }
  }, [pin]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('skydeck_admin');
    setIsAuthed(false);
    setPin('');
  }, []);

  if (!isAuthed) {
    return <PinScreen
      pin={pin}
      setPin={setPin}
      error={pinError}
      loading={pinLoading}
      onSubmit={handlePinSubmit}
    />;
  }

  return <AdminDashboard
    showHistory={showHistory}
    setShowHistory={setShowHistory}
    onLogout={handleLogout}
  />;
}

// ── PIN Entry Screen ──────────────────────────────────────────────

function PinScreen({
  pin,
  setPin,
  error,
  loading,
  onSubmit,
}: {
  pin: string;
  setPin: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F0F12] px-4">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-amber-900/8 via-transparent to-transparent" />

      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1a22]/80 p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <Lock size={28} className="text-amber-400" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-white mb-2">
          Staff Access
        </h1>
        <p className="text-sm text-white/40 mb-6">
          Enter admin PIN to continue
        </p>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="Enter PIN"
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg tracking-[0.3em] text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
          autoFocus
        />

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        <button
          onClick={onSubmit}
          disabled={!pin || loading}
          className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? 'Verifying…' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────

function AdminDashboard({
  showHistory,
  setShowHistory,
  onLogout,
}: {
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  onLogout: () => void;
}) {
  const { tables } = useRealtimeTables();
  const { bookings } = useRealtimeBookings();
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const historyBookings = bookings
    .filter((b) => ['confirmed', 'cancelled', 'expired'].includes(b.status))
    .slice(0, 10);

  // Run auto-expiry
  useAutoExpiry();

  const cycleTableStatus = useCallback(async (table: Table) => {
    const nextStatus = ADMIN_STATUS_CYCLE[table.status];
    await supabase
      .from('tables')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', table.id);
  }, []);

  const confirmBooking = useCallback(async (booking: Booking) => {
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', booking.id);

    await supabase
      .from('tables')
      .update({ status: 'occupied', updated_at: new Date().toISOString() })
      .eq('id', booking.table_id);
  }, []);

  const releaseBooking = useCallback(async (booking: Booking) => {
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id);

    await supabase
      .from('tables')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', booking.table_id);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F12]">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-amber-900/8 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-5xl px-4 pb-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 pt-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-white">
              Sky<span className="text-amber-400">Deck</span>
              <span className="ml-3 text-sm font-sans font-normal text-white/30">
                Staff Panel
              </span>
            </h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </header>

        {/* ── Section 1: Live Table Grid ── */}
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl font-bold text-white/80">
            Live Table Grid
          </h2>

          {ZONES.map((zone) => {
            const zoneTables = tables.filter((t) => t.zone === zone);
            if (zoneTables.length === 0) return null;

            return (
              <div key={zone} className="mb-6">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/30">
                  {zone}
                </h3>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {zoneTables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      adminMode
                      onClick={() => cycleTableStatus(table)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Section 2: Request Queue ── */}
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl font-bold text-white/80 flex items-center gap-2">
            Request Queue
            {pendingBookings.length > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                {pendingBookings.length}
              </span>
            )}
          </h2>

          {pendingBookings.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-white/30">No pending requests</p>
            </div>
          )}

          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <BookingRequestCard
                key={booking.id}
                booking={booking}
                onConfirm={() => confirmBooking(booking)}
                onRelease={() => releaseBooking(booking)}
              />
            ))}
          </div>
        </section>

        {/* ── Section 3: Recent History (collapsible) ── */}
        <section>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mb-4 flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-3 text-left transition-colors hover:bg-white/[0.04]"
          >
            <h2 className="font-serif text-lg font-bold text-white/50">
              Recent History
            </h2>
            {showHistory ? (
              <ChevronUp size={18} className="text-white/30" />
            ) : (
              <ChevronDown size={18} className="text-white/30" />
            )}
          </button>

          {showHistory && (
            <div className="space-y-2">
              {historyBookings.length === 0 && (
                <p className="py-4 text-center text-sm text-white/25">No recent activity</p>
              )}
              {historyBookings.map((booking) => (
                <HistoryCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Booking Request Card ──────────────────────────────────────────

function BookingRequestCard({
  booking,
  onConfirm,
  onRelease,
}: {
  booking: Booking;
  onConfirm: () => void;
  onRelease: () => void;
}) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const update = () => {
      const created = new Date(booking.created_at).getTime();
      const expiresAt = created + EXPIRY_MINUTES * 60 * 1000;
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [booking.created_at]);

  const tableLabel = booking.tables?.label ?? '—';
  const timeSince = getTimeSince(booking.created_at);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-serif text-lg font-bold text-white">
              {booking.guest_name}
            </span>
            <span className="rounded-lg bg-white/5 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
              {tableLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50">
            <a
              href={`tel:+91${booking.phone}`}
              className="flex items-center gap-1 text-amber-400/80 hover:text-amber-400 transition-colors"
            >
              <Phone size={13} />
              +91 {booking.phone}
            </a>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {booking.party_size} guests
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {timeSince}
            </span>
          </div>

          {booking.note && (
            <p className="mt-1.5 flex items-start gap-1 text-sm text-white/40 italic">
              <MessageSquare size={13} className="mt-0.5 shrink-0" />
              {booking.note}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Countdown */}
          <span className={`font-mono text-sm font-bold mr-2 ${
            countdown.startsWith('0:') || countdown.startsWith('1:') ? 'text-red-400' : 'text-white/40'
          }`}>
            {countdown}
          </span>

          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.97]"
          >
            <CheckCircle2 size={16} />
            Confirm &amp; Seat
          </button>
          <button
            onClick={onRelease}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 active:scale-[0.97]"
          >
            <XCircle size={16} />
            Release
          </button>
        </div>
      </div>
    </div>
  );
}

// ── History Card ──────────────────────────────────────────────────

function HistoryCard({ booking }: { booking: Booking }) {
  const tableLabel = booking.tables?.label ?? '—';
  const statusColor =
    booking.status === 'confirmed'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : booking.status === 'cancelled'
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : 'text-white/40 bg-white/5 border-white/10';

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-white/60 truncate">
          {booking.guest_name}
        </span>
        <span className="text-xs text-white/25">
          {tableLabel} · {booking.party_size} guests
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/25">
          {getTimeSince(booking.created_at)}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
          {booking.status}
        </span>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function getTimeSince(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
