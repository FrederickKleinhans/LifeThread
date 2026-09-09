/* eslint-disable react-hooks/refs */
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
  const previousIds = knownIds.current;
  const newIds = knownIds.current
    ? new Set(feedToShow.map((item) => item.entry.id).filter((entryId) => !previousIds?.has(entryId)))
    : new Set<string>();
  useEffect(() => {
    knownIds.current = new Set(feedToShow.map((item) => item.entry.id));
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
    <div className="space-y-7">
      <section className="relative z-20 isolate rounded-[2rem] bg-[#302b68] px-5 py-7 text-white shadow-[0_18px_45px_rgba(48,43,104,0.22)] sm:px-8 sm:py-9 md:z-40">
        <div className="hero-ambient-one pointer-events-none absolute -right-12 -top-16 -z-10 h-48 w-48 rounded-full bg-[#f0a36d]/80 blur-2xl" />
        <div className="hero-ambient-two pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-[#796fe0]/70 blur-3xl" />
        <div className="relative max-w-xl">
          <div className="mb-7 flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f8c49e]">A place for what matters</p>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              {new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}
            </span>
          </div>
          <h2 className="max-w-lg text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
            {heroCopy}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            Capture the moments, ideas, and loose ends that have your attention.
          </p>
          <div className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0a36d] text-[#302b68]" aria-hidden="true">✦</span>
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
        <div className="text-center py-16 px-5 rounded-2xl border border-dashed border-[#d8cdbf] bg-[#fbf9f6]/70">
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
