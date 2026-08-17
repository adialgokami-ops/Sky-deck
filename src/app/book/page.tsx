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

// ── Constants: Light, Warm Premium Palette ────────────────────────

const ZONES: { name: Zone; image: string; seats: string; bestFor: string; accent: string; accentBg: string; accentBorder: string }[] = [
  { name: 'Rooftop', image: '/images/zone-rooftop.jpg', seats: '2–8', bestFor: 'Date night, skyline views', accent: '#C87A28', accentBg: 'rgba(200,122,40,0.08)', accentBorder: 'rgba(200,122,40,0.28)' },
  { name: 'Indoor AC', image: '/images/zone-indoor.jpg', seats: '2–12', bestFor: 'Family, celebrations', accent: '#1E5373', accentBg: 'rgba(30,83,115,0.08)', accentBorder: 'rgba(30,83,115,0.28)' },
  { name: 'Outdoor', image: '/images/zone-outdoor.jpg', seats: '2–6', bestFor: 'Casual, group drinks', accent: '#3B6B38', accentBg: 'rgba(59,107,56,0.08)', accentBorder: 'rgba(59,107,56,0.28)' },
  { name: 'Family Bar', image: '/images/zone-familybar.jpg', seats: '2–10', bestFor: 'Families, live buzz', accent: '#B84A2B', accentBg: 'rgba(184,74,43,0.08)', accentBorder: 'rgba(184,74,43,0.28)' },
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

  const update = useCallback(
    <K extends keyof BookingData>(key: K, value: BookingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ── Live availability counts per zone ──
  const zoneAvailability = useMemo(() => {
    const map: Record<string, { available: number; total: number }> = {};
    for (const z of ZONES) {
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
    <div className="min-h-screen bg-[#FBF6EE] text-[#3A2E26] relative">
      {/* Subtle warm golden glow behind header */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-72 bg-gradient-to-b from-[#F3E6D5]/60 via-[#F9F1E6]/30 to-transparent blur-3xl -z-10" />

      {/* Header */}
      <header className="border-b border-[#E8DFD3] bg-[#FBF6EE]/90 backdrop-blur-lg sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="mx-auto max-w-2xl px-5 flex items-center justify-between h-14">
          <Link href="/" className="flex items-baseline gap-0.5 group">
            <span className="font-display text-xl font-bold text-[#3A2E26] group-hover:text-[#2A201A] transition-colors">Sky</span>
            <span className="font-display text-xl font-bold text-[#C87A28]">Deck</span>
          </Link>

          {/* Mode toggle — warm pill */}
          <button
            onClick={() => setMode(mode === 'now' ? 'later' : 'now')}
            className="flex items-center gap-1.5 rounded-full border border-[#E3D9CC] bg-[#F2ECE1] px-3.5 py-1.5 text-xs font-semibold text-[#7A6D63] hover:text-[#3A2E26] hover:bg-[#EAE2D5] shadow-sm transition-all"
          >
            {mode === 'now' ? (
              <>
                <CalendarClock size={13} className="text-[#C87A28]" />
                <span>Book for Later</span>
              </>
            ) : (
              <>
                <Clock size={13} className="text-[#C87A28]" />
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
        <div className="mx-auto max-w-2xl px-4 pb-12">
          {/* Title */}
          <div className="pt-7 pb-4 text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E26] tracking-tight mb-1.5">
              Book Now
            </h1>
            <p className="text-sm font-medium text-[#7A6D63] flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3B6B38] animate-pulse" />
              Live Table Availability
            </p>
          </div>

          {/* Zone Tabs — 2×2 on mobile, 4-across on sm+ */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ZONE_NAMES.map((zone) => {
              const avail = zoneAvailability[zone] || { available: 0, total: 0 };
              const isActive = activeZone === zone;
              const zoneData = ZONES.find((z) => z.name === zone);
              return (
                <button
                  key={zone}
                  onClick={() => setActiveZone(zone as typeof activeZone)}
                  className={`rounded-2xl p-3 text-sm font-medium transition-all duration-200 border text-left shadow-sm ${
                    isActive
                      ? 'shadow-md'
                      : 'border-[#E8DFD3] bg-white text-[#7A6D63] hover:text-[#3A2E26] hover:bg-[#F9F5EE]'
                  }`}
                  style={isActive ? {
                    backgroundColor: zoneData?.accentBg,
                    borderColor: zoneData?.accentBorder,
                    boxShadow: `0 4px 14px ${zoneData?.accent}18`,
                  } : {}}
                >
                  <span className="block font-semibold text-sm text-[#3A2E26] truncate">{zone}</span>
                  <span
                    className="text-xs font-bold mt-0.5 block"
                    style={{ color: isActive ? zoneData?.accent : '#7A6D63' }}
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
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C87A28]/30 border-t-[#C87A28]" />
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
            <div className="py-20 text-center rounded-2xl border border-dashed border-[#E8DFD3] bg-white/60 p-8 my-4">
              <p className="text-sm font-medium text-[#7A6D63]">No tables available in this zone right now.</p>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center text-xs text-[#8C7D73]">
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
                    step === s ? 'bg-[#D98E3F] text-white shadow-md shadow-[#D98E3F]/30' :
                    step > s ? 'bg-[#D98E3F]/15 text-[#C87A28] border border-[#D98E3F]/30' :
                    'bg-[#EAE2D5] text-[#8C7D73]'
                  }`}>
                    {step > s ? <Check size={14} strokeWidth={2.5} /> : s}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${
                    step >= s ? 'text-[#3A2E26]' : 'text-[#8C7D73]'
                  }`}>
                    {s === 1 ? 'Date & Zone' : s === 2 ? 'Details' : 'Confirm'}
                  </span>
                  {s < 3 && <div className={`flex-1 h-[1px] ${step > s ? 'bg-[#D98E3F]/40' : 'bg-[#E3D9CC]'}`} />}
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
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E8DFD3] bg-[#FBF6EE]/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <div className="mx-auto max-w-2xl px-5 py-4 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="rounded-xl border border-[#E8DFD3] bg-white px-5 py-3.5 text-sm font-semibold text-[#7A6D63] hover:text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors"
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
                  className="flex-1 rounded-xl bg-[#D98E3F] py-3.5 text-sm font-bold text-white hover:bg-[#E8A855] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#D98E3F]/25 active:scale-[0.99]"
                >
                  {step === 2 ? 'Continue to Confirm' : 'Continue'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedStep3 || bookingState === 'submitting'}
                  className="flex-1 rounded-xl bg-[#D98E3F] py-3.5 text-sm font-bold text-white hover:bg-[#E8A855] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#D98E3F]/25 active:scale-[0.99]"
                >
                  {bookingState === 'submitting' ? 'Booking…' : 'Confirm Booking'}
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  className="rounded-xl border border-[#E8DFD3] bg-white px-5 py-3.5 text-sm font-semibold text-[#7A6D63] hover:text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors"
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

  // Simulated slot availability
  const getSlotAvailability = useCallback((slot: string) => {
    const hash = slot.charCodeAt(0) + (data.date?.getDate() || 0);
    const avail = ((hash * 7) % 8);
    return avail;
  }, [data.date]);

  return (
    <div className="space-y-8 pt-6 animate-fadeIn">
      {/* Date picker */}
      <div>
        <label className="block text-sm font-bold text-[#3A2E26] mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-[#C87A28]" />
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
                className={`shrink-0 rounded-2xl border px-4 py-3 text-center transition-all duration-200 min-w-[72px] shadow-sm ${
                  isSelected
                    ? 'bg-[#D98E3F] border-[#D98E3F] text-white shadow-md shadow-[#D98E3F]/30 scale-[1.02]'
                    : 'border-[#E8DFD3] bg-white text-[#3A2E26] hover:bg-[#F9F5EE] hover:border-[#DACFC0]'
                }`}
              >
                <span className={`block text-[10px] uppercase font-semibold tracking-wider mb-1 ${
                  isSelected ? 'text-white/85' : 'text-[#7A6D63]'
                }`}>
                  {isToday ? 'Today' : DAYS[d.getDay()]}
                </span>
                <span className={`block text-xl font-bold font-display ${
                  isSelected ? 'text-white' : 'text-[#3A2E26]'
                }`}>
                  {d.getDate()}
                </span>
                <span className={`block text-[10px] font-medium ${
                  isSelected ? 'text-white/85' : 'text-[#7A6D63]'
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
        <label className="block text-sm font-bold text-[#3A2E26] mb-3 flex items-center gap-2">
          <Clock size={16} className="text-[#C87A28]" />
          Select Time
        </label>
        {!data.date ? (
          <p className="text-sm text-[#7A6D63] italic">Pick a date first to view time slots</p>
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
                  className={`rounded-xl border py-3 px-2 text-center transition-all duration-200 shadow-sm ${
                    isSelected
                      ? 'bg-[#D98E3F] border-[#D98E3F] text-white shadow-md shadow-[#D98E3F]/30'
                      : soldOut
                      ? 'border-[#EAE2D5] bg-[#F2ECE1] opacity-50 cursor-not-allowed'
                      : 'border-[#E8DFD3] bg-white text-[#3A2E26] hover:bg-[#F9F5EE] hover:border-[#DACFC0]'
                  }`}
                >
                  <span className={`block text-sm font-semibold ${
                    isSelected ? 'text-white' : soldOut ? 'text-[#8C7D73]' : 'text-[#3A2E26]'
                  }`}>
                    {slot}
                  </span>
                  <span className={`block text-[10px] font-medium mt-0.5 ${
                    isSelected ? 'text-white/85' : soldOut ? 'text-[#8C7D73]' : 'text-[#7A6D63]'
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
        <label className="block text-sm font-bold text-[#3A2E26] mb-3 flex items-center gap-2">
          <Users size={16} className="text-[#C87A28]" />
          Party Size
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => update('partySize', Math.max(1, data.partySize - 1))}
            disabled={data.partySize <= 1}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8DFD3] bg-white text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={18} />
          </button>
          <span className="text-3xl font-bold text-[#3A2E26] min-w-[3rem] text-center font-display">
            {data.partySize}
          </span>
          <button
            onClick={() => update('partySize', Math.min(12, data.partySize + 1))}
            disabled={data.partySize >= 12}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8DFD3] bg-white text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
          </button>
          <span className="text-sm font-medium text-[#7A6D63]">guests</span>
        </div>
      </div>

      {/* Zone selector */}
      <div>
        <label className="block text-sm font-bold text-[#3A2E26] mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-[#C87A28]" />
          Choose Zone
        </label>
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-[#E8DFD3] bg-white h-24 animate-pulse shadow-sm" />
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
                  className={`relative rounded-2xl border p-4 text-left transition-all duration-300 overflow-hidden shadow-sm ${
                    isSelected
                      ? 'shadow-md ring-2 ring-offset-2 ring-offset-[#FBF6EE]'
                      : fullyBooked
                      ? 'opacity-50 cursor-not-allowed bg-[#F2ECE1] border-[#EAE2D5]'
                      : 'hover:scale-[1.01] bg-white border-[#E8DFD3] hover:border-[#DACFC0]'
                  }`}
                  style={{
                    borderColor: isSelected ? zone.accent : undefined,
                    backgroundColor: isSelected ? zone.accentBg : undefined,
                    boxShadow: isSelected ? `0 6px 20px ${zone.accent}20` : undefined,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-20 rounded-xl overflow-hidden shrink-0 border border-[#E8DFD3]/60 shadow-inner">
                      <Image src={zone.image} alt={zone.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display text-lg font-bold text-[#3A2E26]">{zone.name}</span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: zone.accent }}>
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-[#7A6D63]">
                        <span>{zone.seats} seats</span>
                        <span>·</span>
                        <span className="truncate">{zone.bestFor}</span>
                      </div>
                    </div>
                    {/* Availability */}
                    <div className="text-right shrink-0">
                      {fullyBooked ? (
                        <span className="text-xs text-red-600 font-semibold">Full</span>
                      ) : (
                        <>
                          <span className="block text-xl font-bold font-display" style={{ color: zone.accent }}>{avail.available}</span>
                          <span className="block text-[10px] font-medium text-[#7A6D63]">available</span>
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
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A2E26] mb-2">Any special occasion?</h2>
        <p className="text-sm text-[#7A6D63]">Optional — feel free to skip if you prefer</p>
      </div>

      {/* Occasion chips */}
      <div>
        <label className="block text-sm font-bold text-[#3A2E26] mb-3">Occasion</label>
        <div className="flex flex-wrap gap-2.5">
          {OCCASIONS.map((occ) => {
            const isSelected = data.occasion === occ;
            return (
              <button
                key={occ}
                onClick={() => update('occasion', isSelected ? null : occ)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold border transition-all duration-200 shadow-sm ${
                  isSelected
                    ? 'bg-[#D98E3F] border-[#D98E3F] text-white shadow-md shadow-[#D98E3F]/25'
                    : 'border-[#E8DFD3] bg-white text-[#7A6D63] hover:text-[#3A2E26] hover:bg-[#F9F5EE]'
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
        <label className="block text-sm font-bold text-[#3A2E26] mb-3">Dietary Requirements</label>
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
                className={`rounded-full px-4 py-2 text-xs font-semibold border transition-all duration-200 shadow-sm ${
                  isSelected
                    ? 'bg-[#3B6B38]/15 border-[#3B6B38]/40 text-[#3B6B38]'
                    : 'border-[#E8DFD3] bg-white text-[#7A6D63] hover:bg-[#F9F5EE]'
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
          className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3.5 text-sm text-[#3A2E26] placeholder:text-[#A3968B] focus:border-[#D98E3F] focus:outline-none focus:ring-2 focus:ring-[#D98E3F]/20 shadow-sm transition-all"
        />
      </div>

      {/* Special requests */}
      <div>
        <label className="block text-sm font-bold text-[#3A2E26] mb-3">Special Requests</label>
        <textarea
          value={data.specialRequests}
          onChange={(e) => update('specialRequests', e.target.value)}
          placeholder='e.g. "corner table with city view", "birthday dessert at 9 PM"'
          rows={3}
          className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3.5 text-sm text-[#3A2E26] placeholder:text-[#A3968B] focus:border-[#D98E3F] focus:outline-none focus:ring-2 focus:ring-[#D98E3F]/20 shadow-sm transition-all resize-none"
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
      <div className="rounded-2xl border border-[#E8DFD3] bg-white p-5 space-y-3.5 shadow-sm">
        <h3 className="font-display text-base font-bold text-[#3A2E26] flex items-center gap-2">
          <Sparkles size={16} className="text-[#C87A28]" />
          Reservation Summary
        </h3>
        <div className="grid grid-cols-2 gap-3.5 text-sm">
          <div>
            <span className="text-[#7A6D63] text-xs block font-medium">Date</span>
            <span className="text-[#3A2E26] font-bold">{data.date?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) || '—'}</span>
          </div>
          <div>
            <span className="text-[#7A6D63] text-xs block font-medium">Time</span>
            <span className="text-[#3A2E26] font-bold">{data.timeSlot || '—'}</span>
          </div>
          <div>
            <span className="text-[#7A6D63] text-xs block font-medium">Zone</span>
            <span className="font-bold" style={{ color: zone?.accent || '#3A2E26' }}>{data.zone || '—'}</span>
          </div>
          <div>
            <span className="text-[#7A6D63] text-xs block font-medium">Guests</span>
            <span className="text-[#3A2E26] font-bold">{data.partySize}</span>
          </div>
        </div>
        {(data.occasion || data.dietaryNotes || data.specialRequests) && (
          <div className="border-t border-[#E8DFD3]/80 pt-3 space-y-1.5">
            {data.occasion && <p className="text-xs text-[#7A6D63]">🎉 <strong className="text-[#3A2E26]">Occasion:</strong> {data.occasion}</p>}
            {data.dietaryNotes && <p className="text-xs text-[#7A6D63]">🥗 <strong className="text-[#3A2E26]">Dietary:</strong> {data.dietaryNotes}</p>}
            {data.specialRequests && <p className="text-xs text-[#7A6D63]">📝 <strong className="text-[#3A2E26]">Requests:</strong> {data.specialRequests}</p>}
          </div>
        )}
      </div>

      {/* Contact form */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-bold text-[#3A2E26]">Your Details</h3>

        <div>
          <label className="block text-xs font-bold text-[#3A2E26] mb-1.5">
            Full Name <span className="text-[#C87A28]">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Aditi Rao"
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3.5 text-sm text-[#3A2E26] placeholder:text-[#A3968B] focus:border-[#D98E3F] focus:outline-none focus:ring-2 focus:ring-[#D98E3F]/20 shadow-sm transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#3A2E26] mb-1.5">
            Mobile Number <span className="text-[#C87A28]">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-[#E8DFD3] bg-[#F7F2E9] px-3.5 py-3.5 text-sm font-semibold text-[#7A6D63] shadow-sm">+91</span>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="flex-1 rounded-xl border border-[#E8DFD3] bg-white px-4 py-3.5 text-sm text-[#3A2E26] placeholder:text-[#A3968B] focus:border-[#D98E3F] focus:outline-none focus:ring-2 focus:ring-[#D98E3F]/20 shadow-sm transition-all"
            />
          </div>
          {!isPhoneValid && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">Please enter a valid 10-digit mobile number</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[#3A2E26] mb-1.5">Email (Optional)</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="aditi@example.com"
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3.5 text-sm text-[#3A2E26] placeholder:text-[#A3968B] focus:border-[#D98E3F] focus:outline-none focus:ring-2 focus:ring-[#D98E3F]/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Confirmation method */}
      <div>
        <label className="block text-xs font-bold text-[#3A2E26] mb-3">Send Confirmation Via</label>
        <div className="flex gap-2.5">
          {(['whatsapp', 'sms', 'email'] as const).map((method) => {
            const isSelected = data.confirmMethod === method;
            const labels = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' };
            return (
              <button
                key={method}
                onClick={() => update('confirmMethod', method)}
                className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all shadow-sm ${
                  isSelected
                    ? 'bg-[#D98E3F]/15 border-[#D98E3F] text-[#C87A28]'
                    : 'border-[#E8DFD3] bg-white text-[#7A6D63] hover:text-[#3A2E26] hover:bg-[#F9F5EE]'
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C87A28]/30 border-t-[#C87A28]" />
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
    <div className="min-h-screen bg-[#FBF6EE] flex items-center justify-center p-5 text-[#3A2E26]">
      <div className="w-full max-w-md text-center animate-fadeIn">
        {/* Celebration icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#D98E3F]/15 border-2 border-[#D98E3F]/30 shadow-md">
          <PartyPopper size={36} className="text-[#C87A28]" />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3A2E26] mb-2">You&apos;re all set!</h1>
        <p className="text-[#7A6D63] font-medium mb-2">Your reservation request has been received.</p>
        <p className="text-xs text-[#8C7D73] font-semibold mb-8 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#C87A28] animate-pulse" />
          Waiting for staff confirmation…
        </p>

        {/* Ticket card */}
        <div className="rounded-3xl border border-[#E8DFD3] bg-white overflow-hidden mb-8 text-left shadow-lg shadow-amber-950/5">
          <div className="px-6 py-4 border-b border-dashed border-[#E8DFD3]" style={{ backgroundColor: zone?.accentBg }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold text-[#3A2E26]">SkyDeck</span>
              <span className="font-mono text-base font-bold" style={{ color: zone?.accent }}>#{bookingRef}</span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#7A6D63] text-xs block font-medium mb-0.5">Date</span>
                <span className="text-[#3A2E26] font-bold">{data.date?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div>
                <span className="text-[#7A6D63] text-xs block font-medium mb-0.5">Time</span>
                <span className="text-[#3A2E26] font-bold">{data.timeSlot}</span>
              </div>
              <div>
                <span className="text-[#7A6D63] text-xs block font-medium mb-0.5">Zone</span>
                <span className="font-bold" style={{ color: zone?.accent }}>{data.zone}</span>
              </div>
              <div>
                <span className="text-[#7A6D63] text-xs block font-medium mb-0.5">Guests</span>
                <span className="text-[#3A2E26] font-bold">{data.partySize}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#7A6D63] text-xs block font-medium mb-0.5">Guest</span>
                <span className="text-[#3A2E26] font-bold">{data.name}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#F9F5EE] border-t border-[#E8DFD3] flex items-center justify-between">
            <span className="text-xs text-[#7A6D63] font-medium">Confirmation via {data.confirmMethod}</span>
            <span className="text-xs text-[#C87A28] font-bold">Pending confirmation</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#E8DFD3] bg-white py-3.5 text-sm font-bold text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors"
          >
            <Calendar size={16} className="text-[#C87A28]" />
            Add to Calendar
          </a>

          <a
            href="https://maps.google.com/?q=SkyDeck+Pimpri+Chinchwad+Pune"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#E8DFD3] bg-white py-3.5 text-sm font-bold text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors"
          >
            <MapPin size={16} className="text-[#C87A28]" />
            Get Directions
          </a>

          <Link
            href="/"
            className="block w-full rounded-xl bg-[#D98E3F] py-3.5 text-sm font-bold text-white hover:bg-[#E8A855] shadow-lg shadow-[#D98E3F]/25 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-xs text-[#7A6D63] leading-relaxed max-w-sm mx-auto">
          ☀️ <strong className="text-[#3A2E26]">Rooftop tip:</strong> Evenings can get breezy — we recommend a light layer. Smart casual dress code.
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
    <div className="min-h-screen bg-[#FBF6EE] flex items-center justify-center p-5 text-[#3A2E26]">
      <div className="w-full max-w-sm text-center rounded-3xl border border-[#E8DFD3] bg-white p-8 shadow-lg shadow-amber-950/5 animate-fadeIn">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 border border-red-200">
          <span className="text-3xl">😔</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-[#3A2E26] mb-3">Booking Failed</h2>
        <p className="text-sm text-[#7A6D63] mb-6">{message}</p>

        <button
          onClick={onRetry}
          className="w-full rounded-xl bg-[#D98E3F] py-3.5 text-sm font-bold text-white hover:bg-[#E8A855] shadow-lg shadow-[#D98E3F]/25 transition-colors mb-4"
        >
          Try Again
        </button>

        <p className="text-xs text-[#8C7D73]">
          Or call us directly: <a href="tel:+919876543210" className="text-[#C87A28] font-bold hover:underline">+91 98765 43210</a>
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
      <div className="absolute inset-0 bg-[#2E241E]/50 backdrop-blur-md" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#E8DFD3] bg-[#FDFBF7] p-8 shadow-2xl shadow-amber-950/20 animate-slide-up text-center text-[#3A2E26]">
        {/* Ambient warm glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 bg-[#D98E3F]/15 blur-[80px] rounded-full pointer-events-none" />

        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-[#7A6D63] hover:text-[#3A2E26] text-2xl transition-colors"
        >
          ×
        </button>

        {/* Celebration icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-300 shadow-sm">
          <Check size={40} className="text-emerald-600" strokeWidth={2.5} />
        </div>

        <h2 className="font-display text-3xl font-bold text-[#3A2E26] mb-2">
          You&apos;re confirmed! 🎉
        </h2>
        <p className="text-sm text-[#7A6D63] font-medium mb-6">
          The SkyDeck team has confirmed your reservation. We can&apos;t wait to welcome you!
        </p>

        {/* Confirmed details */}
        <div className="rounded-2xl border border-[#E8DFD3] bg-white p-4 mb-6 text-left shadow-sm">
          <div className="grid grid-cols-2 gap-3.5 text-sm">
            <div>
              <span className="text-[#7A6D63] text-xs block font-medium">Zone</span>
              <span className="font-bold" style={{ color: zone?.accent }}>{data.zone}</span>
            </div>
            <div>
              <span className="text-[#7A6D63] text-xs block font-medium">Guests</span>
              <span className="text-[#3A2E26] font-bold">{data.partySize}</span>
            </div>
            {data.date && (
              <div>
                <span className="text-[#7A6D63] text-xs block font-medium">Date</span>
                <span className="text-[#3A2E26] font-bold text-xs">
                  {data.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
            {data.timeSlot && (
              <div>
                <span className="text-[#7A6D63] text-xs block font-medium">Time</span>
                <span className="text-[#3A2E26] font-bold text-xs">{data.timeSlot}</span>
              </div>
            )}
          </div>
          <div className="mt-3.5 pt-3 border-t border-[#E8DFD3] flex items-center justify-between">
            <span className="text-xs text-[#7A6D63] font-medium">Ref: <span className="font-mono font-bold text-[#C87A28]">#{bookingRef}</span></span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300/60 rounded-full px-2.5 py-0.5 flex items-center gap-1">
              <Check size={12} strokeWidth={2.5} /> Confirmed
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#E8DFD3] bg-white py-3.5 text-sm font-bold text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors"
          >
            <Calendar size={15} className="text-[#C87A28]" />
            Add to Calendar
          </a>
          <a
            href="https://maps.google.com/?q=SkyDeck+Pimpri+Chinchwad+Pune"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#E8DFD3] bg-white py-3.5 text-sm font-bold text-[#3A2E26] hover:bg-[#F9F5EE] shadow-sm transition-colors"
          >
            <MapPin size={15} className="text-[#C87A28]" />
            Get Directions
          </a>
          <button
            onClick={onDismiss}
            className="w-full rounded-xl bg-[#D98E3F] py-3.5 text-sm font-bold text-white hover:bg-[#E8A855] shadow-lg shadow-[#D98E3F]/25 transition-colors"
          >
            Got It
          </button>
        </div>

        <p className="mt-5 text-xs text-[#8C7D73]">
          Smart casual dress code · Rooftop can be breezy
        </p>
      </div>
    </div>
  );
}
