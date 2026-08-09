import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import { EntryCard } from '../components/EntryCard';
import { StatusBadge } from '../components/StatusBadge';
import { useStatus } from '../hooks/useStatus';
import { Search } from 'lucide-react';
import type { Thread } from '../types';

function ThreadResult({ thread, matchingEntries, navigate }: { thread: Thread; matchingEntries: any[]; navigate: (path: string) => void }) {
  const { status, dormant } = useStatus(thread);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <button
        onClick={() => navigate(`/thread/${thread.id}`)}
        className="flex items-center gap-2 mb-2 hover:text-indigo-600 transition-colors"
      >
        <StatusBadge status={status} dormant={dormant} />
        <span className="text-sm font-medium">{thread.title}</span>
      </button>
      {matchingEntries.length > 0 && (
        <div className="space-y-2 ml-4 border-l-2 border-gray-100 pl-3">
          {matchingEntries.slice(0, 3).map((entry) => (
            <EntryCard key={entry.id} entry={entry} showThread={false} />
          ))}
          {matchingEntries.length > 3 && (
            <p className="text-xs text-gray-400">+{matchingEntries.length - 3} more matches</p>
          )}
        </div>
      )}
    </div>
  );
}

export function SearchView() {
  const { query, setQuery, results } = useSearch();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Search</h2>
        <p className="text-sm text-gray-500 mt-1">Find threads, entries, and tags</p>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search across everything..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-sm"
        autoFocus
      />

      {query.trim() && results.length === 0 && (
        <div className="text-center py-16">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No results</h3>
          <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <ThreadResult
              key={result.thread.id}
              thread={result.thread}
              matchingEntries={result.matchingEntries}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
