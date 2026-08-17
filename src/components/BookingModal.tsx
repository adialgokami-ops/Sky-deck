'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Minus, Plus, AlertCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Table } from '@/lib/types';
import { EXPIRY_MINUTES } from '@/lib/types';

export interface ActiveBookingSession {
  bookingId: string;
  bookingRef: string;
  table: Table;
  partySize: number;
  guestName: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
}

interface BookingModalProps {
  table: Table;
  onClose: () => void;
  onBookingCreated: (session: ActiveBookingSession) => void;
  activeSession?: ActiveBookingSession | null;
}

type ModalState = 'form' | 'submitting' | 'confirmed' | 'admin_cancelled' | 'expired' | 'error';

export default function BookingModal({
  table,
  onClose,
  onBookingCreated,
  activeSession,
}: BookingModalProps) {
  const [state, setState] = useState<ModalState>(
    activeSession && activeSession.table.id === table.id && activeSession.status === 'pending'
      ? 'confirmed'
      : 'form'
  );
  const [name, setName] = useState(activeSession?.guestName || '');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(activeSession?.partySize || 1);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingRef, setBookingRef] = useState(activeSession?.bookingRef || '');
  const [countdown, setCountdown] = useState(EXPIRY_MINUTES * 60);
  const [bookingCreatedAt, setBookingCreatedAt] = useState<Date | null>(
    activeSession?.createdAt ? new Date(activeSession.createdAt) : null
  );

  // Phone validation: exactly 10 digits (India format)
  const isPhoneValid = /^\d{10}$/.test(phone);
  const isFormValid = name.trim().length > 0 && isPhoneValid && partySize >= 1;

  // Request browser notification permission when modal opens
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update state if activeSession status changes externally
  useEffect(() => {
    if (activeSession && activeSession.table.id === table.id) {
      if (activeSession.status === 'cancelled') setState('admin_cancelled');
      if (activeSession.status === 'expired') setState('expired');
    }
  }, [activeSession, table.id]);

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

      const ref = booking.id.slice(-6).toUpperCase();
      const createdAtDate = new Date(booking.created_at);

      setBookingRef(ref);
      setBookingCreatedAt(createdAtDate);
      setState('confirmed');

      // Notify parent page about the active session so page-level tracking takes over
      onBookingCreated({
        bookingId: booking.id,
        bookingRef: ref,
        table,
        partySize,
        guestName: name.trim(),
        createdAt: booking.created_at,
        status: 'pending',
      });
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
    }
  }, [isFormValid, table, name, phone, partySize, note, onBookingCreated]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Frosted Glass Modal Panel */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/[0.2] bg-[#161311]/90 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-[#F4EFE8] animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        {/* ── FORM STATE ── */}
        {state === 'form' && (
          <>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-sm mb-1">
              Book Table {table.label}
            </h2>
            <p className="text-sm font-medium text-white/60 mb-6">
              {table.zone} · {table.capacity} seats max
            </p>

            {/* Name */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-white/80">
                Your Name <span className="text-[#D98E3F]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aditi Rao"
                className="w-full rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-colors"
              />
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-white/80">
                Mobile Number <span className="text-[#D98E3F]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-white/[0.16] bg-white/[0.08] px-3.5 py-3 text-sm font-semibold text-white/70 backdrop-blur-xl shadow-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className="flex-1 rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-colors"
                />
              </div>
              {phone.length > 0 && !isPhoneValid && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">
                  Please enter a valid 10-digit phone number
                </p>
              )}
            </div>

            {/* Party Size Stepper */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-white/80">
                Party Size
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPartySize((s) => Math.max(1, s - 1))}
                  disabled={partySize <= 1}
                  className="rounded-xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.16] p-2.5 text-white shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={18} />
                </button>
                <span className="min-w-[3rem] text-center text-xl font-bold font-display text-white drop-shadow-sm">
                  {partySize}
                </span>
                <button
                  onClick={() =>
                    setPartySize((s) => Math.min(table.capacity, s + 1))
                  }
                  disabled={partySize >= table.capacity}
                  className="rounded-xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.16] p-2.5 text-white shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={18} />
                </button>
              </div>
              {partySize >= table.capacity && (
                <p className="mt-1.5 text-xs text-amber-300 font-medium">
                  Maximum table capacity ({table.capacity} seats).
                </p>
              )}
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-bold text-white/80">
                Special Note <span className="text-white/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='e.g. "birthday celebration", "near edge view"'
                className="w-full rounded-xl border border-white/[0.16] bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400/70 focus:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-amber-500/20 backdrop-blur-xl shadow-inner transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="w-full rounded-xl bg-gradient-to-r from-[#D98E3F] to-[#E8A855] px-6 py-3.5 font-bold text-[#12100E] shadow-lg shadow-amber-500/30 transition-all hover:from-[#E8A855] hover:to-[#F3B765] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
            >
              Request This Table
            </button>
          </>
        )}

        {/* ── SUBMITTING ── */}
        {state === 'submitting' && (
          <div className="flex flex-col items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D98E3F]/30 border-t-[#D98E3F]" />
            <p className="mt-4 text-sm font-semibold text-white/70">Reserving your table…</p>
          </div>
        )}

        {/* ── PENDING: "Table Requested!" — amber clock, countdown ── */}
        {state === 'confirmed' && (
          <div className="flex flex-col items-center py-6 text-center animate-fadeIn">
            <div className="mb-4 rounded-full bg-amber-500/20 border border-amber-400/40 p-3.5 shadow-lg shadow-amber-500/30 backdrop-blur-xl">
              <Clock size={40} className="text-[#D98E3F]" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white drop-shadow-sm mb-1.5">
              Table Requested!
            </h2>
            <p className="text-sm text-white/70 font-medium mb-3">
              Booking Ref: <span className="font-mono text-[#D98E3F] font-bold">#{bookingRef}</span>
            </p>
            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-sm">
              Please walk up to the reception desk to confirm your table within <strong className="text-white">{EXPIRY_MINUTES} minutes</strong>, or it will be released automatically.
            </p>

            {/* Countdown Card */}
            <div className="w-full rounded-2xl border border-white/[0.15] bg-white/[0.06] backdrop-blur-xl px-6 py-4 shadow-xl">
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">
                Time Remaining
              </p>
              <p className={`font-mono text-3xl font-bold ${
                countdown <= 60 ? 'text-red-400' : countdown <= 180 ? 'text-[#D98E3F]' : 'text-white'
              }`}>
                {formatTime(countdown)}
              </p>
            </div>

            <p className="mt-4 text-xs text-white/40 font-medium">
              You can close this window — we will notify you immediately once confirmed.
            </p>
          </div>
        )}

        {/* ── ADMIN CANCELLED ── */}
        {state === 'admin_cancelled' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-red-500/20 border border-red-500/40 p-4">
              <XCircle size={48} className="text-red-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Booking Released
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-sm">
              Your table request has been released by staff. The table is now available for others. Please try booking another table.
            </p>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.15] px-6 py-2.5 text-sm font-bold text-white shadow-md backdrop-blur-xl"
            >
              Pick Another Table
            </button>
          </div>
        )}

        {/* ── EXPIRED ── */}
        {state === 'expired' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-white/[0.08] border border-white/[0.15] p-4">
              <Clock size={48} className="text-white/60" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Time Expired
            </h2>
            <p className="text-sm text-white/60 leading-relaxed mb-6 max-w-sm">
              Your reservation time has expired and the table has been released. Please feel free to pick another table.
            </p>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.15] px-6 py-2.5 text-sm font-bold text-white shadow-md backdrop-blur-xl"
            >
              Pick Another Table
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {state === 'error' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-red-500/20 border border-red-500/40 p-3.5">
              <AlertCircle size={40} className="text-red-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Oops!
            </h2>
            <p className="text-sm text-white/70 mb-6">{errorMsg}</p>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.15] px-6 py-2.5 text-sm font-bold text-white shadow-md backdrop-blur-xl"
            >
              Pick Another Table
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
