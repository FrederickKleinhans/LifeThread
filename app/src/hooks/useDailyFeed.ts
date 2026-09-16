import { useMemo } from 'react';
import { isToday } from 'date-fns';
import { useThreadStore } from '../stores/threadStore';
import type { Entry, Thread } from '../types';

export interface FeedItem {
  entry: Entry;
  thread: Thread;
}

function isActiveThread(thread: Thread): boolean {
  return !thread.archived_at && !thread.abandoned_at && thread.folder !== 'Archive';
}

export function useDailyFeed(): FeedItem[] {
  const entries = useThreadStore((s) => s.entries);
  const threads = useThreadStore((s) => s.threads);

  return useMemo(() => {
    const activeThreads = threads.filter(isActiveThread);
    const todayEntries = entries.filter((e) => isToday(new Date(e.created_at)));
    const sorted = [...todayEntries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sorted
      .map((entry) => {
        const thread = activeThreads.find((t) => t.id === entry.thread_id);
        if (!thread) return null;
        return { entry, thread };
      })
      .filter(Boolean) as FeedItem[];
  }, [entries, threads]);
}

export function useAllFeed(): FeedItem[] {
  const entries = useThreadStore((s) => s.entries);
  const threads = useThreadStore((s) => s.threads);

  return useMemo(() => {
    const activeThreads = threads.filter(isActiveThread);
    const sorted = [...entries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sorted
      .map((entry) => {
        const thread = activeThreads.find((t) => t.id === entry.thread_id);
        if (!thread) return null;
        return { entry, thread };
      })
      .filter(Boolean) as FeedItem[];
  }, [entries, threads]);
}
