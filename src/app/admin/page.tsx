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
  BookOpen,
  Search,
  Filter,
  CalendarDays,
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
  const [activeTab, setActiveTab] = useState<'live' | 'customers'>('live');

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
    activeTab={activeTab}
    setActiveTab={setActiveTab}
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
  activeTab,
  setActiveTab,
}: {
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  onLogout: () => void;
  activeTab: 'live' | 'customers';
  setActiveTab: (v: 'live' | 'customers') => void;
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

        {/* ── Tab Nav ── */}
        <div className="flex gap-2 mb-8 border-b border-white/[0.06] pb-0">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${
              activeTab === 'live'
                ? 'border-amber-400 text-amber-400 bg-amber-500/[0.06]'
                : 'border-transparent text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
            }`}
          >
            <LayoutGrid size={15} />
            Live Dashboard
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${
              activeTab === 'customers'
                ? 'border-amber-400 text-amber-400 bg-amber-500/[0.06]'
                : 'border-transparent text-white/35 hover:text-white/60 hover:bg-white/[0.03]'
            }`}
          >
            <BookOpen size={15} />
            Customers
          </button>
        </div>

        {activeTab === 'customers' && <CustomersSection />}

        {activeTab === 'live' && (<>
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
        </>)}

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

function parseBookingNote(note: string | null): Record<string, string> {
  if (!note) return {};
  const parsed: Record<string, string> = {};
  note.split('|').forEach((part) => {
    const [key, ...rest] = part.split(':');
    if (key && rest.length) {
      parsed[key.trim().toLowerCase()] = rest.join(':').trim();
    }
  });
  return parsed;
}

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
  const [expanded, setExpanded] = useState(false);
  const [staffNote, setStaffNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

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
  const tableZone = booking.tables?.zone ?? '—';
  const timeSince = getTimeSince(booking.created_at);
  const parsedNote = parseBookingNote(booking.note);

  // Detect booking source
  const isBookForLater = !!(parsedNote['date'] || parsedNote['time']);
  const bookingSource = isBookForLater ? 'Book for Later' : 'Book Now';

  const handleSaveNote = useCallback(async () => {
    if (!staffNote.trim()) return;
    const existingNote = booking.note || '';
    const updatedNote = existingNote + ` | Staff: ${staffNote.trim()}`;
    await supabase.from('bookings').update({ note: updatedNote }).eq('id', booking.id);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }, [staffNote, booking.id, booking.note]);

  return (
    <div className={`rounded-2xl border backdrop-blur-sm transition-all ${
      isUrgent
        ? 'border-red-500/25 bg-red-500/[0.04] shadow-lg shadow-red-500/5'
        : 'border-amber-500/15 bg-amber-500/[0.03]'
    }`}>
      {/* Main row */}
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15 shrink-0">
                <span className="font-serif text-base font-bold text-amber-400">
                  {booking.guest_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-lg truncate">
                    {booking.guest_name}
                  </span>
                  <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/15">
                    {tableLabel}
                  </span>
                  <span className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/30 border border-white/[0.06]">
                    {bookingSource}
                  </span>
                </div>
                <span className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                  <Clock size={11} />
                  {timeSince} · {tableZone}
                </span>
              </div>
            </div>

            {/* Quick contact + guests row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 ml-[52px]">
              <a
                href={`tel:+91${booking.phone}`}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors min-h-[44px]"
              >
                <Phone size={14} />
                Call
              </a>
              <a
                href={`https://wa.me/91${booking.phone}?text=${encodeURIComponent(`Hi ${booking.guest_name}, your table at SkyDeck is confirmed! See you soon.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors min-h-[44px]"
              >
                <MessageSquare size={14} />
                WhatsApp
              </a>
              <span className="text-sm text-white/40 flex items-center gap-1">
                <Users size={13} />
                {booking.party_size} guests
              </span>
              <span className="text-sm text-white/30">
                +91 {booking.phone}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-[52px] sm:ml-0">
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
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.97] min-h-[44px]"
            >
              <CheckCircle2 size={16} />
              Confirm
            </button>
            <button
              onClick={onRelease}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/50 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25 active:scale-[0.97] min-h-[44px]"
            >
              <XCircle size={16} />
              Release
            </button>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 ml-[52px] flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Hide details' : 'View full details'}
        </button>
      </div>

      {/* Expanded client info panel */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-4 animate-fadeIn space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Phone</span>
              <span className="text-white/70 font-medium">+91 {booking.phone}</span>
            </div>
            {parsedNote['email'] && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Email</span>
                <span className="text-white/70 font-medium">{parsedNote['email']}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Party Size</span>
              <span className="text-white/70 font-medium">{booking.party_size} guests</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Table</span>
              <span className="text-white/70 font-medium">{tableLabel} · {tableZone}</span>
            </div>
            {parsedNote['date'] && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Date</span>
                <span className="text-white/70 font-medium">{parsedNote['date']}</span>
              </div>
            )}
            {parsedNote['time'] && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Time</span>
                <span className="text-white/70 font-medium">{parsedNote['time']}</span>
              </div>
            )}
            {parsedNote['occasion'] && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Occasion</span>
                <span className="text-amber-400/80 font-medium">{parsedNote['occasion']}</span>
              </div>
            )}
            {parsedNote['dietary'] && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Dietary</span>
                <span className="text-white/70 font-medium">{parsedNote['dietary']}</span>
              </div>
            )}
            {parsedNote['confirm via'] && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Confirm Via</span>
                <span className="text-white/70 font-medium capitalize">{parsedNote['confirm via']}</span>
              </div>
            )}
            {parsedNote['requests'] && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Special Requests</span>
                <span className="text-white/50 italic">{parsedNote['requests']}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Source</span>
              <span className="text-white/40 font-medium">{bookingSource}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-1">Booked At</span>
              <span className="text-white/40 font-medium">
                {new Date(booking.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Staff notes */}
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-2">Staff Notes</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                placeholder='e.g. "Confirmed via call, moved to 8:30 PM"'
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-amber-500/30 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
              />
              <button
                onClick={handleSaveNote}
                disabled={!staffNote.trim()}
                className="rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-2.5 text-xs font-medium text-white/50 hover:bg-white/[0.1] hover:text-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
              >
                {noteSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function toLocalDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

// ── Customers Section ─────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  pending:   { label: 'Pending',   classes: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  confirmed: { label: 'Confirmed', classes: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  cancelled: { label: 'Released',  classes: 'text-red-400 bg-red-500/10 border-red-500/20' },
  expired:   { label: 'Expired',   classes: 'text-white/30 bg-white/[0.04] border-white/[0.08]' },
};

function parseNote(note: string | null): Record<string, string> {
  if (!note) return {};
  const out: Record<string, string> = {};
  note.split('|').forEach((part) => {
    const [k, ...rest] = part.split(':');
    if (k && rest.length) out[k.trim().toLowerCase()] = rest.join(':').trim();
  });
  return out;
}

function CustomersSection() {
  const today = toLocalDateStr(new Date());
  const yesterday = toLocalDateStr(new Date(Date.now() - 86400000));

  const [dateMode, setDateMode] = useState<'today' | 'yesterday' | 'week' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(today);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch ALL bookings once (no status filter) for historical log
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('bookings')
        .select('*, tables(*)')
        .order('created_at', { ascending: false });
      setAllBookings((data as Booking[]) || []);
      setLoading(false);
    };
    fetchAll();
    // Poll every 15s for new bookings
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute effective date range
  const effectiveDates = useMemo((): string[] => {
    if (dateMode === 'today') return [today];
    if (dateMode === 'yesterday') return [yesterday];
    if (dateMode === 'week') {
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        dates.push(toLocalDateStr(new Date(Date.now() - i * 86400000)));
      }
      return dates;
    }
    return [customDate];
  }, [dateMode, customDate, today, yesterday]);

  // Filter bookings
  const filtered = useMemo(() => {
    return allBookings.filter((b) => {
      const bookingDate = toLocalDateStr(new Date(b.created_at));
      if (!effectiveDates.includes(bookingDate)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = b.guest_name.toLowerCase().includes(q);
        const phoneMatch = b.phone.includes(q);
        if (!nameMatch && !phoneMatch) return false;
      }

      if (zoneFilter !== 'All' && b.tables?.zone !== zoneFilter) return false;
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;

      return true;
    });
  }, [allBookings, effectiveDates, search, zoneFilter, statusFilter]);

  const allZones = useMemo(() => ['All', ...ZONES], []);
  const allStatuses = ['All', 'pending', 'confirmed', 'cancelled', 'expired'];

  const dateModeLabel: Record<string, string> = {
    today: 'Today', yesterday: 'Yesterday', week: 'This Week', custom: 'Custom',
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BookOpen size={18} className="text-amber-400" />
        <h2 className="font-serif text-lg font-bold text-white">Customer Log</h2>
        <span className="text-xs text-white/25 font-medium ml-auto">
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Date selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <CalendarDays size={14} className="text-white/25 shrink-0" />
        {(['today', 'yesterday', 'week'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setDateMode(mode)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all border ${
              dateMode === mode
                ? 'bg-amber-500/15 border-amber-500/25 text-amber-400'
                : 'border-white/[0.08] bg-white/[0.03] text-white/35 hover:text-white/60 hover:bg-white/[0.06]'
            }`}
          >
            {dateModeLabel[mode]}
          </button>
        ))}
        <input
          type="date"
          value={customDate}
          max={today}
          onChange={(e) => { setCustomDate(e.target.value); setDateMode('custom'); }}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 focus:outline-none focus:border-amber-500/30 transition-colors"
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-amber-500/30 focus:outline-none transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-white/20" />
          <span className="text-[10px] uppercase tracking-wider text-white/25">Zone</span>
        </div>
        {allZones.map((z) => (
          <button
            key={z}
            onClick={() => setZoneFilter(z)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all border ${
              zoneFilter === z
                ? 'bg-[#2B3A4A] border-[#2B3A4A] text-white/80'
                : 'border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50'
            }`}
          >
            {z}
          </button>
        ))}
        <div className="w-px bg-white/[0.06] mx-1 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-white/25">Status</span>
        </div>
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all border capitalize ${
              statusFilter === s
                ? 'bg-white/[0.08] border-white/20 text-white/80'
                : 'border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50'
            }`}
          >
            {s === 'cancelled' ? 'Released' : s}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm text-white/25">No bookings found for this selection</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((booking) => {
            const tableLabel = booking.tables?.label ?? '—';
            const zone = booking.tables?.zone ?? '—';
            const statusCfg = STATUS_BADGE[booking.status] ?? STATUS_BADGE.expired;
            const parsed = parseNote(booking.note);
            const isExpanded = expandedId === booking.id;
            const bookingTime = new Date(booking.created_at).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit',
            });
            const isBookForLater = !!(parsed['date'] || parsed['time']);

            return (
              <div
                key={booking.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all hover:bg-white/[0.03]"
              >
                {/* Row */}
                <button
                  className="w-full text-left px-4 py-3.5"
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-white/40">
                        {booking.guest_name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white/80 text-sm truncate">
                          {booking.guest_name}
                        </span>
                        <span className="text-[10px] text-white/25 font-mono">
                          {tableLabel} · {zone}
                        </span>
                        {isBookForLater && (
                          <span className="text-[10px] text-white/20 border border-white/[0.08] rounded px-1.5 py-0.5">
                            Later
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-white/25">
                        <span>{booking.party_size} guests</span>
                        <span>·</span>
                        <span>{bookingTime}</span>
                        {parsed['occasion'] && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400/60">{parsed['occasion']}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge + expand */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${statusCfg.classes}`}>
                        {statusCfg.label}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={14} className="text-white/25" />
                        : <ChevronDown size={14} className="text-white/25" />
                      }
                    </div>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t border-white/[0.05] px-4 py-4 space-y-4 animate-fadeIn">
                    {/* Contact actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:+91${booking.phone}`}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Phone size={13} /> Call
                      </a>
                      <a
                        href={`https://wa.me/91${booking.phone}?text=${encodeURIComponent(`Hi ${booking.guest_name}, thank you for visiting SkyDeck!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors"
                      >
                        <MessageSquare size={13} /> WhatsApp
                      </a>
                      <span className="text-sm text-white/30 ml-1">+91 {booking.phone}</span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Table</span>
                        <span className="text-white/60 font-medium">{tableLabel} · {zone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Party Size</span>
                        <span className="text-white/60 font-medium">{booking.party_size} guests</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Booked At</span>
                        <span className="text-white/60 font-medium">{bookingTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Status</span>
                        <span className={`text-xs font-medium ${statusCfg.classes.split(' ')[0]}`}>{statusCfg.label}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Source</span>
                        <span className="text-white/40 font-medium">{isBookForLater ? 'Book for Later' : 'Book Now'}</span>
                      </div>
                      {parsed['date'] && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Date</span>
                          <span className="text-white/60 font-medium">{parsed['date']}</span>
                        </div>
                      )}
                      {parsed['time'] && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Time Slot</span>
                          <span className="text-white/60 font-medium">{parsed['time']}</span>
                        </div>
                      )}
                      {parsed['occasion'] && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Occasion</span>
                          <span className="text-amber-400/80 font-medium">{parsed['occasion']}</span>
                        </div>
                      )}
                      {parsed['dietary'] && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Dietary</span>
                          <span className="text-white/60 font-medium">{parsed['dietary']}</span>
                        </div>
                      )}
                    </div>

                    {/* Requests & staff notes */}
                    {(parsed['requests'] || parsed['staff']) && (
                      <div className="space-y-2">
                        {parsed['requests'] && (
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Special Requests</span>
                            <p className="text-sm text-white/40 italic">{parsed['requests']}</p>
                          </div>
                        )}
                        {parsed['staff'] && (
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-white/25 block mb-0.5">Staff Notes</span>
                            <p className="text-sm text-white/50">{parsed['staff']}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Booking ID */}
                    <p className="text-[10px] text-white/15 font-mono">
                      ID: {booking.id.slice(-12).toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
