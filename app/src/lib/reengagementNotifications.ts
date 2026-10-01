import type { Entry, Thread } from '../types';
import { inferStatus } from '../utils/statusInference';
import { getFullStats } from '../utils/gamification';

export type ReengagementTrigger =
  | 'stale-blocked'
  | 'overdue-waiting'
  | 'dormancy'
  | 'streak-milestone'
  | 'gentle-prompt';

export type NotificationCategory = 'thread-check-ins' | 'streak-milestones' | 'gentle-prompts';

export interface NotificationPreference {
  enabled: boolean;
  threadCheckIns: boolean;
  streakMilestones: boolean;
  gentlePrompts: boolean;
}

export interface NotificationHistoryItem {
  notificationId?: string;
  trigger: ReengagementTrigger;
  category: NotificationCategory;
  threadId?: string;
  copy?: string;
  sentAt: number;
  opened: boolean;
}

export interface ReengagementNotification {
  title: string;
  message: string;
  trigger: ReengagementTrigger;
  category: NotificationCategory;
  threadId?: string;
  copy: string;
}

const STORE_KEY = 'lifethread-notification-history';
const PREFERENCES_KEY = 'lifethread-notification-preferences';
const LAST_OPEN_KEY = 'lifethread-last-app-open';

const threadCheckInCopy: Record<string, string[]> = {
  'stale-blocked': [
    'Your {thread title} thread has been stuck for a while — still blocked, or did it quietly resolve?',
    'Checking in on {thread title}. Still stuck, or good to unblock?',
    '{thread title} has been blocked for {n} days. Worth an update either way.',
  ],
  'overdue-waiting': [
    'You were waiting on something for {thread title}. Hear back yet?',
    'Still waiting on {thread title}? Worth a nudge on your end too, maybe.',
  ],
  dormancy: [
    '{thread title} went quiet after a busy stretch. Still going?',
    "Haven't heard about {thread title} in a couple weeks. Update, or is it done?",
  ],
};

const streakMilestoneCopy = [
  'One more day gets you to {milestone}.',
  '{milestone} is within reach — one more capture.',
];

const gentlePromptCopy = [
  "What's the thread doing today?",
  "Nothing's too small to add.",
  "Your threads missed you. (They can't actually miss you. But still.)",
  'Been a few days. What is new?',
];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference = {
  enabled: true,
  threadCheckIns: true,
  streakMilestones: true,
  gentlePrompts: true,
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getNotificationPreferences(): NotificationPreference {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...loadJSON<Partial<NotificationPreference>>(PREFERENCES_KEY, {}),
  };
}

export function saveNotificationPreferences(preferences: NotificationPreference) {
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function getNotificationHistory(): NotificationHistoryItem[] {
  return loadJSON<NotificationHistoryItem[]>(STORE_KEY, []).filter((item) => typeof item.sentAt === 'number');
}

function writeNotificationHistory(history: NotificationHistoryItem[]) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-50)));
}

export function markNotificationSent(notification: ReengagementNotification, notificationId?: string) {
  const history = getNotificationHistory();
  history.push({
    notificationId,
    trigger: notification.trigger,
    category: notification.category,
    threadId: notification.threadId,
    copy: notification.message,
    sentAt: Date.now(),
    opened: false,
  });
  writeNotificationHistory(history);
}

export function markNotificationOpened(notificationId: string) {
  const history = getNotificationHistory();
  const next = history.map((item) => item.notificationId === notificationId ? { ...item, opened: true } : item);
  writeNotificationHistory(next);
}

export function getLastAppOpen(): number {
  const value = Number(window.localStorage.getItem(LAST_OPEN_KEY) ?? '0');
  return Number.isFinite(value) ? value : 0;
}

export function setLastAppOpen(timestamp = Date.now()) {
  window.localStorage.setItem(LAST_OPEN_KEY, String(timestamp));
}

function localDayKey(timestamp: number, timeZone?: string) {
  const date = new Date(timestamp);
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function sameLocalDay(left: number, right: number, timeZone?: string) {
  return localDayKey(left, timeZone) === localDayKey(right, timeZone);
}

function elapsedDays(timestamp: number, now: number) {
  return Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));
}

export function hasUserOpenedToday(): boolean {
  const last = getLastAppOpen();
  if (!last) return false;
  return sameLocalDay(last, Date.now());
}

function getThreadTitleForNotification(title: string) {
  const trimmed = title.trim();
  if (trimmed.length <= 28) return trimmed;
  return `${trimmed.slice(0, 25)}…`;
}

