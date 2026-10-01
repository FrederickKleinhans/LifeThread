import { db, type Mutation, type MutationInput } from '../db';
import { useNotifications } from '../stores/notifications';
import { getMutationErrorMessage } from './mutationErrors';
import {
  deleteRemoteTag,
  insertRemoteEntry,
  insertRemoteTag,
  insertRemoteThread,
  updateRemoteEntry,
  updateRemoteTag,
  updateRemoteThread,
  updateRemoteProfile,
} from './remoteRepository';

const MAX_ATTEMPTS = 8;
const QUEUE_CHANGE_EVENT = 'lifethread-sync-queue-change';

function announceQueueChange() {
  window.dispatchEvent(new Event(QUEUE_CHANGE_EVENT));
}

export function describeMutation(mutation: Mutation): string {
  switch (mutation.kind) {
    case 'insertThread': return `Create thread "${mutation.value.title}"`;
    case 'updateThread': return `Update thread ${mutation.value.id}`;
    case 'insertEntry': return `Add entry to thread ${mutation.value.thread_id}`;
    case 'updateEntry': return `Update entry ${mutation.value.id}`;
    case 'insertTag': return `Create tag "${mutation.value.name}"`;
    case 'updateTag': return `Rename tag "${mutation.value.id}"`;
    case 'deleteTag': return `Delete tag ${mutation.value.id}`;
    case 'updateProfile': return 'Update profile';
  }
}

async function applyRemoteMutation(mutation: Mutation): Promise<void> {
  switch (mutation.kind) {
    case 'insertThread': await insertRemoteThread(mutation.value); break;
    case 'updateThread': await updateRemoteThread(mutation.value.id, mutation.value.updates); break;
    case 'insertEntry': await insertRemoteEntry(mutation.value); break;
    case 'updateEntry': await updateRemoteEntry(mutation.value.id, mutation.value.updates); break;
    case 'insertTag': await insertRemoteTag(mutation.value); break;
    case 'updateTag': await updateRemoteTag(mutation.value.id, mutation.value.updates); break;
    case 'deleteTag': await deleteRemoteTag(mutation.value.id); break;
    case 'updateProfile': await updateRemoteProfile(mutation.value); break;
  }
}

function getBackoffMs(attempts: number) {
  return Math.min(2 ** attempts * 30_000, 30 * 60_000);
}

async function moveToDeadLetter(mutation: Mutation, attempts: number, failureReason: string) {
  const metadata = { attempts, failedAt: Date.now(), failureReason };
  const failedMutation = (() => {
    switch (mutation.kind) {
      case 'insertThread': return { kind: mutation.kind, value: mutation.value, ...metadata };
      case 'updateThread': return { kind: mutation.kind, value: mutation.value, ...metadata };
      case 'insertEntry': return { kind: mutation.kind, value: mutation.value, ...metadata };
      case 'updateEntry': return { kind: mutation.kind, value: mutation.value, ...metadata };
      case 'insertTag': return { kind: mutation.kind, value: mutation.value, ...metadata };
      case 'updateTag': return { kind: mutation.kind, value: mutation.value, ...metadata };
      case 'deleteTag': return { kind: mutation.kind, value: mutation.value, ...metadata };
      case 'updateProfile': return { kind: mutation.kind, value: mutation.value, ...metadata };
    }
  })();
  await db.failedMutations.add(failedMutation);
  if (mutation.id !== undefined) await db.mutations.delete(mutation.id);
  announceQueueChange();
  useNotifications.getState().error('Some changes couldn’t sync', `${describeMutation(mutation)} needs review.`, 0);
}

async function replayOne(mutation: Mutation): Promise<boolean> {
  if (mutation.id === undefined) return false;
  const attempts = mutation.attempts ?? 0;
  if (attempts > 0 && mutation.lastAttemptAt !== undefined && Date.now() - mutation.lastAttemptAt < getBackoffMs(attempts)) {
    return false;
  }

  try {
    await applyRemoteMutation(mutation);
    await db.mutations.delete(mutation.id);
    announceQueueChange();
    return true;
  } catch (error) {
    const nextAttempts = attempts + 1;
    const lastError = getMutationErrorMessage(error);
    if (nextAttempts >= MAX_ATTEMPTS) {
      await moveToDeadLetter(mutation, nextAttempts, lastError);
    } else {
      await db.mutations.update(mutation.id, {
        attempts: nextAttempts,
        lastAttemptAt: Date.now(),
        lastError,
      });
    }
    return false;
  }
}

export async function enqueueMutation(mutation: MutationInput) {
  await db.mutations.add({ ...mutation, attempts: 0 });
  announceQueueChange();
}

export async function pendingMutationCount() {
  return db.mutations.count();
}

export async function failedMutationCount() {
  return db.failedMutations.count();
}

export async function retryFailedMutation(id: number) {
  const failed = await db.failedMutations.get(id);
  if (!failed) return;
  const mutation = (() => {
    switch (failed.kind) {
      case 'insertThread': return { kind: failed.kind, value: failed.value };
      case 'updateThread': return { kind: failed.kind, value: failed.value };
      case 'insertEntry': return { kind: failed.kind, value: failed.value };
      case 'updateEntry': return { kind: failed.kind, value: failed.value };
      case 'insertTag': return { kind: failed.kind, value: failed.value };
      case 'updateTag': return { kind: failed.kind, value: failed.value };
      case 'deleteTag': return { kind: failed.kind, value: failed.value };
      case 'updateProfile': return { kind: failed.kind, value: failed.value };
    }
  })();
  await db.mutations.add({ ...mutation, attempts: 0 });
  await db.failedMutations.delete(id);
  announceQueueChange();
}

export async function discardFailedMutation(id: number) {
  await db.failedMutations.delete(id);
  announceQueueChange();
}

export async function listFailedMutations() {
  return db.failedMutations.orderBy('failedAt').reverse().toArray();
}

export async function replayMutations(): Promise<void> {
  const queued = await db.mutations.orderBy('id').toArray();
  const threadInserts = new Map(
    queued.filter((mutation): mutation is Extract<Mutation, { kind: 'insertThread' }> => mutation.kind === 'insertThread')
      .map((mutation) => [mutation.value.id, mutation])
  );

  for (const mutation of queued) {
    if (mutation.id === undefined) continue;

    if (mutation.kind === 'insertEntry') {
      const threadId = mutation.value.thread_id;
      const dependency = threadInserts.get(threadId);
      const failedDependency = await db.failedMutations
        .where('kind').equals('insertThread')
        .filter((failed) => failed.kind === 'insertThread' && failed.value.id === threadId)
        .first();
      if (!dependency && failedDependency) {
        await moveToDeadLetter(mutation, MAX_ATTEMPTS, `Parent thread failed to sync: ${failedDependency.failureReason}`);
        continue;
      }
      if (dependency) {
        await replayOne(dependency);
        const stillQueued = dependency.id === undefined ? undefined : await db.mutations.get(dependency.id);
        if (stillQueued) continue;
        const failedAfterReplay = await db.failedMutations
          .where('kind').equals('insertThread')
          .filter((failed) => failed.kind === 'insertThread' && failed.value.id === threadId)
          .first();
        if (failedAfterReplay) {
          await moveToDeadLetter(mutation, MAX_ATTEMPTS, `Parent thread failed to sync: ${failedAfterReplay.failureReason}`);
          continue;
        }
      }
    }

    await replayOne(mutation);
  }
}

export { QUEUE_CHANGE_EVENT };
