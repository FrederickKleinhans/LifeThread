import { supabase } from './supabase';
import type { Entry, Tag, Thread } from '../types';
export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface Profile {
  id: string;
  display_name: string | null;
  push_subscription: PushSubscriptionData | null;
  notification_preferences: {
    enabled: boolean;
    threadCheckIns: boolean;
    streakMilestones: boolean;
    gentlePrompts: boolean;
  };
  last_app_open_at: string | null;
  timezone: string | null;
}

export type ProfileUpdates = Partial<Omit<Profile, 'id'>>;

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in to access your journal.');
  return data.user.id;
}

export async function getCurrentUserId(): Promise<string> {
  return getUserId();
}

interface RemoteData {
  threads: Thread[];
  entries: Entry[];
  tags: Tag[];
}

const REMOTE_PAGE_SIZE = 500;

async function fetchAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += REMOTE_PAGE_SIZE) {
    const { data, error } = await fetchPage(offset, offset + REMOTE_PAGE_SIZE - 1);
    if (error) throw error;
    if (!data) throw new Error('The server returned an empty page response.');
    rows.push(...data);
    if (data.length < REMOTE_PAGE_SIZE) return rows;
  }
}

function mapRemoteData(
  threadsData: (Thread & { user_id: string })[],
  entriesData: (Entry & { user_id: string })[],
  tagsData: (Tag & { user_id: string })[],
): RemoteData {
  return {
    threads: threadsData.map((row) => {
      const { id, title, folder, subfolder, tags, created_at, updated_at, archived_at, abandoned_at } = row;
      return { id, title, folder, subfolder, tags, created_at, updated_at, archived_at, abandoned_at };
    }),
    entries: entriesData.map((row) => {
      const { id, thread_id, type, body, attachment_url, created_at, updated_at } = row;
      return { id, thread_id, type, body, attachment_url, created_at, updated_at };
    }),
    tags: tagsData.map((row) => {
      const { id, name, color, created_at } = row;
      return { id, name, color, created_at };
    }),
  };
}

export async function loadRemoteData(): Promise<RemoteData> {
  const userId = await getUserId();
  const [threadsResult, entriesResult, tagsResult] = await Promise.all([
    fetchAllPages((from, to) => supabase.from('threads').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).order('id').range(from, to)),
    fetchAllPages((from, to) => supabase.from('entries').select('*').eq('user_id', userId).order('created_at', { ascending: true }).order('id').range(from, to)),
    fetchAllPages((from, to) => supabase.from('tags').select('*').eq('user_id', userId).order('created_at', { ascending: true }).order('id').range(from, to)),
  ]);

  return mapRemoteData(threadsResult, entriesResult, tagsResult);
}

export async function loadRemoteChangesSince(since: string): Promise<RemoteData> {
  const userId = await getUserId();
  const [threadsResult, entriesResult, tagsResult] = await Promise.all([
    fetchAllPages((from, to) => supabase.from('threads').select('*').eq('user_id', userId).gt('updated_at', since).order('updated_at', { ascending: false }).order('id').range(from, to)),
    fetchAllPages((from, to) => supabase.from('entries').select('*').eq('user_id', userId).gt('updated_at', since).order('updated_at', { ascending: true }).order('id').range(from, to)),
    fetchAllPages((from, to) => supabase.from('tags').select('*').eq('user_id', userId).gt('created_at', since).order('created_at', { ascending: true }).order('id').range(from, to)),
  ]);

  return mapRemoteData(threadsResult, entriesResult, tagsResult);
}

export async function loadProfile(): Promise<Profile> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(updates: ProfileUpdates): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function updateRemoteProfile(updates: ProfileUpdates): Promise<void> {
  return updateProfile(updates);
}

export async function markRemoteNotificationOpened(id: string): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('notification_history')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user_id);
  if (error) throw error;
}

export async function insertRemoteThread(thread: Thread): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('threads').upsert({ ...thread, user_id }, { onConflict: 'id' });
  if (error) throw error;
}

export async function updateRemoteThread(id: string, updates: Partial<Thread>): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('threads').update(updates).eq('id', id).eq('user_id', user_id);
  if (error) throw error;
}

export async function insertRemoteEntry(entry: Entry): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('entries').upsert({ ...entry, user_id }, { onConflict: 'id' });
  if (error) throw error;
}

export async function updateRemoteEntry(id: string, updates: Pick<Entry, 'type' | 'body'> & Partial<Pick<Entry, 'updated_at'>>): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('entries').update(updates).eq('id', id).eq('user_id', user_id);
  if (error) throw error;
}

export async function insertRemoteTag(tag: Tag): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('tags').upsert({ ...tag, user_id }, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteRemoteTag(id: string): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', user_id);
  if (error) throw error;
}

export async function updateRemoteTag(id: string, updates: Pick<Tag, 'name' | 'created_at'>): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('tags').update(updates).eq('id', id).eq('user_id', user_id);
  if (error) throw error;
}
