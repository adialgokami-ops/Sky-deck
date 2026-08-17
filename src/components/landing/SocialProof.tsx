'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const reviews = [
  {
    name: 'Priya S.',
    text: 'The rooftop view at sunset is absolutely stunning. The butter chicken is the best I\'ve had in Pune — rich, smoky, perfect.',
    rating: 5,
  },
  {
    name: 'Rahul K.',
    text: 'Brought my family for a celebration. The Indoor AC zone was perfect — private, elegant, and the staff went above and beyond.',
    rating: 5,
  },
  {
    name: 'Ananya M.',
    text: 'Date night favourite. The cocktails are inventive, the biryani is heavenly, and the ambience is unmatched in PCMC.',
    rating: 5,
  },
  {
    name: 'Vikram J.',
    text: 'The online booking was seamless. Showed up, table was ready. Food was excellent. Will be back every weekend.',
    rating: 4,
  },
];

const pressLogos = ['Pune Mirror', 'LBB Pune', 'Zomato Gold', 'Times Food'];

export default function SocialProof() {
  const revealRef = useScrollReveal();

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#12100E] via-[#161D24] to-[#12100E]" />

      <div ref={revealRef} className="reveal relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Aggregate rating */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-6 w-6 text-[#D98E3F]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-3xl font-display font-bold text-[#F4EFE8] mb-1">4.8 / 5</p>
          <p className="text-sm text-[#A69E93]">Based on 1,200+ reviews</p>
        </div>

        {/* Review cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl border border-white/[0.06] bg-[#1A1815]/60 p-6 backdrop-blur-sm"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-[#D98E3F]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-[#A69E93] leading-relaxed mb-4 italic">
                &ldquo;{review.text}&rdquo;
              </p>
              <p className="text-sm font-semibold text-[#F4EFE8]">{review.name}</p>
            </div>
          ))}
        </div>

        {/* Press logos */}
        <div className="flex flex-wrap items-center justify-center gap-8">
          <span className="text-xs tracking-[0.15em] uppercase text-[#6B6560]">Featured in</span>
          {pressLogos.map((logo) => (
            <span key={logo} className="text-sm font-medium text-[#6B6560] tracking-wide">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
