-- SkyDeck Table Booking — Migration: Expanded Capacity + Family Bar
--
-- Safe to run multiple times — uses ON CONFLICT DO NOTHING on label.
-- Run this in your Supabase SQL editor: https://supabase.com/dashboard/project/_/sql
--
-- What this does:
--   1. Adds 4 more tables each to Rooftop, Indoor AC, and Outdoor
--   2. Adds 8 new Family Bar tables (FB1-FB8)
--
-- After running, refresh your dev server — live counters will update automatically.

-- ── Rooftop: add R7–R10 ──────────────────────────────────────────
INSERT INTO tables (label, zone, capacity, status) VALUES
  ('R7',  'Rooftop', 4, 'available'),
  ('R8',  'Rooftop', 6, 'available'),
  ('R9',  'Rooftop', 2, 'available'),
  ('R10', 'Rooftop', 8, 'available')
ON CONFLICT (label) DO NOTHING;

-- ── Indoor AC: add IN6–IN9 ───────────────────────────────────────
INSERT INTO tables (label, zone, capacity, status) VALUES
  ('IN6', 'Indoor AC',  6, 'available'),
  ('IN7', 'Indoor AC',  8, 'available'),
  ('IN8', 'Indoor AC', 10, 'available'),
  ('IN9', 'Indoor AC', 12, 'available')
ON CONFLICT (label) DO NOTHING;

-- ── Outdoor: add O6–O9 ──────────────────────────────────────────
INSERT INTO tables (label, zone, capacity, status) VALUES
  ('O6', 'Outdoor', 2, 'available'),
  ('O7', 'Outdoor', 4, 'available'),
  ('O8', 'Outdoor', 4, 'available'),
  ('O9', 'Outdoor', 6, 'available')
ON CONFLICT (label) DO NOTHING;

-- ── Family Bar: FB1–FB8 (NEW ZONE) ──────────────────────────────
INSERT INTO tables (label, zone, capacity, status) VALUES
  ('FB1', 'Family Bar',  4, 'available'),
  ('FB2', 'Family Bar',  6, 'available'),
  ('FB3', 'Family Bar',  4, 'available'),
  ('FB4', 'Family Bar',  8, 'available'),
  ('FB5', 'Family Bar',  4, 'available'),
  ('FB6', 'Family Bar',  6, 'available'),
  ('FB7', 'Family Bar',  4, 'available'),
  ('FB8', 'Family Bar', 10, 'available')
ON CONFLICT (label) DO NOTHING;

-- ── Verify: expected output after migration ──────────────────────
-- Zone         | table_count | total_seats
-- Family Bar   |      8      |     46
-- Indoor AC    |      9      |     60
-- Outdoor      |      9      |     38
-- Rooftop      |     10      |     46
SELECT
  zone,
  COUNT(*)       AS table_count,
  SUM(capacity)  AS total_seats
FROM tables
GROUP BY zone
ORDER BY zone;
