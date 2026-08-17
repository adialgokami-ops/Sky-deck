import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Quick diagnostic endpoint — returns live table counts from Supabase
// Visit /api/debug/tables in your browser to verify DB state
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('tables')
    .select('zone, status, label')
    .order('zone')
    .order('label');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by zone
  const grouped: Record<string, { total: number; available: number; labels: string[] }> = {};
  for (const row of (data || [])) {
    if (!grouped[row.zone]) grouped[row.zone] = { total: 0, available: 0, labels: [] };
    grouped[row.zone].total++;
    if (row.status === 'available') grouped[row.zone].available++;
    grouped[row.zone].labels.push(row.label);
  }

  return NextResponse.json({
    totalTables: data?.length ?? 0,
    zones: grouped,
    hasFamilyBar: !!grouped['Family Bar'],
    message: grouped['Family Bar']
      ? `✅ Family Bar found with ${grouped['Family Bar'].total} tables`
      : '❌ Family Bar NOT in database — run migration_add_family_bar.sql in Supabase SQL editor',
  });
}
