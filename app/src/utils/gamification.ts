import type { Thread, Entry } from '../types';
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';

// XP rewards per action
const XP_VALUES = {
  thread_created: 20,
  entry_log: 5,
  entry_note: 8,
  entry_decision: 15,
  entry_milestone: 25,
  entry_completed: 30,
  entry_blocker: 5,
  entry_waiting: 5,
  entry_attachment: 10,
};

// Level thresholds (XP needed to reach each level)
const LEVELS = [
  { level: 1, xp: 0, title: 'Seedling' },
  { level: 2, xp: 50, title: 'Sprout' },
  { level: 3, xp: 150, title: 'Sapling' },
  { level: 4, xp: 350, title: 'Growing' },
  { level: 5, xp: 600, title: 'Branching' },
  { level: 6, xp: 1000, title: 'Thriving' },
  { level: 7, xp: 1500, title: 'Flourishing' },
  { level: 8, xp: 2200, title: 'Rooted' },
  { level: 9, xp: 3000, title: 'Evergreen' },
  { level: 10, xp: 4000, title: 'Ancient Oak' },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface GamificationStats {
  totalXP: number;
  level: number;
  levelTitle: string;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  totalThreads: number;
  totalEntries: number;
  completedThreads: number;
  achievements: Achievement[];
  weeklyXP: { day: string; xp: number }[];
}

export function calculateXP(threads: Thread[], entries: Entry[]): number {
  let xp = 0;
  xp += threads.length * XP_VALUES.thread_created;
  for (const entry of entries) {
    const key = `entry_${entry.type}` as keyof typeof XP_VALUES;
    xp += XP_VALUES[key] || 5;
  }
  return xp;
}

export function getLevel(xp: number): { level: number; title: string; xpForCurrent: number; xpForNext: number; progress: number } {
  let current = LEVELS[0];
  let next = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || { level: current.level + 1, xp: current.xp + 1500, title: 'Legendary' };
      break;
    }
  }

  const xpIntoLevel = xp - current.xp;
  const xpNeeded = next.xp - current.xp;
  const progress = Math.min((xpIntoLevel / xpNeeded) * 100, 100);

  return {
    level: current.level,
    title: current.title,
    xpForCurrent: current.xp,
    xpForNext: next.xp,
    progress,
  };
}

