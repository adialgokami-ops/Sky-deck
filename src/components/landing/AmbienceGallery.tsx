'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

const GALLERY = [
  { src: '/images/gallery-1.jpg', alt: 'Rooftop dining table set for two at sunset with cityscape backdrop', span: 'col-span-2 row-span-2' },
  { src: '/images/gallery-2.jpg', alt: 'Close-up of plated dish with edible flowers and micro-greens', span: '' },
  { src: '/images/gallery-3.jpg', alt: 'String lights and lanterns illuminating outdoor seating at night', span: '' },
  { src: '/images/gallery-4.jpg', alt: 'Bartender crafting a cocktail with flame garnish behind the bar', span: '' },
  { src: '/images/gallery-5.jpg', alt: 'Panoramic view of Pimpri-Chinchwad skyline from the rooftop at blue hour', span: 'col-span-2' },
];

export default function AmbienceGallery() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
    >
      <div
        className={`text-center transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white sm:text-4xl">
          The atmosphere
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-stone-400 dark:text-white/40">
          Golden hour to midnight — every moment on the deck has its own light.
        </p>
      </div>

      <div
        className={`mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: visible ? '200ms' : '0ms' }}
      >
        {GALLERY.map((img, i) => (
          <div
            key={img.src}
            className={`group relative overflow-hidden rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none ${
              img.span
            } ${i === 0 ? 'aspect-square' : 'aspect-[4/3]'}`}
          >
            {/* TODO: Replace with real SkyDeck photos */}
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, 33vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
          </div>
        ))}
      </div>
    </section>
  );
}