function getCopyForTrigger(trigger: ReengagementTrigger, title: string, n?: number, milestone?: number, history = getNotificationHistory()): string {
  const threadTitle = getThreadTitleForNotification(title);
  const buckets = trigger === 'stale-blocked'
    ? threadCheckInCopy['stale-blocked']
    : trigger === 'overdue-waiting'
      ? threadCheckInCopy['overdue-waiting']
      : trigger === 'dormancy'
        ? threadCheckInCopy.dormancy
        : trigger === 'streak-milestone'
          ? streakMilestoneCopy
          : gentlePromptCopy;

  const rotationKey = `${trigger}:${title}:${Math.max(0, Math.min(999, (n ?? milestone ?? 0) % buckets.length))}`;
  const index = Math.abs(rotationKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % buckets.length;

  const previousCopy = [...history].reverse().find((item) => item.trigger === trigger)?.copy;
  const selectedIndex = buckets.length > 1 && buckets[index] === previousCopy ? (index + 1) % buckets.length : index;
  const template = buckets[selectedIndex];
  if (trigger === 'stale-blocked') {
    return template
      .replace('{thread title}', threadTitle)
      .replace('{n}', String(n ?? 0));
  }
  if (trigger === 'overdue-waiting') {
    return template.replace('{thread title}', threadTitle);
  }
  if (trigger === 'dormancy') {
    return template.replace('{thread title}', threadTitle);
  }
  if (trigger === 'streak-milestone') {
    return template.replace('{milestone}', String(milestone ?? 0));
  }
  return template;
}

function hasRecentIgnoredNotifications(history: NotificationHistoryItem[], now: number, limit = 2): boolean {
  const recent = [...history].sort((a, b) => b.sentAt - a.sentAt).slice(0, limit);
  return recent.length >= limit && recent.every((item) => !item.opened) &&
    now - recent[0].sentAt < 1000 * 60 * 60 * 24 * 2;
}

function isBlockedThread(thread: Thread, threadEntries: Entry[], now: number) {
  const status = inferStatus(thread, threadEntries);
  const latest = threadEntries[0];
  if (!latest || status !== 'BLOCKED') return false;
  return elapsedDays(new Date(latest.created_at).getTime(), now) >= 5;
}

function isWaitingThread(threadEntries: Entry[], now: number) {
  const latest = threadEntries[0];
  if (!latest || latest.type !== 'waiting') return false;
  return elapsedDays(new Date(latest.created_at).getTime(), now) >= 4;
}

function isDormantThread(thread: Thread, threadEntriesDescending: Entry[], now: number) {
  if (inferStatus(thread, threadEntriesDescending) === 'DONE') return false;
  const threadEntries = [...threadEntriesDescending].reverse();
  if (threadEntries.length < 5) return false;
  const latest = threadEntries[threadEntries.length - 1];
  if (elapsedDays(new Date(latest.created_at).getTime(), now) < 14) return false;

  let maxWindow = 0;
  for (let i = 0; i < threadEntries.length; i += 1) {
    let count = 0;
    for (let j = i; j < threadEntries.length; j += 1) {
      const delta = new Date(threadEntries[j].created_at).getTime() - new Date(threadEntries[i].created_at).getTime();
      if (delta <= 7 * 24 * 60 * 60 * 1000) {
        count += 1;
      } else {
        break;
      }
    }
    maxWindow = Math.max(maxWindow, count);
  }

  return maxWindow >= 5;
}

function getMilestoneApproach(streak: number) {
  const configured = [7, 14, 30, 60, 100];
  for (const milestone of configured) {
    if (milestone - streak === 1) return milestone;
  }

  const nextHundred = Math.ceil((streak + 1) / 100) * 100;
  if (nextHundred - streak === 1) return nextHundred;
  return null;
}

function hasSameTriggerThreadRecently(history: NotificationHistoryItem[], trigger: ReengagementTrigger, threadId: string | undefined, now: number): boolean {
  if (!threadId) return false;
  return history.some((item) => item.trigger === trigger && item.threadId === threadId && now - item.sentAt <= 1000 * 60 * 60 * 24 * 7);
}

export function pickReengagementNotification({
  threads,
  entries,
  streak,
  lastAppOpen,
  history = getNotificationHistory(),
  preferences = getNotificationPreferences(),
  timeZone,
  now = Date.now(),
}: {
  threads: Thread[];
  entries: Entry[];
  streak: number;
  lastAppOpen: number;
  history?: NotificationHistoryItem[];
  preferences?: NotificationPreference;
  timeZone?: string;
  now?: number;
}): ReengagementNotification | null {
  if (!preferences.enabled) return null;
  if (!lastAppOpen || sameLocalDay(lastAppOpen, now, timeZone)) return null;
  if (history.some((item) => sameLocalDay(item.sentAt, now, timeZone))) return null;
  if (hasRecentIgnoredNotifications(history, now)) return null;

  const activeThreads = threads.filter((thread) => !thread.archived_at && !thread.abandoned_at);
  const entriesByThread = new Map<string, Entry[]>();
  for (const entry of entries) {
    const existing = entriesByThread.get(entry.thread_id);
    if (existing) existing.push(entry);
    else entriesByThread.set(entry.thread_id, [entry]);
  }
  for (const list of entriesByThread.values()) {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const staleBlocked = activeThreads
    .find((thread) => {
      const threadEntries = entriesByThread.get(thread.id) ?? [];
      return isBlockedThread(thread, threadEntries, now) && !hasSameTriggerThreadRecently(history, 'stale-blocked', thread.id, now);
    });

  if (staleBlocked && preferences.threadCheckIns) {
    const latest = entriesByThread.get(staleBlocked.id)?.[0];
    const days = latest ? elapsedDays(new Date(latest.created_at).getTime(), now) : 0;
    return {
      title: 'Still blocked?',
      message: getCopyForTrigger('stale-blocked', staleBlocked.title, days, undefined, history),
      trigger: 'stale-blocked',
      category: 'thread-check-ins',
      threadId: staleBlocked.id,
      copy: getCopyForTrigger('stale-blocked', staleBlocked.title, days, undefined, history),
    };
  }

  const overdueWaiting = activeThreads.find((thread) => isWaitingThread(entriesByThread.get(thread.id) ?? [], now) && !hasSameTriggerThreadRecently(history, 'overdue-waiting', thread.id, now));
  if (overdueWaiting && preferences.threadCheckIns) {
    return {
      title: 'Still waiting?',
      message: getCopyForTrigger('overdue-waiting', overdueWaiting.title, undefined, undefined, history),
      trigger: 'overdue-waiting',
      category: 'thread-check-ins',
      threadId: overdueWaiting.id,
      copy: getCopyForTrigger('overdue-waiting', overdueWaiting.title, undefined, undefined, history),
    };
  }

  const dormancyCandidate = activeThreads.find((thread) => isDormantThread(thread, entriesByThread.get(thread.id) ?? [], now) && !hasSameTriggerThreadRecently(history, 'dormancy', thread.id, now));
  if (dormancyCandidate && preferences.threadCheckIns) {
    return {
      title: 'A thread went quiet',
      message: getCopyForTrigger('dormancy', dormancyCandidate.title, undefined, undefined, history),
      trigger: 'dormancy',
      category: 'thread-check-ins',
      threadId: dormancyCandidate.id,
      copy: getCopyForTrigger('dormancy', dormancyCandidate.title, undefined, undefined, history),
    };
  }

  const streakMilestone = getMilestoneApproach(streak);
  if (streakMilestone && preferences.streakMilestones && !history.some((item) => item.trigger === 'streak-milestone' && item.sentAt > now - 1000 * 60 * 60 * 24 * 2)) {
    return {
      title: 'A milestone is close',
      message: getCopyForTrigger('streak-milestone', '', 0, streakMilestone, history),
      trigger: 'streak-milestone',
      category: 'streak-milestones',
      copy: getCopyForTrigger('streak-milestone', '', 0, streakMilestone, history),
    };
  }

  const daysSinceLastOpen = elapsedDays(lastAppOpen, now);
  const hasRecentGentlePrompt = history.some((item) => item.trigger === 'gentle-prompt' && now - item.sentAt <= 1000 * 60 * 60 * 24 * 4);
  if (daysSinceLastOpen >= 3 && !hasRecentGentlePrompt && preferences.gentlePrompts) {
    const promptIndex = history.filter((item) => item.trigger === 'gentle-prompt').length % gentlePromptCopy.length;
    const previousPrompt = [...history].reverse().find((item) => item.trigger === 'gentle-prompt')?.copy;
    const message = gentlePromptCopy.length > 1 && gentlePromptCopy[promptIndex] === previousPrompt
      ? gentlePromptCopy[(promptIndex + 1) % gentlePromptCopy.length]
      : gentlePromptCopy[promptIndex];
    return {
      title: 'A LifeThread check-in',
      message,
      trigger: 'gentle-prompt',
      category: 'gentle-prompts',
      copy: message,
    };
  }

  return null;
}

export function getReadyReengagementNotification(threads: Thread[], entries: Entry[], appOpenAt = getLastAppOpen()) {
  const streak = getFullStats(threads, entries).currentStreak;
  const history = getNotificationHistory();
  const notification = pickReengagementNotification({ threads, entries, streak, lastAppOpen: appOpenAt, history });
  if (!notification) return null;
  return notification;
}
