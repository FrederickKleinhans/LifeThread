import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db';
import type { Tag, Thread } from '../types';

const remote = vi.hoisted(() => ({
  deleteRemoteTag: vi.fn(),
  insertRemoteEntry: vi.fn(),
  insertRemoteTag: vi.fn(),
  insertRemoteThread: vi.fn(),
  loadRemoteData: vi.fn(),
  updateRemoteEntry: vi.fn(),
  updateRemoteTag: vi.fn(),
  updateRemoteThread: vi.fn(),
}));

vi.mock('../lib/remoteRepository', () => ({
  deleteRemoteTag: remote.deleteRemoteTag,
  getCurrentUserId: vi.fn(),
  insertRemoteEntry: remote.insertRemoteEntry,
  insertRemoteTag: remote.insertRemoteTag,
  insertRemoteThread: remote.insertRemoteThread,
  loadRemoteChangesSince: vi.fn(),
  loadRemoteData: remote.loadRemoteData,
  updateRemoteEntry: remote.updateRemoteEntry,
  updateRemoteTag: remote.updateRemoteTag,
  updateRemoteThread: remote.updateRemoteThread,
}));

import { useThreadStore } from './threadStore';
import { pendingMutationCount } from '../lib/mutationQueue';

const thread: Thread = {
  id: 'thread-a',
  title: 'A thread',
  folder: 'Life',
  tags: ['focus'],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  archived_at: null,
  abandoned_at: null,
};

const tag: Tag = {
  id: 'tag-focus',
  name: 'focus',
  color: '#6366F1',
  created_at: '2026-01-01T00:00:00.000Z',
};

async function flushBackgroundWrites() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('thread store local-first behavior', () => {
  beforeEach(async () => {
    await Promise.all([
      db.threads.clear(),
      db.entries.clear(),
      db.tags.clear(),
      db.mutations.clear(),
      db.failedMutations.clear(),
    ]);
    useThreadStore.setState({ threads: [], entries: [], tags: [], loading: false, syncError: null });
    remote.deleteRemoteTag.mockResolvedValue(undefined);
    remote.insertRemoteEntry.mockResolvedValue(undefined);
    remote.insertRemoteTag.mockResolvedValue(undefined);
    remote.insertRemoteThread.mockResolvedValue(undefined);
    remote.updateRemoteEntry.mockResolvedValue(undefined);
    remote.updateRemoteTag.mockResolvedValue(undefined);
    remote.updateRemoteThread.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await Promise.all([
      db.threads.clear(),
      db.entries.clear(),
      db.tags.clear(),
      db.mutations.clear(),
      db.failedMutations.clear(),
    ]);
    useThreadStore.setState({ threads: [], entries: [], tags: [], loading: false, syncError: null });
    vi.clearAllMocks();
  });

  it('keeps a created thread locally and queues transient remote failures', async () => {
    remote.insertRemoteThread.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const created = await useThreadStore.getState().createThread('Offline thread', 'Life');
    await flushBackgroundWrites();

    expect(useThreadStore.getState().threads).toContainEqual(created);
    expect(await db.threads.get(created.id)).toEqual(created);
    expect(await pendingMutationCount()).toBe(1);
  });

  it('ensures metadata rows when tags are added', async () => {
    const ensured = await useThreadStore.getState().ensureTag('Focus');

    expect(ensured.name).toBe('focus');
    expect(ensured.color).toBeTruthy();
    expect(await db.tags.get(ensured.id)).toEqual(ensured);
    expect(useThreadStore.getState().tags).toContainEqual(ensured);
  });

  it('removes deleted tags from all thread memberships', async () => {
    await db.tags.put(tag);
    await db.threads.put(thread);
    useThreadStore.setState({ tags: [tag], threads: [thread] });

    await useThreadStore.getState().deleteTag(tag.id);

    expect(useThreadStore.getState().tags).toEqual([]);
    expect(useThreadStore.getState().threads[0].tags).toEqual([]);
    expect(await db.threads.get(thread.id)).toMatchObject({ tags: [] });
  });

  it('renames tag metadata and all thread memberships', async () => {
    await db.tags.put(tag);
    await db.threads.put(thread);
    useThreadStore.setState({ tags: [tag], threads: [thread] });

    await useThreadStore.getState().renameTag('focus', 'work');

    expect(useThreadStore.getState().tags[0]).toMatchObject({ id: tag.id, name: 'work' });
    expect(useThreadStore.getState().threads[0].tags).toEqual(['work']);
    expect(await db.threads.get(thread.id)).toMatchObject({ tags: ['work'] });
  });
});
