## Goal

Rebuild the existing **[Dealer Coach AI](/projects/63577d97-5768-479f-aed4-39bdc683f289)** project in this workspace as a plain **Vite + React + Tailwind SPA** that deploys cleanly to **Firebase Hosting**, with the AI logic moved to **Firebase Cloud Functions** (so the `LOVABLE_API_KEY` / model API key stays server-side).

The product itself stays identical: an AI coaching tool for Mitsubishi Motors district managers — dealer list, dealer detail page with KPI trends, peer benchmarking, AI-generated insights (root causes + ranked next-best actions), and a coach chat.

## What gets ported (1:1 from source project)

UI / data:
- All routes: dealer list (`/`), dealer detail (`/dealers/:dealerId`), data view (`/data`)
- All components under `src/components/app/`: `AppHeader`, `CoachChat`, `CoachInsights`, `HealthBadge`, `InsightChip`, `KpiTrendCard`, `Sparkline`
- All shadcn `ui/` components actually used
- Mock data + types in `src/data/` (`dealers.ts`, `health.ts`, `insights.ts`, `types.ts`)
- Tailwind theme / design tokens from `src/styles.css`

Server logic (today: TanStack `createServerFn` + one server route):
- `getCoachInsights` — structured insights via tool-calling
- `coach-chat` — streaming chat endpoint
- `callAi` / `streamAi` / `dealerDataPacket` helpers

## What changes for the Firebase stack

1. **Framework swap**: TanStack Start → **Vite + React 19 + React Router v6** SPA. No SSR.
2. **Routing**: file-based TanStack routes → React Router with the same URL shape (`/`, `/dealers/:dealerId`, `/data`).
3. **Server functions → Firebase Cloud Functions (2nd gen, HTTPS)**:
   - `POST /api/coach-insights` → wraps `getCoachInsights` logic
   - `POST /api/coach-chat` → streaming chat (SSE/ReadableStream)
   - Both call the Lovable AI Gateway server-side using a `LOVABLE_API_KEY` stored as a Firebase Functions secret (Secret Manager). Frontend never sees the key.
4. **Hosting wiring**: `firebase.json` rewrites `/api/**` to the Functions, and all other routes to `index.html` so the SPA handles client-side routing (fixes refresh-on-deep-link).
5. **Build output**: `vite build` → `dist/`, which Firebase Hosting serves.

## Project structure

```text
/
├── src/
│   ├── main.tsx                 # Vite entry, mounts <App/>
│   ├── App.tsx                  # React Router setup
│   ├── pages/
│   │   ├── DealerList.tsx       # was routes/index.tsx
│   │   ├── DealerDetail.tsx     # was routes/dealers.$dealerId.tsx
│   │   └── DataView.tsx         # was routes/data.tsx
│   ├── components/app/...       # ported as-is
│   ├── components/ui/...        # shadcn (already present here)
│   ├── data/...                 # ported as-is
│   ├── lib/api.ts               # fetch helpers calling /api/coach-insights, /api/coach-chat
│   └── styles.css               # ported tokens
├── functions/                   # Firebase Cloud Functions (Node 20, TypeScript)
│   ├── src/
│   │   ├── index.ts             # exports api(): Express app
│   │   ├── ai.ts                # callAi / streamAi (LOVABLE_API_KEY from secret)
│   │   ├── coachInsights.ts     # tool-calling handler
│   │   ├── coachChat.ts         # streaming handler
│   │   └── dealerData.ts        # dealerDataPacket + dealer data (duplicated for server use)
│   ├── package.json
│   └── tsconfig.json
├── firebase.json                # hosting + functions rewrites
├── .firebaserc                  # project alias placeholder
├── vite.config.ts               # SPA, alias @/ → src
├── tailwind/postcss config      # Tailwind v4 via @tailwindcss/postcss (matches source)
└── package.json
```

## Build steps

1. **Reset framework scaffolding**
   - Remove TanStack Start specifics: `src/router.tsx`, `src/routeTree.gen.ts`, `src/routes/`, the TanStack Vite plugin from `vite.config.ts`, related deps.
   - Add `react-router-dom`, set up `src/main.tsx` + `src/App.tsx` with `<BrowserRouter>` and routes.
   - Update `index.html` to mount `#root`.

2. **Port frontend**
   - Copy `src/data/`, `src/components/app/`, used `src/components/ui/`, `src/styles.css`, and any used hooks/utils from the source project via cross-project copy.
   - Convert each TanStack route (`index.tsx`, `dealers.$dealerId.tsx`, `data.tsx`) into a React Router page component. Replace `Route.useParams()` with `useParams()`, `<Link to=...>` from TanStack with the React Router equivalent, and any `createServerFn` call sites with `fetch('/api/...')` via `src/lib/api.ts`.

3. **Create Firebase Functions backend**
   - Initialize `functions/` (Node 20, TypeScript, 2nd gen).
   - Single Express app exported as `api`, mounted at `/api` via Hosting rewrites.
   - `POST /coach-insights`: ports `getCoachInsights` — same Zod input, same OpenAI-style tool schema, same prompt, returns parsed JSON.
   - `POST /coach-chat`: ports `streamAi` — proxies streaming response back to client (`text/event-stream`).
   - `LOVABLE_API_KEY` stored via `firebase functions:secrets:set LOVABLE_API_KEY`.

4. **Firebase config**
   ```json
   // firebase.json (essentials)
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         { "source": "/api/**", "function": { "functionId": "api" } },
         { "source": "**", "destination": "/index.html" }
       ]
     },
     "functions": [{ "source": "functions", "codebase": "default", "runtime": "nodejs20" }]
   }
   ```

5. **Frontend API client**
   - `src/lib/api.ts`: `getCoachInsights(dealerId)` and `streamCoachChat(messages)` hitting the same `/api/*` paths so it works identically in dev and prod.
   - Vite dev: add a `server.proxy` for `/api` → `http://127.0.0.1:5001/<project>/us-central1/api` (Firebase emulator), or document `firebase emulators:start` workflow.

6. **Deployment docs (README section)**
   - `npm install` (root + `functions/`)
   - `firebase login` → `firebase use --add <your-project>`
   - `firebase functions:secrets:set LOVABLE_API_KEY`
   - `npm run build && firebase deploy`

## Things to confirm during build

- Whether you want **auth** (Firebase Auth) gating the app, or it stays open for the POC. Default in this plan: **open**, matches source project.
- Whether to also persist anything to **Firestore** (e.g. saved actions). Default: **no** — data stays mock, matches source.
- Region for Functions. Default: `us-central1`.

## Out of scope

- No SSR / no TanStack Start.
- No Lovable Cloud / Supabase — Firebase only.
- No design changes — pixel-faithful port of the existing UI.

After you approve, I'll switch to build mode, copy the files from the source project, wire up the Vite SPA, and scaffold the `functions/` directory ready for `firebase deploy`.