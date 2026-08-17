// seed-tables.mjs — run with: node seed-tables.mjs
// Inserts expanded table counts + all Family Bar tables into Supabase
// Safe to re-run: uses upsert with onConflict:'label' (DO NOTHING on duplicates)

const SUPABASE_URL = 'https://jepazbijyqburaqzzfer.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcGF6YmlqeXFidXJhcXp6ZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MDA1NDAsImV4cCI6MjEwMjM3NjU0MH0.Li3zzFLlqnvrx8DYheceyHyXUfGprJHducgCXlmWjEY';

const tables = [
  // ── Rooftop: increase from 6 → 10 tables (R7–R10 are new) ──────
  { label: 'R7',  zone: 'Rooftop',    capacity: 2, status: 'available' },
  { label: 'R8',  zone: 'Rooftop',    capacity: 4, status: 'available' },
  { label: 'R9',  zone: 'Rooftop',    capacity: 4, status: 'available' },
  { label: 'R10', zone: 'Rooftop',    capacity: 6, status: 'available' },

  // ── Indoor AC: increase from 5 → 9 tables (IN6–IN9 are new) ────
  { label: 'IN6', zone: 'Indoor AC',  capacity: 4, status: 'available' },
  { label: 'IN7', zone: 'Indoor AC',  capacity: 6, status: 'available' },
  { label: 'IN8', zone: 'Indoor AC',  capacity: 8, status: 'available' },
  { label: 'IN9', zone: 'Indoor AC',  capacity: 4, status: 'available' },

  // ── Outdoor: increase from 5 → 9 tables (O6–O9 are new) ────────
  // Note: seed.sql already has O5, so we start at O6
  { label: 'O6',  zone: 'Outdoor',    capacity: 2, status: 'available' },
  { label: 'O7',  zone: 'Outdoor',    capacity: 4, status: 'available' },
  { label: 'O8',  zone: 'Outdoor',    capacity: 4, status: 'available' },
  { label: 'O9',  zone: 'Outdoor',    capacity: 6, status: 'available' },

  // ── Family Bar: 8 new tables (FB1–FB8) ──────────────────────────
  { label: 'FB1', zone: 'Family Bar', capacity: 4, status: 'available' },
  { label: 'FB2', zone: 'Family Bar', capacity: 6, status: 'available' },
  { label: 'FB3', zone: 'Family Bar', capacity: 4, status: 'available' },
  { label: 'FB4', zone: 'Family Bar', capacity: 8, status: 'available' },
  { label: 'FB5', zone: 'Family Bar', capacity: 4, status: 'available' },
  { label: 'FB6', zone: 'Family Bar', capacity: 6, status: 'available' },
  { label: 'FB7', zone: 'Family Bar', capacity: 4, status: 'available' },
  { label: 'FB8', zone: 'Family Bar', capacity: 6, status: 'available' },
];

async function seed() {
  console.log(`\nSeeding ${tables.length} table records into Supabase...\n`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/tables`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates',
    },
    body: JSON.stringify(tables),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Insert failed:', res.status, err);
    process.exit(1);
  }

  console.log('✅ Tables inserted (duplicates ignored).\n');

  // Verify: fetch current counts per zone
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tables?select=zone,status`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  const rows = await verifyRes.json();
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.zone]) grouped[row.zone] = { total: 0, available: 0 };
    grouped[row.zone].total++;
    if (row.status === 'available') grouped[row.zone].available++;
  }

  console.log('── Live counts after seeding ──────────────────');
  for (const [zone, counts] of Object.entries(grouped).sort()) {
    const ok = zone === 'Family Bar' ? '🆕' : '✅';
    console.log(`  ${ok} ${zone.padEnd(12)} ${counts.available}/${counts.total} free`);
  }
  console.log('───────────────────────────────────────────────\n');

  if (!grouped['Family Bar']) {
    console.error('❌ Family Bar still not in DB — check RLS policies or table constraints.');
  } else {
    console.log('🎉 Done! Refresh your browser to see the updated counts.\n');
  }
}

seed().catch(console.error);
