'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Phone,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LogOut,
  LayoutGrid,
  Bell,
  History,
  Armchair,
  Sparkles,
  ShieldCheck,
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
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-amber-900/8 via-transparent to-transparent" />
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-[600px] w-[600px] bg-amber-500/[0.03] blur-[150px] rounded-full" />

      <div className="relative w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#13131a]/90 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
          <ShieldCheck size={32} className="text-amber-400" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-white mb-1">
          Staff Access
        </h1>
        <p className="text-sm text-white/35 mb-8">
          Enter your admin PIN to continue
        </p>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="• • • •"
          className="mb-4 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-center text-lg tracking-[0.4em] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all"
          autoFocus
        />

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/15">{error}</p>
        )}

        <button
          onClick={onSubmit}
          disabled={!pin || loading}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-amber-600/25 transition-all hover:shadow-amber-500/40 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? 'Verifying…' : 'Unlock Dashboard'}
        </button>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 backdrop-blur-sm hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${accent}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          <p className="text-xs text-white/35 font-medium">{label}</p>
        </div>
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
    .slice(0, 15);

  // Run auto-expiry
  useAutoExpiry();

  // Stats
  const stats = useMemo(() => ({
    total: tables.length,
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    pending: tables.filter((t) => t.status === 'pending').length,
  }), [tables]);

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
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-amber-900/[0.06] via-transparent to-transparent" />
      <div className="pointer-events-none fixed top-0 right-1/4 h-[400px] w-[600px] bg-amber-500/[0.02] blur-[120px] rounded-full" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-12">
        {/* ── Header ── */}
        <header className="flex items-center justify-between pb-8 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/15">
              <Sparkles size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white tracking-tight">
                Sky<span className="text-amber-400">Deck</span>
              </h1>
              <p className="text-xs text-white/30 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Staff Dashboard · Live
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/40 transition-all hover:bg-white/[0.08] hover:text-white/70 hover:border-white/15"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </header>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            icon={LayoutGrid}
            label="Total Tables"
            value={stats.total}
            accent="bg-white/[0.06] text-white/60"
          />
          <StatCard
            icon={Armchair}
            label="Available"
            value={stats.available}
            accent="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={Users}
            label="Occupied"
            value={stats.occupied}
            accent="bg-red-500/10 text-red-400"
          />
          <StatCard
            icon={Bell}
            label="Pending"
            value={stats.pending}
            accent="bg-amber-500/10 text-amber-400"
          />
        </div>

        {/* ── Section: Request Queue ── */}
        {pendingBookings.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-amber-400" />
                <h2 className="font-serif text-lg font-bold text-white">
                  Incoming Requests
                </h2>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                {pendingBookings.length} new
              </span>
            </div>

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
        )}

        {/* ── Section: Live Table Grid ── */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <LayoutGrid size={18} className="text-white/40" />
            <h2 className="font-serif text-lg font-bold text-white">
              Table Overview
            </h2>
          </div>

          {ZONES.map((zone) => {
            const zoneTables = tables.filter((t) => t.zone === zone);
            if (zoneTables.length === 0) return null;

            const zoneAvailable = zoneTables.filter((t) => t.status === 'available').length;

            return (
              <div key={zone} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/30">
                    {zone}
                  </h3>
                  <span className="text-xs text-white/20 font-medium">
                    {zoneAvailable}/{zoneTables.length} available
                  </span>
                </div>
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

        {/* ── Section: Recent History (collapsible) ── */}
        <section>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mb-4 flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5 text-left transition-all hover:bg-white/[0.04] hover:border-white/[0.1]"
          >
            <div className="flex items-center gap-2">
              <History size={16} className="text-white/30" />
              <h2 className="font-serif text-base font-bold text-white/50">
                Recent History
              </h2>
              {historyBookings.length > 0 && (
                <span className="text-xs text-white/20 font-medium">
                  ({historyBookings.length})
                </span>
              )}
            </div>
            {showHistory ? (
              <ChevronUp size={16} className="text-white/25" />
            ) : (
              <ChevronDown size={16} className="text-white/25" />
            )}
          </button>

          {showHistory && (
            <div className="space-y-2 animate-fadeIn">
              {historyBookings.length === 0 && (
                <p className="py-6 text-center text-sm text-white/20">No recent activity</p>
              )}
              {historyBookings.map((booking) => (
                <HistoryCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <footer className="mt-12 pt-6 border-t border-white/[0.04] text-center">
          <p className="text-xs text-white/15">
            SkyDeck Staff Dashboard · Auto-refreshing every 5s
          </p>
        </footer>
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
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const update = () => {
      const created = new Date(booking.created_at).getTime();
      const expiresAt = created + EXPIRY_MINUTES * 60 * 1000;
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
      setIsUrgent(remaining <= 120);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [booking.created_at]);

  const tableLabel = booking.tables?.label ?? '—';
  const timeSince = getTimeSince(booking.created_at);

  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-sm transition-all ${
      isUrgent
        ? 'border-red-500/25 bg-red-500/[0.04] shadow-lg shadow-red-500/5'
        : 'border-amber-500/15 bg-amber-500/[0.03]'
    }`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          {/* Name + Table + Timer Row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15 shrink-0">
              <span className="font-serif text-base font-bold text-amber-400">
                {booking.guest_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white text-base truncate">
                  {booking.guest_name}
                </span>
                <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/15">
                  {tableLabel}
                </span>
              </div>
              <span className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                <Clock size={11} />
                {timeSince}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/45 ml-[52px]">
            <a
              href={`tel:+91${booking.phone}`}
              className="flex items-center gap-1.5 text-amber-400/70 hover:text-amber-400 transition-colors"
            >
              <Phone size={13} />
              +91 {booking.phone}
            </a>
            <span className="flex items-center gap-1.5">
              <Users size={13} />
              {booking.party_size} guests
            </span>
          </div>

          {booking.note && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-white/30 italic ml-[52px]">
              <MessageSquare size={13} className="mt-0.5 shrink-0" />
              {booking.note}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0 ml-[52px] sm:ml-0">
          {/* Countdown pill */}
          <div className={`rounded-xl px-3 py-2 text-center min-w-[4.5rem] border ${
            isUrgent
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-white/[0.04] border-white/[0.08]'
          }`}>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Expires</p>
            <p className={`font-mono text-base font-bold ${
              isUrgent ? 'text-red-400' : 'text-white/60'
            }`}>
              {countdown}
            </p>
          </div>

          <button
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.97]"
          >
            <CheckCircle2 size={16} />
            Confirm
          </button>
          <button
            onClick={onRelease}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/50 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 active:scale-[0.97]"
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
  const statusConfig = {
    confirmed: {
      label: 'Confirmed',
      icon: CheckCircle2,
      classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    },
    cancelled: {
      label: 'Released',
      icon: XCircle,
      classes: 'text-red-400 bg-red-500/10 border-red-500/15',
    },
    expired: {
      label: 'Expired',
      icon: Clock,
      classes: 'text-white/35 bg-white/[0.04] border-white/[0.08]',
    },
  };

  const config = statusConfig[booking.status as keyof typeof statusConfig] ?? statusConfig.expired;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3 hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] shrink-0">
          <span className="text-xs font-bold text-white/30">
            {booking.guest_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium text-white/55 truncate block">
            {booking.guest_name}
          </span>
          <span className="text-xs text-white/20">
            {tableLabel} · {booking.party_size} guests
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/20 hidden sm:block">
          {getTimeSince(booking.created_at)}
        </span>
        <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${config.classes}`}>
          <StatusIcon size={12} />
          {config.label}
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
