-- SkyDeck Table Booking Demo — Seed Data
--
-- Assumption: The banquet hall is intentionally excluded from this demo.
-- It is normally booked as a whole event space (not individual walk-in tables)
-- and will be handled separately in a future version.
--
-- This script is idempotent — it uses ON CONFLICT to avoid duplicating rows
-- if run multiple times. Conflict is checked on the label column (assumes unique).

-- Rooftop zone: R1–R6, capacities 2/4/4/6/4/2
INSERT INTO tables (label, zone, capacity, status) VALUES
  ('R1', 'Rooftop', 2, 'available'),
  ('R2', 'Rooftop', 4, 'available'),
  ('R3', 'Rooftop', 4, 'available'),
  ('R4', 'Rooftop', 6, 'available'),
  ('R5', 'Rooftop', 4, 'available'),
  ('R6', 'Rooftop', 2, 'available')
ON CONFLICT (label) DO NOTHING;

-- Indoor AC zone: IN1–IN5, capacities 2/4/4/6/8
INSERT INTO tables (label, zone, capacity, status) VALUES
  ('IN1', 'Indoor AC', 2, 'available'),
  ('IN2', 'Indoor AC', 4, 'available'),
  ('IN3', 'Indoor AC', 4, 'available'),
  ('IN4', 'Indoor AC', 6, 'available'),
  ('IN5', 'Indoor AC', 8, 'available')
ON CONFLICT (label) DO NOTHING;

-- Outdoor zone: O1–O5, capacities 2/4/4/6/4
INSERT INTO tables (label, zone, capacity, status) VALUES
  ('O1', 'Outdoor', 2, 'available'),
  ('O2', 'Outdoor', 4, 'available'),
  ('O3', 'Outdoor', 4, 'available'),
  ('O4', 'Outdoor', 6, 'available'),
  ('O5', 'Outdoor', 4, 'available')
ON CONFLICT (label) DO NOTHING;
