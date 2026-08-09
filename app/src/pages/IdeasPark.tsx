import { useMemo } from 'react';
import { useThreadStore } from '../stores/threadStore';
import { ThreadListItem } from '../components/ThreadListItem';
import { Lightbulb } from 'lucide-react';

export function IdeasPark() {
  const threads = useThreadStore((s) => s.threads);

  const ideas = useMemo(() => {
    return threads
      .filter((t) => t.folder === 'Ideas' && !t.archived_at && !t.abandoned_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [threads]);

  return (
    <div className="space-y-6 bg-amber-50/30 -m-4 md:-m-6 p-4 md:p-6 rounded-xl min-h-full">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ideas Park</h2>
        <p className="text-sm text-gray-500 mt-1">
          A low-pressure space for not-yet-tasks. No deadlines, no urgency.
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No ideas yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Create a thread with the "Ideas" folder to park something here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((thread) => (
            <ThreadListItem key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
