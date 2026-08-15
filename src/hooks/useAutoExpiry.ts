'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { EXPIRY_MINUTES } from '@/lib/types';

/**
 * Client-side auto-expiry for pending bookings.
 *
 * Every 30 seconds, checks for pending bookings older than EXPIRY_MINUTES
 * and marks them as expired, returning their table to 'available'.
 *
 * NOTE: In production, this should be replaced with a Supabase Edge Function
 * or a pg_cron job to ensure expiry happens even when no client is connected.
 */
export function useAutoExpiry() {
  const running = useRef(false);

  useEffect(() => {
    const checkExpiry = async () => {
      if (running.current) return;
      running.current = true;

      try {
        const cutoff = new Date(
          Date.now() - EXPIRY_MINUTES * 60 * 1000
        ).toISOString();

        // Find pending bookings that are past the expiry window
        const { data: expiredBookings, error } = await supabase
          .from('bookings')
          .select('id, table_id')
          .eq('status', 'pending')
          .lt('created_at', cutoff);

        if (error || !expiredBookings || expiredBookings.length === 0) {
          return;
        }

        // Expire each booking and release its table
        for (const booking of expiredBookings) {
          await supabase
            .from('bookings')
            .update({ status: 'expired' })
            .eq('id', booking.id);

          await supabase
            .from('tables')
            .update({ status: 'available', updated_at: new Date().toISOString() })
            .eq('id', booking.table_id);
        }
      } catch (err) {
        console.error('Auto-expiry error:', err);
      } finally {
        running.current = false;
      }
    };

    // Run immediately on mount, then every 30s
    checkExpiry();
    const interval = setInterval(checkExpiry, 30_000);

    return () => clearInterval(interval);
  }, []);
}
