'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const zones = [
  {
    name: 'Rooftop',
    image: '/images/zone-rooftop.jpg',
    seats: '2–8',
    bestFor: 'Date night, skyline views',
    accent: '#D98E3F',
    accentBg: 'rgba(217,142,63,0.08)',
    accentBorder: 'rgba(217,142,63,0.15)',
    description: 'Open-air tables beneath string lights with panoramic views of the Pune skyline.',
  },
  {
    name: 'Indoor AC',
    image: '/images/zone-indoor.jpg',
    seats: '2–12',
    bestFor: 'Family gatherings, celebrations',
    accent: '#5B7A9D',
    accentBg: 'rgba(91,122,157,0.08)',
    accentBorder: 'rgba(91,122,157,0.15)',
    description: 'Climate-controlled elegance with warm wood and copper accents throughout.',
  },
  {
    name: 'Outdoor',
    image: '/images/zone-outdoor.jpg',
    seats: '2–6',
    bestFor: 'Casual evenings, group drinks',
    accent: '#7A9B6B',
    accentBg: 'rgba(122,155,107,0.08)',
    accentBorder: 'rgba(122,155,107,0.15)',
    description: 'Garden-side seating surrounded by greenery — perfect for relaxed evenings.',
  },
  {
    name: 'Family Bar',
    image: '/images/zone-familybar.jpg',
    seats: '2–10',
    bestFor: 'Families, casual groups, live buzz',
    accent: '#C8694A',
    accentBg: 'rgba(200,105,74,0.08)',
    accentBorder: 'rgba(200,105,74,0.15)',
    description: 'Bar-height and lounge seating with a kid-friendly menu — lively, relaxed, and family-first.',
  },
];

export default function ZonesShowcase() {
  const revealRef = useScrollReveal();

  return (
    <section id="zones" className="relative py-24 sm:py-32">
      {/* Dusk blue contrast section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#12100E] via-[#161D24] to-[#12100E]" />

      <div ref={revealRef} className="reveal relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#D98E3F] mb-4">Four Zones</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F4EFE8] tracking-tight">
            Choose your atmosphere
          </h2>
        </div>

        {/* 2×2 on mobile, 4-across on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {zones.map((zone) => (
            <div
              key={zone.name}
              className="group rounded-3xl overflow-hidden border transition-all duration-500 hover:scale-[1.02]"
              style={{
                borderColor: zone.accentBorder,
                backgroundColor: zone.accentBg,
              }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={zone.image}
                  alt={`${zone.name} zone`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12100E]/80 to-transparent" />
                {/* Best for tag */}
                <div
                  className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium backdrop-blur-md border"
                  style={{
                    color: zone.accent,
                    backgroundColor: `${zone.accent}15`,
                    borderColor: `${zone.accent}30`,
                  }}
                >
                  {zone.bestFor}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-2 gap-1">
                  <h3 className="font-display text-base sm:text-xl font-bold text-[#F4EFE8] leading-tight">{zone.name}</h3>
                  <span className="text-[10px] sm:text-xs text-[#A69E93] shrink-0 mt-0.5">{zone.seats}</span>
                </div>
                <p className="text-xs text-[#A69E93] leading-relaxed mb-4 hidden sm:block">
                  {zone.description}
                </p>
                <Link
                  href="/book"
                  className="block w-full rounded-xl py-2 sm:py-2.5 text-center text-xs sm:text-sm font-semibold transition-all border"
                  style={{
                    color: zone.accent,
                    borderColor: `${zone.accent}30`,
                    backgroundColor: `${zone.accent}10`,
                  }}
                >
                  Reserve →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
