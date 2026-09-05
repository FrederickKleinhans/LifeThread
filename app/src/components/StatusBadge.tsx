import type { ThreadStatus } from '../types';

const STATUS_STYLES: Record<ThreadStatus, { bg: string; text: string }> = {
  INBOX: { bg: 'bg-[#eee7dc]', text: 'text-[#766e64]' },
  ACTIVE: { bg: 'bg-[#e3f3e9]', text: 'text-[#26734b]' },
  WAITING: { bg: 'bg-[#fff0d8]', text: 'text-[#9a641e]' },
  BLOCKED: { bg: 'bg-[#fbe2df]', text: 'text-[#a54842]' },
  DONE: { bg: 'bg-[#dff3f2]', text: 'text-[#267b79]' },
  ARCHIVED: { bg: 'bg-[#eee7dc]', text: 'text-[#766e64]' },
  ABANDONED: { bg: 'bg-[#eee7dc]', text: 'text-[#9a9186]' },
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
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${style.bg} ${style.text}`}
      >
        {status}
      </span>
      {dormant && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#fff0d8] text-[#b56b1f]">
          DORMANT
        </span>
      )}
    </span>
  );
}
