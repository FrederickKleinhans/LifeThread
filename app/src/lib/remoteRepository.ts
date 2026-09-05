import { supabase } from './supabase';
import type { Entry, Tag, Thread } from '../types';
export interface Profile { id: string; display_name: string | null; }

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in to access your journal.');
  return data.user.id;
}

export async function loadRemoteData(): Promise<{
  threads: Thread[];
  entries: Entry[];
  tags: Tag[];
}> {
  const userId = await getUserId();
  const [threadsResult, entriesResult, tagsResult] = await Promise.all([
    supabase.from('threads').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    supabase.from('entries').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('tags').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ]);

  if (threadsResult.error) throw threadsResult.error;
  if (entriesResult.error) throw entriesResult.error;
  if (tagsResult.error) throw tagsResult.error;

  return {
    threads: threadsResult.data.map((row) => {
      const thread = { ...row };
      delete thread.user_id;
      return thread as Thread;
    }),
    entries: entriesResult.data.map((row) => {
      const entry = { ...row };
      delete entry.user_id;
      return entry as Entry;
    }),
    tags: tagsResult.data.map((row) => {
      const tag = { ...row };
      delete tag.user_id;
      return tag as Tag;
    }),
  };
}

export async function loadProfile(): Promise<Profile> {
  const userId = await getUserId();
  const { data, error } = await supabase.from('profiles').select('id, display_name').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(updates: Pick<Profile, 'display_name'>): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function updateRemoteProfile(updates: Pick<Profile, 'display_name'>): Promise<void> {
  return updateProfile(updates);
}

export async function insertRemoteThread(thread: Thread): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('threads').insert({ ...thread, user_id });
  if (error) throw error;
}

export async function updateRemoteThread(id: string, updates: Partial<Thread>): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('threads').update(updates).eq('id', id).eq('user_id', user_id);
  if (error) throw error;
}

export async function insertRemoteEntry(entry: Entry): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('entries').insert({ ...entry, user_id });
  if (error) throw error;
}

export async function updateRemoteEntry(id: string, updates: Pick<Entry, 'type' | 'body'>): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('entries').update(updates).eq('id', id).eq('user_id', user_id);
  if (error) throw error;
}

export async function insertRemoteTag(tag: Tag): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('tags').insert({ ...tag, user_id });
  if (error) throw error;
}

export async function deleteRemoteTag(id: string): Promise<void> {
  const user_id = await getUserId();
  const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', user_id);
  if (error) throw error;
}
