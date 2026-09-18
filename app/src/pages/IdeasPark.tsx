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
    <div className="canvas-bg -m-4 min-h-screen space-y-6 p-4 sm:-m-5 sm:p-5 md:-m-6 md:p-6">
      <div>
        <p className="eyebrow mb-2">Let it wander</p>
        <h2 className="text-4xl font-bold text-[var(--plum)]">Ideas Park</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--ink-muted)]">
          A playful space for thoughts before they become plans.
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-[#4b443c]">Give an idea somewhere to land</h3>
          <p className="text-sm text-[#8d8378] mt-1">
            Create a thread with the “Ideas” folder and let it take shape.
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
