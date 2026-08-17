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
];

export default function ZonesShowcase() {
  const revealRef = useScrollReveal();

  return (
    <section id="zones" className="relative py-24 sm:py-32">
      {/* Dusk blue contrast section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#12100E] via-[#161D24] to-[#12100E]" />

      <div ref={revealRef} className="reveal relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#D98E3F] mb-4">Three Zones</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F4EFE8] tracking-tight">
            Choose your atmosphere
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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
                  className="absolute top-4 left-4 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md border"
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
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-2xl font-bold text-[#F4EFE8]">{zone.name}</h3>
                  <span className="text-sm text-[#A69E93]">{zone.seats} seats</span>
                </div>
                <p className="text-sm text-[#A69E93] leading-relaxed mb-5">
                  {zone.description}
                </p>
                <Link
                  href="/book"
                  className="block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all border"
                  style={{
                    color: zone.accent,
                    borderColor: `${zone.accent}30`,
                    backgroundColor: `${zone.accent}10`,
                  }}
                >
                  Reserve this zone →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
