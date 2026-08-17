'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Check, MapPin, Calendar, CalendarClock, Clock, Users, PartyPopper, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTables } from '@/hooks/useRealtimeTables';
import { useAutoExpiry } from '@/hooks/useAutoExpiry';
import type { Table } from '@/lib/types';
import { ZONES as ZONE_NAMES } from '@/lib/types';
import TableCard from '@/components/TableCard';
import BookingModal from '@/components/BookingModal';
import type { Zone } from '@/lib/types';
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

// ── Constants ─────────────────────────────────────────────────────

const ZONES: { name: Zone; image: string; seats: string; bestFor: string; accent: string; accentBg: string; accentBorder: string }[] = [
  { name: 'Rooftop', image: '/images/zone-rooftop.jpg', seats: '2–8', bestFor: 'Date night, skyline views', accent: '#D98E3F', accentBg: 'rgba(217,142,63,0.08)', accentBorder: 'rgba(217,142,63,0.2)' },
  { name: 'Indoor AC', image: '/images/zone-indoor.jpg', seats: '2–12', bestFor: 'Family, celebrations', accent: '#5B7A9D', accentBg: 'rgba(91,122,157,0.08)', accentBorder: 'rgba(91,122,157,0.2)' },
  { name: 'Outdoor', image: '/images/zone-outdoor.jpg', seats: '2–6', bestFor: 'Casual, group drinks', accent: '#7A9B6B', accentBg: 'rgba(122,155,107,0.08)', accentBorder: 'rgba(122,155,107,0.2)' },
  { name: 'Family Bar', image: '/images/zone-familybar.jpg', seats: '2–10', bestFor: 'Families, live buzz', accent: '#C8694A', accentBg: 'rgba(200,105,74,0.08)', accentBorder: 'rgba(200,105,74,0.2)' },
];

const TIME_SLOTS = [
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM',
];

const OCCASIONS = ['Birthday', 'Anniversary', 'Business', 'Casual', 'Other'];
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Jain', 'Gluten-free', 'Allergy'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Main Page ─────────────────────────────────────────────────────

