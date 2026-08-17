'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Table } from '@/lib/types';

// In-memory module cache for instant rendering across mounts & tab switches
let memoryTableCache: Table[] | null = null;

/**
 * Subscribe to the `tables` table via Supabase Realtime with instant in-memory caching.
 * Returns the live list of tables, grouped by zone.
 */
export function useRealtimeTables() {
  const [tables, setTables] = useState<Table[]>(() => memoryTableCache || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryTableCache);

  const fetchTables = useCallback(async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('label', { ascending: true });

    if (error) {
      console.error('Error fetching tables:', error);
      return;
    }
    const fresh = (data as Table[]) || [];
    memoryTableCache = fresh;
    setTables(fresh);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTables();

    const channel = supabase
      .channel('tables-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          setTables((prev) => {
            let next: Table[];
            if (payload.eventType === 'INSERT') {
              next = [...prev, payload.new as Table];
            } else if (payload.eventType === 'UPDATE') {
              next = prev.map((t) =>
                t.id === (payload.new as Table).id ? (payload.new as Table) : t
              );
            } else if (payload.eventType === 'DELETE') {
              next = prev.filter((t) => t.id !== (payload.old as Table).id);
            } else {
              next = prev;
            }
            memoryTableCache = next;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTables]);

  return { tables, loading, refetch: fetchTables };
}
