# SkyDeck Table Booking Demo — Build Spec for Antigravity

## READ THIS FIRST (guardrails — do not skip)
Build **exactly** what is specified below. Do not add features, pages, auth systems, notifications, payments, or "nice to haves" beyond what's listed. Do not ask clarifying questions — every decision has already been made below; if something is ambiguous, pick the simplest option that satisfies the acceptance criteria at the bottom. Stop building once the acceptance criteria are met. This is a demo for tomorrow, not a production system — favor speed and a working end-to-end flow over polish in the backend.

---

## 1. Goal
A no-login table-status and booking demo for **SkyDeck Rooftop Restaurant** (rooftop + indoor AC + outdoor + banquet venue, Pimpri-Chinchwad, Pune). Two pages only:
1. **Customer page** (`/`) — scanned via QR, shows live table grid, lets a guest request a table.
2. **Admin page** (`/admin`) — staff see live requests + can manage table status.

Both pages must reflect the **same live data** — if a customer requests a table, the admin sees it appear within a few seconds without refreshing, and if admin changes a table's status, the customer grid updates too.

---

## 2. Tech Stack (fixed — do not substitute)
- **Next.js 14 (App Router)** + TypeScript
- **Tailwind CSS** for styling
- **Supabase** (free tier) — Postgres for data + Supabase Realtime for live sync across devices. This replaces the need for a custom backend/server.
- **lucide-react** for icons
- Deploy target: **Vercel**, with env vars for Supabase URL/key and an admin PIN.
- No other backend, no auth provider, no payment SDK, no SMS/WhatsApp integration.

---

## 3. Data Model (Supabase / Postgres)

```sql
create type table_status as enum ('available', 'pending', 'occupied', 'cleaning');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'expired');

create table tables (
  id uuid primary key default gen_random_uuid(),
  label text not null,          -- e.g. "R4", "IN2", "O3"
  zone text not null,           -- 'Rooftop' | 'Indoor AC' | 'Outdoor'
  capacity int not null,
  status table_status not null default 'available',
  updated_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references tables(id) not null,
  guest_name text not null,
  phone text not null,
  party_size int not null,
  note text,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);
```

For the demo, disable Row Level Security or set fully permissive policies (anon can select/insert/update on both tables). Add a code comment noting this is intentionally open for demo purposes and must be locked down before real production use.

Enable Supabase Realtime on both tables (Database → Replication) so client subscriptions work.

---

