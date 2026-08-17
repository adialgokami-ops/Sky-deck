import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Story from '@/components/landing/Story';
import ZonesShowcase from '@/components/landing/ZonesShowcase';
import MenuHighlights from '@/components/landing/MenuHighlights';
import SocialProof from '@/components/landing/SocialProof';
import AmbienceGallery from '@/components/landing/AmbienceGallery';
import HoursLocation from '@/components/landing/HoursLocation';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';
import MobileCTA from '@/components/landing/MobileCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#12100E]">
      <div className="relative">
        <Navbar />
        <Hero />
        <Story />
        <ZonesShowcase />
        <MenuHighlights />
        <SocialProof />
        <AmbienceGallery />
        <HoursLocation />
        <FinalCTA />
        <Footer />
        <MobileCTA />
      </div>
    </div>
  );
}
