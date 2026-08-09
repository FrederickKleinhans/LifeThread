import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DailyFeed } from './pages/DailyFeed';
import { OpenThreads } from './pages/OpenThreads';
import { IdeasPark } from './pages/IdeasPark';
import { ArchiveView } from './pages/ArchiveView';
import { TagsView } from './pages/TagsView';
import { SearchView } from './pages/SearchView';
import { ThreadDetail } from './pages/ThreadDetail';
import { ExportView } from './pages/ExportView';
import { StatsView } from './pages/StatsView';
import { useThreadStore } from './stores/threadStore';

export default function App() {
  const loadAll = useThreadStore((s) => s.loadAll);
  const loading = useThreadStore((s) => s.loading);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading your threads...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
