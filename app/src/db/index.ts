import Dexie, { type Table } from 'dexie';
import type { Thread, Entry, Tag } from '../types';

type MutationPayload =
  | { kind: 'insertThread'; value: Thread }
  | { kind: 'updateThread'; value: { id: string; updates: Partial<Thread> } }
  | { kind: 'insertEntry'; value: Entry }
  | { kind: 'updateEntry'; value: { id: string; updates: Pick<Entry, 'type' | 'body'> & Partial<Pick<Entry, 'updated_at'>> } }
  | { kind: 'insertTag'; value: Tag }
  | { kind: 'updateTag'; value: { id: string; updates: Pick<Tag, 'name' | 'created_at'> } }
  | { kind: 'deleteTag'; value: { id: string } }
  | {
      kind: 'updateProfile';
      value: {
        display_name?: string | null;
        push_subscription?: { endpoint: string; expirationTime?: number | null; keys: { p256dh: string; auth: string } } | null;
        notification_preferences?: { enabled: boolean; threadCheckIns: boolean; streakMilestones: boolean; gentlePrompts: boolean };
        last_app_open_at?: string;
        timezone?: string;
      };
    };

type WithMutationMetadata<T> = T extends MutationPayload ? T & {
  id?: number;
  attempts?: number;
  lastAttemptAt?: number;
  lastError?: string;
} : never;

type WithFailureMetadata<T> = T extends MutationPayload ? T & {
  id?: number;
  attempts: number;
  failedAt: number;
  failureReason: string;
} : never;

export type Mutation = WithMutationMetadata<MutationPayload>;
export type FailedMutation = WithFailureMetadata<MutationPayload>;

export type MutationInput = MutationPayload;

export interface SyncMeta {
  key: string;
  value: string;
}

class LifeThreadDB extends Dexie {
  threads!: Table<Thread, string>;
  entries!: Table<Entry, string>;
  tags!: Table<Tag, string>;
  mutations!: Table<Mutation, number>;
  failedMutations!: Table<FailedMutation, number>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('LifeThreadDB');
    this.version(3).stores({
      threads: 'id, title, folder, subfolder, created_at, updated_at',
      entries: 'id, thread_id, type, created_at, updated_at',
      tags: 'id, &name, created_at',
      mutations: '++id, kind',
    });
    this.version(4).stores({
      threads: 'id, title, folder, subfolder, created_at, updated_at',
      entries: 'id, thread_id, type, created_at, updated_at',
      tags: 'id, &name, created_at',
      mutations: '++id, kind, attempts, lastAttemptAt',
      failedMutations: '++id, kind, failedAt',
      syncMeta: '&key',
    });
    this.version(2).stores({
      threads: 'id, title, folder, subfolder, created_at, updated_at',
      entries: 'id, thread_id, type, created_at, updated_at',
      tags: 'id, &name, created_at',
    });
    this.version(1).stores({
      threads: 'id, title, folder, subfolder, *tags, created_at, updated_at, archived_at, abandoned_at',
      entries: 'id, thread_id, type, created_at, updated_at',
      tags: 'id, &name, created_at',
    });
  }
}

export const db = new LifeThreadDB();
