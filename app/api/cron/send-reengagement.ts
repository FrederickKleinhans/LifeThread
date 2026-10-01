import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  pickReengagementNotification,
  type NotificationCategory,
  type NotificationPreference,
  type NotificationHistoryItem,
  type ReengagementTrigger,
} from '../../src/lib/reengagementNotifications';
import type { Entry, Thread } from '../../src/types';

interface CronRequest {
  headers: Record<string, string | string[] | undefined>;
}

interface CronResponse {
  status: (statusCode: number) => CronResponse;
  json: (body: unknown) => void;
}

interface ProfileRow {
  id: string;
  push_subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: { p256dh: string; auth: string };
  } | null;
  notification_preferences: unknown;
  last_app_open_at: string | null;
  timezone: string | null;
}

interface HistoryRow {
  id: string;
  trigger: ReengagementTrigger;
  category: NotificationCategory;
  thread_id: string | null;
  copy: string;
  sent_at: string;
  opened_at: string | null;
}

const PAGE_SIZE = 500;

async function fetchAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data) throw new Error('The database returned an empty page response.');
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

function parsePreferences(value: unknown): NotificationPreference {
  if (typeof value !== 'object' || value === null) return DEFAULT_NOTIFICATION_PREFERENCES;
  const preference = value as Partial<NotificationPreference>;
  const readBoolean = (candidate: boolean | undefined, fallback: boolean) =>
    typeof candidate === 'boolean' ? candidate : fallback;
  return {
    enabled: readBoolean(preference.enabled, DEFAULT_NOTIFICATION_PREFERENCES.enabled),
    threadCheckIns: readBoolean(preference.threadCheckIns, DEFAULT_NOTIFICATION_PREFERENCES.threadCheckIns),
    streakMilestones: readBoolean(preference.streakMilestones, DEFAULT_NOTIFICATION_PREFERENCES.streakMilestones),
    gentlePrompts: readBoolean(preference.gentlePrompts, DEFAULT_NOTIFICATION_PREFERENCES.gentlePrompts),
  };
}

function userDayKey(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(timestamp);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function getCurrentStreak(entries: Entry[], timeZone: string, now: number): number {
  const dayNumbers = [...new Set(entries.map((entry) => {
    const key = userDayKey(new Date(entry.created_at).getTime(), timeZone);
    return Date.parse(`${key}T00:00:00Z`) / 86_400_000;
  }))].sort((a, b) => b - a);
  if (!dayNumbers.length) return 0;
  const today = Date.parse(`${userDayKey(now, timeZone)}T00:00:00Z`) / 86_400_000;
  if (today - dayNumbers[0] > 1) return 0;
  let streak = 1;
  for (let index = 1; index < dayNumbers.length && dayNumbers[index - 1] - dayNumbers[index] === 1; index += 1) {
    streak += 1;
  }
  return streak;
}

function toHistoryItem(row: HistoryRow): NotificationHistoryItem {
  return {
    trigger: row.trigger,
    category: row.category,
    threadId: row.thread_id ?? undefined,
    copy: row.copy,
    sentAt: new Date(row.sent_at).getTime(),
    opened: row.opened_at !== null,
  };
}

export default async function handler(request: CronRequest, response: CronResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization;
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    response.status(500).json({ error: 'Push delivery environment is incomplete.' });
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const profiles = await fetchAllPages<ProfileRow>((from, to) =>
      supabase.from('profiles')
        .select('id,push_subscription,notification_preferences,last_app_open_at,timezone')
        .not('push_subscription', 'is', null)
        .order('id')
        .range(from, to)
    );
    let sent = 0;
    let skipped = 0;

    for (const profile of profiles) {
      try {
      const subscription = profile.push_subscription;
      if (!subscription) {
        skipped += 1;
        continue;
      }
      const timeZone = profile.timezone || 'UTC';
      const { data: historyRows, error: historyError } = await supabase.from('notification_history')
        .select('id,trigger,category,thread_id,copy,sent_at,opened_at')
        .eq('user_id', profile.id)
        .order('sent_at', { ascending: false })
        .range(0, 49);
      if (historyError) throw historyError;
      const [threads, entries] = await Promise.all([
        fetchAllPages<Thread>((from, to) =>
          supabase.from('threads').select('*').eq('user_id', profile.id).order('id').range(from, to)
        ),
        fetchAllPages<Entry>((from, to) =>
          supabase.from('entries').select('*').eq('user_id', profile.id).order('id').range(from, to)
        ),
      ]);
      const notification = pickReengagementNotification({
        threads,
        entries,
        streak: getCurrentStreak(entries, timeZone, Date.now()),
        lastAppOpen: profile.last_app_open_at ? new Date(profile.last_app_open_at).getTime() : 0,
        history: (historyRows ?? []).map((row) => toHistoryItem(row as HistoryRow)),
        preferences: parsePreferences(profile.notification_preferences),
        timeZone,
      });
      if (!notification) {
        skipped += 1;
        continue;
      }

      const historyInsert = await supabase.from('notification_history').insert({
        user_id: profile.id,
        trigger: notification.trigger,
        category: notification.category,
        thread_id: notification.threadId ?? null,
        copy: notification.message,
      }).select('id').single();
      if (historyInsert.error || !historyInsert.data) throw historyInsert.error ?? new Error('Could not record notification history.');

      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: notification.title,
          body: notification.message,
          url: '/',
          notificationId: historyInsert.data.id,
        }), { TTL: 60 * 60 * 24 });
        sent += 1;
      } catch (error) {
        await supabase.from('notification_history').delete().eq('id', historyInsert.data.id).eq('user_id', profile.id);
        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
          ? error.statusCode
          : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('profiles').update({ push_subscription: null }).eq('id', profile.id);
        }
        skipped += 1;
      }
      } catch (error) {
        console.error('Re-engagement delivery failed for a profile.', {
          userId: profile.id,
          error: error instanceof Error ? error.message : 'Unknown delivery failure.',
        });
        skipped += 1;
      }
    }

    response.status(200).json({ sent, skipped });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Push notification batch failed.',
    });
  }
}