export function calculateStreak(entries: Entry[]): { current: number; longest: number } {
  if (entries.length === 0) return { current: 0, longest: 0 };

  // Get unique days that have entries
  const days = new Set<string>();
  for (const entry of entries) {
    days.add(format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd'));
  }

  const sortedDays = [...days].sort().reverse();
  if (sortedDays.length === 0) return { current: 0, longest: 0 };

  // Calculate current streak (from today going backwards)
  let currentStreak = 0;
  // Allow for today or yesterday to count as the start
  const mostRecent = sortedDays[0];
  const daysSinceLastEntry = differenceInCalendarDays(new Date(), new Date(mostRecent));
  if (daysSinceLastEntry > 1) {
    currentStreak = 0;
  } else {
    let checkDate = new Date(mostRecent);
    for (let i = 0; i < 365; i++) {
      const dayStr = format(startOfDay(checkDate), 'yyyy-MM-dd');
      if (days.has(dayStr)) {
        currentStreak++;
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  const allDaysSorted = [...days].sort();
  let longest = 0;
  let streak = 1;

  for (let i = 1; i < allDaysSorted.length; i++) {
    const diff = differenceInCalendarDays(new Date(allDaysSorted[i]), new Date(allDaysSorted[i - 1]));
    if (diff === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak);

  return { current: currentStreak, longest };
}

export function getWeeklyXP(entries: Entry[]): { day: string; xp: number }[] {
  const result: { day: string; xp: number }[] = [];
  const today = startOfDay(new Date());

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStr = format(date, 'yyyy-MM-dd');
    const label = format(date, 'EEE');

    let dayXP = 0;
    for (const entry of entries) {
      const entryDay = format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd');
      if (entryDay === dayStr) {
        const key = `entry_${entry.type}` as keyof typeof XP_VALUES;
        dayXP += XP_VALUES[key] || 5;
      }
    }

    result.push({ day: label, xp: dayXP });
  }

  return result;
}

export function evaluateAchievements(threads: Thread[], entries: Entry[]): Achievement[] {
  const completedCount = entries.filter((e) => e.type === 'completed').length;
  const decisionCount = entries.filter((e) => e.type === 'decision').length;
  const milestoneCount = entries.filter((e) => e.type === 'milestone').length;
  const { longest } = calculateStreak(entries);
  const totalXP = calculateXP(threads, entries);

  const achievements: Achievement[] = [
    {
      id: 'first_thread',
      title: 'First Thread',
      description: 'Create your first thread',
      icon: '🌱',
      unlocked: threads.length >= 1,
    },
    {
      id: 'five_threads',
      title: 'Thread Weaver',
      description: 'Create 5 threads',
      icon: '🧵',
      unlocked: threads.length >= 5,
    },
    {
      id: 'ten_threads',
      title: 'Master Weaver',
      description: 'Create 10 threads',
      icon: '🕸️',
      unlocked: threads.length >= 10,
    },
    {
      id: 'first_complete',
      title: 'Finisher',
      description: 'Complete your first thread',
      icon: '✅',
      unlocked: completedCount >= 1,
    },
    {
      id: 'five_complete',
      title: 'Closer',
      description: 'Complete 5 threads',
      icon: '🏁',
      unlocked: completedCount >= 5,
    },
    {
      id: 'decision_maker',
      title: 'Decision Maker',
      description: 'Log 3 decisions',
      icon: '⚖️',
      unlocked: decisionCount >= 3,
    },
    {
      id: 'milestone_hunter',
      title: 'Milestone Hunter',
      description: 'Reach 5 milestones',
      icon: '🏔️',
      unlocked: milestoneCount >= 5,
    },
    {
      id: 'streak_3',
      title: 'On a Roll',
      description: '3-day activity streak',
      icon: '🔥',
      unlocked: longest >= 3,
    },
    {
      id: 'streak_7',
      title: 'Weekly Warrior',
      description: '7-day activity streak',
      icon: '⚡',
      unlocked: longest >= 7,
    },
    {
      id: 'streak_30',
      title: 'Monthly Master',
      description: '30-day activity streak',
      icon: '💎',
      unlocked: longest >= 30,
    },
    {
      id: 'prolific',
      title: 'Prolific',
      description: 'Log 50 entries',
      icon: '📝',
      unlocked: entries.length >= 50,
    },
    {
      id: 'centurion',
      title: 'Centurion',
      description: 'Log 100 entries',
      icon: '💯',
      unlocked: entries.length >= 100,
    },
    {
      id: 'xp_500',
      title: 'Rising Star',
      description: 'Earn 500 XP',
      icon: '⭐',
      unlocked: totalXP >= 500,
    },
    {
      id: 'xp_2000',
      title: 'Powerhouse',
      description: 'Earn 2000 XP',
      icon: '🚀',
      unlocked: totalXP >= 2000,
    },
  ];

  return achievements;
}

export function getFullStats(threads: Thread[], entries: Entry[]): GamificationStats {
  const totalXP = calculateXP(threads, entries);
  const levelInfo = getLevel(totalXP);
  const { current: currentStreak, longest: longestStreak } = calculateStreak(entries);
  const achievements = evaluateAchievements(threads, entries);
  const weeklyXP = getWeeklyXP(entries);
  const completedThreads = entries.filter((e) => e.type === 'completed').length;

  return {
    totalXP,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    xpForCurrentLevel: levelInfo.xpForCurrent,
    xpForNextLevel: levelInfo.xpForNext,
    progressPercent: levelInfo.progress,
    currentStreak,
    longestStreak,
    totalThreads: threads.length,
    totalEntries: entries.length,
    completedThreads,
    achievements,
    weeklyXP,
  };
}
