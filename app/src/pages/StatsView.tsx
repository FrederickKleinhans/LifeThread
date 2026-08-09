import { useMemo } from 'react';
import { useThreadStore } from '../stores/threadStore';
import { getFullStats } from '../utils/gamification';
import { Flame, Trophy, Zap, Target, TrendingUp } from 'lucide-react';

export function StatsView() {
  const threads = useThreadStore((s) => s.threads);
  const entries = useThreadStore((s) => s.entries);

  const stats = useMemo(() => getFullStats(threads, entries), [threads, entries]);

  const unlockedCount = stats.achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
        <p className="text-sm text-gray-500 mt-1">Track your journey and unlock achievements</p>
      </div>

      {/* Level + XP card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Level {stats.level}</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.levelTitle}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{stats.totalXP} XP</p>
            <p className="text-xs text-gray-400">{stats.xpForNextLevel - stats.totalXP} XP to next level</p>
          </div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
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
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}
