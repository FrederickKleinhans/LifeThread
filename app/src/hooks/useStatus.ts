import { useMemo } from 'react';
import type { Thread, ThreadStatus } from '../types';
import { inferStatus, isDormant } from '../utils/statusInference';
import { useThreadStore } from '../stores/threadStore';

export function useStatus(thread: Thread): { status: ThreadStatus; dormant: boolean } {
  const allEntries = useThreadStore((s) => s.entries);

  return useMemo(() => {
    const threadEntries = allEntries.filter((e) => e.thread_id === thread.id);
    const status = inferStatus(thread, threadEntries);
    const dormant = isDormant(thread, threadEntries);
    return { status, dormant };
  }, [thread, allEntries]);
}

export function useThreadStatus(threadId: string): { status: ThreadStatus; dormant: boolean } {
  const thread = useThreadStore((s) => s.threads.find((t) => t.id === threadId));
  const allEntries = useThreadStore((s) => s.entries);

  return useMemo(() => {
    if (!thread) return { status: 'INBOX' as ThreadStatus, dormant: false };
    const threadEntries = allEntries.filter((e) => e.thread_id === threadId);
    const status = inferStatus(thread, threadEntries);
    const dormant = isDormant(thread, threadEntries);
    return { status, dormant };
  }, [thread, allEntries, threadId]);
}
