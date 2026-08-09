import type { EntryType } from '../types';

const ENTRY_TYPES: { value: EntryType; label: string; color: string }[] = [
  { value: 'log', label: 'Log', color: '#6B7280' },
  { value: 'note', label: 'Note', color: '#3B82F6' },
  { value: 'blocker', label: 'Blocker', color: '#F87171' },
  { value: 'waiting', label: 'Waiting', color: '#F59E0B' },
  { value: 'decision', label: 'Decision', color: '#10B981' },
  { value: 'milestone', label: 'Milestone', color: '#8B5CF6' },
  { value: 'completed', label: 'Completed', color: '#06B6D4' },
];

interface EntryTypeSelectorProps {
  value: EntryType;
  onChange: (type: EntryType) => void;
}

export function EntryTypeSelector({ value, onChange }: EntryTypeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EntryType)}
      className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
      aria-label="Select entry type"
    >
      {ENTRY_TYPES.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}

export function getEntryTypeColor(type: EntryType): string {
  return ENTRY_TYPES.find((t) => t.value === type)?.color || '#6B7280';
}
