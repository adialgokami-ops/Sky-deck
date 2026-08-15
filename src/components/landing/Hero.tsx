import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background gradient treatment — atmospheric rooftop skyline mood */}
      {/* TODO: Replace this CSS gradient backdrop with a real hero photo via next/image */}
      {/* Use a warm, atmospheric rooftop-dining image here */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0E8] dark:from-[#1a1510] via-[#FAF9F6] dark:via-[#0F0F12] to-[#FAF9F6] dark:to-[#0F0F12]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(212,175,55,0.08),transparent)]" />
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 h-[400px] w-[600px] bg-amber-100/20 dark:bg-amber-500/[0.04] blur-[100px] rounded-full" />

      {/* Decorative skyline silhouette hint */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAF9F6] dark:from-[#0F0F12] to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <h1 className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-stone-900 dark:text-white sm:text-6xl md:text-7xl">
          {/* Alternate headline options:
              "An evening above it all."
              "Where the skyline sets the table."
          */}
          Dinner, above the city.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-500 dark:text-white/50 sm:text-lg">
          Golden-hour rooftop dining with live seating across Rooftop, Indoor AC,
          and Outdoor zones — Pimpri-Chinchwad, Pune.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/book"
            className="group rounded-full bg-gold-400 px-8 py-4 text-base font-semibold text-[#0F0F12] shadow-lg shadow-gold-600/15 dark:shadow-gold-400/20 transition-all duration-300 hover:bg-gold-500 hover:shadow-xl hover:shadow-gold-600/20 dark:hover:shadow-gold-400/30 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Book a Table
          </Link>
          <a
            href="#menu"
            className="rounded-full border border-stone-300/50 dark:border-white/15 px-8 py-4 text-base font-medium text-stone-600 dark:text-white/70 transition-all duration-300 hover:border-stone-300 dark:hover:border-white/30 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-white/[0.03]"
          >
            View the Menu
          </a>
        </div>

        {/* Live availability teaser — static/illustrative */}
        {/* TODO: This could later be wired to useRealtimeTables for live data */}
        <p className="mt-8 text-sm text-stone-400 dark:text-white/30">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          12 tables open right now
        </p>
      </div>
    </section>
  );
}
