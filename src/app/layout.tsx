import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyDeck — Rooftop Dining & Table Booking, Pune",
  description:
    "Experience rooftop dining at SkyDeck, Pimpri-Chinchwad, Pune. Book a table across Rooftop, Indoor AC, and Outdoor zones with live availability.",
  openGraph: {
    title: "SkyDeck — Rooftop Dining & Table Booking, Pune",
    description:
      "Experience rooftop dining at SkyDeck, Pimpri-Chinchwad, Pune. Book a table across Rooftop, Indoor AC, and Outdoor zones with live availability.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F6] dark:bg-[#0F0F12] antialiased">
        {children}
      </body>
    </html>
  );
}
