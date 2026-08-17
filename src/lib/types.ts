// ---- Enums (matching Postgres enums) ----

export type TableStatus = 'available' | 'pending' | 'occupied' | 'cleaning';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

// ---- Row types ----

export interface Table {
  id: string;
  label: string;
  zone: string;       // 'Rooftop' | 'Indoor AC' | 'Outdoor' | 'Family Bar'
  capacity: number;
  status: TableStatus;
  updated_at: string;  // ISO-8601
}

export interface Booking {
  id: string;
  table_id: string;
  guest_name: string;
  phone: string;
  party_size: number;
  note: string | null;
  status: BookingStatus;
  created_at: string;  // ISO-8601

  // Joined field (optional — populated by select queries with join)
  tables?: Table;
}

// ---- Zone Definitions & Central Source of Truth ----

export const ZONES = ['Rooftop', 'Indoor AC', 'Outdoor', 'Family Bar'] as const;
export type Zone = (typeof ZONES)[number];

export interface ZoneConfig {
  name: Zone;
  image: string;
  bgImage: string;
  seats: string;
  bestFor: string;
  description: string;
  accent: string;
  accentGlow: string;
  accentBg: string;
  accentBorder: string;
}

export const ZONE_DETAILS: ZoneConfig[] = [
  {
    name: 'Rooftop',
    image: '/images/zone-rooftop.jpg',
    bgImage: '/images/hero-bg.jpg',
    seats: '2–8',
    bestFor: 'Date night, skyline views',
    description: 'Open-air tables beneath string lights with panoramic views of the Pune skyline.',
    accent: '#D98E3F',
    accentGlow: 'rgba(217, 142, 63, 0.45)',
    accentBg: 'rgba(217, 142, 63, 0.12)',
    accentBorder: 'rgba(217, 142, 63, 0.35)',
  },
  {
    name: 'Indoor AC',
    image: '/images/zone-indoor.jpg',
    bgImage: '/images/zone-indoor.jpg',
    seats: '2–12',
    bestFor: 'Family, celebrations',
    description: 'Climate-controlled elegance with warm wood and copper accents throughout.',
    accent: '#60A5FA',
    accentGlow: 'rgba(96, 165, 250, 0.45)',
    accentBg: 'rgba(96, 165, 250, 0.12)',
    accentBorder: 'rgba(96, 165, 250, 0.35)',
  },
  {
    name: 'Outdoor',
    image: '/images/zone-outdoor.jpg',
    bgImage: '/images/zone-outdoor.jpg',
    seats: '2–6',
    bestFor: 'Casual, group drinks',
    description: 'Garden-side seating surrounded by greenery — perfect for relaxed evenings.',
    accent: '#4ADE80',
    accentGlow: 'rgba(74, 222, 128, 0.45)',
    accentBg: 'rgba(74, 222, 128, 0.12)',
    accentBorder: 'rgba(74, 222, 128, 0.35)',
  },
  {
    name: 'Family Bar',
    image: '/images/zone-familybar.jpg',
    bgImage: '/images/zone-familybar.jpg',
    seats: '2–10',
    bestFor: 'Families, live buzz',
    description: 'Bar-height and lounge seating with a kid-friendly menu — lively, relaxed, and family-first.',
    accent: '#FB7185',
    accentGlow: 'rgba(251, 113, 133, 0.45)',
    accentBg: 'rgba(251, 113, 133, 0.12)',
    accentBorder: 'rgba(251, 113, 133, 0.35)',
  },
];

/** Pending bookings auto-expire after this many minutes. */
export const EXPIRY_MINUTES = 10;

/** Status display config */
export const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; color: string; glow: string; bg: string; border: string }
> = {
  available: {
    label: 'Available',
    color: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-200/30 dark:shadow-emerald-500/20',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-300 dark:border-emerald-500/40',
  },
  pending: {
    label: 'Reserved — Confirming',
    color: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-200/30 dark:shadow-amber-500/20',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-300 dark:border-amber-500/40',
  },
  occupied: {
    label: 'Occupied',
    color: 'text-red-600 dark:text-red-400',
    glow: 'shadow-red-200/30 dark:shadow-red-500/20',
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-red-300 dark:border-red-500/40',
  },
  cleaning: {
    label: 'Being Cleaned',
    color: 'text-sky-600 dark:text-sky-400',
    glow: 'shadow-sky-200/30 dark:shadow-sky-500/20',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    border: 'border-sky-300 dark:border-sky-500/40',
  },
};
