'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Table } from '@/lib/types';

/**
 * Subscribe to the `tables` table via Supabase Realtime.
 * Returns the live list of tables, grouped by zone.
 */
export function useRealtimeTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('label', { ascending: true });

    if (error) {
      console.error('Error fetching tables:', error);
      return;
    }
    setTables(data as Table[]);
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
            if (payload.eventType === 'INSERT') {
              return [...prev, payload.new as Table];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((t) =>
                t.id === (payload.new as Table).id ? (payload.new as Table) : t
              );
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((t) => t.id !== (payload.old as Table).id);
            }
            return prev;
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
