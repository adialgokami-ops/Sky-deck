'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';

const hours = [
  { day: 'Monday – Thursday', time: '5:00 PM – 11:00 PM' },
  { day: 'Friday – Saturday', time: '5:00 PM – 12:00 AM' },
  { day: 'Sunday', time: '12:00 PM – 11:00 PM' },
];

export default function HoursLocation() {
  const revealRef = useScrollReveal();

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div ref={revealRef} className="reveal mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#D98E3F] mb-4">Visit Us</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F4EFE8] tracking-tight">
            Hours &amp; Location
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Info */}
          <div className="space-y-8">
            {/* Address */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#1A1815]/60 p-6">
              <h3 className="font-display text-lg font-semibold text-[#F4EFE8] mb-3">Address</h3>
              <p className="text-[#A69E93] leading-relaxed">
                SkyDeck Rooftop Restaurant<br />
                4th Floor, Phoenix Mall,<br />
                Pimpri-Chinchwad, Pune 411018
              </p>
              <a
                href="https://maps.google.com/?q=SkyDeck+Pimpri+Chinchwad+Pune"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D98E3F]/20 bg-[#D98E3F]/10 px-5 py-2.5 text-sm font-medium text-[#D98E3F] hover:bg-[#D98E3F]/20 transition-colors"
              >
                Get Directions →
              </a>
            </div>

            {/* Hours */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#1A1815]/60 p-6">
              <h3 className="font-display text-lg font-semibold text-[#F4EFE8] mb-4">Hours</h3>
              <div className="space-y-3">
                {hours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between">
                    <span className="text-sm text-[#A69E93]">{h.day}</span>
                    <span className="text-sm font-medium text-[#F4EFE8]">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#1A1815]/60 p-6">
              <h3 className="font-display text-lg font-semibold text-[#F4EFE8] mb-3">Contact</h3>
              <div className="space-y-2">
                <a href="tel:+919876543210" className="block text-sm text-[#A69E93] hover:text-[#D98E3F] transition-colors">
                  +91 98765 43210
                </a>
                <a href="mailto:hello@skydeck.in" className="block text-sm text-[#A69E93] hover:text-[#D98E3F] transition-colors">
                  hello@skydeck.in
                </a>
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="rounded-2xl overflow-hidden border border-white/[0.06] min-h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3781.2!2d73.8!3d18.62!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sPimpri-Chinchwad%2C%20Pune!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 400, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.3) brightness(0.6)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="SkyDeck Location"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
