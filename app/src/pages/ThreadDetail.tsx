import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useThreadStore } from '../stores/threadStore';
import { inferStatus, isDormant } from '../utils/statusInference';
import { StatusBadge } from '../components/StatusBadge';
import { TagPill } from '../components/TagPill';
import { EntryTypeSelector, getEntryTypeColor } from '../components/EntryTypeSelector';
import { relativeTime } from '../utils/dateFormat';
import type { EntryType } from '../types';
import { Archive, Trash2, RotateCcw, Pencil, Check, Plus, ArrowLeft } from 'lucide-react';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const thread = useThreadStore((s) => s.threads.find((t) => t.id === id));
  const allEntries = useThreadStore((s) => s.entries);
  const entries = useMemo(
    () =>
      allEntries
        .filter((e) => e.thread_id === id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [allEntries, id]
  );
  const { updateThread, archiveThread, abandonThread, reviveThread, addEntry } = useThreadStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [newEntryBody, setNewEntryBody] = useState('');
  const [newEntryType, setNewEntryType] = useState<EntryType>('log');
  const [tagInput, setTagInput] = useState('');

  const { status, dormant } = useMemo(() => {
    if (!thread) return { status: 'INBOX' as const, dormant: false };
    return { status: inferStatus(thread, entries), dormant: isDormant(thread, entries) };
  }, [thread, entries]);

  if (!thread) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Thread not found</p>
        <button onClick={() => navigate('/')} className="mt-2 text-indigo-600 text-sm hover:underline">
          Back to feed
        </button>
      </div>
    );
  }

  const handleTitleSave = () => {
    if (titleInput.trim()) {
      updateThread(thread.id, { title: titleInput.trim() });
    }
    setEditingTitle(false);
  };

  const handleAddEntry = async () => {
    if (!newEntryBody.trim()) return;
    await addEntry(thread.id, newEntryType, newEntryBody.trim());
    setNewEntryBody('');
    setNewEntryType('log');
  };

  const handleAddTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (tag && !thread.tags.includes(tag)) {
      updateThread(thread.id, { tags: [...thread.tags, tag] });
      setTagInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="text-xl font-bold border-b-2 border-indigo-300 outline-none bg-transparent"
                  autoFocus
                />
                <button onClick={handleTitleSave} className="text-indigo-600 hover:text-indigo-800">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{thread.title}</h1>
                <button
                  onClick={() => {
                    setTitleInput(thread.title);
                    setEditingTitle(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Edit title"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={status} dormant={dormant} />
              <span className="text-sm text-gray-400">
                {thread.folder}{thread.subfolder ? ` > ${thread.subfolder}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {thread.tags.map((tag) => (
                <TagPill
                  key={tag}
                  name={tag}
                  removable
                  onRemove={() =>
                    updateThread(thread.id, { tags: thread.tags.filter((t) => t !== tag) })
                  }
                />
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="+ tag"
                  className="w-20 text-xs border-b border-gray-200 outline-none focus:border-indigo-300 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {thread.archived_at || thread.abandoned_at ? (
              <button
                onClick={() => reviveThread(thread.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <RotateCcw size={14} />
                Revive
              </button>
            ) : (
              <>
                <button
                  onClick={() => archiveThread(thread.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Archive size={14} />
                  Archive
                </button>
                <button
                  onClick={() => abandonThread(thread.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={14} />
                  Abandon
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Entry form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <EntryTypeSelector value={newEntryType} onChange={setNewEntryType} />
          <div className="flex-1">
            <textarea
              value={newEntryBody}
              onChange={(e) => setNewEntryBody(e.target.value)}
              placeholder="Add an entry..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
              rows={2}
            />
          </div>
          <button
            onClick={handleAddEntry}
            disabled={!newEntryBody.trim()}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Timeline</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No entries yet. Add one above.</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="relative flex gap-4 pl-8">
                  <div
                    className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: getEntryTypeColor(entry.type) }}
                  />
                  <div className="flex-1 bg-white rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: getEntryTypeColor(entry.type) }}
                      >
                        {entry.type}
                      </span>
                      <span className="text-xs text-gray-400">{relativeTime(entry.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
