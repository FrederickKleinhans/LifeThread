import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickCapture } from '../components/QuickCapture';
import { EntryCard } from '../components/EntryCard';
import { useDailyFeed, useAllFeed } from '../hooks/useDailyFeed';
import { Newspaper } from 'lucide-react';
import { useThreadStore } from '../stores/threadStore';
import { getFullStats } from '../utils/gamification';
import { inferStatus } from '../utils/statusInference';
import { sessionCopy } from '../utils/sessionCopy';

export function DailyFeed() {
  const navigate = useNavigate();
  const todayFeed = useDailyFeed();
  const allFeed = useAllFeed();
  const updateThread = useThreadStore((state) => state.updateThread);
  const threads = useThreadStore((state) => state.threads);
  const entries = useThreadStore((state) => state.entries);
  const feedToShow = todayFeed.length > 0 ? todayFeed : allFeed.slice(0, 20);
  const showingAll = todayFeed.length === 0 && allFeed.length > 0;
  const knownIds = useRef<Set<string> | null>(null);
  const currentIds = new Set(feedToShow.map((item) => item.entry.id));
  const newIds = knownIds.current
    ? new Set(feedToShow.map((item) => item.entry.id).filter((entryId) => !knownIds.current?.has(entryId)))
    : new Set<string>();
  useEffect(() => {
    knownIds.current = currentIds;
  }, [feedToShow]);
  const heroCopy = useMemo(() => {
    const hasBlocked = threads.some((thread) => inferStatus(thread, entries) === 'BLOCKED');
    const streak = getFullStats(threads, entries).currentStreak;
    if (hasBlocked) return 'Something needs a little room to move forward.';
    if (streak > 0) return `${streak} day${streak === 1 ? '' : 's'} in a row. Keep the thread going.`;
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning. What is worth carrying into today?';
    if (hour >= 18) return 'A moment to notice what moved today.';
    return 'What’s happening in your life today?';
  }, [threads, entries]);
  const emptyCopy = sessionCopy('feed');

  return (
    <div className="canvas-bg -m-4 min-h-screen space-y-7 p-4 sm:-m-5 sm:p-5 md:-m-6 md:p-6">
      <section className="large-panel relative z-20 isolate overflow-hidden bg-[var(--cobalt)] px-5 py-7 text-white sm:px-8 sm:py-9 md:z-40">
        <div className="shape circ right-10 top-8 h-28 w-28 bg-[var(--butter)]" style={{ animation: 'bob 13s ease-in-out infinite' }} />
        <div className="shape pill bottom-8 right-24 h-8 w-32 bg-[var(--coral)]" style={{ animation: 'bob 15s ease-in-out infinite -3s' }} />
        <div className="relative max-w-xl">
          <div className="mb-7 flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--butter)]">A place for what matters</p>
            <span className="rounded-full border-2 border-[var(--border)] bg-white px-3 py-1 text-xs font-bold text-[var(--plum)]">
              {new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}
            </span>
          </div>
          <h2 className="max-w-lg text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
            {heroCopy}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            Capture the moments, ideas, and loose ends that have your attention.
          </p>
          <div className="mt-7 rounded-2xl border-2 border-[var(--border)] bg-white/15 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--butter)] text-[var(--plum)]" aria-hidden="true">✦</span>
              <div>
                <p className="text-sm font-semibold text-white">Capture a moment</p>
                <p className="text-xs text-white/60">A thought, a win, or whatever is on your mind.</p>
              </div>
            </div>
            <QuickCapture />
          </div>
        </div>
      </section>

      <div className="px-1">
        <p className="text-sm text-[#766e64]">
          {showingAll ? 'Recent entries across all threads' : 'Everything you touched today'}
        </p>
      </div>

      {feedToShow.length === 0 ? (
        <div className="surface-card bg-white px-5 py-16 text-center">
          <Newspaper size={42} strokeWidth={1.5} className="empty-state-icon mx-auto mb-4 text-[#c66b4b]" />
          <h3 className="text-lg font-semibold text-[#4b443c]">Start with a moment</h3>
          <p className="text-sm text-[#8d8378] mt-1">
            {emptyCopy}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
          {feedToShow.map((item) => (
            <motion.div key={item.entry.id} layout initial={newIds.has(item.entry.id) ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              <EntryCard
              key={item.entry.id}
              entry={item.entry}
              threadTitle={item.thread.title}
              thread={item.thread}
              onThreadClick={() => navigate(`/thread/${item.thread.id}`)}
              onThreadTitleUpdate={async (title) => {
                await updateThread(item.thread.id, { title });
              }}
              />
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
