'use client';

import Link from 'next/link';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function MobileCTA() {
  const revealRef = useScrollReveal();

  return (
    <>
      {/* Spacer so content isn't hidden behind the bar */}
      <div className="h-20 sm:hidden" />

      {/* Sticky bottom bar - mobile only */}
      <div ref={revealRef} className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="border-t border-white/[0.06] bg-[#12100E]/95 backdrop-blur-xl px-4 py-3">
          <div className="flex gap-3">
            <a
              href="tel:+919876543210"
              className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] py-3.5 text-center text-sm font-semibold text-[#F4EFE8] transition-colors hover:bg-white/[0.08]"
            >
              Call
            </a>
            <Link
              href="/book"
              className="flex-1 btn-glow rounded-xl bg-[#D98E3F] py-3.5 text-center text-sm font-semibold text-[#12100E] hover:bg-[#E8A855] transition-colors"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
