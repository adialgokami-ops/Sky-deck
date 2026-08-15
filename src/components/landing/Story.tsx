'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

export default function Story() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="story"
      ref={ref}
      className={`mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
        {/* Text */}
        <div>
          <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white sm:text-4xl">
            A table with a view
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-stone-500 dark:text-white/50">
            <p>
              SkyDeck sits five stories above the Pimpri-Chinchwad skyline, where
              the evening breeze carries the warmth of open-flame grills and the
              last light of the day paints the horizon amber and rose.
            </p>
            <p>
              Our seasonal menu draws from local harvests and modern technique —
              dishes built around what&apos;s ripe, honest, and worth sharing over
              a long table.
            </p>
            <p>
              Whether you&apos;re here for a quiet dinner under the stars or a
              celebration that deserves a skyline backdrop, the evening is yours
              to shape.
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
          {/* TODO: Replace with a real atmospheric photo of SkyDeck's rooftop */}
          <Image
            src="/images/story.jpg"
            alt="SkyDeck rooftop dining area at golden hour with warm ambient lighting"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6]/40 dark:from-[#0F0F12]/60 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}
