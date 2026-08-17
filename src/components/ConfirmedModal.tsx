'use client';

import { CheckCircle2, MapPin, X } from 'lucide-react';
import type { ActiveBookingSession } from '@/components/BookingModal';
import { ZONE_DETAILS } from '@/lib/types';

interface ConfirmedModalProps {
  session: ActiveBookingSession;
  onClose: () => void;
}

export default function ConfirmedModal({ session, onClose }: ConfirmedModalProps) {
  const zone = ZONE_DETAILS.find((z) => z.name === session.table.zone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Frosted Glass Modal Panel */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.22] bg-[#161311]/92 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.85)] text-center text-[#F4EFE8] animate-slide-up transform-gpu">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-2 text-xl transition-colors"
          aria-label="Close confirmation popup"
        >
          <X size={20} />
        </button>

        {/* Luminous Celebration Glow */}
        <div className="mb-5 relative mx-auto w-fit">
          <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-xl scale-125 pointer-events-none" />
          <div className="relative rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 p-4 shadow-lg shadow-emerald-500/30 backdrop-blur-xl">
            <CheckCircle2 size={52} className="text-emerald-400" strokeWidth={2} />
          </div>
        </div>

        <h2 className="font-display text-3xl font-bold text-white mb-1.5 drop-shadow-md">
          You&apos;re All Set! 🎉
        </h2>
        <p className="text-sm text-emerald-300 font-bold mb-1">Table Confirmed by Staff</p>
        <p className="text-xs text-white/50 font-medium mb-6">
          Ref: <span className="font-mono text-[#D98E3F] font-bold">#{session.bookingRef}</span>
        </p>

        {/* Confirmed Details Card in Frosted Glass */}
        <div className="w-full rounded-2xl border border-white/[0.16] bg-white/[0.07] backdrop-blur-xl px-5 py-4 mb-6 text-left shadow-lg">
          <div className="grid grid-cols-2 gap-3.5 text-sm">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/45 mb-0.5">Table</p>
              <p className="font-bold text-white text-base">{session.table.label}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/45 mb-0.5">Zone</p>
              <p className="font-bold text-base" style={{ color: zone?.accent || '#FBBF24' }}>
                {session.table.zone}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/45 mb-0.5">Guests</p>
              <p className="font-bold text-white">{session.partySize} guests</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/45 mb-0.5">Status</p>
              <p className="font-bold text-emerald-300 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Confirmed
              </p>
            </div>
          </div>
        </div>

        {/* Direction hint */}
        <p className="text-sm text-white/70 flex items-center justify-center gap-1.5 mb-6">
          <MapPin size={15} className="text-emerald-400 shrink-0" />
          Please head to the <strong className="text-white">{session.table.zone}</strong> host stand
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-[0.98]"
        >
          Let&apos;s Go! 🎉
        </button>
      </div>
    </div>
  );
}
