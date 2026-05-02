# Firebase Deployment

This project can deploy to Firebase Hosting + Cloud Functions in addition to running on Lovable Cloud.

## One-time setup

1. Install the Firebase CLI: `npm i -g firebase-tools` and `firebase login`
2. Create a Firebase project (Blaze plan required for Cloud Functions outbound calls).
3. Set your project id in `.firebaserc` (replace `your-firebase-project-id`).
4. Store the Lovable AI key as a Functions secret:
   ```
   firebase functions:secrets:set LOVABLE_API_KEY
   ```

## Build & deploy

```
# Build the SPA pointing at Firebase rewrites
VITE_BACKEND=firebase npm run build

# Build the functions
npm --prefix functions install
npm --prefix functions run build

# Deploy hosting + functions
firebase deploy
```

`firebase.json` rewrites `/api/coach-insights` and `/api/coach-chat` to the
`coachInsights` / `coachChat` Cloud Functions. The SPA falls back to client-side
routing for everything else.

## Switching backends

- `VITE_BACKEND=firebase` → calls `/api/*` (Firebase)
- unset / anything else → calls Supabase edge functions (Lovable Cloud default)
