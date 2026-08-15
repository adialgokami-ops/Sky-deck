'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';

/**
 * Subscribe to the `bookings` table via Supabase Realtime.
 * Optionally filter by booking status(es).
 */
export function useRealtimeBookings(statusFilter?: string[]) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    let query = supabase
      .from('bookings')
      .select('*, tables(*)')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }
    setBookings(data as Booking[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          // Re-fetch on any change to get the joined table data
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
}
