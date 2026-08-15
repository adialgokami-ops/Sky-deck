import { createClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * NOTE: RLS is intentionally disabled / fully permissive for this demo.
 * The anon key can select, insert, and update on both `tables` and `bookings`.
 * This MUST be locked down before any production use.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
