'use client';

import Image from 'next/image';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function Story() {
  const revealRef = useScrollReveal();

  return (
    <section id="story" className="relative py-24 sm:py-32 overflow-hidden">
      <div ref={revealRef} className="reveal mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text side */}
          <div>
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#D98E3F] mb-4">Our Story</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F4EFE8] tracking-tight leading-[1.1] mb-6">
              Where the skyline<br />meets the plate.
            </h2>
            <p className="text-[#A69E93] text-lg leading-relaxed mb-8 max-w-lg">
              Perched above Pimpri-Chinchwad, SkyDeck transforms golden-hour light into an unforgettable dining backdrop. Our seasonal menu blends modern Indian technique with locally sourced ingredients — designed to be tasted under open skies and string lights.
            </p>

            {/* Chef card */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#1A1815] p-4">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
                <Image
                  src="/images/chef.jpg"
                  alt="Chef Arjun Mehta"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-[#F4EFE8]">Chef Arjun Mehta</p>
                <p className="text-sm text-[#A69E93] leading-relaxed">
                  Formerly at Masque, Mumbai. Brings bold, boundary-pushing flavours to every plate at SkyDeck.
                </p>
              </div>
            </div>
          </div>

          {/* Image side */}
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
              <Image
                src="/images/story.jpg"
                alt="SkyDeck restaurant ambience"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12100E]/40 to-transparent" />
            </div>
            {/* Accent border */}
            <div className="absolute -inset-3 rounded-[28px] border border-[#D98E3F]/10 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
