'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-[#12100E]/90 backdrop-blur-lg border-b border-white/[0.06]' : 'bg-transparent'
    }`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-0.5">
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F4EFE8]">
              Sky
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#D98E3F]">
              Deck
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Story', 'Zones', 'Menu', 'Gallery', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-[#A69E93] hover:text-[#F4EFE8] transition-colors duration-200 tracking-wide"
              >
                {item}
              </a>
            ))}
            <Link
              href="/book"
              className="btn-glow rounded-full bg-[#D98E3F] px-6 py-2.5 text-sm font-semibold text-[#12100E] hover:bg-[#E8A855] transition-colors"
            >
              Book a Table
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <span className={`block h-[2px] w-6 bg-[#F4EFE8] transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
            <span className={`block h-[2px] w-6 bg-[#F4EFE8] transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-[2px] w-6 bg-[#F4EFE8] transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#12100E]/95 backdrop-blur-xl border-t border-white/[0.06] animate-fadeIn">
          <div className="px-6 py-6 flex flex-col gap-4">
            {['Story', 'Zones', 'Menu', 'Gallery', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="text-lg font-medium text-[#A69E93] hover:text-[#F4EFE8] transition-colors py-1"
              >
                {item}
              </a>
            ))}
            <Link
              href="/book"
              className="mt-2 btn-glow rounded-full bg-[#D98E3F] px-6 py-3 text-center text-sm font-semibold text-[#12100E]"
            >
              Book a Table
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
