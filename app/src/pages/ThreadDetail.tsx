/* eslint-disable react-hooks/refs */
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useThreadStore } from '../stores/threadStore';
import { inferStatus, isDormant } from '../utils/statusInference';
import { StatusBadge } from '../components/StatusBadge';
import { TagPill } from '../components/TagPill';
import { EntryTypeSelector } from '../components/EntryTypeSelector';
import { getEntryTypeColor } from '../components/entryTypes';
import { relativeTime } from '../utils/dateFormat';
import type { EntryType } from '../types';
import { Archive, Trash2, RotateCcw, Pencil, Check, Plus, ArrowLeft, X } from 'lucide-react';

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
  const { updateThread, archiveThread, abandonThread, reviveThread, addEntry, updateEntry } = useThreadStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [newEntryBody, setNewEntryBody] = useState('');
  const [newEntryType, setNewEntryType] = useState<EntryType>('log');
  const [tagInput, setTagInput] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryBody, setEditingEntryBody] = useState('');
  const [editingEntryType, setEditingEntryType] = useState<EntryType>('log');

  const { status, dormant } = useMemo(() => {
    if (!thread) return { status: 'INBOX' as const, dormant: false };
    return { status: inferStatus(thread, entries), dormant: isDormant(thread, entries) };
  }, [thread, entries]);
  const timelineIds = useRef<Set<string> | null>(null);
  const newEntryIds = timelineIds.current
    ? new Set(entries.filter((entry) => !timelineIds.current?.has(entry.id)).map((entry) => entry.id))
    : new Set<string>();
  useEffect(() => {
    timelineIds.current = new Set(entries.map((entry) => entry.id));
  }, [entries]);

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

  const startEditingEntry = (entryId: string, body: string, type: EntryType) => {
    setEditingEntryId(entryId);
    setEditingEntryBody(body);
    setEditingEntryType(type);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntryId || !editingEntryBody.trim()) return;
    await updateEntry(editingEntryId, {
      body: editingEntryBody.trim(),
      type: editingEntryType,
    });
    setEditingEntryId(null);
    setEditingEntryBody('');
  };

  const handleAddTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (tag && !thread.tags.includes(tag)) {
      updateThread(thread.id, { tags: [...thread.tags, tag] });
      setTagInput('');
    }
  };

  return (
    <div className="space-y-7">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-[#766e64] hover:text-[#4f46a5] transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="relative overflow-hidden bg-[#302b68] text-white rounded-[2rem] border border-[#4a4387] p-5 sm:p-7 shadow-[0_18px_45px_rgba(48,43,104,0.18)]">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#f0a36d]/60 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[#796fe0]/40 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="text-xl font-bold border-b-2 border-[#f0a36d] outline-none bg-transparent text-white"
                  autoFocus
                />
                <button onClick={handleTitleSave} className="text-indigo-600 hover:text-indigo-800">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{thread.title}</h1>
                <button
                  onClick={() => {
                    setTitleInput(thread.title);
                    setEditingTitle(true);
                  }}
                  className="text-white/50 hover:text-white"
                  aria-label="Edit title"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={status} dormant={dormant} />
              <span className="text-sm text-white/65">
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
                  placeholder="+ add tag"
                  className="w-24 text-xs border-b border-white/30 outline-none focus:border-[#f0a36d] bg-transparent text-white placeholder-white/50"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {thread.archived_at || thread.abandoned_at ? (
              <button
                onClick={() => reviveThread(thread.id)}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-[#e3f3e9] text-[#26734b] rounded-xl hover:bg-[#d1eadb] transition-colors"
              >
                <RotateCcw size={14} />
                Revive
              </button>
            ) : (
              <>
                <button
                  onClick={() => archiveThread(thread.id)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-white/15 text-white rounded-xl hover:bg-white/25 transition-colors"
                >
                  <Archive size={14} />
                  Archive
                </button>
                <button
                  onClick={() => abandonThread(thread.id)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-[#fbe2df] text-[#a54842] rounded-xl hover:bg-[#f5d0cc] transition-colors"
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
      <div className="bg-[#fbf9f6] rounded-[1.5rem] border border-[#e6ded2] p-4 shadow-[0_8px_24px_rgba(92,74,54,0.06)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c66b4b]">Add to the thread</p>
            <p className="mt-1 text-xs text-[#9a9186]">Capture what happened, what changed, or what comes next.</p>
          </div>
          <span className="hidden rounded-full bg-[#ebe9f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#4f46a5] sm:inline-flex">New entry</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-stretch">
          <EntryTypeSelector value={newEntryType} onChange={setNewEntryType} />
          <div className="min-w-0 flex-1">
            <textarea
              value={newEntryBody}
              onChange={(e) => setNewEntryBody(e.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void handleAddEntry();
                }
              }}
              placeholder="Write a quick update..."
              className="h-full min-h-20 w-full border border-[#d8cdbf] bg-white rounded-xl px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d9d5f3] focus:border-[#8f89ca]"
              rows={2}
            />
          </div>
          <button
            onClick={handleAddEntry}
            disabled={!newEntryBody.trim()}
            className="flex min-h-12 w-full items-center justify-center gap-1 rounded-xl bg-[#4f46a5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#40388f] disabled:bg-[#eee7dc] disabled:text-[#9a9186] sm:w-auto"
          >
            <Plus size={14} />
            Add update
          </button>
        </div>
        <p className="mt-2 hidden text-[11px] text-[#9a9186] sm:block">Tip: press Ctrl/⌘ + Enter to add</p>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c66b4b] mb-3">Timeline</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-[#8d8378] text-center py-8 rounded-2xl border border-dashed border-[#d8cdbf]">No entries yet. Add a moment above.</p>
        ) : (
          <div className="relative">
            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5 }} style={{ transformOrigin: 'top' }} className="absolute left-4 top-0 bottom-0 w-px bg-[#d8cdbf]" />
            <div className="space-y-3">
              {entries.map((entry, index) => {
                const isBlocked = entry.type === 'blocker' && status === 'BLOCKED';
                const isMilestone = entry.type === 'milestone';
                return (
                <motion.div key={entry.id} layout initial={(timelineIds.current === null || newEntryIds.has(entry.id)) ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: newEntryIds.has(entry.id) ? 0 : index * 0.06, ease: 'easeOut' }} className={`relative flex gap-4 pl-8 ${isMilestone ? 'motion-milestone' : ''}`}>
                  <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-white ${isBlocked ? 'blocker-indicator' : ''}`} style={{ backgroundColor: getEntryTypeColor(entry.type) }} />
                  <div className="flex-1 bg-[#fbf9f6] rounded-2xl border border-[#e6ded2] p-4 shadow-[0_6px_18px_rgba(92,74,54,0.05)]">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: getEntryTypeColor(entry.type) }}
                      >
                        {entry.type === 'completed' && <CheckmarkDraw />}
                        {entry.type}
                      </span>
                      <span className="text-xs text-[#9a9186]">{relativeTime(entry.created_at)}</span>
                      <button
                       onClick={() => startEditingEntry(entry.id, entry.body, entry.type)}
                       className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#766e64] hover:bg-[#eee7dc] hover:text-[#4f46a5] transition-colors"
                       aria-label={`Edit ${entry.type} entry`}
                      >
                       <Pencil size={12} />
                       Edit
                      </button>
                    </div>
                    {editingEntryId === entry.id ? (
                      <div className="mt-3 space-y-2">
                       <EntryTypeSelector value={editingEntryType} onChange={setEditingEntryType} />
                       <textarea
                         value={editingEntryBody}
                         onChange={(event) => setEditingEntryBody(event.target.value)}
                         className="w-full border border-[#d8cdbf] bg-white rounded-xl px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d9d5f3] focus:border-[#8f89ca]"
                         rows={3}
                         autoFocus
                       />
                       <div className="flex justify-end gap-2">
                         <button
                           onClick={() => setEditingEntryId(null)}
                           className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-[#766e64] hover:bg-[#eee7dc]"
                         >
                           <X size={13} />
                           Cancel
                         </button>
                         <button
                           onClick={() => void handleUpdateEntry()}
                           disabled={!editingEntryBody.trim()}
                           className="inline-flex items-center gap-1 rounded-xl bg-[#4f46a5] px-3 py-2 text-xs font-semibold text-white hover:bg-[#40388f] disabled:bg-[#eee7dc] disabled:text-[#9a9186]"
                         >
                           <Check size={13} />
                           Save update
                         </button>
                       </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-[#5f574e] whitespace-pre-wrap">{entry.body}</p>
                    )}
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckmarkDraw() {
  return (
    <svg className="mr-0.5 inline-block h-3 w-3" viewBox="0 0 12 12" aria-hidden="true">
      <path className="checkmark-draw" d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
