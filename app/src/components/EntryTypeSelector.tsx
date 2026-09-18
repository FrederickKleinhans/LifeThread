import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { EntryType } from '../types';
import { ENTRY_TYPES } from './entryTypes';

interface EntryTypeSelectorProps {
  value: EntryType;
  onChange: (type: EntryType) => void;
}

export function EntryTypeSelector({ value, onChange }: EntryTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = ENTRY_TYPES.find((type) => type.value === value) ?? ENTRY_TYPES[0];

  return (
    <div className="relative w-full sm:w-44">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`physical flex h-full min-h-12 w-full items-center gap-2 rounded-xl border-2 border-[var(--border)] px-3 py-2.5 text-left ${
          open
            ? 'border-[#8f89ca] bg-[#fffaf3] ring-2 ring-[#d9d5f3]'
            : 'border-[#d8cdbf] bg-[#fff2df] hover:border-[#b9aec2]'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select entry type"
      >
        <span className="entry-badge" style={{ backgroundColor: selected.color, color: selected.color === 'var(--coral)' || selected.color === 'var(--cobalt)' ? 'var(--white)' : 'var(--plum)' }}>{selected.label}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#766e64]">{selected.label}</span>
          <span className="block truncate text-[10px] text-[#9a9186]">{selected.description}</span>
        </span>
        <ChevronDown size={16} className={`flex-shrink-0 text-[#9a9186] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-30 mt-2 max-h-64 w-72 overflow-y-auto rounded-2xl border-2 border-[var(--border)] bg-white p-1.5 shadow-[4px_4px_0_var(--border)]"
          role="listbox"
          aria-label="Choose an entry type"
        >
          {ENTRY_TYPES.map((type) => {
            const isSelected = type.value === value;
            return (
              <button
                key={type.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(type.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isSelected ? 'bg-[#ebe9f8]' : 'hover:bg-[#f1ece5]'
                }`}
              >
                <span className="entry-badge" style={{ backgroundColor: type.color, color: type.color === 'var(--coral)' || type.color === 'var(--cobalt)' ? 'var(--white)' : 'var(--plum)' }}>{type.label}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#4b443c]">{type.label}</span>
                  <span className="block truncate text-xs text-[#9a9186]">{type.description}</span>
                </span>
                {isSelected && <Check size={16} className="text-[#4f46a5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
