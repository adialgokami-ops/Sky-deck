'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';

// In-memory module cache for instant re-renders across tab switches & route changes
const memoryBookingsCache: Record<string, Booking[]> = {};

/**
 * Subscribe to the `bookings` table via Supabase Realtime + polling fallback with in-memory caching.
 * Optionally filter by booking status(es).
 */
export function useRealtimeBookings(statusFilter?: string[]) {
  const cacheKey = statusFilter ? statusFilter.sort().join(',') : '__all__';
  const [bookings, setBookings] = useState<Booking[]>(() => memoryBookingsCache[cacheKey] || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryBookingsCache[cacheKey]);
  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  const fetchBookings = useCallback(async () => {
    let query = supabase
      .from('bookings')
      .select('id, table_id, guest_name, phone, party_size, note, status, created_at, tables(id, label, zone, capacity)')
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
    const fresh = (data as unknown as Booking[]) || [];
    memoryBookingsCache[cacheKey] = fresh;
    setBookings(fresh);
    setLoading(false);
  }, [cacheKey]);

  useEffect(() => {
    fetchBookings();

    // Realtime subscription
    const channel = supabase
      .channel(`bookings-realtime-${cacheKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    // Polling fallback: re-fetch every 6 seconds to guarantee freshness
    const pollInterval = setInterval(fetchBookings, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchBookings, cacheKey]);

  return { bookings, loading, refetch: fetchBookings };
}
