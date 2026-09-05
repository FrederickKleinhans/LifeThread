import { useMemo } from 'react';
import { useThreadStore } from '../stores/threadStore';
import { ThreadListItem } from '../components/ThreadListItem';
import { monthYear } from '../utils/dateFormat';
import { Archive } from 'lucide-react';

export function ArchiveView() {
  const threads = useThreadStore((s) => s.threads);
  const entries = useThreadStore((s) => s.entries);

  const archivedThreads = useMemo(() => {
    return threads
      .filter((t) => {
        if (t.archived_at || t.abandoned_at) return true;
        // Also include threads whose status is DONE
        const threadEntries = entries
          .filter((e) => e.thread_id === t.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return threadEntries.length > 0 && threadEntries[0].type === 'completed';
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [threads, entries]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof archivedThreads> = {};
    for (const thread of archivedThreads) {
      const month = monthYear(thread.updated_at);
      if (!groups[month]) groups[month] = [];
      groups[month].push(thread);
    }
    return groups;
  }, [archivedThreads]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c66b4b] mb-2">A look back</p>
        <h2 className="text-3xl font-bold text-[#27231f]">Archive</h2>
        <p className="text-sm text-[#766e64] mt-2">Finished chapters and things you’ve set aside.</p>
      </div>

      {archivedThreads.length === 0 ? (
        <div className="text-center py-16">
          <Archive size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-[#4b443c]">Nothing tucked away yet</h3>
          <p className="text-sm text-[#8d8378] mt-1">
            Finished threads will appear here when you’re ready to set them aside.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {month}
              </h3>
              <div className="space-y-2">
                {items.map((thread) => (
                  <ThreadListItem key={thread.id} thread={thread} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
