# PackForVacation Mobile

Bundled Capacitor app for iOS and Android.

## Architecture

- **Bundled UI** (`mobile/`) — Vite + React screens ship inside the native app
- **Supabase client** — login, trips, checklist, My Gear, My Group
- **Backend API** — AI trip generation via `POST /api/mobile/trips` on the Next.js site

This is the production-ready path (not a hosted WebView wrapper).

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://packforvacation.com
```

3. In Supabase Auth → URL configuration, add redirect URL:

```
com.packforvacation.app://auth/callback
```

4. Install and run the web shell:

```bash
npm install
npm run dev
```

## Native builds

```bash
# Build web assets + sync into native projects
npm run native:sync

# Open Android Studio
npm run native:android

# Open Xcode (macOS only)
npm run native:ios
```

### Requirements

- **Android:** Android Studio + SDK
- **iOS:** macOS + Xcode + CocoaPods / SwiftPM (Capacitor 8 uses Package.swift)

## What’s included

- Google sign-in (native deep-link callback)
- Trip list + packing checklist with realtime updates
- Quick trip creation with AI list generation
- My Gear and My Group libraries

## Store notes

Before App Store / Play submission:

1. Replace default Capacitor icons/splash with PackForVacation branding
2. Confirm Google OAuth works on a physical device
3. Deploy the Next.js API (`/api/mobile/trips`) to production
4. Add privacy policy + support URLs for both stores
