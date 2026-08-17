'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';

/**
 * Subscribe to the `bookings` table via Supabase Realtime + polling fallback.
 * Optionally filter by booking status(es).
 *
 * Polling runs every 5 seconds to guarantee updates even if
 * Supabase Realtime is not configured for the bookings table.
 */
export function useRealtimeBookings(statusFilter?: string[]) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  const fetchBookings = useCallback(async () => {
    let query = supabase
      .from('bookings')
      .select('*, tables(*)')
      .order('created_at', { ascending: false });

    const sf = statusFilterRef.current;
    if (sf && sf.length > 0) {
      query = query.in('status', sf);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }
    setBookings(data as Booking[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();

    // Realtime subscription (may or may not work depending on Supabase config)
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    // Polling fallback: re-fetch every 5 seconds to guarantee freshness
    const pollInterval = setInterval(fetchBookings, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
}
