# YoloTravel — AI-powered travel planning

Personalized trip plans built with Claude, live Booking.com inventory, Google Maps routing, and shareable itinerary codes. Mobile-first React app, deployed on Vercel.

![Status](https://img.shields.io/badge/status-active-success) ![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite%206-blue)

## What it does

- AI-curated trip cards for popular destinations (Romantic, Foodie, Adventure, Budget, …)
- Conversational trip builder powered by Anthropic's Claude API
- Per-day itineraries enriched with real Google Places photos, ratings, and review counts
- Live hotel inventory through Booking.com via RapidAPI, plus deep-links into Booking affiliate URLs
- Shareable `trip_plans` stored in Supabase — generate a 6-character code (`X7K4M2`) and anyone with the code or `/p/X7K4M2` link can open your full itinerary with a live, viewer-side budget recompute
- Premium dark UI tuned for mobile

## Quick start

```bash
npm install
cp .env.example .env   # then fill in your keys
npm run dev            # vite at http://localhost:3000
```

## Environment variables

Create a `.env` in the project root with the following keys. Get each one from the linked dashboard.

| Variable | Used by | Where to get it |
| --- | --- | --- |
| `VITE_CLAUDE_API_KEY` | Browser — Claude prompt + itinerary generation | https://console.anthropic.com |
| `VITE_GOOGLE_MAPS_KEY` | Browser — Google Maps JS API on itinerary screens | https://console.cloud.google.com → APIs & Services → Maps JavaScript API |
| `GOOGLE_MAPS_KEY` | Vercel function — server-side Places lookups (same key as above) | Same as `VITE_GOOGLE_MAPS_KEY` |
| `RAPIDAPI_KEY` | Vercel function — Booking.com search through RapidAPI | https://rapidapi.com → subscribe to *Booking-com* |
| `VITE_SUPABASE_URL` | Browser — shareable plans backend | https://app.supabase.com → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Browser — shareable plans backend | Same as above |

`VITE_`-prefixed values are bundled into the client; never put a server-only secret behind `VITE_`.

## Database — Supabase setup

Open your Supabase project → **SQL Editor** → **New query** and paste:

```sql
-- Shareable AI-generated travel plans
create table if not exists public.trip_plans (
  id          uuid        primary key default gen_random_uuid(),
  share_code  text        not null unique,           -- 6-char alnum, e.g. "X7K4M2"
  city        text        not null,
  country     text        not null,
  days        int         not null,
  vibe        text        not null,
  plan_data   jsonb       not null,                  -- full TripPlan payload
  created_by  text,                                  -- optional display name
  created_at  timestamptz not null default now()
);

create index if not exists trip_plans_share_code_idx on public.trip_plans (share_code);
create index if not exists trip_plans_created_at_idx on public.trip_plans (created_at desc);

-- Anonymous read + insert for the share-link flow (tighten when accounts ship)
alter table public.trip_plans enable row level security;

create policy "trip_plans_anon_read"   on public.trip_plans for select to anon using (true);
create policy "trip_plans_anon_insert" on public.trip_plans for insert to anon with check (true);
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | `tsc --noEmit` type check |
| `npm run clean` | Wipe `dist/` |

## Deploy

```bash
vercel --prod
```

Make sure every `.env` key above is also set in **Vercel → Project Settings → Environment Variables** for the Production environment. The included `vercel.json` rewrite makes deep links like `/p/X7K4M2` resolve correctly on a static SPA deploy.

## Tech

React 19 · Vite 6 · TypeScript · Tailwind v4 · Motion · `@react-google-maps/api` · `@supabase/supabase-js` · `html-to-image` · Anthropic Claude SDK
