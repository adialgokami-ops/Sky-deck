'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type Category = 'Starters' | 'Mains' | 'Desserts' | 'Bar';

interface Dish {
  name: string;
  description: string;
  price: number;
  image: string | null;
  veg: boolean;
  spice: number; // 0-3
}

const MENU: Record<Category, Dish[]> = {
  Starters: [
    { name: 'Paneer Tikka Skewers', description: 'Tandoor-charred cottage cheese, mint chutney, pickled onion', price: 395, image: '/images/hero-bg.jpg', veg: true, spice: 1 },
    { name: 'Truffle Mushroom Galouti', description: 'Wild mushroom patties, saffron reduction, micro greens', price: 445, image: null, veg: true, spice: 0 },
    { name: 'Chicken Seekh Kebab', description: 'Minced chicken skewers, smoked paprika, tzatziki', price: 425, image: null, veg: false, spice: 2 },
  ],
  Mains: [
    { name: 'Butter Chicken', description: 'Tandoori chicken in tomato-cashew makhani, garlic naan', price: 545, image: '/images/dish-butter-chicken.jpg', veg: false, spice: 1 },
    { name: 'Dum Biryani', description: 'Slow-cooked basmati, saffron, whole spices, raita', price: 495, image: '/images/dish-biryani.jpg', veg: false, spice: 2 },
    { name: 'Grilled Lamb Chops', description: 'Herb-crusted, pomegranate molasses, burnt garlic jus', price: 895, image: null, veg: false, spice: 1 },
  ],
  Desserts: [
    { name: 'Chocolate Lava Cake', description: 'Molten center, gold leaf, vanilla bean ice cream', price: 375, image: null, veg: true, spice: 0 },
    { name: 'Gulab Jamun Brûlée', description: 'Rose-cardamom custard, caramelised crust, pistachio dust', price: 325, image: null, veg: true, spice: 0 },
    { name: 'Mango Kulfi Tart', description: 'Alphonso mousse, almond crust, saffron crumble', price: 345, image: null, veg: true, spice: 0 },
  ],
  Bar: [
    { name: 'SkyDeck Old Fashioned', description: 'Bourbon, demerara, orange bitters, flamed peel', price: 595, image: '/images/dish-cocktail.jpg', veg: true, spice: 0 },
    { name: 'Sunset Spritz', description: 'Aperol, prosecco, blood orange, rosemary', price: 545, image: null, veg: true, spice: 0 },
    { name: 'Kokum Margarita', description: 'Tequila, kokum syrup, lime, chili salt rim', price: 575, image: null, veg: true, spice: 1 },
  ],
};

const categories: Category[] = ['Starters', 'Mains', 'Desserts', 'Bar'];

function SpiceLevel({ level }: { level: number }) {
  if (level === 0) return null;
  return (
    <span className="flex gap-0.5" title={`Spice level ${level}/3`}>
      {Array.from({ length: level }).map((_, i) => (
        <span key={i} className="text-xs">🌶️</span>
      ))}
    </span>
  );
}

export default function MenuHighlights() {
  const [active, setActive] = useState<Category>('Starters');
  const revealRef = useScrollReveal();

  return (
    <section id="menu" className="relative py-24 sm:py-32">
      <div ref={revealRef} className="reveal mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#D98E3F] mb-4">The Menu</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F4EFE8] tracking-tight">
            Signature plates
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-full border border-white/[0.06] bg-[#1A1815] p-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`rounded-full px-5 sm:px-7 py-2.5 text-sm font-medium transition-all duration-300 ${
                  active === cat
                    ? 'bg-[#D98E3F] text-[#12100E] shadow-lg shadow-[#D98E3F]/20'
                    : 'text-[#A69E93] hover:text-[#F4EFE8]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MENU[active].map((dish) => (
            <div
              key={dish.name}
              className="group rounded-2xl border border-white/[0.06] bg-[#1A1815]/60 overflow-hidden hover:border-[#D98E3F]/20 transition-all duration-300"
            >
              {/* Image or placeholder */}
              <div className="relative aspect-[16/10] overflow-hidden">
                {dish.image ? (
                  <Image
                    src={dish.image}
                    alt={dish.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="img-placeholder h-full w-full flex items-center justify-center">
                    <span className="font-display text-lg text-[#6B6560]/60 italic">{dish.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1815] to-transparent opacity-60" />
              </div>

              {/* Content */}
              <div className="p-5 -mt-4 relative">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Veg/Non-veg indicator */}
                    <span className={`h-3.5 w-3.5 rounded-sm border-2 flex items-center justify-center ${
                      dish.veg ? 'border-[#7A9B6B]' : 'border-red-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        dish.veg ? 'bg-[#7A9B6B]' : 'bg-red-500'
                      }`} />
                    </span>
                    <h3 className="font-display text-lg font-semibold text-[#F4EFE8]">{dish.name}</h3>
                  </div>
                  <SpiceLevel level={dish.spice} />
                </div>
                <p className="text-sm text-[#A69E93] leading-relaxed mb-3">{dish.description}</p>
                <p className="font-display text-xl font-bold text-[#D98E3F]">₹{dish.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Full menu CTA */}
        <div className="text-center mt-12">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-8 py-3.5 text-sm font-semibold text-[#F4EFE8] hover:bg-white/[0.04] hover:border-white/[0.2] transition-all"
          >
            View Full Menu
            <span className="text-[#D98E3F]">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
