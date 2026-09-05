import Dexie, { type Table } from 'dexie';
import type { Thread, Entry, Tag } from '../types';

export type Mutation =
  | { id?: number; kind: 'insertThread'; value: Thread }
  | { id?: number; kind: 'updateThread'; value: { id: string; updates: Partial<Thread> } }
  | { id?: number; kind: 'insertEntry'; value: Entry }
  | { id?: number; kind: 'updateEntry'; value: { id: string; updates: Pick<Entry, 'type' | 'body'> } }
  | { id?: number; kind: 'insertTag'; value: Tag }
  | { id?: number; kind: 'deleteTag'; value: { id: string } }
  | { id?: number; kind: 'updateProfile'; value: { display_name: string | null } };

export type MutationInput = {
  [K in Mutation['kind']]: Omit<Extract<Mutation, { kind: K }>, 'id'>
}[Mutation['kind']];

class LifeThreadDB extends Dexie {
  threads!: Table<Thread, string>;
  entries!: Table<Entry, string>;
  tags!: Table<Tag, string>;
  mutations!: Table<Mutation, number>;

  constructor() {
    super('LifeThreadDB');
    this.version(3).stores({
      threads: 'id, title, folder, subfolder, created_at, updated_at',
      entries: 'id, thread_id, type, created_at',
      tags: 'id, &name, created_at',
      mutations: '++id, kind',
    });
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
