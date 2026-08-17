'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const images = [
  { src: '/images/gallery-1.jpg', alt: 'Golden hour rooftop ambience' },
  { src: '/images/gallery-2.jpg', alt: 'Plated signature dish' },
  { src: '/images/gallery-3.jpg', alt: 'String lights at dusk' },
  { src: '/images/gallery-4.jpg', alt: 'Bartender crafting cocktails' },
  { src: '/images/gallery-5.jpg', alt: 'Blue hour skyline view' },
];

export default function AmbienceGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const revealRef = useScrollReveal();

  return (
    <section id="gallery" className="relative py-24 sm:py-32">
      <div ref={revealRef} className="reveal mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#D98E3F] mb-4">Gallery</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F4EFE8] tracking-tight">
            The SkyDeck experience
          </h2>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className={`group relative overflow-hidden rounded-2xl ${
                i === 0 ? 'md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-[4/3]'
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#12100E]/20 group-hover:bg-[#12100E]/10 transition-colors duration-300" />
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-medium text-white/70 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                  {img.alt}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#12100E]/95 backdrop-blur-xl p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white text-3xl transition-colors z-10"
          >
            ×
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}
            className="absolute left-4 sm:left-8 text-white/40 hover:text-white text-4xl transition-colors z-10"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}
            className="absolute right-4 sm:right-8 text-white/40 hover:text-white text-4xl transition-colors z-10"
          >
            ›
          </button>

          <div className="relative w-full max-w-5xl aspect-[16/10]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lightbox].src}
              alt={images[lightbox].alt}
              fill
              className="object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}
