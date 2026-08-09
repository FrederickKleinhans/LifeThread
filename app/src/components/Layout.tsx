import { useState } from 'react';
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
} from 'lucide-react';
import { NewThreadModal } from './NewThreadModal';
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
];

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const navigate = useNavigate();
  const { createThread, addEntry } = useThreadStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          Life<span className="text-indigo-600">Thread</span>
        </h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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
          w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          pt-14 md:pt-0
        `}
      >
        <div className="p-5 border-b border-gray-100 hidden md:block">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Life<span className="text-indigo-600">Thread</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Your living record</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* New Thread button in sidebar */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setShowNewThread(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            New Thread
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button (mobile) */}
      <button
        onClick={() => setShowNewThread(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center md:hidden"
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
