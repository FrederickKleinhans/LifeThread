import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import type { FailedMutation } from '../db';
import {
  describeMutation,
  discardFailedMutation,
  listFailedMutations,
  QUEUE_CHANGE_EVENT,
  replayMutations,
  retryFailedMutation,
} from '../lib/mutationQueue';
import { useNotifications } from '../stores/notifications';
import { getMutationErrorMessage } from '../lib/mutationErrors';

export function SyncReview() {
  const [failed, setFailed] = useState<FailedMutation[]>([]);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const reportError = useNotifications((state) => state.error);
  const refresh = useCallback(() => {
    void listFailedMutations().then(setFailed);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(QUEUE_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(QUEUE_CHANGE_EVENT, refresh);
  }, [refresh]);

  const retry = async (id: number) => {
    setWorkingId(id);
    try {
      await retryFailedMutation(id);
      await replayMutations();
      refresh();
    } catch (error) {
      reportError('Could not retry change', getMutationErrorMessage(error), 0);
    } finally {
      setWorkingId(null);
    }
  };

  const discard = async (id: number) => {
    setWorkingId(id);
    try {
      await discardFailedMutation(id);
      refresh();
    } catch (error) {
      reportError('Could not discard change', getMutationErrorMessage(error), 0);
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Sync review</p>
        <h2 className="text-3xl font-bold text-[var(--ink)]">Changes to review</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">These changes could not be synced after several attempts. Retry them or discard them.</p>
      </header>

      {failed.length === 0 ? (
        <div className="surface-card bg-white p-6 text-sm text-[var(--ink-muted)]">There are no failed changes to review.</div>
      ) : (
        <ul className="space-y-3">
          {failed.map((mutation) => (
            <li key={mutation.id} className="surface-card flex flex-col gap-4 bg-white p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                  <AlertTriangle size={17} className="shrink-0 text-[var(--coral)]" />
                  <span>{describeMutation(mutation)}</span>
                </div>
                <p className="mt-2 break-words text-sm text-[var(--ink-muted)]">{mutation.failureReason}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{mutation.attempts} failed attempts</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={workingId === mutation.id}
                  onClick={() => mutation.id !== undefined && void retry(mutation.id)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--cobalt)] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <RefreshCw size={14} /> Retry
                </button>
                <button
                  type="button"
                  disabled={workingId === mutation.id}
                  onClick={() => mutation.id !== undefined && void discard(mutation.id)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--ink)] disabled:opacity-50"
                >
                  <Trash2 size={14} /> Discard
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
