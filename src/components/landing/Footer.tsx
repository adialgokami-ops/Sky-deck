import Link from 'next/link';
import { Globe, Mail, Phone } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Our Story', href: '#story' },
  { label: 'Zones', href: '#zones' },
  { label: 'Menu', href: '#menu' },
  { label: 'Hours & Location', href: '#hours' },
  { label: 'Book a Table', href: '/book' },
];

/* Social icons are placeholders — swap hrefs when accounts are live */
const SOCIALS = [
  { icon: Globe, href: '#', label: 'Website' },
  { icon: Mail, href: '#', label: 'Email' },
  { icon: Phone, href: '#', label: 'Phone' },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 dark:border-white/5 bg-[#F0EDE6] dark:bg-[#0a0a0e]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="font-serif text-2xl font-bold text-stone-900 dark:text-white">
              Sky<span className="text-gold-600 dark:text-gold-400">Deck</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400 dark:text-white/30">
              Rooftop dining above the Pimpri-Chinchwad skyline. Seasonal menus,
              golden-hour views, live table booking.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-white/50">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => {
                const isExternal = link.href.startsWith('#');
                return (
                  <li key={link.href}>
                    {isExternal ? (
                      <a
                        href={link.href}
                        className="text-sm text-stone-400 dark:text-white/40 transition-colors hover:text-stone-900 dark:hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-stone-400 dark:text-white/40 transition-colors hover:text-stone-900 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-white/50">
              Follow Us
            </h4>
            <div className="mt-4 flex gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 dark:border-white/10 text-stone-400 dark:text-white/40 transition-all hover:border-gold-300 dark:hover:border-gold-400/30 hover:bg-gold-50 dark:bg-gold-400/5 hover:text-gold-600 dark:hover:text-gold-400"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-stone-200 dark:border-white/5 pt-6 text-center text-xs text-stone-300 dark:text-white/20">
          <p>Rooftop Restaurant · Pimpri-Chinchwad, Pune</p>
          <p className="mt-1">© {new Date().getFullYear()} SkyDeck. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
