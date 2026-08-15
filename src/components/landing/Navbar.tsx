'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Story', href: '#story' },
  { label: 'Zones', href: '#zones' },
  { label: 'Menu', href: '#menu' },
  { label: 'Hours', href: '#hours' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#0F0F12]/90 backdrop-blur-lg border-b border-stone-200 dark:border-white/5 shadow-lg shadow-stone-300/40 dark:shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
          Sky<span className="text-gold-600 dark:text-gold-400">Deck</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-500 dark:text-white/60 transition-colors hover:text-stone-900 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/book"
            className="rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-[#0F0F12] shadow-lg shadow-gold-600/15 dark:shadow-gold-400/20 transition-all hover:bg-gold-500 hover:shadow-gold-600/20 dark:hover:shadow-gold-400/30 active:scale-[0.97]"
          >
            Book a Table
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-stone-600 dark:text-white/70 transition-colors hover:bg-stone-100 dark:bg-white/5 md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-stone-200 dark:border-white/5 bg-white/95 dark:bg-[#0F0F12]/95 px-5 pb-6 pt-4 backdrop-blur-lg md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-stone-600 dark:text-white/70 transition-colors hover:text-stone-900 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/book"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-full bg-gold-400 px-5 py-3 text-center text-sm font-semibold text-[#0F0F12] shadow-lg shadow-gold-600/15 dark:shadow-gold-400/20 transition-all hover:bg-gold-500"
            >
              Book a Table
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
