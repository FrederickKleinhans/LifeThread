import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { useThreadStore } from './stores/threadStore';
import { supabase } from './lib/supabase';
import { AuthPage } from './pages/AuthPage';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { Settings } from './pages/Settings';

const DailyFeed = lazy(() => import('./pages/DailyFeed').then(({ DailyFeed: page }) => ({ default: page })));
const OpenThreads = lazy(() => import('./pages/OpenThreads').then(({ OpenThreads: page }) => ({ default: page })));
const IdeasPark = lazy(() => import('./pages/IdeasPark').then(({ IdeasPark: page }) => ({ default: page })));
const ArchiveView = lazy(() => import('./pages/ArchiveView').then(({ ArchiveView: page }) => ({ default: page })));
const TagsView = lazy(() => import('./pages/TagsView').then(({ TagsView: page }) => ({ default: page })));
const SearchView = lazy(() => import('./pages/SearchView').then(({ SearchView: page }) => ({ default: page })));
const ThreadDetail = lazy(() => import('./pages/ThreadDetail').then(({ ThreadDetail: page }) => ({ default: page })));
const ExportView = lazy(() => import('./pages/ExportView').then(({ ExportView: page }) => ({ default: page })));
const StatsView = lazy(() => import('./pages/StatsView').then(({ StatsView: page }) => ({ default: page })));

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const loadAll = useThreadStore((s) => s.loadAll);
  const loading = useThreadStore((s) => s.loading);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) {
      void loadAll().catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Unable to load your journal.');
      });
    }
  }, [loadAll, session]);

  if (authLoading || (session && loading && !loadError)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading your threads...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f7f3ed] px-5 py-10 flex items-center justify-center">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#27231f]">Your journal could not load</h1>
          <p className="mt-2 text-sm text-[#766e64]">{loadError}</p>
          <button
            onClick={() => {
              setLoadError('');
              void loadAll().catch((error: unknown) => {
                setLoadError(error instanceof Error ? error.message : 'Unable to load your journal.');
              });
            }}
            className="mt-5 rounded-xl bg-[#4f46a5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#40388f]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f7f3ed] text-sm text-[#766e64]">Loading LifeThread...</div>}>
        <Routes>
          <Route element={<Layout />}>
          <Route path="/" element={<DailyFeed />} />
          <Route path="/threads" element={<OpenThreads />} />
          <Route path="/ideas" element={<IdeasPark />} />
          <Route path="/archive" element={<ArchiveView />} />
          <Route path="/tags" element={<TagsView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/thread/:id" element={<ThreadDetail />} />
          <Route path="/stats" element={<StatsView />} />
          <Route path="/export" element={<ExportView />} />
          <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
