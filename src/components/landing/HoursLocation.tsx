'use client';

import { useRef, useEffect, useState } from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';

export default function HoursLocation() {
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
      id="hours"
      ref={ref}
      className={`mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white sm:text-4xl">
          Find us
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-stone-400 dark:text-white/40">
          Five floors up, every evening.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-3">
        {/* Address */}
        <div className="rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 dark:bg-gold-400/10">
            <MapPin size={22} className="text-gold-600 dark:text-gold-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">Address</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-400 dark:text-white/40">
            SkyDeck, 5th Floor<br />
            Pimpri-Chinchwad, Pune<br />
            Maharashtra 411018
          </p>
        </div>

        {/* Hours */}
        <div className="rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 dark:bg-gold-400/10">
            <Clock size={22} className="text-gold-600 dark:text-gold-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">Hours</h3>
          <div className="mt-2 space-y-1 text-sm text-stone-400 dark:text-white/40">
            <p>Mon – Thu: 5 PM – 11 PM</p>
            <p>Fri – Sat: 5 PM – 1 AM</p>
            <p>Sunday: 12 PM – 11 PM</p>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 dark:bg-gold-400/10">
            <Phone size={22} className="text-gold-600 dark:text-gold-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">Contact</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-400 dark:text-white/40">
            +91 20 1234 5678<br />
            reservations@skydeck.in
          </p>
        </div>
      </div>
    </section>
  );
}
