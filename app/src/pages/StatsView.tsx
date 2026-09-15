import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useThreadStore } from '../stores/threadStore';
import { getFullStats } from '../utils/gamification';
import { Flame, Trophy, Zap, Target, TrendingUp } from 'lucide-react';

export function StatsView() {
  const threads = useThreadStore((s) => s.threads);
  const entries = useThreadStore((s) => s.entries);

  const stats = useMemo(() => getFullStats(threads, entries), [threads, entries]);

  const unlockedCount = stats.achievements.filter((a) => a.unlocked).length;
  const previousStreak = useRef(stats.currentStreak);
  const [celebrating, setCelebrating] = useState(false);
  const celebratedMilestones = useRef(new Set<number>());
  const streakMilestones = [7, 30, 100];

  useEffect(() => {
    const milestone = streakMilestones.find((value) => stats.currentStreak >= value && previousStreak.current < value && !celebratedMilestones.current.has(value));
    previousStreak.current = stats.currentStreak;
    if (milestone && !celebratedMilestones.current.has(milestone)) {
      celebratedMilestones.current.add(milestone);
      setCelebrating(true);
      const timeout = window.setTimeout(() => setCelebrating(false), 1200);
      return () => window.clearTimeout(timeout);
    }
  }, [stats.currentStreak]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c66b4b] mb-2">A little momentum</p>
        <h2 className="text-3xl font-bold text-[#27231f]">Your Progress</h2>
        <p className="text-sm text-[#766e64] mt-2">Notice what’s taking shape, one small step at a time.</p>
      </div>

      {/* Level + XP card */}
      <div className="bg-[#302b68] text-white rounded-[2rem] border border-[#4a4387] p-6 shadow-[0_18px_45px_rgba(48,43,104,0.18)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-white/60">Level {stats.level}</p>
            <h3 className="text-2xl font-bold">{stats.levelTitle}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#f8c49e]"><AnimatedNumber value={stats.totalXP} /> XP</p>
            <p className="text-xs text-white/60">{stats.xpForNextLevel - stats.totalXP} XP to next level</p>
          </div>
        </div>
        <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#f0a36d] to-[#f8c49e] rounded-full transition-all duration-500"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{stats.xpForCurrentLevel} XP</span>
          <span className="text-xs text-gray-400">{stats.xpForNextLevel} XP</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Flame size={20} className="text-orange-500" />} value={stats.currentStreak} label="Day Streak" />
        <StatCard icon={<TrendingUp size={20} className="text-emerald-500" />} value={stats.longestStreak} label="Longest Streak" />
        <StatCard icon={<Target size={20} className="text-indigo-500" />} value={stats.totalThreads} label="Threads" />
        <StatCard icon={<Zap size={20} className="text-amber-500" />} value={stats.totalEntries} label="Entries" />
      </div>
      {celebrating && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <span key={index} className="confetti-piece" style={{ left: `${8 + index * 5}%`, animationDelay: `${index * 18}ms`, backgroundColor: ['#f0a36d', '#4f46a5', '#c66b4b', '#f8c49e'][index % 4] }} />
          ))}
        </div>
      )}

      {/* Weekly XP chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">This Week</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.weeklyXP.map((day) => {
            const maxXP = Math.max(...stats.weeklyXP.map((d) => d.xp), 1);
            const height = Math.max((day.xp / maxXP) * 100, 4);
            return (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-medium">{day.xp > 0 ? day.xp : ''}</span>
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            Achievements
          </h3>
          <span className="text-sm text-gray-400">
            {unlockedCount}/{stats.achievements.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                achievement.unlocked
                  ? 'bg-white border-gray-100 shadow-sm'
                  : 'bg-gray-50 border-gray-100 opacity-50'
              }`}
            >
              <span className="text-2xl" role="img" aria-label={achievement.title}>
                {achievement.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.title}
                </p>
                <p className="text-xs text-gray-400 truncate">{achievement.description}</p>
              </div>
              {achievement.unlocked && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900"><AnimatedNumber value={value} /></p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: 'easeOut' });
    return controls.stop;
  }, [motionValue, value]);
  return <motion.span>{rounded}</motion.span>;
}
