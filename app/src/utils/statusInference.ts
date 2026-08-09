import type { Thread, Entry, ThreadStatus } from '../types';
import { differenceInDays } from 'date-fns';

export function inferStatus(thread: Thread, entries: Entry[]): ThreadStatus {
  if (thread.archived_at) return 'ARCHIVED';
  if (thread.abandoned_at) return 'ABANDONED';

  if (entries.length === 0) return 'INBOX';

  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest = sorted[0];

  switch (latest.type) {
    case 'completed':
      return 'DONE';
    case 'blocker':
      return 'BLOCKED';
    case 'waiting':
      return 'WAITING';
    default:
      return 'ACTIVE';
  }
}

export function isDormant(thread: Thread, entries: Entry[]): boolean {
  if (entries.length === 0) return false;
  const status = inferStatus(thread, entries);
  if (status !== 'ACTIVE') return false;

  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return differenceInDays(new Date(), new Date(sorted[0].created_at)) > 14;
}

export function detectEntryType(body: string): string | null {
  const lower = body.toLowerCase();
  if (lower.includes('waiting')) return 'waiting';
  if (lower.includes('blocked') || lower.includes('blocker')) return 'blocker';
  if (lower.includes('done') || lower.includes('completed') || lower.includes('finished')) return 'completed';
  if (lower.includes('decided') || lower.includes('decision')) return 'decision';
  return null;
}
