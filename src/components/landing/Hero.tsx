'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function Hero() {
  const revealRef = useScrollReveal();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/zone-rooftop.jpg"
          alt="SkyDeck rooftop dining at golden hour"
          fill
          className="object-cover"
          priority
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#12100E]/70 via-[#12100E]/40 to-[#12100E]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12100E]/50 to-transparent" />
      </div>

      {/* Content */}
      <div ref={revealRef} className="reveal relative z-10 mx-auto max-w-4xl px-5 sm:px-8 text-center pt-20 pb-24">
        {/* Hours badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#D98E3F]/20 bg-[#D98E3F]/10 px-4 py-2 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-[#7A9B6B] animate-pulse" />
          <span className="text-sm font-medium text-[#E8A855]">Open tonight until 11 PM</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-[#F4EFE8] tracking-tight leading-[0.95] mb-6">
          Dinner,<br />
          <span className="italic font-light text-[#D98E3F]">above the city.</span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto max-w-lg text-lg sm:text-xl text-[#A69E93] leading-relaxed mb-8 font-light">
          Live seating across three curated zones — Rooftop, Indoor AC &amp; Outdoor — with tables updating in real time.
        </p>

        {/* Live counter */}
        <div className="mb-10 inline-flex items-center gap-2 rounded-full bg-[#1A1815]/80 border border-white/[0.06] px-5 py-2.5 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-[#7A9B6B] animate-pulse" />
          <span className="text-sm text-[#A69E93]">
            <span className="font-semibold text-[#F4EFE8]">12</span> tables open right now
          </span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/book"
            className="btn-glow w-full sm:w-auto rounded-full bg-[#D98E3F] px-10 py-4 text-base font-semibold text-[#12100E] hover:bg-[#E8A855] transition-all shadow-lg shadow-[#D98E3F]/20 hover:shadow-[#D98E3F]/40 active:scale-[0.97]"
          >
            Book a Table
          </Link>
          <a
            href="#menu"
            className="w-full sm:w-auto rounded-full border border-[#F4EFE8]/15 px-10 py-4 text-base font-medium text-[#F4EFE8] hover:bg-[#F4EFE8]/[0.05] hover:border-[#F4EFE8]/25 transition-all"
          >
            View the Menu
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs tracking-[0.2em] uppercase text-[#A69E93]">Scroll</span>
        <div className="h-8 w-[1px] bg-gradient-to-b from-[#A69E93] to-transparent" />
      </div>
    </section>
  );
}
