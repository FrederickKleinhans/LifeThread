# LifeThread

LifeThread is a personal journal for capturing moments, ideas, projects, and
the loose ends that matter. It organizes short entries into visual threads
with folders, tags, statuses, and a searchable timeline.

## Current state

The app is a Vite + React + TypeScript application with:

- A responsive, card-based journal interface
- Daily Feed, Open Threads, Ideas Park, Archive, Tags, Search, Progress, and Export views
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
- Online/offline status and visible sync errors
- Focus/visibility reconciliation for multi-tab changes
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
```

The publishable key is safe for browser use. Never add the Supabase service-role
key or database password to Vercel or GitHub. The local `.env.local` file is
ignored and must not be committed.

To connect GitHub:

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project**.
3. Import `FrederickKleinhans/LifeThread`.
4. Set the Root Directory to `app`.
5. Add the two Supabase environment variables.
6. Deploy. Future pushes and pull requests will create automatic deployments.

GitHub Actions validates `npm run lint` and `npm run build` for pushes to
`main` and all pull requests.

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
- Added multi-tab refresh/reconciliation and sync error visibility
- Added runtime error boundary, route-level code splitting, and SPA deployment fallbacks

## Outstanding

1. Add focused automated tests for auth, sync, and CRUD failures.
2. Add attachment uploads through Supabase Storage rather than database rows.
3. Add deeper conflict-resolution UI if multiple tabs edit the same record simultaneously.

Local-data import is intentionally deferred while the app is in testing. It
can be added later if existing browser-only journal data needs to be preserved.
Attachments are also intentionally deferred until the core profile experience
is stable.
