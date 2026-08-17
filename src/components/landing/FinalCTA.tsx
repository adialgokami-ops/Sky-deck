'use client';

import Link from 'next/link';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function FinalCTA() {
  const revealRef = useScrollReveal();

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2B1A0E] via-[#1A1410] to-[#12100E]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] bg-[#D98E3F]/[0.06] blur-[120px] rounded-full" />

      <div ref={revealRef} className="reveal relative mx-auto max-w-3xl px-5 sm:px-8 text-center">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F4EFE8] tracking-tight leading-[1.1] mb-6">
          Your table is<br />
          <span className="italic text-[#D98E3F]">waiting.</span>
        </h2>

        <p className="text-lg text-[#A69E93] mb-4 font-light">
          Don&apos;t miss tonight&apos;s golden hour from the best seat in Pune.
        </p>

        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D98E3F]/20 bg-[#D98E3F]/10 px-5 py-2 mb-10 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-[#D98E3F] animate-pulse" />
          <span className="text-sm font-medium text-[#E8A855]">3 rooftop tables left tonight</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/book"
            className="btn-glow w-full sm:w-auto rounded-full bg-[#D98E3F] px-12 py-4 text-base font-semibold text-[#12100E] hover:bg-[#E8A855] transition-all shadow-lg shadow-[#D98E3F]/25 hover:shadow-[#D98E3F]/40 active:scale-[0.97]"
          >
            Book a Table
          </Link>
          <a
            href="tel:+919876543210"
            className="w-full sm:w-auto rounded-full border border-[#F4EFE8]/10 px-12 py-4 text-base font-medium text-[#F4EFE8] hover:bg-[#F4EFE8]/[0.04] transition-all"
          >
            Or Call Us
          </a>
        </div>
      </div>
    </section>
  );
}
