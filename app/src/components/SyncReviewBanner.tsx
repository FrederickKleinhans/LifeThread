import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { failedMutationCount, QUEUE_CHANGE_EVENT } from '../lib/mutationQueue';

export function SyncReviewBanner() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void failedMutationCount().then((nextCount) => {
        if (mounted) setCount(nextCount);
      });
    };
    refresh();
    window.addEventListener(QUEUE_CHANGE_EVENT, refresh);
    return () => {
      mounted = false;
      window.removeEventListener(QUEUE_CHANGE_EVENT, refresh);
    };
  }, []);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[60] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border-2 border-[var(--coral)] bg-[var(--bg-surface)] px-4 py-3 text-[var(--ink)] shadow-[4px_4px_0_var(--border)] md:bottom-5">
      <AlertTriangle size={18} className="shrink-0 text-[var(--coral)]" />
      <p className="min-w-0 flex-1 text-sm font-semibold">Some changes couldn’t sync.</p>
      <button
        type="button"
        onClick={() => navigate('/sync-review')}
        className="shrink-0 rounded-lg bg-[var(--coral)] px-3 py-2 text-xs font-bold text-[var(--plum)]"
      >
        Review {count}
      </button>
    </div>
  );
}
