import type { Entry } from '../types';
import { relativeTime } from '../utils/dateFormat';
import { getEntryTypeColor } from './EntryTypeSelector';

interface EntryCardProps {
  entry: Entry;
  threadTitle?: string;
  onThreadClick?: () => void;
  showThread?: boolean;
}

export function EntryCard({ entry, threadTitle, onThreadClick, showThread = true }: EntryCardProps) {
  const color = getEntryTypeColor(entry.type);

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors animate-fade-in">
      <div className="flex-shrink-0 mt-0.5">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {entry.type}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {showThread && threadTitle && (
          <button
            onClick={onThreadClick}
            className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate block"
          >
            {threadTitle}
          </button>
        )}
        <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap break-words">
          {entry.body}
        </p>
        <span className="text-xs text-gray-400 mt-1 block">
          {relativeTime(entry.created_at)}
        </span>
      </div>
    </div>
  );
}
