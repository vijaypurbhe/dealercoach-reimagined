# Dealer Coach AI — Vite + React + Firebase

AI coaching assistant for Mitsubishi Motors district managers. Vite + React 19 + Tailwind v4 SPA with a Firebase Cloud Functions backend that proxies the Lovable AI Gateway.

## Local development

```bash
# 1. Install
bun install
cd functions && npm install && cd ..

# 2. Set the AI key (one-time)
firebase login
firebase use --add        # pick your Firebase project, alias as "default"
firebase functions:secrets:set LOVABLE_API_KEY

# 3. Run emulator (functions) + Vite dev server in two terminals
cd functions && npm run build && firebase emulators:start --only functions
# then in another terminal:
bun run dev
```

Vite dev server runs on `:8080` and proxies `/api/*` to the Functions emulator (`:5001`). If your Firebase project ID is not `dealer-coach-ai`, update `vite.config.ts` `server.proxy['/api'].target` or set `VITE_API_PROXY`.

## Deploy to Firebase

```bash
bun run build                      # produces dist/
cd functions && npm run build      # produces functions/lib/
cd ..
firebase deploy                    # hosting + functions
```

Hosting rewrites `/api/**` to the `api` Cloud Function (us-central1) and falls back to `index.html` for client-side routing.

## Project layout

```
src/                # Vite SPA (React Router)
  pages/            # Portfolio, Dealer, Data
  components/app/   # AppHeader, CoachChat, CoachInsights, charts...
  components/ui/    # shadcn primitives
  data/             # mock dealers, KPIs, types
  lib/api.ts        # fetch helpers calling /api/*
functions/          # Firebase Cloud Functions (Node 20, TS)
  src/index.ts      # Express app exporting `api`
  src/ai.ts         # Lovable AI Gateway client
  src/data/         # dealer data mirrored from src/data
firebase.json       # hosting + functions wiring
```

When real MMNA data replaces the mock extracts, update both `src/data/dealers.ts` (frontend types & sparklines) and `functions/src/data/dealers.ts` (server-side packet builder), or extract a shared package.
