import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useThreadStore } from '../stores/threadStore';
import { ThreadListItem } from '../components/ThreadListItem';
import { inferStatus } from '../utils/statusInference';
import type { ThreadStatus, Folder } from '../types';
import { ListTodo, X } from 'lucide-react';

const STATUS_FILTERS: ThreadStatus[] = ['ACTIVE', 'WAITING', 'BLOCKED', 'INBOX'];

export function OpenThreads() {
  const threads = useThreadStore((s) => s.threads);
  const entries = useThreadStore((s) => s.entries);
  const [statusFilter, setStatusFilter] = useState<ThreadStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag') || '';

  const clearTagFilter = () => {
    searchParams.delete('tag');
    setSearchParams(searchParams);
  };

  const openThreads = useMemo(() => {
    return threads
      .filter((t) => !t.archived_at && !t.abandoned_at && t.folder !== 'Archive')
      .map((t) => {
        const threadEntries = entries.filter((e) => e.thread_id === t.id);
        const status = inferStatus(t, threadEntries);
        return { thread: t, status };
      })
      .filter(({ status }) => {
        if (statusFilter === 'ALL') return true;
        return status === statusFilter;
      })
      .filter(({ thread }) => {
        if (!searchQuery.trim()) return true;
        return thread.title.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter(({ thread }) => {
        if (!tagFilter) return true;
        return thread.tags.includes(tagFilter);
      })
      .sort((a, b) => new Date(b.thread.updated_at).getTime() - new Date(a.thread.updated_at).getTime());
  }, [threads, entries, statusFilter, searchQuery, tagFilter]);

  const grouped = useMemo(() => {
    const groups: Record<Folder, typeof openThreads> = {
      Life: [],
      Doing: [],
      Ideas: [],
      Archive: [],
    };
    for (const item of openThreads) {
      groups[item.thread.folder].push(item);
    }
    return groups;
  }, [openThreads]);

  const folderOrder: Folder[] = ['Doing', 'Life', 'Ideas'];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#302b68] px-5 py-7 text-white shadow-[0_18px_45px_rgba(48,43,104,0.16)] sm:px-8">
        <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[#f0a36d]/60 blur-3xl" />
        <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f8c49e] mb-2">In motion</p>
        <h2 className="text-3xl font-bold text-white">Open Threads</h2>
        <p className="text-sm text-white/70 mt-2">The things you’re exploring, building, and tending to.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {tagFilter && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
            <span className="text-sm text-indigo-700">
              Filtering by tag: <span className="font-medium">#{tagFilter}</span>
            </span>
            <button
              onClick={clearTagFilter}
              className="ml-auto text-indigo-500 hover:text-indigo-700 transition-colors"
              aria-label="Clear tag filter"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#ebe9f8] text-[#4f46a5]'
                : 'bg-[#eee7dc] text-[#766e64] hover:bg-[#e4dbcf]'
            }`}
          >
            All
          </button>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-[#ebe9f8] text-[#4f46a5]'
                  : 'bg-[#eee7dc] text-[#766e64] hover:bg-[#e4dbcf]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter threads..."
          className="w-full border border-[#d8cdbf] bg-[#fbf9f6] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d9d5f3] focus:border-[#8f89ca]"
        />
      </div>

      {/* Thread groups */}
      {openThreads.length === 0 ? (
        <div className="text-center py-16">
          <ListTodo size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-[#4b443c]">Nothing in motion yet</h3>
          <p className="text-sm text-[#8d8378] mt-1">
            Start a thread when something deserves your attention.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {folderOrder.map((folder) => {
            const items = grouped[folder];
            if (items.length === 0) return null;
            return (
              <div key={folder}>
                <h3 className="flex items-center gap-2 text-xs font-bold text-[#c66b4b] uppercase tracking-[0.2em] mb-3">
                  <span className="h-px w-6 bg-[#e0b39d]" />
                  {folder}
                </h3>
                <div className="space-y-2">
                  {items.map(({ thread }) => (
                    <ThreadListItem key={thread.id} thread={thread} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
