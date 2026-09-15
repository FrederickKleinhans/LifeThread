import type { EntryType } from '../types';

export type EntryAnimation = 'celebrate' | 'pulse' | 'draw' | 'none';

export const ENTRY_TYPES: { value: EntryType; label: string; description: string; color: string; animation: EntryAnimation }[] = [
  { value: 'log', label: 'Log', description: 'A quick account of what happened', color: '#6B7280', animation: 'none' },
  { value: 'note', label: 'Note', description: 'An idea or detail to remember', color: '#3B82F6', animation: 'none' },
  { value: 'blocker', label: 'Blocker', description: 'Something slowing you down', color: '#F87171', animation: 'pulse' },
  { value: 'waiting', label: 'Waiting', description: 'Something dependent on another person', color: '#F59E0B', animation: 'none' },
  { value: 'decision', label: 'Decision', description: 'A choice you made', color: '#10B981', animation: 'none' },
  { value: 'milestone', label: 'Milestone', description: 'A meaningful step forward', color: '#8B5CF6', animation: 'celebrate' },
  { value: 'completed', label: 'Completed', description: 'Something you finished', color: '#06B6D4', animation: 'draw' },
];

export function getEntryTypeColor(type: EntryType): string {
  return ENTRY_TYPES.find((entryType) => entryType.value === type)?.color || '#6B7280';
}
