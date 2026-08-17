// ---- Enums (matching Postgres enums) ----

export type TableStatus = 'available' | 'pending' | 'occupied' | 'cleaning';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

// ---- Row types ----

export interface Table {
  id: string;
  label: string;
  zone: string;       // 'Rooftop' | 'Indoor AC' | 'Outdoor'
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

// ---- Constants ----

export const ZONES = ['Rooftop', 'Indoor AC', 'Outdoor', 'Family Bar'] as const;
export type Zone = (typeof ZONES)[number];

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
