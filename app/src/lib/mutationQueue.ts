import { db, type MutationInput } from '../db';
import {
  deleteRemoteTag,
  insertRemoteEntry,
  insertRemoteTag,
  insertRemoteThread,
  updateRemoteEntry,
  updateRemoteThread,
  updateRemoteProfile,
} from './remoteRepository';

export async function enqueueMutation(mutation: MutationInput) {
  await db.mutations.add(mutation);
}

export async function pendingMutationCount() {
  return db.mutations.count();
}

export async function replayMutations(): Promise<void> {
  const mutations = await db.mutations.orderBy('id').toArray();
  for (const mutation of mutations) {
    switch (mutation.kind) {
      case 'insertThread': await insertRemoteThread(mutation.value); break;
      case 'updateThread': await updateRemoteThread(mutation.value.id, mutation.value.updates); break;
      case 'insertEntry': await insertRemoteEntry(mutation.value); break;
      case 'updateEntry': await updateRemoteEntry(mutation.value.id, mutation.value.updates); break;
      case 'insertTag': await insertRemoteTag(mutation.value); break;
      case 'deleteTag': await deleteRemoteTag(mutation.value.id); break;
      case 'updateProfile': await updateRemoteProfile(mutation.value); break;
    }
    if (mutation.id !== undefined) await db.mutations.delete(mutation.id);
  }
}
