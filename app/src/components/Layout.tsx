import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Newspaper,
  ListTodo,
  Lightbulb,
  Archive,
  Tag,
  Search,
  Download,
  Menu,
  X,
  Trophy,
  Plus,
  Settings,
  Wifi,
  WifiOff,
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

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const navigate = useNavigate();
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
    <div className="flex min-h-screen overflow-x-hidden bg-[#f7f3ed]">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#f7f3ed]/95 backdrop-blur border-b border-[#e6ded2] px-4 py-3 flex items-center justify-between md:hidden safe-top">
        <h1 className="text-lg font-bold text-[#27231f] tracking-tight">
          Life<span className="text-[#4f46a5]">Thread</span>
        </h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 rounded-lg text-[#766e64] hover:bg-[#eee7dc] transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-60 bg-[#fbf9f6] border-r border-[#e6ded2] flex flex-col flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          pt-14 md:pt-0
        `}
      >
        <div className="p-5 border-b border-[#e6ded2] hidden md:block">
          <h1 className="text-xl font-bold text-[#27231f] tracking-tight">
            Life<span className="text-[#4f46a5]">Thread</span>
          </h1>
          <p className="text-xs text-[#9a9186] mt-0.5">A place for what matters</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${online ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {online ? <Wifi size={14} /> : <WifiOff size={14} />} {online ? 'Online' : 'Offline — changes saved locally'}
          </div>
          {syncError && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Sync issue: {syncError}</div>}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#ebe9f8] text-[#4f46a5]'
                    : 'text-[#766e64] hover:bg-[#f1ece5] hover:text-[#27231f]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* New Thread button in sidebar */}
        <div className="p-3 border-t border-[#e6ded2]">
          <button
            onClick={() => void supabase.auth.signOut()}
            className="mb-2 w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[#766e64] hover:bg-[#f1ece5] hover:text-[#27231f]"
          >
            Sign out
          </button>
          <button
            onClick={() => setShowNewThread(true)}
            className="group relative w-full overflow-hidden flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#4f46a5] to-[#665bc0] text-white hover:from-[#40388f] hover:to-[#554bad] transition-all shadow-[0_8px_18px_rgba(79,70,165,0.2)]"
          >
            <span className="absolute inset-y-0 right-0 w-1/3 bg-[#f0a36d]/20 skew-x-[-20deg] translate-x-10 group-hover:translate-x-0 transition-transform" />
            <Plus size={17} strokeWidth={2.5} />
            <span className="relative">New thread</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 bg-[#f7f3ed] pt-16 md:pt-0">
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-5 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button (mobile) */}
      <button
        onClick={() => setShowNewThread(true)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-br from-[#4f46a5] to-[#756bd2] text-white rounded-2xl shadow-[0_10px_24px_rgba(79,70,165,0.3)] hover:scale-105 transition-all flex items-center justify-center md:hidden safe-bottom"
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
