import { useState, useRef, useMemo } from 'react';
import { Plus, Send } from 'lucide-react';
import { useThreadStore } from '../stores/threadStore';
import { useNavigate } from 'react-router-dom';
import { detectEntryType } from '../utils/statusInference';
import { NewThreadModal } from './NewThreadModal';
import type { EntryType } from '../types';

export function QuickCapture() {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [threadFilter, setThreadFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const threads = useThreadStore((s) => s.threads);
  const addEntry = useThreadStore((s) => s.addEntry);
  const createThread = useThreadStore((s) => s.createThread);
  const navigate = useNavigate();

  // Show all active threads, optionally filtered by a search within the dropdown
  const availableThreads = useMemo(() => {
    const active = threads
      .filter((t) => !t.archived_at && !t.abandoned_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    if (!threadFilter.trim()) return active.slice(0, 8);

    const q = threadFilter.toLowerCase();
    return active.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 8);
  }, [threads, threadFilter]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    setThreadFilter('');
    setShowDropdown(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    const suggested = detectEntryType(input);
    const entryType: EntryType = (suggested as EntryType) || 'log';
    await addEntry(threadId, entryType, input.trim());
    setInput('');
    setShowDropdown(false);
    setThreadFilter('');
  };

  const handleNewThread = () => {
    setShowDropdown(false);
    setShowNewThreadModal(true);
  };

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition-all">
          <Plus size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture something... press Enter to add"
            className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
            aria-label="Quick capture input"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="text-indigo-500 hover:text-indigo-700 disabled:text-gray-300 transition-colors"
            aria-label="Submit capture"
          >
            <Send size={18} />
          </button>
        </div>

        {showDropdown && input.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {/* Thread search within dropdown */}
            {threads.filter((t) => !t.archived_at && !t.abandoned_at).length > 3 && (
              <div className="px-3 pt-3 pb-1">
                <input
                  type="text"
                  value={threadFilter}
                  onChange={(e) => setThreadFilter(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  autoFocus
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {availableThreads.length > 0 && (
                <div className="px-3 pt-2 pb-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Add to thread</span>
                </div>
              )}
              {availableThreads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectThread(t.id)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{t.title}</span>
                  <span className="text-xs text-gray-400 ml-2">{t.folder}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100">
              <button
                onClick={handleNewThread}
                className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
              >
                <Plus size={14} />
                Create new thread
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewThreadModal && (
        <NewThreadModal
          initialTitle={input}
          onClose={() => setShowNewThreadModal(false)}
          onCreate={async (title, folder, subfolder, tags) => {
            const thread = await createThread(title, folder, subfolder, tags);
            await addEntry(thread.id, 'log', input.trim());
            setInput('');
            setShowNewThreadModal(false);
            navigate(`/thread/${thread.id}`);
          }}
        />
      )}
    </>
  );
}
