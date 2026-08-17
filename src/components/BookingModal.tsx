'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Minus, Plus, CheckCircle2, AlertCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Table } from '@/lib/types';
import { EXPIRY_MINUTES } from '@/lib/types';

interface BookingModalProps {
  table: Table;
  onClose: () => void;
  onBooked: () => void;
}

type ModalState = 'form' | 'submitting' | 'confirmed' | 'transitioning' | 'admin_confirmed' | 'admin_cancelled' | 'expired' | 'error';

export default function BookingModal({ table, onClose, onBooked }: BookingModalProps) {
  const [state, setState] = useState<ModalState>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [countdown, setCountdown] = useState(EXPIRY_MINUTES * 60);
  const [bookingCreatedAt, setBookingCreatedAt] = useState<Date | null>(null);
  const bookingIdRef = useRef<string | null>(null);

  // Phone validation: exactly 10 digits (India format)
  const isPhoneValid = /^\d{10}$/.test(phone);
  const isFormValid = name.trim().length > 0 && isPhoneValid && partySize >= 1;

  // Helper to transition modal state based on booking status from DB
  // Uses a brief 'transitioning' state so the UI closes the pending popup
  // visually before the confirmed popup opens — clear before/after moment.
  const handleBookingStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'confirmed') {
      // Step 1: transition out (briefly hide body content, keep modal frame)
      setState('transitioning');
      // Step 2: after short pause, show new distinct confirmed popup
      setTimeout(() => {
        setState('admin_confirmed');
        // Fire browser push notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('SkyDeck — Booking Confirmed! 🎉', {
            body: `Your table has been confirmed. Please proceed to your table. Enjoy SkyDeck!`,
            icon: '/images/skydeck-icon.png',
            tag: 'skydeck-booking-confirmed',
          });
        }
      }, 400);
    } else if (newStatus === 'cancelled') {
      setState('admin_cancelled');
    } else if (newStatus === 'expired') {
      setState('expired');
    }
  }, []);

  // Request browser notification permission when the user has a pending booking
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Subscribe to realtime booking status changes after booking is created
  useEffect(() => {
    if (!bookingIdRef.current || state === 'form' || state === 'submitting' || state === 'error') return;

    const bookingId = bookingIdRef.current;

    const channel = supabase
      .channel(`booking-modal-${bookingId}`)
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
            handleBookingStatusChange(updated.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state, handleBookingStatusChange]);

  // Polling fallback: check booking status every 5 seconds
  useEffect(() => {
    if (!bookingIdRef.current || state !== 'confirmed') return;

    const bookingId = bookingIdRef.current;

    const pollStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .single();

        if (!error && data && data.status !== 'pending') {
          handleBookingStatusChange(data.status);
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [state, handleBookingStatusChange]);

  // Countdown timer — only runs in 'confirmed' (pending) state
  useEffect(() => {
    if (state !== 'confirmed' || !bookingCreatedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - bookingCreatedAt.getTime()) / 1000);
      const remaining = EXPIRY_MINUTES * 60 - elapsed;
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(interval);
        setState('expired');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, bookingCreatedAt]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    setState('submitting');

    try {
      // Race condition guard: re-check table is still available
      const { data: freshTable, error: fetchError } = await supabase
        .from('tables')
        .select('status')
        .eq('id', table.id)
        .single();

      if (fetchError || !freshTable) {
        setErrorMsg('Unable to verify table status. Please try again.');
        setState('error');
        return;
      }

      if (freshTable.status !== 'available') {
        setErrorMsg('Sorry, this table was just taken — please pick another.');
        setState('error');
        return;
      }

      // Insert booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          table_id: table.id,
          guest_name: name.trim(),
          phone: phone.trim(),
          party_size: partySize,
          note: note.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError || !booking) {
        setErrorMsg('Failed to create booking. Please try again.');
        setState('error');
        return;
      }

      // Update table to pending
      await supabase
        .from('tables')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', table.id);

      // Store the booking ID for realtime subscription
      bookingIdRef.current = booking.id;

      // Show confirmation
      setBookingRef(booking.id.slice(-6).toUpperCase());
      setBookingCreatedAt(new Date(booking.created_at));
      setState('confirmed');
      onBooked();
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
    }
  }, [isFormValid, table.id, name, phone, partySize, note, onBooked]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-white/10 bg-white/95 dark:bg-[#1a1a22]/95 p-6 shadow-2xl backdrop-blur-md animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-stone-400 dark:text-white/40 transition-colors hover:bg-stone-100 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        {/* ── FORM STATE ── */}
        {state === 'form' && (
          <>
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-1">
              Book Table {table.label}
            </h2>
            <p className="text-sm text-stone-500 dark:text-white/50 mb-6">
              {table.zone} · {table.capacity} seats
            </p>

            {/* Name */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-stone-600 dark:text-white/70">
                Name <span className="text-amber-600 dark:text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-4 py-3 text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-white/30 focus:border-amber-400 dark:focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-300/40 dark:focus:ring-amber-500/30 transition-colors"
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-stone-600 dark:text-white/70">
                Phone <span className="text-amber-600 dark:text-amber-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-3 py-3 text-sm text-stone-500 dark:text-white/50">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className="flex-1 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-4 py-3 text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-white/30 focus:border-amber-400 dark:focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-300/40 dark:focus:ring-amber-500/30 transition-colors"
                />
              </div>
              {phone.length > 0 && !isPhoneValid && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Please enter a valid 10-digit phone number
                </p>
              )}
            </div>

            {/* Party Size Stepper */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-stone-600 dark:text-white/70">
                Party Size
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPartySize((s) => Math.max(1, s - 1))}
                  disabled={partySize <= 1}
                  className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-2.5 text-stone-900 dark:text-white transition-colors hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={18} />
                </button>
                <span className="min-w-[3rem] text-center text-xl font-bold text-stone-900 dark:text-white">
                  {partySize}
                </span>
                <button
                  onClick={() =>
                    setPartySize((s) => Math.min(table.capacity, s + 1))
                  }
                  disabled={partySize >= table.capacity}
                  className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-2.5 text-stone-900 dark:text-white transition-colors hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                </button>
              </div>
              {partySize >= table.capacity && (
                <p className="mt-1.5 text-xs text-amber-600/80 dark:text-amber-400/80">
                  For larger groups, please contact the desk.
                </p>
              )}
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-stone-600 dark:text-white/70">
                Note <span className="text-stone-400 dark:text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='e.g. "birthday", "near the edge"'
                className="w-full rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-4 py-3 text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-white/30 focus:border-amber-400 dark:focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-300/40 dark:focus:ring-amber-500/30 transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-amber-400/25 dark:shadow-amber-500/20 transition-all hover:shadow-amber-400/40 dark:hover:shadow-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
            >
              Request This Table
            </button>
          </>
        )}

        {/* ── SUBMITTING ── */}
        {state === 'submitting' && (
          <div className="flex flex-col items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500" />
            <p className="mt-4 text-stone-500 dark:text-white/60">Reserving your table…</p>
          </div>
        )}

        {/* ── PENDING: "Table Requested!" — amber clock, countdown ── */}
        {state === 'confirmed' && (
          <div className="flex flex-col items-center py-6 text-center animate-fadeIn">
            <div className="mb-4 rounded-full bg-amber-50 dark:bg-amber-500/10 p-3">
              <Clock size={40} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-2">
              Table Requested!
            </h2>
            <p className="text-sm text-stone-500 dark:text-white/50 mb-4">
              Booking Ref: <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{bookingRef}</span>
            </p>
            <p className="text-sm text-stone-500 dark:text-white/60 leading-relaxed mb-6 max-w-sm">
              Please walk up to the reception desk to confirm your table within {EXPIRY_MINUTES} minutes, or it will be released automatically.
            </p>

            {/* Countdown */}
            <div className="rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-6 py-4 backdrop-blur-sm">
              <p className="text-xs text-stone-400 dark:text-white/40 uppercase tracking-wider mb-1">
                Time Remaining
              </p>
              <p className={`font-mono text-3xl font-bold ${
                countdown <= 60 ? 'text-red-600 dark:text-red-400' : countdown <= 180 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-white'
              }`}>
                {formatTime(countdown)}
              </p>
            </div>

            <p className="mt-4 text-xs text-stone-400 dark:text-white/30">
              This page will update automatically when confirmed
            </p>
          </div>
        )}

        {/* ── TRANSITIONING — brief blank pause before confirmed popup ── */}
        {state === 'transitioning' && (
          <div className="flex flex-col items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-500" />
          </div>
        )}

        {/* ── ADMIN CONFIRMED: distinct new popup — green check, no countdown ── */}
        {state === 'admin_confirmed' && (
          <div className="flex flex-col items-center py-6 text-center animate-fadeIn">
            {/* Ambient glow */}
            <div className="absolute inset-0 rounded-t-3xl sm:rounded-3xl bg-emerald-500/[0.03] pointer-events-none" />

            {/* Big green checkmark — visually nothing like the amber clock */}
            <div className="mb-5 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl scale-150" />
              <div className="relative rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 p-5">
                <CheckCircle2 size={52} className="text-emerald-400" strokeWidth={1.5} />
              </div>
            </div>

            <h2 className="font-serif text-3xl font-bold text-white mb-2">
              You&apos;re All Set!
            </h2>
            <p className="text-sm text-emerald-400 font-medium mb-1">Table Confirmed by Staff</p>
            <p className="text-xs text-white/40 mb-6">
              Ref: <span className="font-mono text-amber-400 font-bold">{bookingRef}</span>
            </p>

            {/* Confirmed details card — replaces the countdown timer */}
            <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-5 py-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Table</p>
                  <p className="font-bold text-white">{table.label}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Zone</p>
                  <p className="font-bold text-emerald-300">{table.zone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Guests</p>
                  <p className="font-bold text-white">{partySize}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Status</p>
                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Confirmed
                  </p>
                </div>
              </div>
            </div>

            {/* Direction hint */}
            <p className="text-sm text-white/50 flex items-center gap-1.5 mb-6">
              <MapPin size={14} className="text-emerald-400 shrink-0" />
              Please head to the <span className="text-emerald-300 font-medium">{table.zone}</span> host stand
            </p>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/35 active:scale-[0.98]"
            >
              Let&apos;s Go! 🎉
            </button>
          </div>
        )}

        {/* ── ADMIN CANCELLED ── */}
        {state === 'admin_cancelled' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-red-50 dark:bg-red-500/10 p-4">
              <XCircle size={48} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-2">
              Booking Released
            </h2>
            <p className="text-sm text-stone-500 dark:text-white/60 leading-relaxed mb-6 max-w-sm">
              Your table request has been released by the staff. The table is now available for others. Please try booking another table.
            </p>

            <button
              onClick={onClose}
              className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-6 py-2.5 text-sm font-medium text-stone-900 dark:text-white transition-colors hover:bg-stone-100 dark:hover:bg-white/10"
            >
              Pick Another Table
            </button>
          </div>
        )}

        {/* ── EXPIRED ── */}
        {state === 'expired' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-stone-100 dark:bg-white/5 p-4">
              <Clock size={48} className="text-stone-400 dark:text-white/40" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-2">
              Time Expired
            </h2>
            <p className="text-sm text-stone-500 dark:text-white/60 leading-relaxed mb-6 max-w-sm">
              Your reservation time has expired and the table has been released. Please try booking another table.
            </p>

            <button
              onClick={onClose}
              className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-6 py-2.5 text-sm font-medium text-stone-900 dark:text-white transition-colors hover:bg-stone-100 dark:hover:bg-white/10"
            >
              Pick Another Table
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {state === 'error' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-red-50 dark:bg-red-500/10 p-3">
              <AlertCircle size={40} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-white mb-2">
              Oops!
            </h2>
            <p className="text-sm text-stone-500 dark:text-white/60 mb-6">{errorMsg}</p>
            <button
              onClick={onClose}
              className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/5 px-6 py-2.5 text-sm font-medium text-stone-900 dark:text-white transition-colors hover:bg-stone-100 dark:hover:bg-white/10"
            >
              Pick Another Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
