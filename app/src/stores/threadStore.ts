import { create } from 'zustand';
import { db } from '../db';
import type { Thread, Entry, Tag, Folder, EntryType } from '../types';

interface ThreadStore {
  threads: Thread[];
  entries: Entry[];
  tags: Tag[];
  loading: boolean;

  // Initialization
  loadAll: () => Promise<void>;

  // Thread CRUD
  createThread: (title: string, folder: Folder, subfolder?: string, tags?: string[]) => Promise<Thread>;
  updateThread: (id: string, updates: Partial<Thread>) => Promise<void>;
  archiveThread: (id: string) => Promise<void>;
  abandonThread: (id: string) => Promise<void>;
  reviveThread: (id: string) => Promise<void>;

  // Entry CRUD
  addEntry: (threadId: string, type: EntryType, body: string, attachmentUrl?: string) => Promise<Entry>;

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

  loadAll: async () => {
    const [threads, entries, tags] = await Promise.all([
      db.threads.toArray(),
      db.entries.toArray(),
      db.tags.toArray(),
    ]);
    set({ threads, entries, tags, loading: false });
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
    await db.threads.add(thread);
    set({ threads: [...get().threads, thread] });
    return thread;
  },

  updateThread: async (id, updates) => {
    const now = new Date().toISOString();
    const updatedFields = { ...updates, updated_at: now };
    await db.threads.update(id, updatedFields);
    set({
      threads: get().threads.map((t) =>
        t.id === id ? { ...t, ...updatedFields } : t
      ),
    });
  },

  archiveThread: async (id) => {
    const now = new Date().toISOString();
    await db.threads.update(id, { archived_at: now, updated_at: now });
    set({
      threads: get().threads.map((t) =>
        t.id === id ? { ...t, archived_at: now, updated_at: now } : t
      ),
    });
  },

  abandonThread: async (id) => {
    const now = new Date().toISOString();
    await db.threads.update(id, { abandoned_at: now, updated_at: now });
    set({
      threads: get().threads.map((t) =>
        t.id === id ? { ...t, abandoned_at: now, updated_at: now } : t
      ),
    });
  },

  reviveThread: async (id) => {
    const now = new Date().toISOString();
    await db.threads.update(id, { archived_at: null, abandoned_at: null, updated_at: now });
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

  createTag: async (name) => {
    const existing = get().tags;
    const colorIndex = existing.length % TAG_COLORS.length;
    const tag: Tag = {
      id: generateId(),
      name: name.toLowerCase().trim(),
      color: TAG_COLORS[colorIndex],
      created_at: new Date().toISOString(),
    };
    await db.tags.add(tag);
    set({ tags: [...existing, tag] });
    return tag;
  },

  deleteTag: async (id) => {
    await db.tags.delete(id);
    set({ tags: get().tags.filter((t) => t.id !== id) });
  },
}));
