import type { ThreadStatus } from '../types';

const STATUS_STYLES: Record<ThreadStatus, { bg: string; text: string }> = {
  INBOX: { bg: 'bg-gray-100', text: 'text-gray-600' },
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  WAITING: { bg: 'bg-amber-50', text: 'text-amber-700' },
  BLOCKED: { bg: 'bg-rose-50', text: 'text-rose-700' },
  DONE: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  ARCHIVED: { bg: 'bg-gray-100', text: 'text-gray-500' },
  ABANDONED: { bg: 'bg-gray-100', text: 'text-gray-400' },
};

interface StatusBadgeProps {
  status: ThreadStatus;
  dormant?: boolean;
}

export function StatusBadge({ status, dormant }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {status}
      </span>
      {dormant && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
          DORMANT
        </span>
      )}
    </span>
  );
}
