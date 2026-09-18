import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import type { Entry, Thread } from '../types';
import { relativeTime } from '../utils/dateFormat';
import { getEntryTypeColor } from './entryTypes';

interface EntryCardProps {
  entry: Entry;
  threadTitle?: string;
  thread?: Thread;
  onThreadClick?: () => void;
  onThreadTitleUpdate?: (title: string) => Promise<void>;
  showThread?: boolean;
}

export function EntryCard({
  entry,
  threadTitle,
  thread,
  onThreadClick,
  onThreadTitleUpdate,
  showThread = true,
}: EntryCardProps) {
  const color = getEntryTypeColor(entry.type);
  const quietType = entry.type === 'log' || entry.type === 'note' || entry.type === 'attachment';
  const [editingThread, setEditingThread] = useState(false);
  const [titleInput, setTitleInput] = useState(threadTitle || '');
  const [savingTitle, setSavingTitle] = useState(false);

  const handleSaveTitle = async () => {
    const title = titleInput.trim();
    if (!title || !onThreadTitleUpdate || savingTitle) return;
    setSavingTitle(true);
    await onThreadTitleUpdate(title);
    setSavingTitle(false);
    setEditingThread(false);
  };

  return (
    <div className="surface-card physical relative flex gap-3 bg-white p-4 animate-fade-in">
      <div className="flex-shrink-0 mt-0.5">
        <span
          className="entry-badge uppercase tracking-wide"
          style={{ backgroundColor: color, color: quietType || entry.type === 'waiting' || entry.type === 'milestone' ? 'var(--plum)' : 'var(--white)' }}
        >
          {entry.type}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {showThread && threadTitle && (
          editingThread ? (
            <div className="flex items-center gap-1.5">
              <input
                value={titleInput}
                onChange={(event) => setTitleInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleSaveTitle();
                  if (event.key === 'Escape') setEditingThread(false);
                }}
                className="min-w-0 flex-1 rounded-lg border border-[#b9aec2] bg-white px-2 py-1 text-sm font-semibold text-[#4b443c] outline-none focus:ring-2 focus:ring-[#d9d5f3]"
                aria-label="Edit thread title"
                autoFocus
              />
              <button
                onClick={() => void handleSaveTitle()}
                disabled={!titleInput.trim() || savingTitle}
                className="rounded-lg p-1 text-[#4f46a5] hover:bg-[#ebe9f8] disabled:text-[#c9c0b5]"
                aria-label="Save thread title"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => {
                  setTitleInput(threadTitle);
                  setEditingThread(false);
                }}
                className="rounded-lg p-1 text-[#9a9186] hover:bg-[#eee7dc]"
                aria-label="Cancel thread title edit"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onThreadClick}
                className="min-w-0 truncate text-left text-sm font-semibold text-[#4b443c] hover:text-[#4f46a5] transition-colors"
              >
                {threadTitle}
              </button>
              {thread && onThreadTitleUpdate && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setTitleInput(thread.title);
                    setEditingThread(true);
                  }}
                  className="flex-shrink-0 rounded-lg p-1 text-[#b0a69a] opacity-0 transition-all hover:bg-[#ebe9f8] hover:text-[#4f46a5] group-hover:opacity-100 focus:opacity-100"
                  aria-label={`Edit thread ${thread.title}`}
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )
        )}
        <p className="text-sm leading-6 text-[#5f574e] mt-1 whitespace-pre-wrap break-words">
          {entry.body}
        </p>
        <span className="text-xs text-[#9a9186] mt-2 block">
          {relativeTime(entry.created_at)}
        </span>
      </div>
    </div>
  );
}
