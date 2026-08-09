import Dexie, { type Table } from 'dexie';
import type { Thread, Entry, Tag } from '../types';

class LifeThreadDB extends Dexie {
  threads!: Table<Thread, string>;
  entries!: Table<Entry, string>;
  tags!: Table<Tag, string>;

  constructor() {
    super('LifeThreadDB');
    this.version(2).stores({
      threads: 'id, title, folder, subfolder, created_at, updated_at',
      entries: 'id, thread_id, type, created_at',
      tags: 'id, &name, created_at',
    });
    this.version(1).stores({
      threads: 'id, title, folder, subfolder, *tags, created_at, updated_at, archived_at, abandoned_at',
      entries: 'id, thread_id, type, created_at',
      tags: 'id, &name, created_at',
    });
  }
}

export const db = new LifeThreadDB();
