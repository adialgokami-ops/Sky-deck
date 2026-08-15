import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-y border-gold-200 dark:border-gold-400/10">
      {/* Warm gold gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold-100/80 dark:from-gold-900/30 via-gold-50/60 dark:via-gold-800/20 to-gold-100/80 dark:to-gold-900/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(212,175,55,0.06),transparent)]" />

      <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-white sm:text-4xl md:text-5xl">
          Your table is waiting.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-stone-400 dark:text-white/40">
          See live availability across all three zones and reserve your spot in seconds.
        </p>
        <Link
          href="/book"
          className="mt-10 inline-block rounded-full bg-gold-400 px-10 py-4 text-base font-semibold text-[#0F0F12] shadow-lg shadow-gold-600/15 dark:shadow-gold-400/20 transition-all duration-300 hover:bg-gold-500 hover:shadow-xl hover:shadow-gold-600/20 dark:hover:shadow-gold-400/30 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          Book a Table
        </Link>
      </div>
    </section>
  );
}