## 4. Seed Data
Seed 16 tables across three zones (banquet hall is intentionally excluded from this demo — it's normally booked as a whole event space, not a walk-in table; note this as an assumption in a code comment):

- **Rooftop**: R1–R6, capacities alternating 2 / 4 / 4 / 6 / 4 / 2
- **Indoor AC**: IN1–IN5, capacities 2 / 4 / 4 / 6 / 8
- **Outdoor**: O1–O5, capacities 2 / 4 / 4 / 6 / 4

All start as `available`.

---

## 5. Customer Page (`/`)

**Layout:**
- Header: "SkyDeck" wordmark + tagline "Live Table Availability"
- Tabs or section headers for the 3 zones (Rooftop / Indoor AC / Outdoor)
- Grid of table cards. Each card shows: table label, capacity (with a seat icon), and a colored status badge.

**Status colors:**
- Available → green
- Pending (someone mid-booking) → amber, label "Reserved — Confirming"
- Occupied → red
- Cleaning → gray/blue, label "Being Cleaned"

**Interaction:**
- Only `available` tables are tappable. Others show status only (no click action).
- Tapping an available table opens a bottom sheet (mobile) / modal (desktop) with a form:
  - Name (required, text)
  - Phone number (required, 10-digit validation, India format)
  - Party size (stepper, min 1, max = that table's capacity; if they need more, show a small note "For larger groups, please contact the desk")
  - Optional note (text, e.g. "birthday", "near the edge")
  - Submit button: "Request This Table"

**On submit:**
1. Client re-checks the table is still `available` (handle race condition: if someone else grabbed it first, show "Sorry, this table was just taken — please pick another" and refresh the grid instead of submitting).
2. Insert a `bookings` row with status `pending`.
3. Update the `tables` row to status `pending`.
4. Show a confirmation screen: a short booking reference (last 6 chars of the booking id), the message **"Please walk up to the reception desk to confirm your table within 10 minutes, or it will be released automatically."**, and a live 10-minute countdown.

**Auto-expiry:** After 10 minutes with no admin confirmation, the booking should flip to `expired` and the table back to `available`. Implement this as a simple client-side check on page load/interval (compare `created_at` + 10 min vs now) that updates the rows — no need for a server cron job for the demo; note in comments that a scheduled Supabase Edge Function would replace this in production.

---

## 6. Admin Page (`/admin`)

**Access:** No real auth system. A single PIN entry screen (PIN read from an env var, e.g. `ADMIN_PIN`) gates access, stored in a cookie/session for the browser tab. Add a code comment: *this is demo-only security, not production-grade.*

**Layout, two sections:**

1. **Live Table Grid** — same visual grid as the customer page, but every table (regardless of status) is clickable and cycles through: Available → Occupied → Cleaning → Available. This lets staff manually mark walk-ins or finished tables without going through the booking flow.

2. **Request Queue** — list of `bookings` with status `pending`, newest first, each showing: guest name, phone (tap-to-call link), party size, table label, note, time requested, and a live "time remaining" countdown. Two actions per row:
   - **Confirm & Seat** → booking status → `confirmed`, table status → `occupied`
   - **Release** → booking status → `cancelled`, table status → `available`

Also show a collapsed "Recent history" section below (last ~10 confirmed/cancelled/expired bookings) so staff have context, but keep it visually secondary.

All of this must update live via Supabase Realtime subscriptions — no manual refresh needed.

---

## 7. Design Direction
SkyDeck's own branding is a dark, upscale "rooftop at night" aesthetic. Match that:
- Near-black background (`#0F0F12` or similar) with a subtle warm gradient/glow, evoking a night skyline.
- Accent color: warm gold/amber (`#D4AF37`-ish) for highlights, buttons, and the "available" glow.
- Headings: an elegant serif (e.g. "Playfair Display") for the SkyDeck wordmark and section titles. Body/UI text: clean sans-serif (e.g. "Inter").
- Table cards: rounded corners, soft shadow, a colored left border or subtle glow matching status. Avoid flat/static "admin panel" look — this should feel like a boutique restaurant product, not internal tooling.
- Mobile-first: assume 90% of customer traffic is a phone right after a QR scan. Admin page can be a bit denser since staff will likely use a tablet/desktop.
- Keep animations minimal and purposeful (status change transitions, countdown ticking) — no heavy motion libraries needed; CSS transitions are enough.

---

## 8. Explicitly Out of Scope (do not build)
- Payments or deposits
- SMS/WhatsApp/email notifications
- Menu browsing or food ordering
- Multi-restaurant support
- Real staff accounts/roles (just the single shared PIN)
- Banquet hall event booking
- Waitlist/queue-position algorithm beyond the simple pending list

---

## 9. Deployment
- Push to a GitHub repo, deploy via Vercel.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PIN`.
- I will handle attaching the custom subdomain and generating the QR code myself — just make sure the customer page works standalone at the root `/`.

---

## 10. Acceptance Criteria (demo script)
1. Open `/` on a phone → see the 16-table grid grouped by zone, all green/available.
2. Tap an available table → fill form → submit → see confirmation + 10-min countdown; table turns amber on the grid.
3. Open `/admin` on a laptop (enter PIN) → see the new request appear in the queue within a few seconds, without refreshing.
4. Click "Confirm & Seat" → table turns red/occupied on both the admin grid and the customer page (open in another tab) within a few seconds.
5. On admin grid, click an occupied table → cycles to "Cleaning" → cycles to "Available" — reflected live on customer page.
6. Try booking an already-pending table from a second browser tab → get the "just taken" message, no duplicate booking created.
7. Leave a booking unconfirmed for 10+ minutes → it auto-expires and the table returns to available.
