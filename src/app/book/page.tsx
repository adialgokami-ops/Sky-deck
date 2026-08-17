'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Check, MapPin, Calendar, CalendarClock, Clock, Users, PartyPopper, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTables } from '@/hooks/useRealtimeTables';
import { useAutoExpiry } from '@/hooks/useAutoExpiry';
import type { Table } from '@/lib/types';
import { ZONES as ZONE_NAMES, ZONE_DETAILS, type Zone } from '@/lib/types';
import TableCard from '@/components/TableCard';
import BookingModal, { type ActiveBookingSession } from '@/components/BookingModal';
import ConfirmedModal from '@/components/ConfirmedModal';

type Step = 1 | 2 | 3;
type BookingState = 'idle' | 'submitting' | 'success' | 'error';

interface BookingData {
  date: Date | null;
  timeSlot: string | null;
  zone: Zone | null;
  partySize: number;
  occasion: string | null;
  dietaryNotes: string;
  specialRequests: string;
  name: string;
  phone: string;
  email: string;
  confirmMethod: 'whatsapp' | 'sms' | 'email';
}

const TIME_SLOTS = [
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
];

const OCCASIONS = ['Birthday', 'Anniversary', 'Business', 'Casual', 'Other'];
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Jain', 'Gluten-free', 'Allergy'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Main Page Component ───────────────────────────────────────────

