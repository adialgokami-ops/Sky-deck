import Link from 'next/link';

export default function MobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold-200 dark:border-gold-400/10 bg-white/95 dark:bg-[#0F0F12]/95 p-3 backdrop-blur-lg md:hidden">
      <Link
        href="/book"
        className="block w-full rounded-full bg-gold-400 py-3.5 text-center text-sm font-semibold text-[#0F0F12] shadow-lg shadow-gold-600/15 dark:shadow-gold-400/20 transition-all active:scale-[0.98]"
      >
        Book a Table
      </Link>
    </div>
  );
}
