import type { ThreadStatus } from '../types';

const STATUS_STYLES: Record<ThreadStatus, { bg: string; text: string }> = {
  INBOX: { bg: 'bg-white', text: 'text-[var(--plum)]' },
  ACTIVE: { bg: 'bg-[var(--mint)]', text: 'text-[var(--plum)]' },
  WAITING: { bg: 'bg-[var(--butter)]', text: 'text-[var(--plum)]' },
  BLOCKED: { bg: 'bg-[var(--coral)]', text: 'text-white' },
  DONE: { bg: 'bg-[var(--mint)]', text: 'text-[var(--plum)]' },
  ARCHIVED: { bg: 'bg-white', text: 'text-[var(--plum)]' },
  ABANDONED: { bg: 'bg-white', text: 'text-[var(--ink-muted)]' },
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
        className={`inline-flex items-center gap-1 rounded-full border-2 border-[var(--border)] px-2.5 py-1 text-[10px] font-bold tracking-wide ${style.bg} ${style.text}`}
      >
        {status}
      </span>
      {dormant && (
        <span className="inline-flex items-center rounded-full border-2 border-[var(--border)] bg-[var(--butter)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[var(--plum)]">
          DORMANT
        </span>
      )}
    </span>
  );
}
