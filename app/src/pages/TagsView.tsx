import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThreadStore } from '../stores/threadStore';
import { TagPill } from '../components/TagPill';
import { Check, Pencil, Tag, X } from 'lucide-react';

export function TagsView() {
  const threads = useThreadStore((s) => s.threads);
  const tags = useThreadStore((s) => s.tags);
  const renameTag = useThreadStore((s) => s.renameTag);
  const navigate = useNavigate();
  const [renamingTag, setRenamingTag] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const thread of threads) {
      for (const tag of thread.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [threads]);
  const tagColors = useMemo(() => new Map(tags.map((tag) => [tag.name, tag.color])), [tags]);

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
            <div key={tag} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 hover:border-indigo-200 hover:shadow-sm">
              <button
                type="button"
                onClick={() => navigate(`/threads?tag=${encodeURIComponent(tag)}`)}
                className="flex items-center gap-2"
              >
                <TagPill name={tag} color={tagColors.get(tag)} />
                <span className="text-xs text-gray-400">{count} threads</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRenamingTag(tag);
                  setRenameValue(tag);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                aria-label={`Rename tag ${tag}`}
              >
                <Pencil size={13} />
              </button>
              {renamingTag === tag && (
                <form
                  className="flex w-full items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void renameTag(tag, renameValue).then(() => setRenamingTag(''));
                  }}
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    maxLength={40}
                    aria-label={`New name for ${tag}`}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                  />
                  <button type="submit" className="rounded-md p-1 text-green-700 hover:bg-green-50" aria-label="Save tag name">
                    <Check size={15} />
                  </button>
                  <button type="button" onClick={() => setRenamingTag('')} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Cancel tag rename">
                    <X size={15} />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
