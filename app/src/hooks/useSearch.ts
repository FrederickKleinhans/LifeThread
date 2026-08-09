import { useMemo, useState } from 'react';
import { useThreadStore } from '../stores/threadStore';
import type { Thread, Entry } from '../types';

export interface SearchResult {
  thread: Thread;
  matchingEntries: Entry[];
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const threads = useThreadStore((s) => s.threads);
  const entries = useThreadStore((s) => s.entries);
  const tags = useThreadStore((s) => s.tags);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const matchedThreadIds = new Set<string>();
    const threadResults: SearchResult[] = [];

    // Search thread titles
    for (const thread of threads) {
      if (thread.title.toLowerCase().includes(q)) {
        matchedThreadIds.add(thread.id);
      }
    }

    // Search tags
    const matchingTagNames = tags
      .filter((t) => t.name.toLowerCase().includes(q))
      .map((t) => t.name);

    for (const thread of threads) {
      if (thread.tags.some((tag) => matchingTagNames.includes(tag))) {
        matchedThreadIds.add(thread.id);
      }
    }

    // Search entry bodies
    const entryMatches = new Map<string, Entry[]>();
    for (const entry of entries) {
      if (entry.body.toLowerCase().includes(q)) {
        matchedThreadIds.add(entry.thread_id);
        const existing = entryMatches.get(entry.thread_id) || [];
        existing.push(entry);
        entryMatches.set(entry.thread_id, existing);
      }
    }

    // Build results
    for (const threadId of matchedThreadIds) {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) continue;
      threadResults.push({
        thread,
        matchingEntries: entryMatches.get(threadId) || [],
      });
    }

    return threadResults.sort(
      (a, b) => new Date(b.thread.updated_at).getTime() - new Date(a.thread.updated_at).getTime()
    );
  }, [query, threads, entries, tags]);

  return { query, setQuery, results };
}
