import { create } from 'zustand';
import { db } from '../db';
import type { Thread, Entry, Tag, Folder, EntryType } from '../types';
import {
  deleteRemoteTag,
  insertRemoteEntry,
  insertRemoteTag,
  insertRemoteThread,
  loadRemoteData,
  updateRemoteEntry,
  updateRemoteThread,
} from '../lib/remoteRepository';
import { enqueueMutation, replayMutations } from '../lib/mutationQueue';

interface ThreadStore {
  threads: Thread[];
  entries: Entry[];
  tags: Tag[];
  loading: boolean;
  syncError: string | null;

  // Initialization
  loadAll: () => Promise<void>;
  clearSyncError: () => void;

  // Thread CRUD
  createThread: (title: string, folder: Folder, subfolder?: string, tags?: string[]) => Promise<Thread>;
  updateThread: (id: string, updates: Partial<Thread>) => Promise<void>;
  archiveThread: (id: string) => Promise<void>;
  abandonThread: (id: string) => Promise<void>;
  reviveThread: (id: string) => Promise<void>;

  // Entry CRUD
  addEntry: (threadId: string, type: EntryType, body: string, attachmentUrl?: string) => Promise<Entry>;
  updateEntry: (id: string, updates: Pick<Entry, 'type' | 'body'>) => Promise<void>;

  // Tag CRUD
  createTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

const TAG_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
];

function generateId(): string {
  return crypto.randomUUID();
}

export const useThreadStore = create<ThreadStore>((set, get) => ({
  threads: [],
  entries: [],
  tags: [],
  loading: true,
  syncError: null,
  clearSyncError: () => set({ syncError: null }),

  loadAll: async () => {
    try {
      await replayMutations();
      const { threads, entries, tags } = await loadRemoteData();
      await Promise.all([
        db.threads.clear().then(() => db.threads.bulkAdd(threads)),
        db.entries.clear().then(() => db.entries.bulkAdd(entries)),
        db.tags.clear().then(() => db.tags.bulkAdd(tags)),
      ]);
      set({ threads, entries, tags, loading: false, syncError: null });
    } catch (error) {
      const [threads, entries, tags] = await Promise.all([
        db.threads.toArray(), db.entries.toArray(), db.tags.toArray(),
      ]);
      if (!threads.length && !entries.length && !tags.length) throw error;
      set({
        threads, entries, tags, loading: false,
        syncError: error instanceof Error ? error.message : 'Unable to synchronise changes.',
      });
    }
  },

  createThread: async (title, folder, subfolder, tagNames) => {
    const now = new Date().toISOString();
    const thread: Thread = {
      id: generateId(),
      title,
      folder,
      subfolder: subfolder || '',
      tags: tagNames || [],
      created_at: now,
      updated_at: now,
      archived_at: null,
      abandoned_at: null,
    };
    try { await insertRemoteThread(thread); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'insertThread', value: thread }); else throw error;
    }
    await db.threads.add(thread);
    set({ threads: [...get().threads, thread] });
    return thread;
  },

  updateThread: async (id, updates) => {
    const now = new Date().toISOString();
    const updatedFields = { ...updates, updated_at: now };
    try { await updateRemoteThread(id, updatedFields); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'updateThread', value: { id, updates: updatedFields } }); else throw error;
    }
    await db.threads.update(id, updatedFields);
    set({
      threads: get().threads.map((t) =>
        t.id === id ? { ...t, ...updatedFields } : t
      ),
    });
  },

  archiveThread: async (id) => {
    const now = new Date().toISOString();
    const updates = { archived_at: now, updated_at: now };
    try { await updateRemoteThread(id, updates); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'updateThread', value: { id, updates } }); else throw error;
    }
    await db.threads.update(id, updates);
    set({
      threads: get().threads.map((t) =>
        t.id === id ? { ...t, archived_at: now, updated_at: now } : t
      ),
    });
  },

  abandonThread: async (id) => {
    const now = new Date().toISOString();
    const updates = { abandoned_at: now, updated_at: now };
    try { await updateRemoteThread(id, updates); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'updateThread', value: { id, updates } }); else throw error;
    }
    await db.threads.update(id, updates);
    set({
      threads: get().threads.map((t) =>
        t.id === id ? { ...t, abandoned_at: now, updated_at: now } : t
      ),
    });
  },

  reviveThread: async (id) => {
    const now = new Date().toISOString();
    const updates = { archived_at: null, abandoned_at: null, updated_at: now };
    try { await updateRemoteThread(id, updates); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'updateThread', value: { id, updates } }); else throw error;
    }
    await db.threads.update(id, updates);
    set({
      threads: get().threads.map((t) =>
        t.id === id ? { ...t, archived_at: null, abandoned_at: null, updated_at: now } : t
      ),
    });
  },

  addEntry: async (threadId, type, body, attachmentUrl) => {
    const now = new Date().toISOString();
    const entry: Entry = {
      id: generateId(),
      thread_id: threadId,
      type,
      body,
      attachment_url: attachmentUrl || null,
      created_at: now,
    };
    try { await insertRemoteEntry(entry); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'insertEntry', value: entry }); else throw error;
    }
    try { await updateRemoteThread(threadId, { updated_at: now }); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'updateThread', value: { id: threadId, updates: { updated_at: now } } }); else throw error;
    }
    await db.entries.add(entry);
    await db.threads.update(threadId, { updated_at: now });
    set({
      entries: [...get().entries, entry],
      threads: get().threads.map((t) =>
        t.id === threadId ? { ...t, updated_at: now } : t
      ),
    });
    return entry;
  },

  updateEntry: async (id, updates) => {
    const entry = get().entries.find((candidate) => candidate.id === id);
    if (!entry) return;
    const now = new Date().toISOString();
    try { await updateRemoteEntry(id, updates); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'updateEntry', value: { id, updates } }); else throw error;
    }
    try { await updateRemoteThread(entry.thread_id, { updated_at: now }); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'updateThread', value: { id: entry.thread_id, updates: { updated_at: now } } }); else throw error;
    }
    await db.entries.update(id, updates);
    await db.threads.update(entry.thread_id, { updated_at: now });
    set({
      entries: get().entries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
      threads: get().threads.map((thread) =>
        thread.id === entry.thread_id ? { ...thread, updated_at: now } : thread
      ),
    });
  },

  createTag: async (name) => {
    const existing = get().tags;
    const colorIndex = existing.length % TAG_COLORS.length;
    const tag: Tag = {
      id: generateId(),
      name: name.toLowerCase().trim(),
      color: TAG_COLORS[colorIndex],
      created_at: new Date().toISOString(),
    };
    try { await insertRemoteTag(tag); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'insertTag', value: tag }); else throw error;
    }
    await db.tags.add(tag);
    set({ tags: [...existing, tag] });
    return tag;
  },

  deleteTag: async (id) => {
    try { await deleteRemoteTag(id); } catch (error) {
      if (!navigator.onLine) await enqueueMutation({ kind: 'deleteTag', value: { id } }); else throw error;
    }
    await db.tags.delete(id);
    set({ tags: get().tags.filter((t) => t.id !== id) });
  },
}));
