import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Thread } from '../types';
import { useStatus } from '../hooks/useStatus';
import { useThreadStore } from '../stores/threadStore';
import { StatusBadge } from './StatusBadge';
import { TagPill } from './TagPill';
import { relativeTime } from '../utils/dateFormat';

interface ThreadListItemProps {
  thread: Thread;
}

export function ThreadListItem({ thread }: ThreadListItemProps) {
  const navigate = useNavigate();
  const { status, dormant } = useStatus(thread);
  const allEntries = useThreadStore((s) => s.entries);
  const entryCount = useMemo(
    () => allEntries.filter((e) => e.thread_id === thread.id).length,
    [allEntries, thread.id]
  );

  return (
    <button
      onClick={() => navigate(`/thread/${thread.id}`)}
      className="w-full text-left p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={status} dormant={dormant} />
            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {thread.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {thread.tags.map((tag) => (
              <TagPill key={tag} name={tag} />
            ))}
            <span className="text-xs text-gray-400">
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </span>
            <span className="text-xs text-gray-400">
              Updated {relativeTime(thread.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
