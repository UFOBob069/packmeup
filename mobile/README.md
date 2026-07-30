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
VITE_API_URL=https://www.packforvacation.com
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

## Build an APK in GitHub (no Android Studio)

1. Open the GitHub repository and go to **Settings → Secrets and variables → Actions**.
2. Add these repository secrets using the values from `mobile/.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Ensure the **deployed website** has `OPENAI_API_KEY` set in Vercel (Production) and redeployed. The APK calls `https://www.packforvacation.com/api/mobile/*` for AI — it never ships the OpenAI key.
4. Go to **Actions → Build Android APK → Run workflow**.
5. When the build finishes, open it and download the
   **PackForVacation-Android** artifact.
6. Unzip the artifact and send `app-debug.apk` to your phone through Drive,
   email, or another file-sharing service.
7. Open the APK on Android and allow **Install unknown apps** when prompted.

No Play Console, developer account, USB connection, Java, or Android Studio is
required for this debug APK.

Verify AI on the server: open `https://www.packforvacation.com/api/mobile/status` — `openaiConfigured` should be `true`.

### Requirements

- **Android:** Android Studio + SDK
- **iOS:** macOS + Xcode + CocoaPods / SwiftPM (Capacitor 8 uses Package.swift)

## What’s included

- Google sign-in (native deep-link callback)
- Trip list + packing checklist with realtime updates
- Quick trip creation with AI list generation
- My Gear and My Group libraries

## Store notes

### Ready for Google Play (after this release)

- Branded icons + splash
- Privacy Policy (`/privacy`) + Terms (`/terms`) + Support (`/support`)
- Account deletion in-app (**Account**) and on the web (`/account/delete`) — required by Play
- Production API host: `https://www.packforvacation.com`

### Create a Play upload keystore (once)

```bash
cd mobile/android
keytool -genkey -v -keystore packforvacation-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias packforvacation
cp keystore.properties.example keystore.properties
# edit keystore.properties with your passwords
```

Never commit `.jks` or `keystore.properties`.

### Build a signed AAB locally

```bash
cd mobile
npm run native:sync
cd android
./gradlew bundleRelease
# output: app/build/outputs/bundle/release/app-release.aab
```

### Build a signed AAB in GitHub Actions

Add repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ANDROID_KEYSTORE_BASE64` — `base64 -w0 packforvacation-upload.jks` (Git Bash / Linux)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Then run **Actions → Build Android AAB**.

### Play Console checklist

1. Upload the AAB and enroll in Play App Signing
2. Set privacy policy URL: `https://www.packforvacation.com/privacy`
3. Set account deletion URL: `https://www.packforvacation.com/account/delete`
4. Complete Data safety (Google sign-in, trip content, AI processing via server)
5. Content rating + screenshots

### Still waiting on Apple Developer

- Sign in with Apple (required when offering Google login)
- Xcode team + Archive for App Store
- App Store Connect privacy labels + screenshots
