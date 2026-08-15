'use client';

import { useRef, useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

const DISHES = [
  {
    name: 'Charred Paneer Tikka',
    description: 'Tandoor-smoked cottage cheese, mint chutney, pickled onion.',
    price: '₹395',
  },
  {
    name: 'Skyline Prawns',
    description: 'Jumbo prawns, rooftop herb butter, garlic crumble.',
    price: '₹695',
  },
  {
    name: 'Truffle Mushroom Risotto',
    description: 'Arborio rice, wild mushrooms, truffle oil, parmesan shavings.',
    price: '₹545',
  },
  {
    name: 'Lamb Rogan Josh',
    description: 'Slow-braised lamb, Kashmiri chilli, aromatic saffron rice.',
    price: '₹745',
  },
  {
    name: 'Mango Basil Sorbet',
    description: 'Alphonso mango, Thai basil, lime zest — palate cleanser.',
    price: '₹245',
  },
  {
    name: 'SkyDeck Old Fashioned',
    description: 'Bourbon, demerara, smoked orange peel, Angostura.',
    price: '₹495',
  },
];

export default function MenuHighlights() {
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
      id="menu"
      ref={ref}
      className="border-y border-stone-200 dark:border-white/5 bg-stone-50/80 dark:bg-white/[0.01]"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div
          className={`text-center transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-200 dark:border-gold-400/20 bg-gold-50 dark:bg-gold-400/5 px-4 py-1.5">
            <Flame size={14} className="text-gold-600 dark:text-gold-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-gold-600 dark:text-gold-400">
              Signature Picks
            </span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white sm:text-4xl">
            From our kitchen
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-stone-400 dark:text-white/40">
            A glimpse of what&apos;s sizzling — seasonal highlights curated by our head chef.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DISHES.map((dish, i) => (
            <div
              key={dish.name}
              className={`rounded-2xl border border-stone-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none p-6 transition-all duration-700 hover:border-stone-300 dark:hover:border-white/10 hover:bg-stone-100/50 dark:hover:bg-white/[0.04] ${
                visible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: visible ? `${i * 80}ms` : '0ms' }}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                  {dish.name}
                </h3>
                <span className="whitespace-nowrap text-sm font-semibold text-gold-600 dark:text-gold-400">
                  {dish.price}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-400 dark:text-white/40">
                {dish.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
