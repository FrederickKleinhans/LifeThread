import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Newspaper,
  ListTodo,
  Lightbulb,
  Archive,
  Tag,
  Search,
  Download,
  Trophy,
  Plus,
  Settings,
  Wifi,
  WifiOff,
  MoreHorizontal,
} from 'lucide-react';
import { NewThreadModal } from './NewThreadModal';
import { supabase } from '../lib/supabase';
import { useThreadStore } from '../stores/threadStore';

const navItems = [
  { to: '/', icon: Newspaper, label: 'Daily Feed' },
  { to: '/threads', icon: ListTodo, label: 'Open Threads' },
  { to: '/ideas', icon: Lightbulb, label: 'Ideas Park' },
  { to: '/archive', icon: Archive, label: 'Archive' },
  { to: '/tags', icon: Tag, label: 'Tags' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/stats', icon: Trophy, label: 'Progress' },
  { to: '/export', icon: Download, label: 'Export' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const bottomNavItems = navItems.filter(({ to }) =>
  ['/threads', '/ideas', '/search', '/stats'].includes(to)
);

export function Layout() {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { createThread, addEntry } = useThreadStore();
  const syncError = useThreadStore((state) => state.syncError);
  const loadAll = useThreadStore((state) => state.loadAll);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const set = () => { setOnline(navigator.onLine); if (navigator.onLine) void loadAll(); };
    window.addEventListener('online', set); window.addEventListener('offline', set);
    const reconcile = () => { if (document.visibilityState === 'visible') void loadAll(); };
    window.addEventListener('focus', reconcile); document.addEventListener('visibilitychange', reconcile);
    return () => { window.removeEventListener('online', set); window.removeEventListener('offline', set); window.removeEventListener('focus', reconcile); document.removeEventListener('visibilitychange', reconcile); };
  }, [loadAll]);

  return (
    <div className="canvas-bg flex min-h-screen overflow-x-hidden">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r-[3px] border-[var(--border)] bg-[var(--cobalt)] p-4 text-white md:flex">
        <div className="mb-8 px-3 pt-3 text-xl font-bold">
          Life<span className="text-[var(--butter)]">Thread</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `physical sb-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  isActive
                    ? 'border-2 border-[var(--border)] bg-white text-[var(--plum)] shadow-[4px_4px_0_var(--border)]'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t-2 border-white/25 pt-3">
          <button
            onClick={() => setShowNewThread(true)}
            className="physical flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--border)] bg-[var(--butter)] px-3 py-3 text-sm font-bold text-[var(--plum)] shadow-[4px_4px_0_var(--border)]"
          >
            <Plus size={17} strokeWidth={2.5} />
            New thread
          </button>
        </div>
      </aside>
      {/* App header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b-2 border-[var(--border)] bg-[var(--lilac)]/95 px-4 py-3 backdrop-blur safe-top md:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-[var(--plum)]">
            Life<span className="text-[var(--cobalt)]">Thread</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-[var(--ink-muted)] sm:inline">
              {location.pathname === '/' ? 'Daily Feed' : location.pathname === '/threads' ? 'Open Threads' : location.pathname.slice(1).replace('-', ' ')}
            </span>
            <button
              onClick={() => setShowNewThread(true)}
              className="physical flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--butter)] text-[var(--plum)] shadow-[2px_2px_0_var(--border)] md:hidden"
              aria-label="Create new thread"
            >
              <Plus size={17} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-w-0 flex-1 pb-20 pt-16">
        <div className="page-wrap p-4 sm:p-5 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="mobile-nav fixed bottom-0 left-0 right-0 z-40 px-2 py-2 safe-bottom md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {bottomNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors ${
                  isActive
                  ? 'border-2 border-[var(--border)] bg-[var(--butter)] text-[var(--plum)] shadow-[2px_2px_0_var(--border)]'
                  : 'text-[var(--ink-muted)] hover:bg-[var(--lilac)] hover:text-[var(--plum)]'
                }`
              }
            >
              <Icon size={18} />
              <span className="truncate">
                {label === 'Open Threads' ? 'Threads' : label === 'Ideas Park' ? 'Ideas' : label}
              </span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--lilac)] hover:text-[var(--plum)]"
            aria-label="Open more navigation options"
          >
            <MoreHorizontal size={18} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {moreMenuOpen && (
        <>
          <div
            className="fixed inset-x-0 top-0 bottom-20 z-40 bg-black/20"
            onClick={() => setMoreMenuOpen(false)}
          />
          <section
            className="fixed inset-x-0 bottom-20 z-50 rounded-t-3xl border-t border-[#e6ded2] bg-[#fbf9f6] p-4 shadow-2xl"
            aria-label="More navigation options"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8cdbf]" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {navItems
                .filter(({ to }) => !bottomNavItems.some((item) => item.to === to))
                .map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#ebe9f8] text-[#4f46a5]'
                          : 'text-[#766e64] hover:bg-[#f1ece5] hover:text-[#4b443c]'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
            </div>
            <div className="mt-3 grid gap-2 border-t border-[#e6ded2] pt-3 sm:grid-cols-3">
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${online ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {online ? <Wifi size={14} /> : <WifiOff size={14} />}
                {online ? 'Online' : 'Offline — changes saved locally'}
              </div>
              {syncError && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Sync issue: {syncError}</div>}
              <button
                onClick={() => void supabase.auth.signOut()}
                className="rounded-xl px-3 py-2 text-left text-xs font-medium text-[#766e64] hover:bg-[#f1ece5] hover:text-[#27231f]"
              >
                Sign out
              </button>
              <button
                onClick={() => {
                  setShowNewThread(true);
                  setMoreMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f46a5] to-[#665bc0] px-3 py-3 text-sm font-semibold text-white"
              >
                <Plus size={17} strokeWidth={2.5} />
                New thread
              </button>
            </div>
          </section>
        </>
      )}

      {/* Floating Action Button (mobile) */}
      <button
        onClick={() => setShowNewThread(true)}
        className="physical fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--border)] bg-[var(--coral)] text-[var(--plum)] shadow-[4px_4px_0_var(--border)] md:hidden safe-bottom"
        aria-label="Create new thread"
      >
        <Plus size={24} />
      </button>

      {/* New Thread Modal */}
      {showNewThread && (
        <NewThreadModal
          onClose={() => setShowNewThread(false)}
          onCreate={async (title, folder, subfolder, tags) => {
            const thread = await createThread(title, folder, subfolder, tags);
            await addEntry(thread.id, 'log', title);
            setShowNewThread(false);
            navigate(`/thread/${thread.id}`);
          }}
        />
      )}
    </div>
  );
}
