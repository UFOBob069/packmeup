# Pack Me Up

AI-powered travel packing assistant built with Next.js 15, Supabase, and OpenAI.

## Features

- **Conversational trip creation** — guided chat onboarding in under 60 seconds
- **AI packing lists** — weather-aware, activity-specific, traveler-assigned items
- **Collaborative checklists** — invite partners via email or share link with realtime updates
- **Multiple views** — master, per-traveler, activity, outfit planner, and calendar
- **AI refinement chat** — refine lists without rebuilding the trip
- **Templates** — reusable presets for common trip types
- **Dark mode** — system-aware theme toggle

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Realtime, Storage-ready)
- OpenAI API (with intelligent fallback when unconfigured)
- Open-Meteo weather API (free, no key required)
- Vercel deployment ready

## Quick Start (Demo Mode)

Demo mode works out of the box with no external services:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **View Demo** or **Continue to Demo** on login.

Sample data includes a Scottsdale golf trip with David, Jen, and Andre (dog).

## Production Setup

1. Copy environment variables:

```bash
cp .env.local.example .env.local
```

2. Create a [Supabase](https://supabase.com) project and run the migration:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/001_initial_schema.sql
```

3. Enable Google OAuth in Supabase Auth settings.

4. Add your keys to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-key
NEXT_PUBLIC_DEMO_MODE=false
```

5. Enable Realtime on the `packing_items` table in Supabase Dashboard.

6. Deploy to Vercel:

```bash
vercel
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
├── actions/              # Server Actions (trips, packing, chat)
├── components/
│   ├── layout/           # Header, theme toggle
│   ├── trip/             # Trip-specific components
│   └── ui/               # shadcn/ui components
└── lib/
    ├── ai/               # OpenAI packing & chat
    ├── demo/             # In-memory store for demo mode
    ├── supabase/         # Supabase clients
    ├── types/            # TypeScript types
    └── weather/          # Weather service
supabase/
└── migrations/           # Database schema
```

## User Flow

1. **Sign in** (Google, email, or demo mode)
2. **Create trip** via conversational onboarding
3. **AI generates** packing list, outfits, and calendar
4. **Collaborate** — invite partners, check off items in realtime
5. **Refine** via AI chat ("make this fit in a carry-on")
6. **Save templates** for future trips

## License

MIT
