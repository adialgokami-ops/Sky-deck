import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Story from '@/components/landing/Story';
import ZonesShowcase from '@/components/landing/ZonesShowcase';
import MenuHighlights from '@/components/landing/MenuHighlights';
import AmbienceGallery from '@/components/landing/AmbienceGallery';
import HoursLocation from '@/components/landing/HoursLocation';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';
import MobileCTA from '@/components/landing/MobileCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0F0F12]">
      {/* Warm gradient glow effect — matches booking page treatment */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-amber-100/50 dark:from-amber-900/8 via-transparent to-transparent" />
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] bg-amber-100/40 dark:bg-amber-500/5 blur-[120px] rounded-full" />

      <div className="relative">
        <Navbar />
        <Hero />
        <Story />
        <ZonesShowcase />
        <MenuHighlights />
        <AmbienceGallery />
        <HoursLocation />
        <FinalCTA />
        <Footer />
        <MobileCTA />
      </div>
    </div>
  );
}
