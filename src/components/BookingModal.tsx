'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Minus, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Table } from '@/lib/types';
import { EXPIRY_MINUTES } from '@/lib/types';

interface BookingModalProps {
  table: Table;
  onClose: () => void;
  onBooked: () => void;
}

type ModalState = 'form' | 'submitting' | 'confirmed' | 'error';

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

  // Phone validation: exactly 10 digits (India format)
  const isPhoneValid = /^\d{10}$/.test(phone);
  const isFormValid = name.trim().length > 0 && isPhoneValid && partySize >= 1;

  // Countdown timer
  useEffect(() => {
    if (state !== 'confirmed' || !bookingCreatedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - bookingCreatedAt.getTime()) / 1000);
      const remaining = EXPIRY_MINUTES * 60 - elapsed;
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(interval);
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

        {state === 'submitting' && (
          <div className="flex flex-col items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500" />
            <p className="mt-4 text-stone-500 dark:text-white/60">Reserving your table…</p>
          </div>
        )}

        {state === 'confirmed' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 p-3">
              <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-2">
              Table Requested!
            </h2>
            <p className="text-sm text-stone-500 dark:text-white/50 mb-4">
              Booking Ref: <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{bookingRef}</span>
            </p>
            <p className="text-sm text-stone-500 dark:text-white/60 leading-relaxed mb-6 max-w-sm">
              Please walk up to the reception desk to confirm your table within 10 minutes, or it will be released automatically.
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
          </div>
        )}

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
