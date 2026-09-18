import type { EntryType } from '../types';

export type EntryAnimation = 'celebrate' | 'pulse' | 'draw' | 'none';

export const ENTRY_TYPES: { value: EntryType; label: string; description: string; color: string; animation: EntryAnimation }[] = [
  { value: 'log', label: 'Log', description: 'A quick account of what happened', color: 'var(--white)', animation: 'none' },
  { value: 'note', label: 'Note', description: 'An idea or detail to remember', color: 'var(--white)', animation: 'none' },
  { value: 'blocker', label: 'Blocker', description: 'Something slowing you down', color: 'var(--coral)', animation: 'pulse' },
  { value: 'waiting', label: 'Waiting', description: 'Something dependent on another person', color: 'var(--mint)', animation: 'none' },
  { value: 'decision', label: 'Decision', description: 'A choice you made', color: 'var(--cobalt)', animation: 'none' },
  { value: 'milestone', label: 'Milestone', description: 'A meaningful step forward', color: 'var(--butter)', animation: 'celebrate' },
  { value: 'completed', label: 'Completed', description: 'Something you finished', color: 'var(--mint)', animation: 'draw' },
];

export function getEntryTypeColor(type: EntryType): string {
  return ENTRY_TYPES.find((entryType) => entryType.value === type)?.color || 'var(--white)';
}
