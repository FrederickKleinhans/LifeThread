import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreadStore } from '../stores/threadStore';
import { TagPill } from '../components/TagPill';
import { Tag } from 'lucide-react';

export function TagsView() {
  const threads = useThreadStore((s) => s.threads);
  const navigate = useNavigate();

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const thread of threads) {
      for (const tag of thread.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [threads]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c66b4b] mb-2">Your threads, in color</p>
        <h2 className="text-3xl font-bold text-[#27231f]">Tags</h2>
        <p className="text-sm text-[#766e64] mt-2">Follow the themes that keep showing up.</p>
      </div>

      {tagCounts.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No tags yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Tags are added when you create or edit threads.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tagCounts.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => navigate(`/threads?tag=${encodeURIComponent(tag)}`)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-lg hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <TagPill name={tag} />
              <span className="text-xs text-gray-400">{count} threads</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
