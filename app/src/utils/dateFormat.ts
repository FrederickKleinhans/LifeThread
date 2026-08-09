import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function friendlyDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function monthYear(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM yyyy');
}
