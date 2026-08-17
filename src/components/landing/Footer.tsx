'use client';

import Link from 'next/link';

const quickLinks = [
  { label: 'Book a Table', href: '/book' },
  { label: 'Our Story', href: '#story' },
  { label: 'Menu', href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/skydeck.pune', icon: 'IG' },
  { label: 'Facebook', href: 'https://facebook.com/skydeckpune', icon: 'FB' },
  { label: 'Twitter', href: 'https://twitter.com/skydeckpune', icon: 'X' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#0E0D0B]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-baseline gap-0.5 mb-4">
              <span className="font-display text-2xl font-bold text-[#F4EFE8]">Sky</span>
              <span className="font-display text-2xl font-bold text-[#D98E3F]">Deck</span>
            </Link>
            <p className="text-sm text-[#6B6560] leading-relaxed max-w-sm mb-6">
              Elevated dining above Pimpri-Chinchwad. Three curated zones, one unforgettable evening. Open nightly from 5 PM.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs font-bold text-[#6B6560] hover:text-[#D98E3F] hover:border-[#D98E3F]/20 transition-all"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#6B6560] mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A69E93] hover:text-[#D98E3F] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#6B6560] mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-[#A69E93]">
              <li>
                <a href="tel:+919876543210" className="hover:text-[#D98E3F] transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li>
                <a href="mailto:hello@skydeck.in" className="hover:text-[#D98E3F] transition-colors">
                  hello@skydeck.in
                </a>
              </li>
              <li className="text-[#6B6560] leading-relaxed">
                4th Floor, Phoenix Mall,<br />
                Pimpri-Chinchwad, Pune 411018
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#6B6560]">
            © {new Date().getFullYear()} SkyDeck. All rights reserved.
          </p>
          <p className="text-xs text-[#6B6560]">
            Crafted with care in Pune
          </p>
        </div>
      </div>
    </footer>
  );
}
