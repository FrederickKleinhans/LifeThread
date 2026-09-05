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
      className="w-full text-left p-4 rounded-2xl bg-[#fbf9f6] border border-[#e6ded2] hover:border-[#c9bbae] hover:shadow-[0_8px_24px_rgba(92,74,54,0.07)] transition-all group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={status} dormant={dormant} />
            <h3 className="text-sm font-semibold text-[#4b443c] truncate group-hover:text-[#4f46a5] transition-colors">
              {thread.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {thread.tags.map((tag) => (
              <TagPill key={tag} name={tag} />
            ))}
            <span className="text-xs text-[#9a9186]">
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </span>
            <span className="text-xs text-[#9a9186]">
              Updated {relativeTime(thread.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
