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
  const [pendingCapture, setPendingCapture] = useState('');
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
    const capture = input.trim();
    if (!capture) return;
    setPendingCapture(capture);
    setInput('');
    setShowDropdown(false);
    setShowNewThreadModal(true);
  };

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-2 bg-[#fbf9f6] border border-[#d8cdbf] rounded-2xl px-4 py-3.5 shadow-[0_6px_20px_rgba(92,74,54,0.06)] focus-within:ring-2 focus-within:ring-[#d9d5f3] focus-within:border-[#8f89ca] transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a moment, thought, or idea..."
            className="flex-1 bg-transparent text-sm !text-[#27231f] caret-[#4f46a5] outline-none placeholder:text-[#9a9186]"
            aria-label="Quick capture input"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="text-[#4f46a5] hover:text-[#40388f] disabled:text-[#c9c0b5] transition-colors"
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs !text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                className="w-full text-left px-4 py-3 text-sm text-[#4f46a5] font-semibold hover:bg-[#ebe9f8] transition-colors flex items-center gap-2"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f8e3d5] text-[#c66b4b]">
                  <Plus size={14} />
                </span>
                Create a new thread
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewThreadModal && (
        <NewThreadModal
          key={pendingCapture}
          initialTitle={pendingCapture}
          onClose={() => {
            setShowNewThreadModal(false);
            setPendingCapture('');
          }}
          onCreate={async (title, folder, subfolder, tags) => {
            const capturedTitle = pendingCapture.trim();
            const threadTitle = title.trim() || capturedTitle;
            if (!threadTitle) return;
            const thread = await createThread(threadTitle, folder, subfolder, tags);
            await addEntry(thread.id, 'log', capturedTitle || threadTitle);
            setInput('');
            setPendingCapture('');
            setShowNewThreadModal(false);
            navigate(`/thread/${thread.id}`);
          }}
        />
      )}
    </>
  );
}
