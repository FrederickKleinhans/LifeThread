# LifeThread

LifeThread is a personal journal for capturing moments, ideas, projects, and
open threads. The application is in [`app/`](./app/); its feature overview,
Supabase setup, deployment notes, and development commands are in
[`app/README.md`](./app/README.md).

## Development

```bash
cd app
npm ci
npm run dev
```

Create `app/.env.local` from [`app/.env.example`](./app/.env.example) to connect
to Supabase. Use only the browser-safe publishable key; never expose a
service-role key in frontend configuration.

Run the checks from `app/`:

```bash
npm run lint
npm test
npm run build
```

The original build specification is available at
[`docs/LifeThread_Build_Spec_For_Kiro.pdf`](./docs/LifeThread_Build_Spec_For_Kiro.pdf).