export default function BookingPage() {
  const { tables, loading } = useRealtimeTables();
  useAutoExpiry();

  // Mode: 'now' is always the default on every fresh page load
  const [mode, setMode] = useState<'now' | 'later'>('now');

  // ── Book Now state ──
  const [activeZone, setActiveZone] = useState<'Rooftop' | 'Indoor AC' | 'Outdoor' | 'Family Bar'>('Rooftop');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

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

  const update = useCallback(<K extends keyof BookingData>(key: K, value: BookingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Zone availability counts (shared by both modes)
  const zoneAvailability = useMemo(() => {
    const counts: Record<string, { available: number; total: number }> = {};
    for (const z of ZONES) {
      const zoneTables = tables.filter((t) => t.zone === z.name);
      counts[z.name] = {
        available: zoneTables.filter((t) => t.status === 'available').length,
        total: zoneTables.length,
      };
    }
    return counts;
  }, [tables]);

  // Filtered tables for Book Now mode
  const filteredTables = tables.filter((t) => t.zone === activeZone);

  // Step validation (Book for Later)
  const canProceedStep1 = data.date && data.timeSlot && data.zone;
  const canProceedStep3 = data.name.trim().length > 0 && /^\d{10}$/.test(data.phone);

  const handleSubmit = useCallback(async () => {
    if (!canProceedStep3 || !data.zone || !data.date) return;
    setBookingState('submitting');

    try {
      const availableTables = tables.filter((t) => t.zone === data.zone && t.status === 'available');
      if (availableTables.length === 0) {
        setErrorMsg('Sorry, all tables in this zone are now booked. Please try another zone or time.');
        setBookingState('error');
        return;
      }

      const table = availableTables[0];
      const noteLines = [
        data.occasion ? `Occasion: ${data.occasion}` : '',
        data.dietaryNotes ? `Dietary: ${data.dietaryNotes}` : '',
        data.specialRequests ? `Requests: ${data.specialRequests}` : '',
        `Time: ${data.timeSlot}`,
        `Date: ${data.date.toLocaleDateString()}`,
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
    <div className="min-h-screen bg-[#12100E]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#12100E]/90 backdrop-blur-lg sticky top-0 z-30">
        <div className="mx-auto max-w-2xl px-5 flex items-center justify-between h-14">
          <Link href="/" className="flex items-baseline gap-0.5">
            <span className="font-display text-lg font-bold text-[#F4EFE8]">Sky</span>
            <span className="font-display text-lg font-bold text-[#D98E3F]">Deck</span>
          </Link>

          {/* Mode toggle — small, secondary */}
          <button
            onClick={() => setMode(mode === 'now' ? 'later' : 'now')}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#6B6560] hover:text-[#A69E93] hover:bg-white/[0.06] transition-all"
          >
            {mode === 'now' ? (
              <>
                <CalendarClock size={12} />
                Book for Later
              </>
            ) : (
              <>
                <Clock size={12} />
                Book Now
              </>
            )}
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BOOK NOW MODE — Live table availability & instant claim     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {mode === 'now' && (
        <div className="mx-auto max-w-2xl px-4 pb-8">
          {/* Title */}
          <div className="pt-6 pb-4 text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4EFE8] tracking-tight mb-1">
              Book Now
            </h1>
            <p className="text-sm text-[#6B6560] flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7A9B6B] animate-pulse" />
              Live Table Availability
            </p>
          </div>

          {/* Zone Tabs — 2×2 on mobile, 4-across on sm+ */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ZONE_NAMES.map((zone) => {
              const avail = zoneAvailability[zone] || { available: 0, total: 0 };
              const isActive = activeZone === zone;
              const zoneData = ZONES.find((z) => z.name === zone);
              return (
                <button
                  key={zone}
                  onClick={() => setActiveZone(zone as typeof activeZone)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? 'text-[#F4EFE8]'
                      : 'border-white/[0.06] bg-white/[0.02] text-[#6B6560] hover:text-[#A69E93] hover:bg-white/[0.04]'
                  }`}
                  style={isActive ? {
                    backgroundColor: zoneData?.accentBg,
                    borderColor: zoneData?.accentBorder,
                  } : {}}
                >
                  <span className="block text-sm">{zone}</span>
                  <span className="text-xs" style={isActive ? { color: zoneData?.accent } : { color: 'rgba(107,101,96,0.6)' }}>
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

          {/* Empty state */}
          {!loading && filteredTables.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[#6B6560]">No tables in this zone</p>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center text-xs text-[#6B6560]/60">
            <p>SkyDeck · Pimpri-Chinchwad, Pune</p>
          </footer>

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
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* BOOK FOR LATER MODE — 3-step scheduled reservation flow     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {mode === 'later' && (
        <>
          {/* Progress indicator */}
          <div className="mx-auto max-w-2xl px-5 pt-6 pb-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1 gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${
                    step === s ? 'bg-[#D98E3F] text-[#12100E]' :
                    step > s ? 'bg-[#D98E3F]/20 text-[#D98E3F]' :
                    'bg-white/[0.04] text-[#6B6560]'
                  }`}>
                    {step > s ? <Check size={14} /> : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    step >= s ? 'text-[#F4EFE8]' : 'text-[#6B6560]'
                  }`}>
                    {s === 1 ? 'Date & Zone' : s === 2 ? 'Details' : 'Confirm'}
                  </span>
                  {s < 3 && <div className={`flex-1 h-[1px] ${step > s ? 'bg-[#D98E3F]/30' : 'bg-white/[0.06]'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
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

          {/* Sticky bottom action */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.06] bg-[#12100E]/95 backdrop-blur-xl">
            <div className="mx-auto max-w-2xl px-5 py-4 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-[#F4EFE8] hover:bg-white/[0.06] transition-colors"
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
                  className="flex-1 btn-glow rounded-xl bg-[#D98E3F] py-3.5 text-sm font-semibold text-[#12100E] hover:bg-[#E8A855] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#D98E3F]/20"
                >
                  {step === 2 ? 'Continue to Confirm' : 'Continue'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedStep3 || bookingState === 'submitting'}
                  className="flex-1 btn-glow rounded-xl bg-[#D98E3F] py-3.5 text-sm font-semibold text-[#12100E] hover:bg-[#E8A855] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#D98E3F]/20"
                >
                  {bookingState === 'submitting' ? 'Booking…' : 'Confirm Booking'}
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-[#A69E93] hover:bg-white/[0.06] transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── STEP 1: Date, Time & Zone ─────────────────────────────────────

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

  // Simulated slot availability (in production this would come from the backend)
  const getSlotAvailability = useCallback((slot: string) => {
    const hash = slot.charCodeAt(0) + (data.date?.getDate() || 0);
    const avail = ((hash * 7) % 8);
    return avail;
  }, [data.date]);

  return (
    <div className="space-y-8 pt-6 animate-fadeIn">
      {/* Date picker */}
      <div>
        <label className="block text-sm font-semibold text-[#F4EFE8] mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-[#D98E3F]" />
          Select Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {dates.map((d) => {
            const isToday = isSameDay(new Date(), d);
            const isSelected = isSameDay(data.date, d);
            return (
              <button
                key={d.toISOString()}
                onClick={() => update('date', d)}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-center transition-all duration-200 min-w-[72px] ${
                  isSelected
                    ? 'bg-[#D98E3F] border-[#D98E3F] text-[#12100E] shadow-lg shadow-[#D98E3F]/20'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]'
                }`}
              >
                <span className={`block text-[10px] uppercase tracking-wider mb-1 ${
                  isSelected ? 'text-[#12100E]/60' : 'text-[#6B6560]'
                }`}>
                  {isToday ? 'Today' : DAYS[d.getDay()]}
                </span>
                <span className={`block text-xl font-bold ${
                  isSelected ? 'text-[#12100E]' : 'text-[#F4EFE8]'
                }`}>
                  {d.getDate()}
                </span>
                <span className={`block text-[10px] ${
                  isSelected ? 'text-[#12100E]/60' : 'text-[#6B6560]'
                }`}>
                  {MONTHS[d.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <label className="block text-sm font-semibold text-[#F4EFE8] mb-3 flex items-center gap-2">
          <Clock size={16} className="text-[#D98E3F]" />
          Select Time
        </label>
        {!data.date ? (
          <p className="text-sm text-[#6B6560] italic">Pick a date first</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => {
              const avail = getSlotAvailability(slot);
              const soldOut = avail === 0;
              const isSelected = data.timeSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => !soldOut && update('timeSlot', slot)}
                  disabled={soldOut}
                  className={`rounded-xl border py-3 px-2 text-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#D98E3F] border-[#D98E3F] text-[#12100E] shadow-lg shadow-[#D98E3F]/20'
                      : soldOut
                      ? 'border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]'
                  }`}
                >
                  <span className={`block text-sm font-medium ${
                    isSelected ? 'text-[#12100E]' : soldOut ? 'text-[#6B6560]' : 'text-[#F4EFE8]'
                  }`}>
                    {slot}
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${
                    isSelected ? 'text-[#12100E]/60' : soldOut ? 'text-[#6B6560]' : 'text-[#A69E93]'
                  }`}>
                    {soldOut ? 'Full' : `${avail} left`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Party size */}
      <div>
        <label className="block text-sm font-semibold text-[#F4EFE8] mb-3 flex items-center gap-2">
          <Users size={16} className="text-[#D98E3F]" />
          Party Size
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => update('partySize', Math.max(1, data.partySize - 1))}
            disabled={data.partySize <= 1}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#F4EFE8] hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={18} />
          </button>
          <span className="text-3xl font-bold text-[#F4EFE8] min-w-[3rem] text-center font-display">
            {data.partySize}
          </span>
          <button
            onClick={() => update('partySize', Math.min(12, data.partySize + 1))}
            disabled={data.partySize >= 12}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#F4EFE8] hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
          <span className="text-sm text-[#6B6560]">guests</span>
        </div>
      </div>

      {/* Zone selector */}
      <div>
        <label className="block text-sm font-semibold text-[#F4EFE8] mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-[#D98E3F]" />
          Choose Zone
        </label>
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {ZONES.map((zone) => {
              const avail = zoneAvailability[zone.name] || { available: 0, total: 0 };
              const isSelected = data.zone === zone.name;
              const fullyBooked = avail.available === 0;
              return (
                <button
                  key={zone.name}
                  onClick={() => !fullyBooked && update('zone', zone.name)}
                  disabled={fullyBooked}
                  className={`relative rounded-2xl border p-4 text-left transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? 'shadow-lg'
                      : fullyBooked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.01]'
                  }`}
                  style={{
                    borderColor: isSelected ? zone.accent : fullyBooked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                    backgroundColor: isSelected ? zone.accentBg : 'rgba(255,255,255,0.02)',
                    boxShadow: isSelected ? `0 8px 32px ${zone.accent}20` : undefined,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-20 rounded-xl overflow-hidden shrink-0">
                      <Image src={zone.image} alt={zone.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-lg font-bold text-[#F4EFE8]">{zone.name}</span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: zone.accent }}>
                            <Check size={12} className="text-[#12100E]" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#A69E93]">
                        <span>{zone.seats} seats</span>
                        <span className="text-[#6B6560]">·</span>
                        <span>{zone.bestFor}</span>
                      </div>
                    </div>
                    {/* Availability */}
                    <div className="text-right shrink-0">
                      {fullyBooked ? (
                        <span className="text-xs text-red-400/70 font-medium">Fully booked</span>
                      ) : (
                        <>
                          <span className="block text-lg font-bold" style={{ color: zone.accent }}>{avail.available}</span>
                          <span className="block text-[10px] text-[#6B6560]">available</span>
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

// ── STEP 2: Occasion & Requests ───────────────────────────────────

function StepOccasion({
  data, update,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
}) {
  return (
    <div className="space-y-8 pt-6 animate-fadeIn">
      <div className="text-center mb-2">
        <h2 className="font-display text-2xl font-bold text-[#F4EFE8] mb-2">Any special occasion?</h2>
        <p className="text-sm text-[#6B6560]">Optional — skip if you prefer</p>
      </div>

      {/* Occasion chips */}
      <div>
        <label className="block text-sm font-semibold text-[#F4EFE8] mb-3">Occasion</label>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((occ) => {
            const isSelected = data.occasion === occ;
            return (
              <button
                key={occ}
                onClick={() => update('occasion', isSelected ? null : occ)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#D98E3F] border-[#D98E3F] text-[#12100E]'
                    : 'border-white/[0.08] bg-white/[0.02] text-[#A69E93] hover:bg-white/[0.05] hover:border-white/[0.12]'
                }`}
              >
                {occ}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dietary notes */}
      <div>
        <label className="block text-sm font-semibold text-[#F4EFE8] mb-3">Dietary Requirements</label>
        <div className="flex flex-wrap gap-2 mb-3">
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
                className={`rounded-full px-4 py-2 text-xs font-medium border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#7A9B6B]/20 border-[#7A9B6B]/30 text-[#7A9B6B]'
                    : 'border-white/[0.06] bg-white/[0.02] text-[#6B6560] hover:bg-white/[0.04]'
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
          placeholder="Any other dietary needs..."
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[#F4EFE8] placeholder:text-[#6B6560] focus:border-[#D98E3F]/40 focus:outline-none focus:ring-1 focus:ring-[#D98E3F]/20 transition-all"
        />
      </div>

      {/* Special requests */}
      <div>
        <label className="block text-sm font-semibold text-[#F4EFE8] mb-3">Special Requests</label>
        <textarea
          value={data.specialRequests}
          onChange={(e) => update('specialRequests', e.target.value)}
          placeholder='e.g. "window-side table", "birthday cake at 9 PM"'
          rows={3}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[#F4EFE8] placeholder:text-[#6B6560] focus:border-[#D98E3F]/40 focus:outline-none focus:ring-1 focus:ring-[#D98E3F]/20 transition-all resize-none"
        />
      </div>
    </div>
  );
}

// ── STEP 3: Contact & Confirm ─────────────────────────────────────

function StepConfirm({
  data, update, submitting,
}: {
  data: BookingData;
  update: <K extends keyof BookingData>(key: K, value: BookingData[K]) => void;
  submitting: boolean;
}) {
  const isPhoneValid = data.phone.length === 0 || /^\d{10}$/.test(data.phone);
  const zone = ZONES.find((z) => z.name === data.zone);

  return (
    <div className="space-y-8 pt-6 animate-fadeIn">
      {/* Summary card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#1A1815] p-5 space-y-3">
        <h3 className="font-display text-base font-semibold text-[#F4EFE8] flex items-center gap-2">
          <Sparkles size={14} className="text-[#D98E3F]" />
          Reservation Summary
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#6B6560] text-xs block">Date</span>
            <span className="text-[#F4EFE8] font-medium">{data.date?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) || '—'}</span>
          </div>
          <div>
            <span className="text-[#6B6560] text-xs block">Time</span>
            <span className="text-[#F4EFE8] font-medium">{data.timeSlot || '—'}</span>
          </div>
          <div>
            <span className="text-[#6B6560] text-xs block">Zone</span>
            <span className="font-medium" style={{ color: zone?.accent || '#F4EFE8' }}>{data.zone || '—'}</span>
          </div>
          <div>
            <span className="text-[#6B6560] text-xs block">Guests</span>
            <span className="text-[#F4EFE8] font-medium">{data.partySize}</span>
          </div>
        </div>
        {(data.occasion || data.dietaryNotes || data.specialRequests) && (
          <div className="border-t border-white/[0.06] pt-3 space-y-1">
            {data.occasion && <p className="text-xs text-[#A69E93]">🎉 {data.occasion}</p>}
            {data.dietaryNotes && <p className="text-xs text-[#A69E93]">🥗 {data.dietaryNotes}</p>}
            {data.specialRequests && <p className="text-xs text-[#A69E93]">📝 {data.specialRequests}</p>}
          </div>
        )}
      </div>

      {/* Contact form */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-[#F4EFE8]">Your Details</h3>

        <div>
          <label className="block text-xs font-medium text-[#A69E93] mb-1.5">
            Name <span className="text-[#D98E3F]">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-[#F4EFE8] placeholder:text-[#6B6560] focus:border-[#D98E3F]/40 focus:outline-none focus:ring-1 focus:ring-[#D98E3F]/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#A69E93] mb-1.5">
            Phone <span className="text-[#D98E3F]">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3.5 text-sm text-[#6B6560]">+91</span>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-[#F4EFE8] placeholder:text-[#6B6560] focus:border-[#D98E3F]/40 focus:outline-none focus:ring-1 focus:ring-[#D98E3F]/20 transition-all"
            />
          </div>
          {!isPhoneValid && (
            <p className="mt-1 text-xs text-red-400">Please enter a valid 10-digit number</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#A69E93] mb-1.5">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-[#F4EFE8] placeholder:text-[#6B6560] focus:border-[#D98E3F]/40 focus:outline-none focus:ring-1 focus:ring-[#D98E3F]/20 transition-all"
          />
        </div>
      </div>

      {/* Confirmation method */}
      <div>
        <label className="block text-xs font-medium text-[#A69E93] mb-3">Confirm via</label>
        <div className="flex gap-2">
          {(['whatsapp', 'sms', 'email'] as const).map((method) => {
            const isSelected = data.confirmMethod === method;
            const labels = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' };
            return (
              <button
                key={method}
                onClick={() => update('confirmMethod', method)}
                className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#D98E3F]/10 border-[#D98E3F]/30 text-[#D98E3F]'
                    : 'border-white/[0.06] bg-white/[0.02] text-[#6B6560] hover:bg-white/[0.04]'
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

// ── Success Screen ────────────────────────────────────────────────

function SuccessScreen({ data, bookingRef, bookingId }: { data: BookingData; bookingRef: string; bookingId: string }) {
  const zone = ZONES.find((z) => z.name === data.zone);
  const [confirmed, setConfirmed] = useState(false);

  // Request browser notification permission as soon as the success screen mounts
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Poll for admin confirmation every 5 seconds + fire browser notification
  useEffect(() => {
    if (!bookingId || confirmed) return;

    const fireNotification = () => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('SkyDeck — Booking Confirmed! 🎉', {
          body: `Your ${data.zone} table for ${data.partySize} is confirmed. See you tonight!`,
          icon: '/images/skydeck-icon.png',
          badge: '/images/skydeck-icon.png',
          tag: `skydeck-${bookingRef}`,
        });
      }
    };

    // Realtime subscription
    const channel = supabase
      .channel(`booking-confirm-${bookingId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        const updated = payload.new as { id: string; status: string };
        if (updated.id === bookingId && updated.status === 'confirmed') {
          setConfirmed(true);
          fireNotification();
        }
      })
      .subscribe();

    // Polling fallback
    const poll = setInterval(async () => {
      const { data: row } = await supabase.from('bookings').select('status').eq('id', bookingId).single();
      if (row?.status === 'confirmed') {
        setConfirmed(true);
        fireNotification();
      }
    }, 5000);

    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [bookingId, confirmed, data.zone, data.partySize, bookingRef]);

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
    <div className="min-h-screen bg-[#12100E] flex items-center justify-center p-5">
      <div className="w-full max-w-md text-center animate-fadeIn">
        {/* Celebration icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#D98E3F]/10 border border-[#D98E3F]/20">
          <PartyPopper size={36} className="text-[#D98E3F]" />
        </div>

        <h1 className="font-display text-3xl font-bold text-[#F4EFE8] mb-2">You&apos;re all set!</h1>
        <p className="text-[#A69E93] mb-2">Your reservation request has been received.</p>
        <p className="text-xs text-[#6B6560] mb-8 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Waiting for staff confirmation…
        </p>

        {/* Ticket card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#1A1815] overflow-hidden mb-8 text-left">
          <div className="px-6 py-4 border-b border-dashed border-white/[0.08]" style={{ backgroundColor: zone?.accentBg }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-[#F4EFE8]">SkyDeck</span>
              <span className="font-mono text-sm font-bold" style={{ color: zone?.accent }}>#{bookingRef}</span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#6B6560] text-xs block mb-0.5">Date</span>
                <span className="text-[#F4EFE8] font-medium">{data.date?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="text-[#6B6560] text-xs block mb-0.5">Time</span>
                <span className="text-[#F4EFE8] font-medium">{data.timeSlot}</span>
              </div>
              <div>
                <span className="text-[#6B6560] text-xs block mb-0.5">Zone</span>
                <span className="font-medium" style={{ color: zone?.accent }}>{data.zone}</span>
              </div>
              <div>
                <span className="text-[#6B6560] text-xs block mb-0.5">Guests</span>
                <span className="text-[#F4EFE8] font-medium">{data.partySize}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#6B6560] text-xs block mb-0.5">Guest</span>
                <span className="text-[#F4EFE8] font-medium">{data.name}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#6B6560]">Confirmation via {data.confirmMethod}</span>
            <span className="text-xs text-[#A69E93]">Pending confirmation</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm font-medium text-[#F4EFE8] hover:bg-white/[0.06] transition-colors"
          >
            <Calendar size={16} />
            Add to Calendar
          </a>

          <a
            href="https://maps.google.com/?q=SkyDeck+Pimpri+Chinchwad+Pune"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm font-medium text-[#F4EFE8] hover:bg-white/[0.06] transition-colors"
          >
            <MapPin size={16} />
            Get Directions
          </a>

          <Link
            href="/"
            className="block w-full rounded-xl bg-[#D98E3F] py-3.5 text-sm font-semibold text-[#12100E] hover:bg-[#E8A855] transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#6B6560] leading-relaxed max-w-sm mx-auto">
          ☀️ <strong className="text-[#A69E93]">Rooftop tip:</strong> Evenings can get breezy — we recommend a light layer. Smart casual dress code.
        </p>
      </div>

      {/* Confirmation overlay — shown when admin confirms */}
      {confirmed && (
        <ConfirmationOverlay
          data={data}
          bookingRef={bookingRef}
          calendarUrl={calendarUrl}
          onDismiss={() => setConfirmed(false)}
        />
      )}
    </div>
  );
}

// ── Error Screen ──────────────────────────────────────────────────

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#12100E] flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center animate-fadeIn">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <span className="text-3xl">😔</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-[#F4EFE8] mb-3">Booking Failed</h2>
        <p className="text-sm text-[#A69E93] mb-6">{message}</p>

        <button
          onClick={onRetry}
          className="w-full rounded-xl bg-[#D98E3F] py-3.5 text-sm font-semibold text-[#12100E] hover:bg-[#E8A855] transition-colors mb-3"
        >
          Try Again
        </button>

        <p className="text-xs text-[#6B6560]">
          Or call us: <a href="tel:+919876543210" className="text-[#D98E3F] hover:underline">+91 98765 43210</a>
        </p>
      </div>
    </div>
  );
}

// ── Confirmation Overlay ──────────────────────────────────────────

function ConfirmationOverlay({
  data,
  bookingRef,
  calendarUrl,
  onDismiss,
}: {
  data: BookingData;
  bookingRef: string;
  calendarUrl: string;
  onDismiss: () => void;
}) {
  const zone = ZONES.find((z) => z.name === data.zone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#12100E]/80 backdrop-blur-md" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#D98E3F]/20 bg-[#1A1815] p-8 shadow-2xl shadow-[#D98E3F]/10 animate-slide-up text-center">
        {/* Ambient glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 bg-[#D98E3F]/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xl transition-colors"
        >
          ×
        </button>

        {/* Celebration icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
          <Check size={40} className="text-emerald-400" />
        </div>

        <h2 className="font-display text-3xl font-bold text-[#F4EFE8] mb-2">
          You&apos;re confirmed! 🎉
        </h2>
        <p className="text-sm text-[#A69E93] mb-6">
          The SkyDeck team has confirmed your reservation. We can&apos;t wait to welcome you!
        </p>

        {/* Confirmed details */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6 text-left">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[#6B6560] text-xs block">Zone</span>
              <span className="font-semibold" style={{ color: zone?.accent }}>{data.zone}</span>
            </div>
            <div>
              <span className="text-[#6B6560] text-xs block">Guests</span>
              <span className="text-[#F4EFE8] font-semibold">{data.partySize}</span>
            </div>
            {data.date && (
              <div>
                <span className="text-[#6B6560] text-xs block">Date</span>
                <span className="text-[#F4EFE8] font-medium text-xs">
                  {data.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
            {data.timeSlot && (
              <div>
                <span className="text-[#6B6560] text-xs block">Time</span>
                <span className="text-[#F4EFE8] font-medium text-xs">{data.timeSlot}</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#6B6560]">Ref: <span className="font-mono font-bold text-[#D98E3F]">#{bookingRef}</span></span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <Check size={12} /> Confirmed
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-[#F4EFE8] hover:bg-white/[0.06] transition-colors"
          >
            <Calendar size={15} />
            Add to Calendar
          </a>
          <a
            href="https://maps.google.com/?q=SkyDeck+Pimpri+Chinchwad+Pune"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-[#F4EFE8] hover:bg-white/[0.06] transition-colors"
          >
            <MapPin size={15} />
            Get Directions
          </a>
          <button
            onClick={onDismiss}
            className="w-full rounded-xl bg-[#D98E3F] py-3 text-sm font-semibold text-[#12100E] hover:bg-[#E8A855] transition-colors"
          >
            Got It
          </button>
        </div>

        <p className="mt-5 text-xs text-[#6B6560]">
          Smart casual dress code · Rooftop can be breezy
        </p>
      </div>
    </div>
  );
}
