import { differenceInDays } from 'date-fns';
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
  trigger: ReengagementTrigger;
  category: NotificationCategory;
  threadId?: string;
  sentAt: number;
  opened: boolean;
}

export interface ReengagementNotification {
  title: string;
  message: string;
  trigger: ReengagementTrigger;
  category: NotificationCategory;
  threadId?: string;
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

export function markNotificationSent(notification: ReengagementNotification) {
  const history = getNotificationHistory();
  history.push({
    trigger: notification.trigger,
    category: notification.category,
    threadId: notification.threadId,
    sentAt: Date.now(),
    opened: false,
  });
  writeNotificationHistory(history);
}

export function markNotificationsOpened() {
  const history = getNotificationHistory();
  const now = Date.now();
  const next = history.map((item) => ({ ...item, opened: item.opened || item.sentAt <= now }));
  writeNotificationHistory(next);
}

export function getLastAppOpen(): number {
  const value = Number(window.localStorage.getItem(LAST_OPEN_KEY) ?? '0');
  return Number.isFinite(value) ? value : 0;
}

export function setLastAppOpen(timestamp = Date.now()) {
  window.localStorage.setItem(LAST_OPEN_KEY, String(timestamp));
  markNotificationsOpened();
}

export function hasUserOpenedToday(): boolean {
  const last = getLastAppOpen();
  if (!last) return false;
  return differenceInDays(new Date(), new Date(last)) === 0;
}

function getThreadTitleForNotification(title: string) {
  const trimmed = title.trim();
  if (trimmed.length <= 28) return trimmed;
  return `${trimmed.slice(0, 25)}…`;
}

function getCopyForTrigger(trigger: ReengagementTrigger, title: string, n?: number, milestone?: number): string {
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

  const template = buckets[index];
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

function hasRecentIgnoredNotifications(history: NotificationHistoryItem[], limit = 2): boolean {
  const recent = history
    .filter((item) => Date.now() - item.sentAt <= 1000 * 60 * 60 * 24 * 4)
    .slice(-limit);
  return recent.filter((item) => !item.opened).length >= limit;
}

function isBlockedThread(thread: Thread, entries: Entry[]) {
  const status = inferStatus(thread, entries);
  const latest = [...entries].filter((entry) => entry.thread_id === thread.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  if (!latest || status !== 'BLOCKED') return false;
  return differenceInDays(new Date(), new Date(latest.created_at)) >= 5;
}

function isWaitingThread(thread: Thread, entries: Entry[]) {
  const threadEntries = [...entries].filter((entry) => entry.thread_id === thread.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latest = threadEntries[0];
  if (!latest || latest.type !== 'waiting') return false;
  return differenceInDays(new Date(), new Date(latest.created_at)) >= 4;
}

function isDormantThread(thread: Thread, entries: Entry[]) {
  const threadEntries = [...entries].filter((entry) => entry.thread_id === thread.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (threadEntries.length < 5) return false;
  const latest = threadEntries[threadEntries.length - 1];
  if (differenceInDays(new Date(), new Date(latest.created_at)) < 14) return false;

  let maxWindow = 0;
  for (let i = 0; i < threadEntries.length; i += 1) {
    let count = 0;
    for (let j = i; j < threadEntries.length; j += 1) {
      const delta = differenceInDays(new Date(threadEntries[j].created_at), new Date(threadEntries[i].created_at));
      if (delta <= 7) {
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

function hasSameTriggerThreadRecently(history: NotificationHistoryItem[], trigger: ReengagementTrigger, threadId?: string): boolean {
  if (!threadId) return false;
  return history.some((item) => item.trigger === trigger && item.threadId === threadId && Date.now() - item.sentAt <= 1000 * 60 * 60 * 24 * 7);
}

export function pickReengagementNotification({
  threads,
  entries,
  streak,
  lastAppOpen,
  history = getNotificationHistory(),
}: {
  threads: Thread[];
  entries: Entry[];
  streak: number;
  lastAppOpen: number;
  history?: NotificationHistoryItem[];
}): ReengagementNotification | null {
  const preferences = getNotificationPreferences();
  if (!preferences.enabled) return null;
  if (!lastAppOpen || differenceInDays(new Date(), new Date(lastAppOpen)) === 0) return null;
  if (hasRecentIgnoredNotifications(history)) return null;

  const activeThreads = threads.filter((thread) => !thread.archived_at && !thread.abandoned_at);

  const staleBlocked = activeThreads
    .map((thread) => ({ thread, status: inferStatus(thread, entries) }))
    .find(({ thread, status }) => status === 'BLOCKED' && isBlockedThread(thread, entries) && !hasSameTriggerThreadRecently(history, 'stale-blocked', thread.id));

  if (staleBlocked && preferences.threadCheckIns) {
    const days = differenceInDays(new Date(), new Date([...entries].filter((entry) => entry.thread_id === staleBlocked.thread.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at));
    const title = getCopyForTrigger('stale-blocked', staleBlocked.thread.title, days);
    return {
      title,
      message: getCopyForTrigger('stale-blocked', staleBlocked.thread.title, days),
      trigger: 'stale-blocked',
      category: 'thread-check-ins',
      threadId: staleBlocked.thread.id,
    };
  }

  const overdueWaiting = activeThreads.find((thread) => isWaitingThread(thread, entries) && !hasSameTriggerThreadRecently(history, 'overdue-waiting', thread.id));
  if (overdueWaiting && preferences.threadCheckIns) {
    const title = getCopyForTrigger('overdue-waiting', overdueWaiting.title);
    return {
      title,
      message: getCopyForTrigger('overdue-waiting', overdueWaiting.title),
      trigger: 'overdue-waiting',
      category: 'thread-check-ins',
      threadId: overdueWaiting.id,
    };
  }

  const dormancyCandidate = activeThreads.find((thread) => isDormantThread(thread, entries) && !hasSameTriggerThreadRecently(history, 'dormancy', thread.id));
  if (dormancyCandidate && preferences.threadCheckIns) {
    const title = getCopyForTrigger('dormancy', dormancyCandidate.title);
    return {
      title,
      message: getCopyForTrigger('dormancy', dormancyCandidate.title),
      trigger: 'dormancy',
      category: 'thread-check-ins',
      threadId: dormancyCandidate.id,
    };
  }

  const streakMilestone = getMilestoneApproach(streak);
  if (streakMilestone && preferences.streakMilestones && !history.some((item) => item.trigger === 'streak-milestone' && item.sentAt > Date.now() - 1000 * 60 * 60 * 24 * 2)) {
    const title = getCopyForTrigger('streak-milestone', '', 0, streakMilestone);
    return {
      title,
      message: getCopyForTrigger('streak-milestone', '', 0, streakMilestone),
      trigger: 'streak-milestone',
      category: 'streak-milestones',
    };
  }

  const daysSinceLastOpen = differenceInDays(new Date(), new Date(lastAppOpen));
  const hasRecentGentlePrompt = history.some((item) => item.trigger === 'gentle-prompt' && Date.now() - item.sentAt <= 1000 * 60 * 60 * 24 * 4);
  if (daysSinceLastOpen >= 3 && !hasRecentGentlePrompt && preferences.gentlePrompts) {
    const title = gentlePromptCopy[history.filter((item) => item.trigger === 'gentle-prompt').length % gentlePromptCopy.length];
    return {
      title,
      message: title,
      trigger: 'gentle-prompt',
      category: 'gentle-prompts',
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
