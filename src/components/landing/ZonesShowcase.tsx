'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const ZONES = [
  {
    name: 'Rooftop',
    image: '/images/zone-rooftop.jpg',
    alt: 'Rooftop dining area with panoramic skyline views and string lights',
    description: 'Open sky, city lights, and a breeze — the signature SkyDeck experience.',
    capacity: '2–6 seats',
  },
  {
    name: 'Indoor AC',
    image: '/images/zone-indoor.jpg',
    alt: 'Elegant indoor air-conditioned dining space with warm lighting',
    description: 'Climate-controlled comfort with floor-to-ceiling views of the skyline.',
    capacity: '2–8 seats',
  },
  {
    name: 'Outdoor',
    image: '/images/zone-outdoor.jpg',
    alt: 'Outdoor terrace dining area with garden seating and ambient lanterns',
    description: 'Garden-level seating under canopy greens, sheltered yet open.',
    capacity: '2–6 seats',
  },
];

export default function ZonesShowcase() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="zones"
      ref={ref}
      className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
    >
      <div
        className={`text-center transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white sm:text-4xl">
          Three zones, one rooftop
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-stone-400 dark:text-white/40">
          Choose the setting that fits your evening — every table comes with live
          availability and instant booking.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ZONES.map((zone, i) => (
          <div
            key={zone.name}
            className={`group relative overflow-hidden rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none transition-all duration-700 hover:border-gold-300 dark:hover:border-gold-400/20 ${
              visible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: visible ? `${i * 120}ms` : '0ms' }}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              {/* TODO: Replace with real zone photos */}
              <Image
                src={zone.image}
                alt={zone.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0F0F12] via-white/20 dark:via-[#0F0F12]/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative p-6">
              <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white">
                {zone.name}
              </h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gold-600 dark:text-gold-400/70">
                {zone.capacity}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-stone-500 dark:text-white/45">
                {zone.description}
              </p>
              <Link
                href="/book"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 dark:text-gold-400 transition-colors hover:text-gold-700 dark:hover:text-gold-300"
              >
                Reserve this zone
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
