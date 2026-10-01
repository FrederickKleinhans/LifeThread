# LifeThread

LifeThread is a personal journal for capturing moments, ideas, projects, and
the loose ends that matter. It organizes short entries into visual threads
with folders, tags, statuses, and a searchable timeline.

## Current state

The app is a Vite + React + TypeScript application with:

- A responsive, card-based journal interface
- Daily Feed, Open Threads, Ideas Park, Archive, Tags, Search, Progress, and Export views
- Bottom navigation for Open Threads, Ideas Park, Search, and Progress, with a More sheet for the remaining destinations and account actions
- Quick capture with add-to-thread and create-new-thread flows
- Inline thread title editing
- Thread detail pages with entry creation and editing
- Custom folder and entry-type selectors
- IndexedDB persistence through Dexie
- Supabase email/password authentication
- Supabase-backed profiles, threads, entries, and tags
- Row-level security policies so users can only access their own data
- IndexedDB synchronized as a local cache after remote data loads
- Profile/settings screen with display-name editing
- Durable offline mutation queue with reconnect replay
- Isolated mutation retries, exponential backoff, and a review screen for changes that cannot sync
- Incremental Supabase sync with a local watermark
- Thread tag color metadata, including tag rename and delete across threads
- Personalized notification preferences and optional Web Push re-engagement
- Online/offline status and visible sync errors
- Focus/visibility reconciliation for multi-tab changes
- Daily Feed entries are limited to active threads; archived threads, abandoned
  threads, and threads in the Archive folder are excluded
- Route-level code splitting
- SPA deployment fallbacks for Vercel and Netlify
- Runtime error boundary for basic production diagnostics

## Supabase setup

The database migration is in [`supabase/schema.sql`](./supabase/schema.sql).
Run it in the Supabase SQL Editor before using authenticated journal storage.

Create `app/.env.local` with:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use [`.env.example`](./.env.example) as the template. Never put a Supabase
service-role key or database password in the frontend environment.

## Development

From the `app` directory:

```bash
npm install
npm run dev
```

Build the production bundle:

```bash
npm run build
```

The build and lint commands currently pass.

Run the automated unit tests:

```bash
npm test
```

Tests use Vitest and MSW to exercise remote repository behavior and failed
offline mutation replay without contacting Supabase. CI runs tests along with
lint and build.

## Deploy with Vercel and GitHub

The Vercel project should use the repository root `app` as its **Root
Directory**. Vercel will then use the existing Vite build:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm ci`

Add these environment variables in Vercel under **Project Settings →
Environment Variables** for Development, Preview, and Production:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-long-random-secret
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:you@example.com
```

The publishable key is safe for browser use. The service-role key is needed by
the server-side scheduled push function, so it may be stored as a server-side
Vercel environment variable. Never give it a `VITE_` prefix, expose it to the
browser, or commit it (or a database password) to GitHub. A database password
is not needed for this deployment. The local `.env.local` file is ignored and
must not be committed.

### Web Push and scheduled re-engagement

The Vercel Cron job at `/api/cron/send-reengagement` evaluates thread activity
once daily at 17:00 UTC. To enable it:

1. Apply the appended push and notification-history SQL statements in
   [`supabase/schema.sql`](./supabase/schema.sql) to the Supabase project. For a
   new database, run the full schema; for an existing database, apply the new
   statements at the end of the file.
2. Generate a VAPID key pair from `app/` with `npx web-push generate-vapid-keys`.
   Set the public key as both `VITE_VAPID_PUBLIC_KEY` and `VAPID_PUBLIC_KEY`;
   keep the private key server-side only.
3. Set the remaining server-side Vercel variables above. `CRON_SECRET` must be
   a long, random value; Vercel uses it to authorize scheduled invocations.
   `SUPABASE_SERVICE_ROLE_KEY` and `VAPID_PRIVATE_KEY` must never use a `VITE_`
   prefix or be exposed to the browser.
4. Redeploy, sign in, and enable push in Settings from a supported browser.
   Browser permission and the in-app notification controls are both required.

The `SUPABASE_URL` value is the same project URL used by the browser variable.
The scheduler respects each profile's notification preferences and timezone.
Push is optional; the personalized in-app notification center works without
VAPID configuration.

To connect GitHub:

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project**.
3. Import `FrederickKleinhans/LifeThread`.
4. Set the Root Directory to `app`.
5. Add the two Supabase environment variables.
6. Deploy. Future pushes and pull requests will create automatic deployments.

GitHub Actions validates `npm run lint`, `npm test`, and `npm run build` for
pushes to `main` and all pull requests.

## Completed

- Redesigned the visual system toward a warmer, more motivating journal
  experience
- Fixed responsive layout, dropdown clipping, modal overflow, and blank-page
  issues
- Built reliable quick-capture handoff into new thread creation
- Added thread and entry editing flows
- Added Supabase client configuration
- Added authentication and profile onboarding entry point
- Added database schema, indexes, trigger-based profile creation, and RLS
- Connected thread, entry, and tag CRUD to the authenticated Supabase profile
- Preserved IndexedDB as a local cache
- Added profile settings and sign-out controls
- Configured browser sessions to persist until explicit sign-out
- Added offline queueing and replay for journal/profile mutations
- Added mutation backoff/dead-letter review, tag metadata consistency, and incremental sync
- Added personalized notification preferences and Vercel Cron Web Push delivery
- Added multi-tab refresh/reconciliation and sync error visibility
- Added bottom navigation and grouped secondary destinations under More
- Filtered Daily Feed and its recent-entry fallback to active threads only
- Added runtime error boundary, route-level code splitting, and SPA deployment fallbacks

## Outstanding

1. Add attachment uploads through Supabase Storage rather than database rows.
2. Add deeper conflict-resolution UI if multiple tabs edit the same record simultaneously.

Local-data import is intentionally deferred while the app is in testing. It
can be added later if existing browser-only journal data needs to be preserved.
Attachments are also intentionally deferred until the core profile experience
is stable.
