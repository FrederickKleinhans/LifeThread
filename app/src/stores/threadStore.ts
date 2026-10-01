import { create } from 'zustand';
import { db, type MutationInput } from '../db';
import type { Thread, Entry, Tag, Folder, EntryType } from '../types';
import {
  deleteRemoteTag,
  insertRemoteEntry,
  insertRemoteTag,
  insertRemoteThread,
  getCurrentUserId,
  loadRemoteChangesSince,
  loadRemoteData,
  updateRemoteEntry,
  updateRemoteTag,
  updateRemoteThread,
} from '../lib/remoteRepository';
import { enqueueMutation, replayMutations } from '../lib/mutationQueue';
import { isRetryableMutationError, getMutationErrorMessage } from '../lib/mutationErrors';
import { useNotifications } from './notifications';
import { invalidateFullStatsCache } from '../utils/gamification';

interface ThreadStore {
  threads: Thread[];
  entries: Entry[];
  tags: Tag[];
  loading: boolean;
  syncError: string | null;

  loadAll: () => Promise<void>;
  clearSyncError: () => void;
  createThread: (title: string, folder: Folder, subfolder?: string, tags?: string[]) => Promise<Thread>;
  updateThread: (id: string, updates: Partial<Thread>) => Promise<void>;
  archiveThread: (id: string) => Promise<void>;
  abandonThread: (id: string) => Promise<void>;
  reviveThread: (id: string) => Promise<void>;
  addEntry: (threadId: string, type: EntryType, body: string, attachmentUrl?: string) => Promise<Entry>;
  updateEntry: (id: string, updates: Pick<Entry, 'type' | 'body'>) => Promise<void>;
  createTag: (name: string) => Promise<Tag>;
  ensureTag: (name: string) => Promise<Tag>;
  renameTag: (oldName: string, newName: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

const TAG_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
];

function generateId(): string {
  return crypto.randomUUID();
}

function makeTag(name: string, currentTags: Tag[]): Tag {
  return {
    id: generateId(),
    name: name.toLowerCase().trim(),
    color: TAG_COLORS[currentTags.length % TAG_COLORS.length],
    created_at: new Date().toISOString(),
  };
}

function syncInBackground(
  mutation: MutationInput,
  remoteWrite: () => Promise<void>,
  rollback: () => Promise<void>,
  description: string,
): Promise<'synced' | 'queued' | 'rejected'> {
  return remoteWrite().then(() => 'synced' as const).catch(async (error: unknown) => {
    if (isRetryableMutationError(error)) {
      try {
        await enqueueMutation(mutation);
        useNotifications.getState().success('Saved locally', `${description} will sync when the connection is available.`, 5000);
        return 'queued' as const;
      } catch (queueError) {
        useNotifications.getState().error('Could not save change', getMutationErrorMessage(queueError), 0);
        return 'rejected' as const;
      }
    }

    try {
      await rollback();
      useNotifications.getState().error('Change was rejected', getMutationErrorMessage(error), 0);
    } catch (rollbackError) {
      useNotifications.getState().error('Could not restore local change', getMutationErrorMessage(rollbackError), 0);
    }
    return 'rejected' as const;
  });
}

function updateInState<T extends { id: string }>(items: T[], id: string, updates: Partial<T>): T[] {
  return items.map((item) => item.id === id ? { ...item, ...updates } : item);
}

let activeLoad: Promise<void> | null = null;
const threadInsertSyncs = new Map<string, Promise<'synced' | 'queued' | 'rejected'>>();

export const useThreadStore = create<ThreadStore>((set, get) => ({
  threads: [],
  entries: [],
  tags: [],
  loading: true,
  syncError: null,
  clearSyncError: () => set({ syncError: null }),

  loadAll: () => {
    if (activeLoad) return activeLoad;
    activeLoad = (async () => {
      try {
      await replayMutations();
      const userId = await getCurrentUserId();
      const [storedUser, storedWatermark] = await Promise.all([
        db.syncMeta.get('userId'),
        db.syncMeta.get('lastSyncedAt'),
      ]);
      let remoteData;
      let usedFullFetch = !storedWatermark || storedUser?.value !== userId;
      if (!usedFullFetch && storedWatermark) {
        try {
          remoteData = await loadRemoteChangesSince(storedWatermark.value);
        } catch {
          remoteData = await loadRemoteData();
          usedFullFetch = true;
        }
      } else {
        remoteData = await loadRemoteData();
      }

      if (!Array.isArray(remoteData.threads) || !Array.isArray(remoteData.entries) || !Array.isArray(remoteData.tags)) {
        throw new Error('The server returned an invalid journal response.');
      }

      if (storedUser && storedUser.value !== userId) {
        const [oldThreadIds, oldEntryIds, oldTagIds] = await Promise.all([
          db.threads.toCollection().primaryKeys(),
          db.entries.toCollection().primaryKeys(),
          db.tags.toCollection().primaryKeys(),
        ]);
        await Promise.all([
          db.threads.bulkDelete(oldThreadIds),
          db.entries.bulkDelete(oldEntryIds),
          db.tags.bulkDelete(oldTagIds),
        ]);
      }
      await db.transaction('rw', db.threads, db.entries, db.tags, db.syncMeta, async () => {
        await db.threads.bulkPut(remoteData.threads);
        await db.entries.bulkPut(remoteData.entries);
        await db.tags.bulkPut(remoteData.tags);
        await db.syncMeta.put({ key: 'userId', value: userId });
        await db.syncMeta.put({ key: 'lastSyncedAt', value: new Date().toISOString() });
      });

      const [syncedThreads, syncedEntries, syncedTags] = await Promise.all([
        db.threads.toArray(), db.entries.toArray(), db.tags.toArray(),
      ]);
      set({ threads: syncedThreads, entries: syncedEntries, tags: syncedTags, loading: false, syncError: null });

      const backfillKey = `lifethread-tag-backfill-v1:${userId}`;
      const names = new Set(get().threads.flatMap((thread) => thread.tags));
      for (const name of names) {
        if (!get().tags.some((tag) => tag.name === name)) await get().ensureTag(name);
      }
      if (window.localStorage.getItem(backfillKey) !== 'complete') window.localStorage.setItem(backfillKey, 'complete');

      const [threads, entries, tags] = await Promise.all([
        db.threads.toArray(), db.entries.toArray(), db.tags.toArray(),
      ]);
      invalidateFullStatsCache();
      set({ threads, entries, tags, loading: false, syncError: null });
      } catch (error) {
        const [threads, entries, tags] = await Promise.all([
          db.threads.toArray(), db.entries.toArray(), db.tags.toArray(),
        ]);
        if (!threads.length && !entries.length && !tags.length) throw error;
        const message = getMutationErrorMessage(error);
        set({ threads, entries, tags, loading: false, syncError: message });
        useNotifications.getState().error('Sync issue', message, 5000);
      }
    })().finally(() => {
      activeLoad = null;
    });
    return activeLoad;
  },

  createThread: async (title, folder, subfolder, tagNames = []) => {
    const normalizedTags = [...new Set(tagNames.map((name) => name.toLowerCase().trim()).filter(Boolean))];
    for (const name of normalizedTags) await get().ensureTag(name);
    const now = new Date().toISOString();
    const thread: Thread = {
      id: generateId(),
      title,
      folder,
      subfolder: subfolder || '',
      tags: normalizedTags,
      created_at: now,
      updated_at: now,
      archived_at: null,
      abandoned_at: null,
    };
    await db.threads.add(thread);
    set({ threads: [...get().threads, thread] });
    const insertSync = syncInBackground(
      { kind: 'insertThread', value: thread },
      () => insertRemoteThread(thread),
      async () => {
        await db.threads.delete(thread.id);
        set({ threads: get().threads.filter((item) => item.id !== thread.id) });
      },
      'This thread',
    );
    threadInsertSyncs.set(thread.id, insertSync);
    void insertSync.then(() => {
      if (threadInsertSyncs.get(thread.id) === insertSync) threadInsertSyncs.delete(thread.id);
    });
    useNotifications.getState().success('Thread alive', `You’ve made room for ${title}.`, 3000);
    return thread;
  },

  updateThread: async (id, updates) => {
    if (updates.tags) {
      for (const name of updates.tags) await get().ensureTag(name);
    }
    const previous = get().threads.find((thread) => thread.id === id);
    if (!previous) return;
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };
    const next = { ...previous, ...updatedFields };
    await db.threads.put(next);
    set({ threads: updateInState(get().threads, id, updatedFields) });
    syncInBackground(
      { kind: 'updateThread', value: { id, updates: updatedFields } },
      () => updateRemoteThread(id, updatedFields),
      async () => {
        const current = get().threads.find((thread) => thread.id === id);
        if (current?.updated_at !== updatedFields.updated_at) return;
        await db.threads.put(previous);
        set({ threads: updateInState(get().threads, id, previous) });
      },
      'This thread update',
    );
  },

  archiveThread: async (id) => get().updateThread(id, { archived_at: new Date().toISOString() }),
  abandonThread: async (id) => get().updateThread(id, { abandoned_at: new Date().toISOString() }),
  reviveThread: async (id) => get().updateThread(id, { archived_at: null, abandoned_at: null }),

  addEntry: async (threadId, type, body, attachmentUrl) => {
    const now = new Date().toISOString();
    const previousThread = get().threads.find((thread) => thread.id === threadId);
    const entry: Entry = {
      id: generateId(),
      thread_id: threadId,
      type,
      body,
      attachment_url: attachmentUrl || null,
      created_at: now,
      updated_at: now,
    };
    await db.transaction('rw', db.entries, db.threads, async () => {
      await db.entries.add(entry);
      await db.threads.update(threadId, { updated_at: now });
    });
    set({
      entries: [...get().entries, entry],
      threads: get().threads.map((thread) => thread.id === threadId ? { ...thread, updated_at: now } : thread),
    });
    syncInBackground(
      { kind: 'insertEntry', value: entry },
      async () => {
        const parentSync = threadInsertSyncs.get(threadId);
        if (parentSync) {
          const result = await parentSync;
          if (result !== 'synced') throw new TypeError('The parent thread is still waiting to sync.');
        } else {
          const pendingParent = await db.mutations
            .where('kind').equals('insertThread')
            .filter((mutation) => mutation.kind === 'insertThread' && mutation.value.id === threadId)
            .first();
          if (pendingParent) throw new TypeError('The parent thread is still waiting to sync.');
        }
        await insertRemoteEntry(entry);
      },
      async () => {
        await db.entries.delete(entry.id);
        const currentThread = get().threads.find((thread) => thread.id === threadId);
        if (previousThread && currentThread?.updated_at === now) await db.threads.put(previousThread);
        invalidateFullStatsCache();
        set({
          entries: get().entries.filter((item) => item.id !== entry.id),
          threads: previousThread && currentThread?.updated_at === now
            ? updateInState(get().threads, threadId, previousThread)
            : get().threads,
        });
      },
      'This entry',
    );
    syncInBackground(
      { kind: 'updateThread', value: { id: threadId, updates: { updated_at: now } } },
      () => updateRemoteThread(threadId, { updated_at: now }),
      async () => {
        if (previousThread) {
          if (get().threads.find((thread) => thread.id === threadId)?.updated_at !== now) return;
          await db.threads.put(previousThread);
          set({ threads: updateInState(get().threads, threadId, previousThread) });
        }
      },
      'The thread activity timestamp',
    );
    useNotifications.getState().success('Worth threading', body.slice(0, 36) + (body.length > 36 ? '…' : ''), 2500);
    return entry;
  },

  updateEntry: async (id, updates) => {
    const previous = get().entries.find((entry) => entry.id === id);
    if (!previous) return;
    const previousThread = get().threads.find((thread) => thread.id === previous.thread_id);
    const updated_at = new Date().toISOString();
    const nextFields = { ...updates, updated_at };
    await db.transaction('rw', db.entries, db.threads, async () => {
      await db.entries.update(id, nextFields);
      await db.threads.update(previous.thread_id, { updated_at });
    });
    invalidateFullStatsCache();
    set({
      entries: updateInState(get().entries, id, nextFields),
      threads: get().threads.map((thread) => thread.id === previous.thread_id ? { ...thread, updated_at } : thread),
    });
    syncInBackground(
      { kind: 'updateEntry', value: { id, updates: nextFields } },
      () => updateRemoteEntry(id, nextFields),
      async () => {
        const current = get().entries.find((entry) => entry.id === id);
        if (current?.updated_at !== updated_at) return;
        await db.entries.put(previous);
        if (previousThread) await db.threads.put(previousThread);
        invalidateFullStatsCache();
        set({
          entries: updateInState(get().entries, id, previous),
          threads: previousThread ? updateInState(get().threads, previousThread.id, previousThread) : get().threads,
        });
      },
      'This entry update',
    );
    syncInBackground(
      { kind: 'updateThread', value: { id: previous.thread_id, updates: { updated_at } } },
      () => updateRemoteThread(previous.thread_id, { updated_at }),
      async () => {
        if (!previousThread) return;
        if (get().threads.find((thread) => thread.id === previousThread.id)?.updated_at !== updated_at) return;
        await db.threads.put(previousThread);
        set({ threads: updateInState(get().threads, previousThread.id, previousThread) });
      },
      'The thread activity timestamp',
    );
  },

  ensureTag: async (name) => {
    const normalizedName = name.toLowerCase().trim();
    const existing = get().tags.find((tag) => tag.name === normalizedName);
    if (existing) return existing;
    const tag = makeTag(normalizedName, get().tags);
    await db.tags.put(tag);
    set({ tags: [...get().tags, tag] });
    syncInBackground(
      { kind: 'insertTag', value: tag },
      () => insertRemoteTag(tag),
      async () => {
        await db.tags.delete(tag.id);
        set({ tags: get().tags.filter((item) => item.id !== tag.id) });
      },
      `Tag #${normalizedName}`,
    );
    return tag;
  },

  createTag: async (name) => get().ensureTag(name),

  renameTag: async (oldName, newName) => {
    const from = oldName.toLowerCase().trim();
    const to = newName.toLowerCase().trim();
    if (!to || from === to) return;
    const tag = get().tags.find((item) => item.name === from);
    if (!tag) return;
    if (get().tags.some((item) => item.name === to)) {
      useNotifications.getState().error('Tag name already exists', `#${to} is already in your tag list.`, 4000);
      return;
    }
    const nextTag = { ...tag, name: to, created_at: new Date().toISOString() };
    const affected = get().threads.filter((thread) => thread.tags.includes(from));
    const nextThreads = affected.map((thread) => ({
      ...thread,
      tags: [...new Set(thread.tags.map((name) => name === from ? to : name))],
      updated_at: new Date().toISOString(),
    }));
    await db.transaction('rw', db.tags, db.threads, async () => {
      await db.tags.delete(tag.id);
      await db.tags.put(nextTag);
      await db.threads.bulkPut(nextThreads);
    });
    set({
      tags: get().tags.map((item) => item.id === tag.id ? nextTag : item),
      threads: get().threads.map((thread) => nextThreads.find((next) => next.id === thread.id) ?? thread),
    });
    syncInBackground(
      { kind: 'updateTag', value: { id: tag.id, updates: { name: to, created_at: nextTag.created_at } } },
      () => updateRemoteTag(tag.id, { name: to, created_at: nextTag.created_at }),
      async () => {
        await db.transaction('rw', db.tags, db.threads, async () => {
          await db.tags.put(tag);
          await db.threads.bulkPut(affected);
        });
        set({
          tags: get().tags.map((item) => item.id === tag.id ? tag : item),
          threads: get().threads.map((thread) => affected.find((previousThread) => previousThread.id === thread.id) ?? thread),
        });
      },
      `Tag #${from}`,
    );
    for (const thread of nextThreads) {
      const previousThread = affected.find((item) => item.id === thread.id);
      if (!previousThread) continue;
      syncInBackground(
        { kind: 'updateThread', value: { id: thread.id, updates: { tags: thread.tags, updated_at: thread.updated_at } } },
        () => updateRemoteThread(thread.id, { tags: thread.tags, updated_at: thread.updated_at }),
        async () => {
          await db.threads.put(previousThread);
          set({ threads: updateInState(get().threads, previousThread.id, previousThread) });
        },
        `Tags on ${thread.title}`,
      );
    }
  },

  deleteTag: async (id) => {
    const tag = get().tags.find((item) => item.id === id);
    if (!tag) return;
    const affected = get().threads.filter((thread) => thread.tags.includes(tag.name));
    const updated = affected.map((thread) => ({
      ...thread,
      tags: thread.tags.filter((name) => name !== tag.name),
      updated_at: new Date().toISOString(),
    }));
    await db.transaction('rw', db.tags, db.threads, async () => {
      await db.tags.delete(id);
      await db.threads.bulkPut(updated);
    });
    set({
      tags: get().tags.filter((item) => item.id !== id),
      threads: get().threads.map((thread) => updated.find((next) => next.id === thread.id) ?? thread),
    });
    syncInBackground(
      { kind: 'deleteTag', value: { id } },
      () => deleteRemoteTag(id),
      async () => {
        await db.transaction('rw', db.tags, db.threads, async () => {
          await db.tags.put(tag);
          await db.threads.bulkPut(affected);
        });
        set({
          tags: [...get().tags, tag],
          threads: get().threads.map((thread) => affected.find((previousThread) => previousThread.id === thread.id) ?? thread),
        });
      },
      `Tag #${tag.name}`,
    );
    for (const thread of updated) {
      const previousThread = affected.find((item) => item.id === thread.id);
      if (!previousThread) continue;
      syncInBackground(
        { kind: 'updateThread', value: { id: thread.id, updates: { tags: thread.tags, updated_at: thread.updated_at } } },
        () => updateRemoteThread(thread.id, { tags: thread.tags, updated_at: thread.updated_at }),
        async () => {
          await db.threads.put(previousThread);
          set({ threads: updateInState(get().threads, previousThread.id, previousThread) });
        },
        `Tag removal from ${thread.title}`,
      );
    }
  },
}));