export default function BookingPage() {
  const { tables, loading } = useRealtimeTables();
  useAutoExpiry();

  // Mode: 'now' is always the default on every fresh page load
  const [mode, setMode] = useState<'now' | 'later'>('now');

  // ── Book Now state ──
  const [activeZone, setActiveZone] = useState<Zone>('Rooftop');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // ── Page-Level Active Booking Session Tracking ──
  const [activeBookingSession, setActiveBookingSession] = useState<ActiveBookingSession | null>(null);
  const [showConfirmedPopup, setShowConfirmedPopup] = useState(false);

  // Recover active booking session from sessionStorage on mount (if still within 10 min)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('skydeck_active_booking');
        if (saved) {
          const parsed = JSON.parse(saved) as ActiveBookingSession;
          if (parsed && parsed.bookingId && parsed.status === 'pending') {
            const ageMs = Date.now() - new Date(parsed.createdAt).getTime();
            if (ageMs < 10 * 60 * 1000) {
              setActiveBookingSession(parsed);
            } else {
              sessionStorage.removeItem('skydeck_active_booking');
            }
          }
        }
      } catch {}
    }
  }, []);

  // Sync activeBookingSession to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeBookingSession && activeBookingSession.status === 'pending') {
        sessionStorage.setItem('skydeck_active_booking', JSON.stringify(activeBookingSession));
      } else if (activeBookingSession && activeBookingSession.status !== 'pending') {
        sessionStorage.removeItem('skydeck_active_booking');
      }
    }
  }, [activeBookingSession]);

  // Page-Level Realtime Listener & Polling: Runs regardless of whether any modal is open or closed
  useEffect(() => {
    if (!activeBookingSession || activeBookingSession.status !== 'pending') return;

    const bookingId = activeBookingSession.bookingId;

    const handleConfirmed = () => {
      setActiveBookingSession((prev) => (prev ? { ...prev, status: 'confirmed' } : null));
      setSelectedTable(null); // Dismiss any open pending form
      setShowConfirmedPopup(true); // Open the distinct confirmed popup
    };

    const handleStatusChange = (newStatus: string) => {
      if (newStatus === 'confirmed') {
        handleConfirmed();
      } else if (newStatus === 'cancelled') {
        setActiveBookingSession((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      } else if (newStatus === 'expired') {
        setActiveBookingSession((prev) => (prev ? { ...prev, status: 'expired' } : null));
      }
    };

    // 1. Supabase Realtime channel
    const channel = supabase
      .channel(`page-booking-tracker-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          const updated = payload.new as { id: string; status: string };
          if (updated.id === bookingId) {
            handleStatusChange(updated.status);
          }
        }
      )
      .subscribe();

    // 2. Continuous Polling Fallback (runs every 3.5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const { data: row } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .single();

        if (row && row.status && row.status !== 'pending') {
          handleStatusChange(row.status);
        }
      } catch {}
    }, 3500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [activeBookingSession]);

  // ── Book for Later state ──
  const [step, setStep] = useState<Step>(1);
  const [bookingState, setBookingState] = useState<BookingState>('idle');
  const [bookingRef, setBookingRef] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<BookingData>({
    date: null,
    timeSlot: null,
    zone: null,
    partySize: 2,
    occasion: null,
    dietaryNotes: '',
    specialRequests: '',
    name: '',
    phone: '',
    email: '',
    confirmMethod: 'whatsapp',
  });

  const update = useCallback(
    <K extends keyof BookingData>(key: K, value: BookingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Active zone for dynamic background crossfade
  const currentZone = mode === 'now' ? activeZone : (data.zone || activeZone);
  const currentZoneData = ZONE_DETAILS.find((z) => z.name === currentZone) || ZONE_DETAILS[0];

  // ── Live availability counts per zone ──
  const zoneAvailability = useMemo(() => {
    const map: Record<string, { available: number; total: number }> = {};
    for (const z of ZONE_DETAILS) {
      map[z.name] = { available: 0, total: 0 };
    }
    for (const t of tables) {
      if (map[t.zone]) {
        map[t.zone].total++;
        if (t.status === 'available') {
          map[t.zone].available++;
        }
      }
    }
    return map;
  }, [tables]);

  // Tables filtered by active zone for Book Now
  const filteredTables = useMemo(
    () => tables.filter((t) => t.zone === activeZone),
    [tables, activeZone]
  );

  // Validation
  const canProceedStep1 = data.date && data.timeSlot && data.zone;
  const isPhoneValid = /^\d{10}$/.test(data.phone.trim());
  const canProceedStep3 = data.name.trim().length > 0 && isPhoneValid;

  // ── Submit Book for Later ──
  const handleSubmit = useCallback(async () => {
    if (!canProceedStep3 || !data.zone) return;

    setBookingState('submitting');

    try {
      const zoneTables = tables.filter((t) => t.zone === data.zone && t.status === 'available');
      const table = zoneTables[0];

      if (!table) {
        setErrorMsg('No tables available in this zone for the selected time. Please try another zone or time.');
        setBookingState('error');
        return;
      }

      const noteLines = [
        data.occasion ? `Occasion: ${data.occasion}` : '',
        data.dietaryNotes ? `Dietary: ${data.dietaryNotes}` : '',
        data.specialRequests ? `Requests: ${data.specialRequests}` : '',
        `Time: ${data.timeSlot}`,
        `Date: ${data.date ? data.date.toLocaleDateString('en-IN') : ''}`,
        data.email ? `Email: ${data.email}` : '',
        `Confirm via: ${data.confirmMethod}`,
      ].filter(Boolean).join(' | ');

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          table_id: table.id,
          guest_name: data.name.trim(),
          phone: data.phone.trim(),
          party_size: data.partySize,
          note: noteLines || null,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError || !booking) {
        setErrorMsg('Failed to create booking. Please try again.');
        setBookingState('error');
        return;
      }

      await supabase
        .from('tables')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', table.id);

      setBookingRef(booking.id.slice(-6).toUpperCase());
      setBookingId(booking.id);
      setBookingState('success');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setBookingState('error');
    }
  }, [canProceedStep3, data, tables]);

  // ── Render: Success / Error for Book for Later ──

  if (bookingState === 'success') {
    return <SuccessScreen data={data} bookingRef={bookingRef} bookingId={bookingId} />;
  }

  if (bookingState === 'error') {
    return <ErrorScreen message={errorMsg} onRetry={() => setBookingState('idle')} />;
  }

  // ── Render: Main ──

  return (
    <div className="min-h-screen text-[#F4EFE8] relative selection:bg-[#D98E3F]/30 selection:text-white">
      {/* ── Fixed Full-bleed Dynamic Zone Backgrounds with GPU-Accelerated 500ms Crossfade ── */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none transform-gpu">
        {ZONE_DETAILS.map((zone) => {
          const isVisible = currentZone === zone.name;
          return (
            <div
              key={zone.name}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out transform-gpu will-change-[opacity] ${
                isVisible ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={zone.bgImage}
                alt={`SkyDeck ${zone.name} Ambiance`}
                fill
                priority={isVisible}
                sizes="100vw"
                className="object-cover object-center scale-105 filter brightness-[0.72] contrast-[1.05]"
              />
            </div>
          );
        })}
      </div>

      {/* Cinematic dark frosted gradient overlay (optimized without full-viewport blur filter) */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#0c0a09]/60 via-[#12100E]/78 to-[#0b0908]/94 pointer-events-none" />

      {/* Dynamic ambient glass light refractions that match current zone */}
      <div
        className="pointer-events-none fixed top-0 left-1/4 w-[500px] h-[300px] blur-[140px] rounded-full -z-10 transition-colors duration-700 transform-gpu"
        style={{ backgroundColor: currentZoneData.accentGlow }}
      />
      <div
        className="pointer-events-none fixed top-1/3 right-10 w-[400px] h-[350px] blur-[140px] rounded-full -z-10 transition-colors duration-700 transform-gpu"
        style={{ backgroundColor: currentZoneData.accentBg }}
      />

      {/* ── Frosted Glass Header Bar ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.12] bg-[#12100E]/50 backdrop-blur-2xl shadow-lg shadow-black/25">
        <div className="mx-auto max-w-2xl px-5 flex items-center justify-between h-14">
          <Link href="/" className="flex items-baseline gap-0.5 group">
            <span className="font-display text-xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">Sky</span>
            <span className="font-display text-xl font-bold text-[#D98E3F] drop-shadow-[0_2px_8px_rgba(217,142,63,0.5)]">Deck</span>
          </Link>

          {/* Mode Toggle: Glass Pill */}
          <button
            onClick={() => setMode(mode === 'now' ? 'later' : 'now')}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.08] hover:bg-white/[0.16] px-4 py-1.5 text-xs font-semibold text-[#F4EFE8] backdrop-blur-xl shadow-md transition-all active:scale-[0.97]"
          >
            {mode === 'now' ? (
              <>
                <CalendarClock size={13} className="text-[#D98E3F]" />
                <span>Book for Later</span>
              </>
            ) : (
              <>
                <Clock size={13} className="text-[#D98E3F]" />
                <span>Book Now</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BOOK NOW MODE — Live table availability & instant claim     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {mode === 'now' && (
        <div className="mx-auto max-w-2xl px-4 pb-14">
          {/* Title */}
          <div className="pt-7 pb-4 text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] mb-1.5">
              Book Now
            </h1>
            <p className="text-sm font-medium text-[#A69E93] flex items-center justify-center gap-2 drop-shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              Live Table Availability
            </p>
          </div>

          {/* Zone Tabs: 2×2 on mobile, 4-across on desktop */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ZONE_NAMES.map((zone) => {
              const avail = zoneAvailability[zone] || { available: 0, total: 0 };
              const isActive = activeZone === zone;
              const zoneData = ZONE_DETAILS.find((z) => z.name === zone);
              return (
                <button
                  key={zone}
                  onClick={() => setActiveZone(zone as Zone)}
                  className={`relative rounded-2xl p-3.5 text-left transition-all duration-300 border backdrop-blur-xl overflow-hidden shadow-lg shadow-black/25 transform-gpu ${
                    isActive
                      ? 'border-white/40 ring-1 ring-white/30 scale-[1.02]'
                      : 'border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.1] hover:border-white/[0.25]'
                  }`}
                  style={isActive ? {
                    backgroundColor: zoneData?.accentBg,
                    borderColor: zoneData?.accentBorder,
                    boxShadow: `0 8px 24px ${zoneData?.accentGlow}`,
                  } : {}}
                >
                  <span className="block font-semibold text-sm text-white drop-shadow-sm truncate">
                    {zone}
                  </span>
                  <span
                    className="text-xs font-bold mt-1 block tracking-wide"
                    style={{
                      color: isActive ? zoneData?.accent : '#A69E93',
                      textShadow: isActive ? `0 0 10px ${zoneData?.accentGlow}` : undefined,
                    }}
                  >
                    {avail.available}/{avail.total} free
                  </span>
                </button>
              );
            })}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D98E3F]/30 border-t-[#D98E3F]" />
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

          {/* Empty state: Glass Receded State */}
          {!loading && filteredTables.length === 0 && (
            <div className="py-16 text-center rounded-3xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-xl p-8 my-4 shadow-xl">
              <p className="text-sm font-medium text-white/50">No tables available in this zone right now.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center text-xs text-white/40">
            <p>SkyDeck · Rooftop Restaurant & Lounge, Pune</p>
          </footer>

          {/* Booking Modal (Form & Pending Requested State) */}
          {selectedTable && (
            <BookingModal
              table={selectedTable}
              activeSession={activeBookingSession}
              onClose={() => setSelectedTable(null)}
              onBookingCreated={(session) => {
                setActiveBookingSession(session);
              }}
            />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BOOK FOR LATER MODE — 3-step scheduled reservation flow     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {mode === 'later' && (
        <>
          {/* Progress Indicator: Glass Pills */}
          <div className="mx-auto max-w-2xl px-5 pt-6 pb-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1 gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all duration-300 backdrop-blur-xl border ${
                    step === s
                      ? 'bg-[#D98E3F] text-[#12100E] border-[#E8A855] shadow-lg shadow-[#D98E3F]/40'
                      : step > s
                      ? 'bg-[#D98E3F]/20 text-[#D98E3F] border-[#D98E3F]/40'
                      : 'bg-white/[0.06] text-white/40 border-white/[0.1]'
                  }`}>
                    {step > s ? <Check size={14} strokeWidth={2.5} /> : s}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block drop-shadow-sm ${
                    step >= s ? 'text-[#F4EFE8]' : 'text-white/40'
                  }`}>
                    {s === 1 ? 'Date & Zone' : s === 2 ? 'Details' : 'Confirm'}
                  </span>
                  {s < 3 && <div className={`flex-1 h-[1px] ${step > s ? 'bg-[#D98E3F]/40' : 'bg-white/[0.1]'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mx-auto max-w-2xl px-5 pb-32">
            {step === 1 && (
              <StepDateTimeZone
                data={data}
                update={update}
                zoneAvailability={zoneAvailability}
                loading={loading}
              />
            )}
            {step === 2 && (
              <StepOccasion data={data} update={update} />
            )}
            {step === 3 && (
              <StepConfirm
                data={data}
                update={update}
                submitting={bookingState === 'submitting'}
              />
            )}
          </div>

          {/* Sticky Bottom Bar: Frosted Glass */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.12] bg-[#12100E]/70 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
            <div className="mx-auto max-w-2xl px-5 py-4 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="rounded-xl border border-white/[0.15] bg-white/[0.06] hover:bg-white/[0.12] px-5 py-3.5 text-sm font-semibold text-[#F4EFE8] backdrop-blur-xl transition-all shadow-md"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 1 && !canProceedStep1) return;
                    setStep((s) => (s + 1) as Step);
                  }}
                  disabled={step === 1 && !canProceedStep1}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D98E3F] to-[#E8A855] py-3.5 text-sm font-bold text-[#12100E] hover:from-[#E8A855] hover:to-[#F3B765] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 active:scale-[0.99]"
                >
                  {step === 2 ? 'Continue to Confirm' : 'Continue'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedStep3 || bookingState === 'submitting'}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#D98E3F] to-[#E8A855] py-3.5 text-sm font-bold text-[#12100E] hover:from-[#E8A855] hover:to-[#F3B765] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 active:scale-[0.99]"
                >
                  {bookingState === 'submitting' ? 'Booking…' : 'Confirm Booking'}
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  className="rounded-xl border border-white/[0.15] bg-white/[0.06] hover:bg-white/[0.12] px-5 py-3.5 text-sm font-semibold text-white/60 hover:text-white backdrop-blur-xl transition-all shadow-md"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Page-Level Confirmed Popup (Appears regardless of whether pending modal was closed) ── */}
      {showConfirmedPopup && activeBookingSession && (
        <ConfirmedModal
          session={activeBookingSession}
          onClose={() => setShowConfirmedPopup(false)}
        />
      )}
    </div>
  );
}

// ── STEP 1: Date, Time & Zone in Glass ────────────────────────────

function StepDateTimeZone({
  data, update, zoneAvailability, loading,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
  zoneAvailability: Record<string, { available: number; total: number }>;
  loading: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate next 14 days
  const dates = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.toDateString()]);

  const isSameDay = (a: Date | null, b: Date) =>
    a?.toDateString() === b.toDateString();

  // Simulated slot availability
  const getSlotAvailability = useCallback((slot: string) => {
    const hash = slot.charCodeAt(0) + (data.date?.getDate() || 0);
    const avail = ((hash * 7) % 8);
    return avail;
  }, [data.date]);

  return (
    <div className="space-y-8 pt-6 animate-fadeIn">
      {/* Date Picker: Horizontal Glass Cards */}
      <div>
        <label className="block text-sm font-bold text-[#F4EFE8] drop-shadow-sm mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-[#D98E3F]" />
          Select Date
        </label>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {dates.map((d) => {
            const isToday = isSameDay(new Date(), d);
            const isSelected = isSameDay(data.date, d);
            return (
              <button
                key={d.toISOString()}
                onClick={() => update('date', d)}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-center transition-all duration-200 min-w-[72px] backdrop-blur-xl shadow-lg shadow-black/20 transform-gpu ${
                  isSelected
                    ? 'bg-[#D98E3F] border-[#E8A855] text-[#12100E] shadow-amber-500/40 scale-[1.04]'
                    : 'border-white/[0.14] bg-white/[0.07] hover:bg-white/[0.14] hover:border-white/[0.25] text-white'
                }`}
              >
                <span className={`block text-[10px] uppercase font-semibold tracking-wider mb-1 ${
                  isSelected ? 'text-[#12100E]/75' : 'text-white/55'
                }`}>
                  {isToday ? 'Today' : DAYS[d.getDay()]}
                </span>
                <span className={`block text-xl font-bold font-display ${
                  isSelected ? 'text-[#12100E]' : 'text-white'
                }`}>
                  {d.getDate()}
                </span>
                <span className={`block text-[10px] font-medium ${
                  isSelected ? 'text-[#12100E]/75' : 'text-white/55'
                }`}>
                  {MONTHS[d.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots: Glass Chips */}
      <div>
        <label className="block text-sm font-bold text-[#F4EFE8] drop-shadow-sm mb-3 flex items-center gap-2">
          <Clock size={16} className="text-[#D98E3F]" />
          Select Time
        </label>
        {!data.date ? (
          <p className="text-sm text-white/50 italic">Pick a date first to view time slots</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {TIME_SLOTS.map((slot) => {
              const avail = getSlotAvailability(slot);
              const soldOut = avail === 0;
              const isSelected = data.timeSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => !soldOut && update('timeSlot', slot)}
                  disabled={soldOut}
                  className={`rounded-xl border py-3 px-2 text-center transition-all duration-200 backdrop-blur-xl shadow-md transform-gpu ${
                    isSelected
                      ? 'bg-[#D98E3F] border-[#E8A855] text-[#12100E] shadow-amber-500/30'
                      : soldOut
                      ? 'border-white/[0.06] bg-white/[0.02] opacity-35 cursor-not-allowed text-white/40'
                      : 'border-white/[0.14] bg-white/[0.07] hover:bg-white/[0.14] hover:border-white/[0.25] text-white'
                  }`}
                >
                  <span className={`block text-sm font-semibold ${
                    isSelected ? 'text-[#12100E]' : soldOut ? 'text-white/40' : 'text-white'
                  }`}>
                    {slot}
                  </span>
                  <span className={`block text-[10px] font-medium mt-0.5 ${
                    isSelected ? 'text-[#12100E]/75' : soldOut ? 'text-white/30' : 'text-[#A69E93]'
                  }`}>
                    {soldOut ? 'Full' : `${avail} left`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Party Size Stepper in Glass */}
      <div>
        <label className="block text-sm font-bold text-[#F4EFE8] drop-shadow-sm mb-3 flex items-center gap-2">
          <Users size={16} className="text-[#D98E3F]" />
          Party Size
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => update('partySize', Math.max(1, data.partySize - 1))}
            disabled={data.partySize <= 1}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.16] text-white backdrop-blur-xl shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={18} />
          </button>
          <span className="text-3xl font-bold text-white min-w-[3rem] text-center font-display drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {data.partySize}
          </span>
          <button
            onClick={() => update('partySize', Math.min(12, data.partySize + 1))}
            disabled={data.partySize >= 12}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.16] text-white backdrop-blur-xl shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
          <span className="text-sm font-medium text-white/60">guests</span>
        </div>
      </div>

      {/* Zone Selector: Glass Cards with Tinted Highlights */}
      <div>
        <label className="block text-sm font-bold text-[#F4EFE8] drop-shadow-sm mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-[#D98E3F]" />
          Choose Zone
        </label>
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-white/[0.1] bg-white/[0.05] h-24 animate-pulse backdrop-blur-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {ZONE_DETAILS.map((zone) => {
              const avail = zoneAvailability[zone.name] || { available: 0, total: 0 };
              const isSelected = data.zone === zone.name;
              const fullyBooked = avail.available === 0;
              return (
                <button
                  key={zone.name}
                  onClick={() => !fullyBooked && update('zone', zone.name)}
                  disabled={fullyBooked}
                  className={`relative rounded-2xl border p-4 text-left transition-all duration-300 overflow-hidden backdrop-blur-xl shadow-xl shadow-black/30 transform-gpu ${
                    isSelected
                      ? 'scale-[1.01] ring-1 ring-white/40'
                      : fullyBooked
                      ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border-white/[0.06]'
                      : 'hover:scale-[1.01] bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.15] hover:border-white/[0.3]'
                  }`}
                  style={{
                    borderColor: isSelected ? zone.accentBorder : undefined,
                    backgroundColor: isSelected ? zone.accentBg : undefined,
                    boxShadow: isSelected ? `0 8px 30px ${zone.accentGlow}` : undefined,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-20 rounded-xl overflow-hidden shrink-0 border border-white/[0.2] shadow-md">
                      <Image
                        src={zone.image}
                        alt={zone.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-lg font-bold text-white drop-shadow-sm">{zone.name}</span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[#12100E] shadow-sm" style={{ backgroundColor: zone.accent }}>
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-white/60">
                        <span>{zone.seats} seats</span>
                        <span>·</span>
                        <span className="truncate">{zone.bestFor}</span>
                      </div>
                    </div>
                    {/* Availability */}
                    <div className="text-right shrink-0">
                      {fullyBooked ? (
                        <span className="text-xs text-red-400 font-semibold">Full</span>
                      ) : (
                        <>
                          <span
                            className="block text-xl font-bold font-display"
                            style={{
                              color: zone.accent,
                              textShadow: `0 0 12px ${zone.accentGlow}`,
                            }}
                          >
                            {avail.available}
                          </span>
                          <span className="block text-[10px] font-medium text-white/50">available</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 2: Occasion & Requests in Glass ───────────────────────────

function StepOccasion({
  data, update,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
}) {
  return (
    <div className="space-y-8 pt-6 animate-fadeIn">
      <div className="text-center mb-2">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-sm">Any special occasion?</h2>
        <p className="text-sm text-white/55">Optional — skip if you prefer</p>
      </div>

      {/* Occasion Glass Chips */}
      <div>
        <label className="block text-sm font-bold text-[#F4EFE8] mb-3">Occasion</label>
        <div className="flex flex-wrap gap-2.5">
          {OCCASIONS.map((occ) => {
            const isSelected = data.occasion === occ;
            return (
              <button
                key={occ}
                onClick={() => update('occasion', isSelected ? null : occ)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold border backdrop-blur-xl transition-all duration-200 shadow-md transform-gpu ${
                  isSelected
                    ? 'bg-[#D98E3F] border-[#E8A855] text-[#12100E] shadow-amber-500/30 scale-[1.02]'
                    : 'border-white/[0.15] bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white'
                }`}
              >
                {occ}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary Notes in Glass */}
      <div>
        <label className="block text-sm font-bold text-[#F4EFE8] mb-3">Dietary Requirements</label>
        <div className="flex flex-wrap gap-2.5 mb-3">
          {DIETARY_TAGS.map((tag) => {
            const isSelected = data.dietaryNotes.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  if (isSelected) {
                    update('dietaryNotes', data.dietaryNotes.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
                  } else {
                    update('dietaryNotes', data.dietaryNotes ? `${data.dietaryNotes}, ${tag}` : tag);
                  }
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold border backdrop-blur-xl transition-all duration-200 shadow-sm transform-gpu ${
                  isSelected
                    ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300'
                    : 'border-white/[0.12] bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={data.dietaryNotes}
          onChange={(e) => update('dietaryNotes', e.target.value)}
          placeholder="Any other dietary preferences..."
          className="w-full rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-all"
        />
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-bold text-[#F4EFE8] mb-3">Special Requests</label>
        <textarea
          value={data.specialRequests}
          onChange={(e) => update('specialRequests', e.target.value)}
          placeholder='e.g. "corner table with skyline view", "birthday dessert at 9 PM"'
          rows={3}
          className="w-full rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-all resize-none"
        />
      </div>
    </div>
  );
}

// ── STEP 3: Contact & Confirm in Glass ─────────────────────────────

function StepConfirm({
  data, update, submitting,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
  submitting: boolean;
}) {
  const isPhoneValid = data.phone.length === 0 || /^\d{10}$/.test(data.phone);
  const zone = ZONE_DETAILS.find((z) => z.name === data.zone);

  return (
    <div className="space-y-8 pt-6 animate-fadeIn">
      {/* Summary Card in Frosted Glass */}
      <div className="rounded-3xl border border-white/[0.16] bg-white/[0.08] p-5.5 space-y-3.5 backdrop-blur-2xl shadow-xl shadow-black/30">
        <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-[#D98E3F]" />
          Reservation Summary
        </h3>
        <div className="grid grid-cols-2 gap-3.5 text-sm">
          <div>
            <span className="text-white/50 text-xs block font-medium">Date</span>
            <span className="text-white font-bold">{data.date?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) || '—'}</span>
          </div>
          <div>
            <span className="text-white/50 text-xs block font-medium">Time</span>
            <span className="text-white font-bold">{data.timeSlot || '—'}</span>
          </div>
          <div>
            <span className="text-white/50 text-xs block font-medium">Zone</span>
            <span className="font-bold" style={{ color: zone?.accent || '#FFF' }}>{data.zone || '—'}</span>
          </div>
          <div>
            <span className="text-white/50 text-xs block font-medium">Guests</span>
            <span className="text-white font-bold">{data.partySize}</span>
          </div>
        </div>
        {(data.occasion || data.dietaryNotes || data.specialRequests) && (
          <div className="border-t border-white/[0.1] pt-3 space-y-1.5 text-xs text-white/70">
            {data.occasion && <p>🎉 <strong className="text-white">Occasion:</strong> {data.occasion}</p>}
            {data.dietaryNotes && <p>🥗 <strong className="text-white">Dietary:</strong> {data.dietaryNotes}</p>}
            {data.specialRequests && <p>📝 <strong className="text-white">Requests:</strong> {data.specialRequests}</p>}
          </div>
        )}
      </div>

      {/* Contact Form */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-bold text-white">Your Contact Details</h3>

        <div>
          <label className="block text-xs font-bold text-white/80 mb-1.5">
            Full Name <span className="text-[#D98E3F]">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Aditi Rao"
            className="w-full rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-white/80 mb-1.5">
            Mobile Number <span className="text-[#D98E3F]">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/[0.16] bg-white/[0.08] px-3.5 py-3.5 text-sm font-semibold text-white/70 backdrop-blur-xl">+91</span>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="flex-1 rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-all"
            />
          </div>
          {!isPhoneValid && (
            <p className="mt-1.5 text-xs text-red-400 font-medium">Please enter a valid 10-digit mobile number</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-white/80 mb-1.5">Email (Optional)</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="aditi@example.com"
            className="w-full rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-all"
          />
        </div>
      </div>

      {/* Confirmation Method */}
      <div>
        <label className="block text-xs font-bold text-white/80 mb-3">Send Confirmation Via</label>
        <div className="flex gap-2.5">
          {(['whatsapp', 'sms', 'email'] as const).map((method) => {
            const isSelected = data.confirmMethod === method;
            const labels = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' };
            return (
              <button
                key={method}
                onClick={() => update('confirmMethod', method)}
                className={`flex-1 rounded-xl border py-3 text-sm font-semibold backdrop-blur-xl transition-all shadow-md transform-gpu ${
                  isSelected
                    ? 'bg-[#D98E3F]/25 border-amber-400 text-amber-300 shadow-amber-500/25 scale-[1.02]'
                    : 'border-white/[0.14] bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white'
                }`}
              >
                {labels[method]}
              </button>
            );
          })}
        </div>
      </div>

      {submitting && (
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D98E3F]/30 border-t-[#D98E3F]" />
        </div>
      )}
    </div>
  );
}

// ── Success Screen in Glassmorphism ───────────────────────────────

function SuccessScreen({ data, bookingRef, bookingId }: { data: BookingData; bookingRef: string; bookingId: string }) {
  const zone = ZONE_DETAILS.find((z) => z.name === data.zone);
  const [confirmed, setConfirmed] = useState(false);

  // Poll / listen for admin confirmation
  useEffect(() => {
    if (!bookingId || confirmed) return;

    // Realtime subscription
    const channel = supabase
      .channel(`booking-confirm-${bookingId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        const updated = payload.new as { id: string; status: string };
        if (updated.id === bookingId && updated.status === 'confirmed') {
          setConfirmed(true);
        }
      })
      .subscribe();

    // Polling fallback
    const poll = setInterval(async () => {
      const { data: row } = await supabase.from('bookings').select('status').eq('id', bookingId).single();
      if (row?.status === 'confirmed') {
        setConfirmed(true);
      }
    }, 5000);

    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [bookingId, confirmed]);

  // Build calendar link
  const calendarUrl = useMemo(() => {
    if (!data.date || !data.timeSlot) return '#';
    const d = new Date(data.date);
    const text = encodeURIComponent(`Dinner at SkyDeck — ${data.zone}`);
    const details = encodeURIComponent(`Reservation for ${data.partySize} guests. Ref: ${bookingRef}`);
    const location = encodeURIComponent('SkyDeck, Phoenix Mall, Pimpri-Chinchwad, Pune 411018');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${d.toISOString().split('T')[0].replace(/-/g, '')}T180000/${d.toISOString().split('T')[0].replace(/-/g, '')}T220000`;
  }, [data, bookingRef]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-5 text-[#F4EFE8]">
      {/* Background Image: Matching selected zone */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <Image
          src={zone?.bgImage || '/images/hero-bg.jpg'}
          alt="SkyDeck Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.65]"
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/65 pointer-events-none" />

      <div className="w-full max-w-md text-center animate-fadeIn relative z-10">
        {/* Celebration icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-400/40 shadow-xl shadow-amber-500/30 backdrop-blur-2xl">
          <PartyPopper size={36} className="text-[#D98E3F]" />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-md">You&apos;re all set!</h1>
        <p className="text-white/70 font-medium mb-2">Your reservation request has been received.</p>
        <p className="text-xs text-amber-300 font-semibold mb-8 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          Waiting for staff confirmation…
        </p>

        {/* Ticket card in Glass */}
        <div className="rounded-3xl border border-white/[0.18] bg-white/[0.08] backdrop-blur-2xl overflow-hidden mb-8 text-left shadow-2xl shadow-black/50">
          <div className="px-6 py-4 border-b border-dashed border-white/[0.15]" style={{ backgroundColor: zone?.accentBg }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold text-white">SkyDeck</span>
              <span className="font-mono text-base font-bold" style={{ color: zone?.accent }}>#{bookingRef}</span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/50 text-xs block font-medium mb-0.5">Date</span>
                <span className="text-white font-bold">{data.date?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>
              <div>
                <span className="text-white/50 text-xs block font-medium mb-0.5">Time</span>
                <span className="text-white font-bold">{data.timeSlot}</span>
              </div>
              <div>
                <span className="text-white/50 text-xs block font-medium mb-0.5">Zone</span>
                <span className="font-bold" style={{ color: zone?.accent }}>{data.zone}</span>
              </div>
              <div>
                <span className="text-white/50 text-xs block font-medium mb-0.5">Guests</span>
                <span className="text-white font-bold">{data.partySize}</span>
              </div>
              <div className="col-span-2">
                <span className="text-white/50 text-xs block font-medium mb-0.5">Guest</span>
                <span className="text-white font-bold">{data.name}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-black/20 border-t border-white/[0.1] flex items-center justify-between">
            <span className="text-xs text-white/60 font-medium">Confirmation via {data.confirmMethod}</span>
            <span className="text-xs text-amber-300 font-bold">Pending confirmation</span>
          </div>
        </div>

        {/* Action Buttons in Glass */}
        <div className="space-y-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.16] bg-white/[0.08] hover:bg-white/[0.15] py-3.5 text-sm font-bold text-white backdrop-blur-xl shadow-md transition-all"
          >
            <Calendar size={16} className="text-[#D98E3F]" />
            Add to Calendar
          </a>

          <a
            href="https://maps.google.com/?q=SkyDeck+Pimpri+Chinchwad+Pune"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.16] bg-white/[0.08] hover:bg-white/[0.15] py-3.5 text-sm font-bold text-white backdrop-blur-xl shadow-md transition-all"
          >
            <MapPin size={16} className="text-[#D98E3F]" />
            Get Directions
          </a>

          <Link
            href="/"
            className="block w-full rounded-xl bg-gradient-to-r from-[#D98E3F] to-[#E8A855] py-3.5 text-sm font-bold text-[#12100E] hover:from-[#E8A855] hover:to-[#F3B765] shadow-lg shadow-amber-500/30 transition-all text-center"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/50 leading-relaxed max-w-sm mx-auto">
          ☀️ <strong className="text-white">Rooftop tip:</strong> Evenings can get breezy — we recommend a light layer. Smart casual dress code.
        </p>
      </div>
    </div>
  );
}

// ── Error Screen in Glass ─────────────────────────────────────────

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-5 text-[#F4EFE8]">
      <div className="fixed inset-0 -z-10 bg-black/80 pointer-events-none" />
      <div className="w-full max-w-sm text-center rounded-3xl border border-white/[0.16] bg-white/[0.08] backdrop-blur-2xl p-8 shadow-2xl animate-fadeIn">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border border-red-500/40">
          <span className="text-3xl">😔</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-3">Booking Failed</h2>
        <p className="text-sm text-white/70 mb-6">{message}</p>

        <button
          onClick={onRetry}
          className="w-full rounded-xl bg-gradient-to-r from-[#D98E3F] to-[#E8A855] py-3.5 text-sm font-bold text-[#12100E] hover:from-[#E8A855] hover:to-[#F3B765] shadow-lg shadow-amber-500/30 transition-all mb-4"
        >
          Try Again
        </button>

        <p className="text-xs text-white/50">
          Or call us directly: <a href="tel:+919876543210" className="text-amber-300 font-bold hover:underline">+91 98765 43210</a>
        </p>
      </div>
    </div>
  );
}
